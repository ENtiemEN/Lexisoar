import {createHash} from 'node:crypto';
import type {Store} from './store';
import {RUBRIC_VERSION,type Assessment} from '../shared/progress';
import {validatedObservations} from './assessment-validation';
export const responseHash=(answer:string)=>createHash('sha256').update(answer).digest('hex');
export class AssessmentStore{
 constructor(private store:Store){store.raw.exec('CREATE TABLE IF NOT EXISTS progress_assessments(owner TEXT NOT NULL,attempt_id TEXT NOT NULL,rubric_version TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,attempt_id,rubric_version));');}
 get(owner:string,attemptId:string,version=RUBRIC_VERSION):Assessment|null{const row=this.store.raw.prepare('SELECT data FROM progress_assessments WHERE owner=? AND attempt_id=? AND rubric_version=?').get(owner,attemptId,version) as any;if(!row)return null;const record=JSON.parse(row.data) as Assessment;if(record.status==='pending'&&Date.now()-new Date(record.createdAt).getTime()>120000)return {...record,status:'failed',error:'Assessment was interrupted. Select this response to retry.'};return record;}
 list(owner:string):Assessment[]{return (this.store.raw.prepare('SELECT data FROM progress_assessments WHERE owner=?').all(owner) as any[]).map(row=>JSON.parse(row.data));}
 put(owner:string,record:Assessment){this.store.raw.prepare('INSERT INTO progress_assessments VALUES(?,?,?,?) ON CONFLICT(owner,attempt_id,rubric_version) DO UPDATE SET data=excluded.data').run(owner,record.attemptId,record.rubricVersion,JSON.stringify(record));return record;}
 fromFeedback(owner:string,attempt:{id:string;data:any},feedback:{observations?:unknown},model:string,origin:Assessment['origin']='feedback'){
  const observations=validatedObservations(feedback.observations,attempt.data.answer,attempt.data.source);
  return this.put(owner,{attemptId:attempt.id,rubricVersion:RUBRIC_VERSION,model,status:observations?'complete':'unavailable',observations:observations??[],sourceHash:responseHash(attempt.data.answer),origin,createdAt:new Date().toISOString(),...(!observations?{error:'No valid structured observations are available. The written feedback is still preserved.'}:{})});
 }
}
