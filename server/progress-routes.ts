import {z} from 'zod';
import type {StudyOptions} from './study-routes';
import type {StudyStore} from './study-store';
import {AssessmentStore,responseHash} from './assessment-store';
import {buildProgressSummary,historyItems,resolveAttempts,makeRange,dayKey} from './progress-summary';
import {RUBRIC_VERSION} from '../shared/progress';
import {generateTaskFeedback} from './task-feedback';
import {chooseModel} from '../probes/tutor-service.mjs';
export function progressRoutes({app,store,chat,session,busy,feedbackProvider,studies,assessments}:{studies:StudyStore;assessments:AssessmentStore}&StudyOptions){
 const rangeSchema=z.object({period:z.enum(['7','28','90','all']).default('28'),timeZone:z.string().max(100).default('UTC')});
 function query(input:unknown){const q=rangeSchema.parse(input);try{new Intl.DateTimeFormat('en-US',{timeZone:q.timeZone}).format();}catch{throw Error('Choose a valid time zone.');}return q;}
 app.get('/api/progress/summary',(req,reply)=>{const owner=session(req,reply).owner,q=query(req.query);return buildProgressSummary({events:store.list(owner),runs:studies.list(owner),assessments:assessments.list(owner),...q});});
 app.get('/api/progress/history',(req,reply)=>{
  const owner=session(req,reply).owner,q=query(req.query),filters=z.object({view:z.enum(['responses','chapters','recordings']).default('responses'),skill:z.enum(['All','Reading','Listening','Speaking','Writing']).default('All'),page:z.coerce.number().int().min(1).max(10000).default(1)}).parse(req.query);
  const events=store.list(owner),runs=studies.list(owner),records=assessments.list(owner),range=makeRange(q.period,q.timeZone,events,new Date());
  let items=historyItems(events,runs,records,filters.view).filter(item=>{const d=dayKey(new Date(item.date),q.timeZone);return (q.period==='all'||d>=range.start)&&d<=range.end&&(filters.view!=='responses'||filters.skill==='All'||item.skill===filters.skill);}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const total=items.length;items=items.slice((filters.page-1)*20,filters.page*20);
  for(const item of items){if(item.kind==='responses'){item.feedback=studies.feedback(owner,item.id)?.feedback??null;item.assessment=assessments.get(owner,item.id);}}
  return {items,total,page:filters.page,pageSize:20};
 });
 app.post('/api/progress/assessments',async(req,reply)=>{
  const owner=session(req,reply).owner,input=z.object({attemptId:z.uuid(),planOnlyConfirmed:z.literal(true),retry:z.boolean().default(false),model:z.string().max(120).optional()}).parse(req.body);
  const attempt=resolveAttempts(store.list(owner),studies.list(owner),assessments.list(owner)).find(a=>a.event.id===input.attemptId);
  if(!attempt)throw Object.assign(Error('Response not found.'),{statusCode:404});if(!attempt.canAssess)throw Error('This response has an objective check, or cannot support tutor observations.');
  const cached=assessments.get(owner,input.attemptId);if(cached?.sourceHash===responseHash(attempt.event.data.answer)&&(cached.status==='complete'||cached.status==='pending'||!input.retry))return cached;
  if(busy.has(owner))return reply.code(409).send({error:'Another tutor request is running. Wait for it to finish before assessing this response.'});
  busy.add(owner);assessments.put(owner,{attemptId:input.attemptId,rubricVersion:RUBRIC_VERSION,model:input.model??'account-default',status:'pending',observations:[],sourceHash:responseHash(attempt.event.data.answer),origin:'requested',createdAt:new Date().toISOString()});
  try{
   const scene=attempt.scene??{id:attempt.activity.id,skill:attempt.activity.skill,label:attempt.activity.title,objective:attempt.activity.explanation,instruction:attempt.activity.prompt,activity:attempt.activity};
   const context={scene,answer:attempt.event.data.answer,source:attempt.event.data.source};let feedback,model='test-provider';
   if(feedbackProvider)feedback=await feedbackProvider(context);else{const token=await chat.token(owner),r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Cannot load models. Reconnect ChatGPT in Settings.');const catalog=chooseModel(await r.json());model=input.model??catalog.selected;if(!catalog.models.some((m:any)=>m.id===model))throw Error('Select an available model.');feedback=await generateTaskFeedback(context,token.access_token,model,AbortSignal.timeout(90000));}
   return assessments.fromFeedback(owner,attempt.event,feedback,model,'requested');
  }catch(error){const failed={attemptId:input.attemptId,rubricVersion:RUBRIC_VERSION,model:input.model??'account-default',status:'failed' as const,observations:[],sourceHash:responseHash(attempt.event.data.answer),origin:'requested' as const,createdAt:new Date().toISOString(),error:(error as Error).message};assessments.put(owner,failed);return failed;}finally{busy.delete(owner);}
 });
}
