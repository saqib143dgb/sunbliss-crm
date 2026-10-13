const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8136,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<720,hasTouch:width<720});const errors=[];page.on('pageerror',e=>(errors.push(e.message),console.log(e.message)));
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8136'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8136');await page.waitForTimeout(1400);
 await page.evaluate(()=>{
  window.testSales=Array.from({length:17},(_,i)=>({id:i+1,unit_id:i+1,customer_id:i+1,booking_date:(2025+Math.floor((i+2)/12))+'-'+String((i+2)%12+1).padStart(2,'0')+'-05'}));
  window.sb={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:null}})},from:table=>{const data=(table==='sales'||table==='current_sales')?testSales:table==='customers'?testSales.map(s=>({id:s.customer_id,customer_name:'Test Buyer '+s.id})):table==='units'?testSales.map(s=>({id:s.unit_id,unit_no:'TEST-'+s.id,total_price:s.id*100000,unit_type:'2BR'})):[];const q=new Proxy({then:r=>Promise.resolve({data,error:null}).then(r)},{get:(t,k)=>k==='then'?t.then:()=>q});return q;}};
  const c={sno:1,customerId:1,unit:'TEST-101',name:'Synthetic Customer',type:'2BR',total:1000000,received:300000,outstanding:-690000,creditNoteTotal:10000,dldAdminSeparated:true,stages:[],info:{},spa:'Signed',oqood:'Completed'};
  Object.assign(state,{view:'insights',dues:[c],creditNotes:[{id:1,amount:10000}],recent:[],syncedAt:new Date().toISOString(),userRole:'crm_officer',user:{email:'test@example.com'}});
  window.portfolioStats=()=>({units:1,totalSales:1000000,totalReceived:300000,totalOutstanding:-690000,totalCreditNotes:10000,collectedPct:30,creditNotesPct:1,outstandingPct:69,spaCounts:{signed:1,drafted:0,none:0},oqoodCounts:{completed:1,pending:0,none:0},furnitureCounts:{furnished:0,unfurnished:1},mix:[],stageBreakdown:[],topAtRisk:[],recentActivity:[],overdueAmount:0,overdueUnits:0});
  window.salesVelocity=()=>({any:true,months:[{key:'2025-03',count:1,value:100000,growthPct:null}]});
  render();
 });
 const panel=page.locator('#sunblissMonthlySalesDrilldown');await panel.locator('svg').waitFor();
 await page.waitForFunction(()=>!document.documentElement.classList.contains('sbx-loading')&&getComputedStyle(document.getElementById('main')).opacity==='1');
 assert.equal(await page.locator('#creditNotePortfolio').count(),0);
 assert.equal(await panel.locator('[data-month]').count(),17);
 assert.equal(await page.locator('.monthly-sales-month-btn').count(),0);
 assert.equal(await page.locator('.overview .mix-row').count(),0,'legacy monthly list remains');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow');
 await panel.screenshot({path:'/tmp/insights-chart-'+width+'.png'});
 await panel.locator('[data-month="2026-07"]').click();
 await page.locator('#monthlySalesDialog').waitFor();
 const back=page.locator('#sunblissPersistentBack');await back.waitFor({state:'visible'});
 await page.waitForTimeout(200);
 assert(await back.evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('#sunblissPersistentBack')===el;}),'Back is obscured');
 assert(await back.evaluate(el=>{const b=el.getBoundingClientRect();return Math.abs(b.x+b.width/2-innerWidth/2)<2;}),'Back not centered');
 assert.equal(await page.locator('.monthly-sale-card').count(),1);
 await page.screenshot({path:'/tmp/insights-detail-'+width+'.png'});
 await back.click();await page.locator('#monthlySalesOverlay').waitFor({state:'detached'});
 assert.equal(await panel.locator('svg').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS',width,'chart, no duplicate list, no credit card, visible centered Back and return to Insights');

 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
