#!/usr/bin/env python3
"""One-time, additive registration of Frame by Frame on the inspected VPS.

Run with sudo after reviewing this file. No existing app container is replaced.
The matching GitHub Actions secret must already be staged as animator.secret.
"""
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request

APP = 'animator'
BASE = Path(__file__).resolve().parent
ETC = Path('/etc/deploy-manager')
REPO = Path('/opt/frame-by-frame/app')
ORIGIN = 'https://github.com/YesterdaysLemon/frame-by-frame.git'
HOST = 'animator.alirezaafshan.com'
SECRET_KEY = 'ANIMATOR_DEPLOY_WEBHOOK_SECRET'

def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout.strip()

def fetch_topology():
    with urllib.request.urlopen('http://127.0.0.1:9019/api/topology', timeout=10) as r:
        return json.load(r)

def idle():
    state = fetch_topology()
    if state.get('activeDeployments') or state.get('queuedDeployments'):
        raise RuntimeError('Deploy Manager is busy. Retry after its current release finishes.')

def env_value(text, key):
    match = re.search(r'^' + re.escape(key) + r'=(.*)$', text, re.M)
    return match.group(1).strip().strip('\"\'') if match else None

def env_set(text, key, value):
    line = key + '=' + value
    if re.search(r'^' + re.escape(key) + r'=', text, re.M):
        return re.sub(r'^' + re.escape(key) + r'=.*$', lambda _: line, text, flags=re.M)
    return text.rstrip() + '\n' + line + '\n'

def atomic(path, data, mode):
    path = Path(path)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.animator-', delete=False) as f:
        temporary = Path(f.name)
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.chmod(temporary, mode)
    os.replace(temporary, path)

