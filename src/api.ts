let csrf='';
export function setCsrf(value:string){csrf=value;}
export async function api<T=any>(path:string,body?:unknown,method?:string):Promise<T>{const response=await fetch('/api/'+path,{method:method??(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'Something went wrong. Your saved progress is safe.'),{status:response.status});return data;}
