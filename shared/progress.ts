import type {Skill} from './content';

export const RUBRIC_VERSION='stride-criteria-1';
export const criteria={
 task_fulfillment:'Answering the task',evidence:'Using evidence',development:'Developing ideas',organization:'Organizing ideas',language_clarity:'Language clarity',
} as const;
export type CriterionId=keyof typeof criteria;
export const criterionIds=Object.keys(criteria) as CriterionId[];
export type Observation={criterionId:CriterionId;status:'demonstrated'|'needs_work'|'not_observable';quote:string;reason:string};
export type Assessment={attemptId:string;rubricVersion:string;model:string;status:'complete'|'pending'|'failed'|'unavailable';observations:Observation[];sourceHash:string;origin:'feedback'|'requested';createdAt:string;error?:string};
export type ProgressTarget={kind:'practice'|'review';id?:string};
export type ProgressPattern={id:string;label:string;skill:Skill;source:'objective'|'tutor';count:number;opportunities:number;activities:number;recurrent:boolean;examples:{attemptId:string;date:string;quote:string;reason:string}[];target:ProgressTarget};
export type EvidenceMetric={numerator:number;denominator:number;samples:number;notObservable:number};
export type EvidenceCohort={key:string;label:string;kind:'objective'|'tutor';rubricVersion:string;model?:string;current:EvidenceMetric;previous:EvidenceMetric;series:{date:string;label:string;metric:EvidenceMetric}[];trend:{available:boolean;delta:number|null;reason:string}};
export type SkillProgress={skill:Skill;firstResponses:number;retries:number;withHelp:number;activeDays:number;unassessed:number;cohorts:EvidenceCohort[]};
export type HistoryItem={id:string;date:string;kind:'responses'|'chapters'|'recordings';title:string;skill:Skill|null;answer?:string;source?:string;assisted?:boolean;first?:boolean;result?:any;audioId?:string;runId?:string;status?:string;feedback?:any;assessment?:Assessment|null;canAssess?:boolean;activityId?:string};
export type ProgressSummary={
 range:{period:'7'|'28'|'90'|'all';timeZone:string;start:string;end:string;previousStart:string;previousEnd:string};
 activeDays:number;firstResponses:number;retries:number;skills:SkillProgress[];patterns:ProgressPattern[];
 focus:{title:string;reason:string;skill:Skill;target:ProgressTarget};
 review:{due:number;total:number;ratings:{label:string;rating:number;count:number}[]};
 revisions:{objectiveCorrected:number;objectivePairs:number;tutorResolved:number;tutorPairs:number};
};
