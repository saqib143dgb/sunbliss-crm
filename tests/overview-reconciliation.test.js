const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('overview_reconciliation_patch.js','utf8').replace('  install();',''),ctx);
const {calculate,creditFor}=ctx.window.__sunblissSalesReconciliation;
test('cash, applied credits and outstanding reconcile with the sales value to cents',()=>{
 const r=calculate({totalSales:152851418.20,totalReceived:47999999.99,totalOutstanding:-104527750.01},[{dldAdminSeparated:true,creditNoteTotal:323668.20}]);
 assert.equal(r.difference,0);assert.equal(r.credits,323668.20);assert.deepEqual(Array.from(r.percentages),[31.4,.2,68.4]);
});
test('DLD/admin credits are excluded and rounding-only percentages total 100',()=>{
 const credit=creditFor({stages:[{code:'DP',creditNoteTotal:1},{code:'DLD',creditNoteTotal:50}]});assert.equal(credit,1);
 const r=calculate({totalSales:3,totalReceived:1,totalOutstanding:-1},[{stages:[{code:'DP',creditNoteTotal:1}]}]);
 assert.equal(r.percentages.reduce((a,b)=>a+Math.round(b*10),0),1000);assert.equal(r.difference,0);
});
test('a real data discrepancy is exposed rather than allocated to credit notes',()=>{
 const r=calculate({totalSales:100,totalReceived:30,totalOutstanding:-60},[]);assert.equal(r.difference,10);assert.equal(r.credits,0);assert.deepEqual(Array.from(r.percentages),[30,0,60]);
});
test('empty portfolio has finite zero percentages',()=>assert.deepEqual(Array.from(calculate({},[]).percentages),[0,0,0]));
