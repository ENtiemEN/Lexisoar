import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {EncryptJWT,jwtDecrypt} from 'jose';
import {randomBytes} from 'node:crypto';
export type WebSession={access:string;refresh:string;csrf:string};
export type CloudConfig={url:string;key:string;secret:string;origin:string;cookieKey:Uint8Array};
export function cloudConfig():CloudConfig{
 const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key,SUPABASE_SECRET_KEY:secret,APP_ORIGIN:origin,SESSION_ENCRYPTION_KEY:encoded}=process.env;
 if(!url||!key||!secret||!origin||!encoded)throw Error('Web deployment configuration is incomplete.');
 const cookieKey=Buffer.from(encoded,'base64');if(cookieKey.length!==32||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Invalid deployment origin or session encryption key.');
 return {url,key,secret,origin,cookieKey};
}
export function supabaseClient(config:CloudConfig,secret=false){return createClient(config.url,secret?config.secret:config.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
export function cookieValue(header:string|undefined,name:string){return header?.split(';').map(c=>c.trim()).find(c=>c.startsWith(name+'='))?.slice(name.length+1);}
export async function seal(config:CloudConfig,value:Record<string,unknown>,seconds=604800){return new EncryptJWT(value).setProtectedHeader({alg:'dir',enc:'A256GCM'}).setIssuedAt().setIssuer('lexisoar').setAudience(config.origin).setExpirationTime(Math.floor(Date.now()/1000)+seconds).encrypt(config.cookieKey);}
export async function unseal<T>(config:CloudConfig,value:string|undefined):Promise<T|null>{if(!value)return null;try{return (await jwtDecrypt(value,config.cookieKey,{issuer:'lexisoar',audience:config.origin,keyManagementAlgorithms:['dir'],contentEncryptionAlgorithms:['A256GCM']})).payload as T;}catch{return null;}}
export function webCookie(name:string,value:string,seconds=604800){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;}
export function newCsrf(){return randomBytes(32).toString('base64url');}
export async function verifiedSession(client:SupabaseClient,s:WebSession){
 let {data,error}=await client.auth.getUser(s.access);
 if(error){const renewed=await client.auth.refreshSession({refresh_token:s.refresh});if(renewed.error||!renewed.data.session)return null;s={...s,access:renewed.data.session.access_token,refresh:renewed.data.session.refresh_token};({data,error}=await client.auth.getUser(s.access));}
 if(error||!data.user||!data.user.email||!data.user.email_confirmed_at||!data.user.app_metadata?.providers?.includes('google'))return null;return {user:data.user,session:s};
}
export function oauthClient(config:CloudConfig,storage:Record<string,string>){return createClient(config.url,config.key,{auth:{flowType:'pkce',autoRefreshToken:false,detectSessionInUrl:false,persistSession:true,storage:{getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=v;},removeItem:k=>{delete storage[k];}}}});}
