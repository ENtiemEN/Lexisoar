import {z} from 'zod';
import {grammarTopics} from '../shared/grammar-catalog.js';
import {vocabularyCatalog} from '../shared/vocabulary-catalog.js';
const text=z.string().max(12000),date=z.iso.datetime({offset:true}),id=z.string().min(1).max(200).refine(s=>!['__proto__','constructor','prototype'].includes(s)),revision=z.number().int().nonnegative();
const map=<T extends z.ZodType>(schema:T)=>z.record(id,schema);
const card=z.object({due:date,stability:z.number().nonnegative(),difficulty:z.number().min(0).max(10),elapsed_days:z.number().nonnegative(),scheduled_days:z.number().nonnegative(),reps:revision,lapses:revision,state:z.number().int().min(0).max(3),last_review:date.optional(),learning_steps:revision.optional()});
const status=z.enum(['active','paused','completed']);
const entry=z.object({id,senseId:id,version:revision,word:text,partOfSpeech:text,level:z.enum(['B1','B2','C1','C2']).nullable(),topic:text,meaning:text,examples:z.array(text).min(1).max(2),collocations:z.array(text).max(10),note:text,cloze:text,answers:z.array(text).min(1).max(20),prompt:text,status:z.enum(['draft','reviewed']),origin:z.enum(['catalog','personal','legacy'])});
const vocabularySession=z.object({id:z.uuid(),requestSignature:text.optional(),revision,createdAt:date,updatedAt:date,status,index:revision,steps:z.array(z.object({entry,kind:z.enum(['meet','meaning','word','context','use']),direction:z.enum(['meaning','word']).optional(),retry:z.boolean().optional()})).max(500),draft:text,revealed:z.boolean(),results:z.array(z.object({id:z.uuid(),sessionId:z.uuid(),step:revision,entryId:id,version:revision,kind:z.enum(['meet','meaning','word','context','use']),answer:text,rating:z.number().int().min(1).max(4).optional(),createdAt:date,retry:z.boolean()})).max(500)});
const vocabFeedback=z.object({meaningUse:text,strength:text,improvement:text,model:text.optional()});
const vocab=z.object({words:map(z.object({entry,selected:z.boolean(),archived:z.boolean(),collection:text,addedAt:date,revision})),cards:map(card),sessions:map(vocabularySession),feedback:map(z.object({requestId:z.uuid(),entryId:id,entryVersion:revision,answer:text,date,feedback:vocabFeedback})),assist:map(z.any())});
const grammarFeedback=z.object({targetUse:text,strength:text,improvement:text,retryPrompt:text,quote:text});
const assistance=z.object({id:z.uuid(),signature:text,sessionId:z.uuid(),step:revision,answer:text,createdAt:date,model:text,explanation:text.optional(),feedback:grammarFeedback.optional()});
const grammarSession=z.object({id:z.uuid(),requestSignature:text,revision,mode:z.enum(['learn','train','review']),createdAt:date,updatedAt:date,status,index:revision,steps:z.array(z.object({kind:z.enum(['observe','task','rate','production']),topic:z.object({id,version:revision}),objectiveId:id.optional(),exerciseId:id.optional(),retry:z.boolean().optional()})).max(500),draft:text,blockIds:z.array(id).max(100),helped:z.boolean(),responses:z.array(z.object({id:z.uuid(),step:revision,exerciseId:id.optional(),objectiveId:id.optional(),objectiveVersion:revision.optional(),topicId:id,topicVersion:revision,answer:text,blockIds:z.array(id).max(100),helped:z.boolean(),retry:z.boolean(),createdAt:date})).max(500)});
const grammar=z.object({sessions:map(grammarSession),cards:map(card),reviews:z.array(z.object({id:z.uuid(),sessionId:z.uuid(),step:revision,rating:z.number().int().min(1).max(4),objectiveId:id,version:revision,createdAt:date,scheduled:z.boolean()})).max(20000),assistance:map(assistance)});
export function validateTrainingBackup(kind:'vocabulary'|'grammar',input:unknown):any{
 if(kind==='grammar'){
  const d=grammar.parse(input);for(const s of Object.values(d.sessions)){
   if(s.index>s.steps.length)throw Error('Invalid grammar position.');
   for(const step of s.steps){const canonical=grammarTopics.find(t=>t.id===step.topic.id&&t.version===step.topic.version);if(!canonical)throw Error('This grammar version is not available for import.');if(step.exerciseId&&!canonical.exercises.some(e=>e.id===step.exerciseId&&e.objectiveId===step.objectiveId))throw Error('Invalid grammar exercise.');(step as any).topic=canonical;}
   for(const r of s.responses){if(!s.steps[r.step])throw Error('Invalid grammar response.');(r as any).correct=null;(r as any).imported=true;}
  }return d;
 }
 const d=vocab.parse(input);d.assist={};const canonicalEntry=(e:z.infer<typeof entry>)=>{if(e.origin!=='catalog')return {...e,status:'draft' as const};const canonical=vocabularyCatalog.find(c=>c.id===e.id&&c.senseId===e.senseId&&c.version===e.version);if(!canonical)throw Error('This vocabulary version is not available for import.');return canonical;};
 for(const word of Object.values(d.words))word.entry=canonicalEntry(word.entry);
 for(const s of Object.values(d.sessions)){if(s.index>s.steps.length)throw Error('Invalid vocabulary position.');for(const step of s.steps)step.entry=canonicalEntry(step.entry);for(const r of s.results){if(!s.steps[r.step])throw Error('Invalid vocabulary response.');(r as any).imported=true;}}
 return d;
}
