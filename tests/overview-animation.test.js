const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(reduced=false){
 const classes=new Set(['sbx-loading']),frames=[];
 const root={classList:{add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)}};
 const final=['2','AED 100,000','AED 40,000','AED 60,000'],labels=['Units Sold','Sales Value','Collected','Outstanding'];
 const values=final.map(textContent=>({textContent,setAttribute(){},removeAttribute(){}}));
 const cells=labels.map((textContent,i)=>({querySelector:s=>s.includes('label')?{textContent}:values[i]}));
 const dashboard={querySelectorAll:()=>cells,querySelector:()=>null};
 const ctx={state:{view:'overview',syncedAt:'2026-09-28',dues:[{customerId:1},{customerId:2}]},matchMedia:q=>({matches:q.includes('reduced-motion')?reduced:true}),document:{documentElement:root,getElementById:()=>dashboard},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},cancelAnimationFrame(){},Number,Math};ctx.window=ctx;
 const s=fs.readFileSync('overview_kpi_countup_patch.js','utf8');vm.createContext(ctx);vm.runInContext(s.slice(s.indexOf('  var root='),s.lastIndexOf('  var style=')),ctx);
 return{ctx,values,final,release:()=>classes.delete('sbx-loading'),frame:ts=>{const fn=frames.shift();assert(fn);fn(ts)}};
}
test('loading completion preserves count-up and redraws retain current frame without flashing final values',()=>{
 const f=fixture();f.ctx.__sunblissOverviewKpiRendered();assert.equal(f.values[1].textContent,'AED 0');f.ctx.__sunblissCompleteOverviewKpis();assert.equal(f.values[1].textContent,'AED 0');
 f.release();f.ctx.__sunblissCompleteOverviewKpis();f.frame(0);f.frame(946);const halfway=f.values[1].textContent;assert.notEqual(halfway,'AED 0');assert.notEqual(halfway,f.final[1]);
 f.values.forEach((v,i)=>v.textContent=f.final[i]);f.ctx.__sunblissOverviewKpiRendered();assert.equal(f.values[1].textContent,halfway);
 f.ctx.__sunblissCompleteOverviewKpis();assert.equal(f.values[1].textContent,halfway);f.frame(1892);assert.deepEqual(f.values.map(v=>v.textContent),f.final);
});
test('reduced-motion preference keeps final values without animation',()=>{const f=fixture(true);f.release();f.ctx.__sunblissOverviewKpiRendered();assert.deepEqual(f.values.map(v=>v.textContent),f.final)});
test('three-dot menu alone skips click loading while menu actions retain feedback',()=>{
 const s=fs.readFileSync('smooth_navigation_preview_patch.js','utf8'),line=s.split('\n').find(x=>x.startsWith("document.addEventListener('click'"));assert(line);let click,started=0;const ctx={document:{addEventListener:(_,f)=>click=f},window:{__sunblissBeginRenderInteraction:()=>started++}};vm.createContext(ctx);vm.runInContext(line,ctx);
 function press(id){click({target:{closest:()=>({closest:()=>null,matches:selector=>id==='customerActionMenuButton'&&selector.includes('#customerActionMenuButton')})}})}
 press('customerActionMenuButton');assert.equal(started,0);press('actionRecordPayment');assert.equal(started,1);press('overview');assert.equal(started,2);
});
