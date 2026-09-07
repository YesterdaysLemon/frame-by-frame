const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:3173';
(async()=>{
 let ready;for(let i=0;i<30;i++){try{ready=await fetch(base+'/healthz');if(ready.ok)break}catch{}await new Promise(r=>setTimeout(r,1000))}assert(ready?.ok,'App readiness');
 const health=await ready.json();assert.equal(health.app,'frame-by-frame');assert.equal(health.ok,true);if(process.env.EXPECTED_SHA)assert.equal(health.sha,process.env.EXPECTED_SHA,'Exact release SHA');
 for(const [url,type]of [['/','text/html'],['/rig.js','javascript'],['/builder.js','javascript'],['/assets/favicon.svg','image/svg+xml'],['/assets/favicon.ico','image/x-icon'],['/assets/apple-touch-icon.png','image/png'],['/assets/social-preview.png','image/png'],['/site.webmanifest','manifest+json'],['/robots.txt','text/plain'],['/sitemap.xml','xml'],['/build.json','application/json']]){const r=await fetch(base+url);assert.equal(r.status,200,url);assert(r.headers.get('content-type').includes(type),url+' MIME');const body=await r.text();if(url==='/'){assert(body.includes('https://animator.alirezaafshan.com/'));assert(body.includes('application/ld+json'))}}
 for(const url of ['/deployment/setup-vps.py','/server.cjs','/package.json','/.git/config','/missing'])assert.equal((await fetch(base+url)).status,404,url+' must not be exposed');
 assert.equal((await fetch(base+'/',{method:'POST'})).status,405);const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 console.log('HTTP smoke checks passed: readiness, release SHA, assets, metadata, private-file exclusions and methods.');
})().catch(e=>{console.error(e.message);process.exit(1)});
