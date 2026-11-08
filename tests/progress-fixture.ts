// Synthetic data for the isolated test workspace. Never imported by the application server.
import {Store} from '../server/store';
import {AssessmentStore} from '../server/assessment-store';
import {criterionIds} from '../shared/progress';
export function seedProgressFixture(store:Store){
 const assessmentStore=new AssessmentStore(store),existing=new Set(store.list('device').map(e=>e.id));
 const when=(days:number)=>new Date(Date.now()-days*86400000).toISOString();
 for(let i=0;i<4;i++){
  const id=`a3000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,answer='I support another trial. Better signs could help local shops.';
  const data={activityId:`speaking-${i+1}-2`,answer,source:'speech',assisted:false,result:{correct:null,objective:false},selfReview:false};
  if(!existing.has(id))store.append('device','attempt',data,id,when(8-i*2));
  assessmentStore.fromFeedback('device',{id,data},{observations:criterionIds.map(criterionId=>({criterionId,status:criterionId==='evidence'?'needs_work':criterionId==='organization'?'not_observable':'demonstrated',quote:criterionId==='organization'?'':answer,reason:criterionId==='evidence'?'Include one precise detail from the source to support your view.':criterionId==='organization'?'The short response does not reveal enough organization.':'This response gives an understandable recommendation.'}))},'synthetic-tutor');
 }
 for(let i=0;i<5;i++){const id=`a3000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`;if(!existing.has(id))store.append('device','attempt',{activityId:`reading-${i+1}-1`,answer:i===2?'wrong':'practice answer',source:'typed',assisted:false,result:{correct:i!==2,objective:true},selfReview:false},id,when(7-i));}
 for(let i=0;i<4;i++){const id=`a3000000-0000-4000-8000-${String(i+20).padStart(12,'0')}`;if(!existing.has(id))store.append('device','review',{word:['restore','evidence','maintain','alternative'][i],card:{due:when(i<2?1:-3)},log:{rating:i+1}},id,when(i+1));}
}
