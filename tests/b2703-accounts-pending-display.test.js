const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'payment_schedule_source_truth_patch.js'),'utf8');
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const base=fs.readFileSync(path.join(root,'vendor/base/chunk_10.js'),'utf8');
const schedule={
 id:1205,unit_id:467,stage_name:'2nd Installment',
 due_amount:97150,revised_due_amount:null,paid_amount:97150,
 due_date:'2026-04-14',revised_due_date:'2026-08-31',
 paid_date:'2026-10-15',status:'Paid'
};
const transaction={
 unit_id:467,payment_schedule_id:1205,amount:97150,
 accounts_confirmation_status:'pending',payment_workflow_status:'awaiting_accounts'
};

function mockTruth(t,prepared=false){
 const datasets={
   units:[{id:467,unit_no:'B2-703'},{id:468,unit_no:'B2-704'}],
   payment_schedule:[prepared?{...schedule,due_amount:100100,revised_due_amount:97150}:schedule,{...schedule,id:1206,unit_id:468}],
   credit_notes:[],
   payment_transactions:[t],
   spa_price_revisions:[],
   spa_contract_price_sync_audit:[],
   spa_credit_allocations:[]
 };
 const sb={
  from(table){
    const filters=[];
    const q={
     select(){return q},
     eq(key,value){filters.push([key,value]);return q},
     then(resolve,reject){
      return Promise.resolve({
       data:datasets[table].filter(row=>filters.every(([k,v])=>String(row[k])===String(v))),
       error:null
      }).then(resolve,reject);
     }
    };
    return q;
  }
 };
 const sandbox={console,Date,Math,Number,String,isFinite,window:{sb},sb};
 const exposed=source.replace(/\ninstall\(\);\s*\}\)\(\);\s*$/,
  '\nwindow.__truthTests={fetchTruth,applyCustomer};\n})();');
 assert.notEqual(exposed,source,'test must prevent UI initialization');
 vm.runInNewContext(exposed,sandbox,{filename:'payment_schedule_source_truth_patch.js'});
 return sandbox.window.__truthTests;
}
function customer(unit,code='2ND'){return {unit,stages:[{code,label:'2nd Installment'}]};}

test('B2-703 pending Accounts displays a flag without changing paid ledger status',async()=>{
 const impl=mockTruth({...transaction});
 assert.equal(await impl.fetchTruth(),true);
 const c=customer('B2-703');
 impl.applyCustomer(c);
 assert.equal(c.stages[0].status,'Paid');
 assert.equal(c.stages[0].paid,97150);
 assert.equal(c.stages[0].due,97150);
 assert.equal(c.stages[0].accountsConfirmationPending,true);
 const other=customer('B2-704');
 impl.applyCustomer(other);
 assert.equal(other.stages[0].accountsConfirmationPending,false);
});
test('Accounts confirmation removes the display-only pending label',async()=>{
 const impl=mockTruth({...transaction,accounts_confirmation_status:'confirmed',payment_workflow_status:'receipt_pending'});
 await impl.fetchTruth();
 const c=customer('B2-703');
 impl.applyCustomer(c);
 assert.equal(c.stages[0].accountsConfirmationPending,false);
 assert.equal(c.stages[0].status,'Paid');
});
test('a record without explicit awaiting-accounts state does not trigger the label',async()=>{
 const impl=mockTruth({...transaction,payment_workflow_status:'receipt_pending'});
 await impl.fetchTruth();
 const c=customer('B2-703');
 impl.applyCustomer(c);
 assert.equal(c.stages[0].accountsConfirmationPending,false);
});
test('only the customer installment badge displays the clarification',()=>{
 const a=build.indexOf('function fixInstallmentLedgerRender(');
 const b=build.indexOf('function simplifyDldTracker(',a);
 const c=build.indexOf('function showAccountsPendingInInstallmentLedger(');
 const d=build.indexOf('function transformCore(',c);
 assert.ok(a>=0&&b>a&&c>b&&d>c);
 const render=new Function(build.slice(a,b)+';return fixInstallmentLedgerRender;')();
 const presentation=new Function(build.slice(c,d)+';return showAccountsPendingInInstallmentLedger;')();
 const before=render(base),after=presentation(before);
 assert.match(after,/Payment Recorded — Accounts Confirmation Pending/);
 assert.match(after,/Accounts confirmation pending/);
 assert.match(after,/n\.accountsConfirmationPending\?"pending":d/);
 assert.match(after,/!n\.accountsConfirmationPending&&d==="paid"/);
 assert.match(after,/stage-row"><span>Paid/); // money columns still unchanged
 assert.equal((after.match(/stage-payment-confirmation-pending/g)||[]).length,1);
 assert.match(build,/reviseSoaFiguresUsingSignedSpa\(refineSoaDocumentVisuals\(/);
 assert.doesNotMatch(after,/soaProjection\.total/); // customer-page rendering only
});

test('signed SPA installment shown as gross while outstanding and Accounts state stay net and unchanged',async()=>{
 const impl=mockTruth({...transaction},true);
 assert.equal(await impl.fetchTruth(),true);
 const c=customer('B2-703');
 impl.applyCustomer(c);
 assert.equal(c.stages[0].due,100100);
 assert.equal(c.stages[0].spaCollectionDue,97150);
 assert.equal(c.stages[0].spaPendingCN,2950);
 assert.equal(c.stages[0].paid,97150);
 assert.equal(c.stages[0].outAmt,0);
 assert.equal(c.stages[0].status,'Paid');
 assert.equal(c.stages[0].accountsConfirmationPending,true);
 const other=customer('B2-704');
 impl.applyCustomer(other);
 assert.equal(other.stages[0].due,97150);
 assert.equal(other.stages[0].spaPendingCN,0);
});
