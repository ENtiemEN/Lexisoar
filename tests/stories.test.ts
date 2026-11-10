import {afterEach,describe,it,expect} from 'vitest';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {buildApp} from '../server/app';
import {chapters,cityChapter,storyPresentation,blankDraft} from '../shared/chapters';
import {activities} from '../shared/content';
import {Store} from '../server/store';
import {StudyStore} from '../server/study-store';
const apps:Awaited<ReturnType<typeof buildApp>>[]=[];
afterEach(async()=>{for(const app of apps.splice(0))await app.close();});
describe('0.7 story catalogue and compatible practice',()=>{
 it('has ten distinct complete stories and sixty descriptive titles with stable IDs',()=>{
  expect(chapters).toHaveLength(10);expect(new Set(chapters.map(c=>c.id)).size).toBe(10);
  for(const c of chapters){expect(c.scenes.map(s=>s.skill)).toEqual(['Reading','Listening','Speaking','Writing']);expect(c.vocabulary).toHaveLength(3);expect(new Set(c.vocabulary.map(w=>w.word)).size).toBe(3);const p=storyPresentation(c);expect(p.dialogue.length).toBeGreaterThanOrEqual(5);expect(new Set(p.dialogue.map(t=>t.speaker)).size).toBeGreaterThanOrEqual(2);for(const scene of c.scenes){expect(scene.instruction.length).toBeGreaterThan(20);for(const q of scene.questions??[])expect(q.options.filter(o=>o===q.answer)).toHaveLength(1);}if(c.id!=='quiet-city'){expect(JSON.stringify(c)).not.toMatch(/Maya|Jon|Riverside|Mill Street/);expect(c.scenes[0].activity.stimulus.split(/\s+/).length).toBeGreaterThan(120);}}
  expect(activities).toHaveLength(60);expect(new Set(activities.map(a=>a.title)).size).toBe(60);expect(activities[0].id).toBe('reading-1-1');expect(activities[0].answer).toBe('restore');
 });
 it('retains a presentation fallback for original snapshots without rewriting them',()=>{const legacy=structuredClone(cityChapter);delete legacy.presentation;const before=JSON.stringify(legacy);expect(storyPresentation(legacy).dialogue[0].speaker).toBe('Maya');expect(JSON.stringify(legacy)).toBe(before);});
 it('completes all ten stories independently and restarting preserves old evidence',async()=>{
  const app=await buildApp({root:mkdtempSync(join(tmpdir(),'lexisoar07-'))});apps.push(app);const session=await app.inject({url:'/api/session',headers:{host:'127.0.0.1:4180'}});const headers={host:'127.0.0.1:4180',origin:'http://127.0.0.1:4180',cookie:String(session.headers['set-cookie']).split(';')[0],'x-csrf-token':session.json().csrf};const call=(url:string,payload?:any,method:any=payload?'POST':'GET')=>app.inject({url,headers,payload,method});
  for(const chapter of chapters){let snap=(await call('/api/study-sessions',{chapterId:chapter.id})).json();const id=snap.run.id;
   for(const scene of chapter.scenes){const draft={...blankDraft(),text:scene.questions?'':scene.instruction+' I recommend a short further test before a final decision.',choices:Object.fromEntries((scene.questions??[]).map(q=>[q.id,q.answer]))};const r=await call('/api/study-sessions/'+id+'/attempts',{id:randomUUID(),revision:snap.run.revision,sceneId:scene.id,draft});expect(r.statusCode,r.body).toBe(200);snap=r.json();snap.run.state.sceneIndex++;const advanced=await call('/api/study-sessions/'+id,{revision:snap.run.revision,state:snap.run.state},'PATCH');expect(advanced.statusCode,advanced.body).toBe(200);snap.run=advanced.json().run;}
   for(const word of chapter.vocabulary){snap.run=(await call('/api/study-sessions/'+id+'/review',{revision:snap.run.revision,word:word.word,rating:3})).json().run;}
   snap.run.state.status='completed';expect((await call('/api/study-sessions/'+id,{revision:snap.run.revision,state:snap.run.state},'PATCH')).statusCode).toBe(200);
   const newer=(await call('/api/study-sessions',{chapterId:chapter.id})).json();expect(newer.run.id).not.toBe(id);const old=(await call('/api/study-sessions/'+id)).json();expect(old.run.state.status).toBe('completed');expect(old.attempts).toHaveLength(4);
  }
  expect((await call('/api/study-sessions')).json().runs).toHaveLength(20);
 });
 it('isolates the new catalogue runs by owner',()=>{const store=new Store(':memory:'),studies=new StudyStore(store);for(const c of chapters)studies.create('alice',c.id);expect(studies.list('bob')).toHaveLength(0);expect(studies.list('alice')).toHaveLength(10);store.close();});
 it('retries a local recording with one stable identity and rejects changed bytes',async()=>{const app=await buildApp({root:mkdtempSync(join(tmpdir(),'audio07-'))});apps.push(app);const s=await app.inject({url:'/api/session',headers:{host:'127.0.0.1:4180'}}),headers={host:'127.0.0.1:4180',origin:'http://127.0.0.1:4180',cookie:String(s.headers['set-cookie']).split(';')[0],'x-csrf-token':s.json().csrf};const data={id:randomUUID(),base64:Buffer.from('fixture').toString('base64'),mime:'audio/webm'};for(let i=0;i<2;i++)expect((await app.inject({url:'/api/audio',method:'POST',headers,payload:data})).json().id).toBe(data.id);expect((await app.inject({url:'/api/progress',headers})).json().events.filter((e:any)=>e.kind==='audio')).toHaveLength(1);expect((await app.inject({url:'/api/audio',method:'POST',headers,payload:{...data,base64:Buffer.from('other').toString('base64')}})).statusCode).toBe(409);});
});
