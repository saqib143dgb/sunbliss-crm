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
  window.testCalls=[];window.testLoads=[];window.testPageshows=0;window.addEventListener('pageshow',()=>testPageshows++);
  window.sb={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{
    const q=new Proxy({then:resolve=>Promise.resolve({data:table==='payment_schedule'?testRows:[],error:null}).then(resolve)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;
   },rpc:(name,args)=>{if(name!=='crm_record_payment_with_credit_note')throw Error('Unexpected write: '+name);testCalls.push(args);return new Promise(resolve=>window.finishSave=()=>resolve({data:{transaction_id:999},error:null}));}};
  const c={sno:439,customerId:3,unit:'TEST-202',name:'Test Customer',type:'3BR',total:1983800,received:0,outstanding:-1983800,stages:[{id:962,code:'5TH',label:'5th Installment',due:99190,dueDate:new Date(2026,8,26),paid:0}],info:{email:'test@example.com',area:1234,floor:2,pricePerSqft:1000,bookingAmt:null,brokerageAmt:null,brokeragePct:null},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'},view:'detail',selectedUnit:'TEST-202::439',detailFrom:'list',dues:[c],recent:[]});render();
  window.originalLoader=window.loadFromSupabase;
  window.loadFromSupabase=options=>{testLoads.push(options);return new Promise((resolve,reject)=>{window.finishRefresh=resolve;window.failRefresh=()=>reject(Error('Offline test'));});};
  window.__sunblissRefreshScheduledActions=async()=>{};
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
   const {page,errors}=await fixture(browser,width);await openForm(page);
   assert.notEqual(await page.evaluate(()=>document.activeElement.id),'pfAmount','Opening does not force keyboard focus');
   assert.equal(await page.locator('#recordPaymentReliablePanel.crm-full-page-inline').count(),0,'No generic editor relocation');
   const footerBefore=await page.locator('.record-payment-footer').boundingBox();assert(Math.abs(footerBefore.y+footerBefore.height-844)<2);
   await page.locator('#recordPaymentReliablePanel #pfSave').click();assert.equal(await page.evaluate(()=>testCalls.length),0,'Empty amount is not saved');
   await page.locator('#recordPaymentReliablePanel #pfAmount').fill('99190');await page.locator('#recordPaymentReliablePanel #pfDate').fill('2026-09-26');await page.locator('#recordPaymentReliablePanel #pfSave').click();
   assert(await page.locator('#recordPaymentReliablePanel #pfCancel').isDisabled());await page.evaluate(()=>{__sunblissRecordPaymentSave();__sunblissRecordPaymentSave();});
   assert.equal(await page.evaluate(()=>testCalls.length),1,'Repeated taps produce one save');
   await page.evaluate(()=>finishSave());await page.locator('#recordPaymentReliablePanel #pfReturn').waitFor();
   assert.equal(await page.evaluate(()=>testCalls[0].p_cash_amount),99190);assert.equal(await page.evaluate(()=>testCalls[0].p_schedule_id),962);
   assert.deepEqual(await page.evaluate(()=>testLoads[0]),{preserveView:true,render:false});
   const footerAfter=await page.locator('.record-payment-footer').boundingBox();assert.equal(footerAfter.y,footerBefore.y,'Success keeps footer in place');
   if(process.env.CRM_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CRM_SCREENSHOTS,'payment-success-'+width+'.png')});
   const elapsed=await page.evaluate(()=>{const t=performance.now();document.querySelector('#pfReturn').click();return {ms:performance.now()-t,panel:!!document.querySelector('#recordPaymentReliablePanel'),view:state.view};});
   assert.equal(elapsed.panel,false);assert(elapsed.ms<500);assert.equal(elapsed.view,'detail');
   assert.match(await page.locator('.record-payment-refresh-status').innerText(),/Updating balances/);
   await page.evaluate(()=>{state.view='list';renderMain();finishRefresh();});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>state.view),'list','Refresh does not navigate back');assert.equal(await page.evaluate(()=>testPageshows),0,'No synthetic page lifecycle events');
   assert.deepEqual(errors,[]);console.log('PASS',width,'stable footer, single save, immediate return, route preservation');
  }
  const {page,errors}=await fixture(browser);await openForm(page);
  await page.setViewportSize({width:390,height:500});await page.waitForTimeout(50);
  const footer=await page.locator('.record-payment-footer').boundingBox();assert(footer.y+footer.height<=501,'Actions fit reduced viewport');
  await page.setViewportSize({width:390,height:844});
  if(process.env.CRM_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CRM_SCREENSHOTS,'payment-form-390.png')});
  await record(page);await page.locator('#recordPaymentReliablePanel #pfReturn').click();await page.evaluate(()=>failRefresh());
  await page.locator('.record-payment-refresh-status button').waitFor();assert.match(await page.locator('.record-payment-refresh-status').innerText(),/Payment saved/);
  await page.locator('.record-payment-refresh-status button').click();await page.evaluate(()=>finishRefresh());
  await page.waitForFunction(()=>document.querySelector('.record-payment-refresh-status')?.dataset.status==='ready');
  assert.equal(await page.evaluate(()=>testCalls.length),1,'Refresh retry never repeats payment');assert.deepEqual(errors,[]);
  console.log('PASS reduced viewport and failed-refresh retry without duplicate payment');
  const quiet=await fixture(browser);
  await quiet.page.waitForTimeout(300);
  const result=await quiet.page.evaluate(async()=>{
   state.view='list';var renders=0,stacks=[],base=window.renderMain;window.renderMain=function(){renders++;stacks.push(new Error().stack);return base.apply(this,arguments);};
   try{await originalLoader({preserveView:true,render:false});}catch(err){return {error:JSON.stringify(err),stack:err.stack,view:state.view,renders};}
   return {view:state.view,renders,stacks};
  });
  assert.equal(result.error,undefined,JSON.stringify(result));assert.equal(result.view,'list');assert.equal(result.renders,0,JSON.stringify(result));
  assert.deepEqual(quiet.errors,[]);console.log('PASS full background refresh preserves route without intermediate main renders');

 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exit(1)});
