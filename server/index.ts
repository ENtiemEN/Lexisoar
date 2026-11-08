import {buildApp} from './app.js';
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const port=Number(process.env.PORT||4180);
const app=await buildApp({port});
await app.listen({port,host:'127.0.0.1'});
console.log(`LexiSoar: http://127.0.0.1:${port}`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void app.close().then(()=>process.exit(0));});
