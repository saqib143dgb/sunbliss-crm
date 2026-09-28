const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(r=>setTimeout(r,80));
function fixture(){
 let started=0,finished=0,prepared=0,release;
 const waiting=new Promise(r=>release=r),events={};
 const ctx={console,Promise,Date,setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0),state:{view:'detail',selectedUnit:'A::1'},document:{documentElement:{},head:{appendChild(){}},createElement:()=>({}),getElementById:()=>null},addEventListener:(n,fn)=>events[n]=fn,__sunblissMotion:{begin:()=>++started,finish:()=>finished++},__sunblissCustomerWorkspace:{prepare:()=>{prepared++;return waiting}},__sunblissEnsureEffectiveAction:()=>waiting};
 ctx.window=ctx;ctx.renderDetail=()=>{};ctx.renderMain=()=>ctx.renderDetail();vm.createContext(ctx);vm.runInContext(fs.readFileSync('crm_render_readiness_patch.js','utf8'),ctx);
 return{ctx,release,stats:()=>({started,finished,prepared})};
}
test('cold customer render waits once, repeated background renders do not restart loader',async()=>{
 const f=fixture();f.ctx.renderMain();f.ctx.renderMain();f.ctx.renderDetail();await tick();assert.deepEqual(f.stats(),{started:1,finished:0,prepared:1});
 f.release();await tick();assert.equal(f.stats().finished,1);f.ctx.renderMain();await tick();assert.equal(f.stats().started,1);assert.equal(f.ctx.__sunblissViewPreparing,false);
});
test('navigating away while customer data is pending releases the new route independently',async()=>{
 const f=fixture();f.ctx.renderMain();f.ctx.state.view='list';f.ctx.renderMain();await tick();assert.equal(f.stats().started,2);assert.equal(f.stats().finished,1);f.release();await tick();assert.equal(f.stats().finished,1);
});
test('returning to a customer starts one new preparation and no unrelated click listeners',async()=>{
 const f=fixture();f.release();f.ctx.renderMain();await tick();f.ctx.state.view='list';f.ctx.renderMain();await tick();f.ctx.state.view='detail';f.ctx.renderMain();await tick();assert.equal(f.stats().started,3);assert.equal(f.stats().finished,3);
});
test('desktop customer back-button sync leaves Search open while mobile still closes it',()=>{
 const source=fs.readFileSync('persistent_back_patch.js','utf8'),body=source.slice(source.indexOf('  function sync(){'),source.indexOf('  var queued=false;'));
 for(const desktop of [true,false]){
 let closed=0;const ctx={state:{view:'detail'},matchMedia:()=>({matches:desktop}),ensureButton:()=>({classList:{toggle(){}},setAttribute(){}}),collectInlineBacks:()=>[],customerActionMenuOpen:()=>false,fullPageActionOpen:()=>false,closeDockSearch:()=>closed++,document:{querySelector:()=>({}),body:{classList:{toggle(){}}}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(body+'sync()',ctx);assert.equal(closed,desktop?0:1);
 }
});
