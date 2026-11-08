import {test,expect,type Page} from '@playwright/test';
async function openChapter(page:Page,consent=false){
 await page.goto('/?view=stories');await expect(page.getByRole('button',{name:/^(Step into the story|Continue chapter)$/})).toBeEnabled();const session=await page.request.get('/api/session');const s=await session.json();const headers={'x-csrf-token':s.csrf,origin:'http://127.0.0.1:4181'};const r=await page.request.post('/api/study-sessions',{headers,data:{chapterId:'quiet-city'}});expect(r.ok(),await r.text()).toBe(true);const snapshot=await r.json();if(consent){snapshot.run.state.consent=true;snapshot.run.state.model='test-model';await page.request.patch('/api/study-sessions/'+snapshot.run.id,{headers,data:{revision:0,state:snapshot.run.state}});}await page.goto('/?study='+snapshot.run.id);await expect(page.getByRole('heading',{name:'The notice',exact:true})).toBeVisible();return snapshot.run.id;
}
async function closedScenes(page:Page){
 await page.getByRole('radio',{name:'A Buses and emergency vehicles.',exact:true}).check();
 await page.getByRole('radio',{name:'B Comments and nearby traffic counts will be considered.',exact:true}).check();
 await page.getByRole('button',{name:'Check response',exact:true}).click();await expect(page.getByText('RESPONSE SAVED',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'Two perspectives',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Read transcript',exact:true}).click();
 await page.getByRole('radio',{name:'C One evening cannot separate the effects of rain and the closure.',exact:true}).check();
 await page.getByRole('button',{name:'Check response',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Your voice',exact:true})).toBeVisible();
}
test('continuous chapter: autosave, reload, pause, retries, contextual feedback, recall and completion',async({page},info)=>{
 await page.route('**/api/session',async route=>{const r=await route.fetch();await route.fulfill({json:{...await r.json(),chatgpt:true}});});
 await page.route('**/api/models',route=>route.fulfill({json:{models:[{id:'test-model',name:'Test model'}],selected:'test-model'}}));
 const id=await openChapter(page,true);await expect(page.getByRole('complementary')).toHaveCount(0);
 await page.screenshot({path:`output/verification/v02-reading-${info.project.name}.png`,fullPage:true});
 await closedScenes(page);
 const response=page.getByLabel('Your response — you can also type',{exact:true});const draftSaved=page.waitForResponse(r=>r.url().includes('/api/study-sessions/'+id)&&r.request().method()==='PATCH');await response.fill('I support another trial. Maya enjoyed the quiet street, but we should maintain access to shops.');
 await draftSaved;
 await page.reload();await expect(page.getByLabel('Your response — you can also type',{exact:true})).toHaveValue(/Maya enjoyed/);
 await page.getByRole('button',{name:'Pause & exit',exact:true}).click();await expect(page.getByRole('button',{name:'Continue chapter',exact:true})).toBeVisible();await page.getByRole('button',{name:'Continue chapter',exact:true}).click();
 await page.getByRole('button',{name:'Send response',exact:true}).click();await expect(page.getByText('Connect one source detail to your recommendation.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Revise & retry',exact:true}).click();await page.getByLabel('Your response — you can also type',{exact:true}).fill('I support another trial. Jon mentioned access problems, so clearer signs could help customers find local shops.');await page.getByRole('button',{name:'Send response',exact:true}).click();await expect(page.getByText('Attempt 2',{exact:true})).toBeVisible();await expect(page.getByText('Connect one source detail to your recommendation.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'A proposal',exact:true})).toBeVisible();await page.getByLabel('Your email',{exact:true}).fill('Dear Transport Team, I recommend another trial with clearer signs. Maya enjoyed the quiet street, but Jon reported access problems. Please count traffic on both roads before making a permanent decision. Best wishes, A resident.');await page.getByRole('button',{name:'Send email',exact:true}).click();await expect(page.getByText('Connect one source detail to your recommendation.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Continue',exact:true}).click();
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Reveal meaning',exact:false}).click();await page.getByRole('button',{name:'Good',exact:true}).click();}
 await page.getByLabel('One useful idea or improvement to take with you (optional)',{exact:true}).fill('Use evidence before making a recommendation.');await page.getByRole('button',{name:'Finish chapter',exact:true}).click();await expect(page.getByText('CHAPTER COMPLETE',{exact:true})).toBeVisible();await expect(page.getByText('Use evidence before making a recommendation.',{exact:true})).toBeVisible();await expect(page.getByText('Next vocabulary review:',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
test('failed feedback leaves the response and a route forward',async({page})=>{
 await page.route('**/api/session',async route=>{const r=await route.fetch();await route.fulfill({json:{...await r.json(),chatgpt:true}});});await openChapter(page,true);await closedScenes(page);await page.getByLabel('Your response — you can also type',{exact:true}).fill('I support the trial. [simulate-limit]');await page.getByRole('button',{name:'Send response',exact:true}).click();await expect(page.getByText('Plan limit reached. No paid fallback was attempted.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'A proposal',exact:true})).toBeVisible();
});
test('local chapter home is readable without navigation clutter',async({page},info)=>{
 await page.goto('/?view=stories');await expect(page.getByRole('heading',{name:'The night the city went quiet.',exact:true})).toBeVisible();await expect(page.getByRole('complementary')).toHaveCount(0);await page.emulateMedia({reducedMotion:'reduce'});await page.screenshot({path:`output/verification/v02-home-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Use dark theme',exact:true}).click();await expect(page.getByRole('button',{name:'Use light theme',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);await page.screenshot({path:`output/verification/v02-dark-${info.project.name}.png`,fullPage:true});
});
test('speech pauses do not send, and pause-and-exit finishes and links the recording',async({page})=>{
 await page.addInitScript(()=>{
  const stream={getTracks:()=>[{stop:()=>{}}]};
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>stream}});
  class Recorder{state='inactive';mimeType='audio/webm';ondataavailable:any;onstop:any;static isTypeSupported(){return true;}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['synthetic audio fixture'],{type:'audio/webm'})});this.onstop?.();});}}
  class Recognition{continuous=true;interimResults=true;lang='en-US';onresult:any;onend:any;onerror:any;starts=0;start(){this.starts++;if(this.starts===1)queueMicrotask(()=>{this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'i support another trial because maya enjoyed the quiet street'}}]});this.onend?.();});}stop(){this.onend?.();}abort(){}}
  (window as any).MediaRecorder=Recorder;(window as any).SpeechRecognition=Recognition;
 });
 const id=await openChapter(page);await closedScenes(page);await page.getByRole('button',{name:'Speak',exact:true}).click();await expect(page.getByLabel('Review your transcript',{exact:true})).toHaveValue(/i support another trial/);await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Send response',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Pause & exit',exact:true}).click();await expect(page.getByRole('button',{name:'Continue chapter',exact:true})).toBeVisible();await page.getByRole('button',{name:'Continue chapter',exact:true}).click();await expect(page.getByLabel('Review your transcript',{exact:true})).toHaveValue(/i support another trial/);await expect(page.locator('audio')).toBeVisible();await page.getByRole('button',{name:'Send response',exact:true}).click();await expect(page.getByText('RESPONSE SAVED',{exact:false})).toBeVisible();
 const snapshot=await(await page.request.get('/api/study-sessions/'+id)).json();const spoken=snapshot.attempts.find((a:any)=>a.data.sceneId==='your-view');expect(spoken.data.source).toBe('speech');expect(spoken.data.audioId).toMatch(/^[a-f0-9-]{36}$/);const audio=await page.request.get('/api/audio/'+spoken.data.audioId);expect(audio.ok()).toBe(true);
});
