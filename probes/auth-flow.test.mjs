import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('repeated sign-in resumes OAuth instead of trapping the user; rejects forged callbacks',async()=>{
 const p=spawn(process.execPath,['probes/local-lab.mjs'],{env:{...process.env,ENGLISH_LAB_PORT:'4179'},stdio:['ignore','pipe','pipe']});
 const watchdog=setTimeout(()=>p.kill(),15000);
 try{
  await Promise.race([once(p.stdout,'data'),once(p,'exit').then(()=>{throw Error('Lab failed to start');})]);
  const origin='http://127.0.0.1:4179';
  const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/Connect your ChatGPT plan/);
  assert.equal((await fetch(origin+'/conversation')).status,401);
  assert.equal((await fetch(origin+'/models')).status,401);
  assert.equal((await fetch(origin+'/conversation.js')).status,200);
  const first=await fetch(origin+'/auth/start',{redirect:'manual'});assert.equal(first.status,302);
  const url=new URL(first.headers.get('location'));assert.equal(url.origin,'https://auth.openai.com');assert.equal(url.searchParams.get('redirect_uri'),origin+'/auth/callback');assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  const second=await fetch(origin+'/auth/start',{redirect:'manual'});assert.equal(second.status,302);assert.equal(second.headers.get('location'),first.headers.get('location'));
  const status=await(await fetch(origin+'/status')).json();assert.equal(status.phase,'awaiting_authorization');assert.equal(status.authorizationUrl,undefined);
  const forged=await fetch(origin+'/auth/callback?state=wrong&code=fake');assert.equal(forged.status,400);
  const rejected=await fetch(origin+'/auth/callback?'+new URLSearchParams({state:url.searchParams.get('state'),error:'access_denied'}));assert.equal(rejected.status,200);
  const retry=await fetch(origin+'/auth/start',{redirect:'manual'});assert.equal(retry.status,302);assert.notEqual(new URL(retry.headers.get('location')).searchParams.get('state'),url.searchParams.get('state'));
 }finally{clearTimeout(watchdog);p.kill();}
});
