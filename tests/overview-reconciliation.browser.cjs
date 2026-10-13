const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8135,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8135'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8135');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.sb={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:()=>{const q=new Proxy({then:r=>Promise.resolve({data:[],error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}};
  const c={sno:1,customerId:1,unit:'TEST-101',name:'Synthetic Customer',type:'2BR',total:1000000,received:300000,outstanding:-690000,creditNoteTotal:10000,dldAdminSeparated:true,stages:[],info:{},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{view:'overview',dues:[c],recent:[],syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'}});
  window.portfolioStats=()=>({units:1,totalSales:1000000,totalReceived:300000,totalOutstanding:-690000,totalCreditNotes:10000,collectedPct:30,creditNotesPct:1,outstandingPct:69,spaCounts:{signed:1,drafted:0,none:0},oqoodCounts:{completed:1,pending:0,none:0},furnitureCounts:{furnished:0,unfurnished:1},mix:[],stageBreakdown:[],topAtRisk:[],recentActivity:[],overdueAmount:0,overdueUnits:0});
  render();
 });
 const selector=width<1024?'.stat-hero .sbx-sales-reconciliation':'#sbRefOverviewV2 > .sbx-sales-reconciliation';
 const panel=page.locator(selector);await panel.waitFor();await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading'));
 assert.match(await panel.innerText(),/AED 10,000.00/);assert.match(await panel.locator('.sbx-reconciliation-legend').innerText(),/30.0% Collected/);
 await panel.locator('summary').click();assert.match(await panel.locator('table').innerText(),/AED 1,000,000.00/);
 assert.equal(await panel.locator('.sbx-reconciliation-difference').count(),0);
 const b=await panel.boundingBox();assert(b.x>=0&&b.x+b.width<=width+1,'panel overflows');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflows');
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('main')).opacity==='1'&&!document.documentElement.classList.contains('sbx-loading')); 
 await panel.screenshot({path:'/tmp/reconciliation-'+width+'.png'});
 await panel.locator('[data-proxy="btnCreditNotes"]').click();await page.locator('[data-kpi-kind="credits"]').waitFor();
 assert.equal(await page.locator('.sbx-kpi-row').count(),1);assert.match(await page.locator('.sbx-kpi-summary').innerText(),/AED 10,000/);
 assert.deepEqual(errors,[]);console.log('PASS',width,'three-way percentages, exact amounts, credit drilldown, no overflow');
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
