import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
export function protect(value:string,decrypt=false):Promise<string>{
 if(process.platform!=='win32')return Promise.reject(Error('Credential persistence requires Windows DPAPI.'));
 const action=decrypt?'Unprotect':'Protect';
 const code=`Add-Type -AssemblyName System.Security; $inputValue=[Console]::In.ReadToEnd(); $bytes=${decrypt?'[Convert]::FromBase64String($inputValue)':'[Text.Encoding]::UTF8.GetBytes($inputValue)'}; $result=[Security.Cryptography.ProtectedData]::${action}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write(${decrypt?'[Text.Encoding]::UTF8.GetString($result)':'[Convert]::ToBase64String($result)'})`;
 return new Promise((resolve,reject)=>{const p=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',code],{windowsHide:true});let out='';p.stdout.on('data',d=>out+=d);p.stderr.resume();p.on('error',()=>reject(Error('Cannot access Windows credential protection.')));p.on('close',c=>c===0?resolve(out):reject(Error('Windows credential protection failed.')));p.stdin.end(value);});
}
export class Vault{
 constructor(private root:string){}
 path(owner:string){return join(this.root,createHash('sha256').update(owner).digest('hex')+'.dpapi');}
 async get<T>(owner:string):Promise<T|null>{let ciphertext;try{ciphertext=await readFile(this.path(owner),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}return JSON.parse(await protect(ciphertext,true));}
 async set(owner:string,data:unknown){const path=this.path(owner);await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',await protect(JSON.stringify(data)));await rename(path+'.tmp',path);}
 async remove(owner:string){await unlink(this.path(owner)).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
