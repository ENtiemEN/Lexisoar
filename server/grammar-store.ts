import {randomUUID} from 'node:crypto';
import {createEmptyCard,fsrs,type Card,Rating} from 'ts-fsrs';
import type {Store} from './store';
import {grammarTopics} from '../shared/grammar-catalog';
import {grammarAnswer,type GrammarSession,type GrammarStep,type GrammarResponse,type GrammarReview,type GrammarAssistance,type GrammarSummary,type GrammarObjective} from '../shared/grammar';
import {dayKey,shiftDay} from './progress-summary';
export type GrammarData={sessions:Record<string,GrammarSession>;cards:Record<string,any>;reviews:GrammarReview[];assistance:Record<string,GrammarAssistance>};
export const grammarCardKey=(objective:GrammarObjective)=>`${objective.id}/${objective.version}`;
const conflict=()=>Object.assign(Error('This round changed in another tab. Reload to recover its latest saved state.'),{statusCode:409});
export class GrammarStore{
 constructor(public store:Store){store.raw.exec('CREATE TABLE IF NOT EXISTS grammar_workspace(owner TEXT PRIMARY KEY,data TEXT NOT NULL)');}
 read(owner:string):GrammarData{const r=this.store.raw.prepare('SELECT data FROM grammar_workspace WHERE owner=?').get(owner) as {data:string}|undefined;return r?JSON.parse(r.data):{sessions:{},cards:{},reviews:[],assistance:{}};}
 save(owner:string,d:GrammarData){this.store.raw.prepare('INSERT INTO grammar_workspace(owner,data) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner,JSON.stringify(d));}
 mutate<T>(owner:string,fn:(d:GrammarData)=>T){return this.store.raw.transaction(()=>{const d=this.read(owner),result=fn(d);this.save(owner,d);return result;})();}
 get(d:GrammarData,id:string){if(!Object.hasOwn(d.sessions,id))throw Object.assign(Error('Grammar round not found.'),{statusCode:404});return d.sessions[id];}
 pending(owner:string){return Object.values(this.read(owner).sessions).filter(s=>s.status!=='completed').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 create(owner:string,input:{id:string;mode:GrammarSession['mode'];topicIds:string[];limit:number}){return this.mutate(owner,d=>{
  const requestSignature=JSON.stringify([input.mode,[...new Set(input.topicIds)].sort(),input.limit]);if(d.sessions[input.id]){if(d.sessions[input.id].requestSignature!==requestSignature)throw Error('This round identity was already used for different settings.');return d.sessions[input.id];}
  const topics=grammarTopics.filter(t=>input.topicIds.includes(t.id));if(input.mode!=='review'&&(!topics.length||topics.length!==new Set(input.topicIds).size))throw Error('Choose available grammar topics.');
  if(input.mode==='learn'&&topics.length!==1)throw Error('Choose one topic for a lesson.');
  const now=new Date().toISOString(),s:GrammarSession={id:input.id,requestSignature,revision:0,mode:input.mode,createdAt:now,updatedAt:now,status:'active',index:0,steps:[],draft:'',blockIds:[],helped:false,responses:[]};
  const history=Object.values(d.sessions).flatMap(s=>s.responses),uses=(id:string)=>history.filter(r=>r.exerciseId===id).length;
  if(input.mode==='learn'){
   const topic=topics[0];s.steps.push({kind:'observe',topic});
   for(const objective of topic.objectives){const exerciseIndices=objective.id===topic.objectives[0].id?[0,3]:[7,8];for(const i of exerciseIndices)s.steps.push({kind:'task',topic,objectiveId:objective.id,exerciseId:topic.exercises[i].id});if(!d.cards[grammarCardKey(objective)])s.steps.push({kind:'rate',topic,objectiveId:objective.id});}
   s.steps.push({kind:'production',topic});
  }else if(input.mode==='train'){
   const candidates=topics.flatMap(topic=>topic.exercises.map(ex=>({topic,ex}))).sort((a,b)=>uses(a.ex.id)-uses(b.ex.id)||a.topic.order-b.topic.order||a.ex.id.localeCompare(b.ex.id));
   // Round-robin across chosen topics, retaining unseen-first ordering within each topic.
   const queues=topics.map(t=>candidates.filter(c=>c.topic.id===t.id)),ordered:typeof candidates=[];while(queues.some(q=>q.length)){for(const q of queues){const next=q.shift();if(next)ordered.push(next);}}
   ordered.sort((a,b)=>(uses(a.ex.id)===0?0:1)-(uses(b.ex.id)===0?0:1));
   for(const {topic,ex} of ordered.slice(0,input.limit))s.steps.push({kind:'task',topic,objectiveId:ex.objectiveId,exerciseId:ex.id});
   s.steps.push({kind:'production',topic:s.steps[0].topic});
  }else{
   const due=grammarTopics.flatMap(topic=>topic.objectives.map(objective=>({topic,objective,card:d.cards[grammarCardKey(objective)]}))).filter(x=>x.card&&Date.parse(x.card.due)<=Date.now()).sort((a,b)=>Date.parse(a.card.due)-Date.parse(b.card.due)).slice(0,input.limit);
   for(const {topic,objective} of due){const ex=topic.exercises.filter(e=>e.objectiveId===objective.id).sort((a,b)=>uses(a.id)-uses(b.id)||a.id.localeCompare(b.id))[0];s.steps.push({kind:'task',topic,objectiveId:objective.id,exerciseId:ex.id},{kind:'rate',topic,objectiveId:objective.id});}
   if(!s.steps.length)throw Error('No grammar objectives are due yet. Explore a lesson or practise freely in Train.');
  }
  d.sessions[s.id]=s;return s;
 });}
 advance(s:GrammarSession){s.index++;s.draft='';s.blockIds=[];s.helped=false;if(s.index>=s.steps.length)s.status='completed';this.touch(s);return s;}
 touch(s:GrammarSession){s.revision++;s.updatedAt=new Date().toISOString();}
 patch(owner:string,input:{id:string;revision:number;draft?:string;blockIds?:string[];helped?:true;action?:'next'|'pause'|'resume'|'finish'}){return this.mutate(owner,d=>{
  const s=this.get(d,input.id);if(s.revision!==input.revision)throw conflict();if(s.status==='completed')throw Error('This round is already finished.');
  const step=s.steps[s.index];if(input.action==='next'){
   if(step.kind==='task'&&!s.responses.some(r=>r.step===s.index))throw Error('Check your response before continuing.');
   if(step.kind==='rate')throw Error('Rate your recall before continuing.');if(step.kind==='production')throw Error('Save or skip the optional writing step.');return this.advance(s);
  }
  if(input.draft!==undefined)s.draft=input.draft;if(input.blockIds!==undefined)s.blockIds=input.blockIds;if(input.helped&&!s.responses.some(r=>r.step===s.index))s.helped=true;
  if(input.action==='pause')s.status='paused';if(input.action==='resume')s.status='active';if(input.action==='finish')s.status='completed';this.touch(s);return s;
 });}
 respond(owner:string,input:{id:string;sessionId:string;revision:number;answer:string;blockIds:string[]}){return this.mutate(owner,d=>{
  const existing=Object.values(d.sessions).flatMap(s=>s.responses.map(r=>({r,s}))).find(x=>x.r.id===input.id);if(existing){if(existing.s.id!==input.sessionId||JSON.stringify(existing.r.blockIds)!==JSON.stringify(input.blockIds)||(existing.s.steps[existing.r.step].topic.exercises.find(e=>e.id===existing.r.exerciseId)?.format!=='build'&&existing.r.answer!==input.answer))throw Error('This response identity is already used.');return {session:existing.s,response:existing.r};}
  const s=this.get(d,input.sessionId);if(s.revision!==input.revision)throw conflict();if(s.status==='completed')throw Error('This round is finished.');const step=s.steps[s.index];if(!['task','production'].includes(step.kind))throw Error('A response is not available on this step.');if(s.responses.some(r=>r.step===s.index))throw Error('This response was already checked. Continue to the next step.');
  const ex=step.topic.exercises.find(e=>e.id===step.exerciseId);if(step.kind==='task'&&!ex)throw Error('Exercise not found.');if(ex&&ex.format!=='build'&&!input.answer.trim())throw Error('Enter a response first.');if(ex?.format==='meaning'&&!ex.options?.includes(input.answer))throw Error('Choose one of the situations.');
  const checked=ex?grammarAnswer(ex,input.answer,input.blockIds):{answer:input.answer,correct:null};const objective=step.topic.objectives.find(o=>o.id===step.objectiveId);
  const response:GrammarResponse={id:input.id,step:s.index,exerciseId:step.exerciseId,objectiveId:step.objectiveId,objectiveVersion:objective?.version,topicId:step.topic.id,topicVersion:step.topic.version,answer:checked.answer,blockIds:input.blockIds,correct:checked.correct,helped:s.helped,retry:!!step.retry,createdAt:new Date().toISOString()};s.responses.push(response);s.draft=input.answer;s.blockIds=input.blockIds;
  if(checked.correct===false&&!step.retry)s.steps.push({...step,retry:true});
  if(step.kind==='production')this.advance(s);else this.touch(s);return {session:s,response};
 });}
 rate(owner:string,input:{id:string;sessionId:string;revision:number;rating:number}){return this.mutate(owner,d=>{
  const prior=d.reviews.find(r=>r.id===input.id);if(prior){if(prior.sessionId!==input.sessionId||prior.rating!==input.rating)throw Error('This rating identity is already used.');return this.get(d,input.sessionId);}
  const s=this.get(d,input.sessionId);if(s.revision!==input.revision)throw conflict();if(s.status==='completed')throw Error('This round is finished.');const step=s.steps[s.index];if(step.kind!=='rate'||s.mode==='train'||step.retry)throw Error('This step does not schedule a grammar review.');
  const objective=step.topic.objectives.find(o=>o.id===step.objectiveId)!;const key=grammarCardKey(objective),raw=d.cards[key],scheduled=s.mode==='review'||!raw;
  if(scheduled){const card:Card=raw?{...raw,due:new Date(raw.due),last_review:raw.last_review?new Date(raw.last_review):undefined}:createEmptyCard();d.cards[key]=fsrs().repeat(card,new Date())[input.rating as Rating.Again|Rating.Hard|Rating.Good|Rating.Easy].card;}
  d.reviews.push({id:input.id,sessionId:s.id,step:s.index,rating:input.rating,objectiveId:objective.id,version:objective.version,createdAt:new Date().toISOString(),scheduled});return this.advance(s);
 });}
 progress(owner:string,period='28',timeZone='UTC',page=1):GrammarSummary{
  const d=this.read(owner),now=new Date(),end=dayKey(now,timeZone),all=Object.values(d.sessions).flatMap(s=>s.responses.map(response=>({s,response}))),dates=all.map(x=>dayKey(new Date(x.response.createdAt),timeZone)).sort(),start=period==='all'?(dates[0]??end):shiftDay(end,-Number(period)+1);
  const inside=(date:string)=>{const key=dayKey(new Date(date),timeZone);return key>=start&&key<=end;};const selected=all.filter(x=>inside(x.response.createdAt)),independent=selected.filter(x=>x.s.mode!=='learn'&&!x.response.helped&&!x.response.retry&&x.response.correct!==null);
  const cards=grammarTopics.flatMap(t=>t.objectives).map(o=>d.cards[grammarCardKey(o)]).filter(Boolean),future=cards.map(c=>c.due as string).filter(date=>Date.parse(date)>now.getTime()).sort();
  const topics=grammarTopics.map(t=>{const r=selected.filter(x=>x.response.topicId===t.id),metric=(mode:string)=>{const a=independent.filter(x=>x.response.topicId===t.id&&x.response.topicVersion===t.version&&t.objectives.some(o=>o.id===x.response.objectiveId&&o.version===x.response.objectiveVersion)&&x.s.mode===mode);return {correct:a.filter(x=>x.response.correct).length,total:a.length};};return {id:t.id,title:t.title,practice:r.filter(x=>x.response.correct!==null&&!x.response.retry).length,train:metric('train'),review:metric('review')};});
  const patterns=grammarTopics.flatMap(t=>t.objectives.flatMap(o=>{
   const relevant=independent.filter(x=>x.response.objectiveId===o.id&&x.response.objectiveVersion===o.version&&x.response.topicVersion===t.version),errors=relevant.filter(x=>x.response.correct===false);if(!errors.length)return [];
   const activities=new Set(errors.map(x=>x.response.exerciseId)).size,sessions=new Set(errors.map(x=>x.s.id)).size;
   return [{objectiveId:o.id,version:o.version,title:o.title,topicId:t.id,count:errors.length,opportunities:relevant.length,activities,sessions,recurrent:activities>=3&&sessions>=2,examples:errors.slice(-3).map(({response,s})=>{const ex=s.steps[response.step].topic.exercises.find(e=>e.id===response.exerciseId)!;return {answer:response.answer,expected:ex.alreadyValid?'Already valid':ex.answers.join(' / '),date:response.createdAt};})}];
  })).sort((a,b)=>Number(b.recurrent)-Number(a.recurrent)||b.count-a.count).slice(0,3);
  const history=selected.sort((a,b)=>b.response.createdAt.localeCompare(a.response.createdAt)).map(({s,response})=>({sessionId:s.id,mode:s.mode,topic:s.steps[response.step].topic.title,response,drafts:Object.values(d.assistance).filter(a=>a.sessionId===s.id&&a.step===response.step&&a.feedback).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)),feedback:Object.values(d.assistance).filter(a=>a.sessionId===s.id&&a.step===response.step&&a.answer===response.answer&&a.feedback).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0]?.feedback}));
  const ratings=[0,0,0,0];for(const r of d.reviews)if(inside(r.createdAt))ratings[r.rating-1]++;
  return {range:{period,timeZone,start,end},due:cards.filter(c=>Date.parse(c.due)<=now.getTime()).length,nextDue:future[0]??null,practice:independent.length,guided:selected.filter(x=>x.s.mode==='learn'&&x.response.correct!==null&&!x.response.retry).length,helped:selected.filter(x=>x.response.helped&&x.response.correct!==null&&!x.response.retry).length,retries:selected.filter(x=>x.response.retry).length,ratings,topics,patterns,history:history.slice((page-1)*20,page*20),totalHistory:history.length,page};
 }
}
