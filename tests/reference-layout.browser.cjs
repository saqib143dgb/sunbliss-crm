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
    let payload=null,single=false,recordId=null;const q=new Proxy({then:resolve=>new Promise(done=>setTimeout(()=>{if(payload){testWrites.push({table,payload});if(table==='sales')Object.assign(testSales,payload);if(table==='scheduled_actions')testTasks.filter(t=>!recordId||t.id===recordId).forEach(t=>Object.assign(t,payload));}const data=table==='units'?(single?{id:439,customer_id:3,unit_no:'A2-204',status:'Sold'}:[]):table==='customers'?(single?{id:3,customer_name:'Chirayu Vijay Ingle'}:[]):table==='sales'?(single?testSales:[testSales]):table==='payment_schedule'?testRows:table==='payment_transactions'?testRawTx:table==='scheduled_actions'?testTasks:table==='crm_visit_sessions'?Array.from({length:15},(_,i)=>({id:i,user_name:'Test Manager',user_role:'manager',signed_in_at:'2026-10-05T08:27:00Z',last_seen_at:'2026-10-06T11:47:00Z',signed_out_at:null})):[];done({data,error:null});},table==='sales'?testDelay:0)).then(resolve)},{get:(t,k)=>k==='then'?t.then:k==='update'?v=>{payload=v;return q}:k==='eq'?(column,value)=>{if(column==='id')recordId=value;return q}:(k==='single'||k==='maybeSingle')?()=>{single=true;return q}:()=>q});return q;
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
async function auditFonts(surface){
 const mismatches=await surface.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>!el.closest('.paper-wrap,script,style,noscript')&&el.getClientRects().length&&Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim())).filter(el=>!getComputedStyle(el).fontFamily.startsWith('CRMInter')).map(el=>({tag:el.tagName,id:el.id,font:getComputedStyle(el).fontFamily})).slice(0,15));
 assert.deepEqual(mismatches,[],'Every visible UI text element must use the shared font');
}
(async()=>{
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0];const file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8124,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{
 for(const width of [320,390,768,1440]){
 const {page,errors}=await fixture(browser,width);
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
 await page.evaluate(()=>{const c=state.dues[0];c.name='Chirayu Vijay Ingle';c.unit='A2-204';c.type='3BR+Store';c.info.furnishingType='Semi Furnished';c.info.paymentPlan='40/60';c.spa='Pending';c.oqood='Pending';state.selectedUnit=c.unit+'::'+c.sno;renderMain()});
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));await page.waitForTimeout(250);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow '+width);
 for(const selector of ['#btnGenerateDocument','#inlineComplianceStrip','.d-name','#unitMetaInline','#actionRequiredCard']){
 const b=await page.locator(selector).boundingBox();assert(b.x>=0&&b.x+b.width<=width+1,selector+' outside '+width);
 assert.match(await page.locator(selector).evaluate(el=>getComputedStyle(el).fontFamily),/Inter/);
 }
 await auditFonts(page);
 await page.locator('.detail').screenshot({path:path.join(require('node:os').tmpdir(),'crm-reference-'+width+'.png')});
 await page.evaluate(()=>document.querySelector('.sb-manager-visit-trigger').click());
 await page.locator('#managerVisitDialog').waitFor();
 await page.locator('.manager-visit-card').first().waitFor();
 for(const height of [844,440]){
 await page.setViewportSize({width,height});await page.waitForTimeout(120);
 const b=await page.locator('#managerVisitDialog').boundingBox();assert(b.y>=0&&b.y+b.height<=height+1,'Dialog clipped '+width+'x'+height+JSON.stringify(b));
 const close=await page.locator('#managerVisitClose').boundingBox();assert(close.y>=0&&close.y+close.height<=height,'Close clipped');
 await page.locator('#managerVisitBody').evaluate(x=>x.scrollTop=x.scrollHeight);
 assert(await page.locator('#managerVisitClose').isVisible());
 }
 await auditFonts(page);
 await page.screenshot({path:path.join(require('node:os').tmpdir(),'crm-visit-'+width+'.png')});
 await page.locator('#managerVisitClose').click();await page.setViewportSize({width,height:844});
 await page.evaluate(()=>document.getElementById('actionScheduleAction').click());await page.locator('#scheduledActionPanel').waitFor();
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
 const panel=await page.locator('#scheduledActionPanel').boundingBox();assert(panel.x>=0&&panel.x+panel.width<=width+1&&panel.y>=0&&panel.y+panel.height<=845,'Schedule panel clipped');
 await page.locator('#saClose').click();
 await page.evaluate(()=>document.getElementById('btnGenerateDocument').click());
 await page.locator('#crmDocumentDialog').waitFor();
 const doc=await page.locator('#crmDocumentDialog').boundingBox();assert(doc.x>=0&&doc.x+doc.width<=width+1&&doc.y>=0&&doc.y+doc.height<=845,'Document dialog clipped');
 await auditFonts(page);
 for(const index of [0,1,2,3]){
  await page.locator('.document-options-grid>button').nth(index).click();
  const frame=await (await page.locator('#crmDocumentDialog iframe').elementHandle()).contentFrame();
  await frame.waitForURL(/(?:welcome-letter|spa-generator)\.html/);
  await frame.waitForLoadState('domcontentloaded');
  await frame.waitForFunction(()=>Array.from(document.fonts).some(f=>f.family==='CRMInter'&&f.status==='loaded'));
  await auditFonts(frame);
  await page.locator('.document-close').click();
  if(index<3){await page.evaluate(()=>document.getElementById('btnGenerateDocument').click());await page.locator('#crmDocumentDialog').waitFor();}
 }
 // Main routes must wrap within the viewport, with the same bundled font.
 for(const view of ['overview','list','insights']){
  await page.evaluate(view=>{state.view=view;renderMain()},view);
  await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
  await auditFonts(page);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Route overflow '+view+' '+width);
 }
 assert(await page.evaluate(()=>document.fonts.check('600 16px CRMInter')),'Bundled font did not load');
 assert.deepEqual(errors,[]);console.log('PASS',width,'reference alignment, typography, manager dialog scroll/resize, schedule viewport');await page.close();
 }
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exit(1)});
