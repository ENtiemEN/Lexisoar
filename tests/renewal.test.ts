import {it,expect} from 'vitest';
import {ChatGPT,type Token} from '../server/chatgpt';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import type {Vault} from '../server/vault';
it('renews once with the issued client, retains the grant and protects rotated credentials',async()=>{let calls=0,saved:Token|null=null;const token:Token={access_token:'old',refresh_token:'old-refresh',id_token:'existing-id',expiresAt:0,clientId:'issued-client',subject:'same-user'};const mock=(async(url:any,options:any)=>{calls++;expect(url).toBe('https://auth.openai.com/api/accounts/oauth/token');expect(options.body.get('grant_type')).toBe('refresh_token');expect(options.body.get('client_id')).toBe('issued-client');expect(options.body.has('scope')).toBe(false);return new Response(JSON.stringify({access_token:'renewed',refresh_token:'rotated',expires_in:3600}));}) as typeof fetch;const chat=new ChatGPT(mkdtempSync(join(tmpdir(),'stride-renew-')),'http://127.0.0.1:4180',mock);chat.vault={get:async()=>saved??token,set:async(_owner:string,data:Token)=>{saved=data;}} as unknown as Vault;const [a,b]=await Promise.all([chat.token('owner'),chat.token('owner')]);expect(a.access_token).toBe('renewed');expect(b.refresh_token).toBe('rotated');expect(calls).toBe(1);expect((await chat.token('owner')).subject).toBe('same-user');expect(calls).toBe(1);});
