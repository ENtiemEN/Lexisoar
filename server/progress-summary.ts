import {activities,type Activity,type Skill} from '../shared/content.js';
import {chapters,type Scene,type StudyRun} from '../shared/chapters.js';
import {criteria,RUBRIC_VERSION,type Assessment,type EvidenceMetric,type EvidenceCohort,type ProgressSummary,type ProgressPattern,type SkillProgress,type HistoryItem} from '../shared/progress.js';
import {responseHash} from './assessment-store.js';

export type LearningEvent={id:string;kind:string;createdAt:string;data:any};
export type ResolvedAttempt={event:LearningEvent;activity:Activity;scene:Scene|null;first:boolean;rootId:string;assisted:boolean;assessment:Assessment|null;canAssess:boolean;version:string};
const skills:Skill[]=['Reading','Listening','Speaking','Writing'];
const emptyMetric=():EvidenceMetric=>({numerator:0,denominator:0,samples:0,notObservable:0});
const objectiveLabels:Record<string,string>={'Complete the Words':'Word completion','Read in Daily Life':'Everyday details','Read an Academic Passage':'Academic reading','Listen and Choose a Response':'Response intent','Listen to a Conversation':'Conversation details','Listen to an Announcement':'Announcement details','Listen to an Academic Talk':'Academic listening','Build a Sentence':'Sentence construction'};
export function dayKey(date:Date,timeZone:string){return new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function shiftDay(key:string,days:number){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function dayDifference(a:string,b:string){return Math.round((Date.parse(b+'T12:00Z')-Date.parse(a+'T12:00Z'))/86400000);}
export function resolveAttempts(events:LearningEvent[],runs:StudyRun[],assessments:Assessment[]):ResolvedAttempt[]{
 const runMap=new Map(runs.map(r=>[r.id,r])),records=events.filter(e=>e.kind==='attempt').sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
 const known=new Map(records.map(e=>[e.id,e])),legacyFirst=new Map<string,string>(),assessmentMap=new Map(assessments.filter(a=>a.status==='complete'&&a.rubricVersion===RUBRIC_VERSION).map(a=>[a.attemptId,a]));
 return records.flatMap(event=>{
  const d=event.data,run=runMap.get(d.runId);let scene=run?.chapter.scenes.find(s=>s.id===d.sceneId&&s.activity.id===d.activityId)??null;
  if(!scene&&d.chapterId){const c=chapters.find(c=>c.id===d.chapterId&&c.version===d.chapterVersion);scene=c?.scenes.find(s=>s.id===d.sceneId&&s.activity.id===d.activityId)??null;}
  const activity=scene?.activity??activities.find(a=>a.id===d.activityId);if(!activity||!Number.isFinite(Date.parse(event.createdAt)))return [];
  let first:boolean,rootId:string;
  if(d.runId){first=!d.parentAttemptId;rootId=event.id;let parent=d.parentAttemptId;const seen=new Set([event.id]);while(parent&&known.has(parent)&&!seen.has(parent)){const p=known.get(parent)!;if(p.data.runId!==d.runId||p.data.activityId!==d.activityId)break;seen.add(parent);rootId=p.id;parent=p.data.parentAttemptId;}}
  else{if(!legacyFirst.has(activity.id))legacyFirst.set(activity.id,event.id);rootId=legacyFirst.get(activity.id)!;first=rootId===event.id;}
  const candidate=assessmentMap.get(event.id),assessment=candidate?.sourceHash===responseHash(String(d.answer??''))?candidate:null;
  return [{event,activity,scene,first,rootId,assisted:d.assisted===true,assessment,canAssess:(activity.skill==='Speaking'||activity.skill==='Writing')&&!activity.answer&&d.result?.objective!==true&&['speech','typed'].includes(d.source)&&!!String(d.answer??'').trim(),version:d.runId?`chapter-${d.chapterVersion??run?.chapterVersion??'unknown'}`:'legacy-1'}];
 });
}
export function makeRange(period:ProgressSummary['range']['period'],timeZone:string,events:LearningEvent[],now:Date){
 const end=dayKey(now,timeZone),valid=events.map(e=>Date.parse(e.createdAt)).filter(t=>Number.isFinite(t)&&t<=now.getTime()).map(t=>dayKey(new Date(t),timeZone)).sort();
 const start=period==='all'?(valid[0]??end):shiftDay(end,-Number(period)+1),days=dayDifference(start,end)+1;
 return {period,timeZone,start,end,previousStart:shiftDay(start,-days),previousEnd:shiftDay(start,-1)};
}
function addMetric(a:EvidenceMetric,b:EvidenceMetric){a.numerator+=b.numerator;a.denominator+=b.denominator;a.samples+=b.samples;a.notObservable+=b.notObservable;}
function metric(attempt:ResolvedAttempt,kind:'objective'|'tutor'):EvidenceMetric{
 if(kind==='objective'){
  const checks=Array.isArray(attempt.event.data.result?.checks)?attempt.event.data.result.checks.filter((c:any)=>typeof c.correct==='boolean'):[];
  const values:boolean[]=checks.length?checks.map((c:any)=>c.correct):typeof attempt.event.data.result?.correct==='boolean'?[attempt.event.data.result.correct]:[];
  return {numerator:values.filter(Boolean).length,denominator:values.length,samples:values.length?1:0,notObservable:0};
 }
 const obs=attempt.assessment?.observations??[],observable=obs.filter(o=>o.status!=='not_observable');
 return {numerator:obs.filter(o=>o.status==='demonstrated').length,denominator:observable.length,samples:observable.length?1:0,notObservable:obs.length-observable.length};
}
function targetFor(skill:Skill,events:LearningEvent[],criterion?:string){
 const task=skill==='Writing'?(criterion==='evidence'||criterion==='development'?'Write for an Academic Discussion':'Write an Email'):skill==='Speaking'?'Take an Interview':null;
 const pool=activities.filter(a=>a.skill===skill&&(!task||a.type===task)),done=new Set(events.filter(e=>e.kind==='attempt').map(e=>e.data.activityId));
 return {kind:'practice' as const,id:(pool.find(a=>!done.has(a.id))??pool[0])?.id};
}
export function buildProgressSummary({events,runs,assessments,period='28',timeZone='UTC',now=new Date()}:{events:LearningEvent[];runs:StudyRun[];assessments:Assessment[];period?:ProgressSummary['range']['period'];timeZone?:string;now?:Date}):ProgressSummary{
 const range=makeRange(period,timeZone,events,now),all=resolveAttempts(events,runs,assessments).filter(a=>Date.parse(a.event.createdAt)<=now.getTime());
 const dateOf=(a:ResolvedAttempt)=>dayKey(new Date(a.event.createdAt),timeZone);
 const inRange=(d:string,start=range.start,end=range.end)=>d>=start&&d<=end;
 const current=all.filter(a=>inRange(dateOf(a))),firsts=current.filter(a=>a.first),retries=current.filter(a=>!a.first);
 const days=dayDifference(range.start,range.end)+1;
 function bucket(date:string){if(period==='all'&&days>90)return date.slice(0,7)+'-01';if(days>7)return shiftDay(range.start,Math.floor(dayDifference(range.start,date)/7)*7);return date;}
 const buckets:string[]=[];for(let d=range.start;d<=range.end;d=shiftDay(d,1)){const b=bucket(d);if(!buckets.includes(b))buckets.push(b);}
 const skillRows:SkillProgress[]=skills.map(skill=>{
  const own=current.filter(a=>a.activity.skill===skill),eligible=all.filter(a=>a.activity.skill===skill&&a.first&&!a.assisted),groups=new Map<string,{kind:'objective'|'tutor';model?:string;rubricVersion:string;label:string;items:ResolvedAttempt[];latest:number}>();
  for(const a of eligible){
   const objective=metric(a,'objective').denominator>0;if(!objective&&!a.assessment)continue;
   const kind=objective?'objective':'tutor',model=objective?undefined:a.assessment!.model,rubricVersion=objective?'objective-1':a.assessment!.rubricVersion,key=[a.activity.type,a.version,rubricVersion,model??''].join('|');
   if(!groups.has(key))groups.set(key,{kind,model,rubricVersion,label:a.activity.type,items:[],latest:0});const group=groups.get(key)!;group.items.push(a);group.latest=Math.max(group.latest,Date.parse(a.event.createdAt));
  }
  const cohorts:EvidenceCohort[]=[...groups.entries()].sort((a,b)=>b[1].latest-a[1].latest).map(([key,g])=>{
   const cur=emptyMetric(),prev=emptyMetric(),series=buckets.map(date=>({date,label:new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(date+'T12:00Z')),metric:emptyMetric()}));
   for(const a of g.items){const d=dateOf(a),m=metric(a,g.kind);if(inRange(d)){addMetric(cur,m);const point=series.find(p=>p.date===bucket(d));if(point)addMetric(point.metric,m);}else if(inRange(d,range.previousStart,range.previousEnd))addMetric(prev,m);}
   const enough=period!=='all'&&cur.samples>=5&&prev.samples>=5&&cur.denominator>0&&prev.denominator>0;
   return {key,label:g.label,kind:g.kind,rubricVersion:g.rubricVersion,model:g.model,current:cur,previous:prev,series,trend:{available:enough,delta:enough?Math.round((cur.numerator/cur.denominator-prev.numerator/prev.denominator)*100):null,reason:period==='all'?'All recorded practice — no previous period comparison.':enough?'Same task family, content version and assessment method.':'More evidence needed: five unassisted first responses in each period.'}};
  });
  return {skill,firstResponses:own.filter(a=>a.first).length,retries:own.filter(a=>!a.first).length,withHelp:own.filter(a=>a.assisted).length,activeDays:new Set(own.map(dateOf)).size,unassessed:own.filter(a=>a.first&&a.canAssess&&!a.assessment).length,cohorts};
 });
 const patterns=new Map<string,{pattern:ProgressPattern;activities:Set<string>;examples:ProgressPattern['examples']}>();
 for(const a of firsts.filter(a=>!a.assisted)){
  const observations:{id:string;label:string;status:string;quote:string;reason:string;source:'objective'|'tutor'}[]=[];
  if((a.activity.skill==='Reading'||a.activity.skill==='Listening')&&typeof a.event.data.result?.correct==='boolean')observations.push({id:a.activity.type,label:objectiveLabels[a.activity.type]??a.activity.type,status:a.event.data.result.correct?'demonstrated':'needs_work',quote:String(a.event.data.answer),reason:a.event.data.result.feedback??a.activity.explanation,source:'objective'});
  if(a.assessment)for(const o of a.assessment.observations)observations.push({id:o.criterionId,label:criteria[o.criterionId],status:o.status,quote:o.quote,reason:o.reason,source:'tutor'});
  for(const o of observations){if(o.status==='not_observable')continue;const key=[a.activity.skill,o.source,o.id].join('|');if(!patterns.has(key))patterns.set(key,{pattern:{id:key,label:o.label,skill:a.activity.skill,source:o.source,count:0,opportunities:0,activities:0,recurrent:false,examples:[],target:targetFor(a.activity.skill,events,o.id)},activities:new Set(),examples:[]});const group=patterns.get(key)!;group.pattern.opportunities++;if(o.status==='needs_work'){group.pattern.count++;group.activities.add(a.activity.id);group.examples.push({attemptId:a.event.id,date:a.event.createdAt,quote:o.quote.slice(0,650),reason:o.reason});}}
 }
 const ranked=[...patterns.values()].filter(g=>g.pattern.count>0).map(g=>({...g.pattern,activities:g.activities.size,recurrent:g.pattern.count>=3&&g.activities.size>=2,examples:g.examples.slice(-3).reverse()})).sort((a,b)=>Number(b.recurrent)-Number(a.recurrent)||b.count-a.count||Date.parse(b.examples[0].date)-Date.parse(a.examples[0].date));
 const top=ranked[0],least=[...skillRows].sort((a,b)=>a.firstResponses-b.firstResponses)[0];
 const focus=top?{title:top.label,reason:`${top.count} of ${top.opportunities} evaluated first responses · ${top.recurrent?'recurring pattern':'recent observation'}${top.source==='tutor'?' · tutor-observed':''}.`,skill:top.skill,target:top.target}:{title:firsts.length?'Make room for '+least.skill.toLowerCase():'Begin with a first response',reason:firsts.length?`${least.skill} has ${least.firstResponses} first responses in this period.`:'Complete a practice task to start collecting evidence.',skill:least.skill,target:targetFor(least.skill,events)};
 const reviews=events.filter(e=>e.kind==='review'&&Date.parse(e.createdAt)<=now.getTime()),latestCards=new Map<string,any>();for(const e of [...reviews].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)))if(e.data.card)latestCards.set(e.data.word,e.data.card);
 const ratings=['Again','Hard','Good','Easy'].map((label,i)=>({label,rating:i+1,count:reviews.filter(e=>inRange(dayKey(new Date(e.createdAt),timeZone))&&Number(e.data.log?.rating??e.data.rating)===i+1).length}));
 const revisions={objectiveCorrected:0,objectivePairs:0,tutorResolved:0,tutorPairs:0};const rootMap=new Map(all.filter(a=>a.first).map(a=>[a.event.id,a]));const latestRetries=new Map<string,ResolvedAttempt>();for(const a of retries)latestRetries.set(a.rootId,a);
 for(const [rootId,last]of latestRetries){const root=rootMap.get(rootId);if(!root)continue;if(root.event.data.result?.correct===false&&typeof last.event.data.result?.correct==='boolean'){revisions.objectivePairs++;if(last.event.data.result.correct)revisions.objectiveCorrected++;}if(root.assessment&&last.assessment&&root.assessment.rubricVersion===last.assessment.rubricVersion&&root.assessment.model===last.assessment.model){for(const o of root.assessment.observations.filter(o=>o.status==='needs_work')){const later=last.assessment.observations.find(p=>p.criterionId===o.criterionId);if(later&&later.status!=='not_observable'){revisions.tutorPairs++;if(later.status==='demonstrated')revisions.tutorResolved++;}}}}
 return {range,activeDays:new Set(current.map(dateOf)).size,firstResponses:firsts.length,retries:retries.length,skills:skillRows,patterns:ranked.slice(0,3),focus,review:{due:[...latestCards.values()].filter(c=>Date.parse(c.due)<=now.getTime()).length,total:latestCards.size,ratings},revisions};
}
export function historyItems(events:LearningEvent[],runs:StudyRun[],assessments:Assessment[],view:'responses'|'chapters'|'recordings'):HistoryItem[]{
 if(view==='chapters')return runs.map(r=>({id:r.id,date:r.updatedAt,kind:view,title:r.chapter.title,skill:null,runId:r.id,status:r.state.status}));
 if(view==='recordings')return events.filter(e=>e.kind==='audio').map(e=>({id:e.id,date:e.createdAt,kind:view,title:'Local recording',skill:'Speaking',audioId:e.id}));
 const assessmentMap=new Map(assessments.map(a=>[a.attemptId,a]));return resolveAttempts(events,runs,assessments).reverse().map(a=>({id:a.event.id,date:a.event.createdAt,kind:view,title:a.activity.type,skill:a.activity.skill,answer:a.event.data.answer,source:a.event.data.source,assisted:a.assisted,first:a.first,result:a.event.data.result,audioId:a.event.data.audioId,runId:a.event.data.runId,assessment:assessmentMap.get(a.event.id)??null,canAssess:a.canAssess,activityId:a.activity.id}));
}
