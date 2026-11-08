import { spawn } from 'node:child_process';
import readline from 'node:readline';
export class CodexClient {
  constructor() {
    this.seq=0; this.pending=new Map(); this.listeners=new Set();
    this.child=spawn('C:/Users/usuario/AppData/Local/Programs/OpenAI/Codex/bin/codex.exe',['app-server'],{stdio:['pipe','pipe','pipe']});
    this.lines=readline.createInterface({input:this.child.stdout});
    this.lines.on('line',line=>{let m;try{m=JSON.parse(line)}catch{return;}const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);} else if(m.id!==undefined&&m.method){this.send({id:m.id,error:{code:-32601,message:'This test client does not permit tools or approvals.'}});}for(const f of this.listeners) f(m);});
  }
  send(m){this.child.stdin.write(JSON.stringify(m)+'\n');}
  rpc(method,params={}){return new Promise((resolve,reject)=>{const id=++this.seq;const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Timeout: '+method));},30000);this.pending.set(id,{resolve,reject,timer});this.send({id,method,params});});}
  async init(){await this.rpc('initialize',{clientInfo:{name:'english_learning_feasibility',title:'English Learning Feasibility',version:'0.1.0'}});this.send({method:'initialized',params:{}});}
  close(){for(const p of this.pending.values())clearTimeout(p.timer);this.child.stdin.end();this.child.kill();}
}
