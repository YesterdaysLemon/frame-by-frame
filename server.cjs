const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.env.STATIC_ROOT||__dirname,port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const files=new Set(['index.html','classic.css','rig.js','editor.js','builder.js','startup.js','library.js','presets.js','robots.txt','sitemap.xml','site.webmanifest','build.json']);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
let build={app:'frame-by-frame',sha:'development'};try{build=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8'))}catch{}
const ready=['index.html','classic.css','rig.js','editor.js','builder.js','library.js','presets.js','startup.js'].every(file=>fs.existsSync(path.join(root,file)))&&(process.env.NODE_ENV!=='production'||/^[a-f0-9]{40}$/.test(build.sha));
http.createServer((req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end('Method not allowed')}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/healthz'){res.writeHead(ready?200:503,{'Content-Type':'application/json'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({ok:ready,app:'frame-by-frame',sha:build.sha}))}
  const name=pathname==='/'?'index.html':pathname==='/favicon.ico'?'assets/favicon.ico':pathname.slice(1);
  if(!files.has(name)&&!/^assets\/[a-zA-Z0-9_-]+\.(svg|png|ico)$/.test(name)){res.writeHead(404);return res.end(req.method==='HEAD'?undefined:'Not found')}
  fs.readFile(path.join(root,name),(err,data)=>{res.writeHead(err?404:200,{'Content-Type':err?'text/plain':mime[path.extname(name)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:err?'Not found':data)});
 }catch{res.writeHead(400);res.end('Bad request')}
}).listen(port,host,()=>console.log(`Frame by Frame: http://${host}:${port} (${build.sha})`));
