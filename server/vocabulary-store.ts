import {randomUUID} from 'node:crypto';
import {createEmptyCard,fsrs,type Card,Rating} from 'ts-fsrs';
import type {Store} from './store.js';
import {activities} from '../shared/content.js';
import {chapters} from '../shared/chapters.js';
import {vocabularyCatalog} from '../shared/vocabulary-catalog.js';
import {correctWord,type Direction,type VocabEntry,type VocabWord,type VocabSession,type VocabResult,type VocabSummary,type VocabFeedback} from '../shared/vocabulary.js';
export type VocabularyData={words:Record<string,VocabWord>;cards:Record<string,any>;sessions:Record<string,VocabSession>;feedback:Record<string,{requestId:string;entryId:string;entryVersion:number;answer:string;date:string;feedback:VocabFeedback}>;assist:Record<string,any>};
export const cardKey=(e:VocabEntry,d:Direction)=>`${e.id}/${e.senseId}/${e.version}/${d}`;
const conflict=()=>Object.assign(Error('This session changed in another tab. Reload to recover the latest saved work.'),{statusCode:409});
export class VocabularyStore{
 constructor(public store:Store){store.raw.exec('CREATE TABLE IF NOT EXISTS vocabulary_workspace(owner TEXT PRIMARY KEY,data TEXT NOT NULL)');}
 read(owner:string):VocabularyData{
  const row=this.store.raw.prepare('SELECT data FROM vocabulary_workspace WHERE owner=?').get(owner) as {data:string}|undefined;
  const data:VocabularyData=row?JSON.parse(row.data):{words:{},cards:{},sessions:{},feedback:{},assist:{}};
  const reviews=this.store.list(owner,'review'),sources=new Map([...activities.map(a=>a.vocabulary),...chapters.flatMap(c=>c.vocabulary)].map(v=>[v.word,v]));
  for(const [word,v] of sources){const history=reviews.filter(r=>r.data.word===word),latest=history.at(-1);if(!latest)continue;
   const id='legacy-'+Buffer.from(word).toString('base64url');
   if(!data.words[id])data.words[id]={entry:{id,senseId:'legacy-sense',version:1,word,partOfSpeech:'expression',level:null,topic:'Previous practice',meaning:v.meaning,examples:[v.example],collocations:[],note:'Imported from previous practice. Original schedule preserved; approximate level not assigned.',cloze:v.example.toLowerCase().includes(word.toLowerCase())?v.example.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____'):'',answers:[word],prompt:`Write your own sentence using “${word}”.`,origin:'legacy',status:'draft'},selected:true,archived:false,collection:'Previous practice',addedAt:history[0].createdAt,revision:0};
   const key=cardKey(data.words[id].entry,'meaning'),existing=data.cards[key];
   if(!existing?.last_review||Date.parse(latest.data.card.last_review??latest.createdAt)>Date.parse(existing.last_review))data.cards[key]=latest.data.card;
  }
  return data;
 }
 save(owner:string,data:VocabularyData){this.store.raw.prepare('INSERT INTO vocabulary_workspace(owner,data) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner,JSON.stringify(data));}
 mutate<T>(owner:string,fn:(data:VocabularyData)=>T):T{return this.store.raw.transaction(()=>{const d=this.read(owner),result=fn(d);this.save(owner,d);return result;})();}
 entry(d:VocabularyData,id:string){const e=d.words[id]?.entry??vocabularyCatalog.find(e=>e.id===id);if(!e)throw Object.assign(Error('Word not found.'),{statusCode:404});return e;}
 summary(d:VocabularyData):VocabSummary{
  const words=Object.values(d.words).filter(w=>w.selected&&!w.archived),keys=new Set(words.flatMap(w=>(['meaning','word'] as Direction[]).map(dir=>cardKey(w.entry,dir))));
  const cards=Object.entries(d.cards).filter(([key])=>keys.has(key)).map(([,v])=>v),results=Object.values(d.sessions).flatMap(s=>s.results),ratings=[0,0,0,0];
  for(const r of results)if(r.rating&&!r.retry)ratings[r.rating-1]++;
  const metric=(kind:string)=>{const r=results.filter(r=>r.kind===kind&&!r.retry&&typeof r.correct==='boolean');return {correct:r.filter(r=>r.correct).length,total:r.length};};
  const examples=results.filter(r=>r.kind==='use'&&r.answer.trim()).map(r=>{const entry=d.sessions[r.sessionId]?.steps[r.step]?.entry;return {answer:r.answer,word:entry?.word??'Archived entry',date:r.createdAt,feedback:Object.values(d.feedback).filter(f=>f.entryId===r.entryId&&f.entryVersion===r.version&&f.answer===r.answer).sort((a,b)=>b.date.localeCompare(a.date))[0]?.feedback};}).sort((a,b)=>b.date.localeCompare(a.date));
  const now=Date.now();return {selected:words.length,due:cards.filter(c=>Date.parse(c.due)<=now).length,newWords:words.filter(w=>!d.cards[cardKey(w.entry,'meaning')]||!d.cards[cardKey(w.entry,'word')]).length,activeDays:new Set(results.map(r=>r.createdAt.slice(0,10))).size,ratings,word:metric('word'),context:metric('context'),nextDue:cards.map(c=>c.due).filter(t=>Date.parse(t)>now).sort()[0]??null,examples};
 }
 home(owner:string){const d=this.read(owner);return {words:Object.values(d.words),summary:this.summary(d),session:Object.values(d.sessions).filter(s=>s.status!=='completed').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]??null};}
 create(owner:string,reviewLimit:number,newLimit:number,id:string=randomUUID()){return this.mutate(owner,d=>{const requestSignature=JSON.stringify([reviewLimit,newLimit]);if(Object.hasOwn(d.sessions,id)){if(d.sessions[id].requestSignature!==requestSignature)throw Error('This session identity was already used for different settings.');return d.sessions[id];}
  const active=Object.values(d.sessions).find(s=>s.status!=='completed');if(active)return active;
  const words=Object.values(d.words).filter(w=>w.selected&&!w.archived),now=Date.now(),session:VocabSession={id,requestSignature,revision:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'active',index:0,steps:[],draft:'',revealed:false,results:[]};
  const due=words.flatMap(w=>(['meaning','word'] as Direction[]).flatMap(dir=>{const c=d.cards[cardKey(w.entry,dir)];return c&&Date.parse(c.due)<=now?[{entry:w.entry,dir,due:c.due}]:[];})).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,reviewLimit);
  for(const item of due)session.steps.push({entry:item.entry,kind:item.dir,direction:item.dir});
  const newWords=words.filter(w=>(['meaning','word'] as Direction[]).some(dir=>!d.cards[cardKey(w.entry,dir)])).slice(0,newLimit);
  for(const w of newWords){session.steps.push({entry:w.entry,kind:'meet'});for(const dir of ['meaning','word'] as Direction[])if(!d.cards[cardKey(w.entry,dir)])session.steps.push({entry:w.entry,kind:dir,direction:dir});}
  // Contexts alternate across sessions; production remains optional for every entry.
  const practiced=[...new Map(session.steps.map(step=>[step.entry.id,step.entry])).values()];
  const alternate=Object.keys(d.sessions).length%2===0;
  for(const [i,e] of practiced.entries()){if(e.cloze&&i%2===(alternate?0:1))session.steps.push({entry:e,kind:'context'});session.steps.push({entry:e,kind:'use'});}
  if(!session.steps.length)throw Error('No reviews are due. Add words in Explore or My words to start learning.');d.sessions[session.id]=session;return session;
 });}
 get(d:VocabularyData,id:string){const s=d.sessions[id];if(!s)throw Object.assign(Error('Vocabulary session not found.'),{statusCode:404});return s;}
 patch(owner:string,id:string,revision:number,update:{draft?:string;revealed?:boolean;status?:'active'|'paused'|'completed'}){return this.mutate(owner,d=>{const s=this.get(d,id);if(s.revision!==revision)throw conflict();if(s.status==='completed')throw Error('This session is already finished.');Object.assign(s,update);s.revision++;s.updatedAt=new Date().toISOString();return s;});}
 review(owner:string,input:{id:string;sessionId:string;revision:number;step:number;answer:string;rating?:number}){return this.mutate(owner,d=>{
  const existing=Object.values(d.sessions).flatMap(s=>s.results).find(r=>r.id===input.id);
  if(existing){if(existing.sessionId!==input.sessionId||existing.step!==input.step||existing.answer!==input.answer||existing.rating!==input.rating)throw Error('This response identity was already used.');return {session:this.get(d,input.sessionId),result:existing};}
  const s=this.get(d,input.sessionId);if(s.revision!==input.revision||s.index!==input.step)throw conflict();if(s.status==='completed')throw Error('This session is finished.');
  const step=s.steps[s.index];if(!step)throw Error('No task is available.');const recall=step.kind==='meaning'||step.kind==='word';if(recall&&!input.rating)throw Error('Choose how easily you recalled the answer.');if(!recall&&input.rating)throw Error('This task does not schedule a flashcard.');
  const correct=step.kind==='word'||step.kind==='context'?correctWord(step.entry,input.answer):undefined;
  const result:VocabResult={id:input.id,sessionId:s.id,step:s.index,entryId:step.entry.id,version:step.entry.version,kind:step.kind,answer:input.answer,rating:input.rating,correct,createdAt:new Date().toISOString(),retry:!!step.retry};s.results.push(result);
  if(recall&&!step.retry){const key=cardKey(step.entry,step.direction!),raw=d.cards[key];const c:Card=raw?{...raw,due:new Date(raw.due),last_review:raw.last_review?new Date(raw.last_review):undefined}:createEmptyCard();const next=fsrs().repeat(c,new Date())[input.rating as Rating.Again|Rating.Hard|Rating.Good|Rating.Easy];d.cards[key]=next.card;}
  if(correct===false&&!step.retry)s.steps.push({...step,retry:true});
  s.index++;s.draft='';s.revealed=false;s.status=s.index>=s.steps.length?'completed':'active';s.revision++;s.updatedAt=new Date().toISOString();return {session:s,result};
 });}
}