def main():
    if os.geteuid() != 0:
        raise RuntimeError('Run this reviewed setup script with sudo.')
    idle()
    for unit in ['deploy-manager', 'caddy']:
        if run('systemctl', 'is-active', unit) != 'active':
            raise RuntimeError(unit + ' must already be healthy.')
    if not Path('/usr/local/sbin/deploy-app-run').is_file():
        raise RuntimeError('The existing deployment wrapper is missing.')
    secret_path = BASE / 'animator.secret'
    secret = secret_path.read_text().strip()
    if not re.fullmatch(r'[a-f0-9]{64}', secret):
        raise RuntimeError('Missing or invalid staged webhook secret.')
    apps_path = ETC / 'apps.json'
    apps = json.loads(apps_path.read_text())
    if APP in apps['apps']:
        raise RuntimeError('Animator is already registered; refusing to replace its configuration.')
    listeners = run('ss', '-H', '-ltn')
    for port in [3090, 3091]:
        if re.search(r':' + str(port) + r'\s', listeners):
            raise RuntimeError('Port ' + str(port) + ' is now in use.')
    for file in (ETC / 'apps').glob('*.env'):
        text = file.read_text()
        if any(env_value(text, key) in ['3090', '3091'] for key in ['APP_PORT', 'CANDIDATE_APP_PORT']):
            raise RuntimeError('Another app has reserved the proposed ports: ' + file.name)
    for name in ['frame-by-frame', 'frame-by-frame-candidate']:
        if run('docker', 'ps', '-aq', '--filter', 'name=^/' + name + '$'):
            raise RuntimeError('Container name already exists: ' + name)
    patch = json.loads((BASE / 'apps.json').read_text())
    entry = patch['apps'][APP]
    if set(patch['apps']) != {APP} or entry['repo'] != 'YesterdaysLemon/frame-by-frame' or entry['secretEnv'] != SECRET_KEY:
        raise RuntimeError('Unexpected app patch.')
    apps['apps'][APP] = entry
    manager_path = ETC / 'deploy-manager.env'
    manager_text = manager_path.read_text()
    current_topology = Path(env_value(manager_text, 'DEPLOY_MANAGER_PUBLIC_TOPOLOGY_FILE') or '/opt/deploy-manager-current/config/public-topology.json')
    topology = json.loads(current_topology.read_text())
    route = json.loads((BASE / 'public-topology.json').read_text())['routes'][0]
    if route['id'] != APP or route['hostname'] != HOST or route['port'] != 3090:
        raise RuntimeError('Unexpected public route patch.')
    if any(r.get('id') == APP or r.get('hostname') == HOST for r in topology['routes']):
        raise RuntimeError('A matching public route already exists.')
    if any(r.get('plot') == route.get('plot') for r in topology['routes'] + topology.get('datastores', [])):
        raise RuntimeError('Proposed city plot is already occupied.')
    topology['routes'].append(route)
    topology['auditedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    manager_text = env_set(manager_text, SECRET_KEY, secret)
    manager_text = env_set(manager_text, 'DEPLOY_MANAGER_PUBLIC_TOPOLOGY_FILE', str(ETC / 'public-topology.json'))
    caddy_path = Path('/etc/caddy/Caddyfile')
    caddy = caddy_path.read_text()
    if HOST in caddy:
        raise RuntimeError('Caddy already contains this hostname.')
    caddy += '\n# BEGIN FRAME BY FRAME\n' + HOST + ' {\n\treverse_proxy 127.0.0.1:3090\n}\n# END FRAME BY FRAME\n'
    app_env = (BASE / 'apps/animator.env').read_text()
    expected = {'APP_ID': APP, 'REPO_DIR': str(REPO), 'REPO_USER': 'deploy-manager', 'BRANCH': 'main', 'IMAGE_NAME': 'frame-by-frame', 'CONTAINER_NAME': 'frame-by-frame', 'CANDIDATE_CONTAINER_NAME': 'frame-by-frame-candidate', 'APP_PORT': '3090', 'CANDIDATE_APP_PORT': '3091', 'CONTAINER_PORT': '3000', 'HEALTH_PATH': '/healthz', 'LOG_FILE': '/var/log/deploy-manager/animator.log'}
    parsed = {line.split('=', 1)[0]: env_value(app_env, line.split('=', 1)[0]) for line in app_env.splitlines() if line and not line.startswith('#')}
    if parsed != expected:
        raise RuntimeError('Unexpected runtime settings.')
    # Regenerate shell assignments from validated values instead of sourcing input.
    app_env = ''.join(key + "='" + value + "'\n" for key, value in expected.items())
    sudoers_path = Path('/etc/sudoers.d/deploy-manager-animator')
    if sudoers_path.exists():
        raise RuntimeError('Animator sudoers fragment already exists.')
    sudoers = 'deploy-manager ALL=(root) NOPASSWD: /usr/local/sbin/deploy-app-run animator *\n'
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = Path('/var/backups/deploy-manager') / ('animator-' + stamp)
    backup.mkdir(parents=True, mode=0o700)
    os.chmod(backup, 0o700)
    candidate = backup / 'Caddyfile.proposed'
    candidate.write_text(caddy)
    run('caddy', 'validate', '--config', str(candidate), '--adapter', 'caddyfile')
    proposed_sudoers = backup / 'sudoers.proposed'
    proposed_sudoers.write_text(sudoers)
    run('visudo', '-cf', str(proposed_sudoers))
    # Only create a dedicated new checkout. Never reset another working copy.
    if REPO.exists():
        if run('sudo', '-u', 'deploy-manager', '-H', 'git', '-C', str(REPO), 'remote', 'get-url', 'origin') != ORIGIN or run('sudo', '-u', 'deploy-manager', '-H', 'git', '-C', str(REPO), 'status', '--porcelain'):
            raise RuntimeError('Existing checkout is not a clean animator checkout.')
    else:
        run('install', '-d', '-o', 'deploy-manager', '-g', 'deploy-manager', '/opt/frame-by-frame')
        run('sudo', '-u', 'deploy-manager', '-H', 'git', 'clone', '--branch', 'main', ORIGIN, str(REPO))
    updates = {
        apps_path: (json.dumps(apps, indent=2) + '\n', 0o644),
        ETC / 'apps/animator.env': (app_env, 0o644),
        manager_path: (manager_text, 0o600),
        ETC / 'public-topology.json': (json.dumps(topology, indent=2) + '\n', 0o644),
        caddy_path: (caddy, 0o644),
        sudoers_path: (sudoers, 0o440),
    }
    originals = {}
    for index, path in enumerate(updates):
        originals[path] = (path.read_bytes(), path.stat().st_mode & 0o777) if path.exists() else None
        if path.exists():
            shutil.copy2(path, backup / (str(index) + '-' + path.name))
    (backup / 'paths.json').write_text(json.dumps([str(p) for p in updates], indent=2))
    try:
        idle()
        for path, (text, mode) in updates.items():
            atomic(path, text.encode(), mode)
        idle()
        run('systemctl', 'restart', 'deploy-manager')
        for _ in range(30):
            try:
                state = fetch_topology()
                if any(app['id'] == APP for app in state['apps']):
                    break
            except Exception:
                pass
            time.sleep(1)
        else:
            raise RuntimeError('Manager did not load the new app.')
        run('systemctl', 'reload', 'caddy')
    except BaseException:
        for path, original in originals.items():
            if original is None:
                path.unlink(missing_ok=True)
            else:
                atomic(path, *original)
        run('systemctl', 'restart', 'deploy-manager')
        run('systemctl', 'reload', 'caddy')
        raise
    secret_path.unlink()
    print('Animator registered. Existing application containers were not changed.')
    print('Configuration backup: ' + str(backup))
    print('Ready for the signed GitHub Actions release to https://' + HOST + '/')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid printing subprocess input/output that could contain environment data.
        print('Setup stopped: ' + (str(error) if not isinstance(error, subprocess.CalledProcessError) else 'A preflight or service command failed. No secret values were logged.'))
        raise SystemExit(1)
