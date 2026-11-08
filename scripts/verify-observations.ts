// Optional real-provider check. One fictional response, no personal history and no saved progress.
import {ChatGPT} from '../server/chatgpt';
import {generateTaskFeedback} from '../server/task-feedback';
import {cityChapter} from '../shared/chapters';
import {chooseModel} from '../probes/tutor-service.mjs';
import {validatedObservations} from '../server/assessment-validation';
import {mkdir,writeFile} from 'node:fs/promises';
const started=Date.now();
try{
 const chat=new ChatGPT('.local','http://127.0.0.1:4180'),token=await chat.token('device');
 const response=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Cannot read the authorized model catalog.');const catalog=chooseModel(await response.json());
 const answer='i think the city should repeat the trial because maya enjoyed the quieter street but jon said customers had trouble finding his shop the notice says buses can still use the street i would add clearer signs and compare traffic on both roads';
 const feedback=await generateTaskFeedback({scene:cityChapter.scenes[2],answer,source:'speech'},token.access_token,catalog.selected,AbortSignal.timeout(90000));
 if(!validatedObservations(feedback.observations,answer,'speech'))throw Error('Written feedback was generated, but valid structured observations were not returned.');
 const result={date:new Date().toISOString(),kind:'real-provider-fictional-response-only',rubricVersion:'stride-criteria-1',model:catalog.selected,totalMs:Date.now()-started,feedback,notes:'No personal history read or transmitted. No stored attempts modified. Literal evidence and five distinct criteria validated; this is not independent validation of the tutor judgments.'};await mkdir('output/verification',{recursive:true});await writeFile('output/verification/v03-real-observations.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(e){console.error((e as Error).message);process.exitCode=1;}
