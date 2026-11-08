import {describe,it,expect} from 'vitest';
import {activities,taskTypes,assess} from '../shared/content';
describe('content and assessment boundaries',()=>{
 it('has five distinct draft sets for each of the twelve task formats',()=>{expect(activities).toHaveLength(60);expect(new Set(activities.map(a=>a.id)).size).toBe(60);for(const type of Object.values(taskTypes).flat()){const sets=activities.filter(a=>a.type===type);expect(sets).toHaveLength(5);expect(new Set(sets.map(a=>a.stimulus)).size).toBe(5);expect(sets.every(a=>a.reviewStatus==='draft')).toBe(true);}});
 it('checks an objective answer but does not treat typography as an oral error',()=>{const a=activities.find(a=>a.type==='Build a Sentence')!;expect(assess(a,a.answer!.toUpperCase().replace('.','')).correct).toBe(true);expect(assess(a,'different answer').correct).toBe(false);});
 it('does not turn an open response into a pronunciation, CEFR or official score',()=>{for(const a of activities.filter(a=>!a.answer)){const result=assess(a,'My own response');expect(result.correct).toBeNull();expect(result.officialScore).toBe(false);}});
 it('does not print the complete target word in the gap stimulus',()=>{for(const a of activities.filter(a=>a.type==='Complete the Words'))expect(a.stimulus.toLowerCase()).not.toContain(a.answer!);});
});
