import type {Activity, Skill} from './content.js';
import type {Observation} from './progress.js';

export type Scene = {
  id: string; skill: Skill; label: string; objective: string; instruction: string;
  activity: Activity; questions?: {id: string; prompt: string; options: string[]; answer: string; why: string}[];
};
export type Chapter = {id: string; version: number; title: string; description: string; minutes: number; fiction: boolean; scenes: Scene[]; vocabulary: Activity['vocabulary'][]};
export type Draft = {text: string; source: 'typed'|'speech'; choices: Record<string,string>; helped: boolean; audioId?: string};
export type SceneWork = {draft: Draft; attemptIds: string[]; view: 'respond'|'feedback'};
export type RunState = {sceneIndex: number; status: 'active'|'paused'|'completed'; consent: boolean; model?: string; scenes: Record<string,SceneWork>; review: Record<string,number>; reflection: string};
export type StudyRun = {id: string; chapterId: string; chapterVersion: number; revision: number; state: RunState; chapter: Chapter; updatedAt: string};
export type TaskFeedback = {strength: string; focus: string; example: string; retryPrompt: string; observations?:Observation[]; assessmentUnavailable?:boolean};
export type FeedbackRecord = {status: 'pending'|'complete'|'failed'; feedback?: TaskFeedback; error?: string; model?: string};

const notice = `RIVERSIDE COUNCIL · PUBLIC NOTICE 014\n\nOn Friday 18 September, Mill Street will be closed to private cars from 6 p.m. to 10 p.m. for a one-evening trial. Buses and emergency vehicles will continue to use the street. Deliveries must arrive before 6 p.m.\n\nThe trial aims to make the street quieter and give people more room to walk. It is not a permanent closure. The council will collect residents’ comments and compare traffic counts on nearby streets before deciding what to do next.\n\nResidents who need vehicle access can contact the transport office to discuss an alternative. Shops will remain open as usual. Feedback is welcome until Monday.`;
export const cityDialogue = [
  {speaker:'Maya',role:'Local resident',text:'I could finally hear the people I was talking to. We stayed outside the café much longer than usual. I would support doing this again.'},
  {speaker:'Jon',role:'Shop owner',text:'It was quieter on Mill Street, yes. But customers told me the next road was busier. Some of them had trouble finding the entrance to our shop.'},
  {speaker:'Maya',role:'Local resident',text:'Perhaps clearer signs would help. Did you actually have fewer customers?'},
  {speaker:'Jon',role:'Shop owner',text:'I did, but it rained earlier that evening too. One night is not enough evidence to say the closure caused it. I would prefer another trial, with signs and traffic counts on both roads.'},
  {speaker:'Maya',role:'Local resident',text:'That sounds fair. A quieter street only works if we can maintain access to the places people need.'},
];
const dialogue = cityDialogue.map(t=>`${t.speaker}: ${t.text}`).join('\n\n');
const vocabulary = [
  {word:'alternative',meaning:'another choice or possibility',example:'Residents can discuss an alternative route with the transport office.'},
  {word:'evidence',meaning:'information that helps show whether an idea is true',example:'One quiet evening is not enough evidence for a permanent change.'},
  {word:'maintain',meaning:'to keep something in a particular condition',example:'The council needs to maintain access to local shops.'},
];
function activity(id:string,skill:Skill,type:Activity['type'],stimulus:string,prompt:string,explanation:string):Activity{
  return {id,skill,type,title:'The night the city went quiet',level:'Practice · uncalibrated',minutes:5,stimulus,prompt,explanation,vocabulary:vocabulary[0],reviewStatus:'draft',set:1};
}
export const cityChapter:Chapter = {
  id:'quiet-city',version:1,title:'The night the city went quiet',
  description:'One street. One evening. More than one side of the story.',minutes:25,fiction:true,vocabulary,
  scenes:[
    {id:'notice',skill:'Reading',label:'The notice',objective:'Distinguish a trial from a permanent decision and identify who can still use the street.',instruction:'Read the notice. What is actually changing?',
      activity:activity('quiet-city-v1-reading','Reading','Read in Daily Life',notice,'Answer both questions about the notice.','Check the vehicle exceptions and the information the council will collect.'),
      questions:[{id:'access',prompt:'Who can still use Mill Street during the closure?',options:['Buses and emergency vehicles.','All residents driving private cars.','Only delivery drivers.'],answer:'Buses and emergency vehicles.',why:'The notice explicitly exempts buses and emergency vehicles; deliveries must arrive before six.'},{id:'decision',prompt:'What will happen before a permanent decision?',options:['The street will close every Friday.','Comments and nearby traffic counts will be considered.','Shops will move to a different street.'],answer:'Comments and nearby traffic counts will be considered.',why:'This is a one-evening trial, followed by comments and traffic comparisons.'}]},
    {id:'voices',skill:'Listening',label:'Two perspectives',objective:'Identify different viewpoints and separate observation from cause.',instruction:'Listen to Maya and Jon. What does the evening tell us?',
      activity:activity('quiet-city-v1-listening','Listening','Listen to a Conversation',dialogue,'Choose the conclusion supported by the conversation.','Jon reports fewer customers but also mentions rain. He recommends another trial with better evidence.'),
      questions:[{id:'conclusion',prompt:'Why does Jon want another trial?',options:['He has proved that the closure reduced sales.','He wants to stop buses permanently.','One evening cannot separate the effects of rain and the closure.'],answer:'One evening cannot separate the effects of rain and the closure.',why:'He mentions an alternative explanation and asks for traffic counts on both roads.'}]},
    {id:'your-view',skill:'Speaking',label:'Your voice',objective:'Explain a position using one detail from the notice and one from the conversation.',instruction:'Should the city try it again? Explain your view and one change you would make.',
      activity:activity('quiet-city-v1-speaking','Speaking','Take an Interview',notice+'\n\nCONVERSATION\n'+dialogue,'Should the city repeat the trial? Give your view, use one detail from the notice and one from the conversation, and suggest one change.','Check whether you answered directly, used specific evidence and explained your suggestion. Listen to your recording for clarity; the transcript may contain recognition errors.')},
    {id:'letter',skill:'Writing',label:'A proposal',objective:'Write a clear, polite email with a recommendation, evidence and a practical change.',instruction:'Write to the transport office. Turn your view into a practical proposal.',
      activity:activity('quiet-city-v1-writing','Writing','Write an Email',notice+'\n\nCONVERSATION\n'+dialogue,'Write an email to the transport office. Recommend whether to repeat the trial, support your view with evidence, and suggest one practical change. Around 80–120 words is a useful practice target, not a requirement.','Check the purpose, recommendation, evidence, practical change and polite tone. Choose one point to improve.')},
  ],
};
export const chapters = [cityChapter];
export const blankDraft = ():Draft => ({text:'',source:'typed',choices:{},helped:false});
export const initialRunState = ():RunState => ({sceneIndex:0,status:'active',consent:false,scenes:{},review:{},reflection:''});
export function assessScene(scene:Scene,draft:Draft){
  if(!scene.questions)return {objective:false,correct:null,feedback:scene.activity.explanation,officialScore:false};
  const checks=scene.questions.map(q=>({id:q.id,correct:draft.choices[q.id]===q.answer,why:q.why,answer:q.answer}));
  return {objective:true,correct:checks.every(c=>c.correct),checks,feedback:checks.every(c=>c.correct)?'Your reading of the evidence is accurate.':checks.filter(c=>!c.correct).map(c=>c.why).join(' '),officialScore:false};
}
