// Explicit real integration check. Uses only a fictional response, never user conversations.
import {ChatGPT} from '../server/chatgpt';
import {generateTaskFeedback} from '../server/task-feedback';
import {cityChapter} from '../shared/chapters';
import {chooseModel} from '../probes/tutor-service.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const started=Date.now();
try{
 const chat=new ChatGPT('.local','http://127.0.0.1:4180');const token=await chat.token('device');
 const response=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Cannot read the authorized model catalog.');
 const catalog=chooseModel(await response.json());const feedback=await generateTaskFeedback({scene:cityChapter.scenes[2],source:'speech',answer:'i think the city should try again because maya liked the quiet street but jon said customers had problems i suggest better signs',previous:'i like the quiet street'},token.access_token,catalog.selected,AbortSignal.timeout(90000));
 const result={date:new Date().toISOString(),kind:'real-provider-with-fictional-test-response',chapter:cityChapter.id,scene:'your-view',model:catalog.selected,totalMs:Date.now()-started,feedback,structuredValidationPassed:true,notes:'Uses the authorized personal ChatGPT plan. No API key. This is not an acoustic pronunciation test or a human judgment of pedagogical quality.'};
 await mkdir('output/verification',{recursive:true});await writeFile('output/verification/v02-real-feedback.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(e){console.error('Real feedback check: '+(e as Error).message);process.exitCode=1;}
