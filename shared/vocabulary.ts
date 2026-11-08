export type Band='B1'|'B2'|'C1'|'C2';
export type Direction='meaning'|'word';
export type VocabEntry={id:string;senseId:string;version:number;word:string;partOfSpeech:string;level:Band|null;topic:string;meaning:string;examples:string[];collocations:string[];note:string;cloze:string;answers:string[];prompt:string;status:'draft'|'reviewed';origin:'catalog'|'personal'|'legacy'};
export type VocabWord={entry:VocabEntry;selected:boolean;archived:boolean;collection:string;addedAt:string;revision:number};
export type VocabStep={entry:VocabEntry;kind:'meet'|'meaning'|'word'|'context'|'use';direction?:Direction;retry?:boolean};
export type VocabResult={id:string;sessionId:string;step:number;entryId:string;version:number;kind:VocabStep['kind'];answer:string;rating?:number;correct?:boolean;createdAt:string;retry:boolean};
export type VocabSession={id:string;revision:number;createdAt:string;updatedAt:string;status:'active'|'paused'|'completed';index:number;steps:VocabStep[];draft:string;revealed:boolean;results:VocabResult[]};
export type VocabFeedback={meaningUse:string;strength:string;improvement:string;model?:string};
export type VocabSummary={selected:number;due:number;newWords:number;activeDays:number;ratings:number[];word:{correct:number;total:number};context:{correct:number;total:number};nextDue:string|null;examples:{answer:string;word:string;date:string;feedback?:VocabFeedback}[]};
export type VocabHome={words:VocabWord[];summary:VocabSummary;session:VocabSession|null};
export function normalizeWord(s:string){return s.normalize('NFKC').toLowerCase().trim().replace(/[’]/g,"'").replace(/\s+/g,' ');}
export function correctWord(e:VocabEntry,answer:string){return e.answers.some(a=>normalizeWord(a)===normalizeWord(answer));}
