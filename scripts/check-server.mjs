import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
execFileSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'-p','tsconfig.server.json'],{cwd:root,stdio:'inherit'});
// Import emitted JavaScript through native Node ESM: no tsx/Vite resolver can mask errors.
const {default:handler}=await import('../.local/server-build/api/web.js');
Object.assign(process.env,{APP_ORIGIN:'https://lexisoar.example',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public-key',SUPABASE_SECRET_KEY:'test-server-key',SESSION_ENCRYPTION_KEY:randomBytes(32).toString('base64')});
let body='';const headers={};const res={statusCode:200,setHeader:(name,value)=>{headers[name.toLowerCase()]=value;},end:value=>{body=String(value);}};
await handler({method:'GET',url:'/api/session',headers:{}},res);
assert.equal(res.statusCode,200);assert.equal(JSON.parse(body).needsLogin,true);assert.equal(headers['content-type'],'application/json');

const {Store}=await import('../.local/server-build/server/store.js');
const {buildApp}=await import('../.local/server-build/server/app.js');
const store=new Store(':memory:');const app=await buildApp({store,remote:{owner:'compiled-smoke-test',label:'Test',csrf:'csrf'}});
try{const response=await app.inject({url:'/api/session',headers:{host:'127.0.0.1:4180'}});assert.equal(response.statusCode,200);assert.equal(response.json().remote,true);}finally{await app.close();}
console.log('Native Node ESM: gateway, unauthenticated session and SQLite-backed remote app passed. No server was started.');
