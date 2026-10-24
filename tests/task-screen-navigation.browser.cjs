const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8141,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){for(const testMode of [false,true]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8141'?r.continue():r.abort());
 await page.addInitScript(active=>{if(active)sessionStorage.setItem('sunbliss-test-mode-v1','on');},testMode);
 await page.goto('http://127.0.0.1:8141');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.spaCalls=[];window.extraTask={id:99002,unit_id:1,workflow_kind:'accounts_confirmation',status:'pending',due_date:'2026-10-16',priority:'Medium'};window.testTask={id:99001,unit_id:1,schedule_id:77,workflow_kind:null,auto_key:'booking_welcome|1',action_label:'Send Welcome Letter',updated_at:'2026-10-15T00:00:00Z',status:'pending',due_date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai'}).format(new Date()),priority:'Medium',source:'manual',owner_id:'test'};
  window.sb={rpc:async(name,data)=>{spaCalls.push({name,data});return {data:{completed:true},error:null};},auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{const q=new Proxy({then:r=>Promise.resolve({data:table==='scheduled_actions'?[testTask,extraTask]:[],error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}};
  const c={sno:1,customerId:1,unit:'TEST-101',name:'Synthetic Customer',type:'2BR',total:1000000,received:300000,outstanding:-690000,creditNoteTotal:10000,dldAdminSeparated:true,stages:[],info:{},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{view:'overview',dues:[c],recent:[],syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'}});
  window.portfolioStats=()=>({units:1,totalSales:1000000,totalReceived:300000,totalOutstanding:-690000,totalCreditNotes:10000,collectedPct:30,creditNotesPct:1,outstandingPct:69,spaCounts:{signed:1,drafted:0,none:0},oqoodCounts:{completed:1,pending:0,none:0},furnitureCounts:{furnished:0,unfurnished:1},mix:[],stageBreakdown:[],topAtRisk:[],recentActivity:[],overdueAmount:0,overdueUnits:0});
  render();
 });


 const open=async()=>{await page.locator('.scheduled-mark-done[data-task-id="99001"]').waitFor();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));await page.locator('.scheduled-mark-done[data-task-id="99001"]').click();await page.locator('.task-next-preview').waitFor();await page.waitForTimeout(350);};
 await open();
 const geometry=await page.locator('#scheduledActionPanel').evaluate(panel=>{
   const rect=panel.getBoundingClientRect(),css=getComputedStyle(panel),root=document.documentElement;
   return {width:rect.width,left:rect.left,top:rect.top,bottom:rect.bottom,paddingLeft:parseFloat(css.paddingLeft),viewport:innerWidth,scrollWidth:root.scrollWidth};
 });
 if(width>=1024){
   assert(geometry.width>=600&&geometry.width<=670,'Simple task opens as a compact desktop dialog');
   assert(Math.abs(geometry.left+(geometry.width/2)-(width/2))<6,'Task opens centered in viewport');
   assert(geometry.paddingLeft<=30,'No obsolete full-page task padding');
   assert(geometry.top>=0&&geometry.bottom<=1000,'Task dialog fits viewport');
 }else{
   assert(geometry.width>=width-4,'Mobile task retains full-width layout');
 }
 assert(geometry.scrollWidth<=geometry.viewport+1,'Task dialog never causes horizontal page overflow');
 assert.match(await page.locator('.task-next-preview').innerText(),/Confirm payment with Accounts, then send/);
 assert.equal(await page.locator('.task-test-indicator').count(),testMode?1:0);
 if(testMode){assert(await page.locator('.task-test-indicator').isVisible());}
 assert(await page.locator('#saClose').isVisible(),'Back visible');
 assert.notEqual(await page.locator('#saClose').getAttribute('aria-hidden'),'true');
 await page.locator('#saCompletionNote').fill('Unsaved test note');
 await page.locator('#saClose').click();await page.locator('#scheduledActionPanel').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>spaCalls.length),0,'Back does not save');
 await open();assert.equal(await page.locator('#saCompletionNote').inputValue(),'','Back discards unsaved note');
 // Exercise preview states using the same public enhancement entry point.
 for(const [kind,expected] of [['cheque_clearance',/Confirm cheque clearance/],['payment_receipt',/Continue with the Payment Receipt/]]){
  await page.evaluate(kind=>{const p=document.getElementById('scheduledActionPanel');delete p.dataset.outcomeEnhanced;p.querySelector('.task-next-preview').remove();__sunblissEnhanceTaskOutcome(p,{task:testTask,selectId:'saOutcome',saveId:'saComplete',pendingPaymentSteps:[kind]});},kind);
  assert.match(await page.locator('.task-next-preview').innerText(),expected);
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 await page.screenshot({path:'/tmp/task-screen-'+width+'-'+testMode+'.png'});
 await page.locator('#saClose').click();
 await page.evaluate(()=>{testTask.auto_key='';testTask.workflow_kind='accounts_confirmation';testTask.action_label='Confirm Payment with Accounts';testTask.note='Customer payment recorded: AED 10,000.00. Confirm with Accounts.';});
 await page.locator('.scheduled-mark-done[data-task-id="99001"]').click();await page.locator('#saOutcome').waitFor();
 assert(await page.locator('.task-next-preview').isHidden());assert(await page.locator('#saComplete').isDisabled());
 assert.equal(await page.locator('.task-outcome-choice').count(),0);
 assert.match(await page.locator('.task-prior-note summary').innerText(),/AED 10,000/);
 assert.equal(await page.locator('.task-prior-note').getAttribute('open'),null);
 await page.locator('#saOutcome').selectOption('confirmed');assert(await page.locator('#saComplete').isEnabled());
 assert.match(await page.locator('.task-next-preview').innerText(),/Send Payment Receipt/);
 await page.screenshot({path:'/tmp/accounts-clean-'+width+'-'+testMode+'.png'});
 await page.locator('#saClose').click();assert.deepEqual(errors,[]);
 console.log('PASS',width,testMode?'test':'live','Back visible, no save on Back, mode indicator, verification-aware preview');await page.close();
 }}
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
