const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),out=path.join(root,'dist');
const files=['index.html','classic.css','rig.js','editor.js','builder.js','startup.js','library.js','presets.js','robots.txt','sitemap.xml','site.webmanifest'];
function revision(){
 if(/^[a-f0-9]{40}$/.test(process.env.BUILD_SHA||''))return process.env.BUILD_SHA;
 const head=fs.readFileSync(path.join(root,'.git','HEAD'),'utf8').trim();if(/^[a-f0-9]{40}$/.test(head))return head;
 const ref=head.replace(/^ref: /,'');if(!/^refs\/[a-zA-Z0-9/_-]+$/.test(ref))throw Error('Invalid Git ref');
 const loose=path.join(root,'.git',ref);if(fs.existsSync(loose))return fs.readFileSync(loose,'utf8').trim();
 const packed=fs.readFileSync(path.join(root,'.git','packed-refs'),'utf8').split('\n').find(line=>line.endsWith(' '+ref));if(packed)return packed.split(' ')[0];throw Error('Release SHA unavailable');
}
fs.mkdirSync(out,{recursive:true});for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const sha=revision();if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid release SHA');
const hashes={};for(const file of files)hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex');
fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({app:'frame-by-frame',sha,builtAt:new Date().toISOString(),files:hashes},null,2)+'\n');console.log('Built Frame by Frame release '+sha);
