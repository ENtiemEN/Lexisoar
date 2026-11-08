import {buildApp} from '../server/app';
import {Store} from '../server/store';
import {criterionIds} from '../shared/progress';
import {seedProgressFixture} from './progress-fixture';
import {GrammarStore,grammarCardKey} from '../server/grammar-store';
import {grammarTopics} from '../shared/grammar-catalog';
import {createEmptyCard} from 'ts-fsrs';
const store=new Store('.local/e2e/stride.sqlite');seedProgressFixture(store);
new GrammarStore(store).mutate('device',d=>{for(const objective of grammarTopics.slice(-5).flatMap(t=>t.objectives))d.cards[grammarCardKey(objective)]={...createEmptyCard(),due:'2020-01-01T00:00:00Z'};});
const app=await buildApp({root:'.local/e2e',store,port:4181,grammarAssistProvider:async input=>{
 if(input.answer.includes('[simulate-limit]'))throw Error('Plan limit reached. No paid fallback was attempted.');
 if(input.answer.includes('[simulate-invalid]'))return {incorrect:'invalid structure'};
 return input.action==='explain'?{explanation:'A finished past time uses a past viewpoint. A current result can connect the past to now.'}:{targetUse:'Your response includes a clear time reference.',strength:'You describe a specific situation.',improvement:'Connect the current result to the earlier event.',retryPrompt:'Try two connected sentences.',quote:input.answer.slice(0,20)};
},vocabularyAssistProvider:async input=>{
 if(input.word==='limit'||input.answer?.includes('[simulate-limit]'))throw Error('Plan limit reached. No paid fallback was attempted.');
 if(input.action==='generate')return {word:input.word,partOfSpeech:'verb',meaning:'to change to suit new conditions',examples:[`People ${input.word} to a new routine.`,`We ${input.word} when conditions change.`],collocations:['adapt quickly','adapt to change'],cloze:'People _____ to a new routine.',answers:[input.word],note:'Synthetic test draft.'};
 return {meaningUse:'Your sentence uses the selected meaning.',strength:'You describe a specific situation.',improvement:'Add one detail about the change.'};
},feedbackProvider:async input=>{
 if(input.answer.includes('[simulate-limit]'))throw Error('Plan limit reached. No paid fallback was attempted.');
 return {strength:'You give a clear position on the trial.',focus:'Connect one source detail to your recommendation.',example:'Jon’s concern suggests that clearer signs could maintain access.',retryPrompt:'Add a sentence explaining how your change addresses Jon’s concern.',observations:criterionIds.map(criterionId=>({criterionId,status:criterionId==='evidence'?'needs_work':'demonstrated',quote:input.answer.slice(0,150),reason:criterionId==='evidence'?'Use a precise source detail.':'The response demonstrates this criterion.'}))};
}});
await app.listen({host:'127.0.0.1',port:4181});
