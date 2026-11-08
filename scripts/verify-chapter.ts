// Full HTTP-handler integration check in an in-memory learning store, with the existing authorized plan.
// Only fictional test responses are sent. No user attempts are read or written.
import {buildApp} from '../server/app';
import {Store} from '../server/store';
import {blankDraft} from '../shared/chapters';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const started=Date.now(),app=await buildApp({root:'.local',store:new Store(':memory:'),port:4190});
try{
 const initial=await app.inject({url:'/api/session',headers:{host:'127.0.0.1:4190'}});const account=initial.json();if(!account.chatgpt)throw Error('No ChatGPT plan connection is available.');
 const headers={host:'127.0.0.1:4190',origin:'http://127.0.0.1:4190',cookie:String(initial.headers['set-cookie']).split(';')[0],'x-csrf-token':account.csrf};
 async function request(path:string,body?:any,method:'GET'|'POST'|'PATCH'=body?'POST':'GET'){const r=await app.inject({url:'/api/'+path,method,headers,payload:body});if(r.statusCode!==200)throw Error(`Chapter check failed at ${path}: ${r.json().error}`);return r.json();}
 const models=await request('models');let snapshot=await request('study-sessions',{chapterId:'quiet-city'});let run=snapshot.run;run.state.consent=true;run.state.model=models.selected;run=(await request('study-sessions/'+run.id,{revision:run.revision,state:run.state},'PATCH')).run;
 const checks:any[]=[];
 for(let i=0;i<4;i++){
  const scene=run.chapter.scenes[i],draft=blankDraft();
  if(scene.questions)draft.choices=Object.fromEntries(scene.questions.map((q:any)=>[q.id,q.answer]));
  else{draft.source=i===2?'speech':'typed';draft.text=i===2?'i think the council should try again because maya liked the quieter street and jon said access was difficult the notice says buses can still use the street i suggest better signs for shops':'Dear Transport Team, I recommend another trial on Mill Street. Maya enjoyed the quieter street, but Jon reported problems with access to shops. The notice says you will compare traffic counts nearby. Please put clearer signs near the shops and compare traffic on both roads. This would help you decide whether the benefits come at a cost to another street. Thank you for considering this suggestion. Best wishes, A resident.';}
  snapshot=await request('study-sessions/'+run.id+'/attempts',{id:randomUUID(),revision:run.revision,sceneId:scene.id,draft});run=snapshot.run;
  if(!scene.questions){const before=Date.now();const feedback=await request('attempts/'+snapshot.attempt.id+'/feedback',{planOnlyConfirmed:true});if(feedback.status!=='complete')throw Error(feedback.error??'Feedback did not complete.');const cached=await request('attempts/'+snapshot.attempt.id+'/feedback',{planOnlyConfirmed:true});if(JSON.stringify(cached)!==JSON.stringify(feedback))throw Error('Feedback cache did not preserve the response.');checks.push({skill:scene.skill,source:draft.source,totalMs:Date.now()-before,cached:true,...feedback});}
  run.state.sceneIndex++;run=(await request('study-sessions/'+run.id,{revision:run.revision,state:run.state},'PATCH')).run;
 }
 for(const v of run.chapter.vocabulary)run=(await request('study-sessions/'+run.id+'/review',{revision:run.revision,word:v.word,rating:3})).run;
 run.state.status='completed';run=(await request('study-sessions/'+run.id,{revision:run.revision,state:run.state},'PATCH')).run;
 const final=await request('study-sessions/'+run.id);if(final.attempts.length!==4||run.state.status!=='completed')throw Error('Full chapter was not preserved.');
 const result={date:new Date().toISOString(),kind:'real-provider-through-full-chapter-handlers',model:models.selected,totalMs:Date.now()-started,status:run.state.status,attempts:final.attempts.length,reviewedWords:Object.keys(run.state.review),checks,notes:'Isolated in-memory learning data. Fictional reading/listening answers, spoken transcript and email. No real microphone; no personal attempts transmitted. Two real feedback generations; repeat requests reused cached feedback.'};
 await mkdir('output/verification',{recursive:true});await writeFile('output/verification/v02-real-chapter.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(e){console.error((e as Error).message);process.exitCode=1;}finally{await app.close();}
