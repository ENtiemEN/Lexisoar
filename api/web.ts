import type {IncomingMessage,ServerResponse} from 'node:http';
import {buildApp} from '../server/app';
import {Store} from '../server/store';
import {CloudRepository} from '../server/cloud-repository';
import {dumpWorkspace,restoreWorkspace,importBackup,backupDigest,backupSchema} from '../server/workspace';
import {cloudConfig,supabaseClient,cookieValue,seal,unseal,webCookie,newCsrf,verifiedSession,oauthClient,type WebSession} from '../server/cloud-auth';
import {z} from 'zod';
const sessionCookie='__Host-lexisoar_session',oauthCookie='__Host-lexisoar_oauth';
export default async function handler(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 const send=(status:number,data:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 let app:Awaited<ReturnType<typeof buildApp>>|undefined;
 try{
  const config=cloudConfig(),url=new URL(req.url??'/',config.origin),route=url.searchParams.get('route');if(route){url.pathname='/'+route;url.searchParams.delete('route');}
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const redirect=(destination:string)=>{res.statusCode=303;res.setHeader('Location',destination);res.end();};
  const client=supabaseClient(config),admin=supabaseClient(config,true),method=req.method??'GET';
  const body=async()=>{if(req.body!==undefined)return typeof req.body==='string'?JSON.parse(req.body):req.body;const chunks:Buffer[]=[];let size=0;for await(const c of req){size+=c.length;if(size>3000000)throw Object.assign(Error('Request is too large.'),{statusCode:413});chunks.push(Buffer.from(c));}return chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};};
  if(url.pathname==='/auth/google'&&method==='GET'){
   const storage:Record<string,string>={},oauth=oauthClient(config,storage);const {data,error}=await oauth.auth.signInWithOAuth({provider:'google',options:{redirectTo:config.origin+'/auth/google/callback',skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
   if(error||!data.url)throw Error('Google sign-in is not configured yet.');res.setHeader('Set-Cookie',webCookie(oauthCookie,await seal(config,{storage},600),600));return redirect(data.url);
  }
  if(url.pathname==='/auth/google/callback'&&method==='GET'){
   const pending=await unseal<{storage:Record<string,string>}>(config,cookieValue(req.headers.cookie,oauthCookie));res.setHeader('Set-Cookie',webCookie(oauthCookie,'',0));if(!pending||!url.searchParams.get('code'))return redirect('/?login=expired');
   const oauth=oauthClient(config,pending.storage),{data,error}=await oauth.auth.exchangeCodeForSession(url.searchParams.get('code')!);if(error||!data.session)return redirect('/?login=failed');
   const verified=await verifiedSession(client,{access:data.session.access_token,refresh:data.session.refresh_token,csrf:newCsrf()});
   if(!verified||!await admitted(admin,verified.user.email!)){await oauth.auth.signOut();return redirect('/?login=not-invited');}
   res.setHeader('Set-Cookie',[webCookie(oauthCookie,'',0),webCookie(sessionCookie,await seal(config,verified.session))]);return redirect('/');
  }
  const stored=await unseal<WebSession>(config,cookieValue(req.headers.cookie,sessionCookie)),auth=stored?await verifiedSession(client,stored):null;
  if(!auth){if(url.pathname==='/api/session'&&method==='GET')return send(200,{remote:true,needsLogin:true,signedIn:false,chatgpt:false,cloudConfigured:true,label:'',csrf:''});return send(401,{error:'Sign in with Google to continue.'});}
  const owner=auth.user.id;if(!await admitted(admin,auth.user.email!)){if(url.pathname==='/api/session'&&method==='GET'){res.setHeader('Set-Cookie',webCookie(sessionCookie,'',0));return send(200,{remote:true,needsLogin:true,signedIn:false,chatgpt:false,cloudConfigured:true,label:'',csrf:''});}return send(403,{error:'This Google account is not invited to the beta.'});}
  res.setHeader('Set-Cookie',webCookie(sessionCookie,await seal(config,auth.session)));
  if(['POST','PATCH','PUT','DELETE'].includes(method)&&(req.headers.origin!==config.origin||req.headers['x-csrf-token']!==auth.session.csrf))return send(403,{error:'Reload the app before saving again.'});
  if(url.pathname==='/api/logout'&&method==='POST'){await client.auth.setSession({access_token:auth.session.access,refresh_token:auth.session.refresh});await client.auth.signOut();res.setHeader('Set-Cookie',webCookie(sessionCookie,'',0));return send(200,{signedOut:true});}
  if(url.pathname.startsWith('/auth/')||url.pathname==='/api/models'||url.pathname==='/api/tutor'||url.pathname==='/api/chatgpt/disconnect')return send(503,{error:'Hosted GPT authorization is pending. Your saved work is unaffected.'});
  if(url.pathname==='/api/sync'&&method==='POST')return send(200,{saved:true,remote:true});
  const profile=await admin.from('lexisoar_profiles').upsert({user_id:owner,display_name:auth.user.user_metadata?.full_name?.slice(0,120)??auth.user.email});if(profile.error)throw Error('Could not prepare your account.');
  if(url.pathname==='/api/recordings'&&method==='GET'){const {data,error}=await admin.from('lexisoar_recordings').select('id,bytes,status,created_at,reserved_until').eq('user_id',owner).neq('status','deleted').order('created_at',{ascending:false});if(error)throw Error('Could not load your recordings.');return send(200,{recordings:data});}
  if(url.pathname==='/api/audio/reserve'&&method==='POST'){
   const input=z.object({id:z.uuid(),size:z.number().int().positive().max(10000000),mime:z.enum(['audio/webm','audio/ogg','audio/mp4'])}).parse(await body());
   const {data:expired}=await admin.from('lexisoar_recordings').select('id').eq('user_id',owner).eq('status','deleted').lt('reserved_until',new Date().toISOString());
   if(expired?.length){const cleaned=await admin.storage.from('lexisoar-recordings').remove(expired.map(r=>owner+'/'+r.id));if(!cleaned.error)await admin.from('lexisoar_recordings').delete().eq('user_id',owner).in('id',expired.map(r=>r.id));}
   const {error}=await admin.rpc('reserve_lexisoar_recording',{p_user_id:owner,p_id:input.id,p_bytes:input.size,p_mime:input.mime});if(error)throw Error(error.message.includes('audio_quota')?'Recording storage is full (100 MB). Delete a recording or continue without saving audio.':'Could not reserve recording storage.');
   const prior=await admin.from('lexisoar_recordings').select('created_at,status').eq('user_id',owner).eq('id',input.id).single();if(prior.error||prior.data.status!=='pending'||Date.now()-Date.parse(prior.data.created_at)>60000)throw Error('This upload reservation expired. Start a new upload.');
   const {data,error:signError}=await admin.storage.from('lexisoar-recordings').createSignedUploadUrl(owner+'/'+input.id,{upsert:false});if(signError)throw Error('Could not prepare the audio upload. Try again.');return send(200,{id:input.id,signedUrl:data.signedUrl});
  }
  if(url.pathname.startsWith('/api/audio/')&&!url.pathname.endsWith('/finalize')){
   const id=z.uuid().parse(url.pathname.split('/').at(-1));const {data:record,error}=await admin.from('lexisoar_recordings').select('*').eq('user_id',owner).eq('id',id).maybeSingle();if(error||!record)return send(404,{error:'Recording not found.'});
   if(method==='DELETE'){const {error:removeError}=await admin.storage.from('lexisoar-recordings').remove([owner+'/'+id]);if(removeError)throw Error('Could not delete recording. Try again.');const deleted=await admin.from('lexisoar_recordings').update({status:'deleted'}).eq('user_id',owner).eq('id',id);if(deleted.error)throw Error('Could not finalize deletion. Try again.');return send(200,{deleted:true});}
   if(method==='GET'&&record.status==='ready'){const {data,error}=await admin.storage.from('lexisoar-recordings').createSignedUrl(owner+'/'+id,60);if(error)throw Error('Could not open recording.');return redirect(data.signedUrl);}
   return send(404,{error:'Recording is not ready.'});
  }
  const repository=new CloudRepository(admin),saved=await repository.load(owner),store=new Store(':memory:');
  app=await buildApp({store,remote:{owner,label:auth.user.email!,csrf:auth.session.csrf}});restoreWorkspace(store,owner,saved.state);const before=JSON.stringify(dumpWorkspace(store,owner));let importedHash=saved.importHash;
  if(url.pathname==='/api/backup/import'&&method==='POST'){
   const input=backupSchema.parse(await body()),digest=backupDigest(input);if(saved.importHash===digest)return send(200,{imported:true,duplicate:true});importBackup(store,owner,input);importedHash=digest;
   await repository.commit(owner,saved.revision,dumpWorkspace(store,owner),importedHash);return send(200,{imported:true,recordingsImported:false});
  }
  if(url.pathname==='/api/audio/finalize'&&method==='POST'){
   const {id}=z.object({id:z.uuid()}).parse(await body()),{data:record}=await admin.from('lexisoar_recordings').select('*').eq('user_id',owner).eq('id',id).maybeSingle();if(!record)throw Error('Recording reservation not found.');
   if(record.status==='deleted')throw Error('This recording has been deleted.');const {data:info,error}=await admin.storage.from('lexisoar-recordings').info(owner+'/'+id);if(error||!info||Number(info.metadata?.size)!==Number(record.bytes)||info.metadata?.mimetype!==record.mime)throw Error('The recording upload is incomplete. Retry or continue without saved audio.');
   const ready=await admin.from('lexisoar_recordings').update({status:'ready'}).eq('user_id',owner).eq('id',id);if(ready.error)throw Error('Could not confirm audio storage.');store.append(owner,'audio',{id,mime:record.mime},id);await repository.commit(owner,saved.revision,dumpWorkspace(store,owner),importedHash);return send(200,{id});
  }
  const payload=['POST','PATCH','PUT','DELETE'].includes(method)?await body():undefined;
  const result=await app.inject({method:method as any,url:url.pathname+url.search,headers:{host:'127.0.0.1:4180',origin:'http://127.0.0.1:4180','x-csrf-token':auth.session.csrf,...(payload?{'content-type':'application/json'}:{})},payload:payload?JSON.stringify(payload):undefined});
  const state=dumpWorkspace(store,owner);if(JSON.stringify(state)!==before)await repository.commit(owner,saved.revision,state,importedHash);
  res.statusCode=result.statusCode;res.setHeader('Content-Type',String(result.headers['content-type']??'application/json'));if(result.headers['content-disposition'])res.setHeader('Content-Disposition',String(result.headers['content-disposition']).replace('stride-','lexisoar-'));res.end(result.rawPayload);
 }catch(error){const e=error as Error&{statusCode?:number};send(error instanceof z.ZodError?400:e.statusCode??503,{error:error instanceof z.ZodError?'Check the submitted fields.':e.message});}
 finally{if(app)await app.close();}
}
async function admitted(admin:ReturnType<typeof supabaseClient>,email:string){const {data,error}=await admin.from('lexisoar_invites').select('email').eq('email',email.toLowerCase()).eq('enabled',true).maybeSingle();if(error)throw Error('Could not check beta access.');return !!data;}
