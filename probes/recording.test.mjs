import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
test('a pause never sends a message; recording restarts and Stop preserves the full transcript',async()=>{
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:true,disabled:false,readOnly:false,textContent:'',addEventListener(){},replaceChildren(){},append(){}});return elements.get(id);};
 let instance;let fetches=0;
 class Recognition{constructor(){instance=this;this.starts=0;}start(){this.starts++;this.onstart?.();}stop(){this.onend?.();}}
 const context=vm.createContext({document:{getElementById:element,createElement:()=>({append(){}}),createTextNode:x=>x},window:{SpeechRecognition:Recognition,addEventListener(){}},performance:{now:()=>1234},fetch:()=>{fetches++;throw Error('Unexpected network request');},AbortController,Option:class{}});
 vm.runInContext(await readFile(new URL('conversation.js',import.meta.url),'utf8'),context);
 element('chat-talk').onclick();assert.equal(instance.continuous,true);
 const result=text=>Object.assign([{transcript:text}],{isFinal:true});
 instance.onresult({results:[result('I enjoy reading')]});instance.onend();
 assert.equal(instance.starts,2);assert.equal(fetches,0);assert.equal(element('chat-send').disabled,true);
 instance.onresult({results:[result('and drawing robots')]});element('chat-stop').onclick();
 assert.equal(element('chat-input').value,'I enjoy reading and drawing robots');assert.equal(element('chat-input').readOnly,false);assert.equal(element('chat-send').disabled,false);assert.equal(fetches,0);
 assert.match(element('chat-state').textContent,/then press Send/);
});
