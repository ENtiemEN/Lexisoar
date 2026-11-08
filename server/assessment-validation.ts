import {z} from 'zod';
import type {Observation} from '../shared/progress.js';
export const observationSchema=z.object({criterionId:z.enum(['task_fulfillment','evidence','development','organization','language_clarity']),status:z.enum(['demonstrated','needs_work','not_observable']),quote:z.string().max(650),reason:z.string().min(1).max(450)}).strict();
export function validatedObservations(value:unknown,answer:string,source:string):Observation[]|null{
 const parsed=z.array(observationSchema).length(5).safeParse(value);if(!parsed.success)return null;
 const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 if(new Set(parsed.data.map(o=>o.criterionId)).size!==5)return null;
 for(const o of parsed.data){if(o.status!=='not_observable'&&(!normalize(o.quote)||!normalize(answer).includes(normalize(o.quote))))return null;if(o.quote&&!normalize(answer).includes(normalize(o.quote)))return null;if(source==='speech'&&/capitalization|capitalisation|punctuation|spelling|orthograph|comma placement/i.test(o.reason))return null;}
 return parsed.data;
}
