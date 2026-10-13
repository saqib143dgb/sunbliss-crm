const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.setContent('<html><body></body></html>');
  await page.evaluate(()=>{window.state={dues:[{sno:1,customerId:2,name:'Synthetic buyer',unit:'TEST'}]};});
  const source=fs.readFileSync('scheduled_actions_patch.js','utf8').replace('  install();\n})();','  window.testOpenTask=openComplete;window.testTaskLabel=taskButtonLabel;\n})();');
  await page.addScriptTag({content:source});
  await page.evaluate(()=>testOpenTask({id:1,unit_id:1,auto_key:'booking_welcome|unit:1|customer:2',action_label:'Send Welcome Letter',due_date:'2026-10-13'}));
  assert.equal(await page.locator('#saComplete').innerText(),'Mark Sent');
  assert.equal(await page.locator('#saOutcome').count(),0);
  assert.match(await page.locator('#scheduledActionPanel').innerText(),/Welcome Letter before the payment receipt/);
  await page.locator('#saClose').click();assert.equal(await page.locator('#scheduledActionPanel').count(),0);
  await page.evaluate(()=>testOpenTask({id:2,unit_id:1,workflow_kind:'payment_receipt',action_label:'Send Payment Receipt',due_date:'2026-10-13'}));
  assert.match(await page.locator('#scheduledActionPanel').innerText(),/Welcome Letter task first/);
  assert.equal(await page.locator('#saOutcome').inputValue(),'sent');
  console.log('PASS',width,'Welcome Letter completion and receipt sequencing instructions');
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
