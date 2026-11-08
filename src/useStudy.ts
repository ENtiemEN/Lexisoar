import {useEffect,useRef,useState} from 'react';
import {api,cacheDraft} from './api';
import type {StudyRun,RunState,FeedbackRecord} from '../shared/chapters';
export type Attempt={id:string;createdAt:string;data:any;feedback?:FeedbackRecord|null};
export type StudySnapshot={run:StudyRun;attempts:Attempt[]};
export function useStudy(initial:StudySnapshot){
 const [run,setRun]=useState(initial.run),[attempts,setAttempts]=useState(initial.attempts),[saving,setSaving]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const current=useRef(initial.run),revision=useRef(initial.run.revision),dirty=useRef(false),inFlight=useRef(false),queue=useRef<Promise<unknown>>(Promise.resolve()),timer=useRef<ReturnType<typeof setTimeout>|null>(null),mounted=useRef(true);
 function show(next:StudyRun){current.current=next;if(mounted.current)setRun(next);}
 function accept(snapshot:StudySnapshot){dirty.current=false;revision.current=snapshot.run.revision;show(snapshot.run);setAttempts(snapshot.attempts);}
 function persist():Promise<StudyRun>{
   const job=queue.current.catch(()=>{}).then(async()=>{if(!dirty.current)return current.current;if(conflict)throw Error('Reload the saved chapter before making more changes.');const state=structuredClone(current.current.state);dirty.current=false;inFlight.current=true;if(mounted.current)setSaving(true);
     try{const {run:saved}=await api<{run:StudyRun}>('study-sessions/'+current.current.id,{revision:revision.current,state},'PATCH');revision.current=saved.revision;show({...saved,state:dirty.current?current.current.state:saved.state});if(mounted.current)setError('');return saved;}
     catch(e){dirty.current=true;if(mounted.current){setError((e as Error).message);if((e as any).status===409)setConflict(true);}throw e;}
     finally{inFlight.current=false;if(mounted.current)setSaving(false);}
   });queue.current=job;return job;
 }
 function edit(change:(state:RunState)=>void){if(conflict)return;const state=structuredClone(current.current.state);change(state);show({...current.current,state});dirty.current=true;cacheDraft('study-sessions/'+current.current.id,{revision:revision.current,state});if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void persist().catch(()=>{}),650);}
 useEffect(()=>{mounted.current=true;const unload=(e:BeforeUnloadEvent)=>{if(dirty.current||inFlight.current){e.preventDefault();e.returnValue='';}};const hide=()=>{if(document.visibilityState==='hidden')void persist().catch(()=>{});};window.addEventListener('beforeunload',unload);document.addEventListener('visibilitychange',hide);return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current);window.removeEventListener('beforeunload',unload);document.removeEventListener('visibilitychange',hide);};},[]);
 return {run,attempts,saving,unsaved:dirty.current,error,conflict,edit,persist,accept,setAttempts,current,revision};
}
