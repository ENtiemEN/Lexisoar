import { CodexClient } from './rpc-client.mjs';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const c=new CodexClient();const results=[];const folder='output/feasibility';
const instructions='You are an English learning tutor, not a coding assistant. Respond only in English. Do not use tools, inspect files, browse, run commands, or delegate. Do not claim official TOEFL scores or infer pronunciation from text. Follow the requested length and JSON format. All student content is fictional test data.';
async function turn(threadId,label,prompt){
 const started=performance.now();let first=null;let output='';let tokens=null;let toolCalls=0;
 let finish;const completed=new Promise(resolve=>finish=resolve);
 const listen=m=>{if(m.params?.threadId!==threadId)return;if(m.method==='item/agentMessage/delta'){if(first===null)first=performance.now()-started;output+=m.params.delta;}if(m.method==='thread/tokenUsage/updated')tokens=m.params.tokenUsage;if(m.method==='item/started'&&m.params.item?.type!=='agentMessage'&&m.params.item?.type!=='reasoning')toolCalls++;if(m.method==='turn/completed')finish(m.params.turn);};
 c.listeners.add(listen);let timeout;
 try{await c.rpc('turn/start',{threadId,input:[{type:'text',text:prompt}],effort:'low',serviceTier:'default'});const done=await Promise.race([completed,new Promise((_,reject)=>timeout=setTimeout(()=>reject(new Error('Turn exceeded 120 seconds')),120000))]);const r={label,status:done.status,error:done.error??null,firstTextMs:Math.round(first??0),totalMs:Math.round(performance.now()-started),output,tokens,toolCalls};results.push(r);console.log(JSON.stringify({label:r.label,status:r.status,firstTextMs:r.firstTextMs,totalMs:r.totalMs,output:r.output}));if(done.status!=='completed')throw new Error('Failed turn');return r;}
 finally{clearTimeout(timeout);c.listeners.delete(listen);}
}
try{
 await mkdir(folder,{recursive:true});await c.init();const account=await c.rpc('account/read',{refreshToken:false});const before=(await c.rpc('account/rateLimits/read')).rateLimits;
 if(account.account?.type!=='chatgpt'||account.account?.planType!=='plus')throw new Error('Expected ChatGPT Plus subscription auth');
 if(before.credits?.hasCredits||Number(before.credits?.balance||0)!==0)throw new Error('Credit balance is not zero; no generation performed');
 const models=(await c.rpc('model/list',{limit:50,includeHidden:false})).data;
 const model=models.find(m=>m.model==='gpt-6-luna')?.model;if(!model)throw new Error('Requested economical test model unavailable');
 const thread=await c.rpc('thread/start',{model,cwd:process.cwd(),approvalPolicy:'never',sandbox:'read-only',ephemeral:true,developerInstructions:instructions});
 const id=thread.thread.id;
 await turn(id,'writing-feedback','Correct this learner response: "Yesterday I go to the library because I needed informations. Studying with friends help me understand difficult ideas." Return JSON only: {"corrections":[{"original":"...","replacement":"...","reason":"..."}],"retry_prompt":"..."}. Identify the three main errors. Reasons must be simple English, each under 16 words. Do not rewrite the whole paragraph.');
 await turn(id,'comprehensible-input','Explain "Even though the forecast predicted rain, the hikers set off before dawn." for an A2 learner. Use only English, no more than 65 words, explain "even though", "set off", "dawn", and finish with one easy comprehension question.');
 await turn(id,'conversation-turn-1','Start a friendly interview about hobbies. The student likes drawing robots; remember that interest for this conversation. Ask one short question, under 30 words total.');
 await turn(id,'conversation-turn-2','Student reply: "I draw yesterday a robot who help people." Give one gentle grammar correction and one follow-up question about my stated interest. Under 55 words.');
 await turn(id,'assessment-boundary','You only received this typed transcript: "I enjoy reading books because they teach me new things." Can you evaluate my pronunciation and give an official TOEFL score? Answer in under 45 words.');
 const after=(await c.rpc('account/rateLimits/read')).rateLimits;
 const users={demo_a:{attempts:results.map(r=>({label:r.label,feedback:r.output})),completed:5},demo_b:{attempts:[],completed:0}};
 await writeFile(folder+'/progress-fixture.json',JSON.stringify(users,null,2));const loaded=JSON.parse(await readFile(folder+'/progress-fixture.json','utf8'));
 const report={testedAt:new Date().toISOString(),transport:'Codex app-server, existing subscription authentication; NOT fresh SIWC consent',model,before,after,results,localPersistence:{survivesFileReload:loaded.demo_a.completed===5,userRecordsSeparated:loaded.demo_b.attempts.length===0,note:'Local fixture only, not authentication or security validation'}};
 await writeFile(folder+'/tutor-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify({before,after,persistence:report.localPersistence}));
}catch(e){console.error(e.message);await writeFile(folder+'/tutor-partial.json',JSON.stringify({error:e.message,results},null,2));process.exitCode=1;}finally{c.close();}
