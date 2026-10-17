const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(8142,'127.0.0.1',r));const browser=await chromium.launch({args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720}),requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{let u=new URL(r.request().url());if(u.origin==='http://127.0.0.1:8142')return r.continue();
 if(u.hostname==='aeaakgndnihmuicyierp.supabase.co'&&u.pathname.startsWith('/rest/v1/')){requests.push({path:u.pathname,headers:r.request().headers(),body:r.request().postData()});return r.fulfill({status:200,contentType:'application/json',body:u.pathname.endsWith('prepare_test_workspace')?'{}':'[]'});}return r.abort();});
 const ready=async()=>{await page.waitForFunction(()=>window.__sunblissUiReady);await page.evaluate(()=>{state.userRole='crm_officer';state.user={email:'test@example.invalid'};state.view='overview';state.syncedAt=new Date().toISOString();state.dues=[{sno:991,customerId:992,unit:'TEST-001',name:'Demo Customer — TEST ONLY',type:'2BR',total:1000000,received:10000,outstanding:-990000,stages:[],info:{},spa:'Pending',oqood:'Pending'}];state.recent=[];render();});await page.locator('#crmTestModeBar').waitFor({state:'attached'});};
 await page.goto('http://127.0.0.1:8142');await ready();
 assert.equal(await page.evaluate(()=>__crmTestMode.active),false);
 await page.evaluate(()=>sb.from('customers').select('*'));assert.equal(requests.at(-1).headers['accept-profile'],'public');
 assert(await page.locator('#crmTestModeBar').isHidden(),'Live CRM must not show the Test Mode banner');
 assert(await page.locator('#crmEnterTest').isHidden(),'Test Mode entry must be temporarily hidden');
 await page.evaluate(()=>__crmTestMode.switchTo(true));await page.waitForFunction(()=>window.__crmTestMode&&__crmTestMode.active);await ready();
 assert(requests.some(r=>r.path.endsWith('prepare_test_workspace')&&r.headers['content-profile']==='crm_test'));
 assert.match(await page.locator('#crmTestModeBar').innerText(),/Shared demo workspace/);
 await page.evaluate(()=>sb.schema('public').from('customers').insert({customer_name:'TEST ONLY'}));assert.equal(requests.at(-1).headers['content-profile'],'crm_test');
 await page.evaluate(()=>fetch('https://aeaakgndnihmuicyierp.supabase.co/rest/v1/units',{headers:{'Accept-Profile':'public'}}));assert.equal(requests.at(-1).headers['accept-profile'],'crm_test');
 const blocked=await page.evaluate(async()=>({storage:(await fetch('https://aeaakgndnihmuicyierp.supabase.co/storage/v1/object/spa-assets/test')).status,external:(await fetch('https://aeaakgndnihmuicyierp.supabase.co/functions/v1/send-email',{method:'POST'})).status}));assert.deepEqual(blocked,{storage:403,external:403});
 await page.addScriptTag({url:'http://127.0.0.1:8142/welcome-pdf-lib.js'});await page.addScriptTag({url:'http://127.0.0.1:8142/test_document_watermark.js'});
 const bytes=await page.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();pdf.addPage();pdf.addPage();await __crmStampTestPdf(pdf);return Array.from(await pdf.save());});
 const pdfjs=require('pdfjs-dist/legacy/build/pdf.js'),pdf=await pdfjs.getDocument({data:new Uint8Array(bytes),disableFontFace:true}).promise;
 for(let i=1;i<=2;i++){const text=(await(await pdf.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ');assert.match(text,/TEST ONLY - NOT VALID/);}await pdf.destroy();await page.evaluate(()=>document.getElementById('crmTestDocumentStyles')?.remove());
 await page.locator('#crmOpenDemo').click();await page.waitForFunction(()=>state.view==='detail');assert.equal(await page.evaluate(()=>state.selectedUnit),'TEST-001::991');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));await page.waitForTimeout(250);
 await page.screenshot({path:'/tmp/test-mode-'+width+'.jpg',type:'jpeg',quality:30,clip:{x:0,y:0,width,height:300}});
 await page.evaluate(()=>{state.userRole='manager';render();});await page.waitForFunction(()=>document.getElementById('crmResetTest').hidden);assert(await page.locator('#crmResetTest').isHidden());
 await page.evaluate(()=>{state.userRole='crm_officer';render();});await page.waitForTimeout(100);
 page.once('dialog',d=>d.accept());await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.locator('#crmResetTest').click()]);await ready();assert(requests.some(r=>r.path.endsWith('prepare_test_workspace')&&JSON.parse(r.body).p_reset===true));
 await page.locator('#crmExitTest').click();await page.waitForFunction(()=>window.__crmTestMode&&!__crmTestMode.active);await ready();
 await page.evaluate(()=>sb.from('customers').select('*'));assert.equal(requests.at(-1).headers['accept-profile'],'public');
 assert.deepEqual(errors,[]);console.log('PASS',width,'enter, isolated reads/writes, fail-closed external services, demo navigation, manager guard, reset, exit');await page.close();
}}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
