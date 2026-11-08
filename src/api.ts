let csrf='',remote=false,owner='';
export function setCsrf(value:string){csrf=value;}
export function webAccount(){return {remote,owner};}
const pendingKey=()=>`lexisoar-pending:${owner}`;
export function pendingWrites():Record<string,{path:string;method:string;body:unknown;date:string}>{try{return JSON.parse(localStorage.getItem(pendingKey())??'{}');}catch{return {};}}
function remember(key:string,value:unknown){if(!remote||!owner)return;try{const pending=pendingWrites();if(value===null)delete pending[key];else pending[key]=value as any;localStorage.setItem(pendingKey(),JSON.stringify(pending));window.dispatchEvent(new Event('lexisoar-pending'));}catch{/* Cache failure is never a confirmed server save. */}}
export function discardPending(key:string){remember(key,null);}
export function cacheDraft(path:string,body:unknown){const key=path+':'+((body as any).id??'draft');remember(key,{path,method:'PATCH',body,date:new Date().toISOString()});}
async function request<T>(path:string,body?:unknown,method?:string):Promise<T>{
 const response=await fetch('/api/'+path,{method:method??(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:body===undefined?undefined:JSON.stringify(body)});
 let data:any;try{data=await response.json();}catch{throw Error('The server did not confirm the request. Your work has not been marked as saved.');}
 if(!response.ok)throw Object.assign(Error(data.error||'Something went wrong. Your saved progress is safe.'),{status:response.status});
 if(path==='session'){remote=!!data.remote;owner=data.owner??'';csrf=data.csrf??'';}return data;
}
let writeQueue:Promise<unknown>=Promise.resolve();
export async function api<T=any>(path:string,body?:unknown,method?:string):Promise<T>{
 if(remote&&path==='audio'&&body){const audio=body as {base64:string;mime:string};const bytes=Uint8Array.from(atob(audio.base64),c=>c.charCodeAt(0)),id=crypto.randomUUID();
  const reservation=await api<{signedUrl:string}>('audio/reserve',{id,size:bytes.length,mime:audio.mime});const uploaded=await fetch(reservation.signedUrl,{method:'PUT',headers:{'Content-Type':audio.mime},body:bytes});if(!uploaded.ok)throw Error('Recording upload failed. Keep this page open to retry, or download your recording.');return api<T>('audio/finalize',{id});
 }
 const actualMethod=method??(body===undefined?'GET':'POST');if(!remote||!body||!['POST','PATCH','DELETE','PUT'].includes(actualMethod))return request<T>(path,body,method);
 const key=path+':'+((body as any).id??(body as any).sessionId??'draft');
 if(!['logout','sync','audio/reserve','audio/finalize'].includes(path))remember(key,{path,method:actualMethod,body,date:new Date().toISOString()});
 const job=writeQueue.catch(()=>{}).then(async()=>{const data=await request<T>(path,body,method);if(JSON.stringify(pendingWrites()[key]?.body)===JSON.stringify(body))remember(key,null);return data;});writeQueue=job;return job;
}
