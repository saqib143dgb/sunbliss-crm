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
(async()=>{
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0];const file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8124,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{
 // Cold start and refresh must not uncover an unfinished deferred UI bundle.
 const slow=await browser.newPage();
 await slow.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!=='http://127.0.0.1:8124')return r.abort();if(u.pathname==='/ui.bundle.js')await new Promise(resolve=>setTimeout(resolve,5000));return r.continue()});
 for(const reload of [false,true]){
  if(reload)await slow.reload({waitUntil:'commit'});else await slow.goto('http://127.0.0.1:8124',{waitUntil:'commit'});
  await slow.waitForTimeout(4600);
  assert(await slow.evaluate(()=>document.documentElement.classList.contains('sbx-booting')),'Boot released before deferred UI was ready');
  await slow.waitForFunction(()=>window.__sunblissUiReady&&!document.documentElement.classList.contains('sbx-loading'),{},{timeout:12000});
 }
 await slow.close();console.log('PASS delayed cold start and refresh: no premature loader release');
 for(const width of [390,1440]){
  const {page,errors}=await fixture(browser,width);
  await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'),{},{timeout:12000});
  await page.evaluate(()=>{window.samples=[];window.routeEvents=[];new MutationObserver(()=>routeEvents.push(document.documentElement.classList.contains('sbx-loading'))).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
   state.view='overview';renderMain();
   const until=performance.now()+3300;function sample(){const el=document.querySelector(innerWidth>=1024?'#sbRefOverviewV2 .sales .sb-kpi-amount':'.overview .stat-cell:nth-child(2) .stat-value');if(el&&!document.documentElement.classList.contains('sbx-loading'))samples.push(Number(el.textContent.replace(/[^0-9.]/g,'')));if(performance.now()<until)requestAnimationFrame(sample)}requestAnimationFrame(sample);
  });
  await page.waitForTimeout(3500);
  const result=await page.evaluate(()=>({samples,routeEvents,loading:document.documentElement.className,kpis:document.querySelector('#sbRefOverviewV2 .sales')?.textContent}));
  assert(result.samples.length>10,JSON.stringify(result));
  for(let i=1;i<result.samples.length;i++)assert(result.samples[i]>=result.samples[i-1],`Counter reversed at ${width}: ${result.samples.slice(i-2,i+2)}`);
  assert(result.samples.at(-1)>0,JSON.stringify(result));
  assert(await page.locator('#scheduledActionsOverview').isVisible());
  for(const view of ['list','insights','overview']){
   await page.evaluate(view=>{state.view=view;renderMain()},view);
   assert(await page.evaluate(()=>document.documentElement.classList.contains('sbx-loading')),'Route loader missing '+view);
   await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'),{},{timeout:10000});
  }
  assert.deepEqual(errors,[]);console.log('PASS',width,'monotonic counter, scheduled tasks, smooth route readiness');
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'crm-overview-'+width+'.png'),fullPage:true});
  await page.close();
 }
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exit(1)});
