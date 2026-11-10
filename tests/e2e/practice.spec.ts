import {test,expect,type Page} from '@playwright/test';
async function navigate(page:Page,name:string){const button=page.locator('.site-header').getByRole('button',{name,exact:true});if(!await button.first().isVisible())await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.locator('.site-header').getByRole('button',{name,exact:true}).last().click();}
test('four-skill practice, response persistence, and honest open-task feedback',async({page})=>{
 await page.goto('/');
 for(const [skill,answer]of [['Reading','restore'],['Listening',''],['Speaking','A short break restores my attention.'],['Writing','A short break restores my attention.']]){
  await navigate(page,'Practice');
  const back=page.getByRole('button',{name:'All challenges',exact:true});if(await back.isVisible())await back.click();
  await page.getByRole('button',{name:new RegExp(`^${skill} .*`)}).first().click();
  if(skill==='Listening')await page.getByRole('radio',{name:/Try the information desk/}).check();
  else await page.getByRole('textbox',{name:'Your response',exact:true}).fill(answer);
  await page.getByRole('button',{name:'Save response',exact:true}).click();
  await expect(page.getByText('SAVED · TIME TO REFLECT',{exact:true})).toBeVisible();
  if(skill==='Speaking')await expect(page.getByText(/No automatic proficiency or pronunciation score/)).toBeVisible();
 }
 await navigate(page,'Progress');
 await page.getByRole('button',{name:'View history',exact:true}).click();
 await expect(page.getByRole('article').filter({hasText:'Listen and Repeat'}).first()).toBeVisible();
 await page.reload();await navigate(page,'Progress');
 await page.getByRole('button',{name:'View history',exact:true}).click();
 await expect(page.getByRole('article').filter({hasText:'Build a Sentence'}).first()).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow).toBe(false);
 await page.getByRole('button',{name:'LexiSoar home',exact:true}).click();
 await page.screenshot({path:`output/verification/stride-${test.info().project.name}.png`,fullPage:true});
});
test('independent attempts hide aids and theme remains usable',async({page})=>{
 await page.goto('/');await navigate(page,'Practice');
 await page.getByRole('button',{name:/^Listening .*/}).first().click();
 await page.getByRole('combobox',{name:'Mode',exact:true}).selectOption('exam');
 await expect(page.getByRole('button',{name:'Show transcript (with help)',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Need a little help?',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Use dark theme',exact:true}).click();
 await expect(page.getByRole('button',{name:'Use light theme',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Use light theme',exact:true})).toBeVisible();
});
