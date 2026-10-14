const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'[]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.setContent('<main id="main"><section id="actionRequiredCard">Extension Active</section></main>');
 await page.evaluate(()=>{
 window.state={view:'detail',selectedUnit:'B2-1008::1',userRole:'crm_officer',dues:[{unit:'B2-1008',sno:1,name:'Test Customer'}]};
 window.record={id:12,unit_id:1,status:'active',payment_schedule_id:4,original_due_date:'2026-10-01',extended_due_date:'2026-10-21'};
 window.writes=0;window.forced=false;window.fail=false;
 window.PaymentExtensionsCore={load:async()=>({e:[record]}),sync:async()=>{},scheduleMap:()=>({4:{stage_name:'Down Payment'}}),creditMap:()=>({}),remaining:()=>156335,money:n=>'AED '+n,formatDate:d=>d||'',penalty:()=>''};
 window.__sunblissEnsureAutomaticActions=async force=>{window.forced=force};
 window.renderDetail=()=>{};
 window.sb={from:()=>({update:values=>{window.values=values;return {eq(){return this},select:async()=>{if(window.fail)return {error:{message:'Test save failed'}};window.writes++;Object.assign(record,values);return {data:[{id:12}]}}}}})};
 });
 await page.addScriptTag({path:'payment_extensions_ui_patch.js'});
 await page.getByRole('button',{name:'Remove Extension',exact:true}).click();
 assert.equal(await page.locator('#extAdd').count(),0);
 page.once('dialog',d=>d.dismiss());
 await page.locator('.ext-cancel').click();assert.equal(await page.evaluate(()=>writes),0);
 await page.evaluate(()=>window.fail=true);
 page.once('dialog',async d=>{await d.accept();page.once('dialog',d=>d.accept())});
 await page.locator('.ext-cancel').click();await page.waitForFunction(()=>!document.querySelector('.ext-cancel').disabled);
 assert.equal(await page.evaluate(()=>record.status),'active');
 await page.evaluate(()=>window.fail=false);
 page.once('dialog',d=>d.accept());await page.locator('.ext-cancel').click();
 await page.waitForFunction(()=>document.querySelector('.ext-card[data-status="cancelled"]'));
 assert.equal(await page.evaluate(()=>writes),1);assert.equal(await page.evaluate(()=>forced),true);
 assert.equal(await page.evaluate(()=>record.original_due_date),'2026-10-01');
 assert.equal(await page.locator('.ext-cancel').count(),0);
 await page.locator('#extClose').click();await page.getByRole('button',{name:'Extension History',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS removal, cancel, save failure, history and due date at '+width+'px');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
