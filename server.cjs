const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json', '.md':'text/plain; charset=utf-8'};

http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, {Allow: 'GET, HEAD'});
    return res.end('Method not allowed');
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Never expose Git metadata, dotfiles, or paths outside this app.
    if (pathname.split(/[\\/]/).some(part => part.startsWith('.'))) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      res.writeHead(err ? 404 : 200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
      res.end(req.method === 'HEAD' ? undefined : err ? 'Not found' : data);
    });
  } catch {
    res.writeHead(400);
    res.end('Bad request');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local playground: http://127.0.0.1:${port}`));
