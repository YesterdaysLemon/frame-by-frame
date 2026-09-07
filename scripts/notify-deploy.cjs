const crypto=require('node:crypto');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const secret=process.env.DEPLOY_WEBHOOK_SECRET,url=process.env.DEPLOY_WEBHOOK_URL,sha=process.env.GITHUB_SHA;
 if(!secret||!url||!sha)throw Error('Deployment secret, URL and SHA are required.');
 const webhook=new URL(url);if(webhook.protocol!=='https:')throw Error('Deploy webhook must use HTTPS.');
 const payload=JSON.stringify({event:'push',branch:process.env.GITHUB_REF_NAME,repo:process.env.GITHUB_REPOSITORY,sha});
 const response=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json','X-GitHub-Event':'push','X-Hub-Signature-256':'sha256='+crypto.createHmac('sha256',secret).update(payload).digest('hex')},body:payload,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Deploy Manager rejected the request: HTTP '+response.status);
 const accepted=await response.json();if(!accepted.job?.id||!accepted.receipt)throw Error('Missing deployment receipt.');
 const receipt=new URL(accepted.receipt,webhook.origin);if(receipt.origin!==webhook.origin||!receipt.pathname.startsWith('/api/releases/'))throw Error('Unexpected receipt URL.');
 console.log('Deploy Manager job: '+accepted.job.id);let last;
 for(let i=0;i<600;i++){
  const r=await fetch(receipt,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Receipt HTTP '+r.status);const {job}=await r.json();const status=job?.status;
  if(status!==last){console.log('Release status: '+status);last=status}
  if(['failed','rolled-back','interrupted'].includes(status))throw Error('Deployment ended: '+status);
  if(status==='succeeded'){
   const live=await fetch('https://animator.alirezaafshan.com/healthz',{signal:AbortSignal.timeout(20000)});const health=await live.json();if(!live.ok||!health.ok||health.sha!==sha)throw Error('Public HTTPS release SHA did not match the requested commit.');
   console.log('Verified public release '+sha+' at https://animator.alirezaafshan.com/');return;
  }
  await sleep(2000);
 }
 throw Error('Deployment did not finish within 20 minutes.');
})().catch(e=>{console.error(e.message);process.exit(1)});
