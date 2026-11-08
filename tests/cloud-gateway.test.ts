import {beforeEach,describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
const fake=vi.hoisted(()=>({owner:'10000000-0000-4000-8000-000000000001',invited:true,signedIn:true,states:new Map<string,any>()}));
vi.mock('../server/cloud-auth',()=>({
 cloudConfig:()=>({origin:'https://lexisoar.example'}),cookieValue:()=> 'encrypted',unseal:async()=>({access:'access',refresh:'refresh',csrf:'csrf'}),seal:async()=> 'encrypted',webCookie:()=> '__Host-lexisoar_session=encrypted; Secure; HttpOnly',
 verifiedSession:async()=>fake.signedIn?{user:{id:fake.owner,email:'invited@example.com',user_metadata:{}},session:{access:'access',refresh:'refresh',csrf:'csrf'}}:null,
 supabaseClient:()=>({from:(table:string)=>{
  const filters:Record<string,unknown>={};const chain:any={select:()=>chain,eq:(k:string,v:unknown)=>{filters[k]=v;return chain;},upsert:async()=>({error:null}),maybeSingle:async()=>({error:null,data:table==='lexisoar_invites'?(fake.invited?{email:'invited@example.com'}:null):(fake.states.get(String(filters.user_id))??null)})};return chain;
 },rpc:async(name:string,args:any)=>{if(name!=='commit_lexisoar_workspace')throw Error('Unexpected RPC');const old=fake.states.get(args.p_user_id);if((old?.revision??-1)!==args.p_revision)return {error:{message:'workspace_conflict'}};const revision=args.p_revision+1;fake.states.set(args.p_user_id,{revision,state:structuredClone(args.p_state),import_hash:args.p_import_hash});return {data:revision,error:null};}})
}));
import handler from '../api/web';
async function call(path:string,method='GET',body?:unknown,csrf='csrf'){
 let payload='';const response:any={statusCode:200,headers:{} as Record<string,any>,setHeader(k:string,v:any){this.headers[k.toLowerCase()]=v;},end(v:any){payload=Buffer.isBuffer(v)?v.toString():String(v??'');}};
 await handler({url:path,method,headers:{cookie:'encrypted',origin:'https://lexisoar.example','x-csrf-token':csrf},body} as any,response);return {status:response.statusCode,headers:response.headers,data:payload?JSON.parse(payload):null};
}
beforeEach(()=>{fake.states.clear();fake.owner='10000000-0000-4000-8000-000000000001';fake.invited=true;fake.signedIn=true;});
describe('Vercel web gateway with simulated Supabase transport',()=>{
 it('shows a login gate and refuses data without a verified session',async()=>{fake.signedIn=false;expect((await call('/api/session')).data.needsLogin).toBe(true);expect((await call('/api/grammar/catalog')).status).toBe(401);});
 it('rejects uninvited identities and cross-site mutations',async()=>{fake.invited=false;expect((await call('/api/progress')).status).toBe(403);fake.invited=true;expect((await call('/api/attempts','POST',{},'wrong')).status).toBe(403);expect(fake.states.size).toBe(0);});
 it('persists an attempt across cold invocations and deduplicates retry',async()=>{const body={id:randomUUID(),activityId:'reading-1-1',answer:'restore',source:'typed',assisted:false,mode:'practice'};
  expect((await call('/api/attempts','POST',body)).data.result.correct).toBe(true);expect((await call('/api/attempts','POST',body)).status).toBe(200);expect((await call('/api/progress')).data.events).toHaveLength(1);
  fake.owner='10000000-0000-4000-8000-000000000002';expect((await call('/api/progress')).data.events).toHaveLength(0);
 });
 it('returns a real conflict for concurrent cold writes instead of losing a confirmed save',async()=>{const body=()=>({id:randomUUID(),activityId:'reading-1-1',answer:'restore',source:'typed',assisted:false,mode:'practice'});const results=await Promise.all([call('/api/attempts','POST',body()),call('/api/attempts','POST',body())]);expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect((await call('/api/progress')).data.events).toHaveLength(1);});
 it('opens progress without generating feedback and explicitly gates hosted GPT',async()=>{expect((await call('/api/progress/summary?period=28&timeZone=America%2FLima')).status).toBe(200);expect(fake.states.size).toBe(0);expect((await call('/api/tutor','POST',{message:'help'})).status).toBe(503);expect((await call('/api/web?route=api/session')).data.remote).toBe(true);});
 it('imports text once and never imports credentials',async()=>{const backup={version:2,events:[],studySessions:[],assessments:[],vocabulary:null,grammar:null};expect((await call('/api/backup/import','POST',backup)).data.imported).toBe(true);expect((await call('/api/backup/import','POST',backup)).data.duplicate).toBe(true);const exported=await call('/api/backup');expect(JSON.stringify(exported.data)).not.toContain('access_token');});
});
