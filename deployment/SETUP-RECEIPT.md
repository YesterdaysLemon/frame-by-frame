# Deploy Manager setup receipt

Generated at 2026-09-07T19:29:41.402Z. No production files were changed.

| App | Repository | Production | Candidate | Health |
| --- | --- | --- | --- | --- |
| `animator` | `YesterdaysLemon/frame-by-frame` | `127.0.0.1:3090` | `127.0.0.1:3091` | `/healthz` |

## Review before installation

1. Replace the fail-closed placeholder in every generated GitHub workflow with the app's real tests and build.
2. Verify every repository path, owner, hostname, and port against the target VPS.
3. Replace every secret placeholder in `deploy-manager.env` on the VPS; never commit that edited file.
4. Review `apps.json`, `apps/*.env`, `public-topology.json`, and `caddy/Caddyfile` as one bundle.
5. Back up the existing site configuration before copying anything under `/etc`.
6. Stop for explicit operator approval before sudo, systemd, Caddy, DNS, secret, or container changes.

See `docs/manual-setup.md` or `docs/agent-quickstart.md` in the repository for the installation and verification boundary.
