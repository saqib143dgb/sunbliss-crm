const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const build=fs.readFileSync('build.js','utf8');
const fn=build.slice(build.indexOf('function currentBookingReads('),build.indexOf('function copyRequired('));
const ctx={};vm.runInNewContext(fn,ctx);
test('live schedule and sale SELECTs are scoped; writes and historical archive reads are unchanged',()=>{
 for(const table of ['payment_schedule','sales']){
  assert.equal(ctx.currentBookingReads(`sb.from('${table}').select('*')`,'feature_patch.js'),`sb.from('current_${table}').select('*')`);
  for(const action of ['insert','update','delete']){const q=`sb.from('${table}').${action}({}).select('*')`;assert.equal(ctx.currentBookingReads(q,'feature_patch.js'),q);}
  const q=`sb.from('${table}').select('*')`;assert.equal(ctx.currentBookingReads(q,'cancelled_unit_archive_patch.js'),q);
 }
});
test('transaction reconciliation does not count the former buyer cash',()=>{
 const source=fs.readFileSync('transaction_ledger_reconciliation_patch.js','utf8');
 const exposed=source.slice(0,source.indexOf("  if(document.readyState==="))+'window.testReconcile=reconcileAll;})();';
 const c={unitId:483,customerId:85,total:1000,stages:[{id:1481,code:'DP',label:'Down Payment',due:1000,paid:0}]};
 const context={window:null,state:{dues:[c],cancelled:[],actualPaymentTransactions:[{id:1,unitId:483,customerId:63,amount:50000,paymentType:'Booking Amount'},{id:2,unitId:483,customerId:85,amount:15000,paymentType:'Booking Amount'}]}};context.window=context;
 vm.runInNewContext(exposed,context);context.testReconcile();assert.equal(c.grossCashReceived,15000);
});

test('Units list orders newest booking first with stable ties and missing dates last',()=>{
 const src=ctx.currentBookingReads(fs.readFileSync('vendor/base/chunk_09.js','utf8'),'chunk_09.js');
 const sort=src.slice(src.indexOf('p.sort(function(t,e){var a=Date.parse'),src.indexOf(';var L='));
 const p=[{c:{customerId:1,info:{bookingDate:'2026-01-01'}}},{c:{customerId:4,info:{bookingDate:'2026-10-13'}}},{c:{customerId:3,info:{bookingDate:'2026-10-13'}}},{c:{customerId:9,info:{}}}];
 vm.runInNewContext(sort,{state:{sortBy:'outstanding'},p});
 assert.deepEqual(p.map(x=>x.c.customerId),[4,3,1,9]);
});
