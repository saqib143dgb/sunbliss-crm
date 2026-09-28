// Run after npm run build. Uses synthetic records; all external network requests are blocked.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
async function fixture(browser,width=390){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<720,hasTouch:width<720,timezoneId:'Asia/Dubai'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin==='http://127.0.0.1:8124')return r.continue();if(u.hostname.endsWith('.supabase.co')&&u.pathname.startsWith('/rest/v1/')&&r.request().method()==='GET')return r.fulfill({status:200,contentType:'application/json',body:'[]'});return r.abort();});
 await page.goto('http://127.0.0.1:8124');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.testRows=[{id:962,unit_id:439,customer_id:3,stage_name:'5th Installment',due_amount:99190,due_date:'2026-09-26',paid_amount:0}];
  window.testSales={id:4,customer_note:'Call before visiting',remarks:'Approved payment note',partial_booking_note:'',customer_page_hidden_notes:[]};window.testTasks=[{id:99,unit_id:439,action_label:'Extension due',due_date:'2099-01-01',auto_kind:'extension_active',status:'pending'}];window.testRawTx=[{id:800,unit_id:439,payment_type:'5th Installment Remaining',payment_reference:'SPRED:100',remarks:'Online Payment (In Escrow); verified bank transfer.'}];window.testDelay=0;window.testWrites=[];window.testCalls=[];window.testLoads=[];window.testPageshows=0;window.addEventListener('pageshow',()=>testPageshows++);
  window.sb={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{
    let payload=null,single=false,recordId=null;const q=new Proxy({then:resolve=>new Promise(done=>setTimeout(()=>{if(payload){testWrites.push({table,payload});if(table==='sales')Object.assign(testSales,payload);if(table==='scheduled_actions')testTasks.filter(t=>!recordId||t.id===recordId).forEach(t=>Object.assign(t,payload));}const data=table==='sales'?(single?testSales:[testSales]):table==='payment_schedule'?testRows:table==='payment_transactions'?testRawTx:table==='scheduled_actions'?testTasks:[];done({data,error:null});},table==='sales'?testDelay:0)).then(resolve)},{get:(t,k)=>k==='then'?t.then:k==='update'?v=>{payload=v;return q}:k==='eq'?(column,value)=>{if(column==='id')recordId=value;return q}:k==='single'?()=>{single=true;return q}:()=>q});return q;
   },rpc:(name,args)=>{if(name!=='crm_record_payment_with_credit_note')throw Error('Unexpected write: '+name);testCalls.push(args);return new Promise(resolve=>window.finishSave=()=>resolve({data:{transaction_id:999},error:null}));}};
  const c={sno:439,customerId:3,unit:'TEST-202',name:'Test Customer',type:'3BR',total:1983800,received:0,outstanding:-1983800,stages:[{id:962,code:'5TH',label:'5th Installment',due:99190,dueDate:new Date(2026,8,26),paid:0}],info:{email:'test@example.com',area:1234,floor:2,pricePerSqft:1000,bookingAmt:null,brokerageAmt:null,brokeragePct:null},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'},view:'detail',selectedUnit:'TEST-202::439',detailFrom:'list',dues:[c],recent:[{id:800,unitId:439,customerId:3,unit:'TEST-202',name:'Test Customer',date:new Date(2026,8,26),towards:'5th Installment Remaining',amount:99190,ref:'SPRED:100',remark:'Online Payment (In Escrow); verified bank transfer.'}]});render();
  window.originalLoader=window.loadFromSupabase;
  window.loadFromSupabase=options=>{testLoads.push(options);return new Promise((resolve,reject)=>{window.finishRefresh=resolve;window.failRefresh=()=>reject(Error('Offline test'));});};
  window.testRefreshScheduled=window.__sunblissRefreshScheduledActions;
 });
 await page.waitForTimeout(200);
 return {page,errors};
}
async function openForm(page){await page.evaluate(()=>{window.__sunblissOpenRecordPayment();});await page.locator('#recordPaymentReliablePanel #pfAmount').waitFor();}
async function record(page){await page.locator('#recordPaymentReliablePanel #pfAmount').fill('99190');await page.locator('#recordPaymentReliablePanel #pfDate').fill('2026-09-26');await page.locator('#recordPaymentReliablePanel #pfSave').click();await page.evaluate(()=>finishSave());await page.locator('#recordPaymentReliablePanel #pfReturn').waitFor();}
(async()=>{
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0];const file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8124,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{
 for(const width of [390,1440]){
  const {page,errors}=await fixture(browser,width);
  await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'),{},{timeout:12000});
  assert.deepEqual(errors,[]);
  assert.equal(await page.locator('#customerNoteTags').count(),1);
  assert.equal(await page.locator('#scheduledActionsDetail').count(),0);
  assert.match(await page.locator('#customerNoteTags .note-tag-preview').innerText(),/Call before visiting|Approved payment note/);
  assert(await page.locator('#actionRequiredCard .action-required-meta-block').first().evaluate(el=>getComputedStyle(el).borderTopWidth==='1px'));
  assert.match(await page.locator('#actionRequiredCard .action-required-status').innerText(),/overdue/i);
  assert.equal(await page.locator('#customerNoteTags').getAttribute('open'),null);
  assert(await page.evaluate(()=>{const a=document.querySelector('#actionRequiredCard'),n=document.querySelector('#customerNoteTags'),f=document.querySelector('#customerFinancialSummary');return a.nextElementSibling===n&&n.nextElementSibling===f&&!!f.querySelector('.cust-progress')}));
  const row=page.locator('.tx-list .tx-row:not(.credit-note-tx-row)').first();
  await row.locator('.tx-amt').click();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  assert.equal(await row.getAttribute('aria-expanded'),'true');assert.match(await row.locator('.tx-expanded-fields').innerText(),/SPRED:100/);assert.match(await row.locator('.tx-expanded-fields').innerText(),/Online Payment/);
  await row.locator('.tx-expanded-fields dd').last().click();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));assert.equal(await row.getAttribute('aria-expanded'),'false');
  await page.locator('#customerNoteTags summary').click();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  await page.locator('#customerNoteTags [data-note-field="remarks"]').click();await page.waitForFunction(()=>testSales.customer_page_hidden_notes.includes('remarks'));assert.equal(await page.evaluate(()=>testSales.remarks),'Approved payment note');
  await page.evaluate(()=>document.getElementById('actionViewNotes').click());await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));assert.match(await page.locator('#customerNotesManagementPanel').innerText(),/Approved payment note/);
  const restore=page.locator('#customerNotesManagementPanel .notes-current').filter({hasText:'Approved payment note'}).locator('button');await restore.click();await page.waitForFunction(()=>!testSales.customer_page_hidden_notes.includes('remarks'));
  await page.evaluate(()=>{document.getElementById('customerNotesManagementPanel').remove();testDelay=1600;__sunblissCustomerWorkspace.invalidate(439);renderMain()});
  await page.waitForTimeout(400);assert(await page.evaluate(()=>document.documentElement.classList.contains('sbx-loading')),'Logo remains until data resolves');
  await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'),{},{timeout:8000});
  assert.equal(await page.locator('.crm-readiness-error').count(),0);
  await page.locator('#actionRequiredCard').screenshot({path:'/workspace/scratch/b505e86594fb/review2/action-'+width+'.png'});
  await page.locator('#customerNoteTags').screenshot({path:'/workspace/scratch/b505e86594fb/review2/note-'+width+'.png'});
  await page.screenshot({path:'/workspace/scratch/b505e86594fb/review2/customer-workspace-'+width+'.png',fullPage:true});
  await page.evaluate(()=>document.getElementById('actionScheduleAction').click());await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  assert(await page.locator('#scheduledActionPanel').isVisible(),'Schedule action opens on both layouts');await page.locator('#saClose').click();

  await page.evaluate(()=>{state.view='overview';renderMain()});await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'),{},{timeout:10000});
  assert(await page.locator('#scheduledActionsOverview').isVisible(),'Scheduled actions visible on '+width);
  assert(await page.evaluate(()=>document.getElementById('scheduledActionsOverview').parentElement.classList.contains('overview')),'Standalone section');
  assert.equal(await page.locator('#scheduledOverviewList .scheduled-empty-next').count(),0);
  assert.equal(await page.locator('#scheduledOverviewList [data-task-id="99"]').count(),0,'Future extension is not in Today');
  await page.screenshot({path:'/workspace/scratch/b505e86594fb/review2/overview-workspace-'+width+'.png',fullPage:true});
  await page.evaluate(async()=>{testTasks.push({id:100,unit_id:439,action_label:'Send Demand Letter',auto_kind:'demand_letter',source:'automatic',schedule_id:962,due_date:'2026-01-01',status:'pending',priority:'Medium'});await testRefreshScheduled();await __sunblissEnsureScheduledActions()});
  await page.locator('#scheduledOverviewFilter').selectOption('overdue');await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  assert.equal(await page.locator('#scheduledOverviewList [data-task-id="100"]').count(),2);
  await page.locator('#scheduledOverviewList [data-task-id="100"].scheduled-mark-done').click();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  await page.locator('#saComplete').click();await page.waitForFunction(()=>testTasks.find(t=>t.id===100).status==='completed');await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  assert.match(await page.locator('#scheduledOverviewFilter option[value="overdue"]').innerText(),/0/);
  assert.equal(await page.locator('#scheduledOverviewList [data-task-id="100"]').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS',width,'transaction accordion, totals, preserved notes, first-load logo, standalone scheduled actions');
 }
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exit(1)});
