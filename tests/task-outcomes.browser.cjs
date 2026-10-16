const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8139,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8139'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8139');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.spaCalls=[];window.testTask={id:99001,unit_id:1,schedule_id:77,workflow_kind:null,action_label:'Collect Payment',updated_at:'2026-10-15T00:00:00Z',status:'pending',due_date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai'}).format(new Date()),priority:'Medium',source:'manual',owner_id:'test'};
  window.sb={rpc:async(name,data)=>{spaCalls.push({name,data});return {data:{completed:true},error:null};},auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{const q=new Proxy({then:r=>Promise.resolve({data:table==='scheduled_actions'?[testTask]:[],error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}};
  const c={sno:1,customerId:1,unit:'TEST-101',name:'Synthetic Customer',type:'2BR',total:1000000,received:300000,outstanding:-690000,creditNoteTotal:10000,dldAdminSeparated:true,stages:[],info:{},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{view:'overview',dues:[c],recent:[],syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'}});
  window.portfolioStats=()=>({units:1,totalSales:1000000,totalReceived:300000,totalOutstanding:-690000,totalCreditNotes:10000,collectedPct:30,creditNotesPct:1,outstandingPct:69,spaCounts:{signed:1,drafted:0,none:0},oqoodCounts:{completed:1,pending:0,none:0},furnitureCounts:{furnished:0,unfurnished:1},mix:[],stageBreakdown:[],topAtRisk:[],recentActivity:[],overdueAmount:0,overdueUnits:0});
  render();
 });

 const open=async()=>{await page.locator('.scheduled-mark-done[data-task-id="99001"]').waitFor();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));await page.locator('.scheduled-mark-done[data-task-id="99001"]').click();await page.locator('#saOutcome').waitFor();};
 await open();assert.equal(await page.locator('#saOutcome option').count(),8);assert(await page.locator('#saComplete').isDisabled());assert(await page.locator('.task-next-preview').isHidden());
 await page.locator('#saOutcome').selectOption('extension_request');
 assert.match(await page.locator('.task-next-preview').innerText(),/Management Approval/);
 await page.locator('#saComplete').click();assert.match(await page.locator('#saError').innerText(),/reason/);assert.equal(await page.evaluate(()=>spaCalls.length),0);
 await page.locator('#saCompletionNote').fill('Customer requested more time');await page.locator('#saComplete').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>spaCalls.at(-1).name),'crm_record_scheduled_outcome');assert.equal(await page.evaluate(()=>spaCalls.at(-1).data.p_outcome),'extension_request');
 await open();await page.locator('#saOutcome').selectOption('partial_payment_commitment');await page.locator('.saCommitmentAmount').nth(0).fill('90000');await page.locator('.saCommitmentAmount').nth(1).fill('100000');await page.locator('.saCommitmentDate').nth(0).fill('2026-11-01');await page.locator('.saCommitmentDate').nth(1).fill('2026-12-01');
 assert.match(await page.locator('.task-next-preview').innerText(),/every promised part/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 await page.screenshot({path:'/tmp/task-outcomes-'+width+'.png',fullPage:true});
 await page.locator('#saComplete').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>spaCalls.at(-1).data.p_parts.length),2);
 await open();await page.locator('#saOutcome').selectOption('payment_reported');await page.evaluate(()=>{window.__sunblissOpenRecordPayment=context=>{window.paymentContext=context};window.beforeCalls=spaCalls.length});await page.locator('#saComplete').click();await page.waitForFunction(()=>window.paymentContext);
 assert.equal(await page.evaluate(()=>spaCalls.length),await page.evaluate(()=>beforeCalls),'Opening payment does not write or close task');assert.equal(await page.evaluate(()=>paymentContext.sourceTaskId),99001);assert.equal(await page.evaluate(()=>paymentContext.scheduleId),77);
 assert.deepEqual(errors,[]);console.log('PASS',width,'manual task outcome routing, validation, preview, split parts and payment handoff without early completion');await page.close();
 }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
