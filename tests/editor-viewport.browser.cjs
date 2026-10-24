const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{for(const project of ['', 'triana-'])for(const [width,height] of [[1366,768],[1600,900],[390,844]]){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:JSON.parse(process.env.CHROMIUM_ARGS||'["--no-sandbox"]')});
 try{const page=await browser.newPage({viewport:{width,height}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.host!=='crm.test')return r.abort();const f=path.join(process.cwd(),'dist',u.pathname);return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'}):r.abort();});
 await page.goto('http://crm.test/'+(project?'triana.html':'index.html'));await page.waitForTimeout(1000);
 await page.evaluate(()=>{document.querySelectorAll('#sbxBootScene,#sbxRouteOverlay').forEach(n=>n.remove());document.documentElement.classList.remove('sbx-loading','sbx-booting');state.view='detail';document.getElementById('app').style.display='block';document.getElementById('app').innerHTML='<main id="main"><div class="detail"></div></main>';const bar=document.createElement('div');bar.style.cssText='position:fixed;top:40%;left:0;width:100%;height:55px;z-index:2;background:white';bar.id='testProjectBar';document.body.append(bar);});
 const ids=width>=1024?['customerEditPanel','unitEditPanel','saleComplianceEditPanel','creditNoteEditPanel','transactionEditPanel','unitCancellationPanel','scheduledActionPanel']:['customerEditPanel','unitEditPanel','saleComplianceEditPanel'];
 for(const id of ids){console.log('Checking',project,width,id);
  await page.evaluate(id=>{const p=document.createElement('div');p.id=id;p.className='brand-editor';p.innerHTML='<p class="section-label">Edit details</p>'+Array.from({length:12},(_,i)=>'<label class="brand-field">Field '+i+'<input value="Original '+i+'"></label>').join('')+'<div class="brand-editor-actions"><button type="button" id="fixtureCancel">Cancel</button></div>';p.querySelector('button').onclick=()=>p.remove();document.querySelector('.detail').append(p);},id);
  await page.waitForTimeout(180);
  const box=await page.locator('#'+id).boundingBox();assert(box&&box.y>=-1&&box.y+box.height<=height+1,`${id} inside viewport ${width}: ${JSON.stringify(box)}`);
  if(width>=1024){assert(box.width<=920,`${id} compact`);assert(Math.abs(box.x+box.width/2-width/2)<2,`${id} centered`);}
  const input=page.locator('#'+id+' input').first();await input.fill('Still editable');assert.equal(await input.inputValue(),'Still editable');
  await page.locator('#fixtureCancel').click();await page.locator('#'+id).waitFor({state:'detached'});
 }
 for(const [overlay,dialog] of [['paymentDetailOverlay','paymentDetailDialog'],['installmentEditOverlay','installmentEditDialog'],['auditLogOverlay','auditLogDialog']]){
  await page.evaluate(([o,d])=>{const p=document.createElement('div');p.id=o;p.style.cssText='position:fixed;inset:0;background:#0008';p.innerHTML='<div id="'+d+'" style="background:var(--paper)"><h3>Edit payment plan</h3>'+Array.from({length:18},(_,i)=>'<p>Installment '+i+'</p>').join('')+'<button id="fixtureClose">Close</button></div>';p.querySelector('button').onclick=()=>p.remove();document.body.append(p);},[overlay,dialog]);
  await page.waitForTimeout(150);const b=await page.locator('#'+dialog).boundingBox();assert(b&&b.y>=-1&&b.y+b.height<=height+1,dialog+' stays within viewport');if(width>=1024)assert(b.width<=920,dialog+' compact');await page.locator('#fixtureClose').click();await page.locator('#'+overlay).waitFor({state:'detached'});
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));console.log(JSON.stringify({project:project||'sunbliss',width,height,editors:ids.length,overlays:3,passed:true}));
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exit(1)});
