const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const patch=fs.readFileSync(path.join(root,'payment_schedule_source_truth_patch.js'),'utf8');
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const base=fs.readFileSync(path.join(root,'vendor/base/chunk_10.js'),'utf8');
const originalDld={id:1198,unit_id:467,stage_name:'DLD + Admin Fees (SPA)',due_amount:82820,
 revised_due_amount:null,paid_amount:80140,due_date:'2026-02-14',revised_due_date:null,
 paid_date:'2026-07-25',status:'Paid'};
const signedSpa={id:1,unit_id:467,is_current:true,status:'executed',spa_price:2002000,
 dld_rate_percent:4,dld_admin_fees:5100};
function testFixture(dld=originalDld,revision=signedSpa){
 const datasets={
   units:[{id:467,unit_no:'B2-703'},{id:468,unit_no:'B2-704'}],
   payment_schedule:[dld,{...originalDld,id:1222,unit_id:468}],
   credit_notes:[{id:39,payment_schedule_id:1198,amount:2680}],
   payment_transactions:[],
   spa_price_revisions:revision?[revision]:[],
   spa_contract_price_sync_audit:[],
   spa_credit_allocations:[]
 };
 const sb={from(table){
   const filters=[];
   const query={select(){return query},eq(k,v){filters.push([k,v]);return query},
   then(resolve,reject){return Promise.resolve({
      data:datasets[table].filter(row=>filters.every(([k,v])=>String(row[k])===String(v))),
      error:null
   }).then(resolve,reject)}};return query;
 }};
 const sandbox={console,Date,Number,Math,String,isFinite,window:{sb},sb};
 const source=patch.replace(/\ninstall\(\);\s*\}\)\(\);\s*$/,
  '\nwindow.__dldTest={fetchTruth,applyCustomer};\n})();');
 assert.notEqual(source,patch);
 vm.runInNewContext(source,sandbox,{filename:'payment_schedule_source_truth_patch.js'});
 return sandbox.window.__dldTest;
}
test('revised SPA DLD supplemental amount is AED 2,360; original entry stays paid',async()=>{
 const flow=testFixture();
 assert.equal(await flow.fetchTruth(),true);
 const c={unit:'B2-703',stages:[{code:'DLD',label:'DLD + Admin Fees'}]};
 flow.applyCustomer(c);
 const d=c.stages[0];
 assert.equal(d.due,82820);
 assert.equal(d.paid,82820);
 assert.equal(d.outAmt,0);
 assert.equal(d.status,'Paid');
 assert.equal(d.dldSupplement.total,85180);
 assert.equal(d.dldSupplement.originallySettled,82820);
 assert.equal(d.dldSupplement.balance,2360);
 assert.equal(d.dueDate.getFullYear(),2026);
 assert.equal(d.dueDate.getMonth(),1);
 assert.equal(d.dueDate.getDate(),14);
});
test('supplement is not shown for another customer, absent SPA, or unsigned SPA',async()=>{
 const flow=testFixture();
 await flow.fetchTruth();
 const other={unit:'B2-704',stages:[{code:'DLD',label:'DLD + Admin Fees'}]};
 flow.applyCustomer(other);
 assert.equal(other.stages[0].dldSupplement,null);
 const absent=testFixture(originalDld,null);await absent.fetchTruth();
 const c={unit:'B2-703',stages:[{code:'DLD',label:'DLD + Admin Fees'}]};
 absent.applyCustomer(c);
 assert.equal(c.stages[0].dldSupplement,null);
 const pending=testFixture(originalDld,{...signedSpa,status:'pending'});
 await pending.fetchTruth();
 const d={unit:'B2-703',stages:[{code:'DLD',label:'DLD + Admin Fees'}]};
 pending.applyCustomer(d);
 assert.equal(d.stages[0].dldSupplement,null);
});
test('never mask a historical unpaid DLD stage as a separately paid account',async()=>{
 const flow=testFixture({...originalDld,paid_amount:78000,status:'Outstanding'});await flow.fetchTruth();
 const c={unit:'B2-703',stages:[{code:'DLD',label:'DLD + Admin Fees'}]};
 flow.applyCustomer(c);
 assert.equal(c.stages[0].dldSupplement,null);
 assert.ok(c.stages[0].outAmt>0);
});
test('customer page shows a separate supplementary DLD line without changing original paid badge',()=>{
 const a=build.indexOf('function fixInstallmentLedgerRender(');
 const b=build.indexOf('function simplifyDldTracker(',a);
 const c=build.indexOf('function showAccountsPendingInInstallmentLedger(');
 const d=build.indexOf('function transformCore(',c);
 assert.ok(a>=0&&b>a&&c>b&&d>c);
 const render=new Function(build.slice(a,b)+';return fixInstallmentLedgerRender')();
 const label=new Function(build.slice(c,d)+';return showAccountsPendingInInstallmentLedger')();
 const out=label(render(base));
 assert.match(out,/Additional DLD \(SPA\) · Pending/);
 assert.match(out,/n\.dldSupplement\.balance/);
 assert.match(out,/Payment Recorded — Accounts Confirmation Pending/);
 assert.match(out,/n\.spaPendingCN>0/);
 assert.match(out,/dldPaidWithinTolerance/);
});
