const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const build=fs.readFileSync('build.js','utf8');
const transformation=build.slice(build.indexOf('function supportBackgroundRefresh('),build.indexOf('function transformCore('));
const base=fs.readFileSync('vendor/base/chunk_03.js','utf8');
const source=vm.runInNewContext(transformation+'supportBackgroundRefresh(source)',{source:base});
const loader=source.slice(0,source.indexOf('async function loadSnapshot('));
function environment(failTable){
 const context={state:{view:'detail',selectedUnit:'TEST::1',detailFrom:'list'},sb:{from(table){const q=new Proxy({then:resolve=>Promise.resolve({data:[],error:table===failTable?Error('Read failed'):null}).then(resolve)},{get:(target,key)=>key==='then'?target.then:()=>q});return q;}}};
 vm.createContext(context);vm.runInContext(loader,context);return context;
}
test('background data load preserves the current view and selected customer',async()=>{const c=environment();await c.loadFromSupabase({preserveView:true,render:false});assert.equal(c.state.view,'detail');assert.equal(c.state.selectedUnit,'TEST::1');assert.equal(c.state.detailFrom,'list');});
test('normal startup still opens the overview',async()=>{const c=environment();await c.loadFromSupabase();assert.equal(c.state.view,'overview');});
test('failed financial read is reported, not presented as a completed refresh',async()=>{const c=environment('payment_transactions');await assert.rejects(c.loadFromSupabase({preserveView:true,render:false}),/Read failed/);assert.equal(c.state.view,'detail');});
