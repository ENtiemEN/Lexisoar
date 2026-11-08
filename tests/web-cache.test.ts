import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {api,cacheDraft,pendingWrites} from '../src/api';
let cache:Map<string,string>;
beforeEach(async()=>{cache=new Map();vi.stubGlobal('localStorage',{getItem:(k:string)=>cache.get(k)??null,setItem:(k:string,v:string)=>cache.set(k,v)});vi.stubGlobal('window',new EventTarget());vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({remote:true,owner:'alice',csrf:'csrf'}),{headers:{'Content-Type':'application/json'}})));await api('session');});
afterEach(()=>vi.unstubAllGlobals());
describe('owner-scoped unconfirmed drafts',()=>{
 it('retains failed work and never marks it saved',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({error:'Connection interrupted'}),{status:503}));await expect(api('grammar/sessions',{id:'one',revision:0,draft:'My sentence'},'PATCH')).rejects.toThrow('interrupted');expect(pendingWrites()['grammar/sessions:one'].body).toMatchObject({draft:'My sentence'});});
 it('does not erase a newer draft when an earlier request finishes',async()=>{let finish!:(value:Response)=>void;vi.mocked(fetch).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const request=api('grammar/sessions',{id:'one',revision:0,draft:'Earlier'},'PATCH');await new Promise(resolve=>setTimeout(resolve,0));cacheDraft('grammar/sessions',{id:'one',revision:0,draft:'Newer unsent sentence'});finish(new Response('{}'));await request;expect(pendingWrites()['grammar/sessions:one'].body).toMatchObject({draft:'Newer unsent sentence'});});
 it('does not expose another account’s drafts after an identity change',async()=>{cacheDraft('vocabulary/sessions',{id:'one',draft:'Private example'});vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({remote:true,owner:'bob',csrf:'different'})));await api('session');expect(pendingWrites()).toEqual({});expect(cache.get('lexisoar-pending:alice')).toContain('Private example');});
});
