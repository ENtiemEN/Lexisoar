import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorReply, chooseModel } from './tutor-service.mjs';
function stream(events) { const bytes = new TextEncoder().encode(events.map(e => 'data: ' + JSON.stringify(e) + '\r\n\r\n').join('')); return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close();}})); }
test('uses supplied OAuth credential, bounded history, streaming, and explicit completion',async()=>{
 let request;let deltas='';const history=Array.from({length:14},(_,i)=>({role:i%2?'assistant':'user',text:'Turn '+i}));
 const reply=await tutorReply({accessToken:'test-only',model:'catalog-model',history,message:'Hello',onDelta:d=>deltas+=d,fetchImpl:async(url,options)=>{request={url,...options};return stream([{type:'response.output_text.delta',delta:'Hello — '},{type:'response.output_text.delta',delta:'how are you?'},{type:'response.completed',response:{usage:{input_tokens:12}}}]);}});
 assert.equal(reply.text,'Hello — how are you?');assert.equal(deltas,reply.text);assert.equal(request.headers.Authorization,'Bearer test-only');
 const body=JSON.parse(request.body);assert.equal(body.store,false);assert.equal(body.stream,true);assert.equal(body.input.length,11);assert.equal(body.input[0].content,'Turn 4');
});
test('rejects truncated, failed, and rate-limited responses without switching providers',async()=>{
 for(const response of [stream([{type:'response.output_text.delta',delta:'Partial'}]),stream([{type:'response.failed',response:{error:{message:'Limit reached'}}}]),new Response('',{status:429})]){
  let calls=0;await assert.rejects(tutorReply({accessToken:'test-only',model:'m',history:[],message:'Hi',fetchImpl:async()=>{calls++;return response;}}));assert.equal(calls,1);
 }
});
test('selects only models present in the account catalog',()=>{assert.deepEqual(chooseModel({models:[{slug:'hidden',visibility:'hidden'},{slug:'available',visibility:'list'}]}),{models:[{id:'available',name:'available'}],selected:'available'});assert.throws(()=>chooseModel({models:[]}));});
test('speech and writing have distinct feedback rules; speech provenance survives history',async()=>{
 const requests=[];for(const source of ['speech','typed','unknown'])await tutorReply({accessToken:'test-only',model:'m',source,message:'hi my name is enrique',history:[{role:'user',text:'i like reading',source:'speech'}],fetchImpl:async(_url,options)=>{requests.push(JSON.parse(options.body));return stream([{type:'response.output_text.delta',delta:'Hello! What do you enjoy reading?'},{type:'response.completed',response:{}}]);}});
 assert.match(requests[0].instructions,/CURRENT INPUT: automatic speech transcript/);
 assert.match(requests[0].instructions,/Do not give capitalization, punctuation, spelling, or formatting feedback/);
 assert.match(requests[0].input[0].content,/^\[Automatic speech transcript\]/);
 assert.match(requests[1].instructions,/CURRENT INPUT: typed by the learner/);
 assert.match(requests[2].instructions,/CURRENT INPUT: source unknown/);
});
