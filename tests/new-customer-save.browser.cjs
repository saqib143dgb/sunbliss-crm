// Synthetic browser regression: no requests to live services are permitted.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8131,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8131'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:8131');await page.waitForTimeout(1500);
 await page.evaluate(()=>{
 window.calls=[];window.failSave=true;
 const unit={id:9999,unit_no:'TEST-101',unit_type:'1BR',floor:'1st',area:1000,availability_status:'Available'};
 window.sb={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{const q=new Proxy({then:resolve=>Promise.resolve({data:table==='units'?[unit]:[],error:null}).then(resolve)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;},rpc:async(name,args)=>{calls.push({name,args});await new Promise(r=>setTimeout(r,300));return failSave?{error:{message:'Test server validation error'}}:{data:{unit_id:9999,customer_id:9999}};}};
 Object.assign(state,{userRole:'crm_officer',user:{email:'test@example.com'},view:'newCustomer',dues:[],__newCustomerAvailableUnits:[unit],newCustomerFormValues:{},newCustomerFormSaving:false});render();
 window.loadFromSupabase=async()=>{};window.goToDetail=()=>{state.view='detail';document.getElementById('ncSave').textContent='Customer created';};
 });
 await page.locator('#ncPct_DLD').waitFor();
 await page.locator('#ncSave').click();await page.waitForFunction(()=>document.activeElement.id==='ncName');assert.match(await page.locator('#ncSaveFeedback').innerText(),/name/i);
 await page.evaluate(()=>{for(const id of ['ncName','ncPhone','ncEmail','ncNationality','ncDesignation','ncDob','ncPassport','ncEid','ncAddress','ncPermanentAddress','ncCoApplicant'])document.getElementById(id).value='-';document.getElementById('ncName').value='Synthetic customer';});
 await page.locator('#ncUnitNo').selectOption('TEST-101');await page.locator('#ncSource').selectOption('Direct');
 await page.locator('#ncPct_DLD').waitFor();await page.locator('#ncTotalPrice').fill('1000000');
 assert.equal(await page.locator('#ncPct_DLD').inputValue(),'4');assert.equal(await page.locator('#ncAmt_DLD').inputValue(),'45100.00');
 await page.locator('#ncDate_1ST').fill('2026-11-15');assert.equal(await page.locator('#ncDate_DLD').inputValue(),'2026-11-15');
 await page.locator('#ncDate_DLD').fill('2026-12-01');assert.equal(await page.locator('#ncDate_1ST').inputValue(),'2026-11-15');
 await page.locator('#ncDate_1ST').fill('2026-11-20');assert.equal(await page.locator('#ncDate_DLD').inputValue(),'2026-12-01');
 await page.locator('#ncFurnishingType').selectOption('Semi Furnished');await page.locator('#ncBookingDate').fill('2026-10-10');await page.locator('#ncSoldBy').selectOption('Farhan Ali');
 await page.locator('#ncBookingAmount').fill('10000');await page.locator('#ncBookingPaymentDate').fill('2026-10-10');await page.locator('#ncAmt_DP').fill('200000');await page.locator('#ncDate_DP').fill('2026-10-10');await page.locator('#ncAmt_1ST').fill('100000');
 await page.locator('#ncSave').click();await page.waitForFunction(()=>document.activeElement.id==='ncPartialBookingNote');assert.equal(await page.locator('#ncPartialBookingNote').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#ncName').inputValue(),'Synthetic customer');
 await page.locator('#ncPartialBookingNote').fill('-');await page.locator('#ncSave').click();await page.waitForFunction(()=>calls.length===1&&!state.newCustomerFormSaving);
 assert.match(await page.locator('#ncSaveFeedback').innerText(),/Test server validation error/);assert.equal(await page.locator('#ncDate_DLD').inputValue(),'2026-12-01');
 await page.evaluate(()=>{failSave=false;document.getElementById('ncSave').click();document.getElementById('ncSave').click();});await page.waitForFunction(()=>state.view==='detail');
 const calls=await page.evaluate(()=>window.calls);assert.equal(calls.length,2);const payload=calls[1].args.payload;assert.equal(payload.email,'-');assert.equal(payload.date_of_birth,null);assert.equal(payload.schedule.find(x=>x.stage_name.includes('DLD')).due_date,'2026-12-01');assert.equal(payload.schedule.find(x=>x.stage_name==='1st Installment').due_date,'2026-11-20');assert.deepEqual(errors,[]);
 console.log('PASS',width,'Save, missing field focus, dash, server error preservation, duplicate-click protection, DLD defaults and independent dates');
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
