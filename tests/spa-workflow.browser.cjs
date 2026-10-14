const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8137,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8137'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8137');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.spaCalls=[];window.testTask={id:99001,unit_id:1,spa_sale_id:10,spa_step:'invite',spa_data:{},workflow_kind:'spa',action_label:'Send SPA Invitation',status:'pending',due_date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai'}).format(new Date()),priority:'Medium',source:'manual',owner_id:'test'};
  window.sb={rpc:async(name,data)=>{if(name==='crm_resolve_spa_task')spaCalls.push(data);return {data:{completed:true},error:null};},auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{const q=new Proxy({then:r=>Promise.resolve({data:table==='scheduled_actions'?[testTask]:[],error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}};
  const c={sno:1,customerId:1,unit:'TEST-101',name:'Synthetic Customer',type:'2BR',total:1000000,received:300000,outstanding:-690000,creditNoteTotal:10000,dldAdminSeparated:true,stages:[],info:{},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{view:'overview',dues:[c],recent:[],syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'}});
  window.portfolioStats=()=>({units:1,totalSales:1000000,totalReceived:300000,totalOutstanding:-690000,totalCreditNotes:10000,collectedPct:30,creditNotesPct:1,outstandingPct:69,spaCounts:{signed:1,drafted:0,none:0},oqoodCounts:{completed:1,pending:0,none:0},furnitureCounts:{furnished:0,unfurnished:1},mix:[],stageBreakdown:[],topAtRisk:[],recentActivity:[],overdueAmount:0,overdueUnits:0});
  render();
 });
 await page.locator('.scheduled-mark-done[data-task-id="99001"]').waitFor();
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading')&&getComputedStyle(document.getElementById('main')).opacity==='1');
 await page.locator('.scheduled-mark-done[data-task-id="99001"]').click();
 await page.locator('#spaOutcome').waitFor();
 assert.equal(await page.locator('#spaSave').innerText(),'Mark Sent');
 await page.locator('#spaOutcome').selectOption('appointment');
 await page.locator('#spaSave').click();
 assert.equal(await page.locator('#spaError').innerText(),'Choose an appointment time.');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'spaTime');
 await page.locator('#spaTime').fill('14:30');await page.locator('#spaNote').fill('Office signing');
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));await page.waitForTimeout(250);
 await page.screenshot({path:'/tmp/spa-appointment-'+width+'.png'});
 await page.locator('#spaSave').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>spaCalls.at(-1).p_outcome),'appointment');
 assert.equal(await page.evaluate(()=>spaCalls.at(-1).p_data.time),'14:30');
 for(const [step,outcome] of [['reminder','sent'],['approval','conditional'],['developer','developer_signed'],['oqood','registered'],['issuance','pending'],['contract','sent']]){
  await page.evaluate(step=>__sunblissOpenSpaTask({...testTask,spa_step:step,action_label:'SPA workflow'}),step);
  await page.locator('#spaOutcome').selectOption(outcome);
  if(await page.locator('#spaRef').count())await page.locator('#spaRef').fill('TEST-REF');
  if(outcome==='conditional')await page.locator('#spaNote').fill('Clause change approved');
  const box=await page.locator('#spaSave').boundingBox();assert(box.width>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow');
  await page.locator('#spaSave').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>spaCalls.at(-1).p_outcome),outcome);
 }
 await page.evaluate(()=>__sunblissOpenSpaTask({...testTask,spa_step:'reminder'}));
 await page.locator('#spaOutcome').selectOption('customer_signed');
 await page.locator('#spaMethod').selectOption('digital');await page.locator('#spaRef').fill('DIGITAL-SPA');
 await page.locator('#spaSave').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>spaCalls.at(-1).p_data.method),'digital');
 assert.deepEqual(errors,[]);console.log('PASS',width,'task opens, validation focuses missing fields, appointment, decisions, signatures and document outcomes');

 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
