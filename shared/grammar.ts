export type GrammarFormat='meaning'|'build'|'transform'|'repair';
export type GrammarObjective={id:string;version:number;title:string;explanation:string};
export type GrammarExercise={id:string;objectiveId:string;format:GrammarFormat;prompt:string;sentence:string;frame:string;cue:string;answers:string[];explanation:string;options?:string[];tokens?:{id:string;text:string}[];alreadyValid?:boolean};
export type GrammarTopic={id:string;version:number;order:number;group:string;title:string;description:string;status:'draft';objectives:GrammarObjective[];contrasts:{left:string;right:string;meaning:string}[];details:string;exercises:GrammarExercise[];production:string};
export type GrammarStep={kind:'observe'|'task'|'rate'|'production';topic:GrammarTopic;objectiveId?:string;exerciseId?:string;retry?:boolean};
export type GrammarResponse={id:string;step:number;exerciseId?:string;objectiveId?:string;objectiveVersion?:number;topicId:string;topicVersion:number;answer:string;blockIds:string[];correct:boolean|null;helped:boolean;retry:boolean;createdAt:string};
export type GrammarSession={id:string;requestSignature:string;revision:number;mode:'learn'|'train'|'review';createdAt:string;updatedAt:string;status:'active'|'paused'|'completed';index:number;steps:GrammarStep[];draft:string;blockIds:string[];helped:boolean;responses:GrammarResponse[];assistance?:GrammarAssistance[]};
export type GrammarFeedback={targetUse:string;strength:string;improvement:string;retryPrompt:string;quote:string};
export type GrammarReview={id:string;sessionId:string;step:number;rating:number;objectiveId:string;version:number;createdAt:string;scheduled:boolean};
export type GrammarAssistance={id:string;signature:string;sessionId:string;step:number;answer:string;createdAt:string;model:string;explanation?:string;feedback?:GrammarFeedback};
export type GrammarSummary={range:{period:string;timeZone:string;start:string;end:string};due:number;nextDue:string|null;practice:number;guided:number;helped:number;retries:number;ratings:number[];topics:{id:string;title:string;practice:number;train:{correct:number;total:number};review:{correct:number;total:number}}[];patterns:{objectiveId:string;version:number;title:string;topicId:string;count:number;opportunities:number;activities:number;sessions:number;recurrent:boolean;examples:{answer:string;expected:string;date:string}[]}[];history:{sessionId:string;mode:string;topic:string;response:GrammarResponse;feedback?:GrammarFeedback;drafts:GrammarAssistance[]}[];totalHistory:number;page:number};
export function normalizeGrammar(text:string){return text.normalize('NFKC').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').trim().replace(/\s+/g,' ').replace(/\.$/,'').toLowerCase();}
export function grammarAnswer(ex:GrammarExercise,answer:string,blockIds:string[]=[]){
 if(ex.format==='build'){
  if(!ex.tokens||blockIds.length!==ex.tokens.length||new Set(blockIds).size!==blockIds.length||blockIds.some(id=>!ex.tokens!.some(t=>t.id===id)))throw Error('Use each sentence block once.');
  answer=blockIds.map(id=>ex.tokens!.find(t=>t.id===id)!.text).join(' ');
 }
 const valid=ex.format==='repair'&&answer==='__valid__'?!!ex.alreadyValid:ex.answers.some(a=>normalizeGrammar(a)===normalizeGrammar(answer));
 return {answer,correct:valid};
}
