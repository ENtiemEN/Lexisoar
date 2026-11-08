import {describe,it,expect,vi} from 'vitest';
import {randomUUID,randomBytes} from 'node:crypto';
import {buildApp} from '../server/app';
import {Store} from '../server/store';
import {dumpWorkspace,restoreWorkspace,importBackup} from '../server/workspace';
import {seal,unseal,webCookie,verifiedSession,type CloudConfig} from '../server/cloud-auth';
import {CloudRepository} from '../server/cloud-repository';

const owner=randomUUID(),other=randomUUID();
async function memory(who=owner){const store=new Store(':memory:'),app=await buildApp({store,remote:{owner:who,label:'Invited user',csrf:'test'}});return {store,app};}
const headers={host:'127.0.0.1:4180',origin:'http://127.0.0.1:4180','x-csrf-token':'test'};
describe('remote execution without local credentials or disk',()=>{
 it('reports the cloud account and blocks local credential routes',async()=>{const {app}=await memory();try{const s=(await app.inject({url:'/api/session',headers})).json();expect(s).toMatchObject({remote:true,signedIn:true,chatgpt:false,owner});expect((await app.inject({url:'/auth/start',headers})).statusCode).toBe(404);}finally{await app.close();}});
 it('restores Stories, Vocabulary and Grammar in a fresh function instance',async()=>{let m=await memory();try{
  const chapters=(await m.app.inject({url:'/api/chapters',headers})).json();const run=(await m.app.inject({method:'POST',url:'/api/study-sessions',headers,payload:{chapterId:chapters.chapters[0].id}})).json();expect(run.run.id).toBeTruthy();
  const topics=(await m.app.inject({url:'/api/grammar/catalog',headers})).json();expect((await m.app.inject({method:'POST',url:'/api/grammar/sessions',headers,payload:{id:randomUUID(),mode:'train',topicIds:[topics.topics[0].id],limit:5}})).statusCode).toBe(200);
  const catalog=(await m.app.inject({url:'/api/vocabulary/catalog',headers})).json();expect(catalog).toBeTruthy();
  const state=dumpWorkspace(m.store,owner);await m.app.close();m=await memory();restoreWorkspace(m.store,owner,state);
  expect((await m.app.inject({url:'/api/study-sessions',headers})).json().runs[0].id).toBe(run.run.id);expect((await m.app.inject({url:'/api/grammar/sessions',headers})).json().sessions).toHaveLength(1);
 }finally{await m.app.close();}});
 it('cannot hydrate another owner and rolls back partial imports',async()=>{const {app,store}=await memory();try{expect(()=>restoreWorkspace(store,other,{events:[{id:randomUUID(),owner,kind:'attempt',created_at:new Date().toISOString(),data:'{}',synced:1}]})).toThrow('ownership');expect(store.list(other)).toEqual([]);}finally{await app.close();}});
 it('keeps correction on the server despite a forged client result',async()=>{const {app,store}=await memory();try{const catalog=(await app.inject({url:'/api/catalog',headers})).json();const a=catalog.activities.find((a:any)=>a.answer);const r=await app.inject({method:'POST',url:'/api/attempts',headers,payload:{id:randomUUID(),activityId:a.id,answer:'definitely incorrect',source:'typed',assisted:false,mode:'practice',result:{correct:true}}});expect(r.statusCode).toBe(200);expect(store.list(owner,'attempt')[0].data.result.correct).not.toBe(true);}finally{await app.close();}});
 it('imports a local backup into an empty workspace without accepting imported objective scores',async()=>{const m=await memory();try{const result=importBackup(m.store,owner,{version:2,events:[{id:randomUUID(),kind:'attempt',createdAt:new Date().toISOString(),data:{answer:'test',result:{correct:true},audioId:randomUUID()}}],studySessions:[],assessments:[],vocabulary:null,grammar:null});expect(result.recordingsImported).toBe(false);expect(m.store.list(owner)[0].data.result.correct).toBe(null);expect(m.store.list(owner)[0].data.audioId).toBeUndefined();expect(()=>importBackup(m.store,owner,{version:2,events:[],studySessions:[],assessments:[],vocabulary:null,grammar:null})).toThrow('empty');}finally{await m.app.close();}});
 it('does not partially import malformed chapter state',async()=>{const m=await memory();try{expect(()=>importBackup(m.store,owner,{version:2,events:[{id:randomUUID(),kind:'conversation',createdAt:new Date().toISOString(),data:{message:'safe'}}],studySessions:[{}],assessments:[],vocabulary:null,grammar:null})).toThrow();expect(m.store.list(owner)).toEqual([]);}finally{await m.app.close();}});
 it('round-trips an actual training backup, with canonical materials and recoverable drafts',async()=>{const source=await memory(),target=await memory(other);try{
  const catalog=(await source.app.inject({url:'/api/vocabulary/catalog',headers})).json();expect((await source.app.inject({method:'POST',url:'/api/vocabulary/entries',headers,payload:{catalogId:catalog.entries[0].id}})).statusCode).toBe(200);
  const id=randomUUID(),v=(await source.app.inject({method:'POST',url:'/api/vocabulary/sessions',headers,payload:{id,newLimit:1,reviewLimit:0}})).json();expect(v.id).toBe(id);expect((await source.app.inject({method:'POST',url:'/api/vocabulary/sessions',headers,payload:{id,newLimit:1,reviewLimit:0}})).json().id).toBe(id);
  const topic=(await source.app.inject({url:'/api/grammar/catalog',headers})).json().topics[0];const g=(await source.app.inject({method:'POST',url:'/api/grammar/sessions',headers,payload:{id:randomUUID(),mode:'learn',topicIds:[topic.id],limit:5}})).json();
  const backup=(await source.app.inject({url:'/api/backup',headers})).json();importBackup(target.store,other,backup);
  expect((await target.app.inject({url:'/api/vocabulary/sessions?id='+id,headers})).json().steps[0].entry.id).toBe(catalog.entries[0].id);expect((await target.app.inject({url:'/api/grammar/sessions?id='+g.id,headers})).json().steps[0].topic.title).toBe(topic.title);
 }finally{await source.app.close();await target.app.close();}});
});
describe('web session boundary',()=>{
 const config:CloudConfig={url:'https://test.supabase.co',key:'public',secret:'server',origin:'https://lexisoar.example',cookieKey:randomBytes(32)};
 it('encrypts sessions with origin binding and rejects tampering',async()=>{const token=await seal(config,{access:'secret-access',refresh:'secret-refresh',csrf:'csrf'});expect(token).not.toContain('secret-access');expect((await unseal<any>(config,token)).refresh).toBe('secret-refresh');expect(await unseal(config,token.slice(0,-5)+'wrong')).toBeNull();expect(await unseal({...config,origin:'https://other.example'},token)).toBeNull();});
 it('expires cookies and sets secure HTTP-only attributes',async()=>{expect(await unseal(config,await seal(config,{access:'a'},-1))).toBeNull();expect(webCookie('__Host-test','value')).toContain('HttpOnly; Secure; SameSite=Lax');});
 it('requires a verified Google identity',async()=>{const getUser=vi.fn().mockResolvedValue({data:{user:{id:owner,email:'a@example.com',email_confirmed_at:new Date().toISOString(),app_metadata:{providers:['email']}}},error:null});expect(await verifiedSession({auth:{getUser}} as any,{access:'a',refresh:'r',csrf:'c'})).toBeNull();});
 it('renews an expired access token without changing CSRF or ownership',async()=>{const user={id:owner,email:'a@example.com',email_confirmed_at:new Date().toISOString(),app_metadata:{providers:['google']}},getUser=vi.fn().mockResolvedValueOnce({data:{user:null},error:Error('expired')}).mockResolvedValueOnce({data:{user},error:null});const refreshSession=vi.fn().mockResolvedValue({data:{session:{access_token:'new',refresh_token:'renewed'}},error:null});expect(await verifiedSession({auth:{getUser,refreshSession}} as any,{access:'old',refresh:'r',csrf:'stable'})).toMatchObject({user:{id:owner},session:{access:'new',csrf:'stable'}});});
 it('surfaces compare-and-swap conflicts without overwriting a newer workspace',async()=>{const rpc=vi.fn().mockResolvedValue({error:{message:'workspace_conflict'}}),repo=new CloudRepository({rpc} as any);await expect(repo.commit(owner,1,{} as any,null)).rejects.toMatchObject({statusCode:409});expect(rpc).toHaveBeenCalledTimes(1);});
});
