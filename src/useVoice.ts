import {useEffect,useRef,useState} from 'react';

export function speak(text:string,rate=0.95){
 if(!('speechSynthesis'in window))return;
 speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text.replace(/[*#`]/g,''));
 utterance.lang='en-US';utterance.rate=rate;
 const voices=speechSynthesis.getVoices();
 const voice=voices.find(v=>v.lang==='en-US')??voices.find(v=>v.lang.startsWith('en'));
 if(voice)utterance.voice=voice;
 speechSynthesis.speak(utterance);
}

export function useVoice(onText:(text:string)=>void){
 const [recording,setRecording]=useState(false),[stopping,setStopping]=useState(false),[error,setError]=useState(''),[blob,setBlob]=useState<Blob|null>(null),[preview,setPreview]=useState('');
 const mounted=useRef(true),active=useRef(false),starting=useRef(false),recognition=useRef<any>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null);
 const chunks=useRef<Blob[]>([]),final=useRef(''),callback=useRef(onText),timer=useRef<ReturnType<typeof setTimeout>|null>(null),settleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const recordingDone=useRef(true),recognitionDone=useRef(true),recognitionFailed=useRef(false);
 callback.current=onText;
 const startEpoch=useRef(0);const latestBlob=useRef<Blob|null>(null),waiters=useRef<((blob:Blob|null)=>void)[]>([]);
 function stopAndWait():Promise<Blob|null>{if(recordingDone.current&&recognitionDone.current&&!active.current)return Promise.resolve(latestBlob.current);return new Promise(resolve=>{waiters.current.push(resolve);stop();setTimeout(()=>{if(waiters.current.includes(resolve)){stream.current?.getTracks().forEach(t=>t.stop());recognition.current?.abort();recordingDone.current=true;recognitionDone.current=true;finishStop();if(mounted.current)setError('Recording did not finish normally. Check your transcript and any available audio.');}},5000);});}
 function finishStop(){
  if(!recordingDone.current||!recognitionDone.current)return;
  if(settleTimer.current)clearTimeout(settleTimer.current);
  stream.current?.getTracks().forEach(t=>t.stop());
  if(mounted.current)setStopping(false);for(const resolve of waiters.current.splice(0))resolve(latestBlob.current);
 }
 function stop(){
  startEpoch.current++;active.current=false;
  if(timer.current)clearTimeout(timer.current);
  if(mounted.current){setRecording(false);setStopping(true);}
  const r=recorder.current;
  if(r?.state==='recording')r.stop();else recordingDone.current=true;
  try{recognition.current?.stop();}catch{recognitionDone.current=true;}
  // A provider may fail to emit recognition.onend; accept final results only during this grace period.
  settleTimer.current=setTimeout(()=>{recognitionDone.current=true;finishStop();},1500);
  finishStop();
 }
 useEffect(()=>{mounted.current=true;return()=>{
  mounted.current=false;active.current=false;recognitionDone.current=true;
  try{recognition.current?.abort();}catch{}
  if(recorder.current?.state==='recording')recorder.current.stop();
  stream.current?.getTracks().forEach(t=>t.stop());
  if(timer.current)clearTimeout(timer.current);
  if(settleTimer.current)clearTimeout(settleTimer.current);
  window.speechSynthesis?.cancel();
 };},[]);
 useEffect(()=>{if(!blob){setPreview('');return;}const url=URL.createObjectURL(blob);setPreview(url);return()=>URL.revokeObjectURL(url);},[blob]);
 async function start(){
  if(starting.current||active.current||stopping)return;
  const epoch=++startEpoch.current;starting.current=true;setError('');latestBlob.current=null;setBlob(null);final.current='';callback.current('');
  recognition.current=null;recognitionDone.current=true;recordingDone.current=false;recognitionFailed.current=false;
  try{
   let expired=false;const permission=navigator.mediaDevices.getUserMedia({audio:true});void permission.then(late=>{if(expired||!mounted.current)late.getTracks().forEach(t=>t.stop());}).catch(()=>{});let permissionTimer:ReturnType<typeof setTimeout>;const media=await Promise.race([permission,new Promise<never>((_,reject)=>{permissionTimer=setTimeout(()=>{expired=true;reject(Error('Microphone permission timed out.'));},15000);})]).finally(()=>clearTimeout(permissionTimer));
   if(!mounted.current||epoch!==startEpoch.current){media.getTracks().forEach(t=>t.stop());return;}
   stream.current=media;active.current=true;setRecording(true);chunks.current=[];
   const mime=['audio/webm','audio/ogg','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(media,mime?{mimeType:mime}:undefined);recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
   r.onstop=()=>{recordingDone.current=true;latestBlob.current=new Blob(chunks.current,{type:r.mimeType.split(';')[0]});if(mounted.current)setBlob(latestBlob.current);finishStop();};
   r.onerror=()=>{setError('Recording stopped unexpectedly. Review any saved transcript before continuing.');stop();};
   r.start();
   timer.current=setTimeout(()=>{stop();if(mounted.current)setError('The five-minute safety limit was reached. Review your recording before sending.');},300000);
   const Constructor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
   if(!Constructor){setError('Live transcription is unavailable. Recording still works; type a transcript before sending.');return;}
   const rec=new Constructor();recognition.current=rec;recognitionDone.current=false;
   rec.lang='en-US';rec.continuous=true;rec.interimResults=true;
   rec.onresult=(event:any)=>{
    if(!mounted.current||(!active.current&&recognitionDone.current))return;
    let interim='';
    for(let i=event.resultIndex;i<event.results.length;i++){
     if(event.results[i].isFinal)final.current+=event.results[i][0].transcript+' ';
     else interim+=event.results[i][0].transcript;
    }
    callback.current((final.current+interim).trim());
   };
   rec.onend=()=>{
    if(active.current&&!recognitionFailed.current){try{rec.start();}catch{recognitionDone.current=true;setError('Transcription paused. Recording continues. Stop and review your response.');}}
    else{recognitionDone.current=true;finishStop();}
   };
   rec.onerror=(e:any)=>{
    if(e.error==='no-speech'||e.error==='aborted')return;
    recognitionFailed.current=true;recognitionDone.current=true;
    if(mounted.current)setError('Transcription is unavailable. Recording continues; stop and review or type a transcript.');
    finishStop();
   };
   rec.start();
  }catch{
   recordingDone.current=recorder.current?.state!=='recording';recognitionDone.current=true;stop();
   if(mounted.current)setError('Microphone could not start. Check browser permissions or type your response.');
  }finally{starting.current=false;}
 }
 return {recording,stopping,error,blob,preview,start,stop,stopAndWait};
}
