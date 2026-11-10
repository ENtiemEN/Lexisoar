let csrf='',remote=false,owner='';
export function setCsrf(value:string){csrf=value;}
export function webAccount(){return {remote,owner};}
const pendingKey=()=>`lexisoar-pending:${owner}`;
export function pendingWrites():Record<string,{path:string;method:string;body:unknown;date:string}>{try{return JSON.parse(localStorage.getItem(pendingKey())??'{}');}catch{return {};}}
function remember(key:string,value:unknown){if(!remote||!owner)return;try{const pending=pendingWrites();if(value===null)delete pending[key];else pending[key]=value as any;localStorage.setItem(pendingKey(),JSON.stringify(pending));window.dispatchEvent(new Event('lexisoar-pending'));}catch{/* Cache failure is never a confirmed server save. */}}
export function discardPending(key:string){remember(key,null);}
export function cacheDraft(path:string,body:unknown){const key=path+':'+((body as any).id??'draft');remember(key,{path,method:'PATCH',body,date:new Date().toISOString()});}
type RequestOptions={signal?:AbortSignal;timeoutMs?:number};
export async function boundedFetch(url:string,init:RequestInit={},options:RequestOptions={}){const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,options.timeoutMs??30000);if(options.signal?.aborted)abort();options.signal?.addEventListener('abort',abort,{once:true});try{return await fetch(url,{...init,signal:controller.signal});}catch(e){if(controller.signal.aborted)throw Error('The request was interrupted or took too long. Your draft is still available; retry or choose how to leave.');throw e;}finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}}
async function request<T>(path:string,body?:unknown,method?:string,options?:RequestOptions):Promise<T>{
 const response=await boundedFetch('/api/'+path,{method:method??(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:body===undefined?undefined:JSON.stringify(body)},options);
 let data:any;try{data=await response.json();}catch{throw Error('The server did not confirm the request. Your work has not been marked as saved.');}
 if(!response.ok)throw Object.assign(Error(data.error||'Something went wrong. Your saved progress is safe.'),{status:response.status});
 if(path==='session'){remote=!!data.remote;owner=data.owner??'';csrf=data.csrf??'';}return data;
}
let writeQueue:Promise<unknown>=Promise.resolve();
export async function api<T=any>(path:string,body?:unknown,method?:string,options?:RequestOptions):Promise<T>{
 if(remote&&path==='audio'&&body){const audio=body as {id?:string;base64:string;mime:string};const bytes=Uint8Array.from(atob(audio.base64),c=>c.charCodeAt(0)),id=audio.id??crypto.randomUUID();
  const reservation=await api<{signedUrl?:string;status:string}>('audio/reserve',{id,size:bytes.length,mime:audio.mime},undefined,options);if(reservation.signedUrl){const uploaded=await boundedFetch(reservation.signedUrl,{method:'PUT',headers:{'Content-Type':audio.mime},body:bytes},{...options,timeoutMs:60000});if(!uploaded.ok)throw Error('Recording upload failed. Retry or download your recording before leaving.');}return api<T>('audio/finalize',{id},undefined,options);
 }
 const actualMethod=method??(body===undefined?'GET':'POST');if(!remote||!body||!['POST','PATCH','DELETE','PUT'].includes(actualMethod))return request<T>(path,body,method,options);
 const key=path+':'+((body as any).id??(body as any).sessionId??'draft');
 if(!['logout','sync','audio/reserve','audio/finalize'].includes(path))remember(key,{path,method:actualMethod,body,date:new Date().toISOString()});
 const job=writeQueue.catch(()=>{}).then(async()=>{const data=await request<T>(path,body,method,options);if(JSON.stringify(pendingWrites()[key]?.body)===JSON.stringify(body))remember(key,null);return data;});writeQueue=job;return job;
}
