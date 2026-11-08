import http from 'node:http';
import { randomBytes,randomUUID,createHash,createPublicKey,verify } from 'node:crypto';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chooseModel, tutorReply } from './tutor-service.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../output/feasibility/',import.meta.url);
await mkdir(out,{recursive:true});
const hostFile=new URL('host-id.txt',out);let hostId;try{hostId=(await readFile(hostFile,'utf8')).trim();}catch{hostId='urn:uuid:'+randomUUID();await writeFile(hostFile,hostId);}
const port=Number(process.env.ENGLISH_LAB_PORT||4178);const origin=`http://127.0.0.1:${port}`;const callback=origin+'/auth/callback';
let attempt=null;let accessToken=null;let status={phase:'not_started',note:'No API keys; credentials stay in process memory and are never returned to the browser or saved.'};
const browserEvents=[];
let sessionId=null;let accountKey=null;let catalog=null;let history=[];let busy=false;
function authenticated(req){return !!sessionId&&String(req.headers.cookie||'').split(';').some(c=>c.trim()==='english_lab_session='+sessionId);}
const historyFile=()=>new URL('conversation-'+accountKey+'.json',out);
async function accountModels(){if(!catalog){const r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Cannot load your models (HTTP '+r.status+'). Reconnect if your session expired.');catalog=chooseModel(await r.json());}return catalog;}
async function save(){await writeFile(new URL('siwc-status.json',out),JSON.stringify(status,null,2));}
function json(res,data,code=200){res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));}
function html(res,body){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'});res.end(body);}
function sameOrigin(req){return req.headers.origin===origin;}
async function readBody(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>20000)throw Error('Body too large');}return JSON.parse(s||'{}');}
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);
 if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);return res.end('Invalid host');}
 if(req.method==='GET'&&url.pathname==='/'){return html(res,await readFile(new URL('lab.html',import.meta.url),'utf8'));}
 if(req.method==='GET'&&url.pathname==='/conversation.js'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});return res.end(await readFile(new URL('conversation.js',import.meta.url),'utf8'));}
 if(['/models','/conversation'].includes(url.pathname)){
  if(!authenticated(req)||!accessToken)return json(res,{error:'Connect your ChatGPT plan in this browser first.'},401);
  if(req.method==='GET'&&url.pathname==='/models')return json(res,await accountModels());
  if(req.method==='GET'&&url.pathname==='/conversation')return json(res,{history});
  if(req.method==='POST'&&url.pathname==='/conversation'){
   if(!sameOrigin(req))return json(res,{error:'Origin rejected'},403);
   if(busy)return json(res,{error:'Wait for the current reply to finish.'},409);
   const data=await readBody(req);if(typeof data.message!=='string'||!data.message.trim()||data.message.length>2000)return json(res,{error:'Enter between 1 and 2,000 characters.'},400);
   const source=data.source??'unknown';if(!['speech','typed','unknown'].includes(source))return json(res,{error:'Invalid message source.'},400);
   if(data.planOnlyConfirmed!==true)return json(res,{error:'Confirm that app credit use is disabled in ChatGPT settings.'},400);
   const models=await accountModels();const model=data.model||models.selected;if(!models.models.some(m=>m.id===model))return json(res,{error:'Select an available model.'},400);
   busy=true;const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),90000);res.on('close',()=>{if(!res.writableEnded)abort.abort();});
   res.writeHead(200,{'content-type':'application/x-ndjson','cache-control':'no-store','x-content-type-options':'nosniff'});
   const started=Date.now();let firstTextMs=null;const emit=e=>{if(!res.destroyed)res.write(JSON.stringify(e)+'\n');};
   try{
    const reply=await tutorReply({accessToken,model,history,message:data.message,source,signal:abort.signal,onDelta:delta=>{if(firstTextMs===null)firstTextMs=Date.now()-started;emit({type:'delta',text:delta});}});
    const timing={firstTextMs,totalMs:Date.now()-started};const now=new Date().toISOString();
    const updated=[...history,{role:'user',text:data.message.trim(),source,at:now},{role:'assistant',text:reply.text,at:now,model,timing}].slice(-100);
    await writeFile(historyFile(),JSON.stringify(updated,null,2));history=updated;
    status.generationNotRun=false;await save();emit({type:'completed',text:reply.text,timing,model,saved:true});
   }catch(e){emit({type:'error',error:e.name==='AbortError'?'Response stopped or timed out. The exchange was not saved.':e.message});}
   finally{clearTimeout(timeout);busy=false;res.end();}return;
  }
 }
 if(req.method==='GET'&&url.pathname==='/status'){return json(res,{...status,browserEvents});}
 if(req.method==='POST'&&url.pathname==='/browser-report'){
  if(!sameOrigin(req))return json(res,{error:'Origin rejected'},403);
  const data=await readBody(req);browserEvents.push({at:new Date().toISOString(),...data});await writeFile(new URL('browser-results.json',out),JSON.stringify(browserEvents,null,2));return json(res,{saved:true});
 }
 if(req.method==='GET'&&url.pathname==='/auth/start'){
  if(accessToken)return html(res,'<h1>Your ChatGPT plan is connected</h1><p>You can return to the lab and test the audio.</p><a href="/">Return to lab</a>');
  // A back-navigation or repeated click must resume the pending OAuth flow.
  // Do not issue a different state while the original authorization is valid.
  if(attempt?.authorizationUrl&&Date.now()-attempt.startedAt<=15*60*1000){res.writeHead(302,{location:attempt.authorizationUrl,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();}
  attempt=null;
  const state=randomBytes(32).toString('base64url');const nonce=randomBytes(32).toString('base64url');const verifier=randomBytes(48).toString('base64url');
  attempt={state,nonce,verifier,startedAt:Date.now()};
  const auth=new URL('https://auth.openai.com/api/accounts/authorize');
  for(const [k,v] of Object.entries({client_id:'dynamic_agent_client',agent_name_hint:'English Learning Feasibility',ext_agent_host_id:hostId,response_type:'code',redirect_uri:callback,scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',resource:'https://api.openai.com/v1',state,nonce,code_challenge_method:'S256',code_challenge:createHash('sha256').update(verifier).digest('base64url')}))auth.searchParams.set(k,v);
  attempt.authorizationUrl=auth.href;
  status={phase:'awaiting_authorization',startedAt:new Date().toISOString(),credentialStorage:'memory_only'};await save();res.writeHead(302,{location:auth.href,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
 }
 if(req.method==='GET'&&url.pathname==='/auth/callback'){
  if(!attempt||url.searchParams.get('state')!==attempt.state||Date.now()-attempt.startedAt>15*60*1000)return json(res,{error:'Invalid or expired state'},400);
  if(url.searchParams.has('error')){status={phase:'authorization_rejected',error:url.searchParams.get('error')};attempt=null;await save();return html(res,'<h1>Authorization was not completed</h1><a href="/">Return to lab</a>');}
  const clientId=url.searchParams.get('client_id');const code=url.searchParams.get('code');if(!clientId||clientId==='dynamic_agent_client'||!code)throw Error('Missing issued client identity or code');
  const response=await fetch('https://auth.openai.com/api/accounts/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId,code,code_verifier:attempt.verifier,redirect_uri:callback,resource:'https://api.openai.com/v1'})});
  if(!response.ok)throw Error('Token exchange HTTP '+response.status);const token=await response.json();
  const parts=token.id_token?.split('.');if(parts?.length!==3)throw Error('Missing ID token');const header=JSON.parse(Buffer.from(parts[0],'base64url'));const claims=JSON.parse(Buffer.from(parts[1],'base64url'));
  const discovery=await(await fetch('https://auth.openai.com/.well-known/openid-configuration')).json();if(discovery.issuer!=='https://auth.openai.com')throw Error('Unexpected issuer');const jwksUrl=new URL(discovery.jwks_uri);if(jwksUrl.origin!=='https://auth.openai.com')throw Error('Unexpected JWKS location');
  const keys=await(await fetch(jwksUrl)).json();const key=keys.keys.find(k=>k.kid===header.kid);if(header.alg!=='RS256'||!key||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw Error('Signature validation failed');
  if(claims.iss!==discovery.issuer||!(Array.isArray(claims.aud)?claims.aud.includes(clientId):claims.aud===clientId)||claims.exp*1000<Date.now()||claims.nonce!==attempt.nonce||!claims.sub)throw Error('ID token claims rejected');
  const scopes=String(token.scope||'').split(' ');if(!scopes.includes('chatgpt.tokens.use.direct'))throw Error('Plan usage permission not granted');
  accessToken=token.access_token;attempt=null;sessionId=randomBytes(32).toString('base64url');accountKey=createHash('sha256').update(claims.iss+'|'+claims.sub).digest('hex');catalog=null;
  try{history=JSON.parse(await readFile(historyFile(),'utf8'));}catch{history=[];}
  res.setHeader('Set-Cookie',`english_lab_session=${sessionId}; HttpOnly; SameSite=Strict; Path=/`);
  status={phase:'authorized',identityVerified:true,planUsageGranted:true,credentialStorage:'memory_only',authorizedAt:new Date().toISOString(),generationNotRun:true};await save();return html(res,'<h1>ChatGPT plan authorization succeeded</h1><p>Your connection is ready. Return to the lab to try the conversation.</p><a href="/">Return to lab and start talking</a>');
 }
 if(req.method==='POST'&&url.pathname==='/shutdown'){
  if(!sameOrigin(req))return json(res,{error:'Origin rejected'},403);accessToken=null;attempt=null;json(res,{stopped:true});server.close();return;
 }
 return json(res,{error:'Not found'},404);
 }catch(e){if(urlPath(req)==='/auth/callback'){attempt=null;accessToken=null;status={phase:'failed',error:e.message};await save();}json(res,{error:e.message},500);}});
function urlPath(req){return new URL(req.url,origin).pathname;}
server.listen(port,'127.0.0.1',()=>console.log('Feasibility lab: '+origin));
process.on('SIGINT',()=>{accessToken=null;server.close(()=>process.exit(0));});
