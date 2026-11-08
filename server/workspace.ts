import {z} from 'zod';
import type {Store} from './store';
import {stateSchema} from './study-store';
import {createHash} from 'node:crypto';
import {validateTrainingBackup} from './backup-validation';
import {chapters} from '../shared/chapters';
import {feedbackSchema} from './task-feedback';

export const workspaceTables=['events','study_runs','study_feedback','progress_assessments','vocabulary_workspace','grammar_workspace'] as const;
export type Workspace=Record<typeof workspaceTables[number],Record<string,any>[]>;
export function dumpWorkspace(store:Store,owner:string):Workspace{
 return Object.fromEntries(workspaceTables.map(table=>[table,store.raw.prepare(`SELECT * FROM ${table} WHERE owner=?`).all(owner)])) as Workspace;
}
export function restoreWorkspace(store:Store,owner:string,state:Partial<Workspace>){
 store.raw.transaction(()=>{for(const table of workspaceTables){for(const row of state[table]??[]){
  if(row.owner!==owner)throw Error('Workspace ownership does not match.');
  const columns=(store.raw.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);
  if(Object.keys(row).some(key=>!columns.includes(key)))throw Error('Invalid workspace column.');
  store.raw.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(c=>row[c]??null));
 }}})();
}
const eventSchema=z.object({id:z.uuid(),kind:z.enum(['attempt','review','conversation']),createdAt:z.iso.datetime({offset:true}),data:z.any()});
export const backupSchema=z.object({version:z.literal(2),events:z.array(eventSchema).max(20000),studySessions:z.array(z.any()).max(1000),assessments:z.array(z.any()).max(10000),vocabulary:z.any(),grammar:z.any()});
export function backupDigest(value:unknown){return createHash('sha256').update(JSON.stringify(value)).digest('hex');}
// Imported evidence is explicitly marked; it is never trusted as a server-verified score.
export function importBackup(store:Store,owner:string,input:unknown){
 const backup=backupSchema.parse(input),current=dumpWorkspace(store,owner);
 if(workspaceTables.some(t=>current[t].length))throw Object.assign(Error('Import requires an empty account workspace. Export your current work first; no records were overwritten.'),{statusCode:409});
 store.raw.transaction(()=>{
  for(const e of backup.events){let data=typeof e.data==='string'?JSON.parse(e.data):e.data;if(!data||typeof data!=='object')throw Error('Invalid event data.');if(e.kind==='attempt'){data=z.object({answer:z.string().max(10000),activityId:z.string().max(100).optional(),source:z.enum(['typed','speech']).default('typed'),assisted:z.boolean().default(false),mode:z.enum(['practice','exam']).default('practice'),selfReview:z.boolean().default(false),chapterId:z.string().optional(),chapterVersion:z.number().int().optional(),runId:z.uuid().optional(),sceneId:z.string().optional(),parentAttemptId:z.uuid().optional(),choices:z.record(z.string().max(100),z.string().max(1000)).optional()}).parse(data);data.imported=true;data.result={correct:null,feedback:'Imported response · not verified on the web.'};}
   else if(e.kind==='conversation')data=z.object({message:z.string().max(10000),reply:z.string().max(30000).default('Imported conversation'),source:z.enum(['typed','speech']).default('typed'),model:z.string().max(120).optional()}).parse(data);
   else {data=z.object({word:z.string().max(200),card:z.object({due:z.iso.datetime({offset:true}),last_review:z.iso.datetime({offset:true}).optional(),reps:z.number().int().nonnegative(),lapses:z.number().int().nonnegative(),state:z.number().int().min(0).max(3),stability:z.number().nonnegative(),difficulty:z.number().min(0).max(10),elapsed_days:z.number().nonnegative(),scheduled_days:z.number().nonnegative(),learning_steps:z.number().int().nonnegative().optional()}),runId:z.uuid().optional()}).parse(data);}
   store.append(owner,e.kind,data,e.id,e.createdAt,1);
  }
  for(const snapshot of backup.studySessions){const r=snapshot?.run;if(!r||!z.uuid().safeParse(r.id).success||!r.chapter||!Number.isInteger(r.chapterVersion)||!Number.isInteger(r.revision))throw Error('Invalid chapter backup.');const chapter=chapters.find(c=>c.id===r.chapterId&&c.version===r.chapterVersion);if(!chapter)throw Error('This chapter version is not available for import.');const state=stateSchema.parse(r.state);for(const [key,scene] of Object.entries(state.scenes)){if(!chapter.scenes.some(s=>s.id===key))throw Error('Invalid chapter scene.');delete scene.draft.audioId;}
   store.raw.prepare('INSERT INTO study_runs VALUES(?,?,?,?,?,?,?,?)').run(r.id,owner,String(r.chapterId),r.chapterVersion,r.revision,JSON.stringify(state),JSON.stringify(chapter),new Date(r.updatedAt).toISOString());
   for(const attempt of snapshot.attempts??[]){if(!store.list(owner,'attempt').some(e=>e.id===attempt.id&&e.data.runId===r.id))throw Error('Invalid chapter attempt reference.');if(attempt.feedback?.status==='complete'&&attempt.feedback.feedback){const raw=attempt.feedback.feedback,feedback=feedbackSchema.parse({strength:raw.strength,focus:raw.focus,example:raw.example,retryPrompt:raw.retryPrompt});store.raw.prepare('INSERT INTO study_feedback VALUES(?,?,?,?,?)').run(attempt.id,owner,'complete',JSON.stringify({feedback,model:'Imported note · unverified'}),new Date().toISOString());}}
  }
  // Imported tutor assessments and feedback are not promoted to verified learning evidence.
  for(const [table,data] of [['vocabulary_workspace',backup.vocabulary],['grammar_workspace',backup.grammar]] as const){if(data===undefined||data===null)continue;if(typeof data!=='object'||Array.isArray(data))throw Error('Invalid training backup.');const expected=table==='grammar_workspace'?['sessions','cards','reviews','assistance']:['words','cards','sessions','feedback','assist'];if(expected.some(k=>!(k in data)))throw Error('Incomplete training backup.');
   const validated=validateTrainingBackup(table==='grammar_workspace'?'grammar':'vocabulary',data);
   store.raw.prepare(`INSERT INTO ${table}(owner,data) VALUES(?,?)`).run(owner,JSON.stringify(validated));
  }
 })();return {imported:true,recordingsImported:false};
}
