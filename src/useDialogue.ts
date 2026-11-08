import {useEffect,useRef,useState} from 'react';
import {cityDialogue} from '../shared/chapters';
export function useDialogue(){
 const [playing,setPlaying]=useState(false),[speaker,setSpeaker]=useState(-1),[error,setError]=useState('');const active=useRef(false);
 function stop(){active.current=false;window.speechSynthesis?.cancel();setPlaying(false);setSpeaker(-1);}
 function play(){if(!('speechSynthesis'in window)){setError('Audio playback is unavailable. Open the transcript to continue.');return;}stop();setError('');active.current=true;setPlaying(true);const voices=speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en'));function next(i:number){if(!active.current)return;if(i>=cityDialogue.length){stop();return;}setSpeaker(i);const turn=cityDialogue[i];const u=new SpeechSynthesisUtterance(turn.text);u.lang='en-US';u.rate=0.93;const v=voices[turn.speaker==='Maya'?0:1]??voices[0];if(v)u.voice=v;u.onend=()=>next(i+1);u.onerror=e=>{if(e.error==='canceled'||e.error==='interrupted')return;stop();setError('Playback stopped. You can replay or read the transcript.');};speechSynthesis.speak(u);}next(0);}
 useEffect(()=>()=>{active.current=false;window.speechSynthesis?.cancel();},[]);
 return {playing,speaker,error,play,stop};
}
