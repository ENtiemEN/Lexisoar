import {useEffect,useRef,useState} from 'react';
import {api,cacheDraft,discardPending,webAccount} from './api';
import type {StudyRun,RunState,FeedbackRecord} from '../shared/chapters';
export type Attempt={id:string;createdAt:string;data:any;feedback?:FeedbackRecord|null};
export type StudySnapshot={run:StudyRun;attempts:Attempt[]};
export function useStudy(initial:StudySnapshot){
 const [run,setRun]=useState(initial.run),[attempts,setAttempts]=useState(initial.attempts),[saving,setSaving]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const current=useRef(initial.run),revision=useRef(initial.run.revision),dirty=useRef(false),inFlight=useRef(false),queue=useRef<Promise<unknown>>(Promise.resolve()),timer=useRef<ReturnType<typeof setTimeout>|null>(null),mounted=useRef(true),conflicted=useRef(false),stopped=useRef(false),edits=useRef(0),controller=useRef<AbortController|null>(null);
 function show(next:StudyRun){current.current=next;if(mounted.current)setRun(next);}
 function accept(snapshot:StudySnapshot){dirty.current=false;conflicted.current=false;setConflict(false);revision.current=snapshot.run.revision;show(snapshot.run);setAttempts(snapshot.attempts);}
 function persist():Promise<StudyRun>{
   const job=queue.current.catch(()=>{}).then(async()=>{if(!dirty.current)return current.current;if(stopped.current)throw Error('Saving was stopped. Your local draft is preserved.');if(conflicted.current)throw Error('Reload the saved chapter before making more changes.');const state=structuredClone(current.current.state),generation=edits.current;controller.current=new AbortController();dirty.current=false;inFlight.current=true;if(mounted.current)setSaving(true);
     try{const {run:saved}=await api<{run:StudyRun}>('study-sessions/'+current.current.id,{revision:revision.current,state},'PATCH',{signal:controller.current.signal});revision.current=saved.revision;show({...saved,state:edits.current!==generation?current.current.state:saved.state});if(mounted.current)setError('');return saved;}
     catch(e){dirty.current=true;if(mounted.current){setError((e as Error).message);if((e as any).status===409){conflicted.current=true;setConflict(true);}}throw e;}
     finally{inFlight.current=false;if(mounted.current)setSaving(false);}
   });queue.current=job;return job;
 }
 function edit(change:(state:RunState)=>void){if(conflicted.current||stopped.current)return;edits.current++;const state=structuredClone(current.current.state);change(state);show({...current.current,state});dirty.current=true;cacheDraft('study-sessions/'+current.current.id,{revision:revision.current,state});if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void persist().catch(()=>{}),650);}
 useEffect(()=>{mounted.current=true;const unload=(e:BeforeUnloadEvent)=>{if(dirty.current||inFlight.current){e.preventDefault();e.returnValue='';}};const hide=()=>{if(document.visibilityState==='hidden')void persist().catch(()=>{});};window.addEventListener('beforeunload',unload);document.addEventListener('visibilitychange',hide);return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current);window.removeEventListener('beforeunload',unload);document.removeEventListener('visibilitychange',hide);};},[]);
 function retain(){const value={revision:revision.current,state:current.current.state};cacheDraft('study-sessions/'+current.current.id,value);try{localStorage.setItem('lexisoar-story-recovery:'+webAccount().owner+':'+current.current.id,JSON.stringify(value));return true;}catch{return false;}}
 function stopSaving(confirmed=false){if(confirmed){discardPending('study-sessions/'+current.current.id+':draft');try{localStorage.removeItem('lexisoar-story-recovery:'+webAccount().owner+':'+current.current.id);}catch{}}else retain();stopped.current=true;if(timer.current)clearTimeout(timer.current);controller.current?.abort();}
 return {retain,stopSaving,cancelSave:()=>controller.current?.abort(),run,attempts,saving,unsaved:dirty.current,error,conflict,edit,persist,accept,setAttempts,current,revision};
}
