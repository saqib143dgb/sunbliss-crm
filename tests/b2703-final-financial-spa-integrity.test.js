const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const transactionCode=fs.readFileSync(path.join(root,'transaction_ledger_reconciliation_patch.js'),'utf8');
const sourceTruth=fs.readFileSync(path.join(root,'payment_schedule_source_truth_patch.js'),'utf8');
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const core=fs.readFileSync(path.join(root,'vendor/base/chunk_10.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261020_b2703_dld_spa_signature_provenance.sql'),'utf8');
function getReconciliation(){
 const testCode=transactionCode.replace('else install();','else window.__reconcileTest={reconcileCustomer,recomputeNextDue};');
 assert.notEqual(testCode,transactionCode);
 const sandbox={window:{},document:{readyState:'complete'},console,Date,Math,Number,String,Promise,isFinite};
 vm.runInNewContext(testCode,sandbox,{filename:'transaction_ledger_reconciliation_patch.js'});
 return sandbox.window.__reconcileTest;
}
const stage=(code,due,net,credit=0)=>({
 code,label:code==='DLD'?'DLD + Admin Fees (SPA)':code,
 due,spaCollectionDue:net,creditNoteTotal:credit,cashPaid:0,
 dueDate:new Date('2026-09-30T00:00:00Z')
});
const transaction=(id,code,amount,scheduleId)=>({
 id,unitId:467,customerId:47,scheduleId,amount,paymentType:code,paymentDate:'2026-10-20'
});
function fixture(){
 const c={unit:'B2-703',unitId:467,customerId:47,total:2002000,
 spaContractRevision:{pendingApprovedCredits:59000},
 stages:[stage('DP',200200,194300,6700),stage('1ST',200200,194300,118590),
 stage('2ND',100100,97150),stage('3RD',100100,97150),
 stage('DLD',85180,85180,2680)]};
 c.stages.forEach((s,i)=>{s.id=[1200,1199,1205,1204,1198][i]});
 const tx=[
 transaction(217,'Down Payment',187600,1200),
 transaction(480,'1st Installment',75710,1199),
 transaction(910,'2nd Installment',97150,1205),
 transaction(481,'DLD + Admin Fees (SPA)',80140,1198),
 transaction(916,'DLD + Admin Fees (SPA) Remaining',2360,1198)
 ];
 return {c,tx};
}
test('protected cash balances and issued CN reconcile without fake property or DLD debt',()=>{
 const {c,tx}=fixture();
 assert.equal(getReconciliation().reconcileCustomer(c,tx),true);
 assert.equal(c.stages.find(s=>s.code==='DP').outAmt,0);
 assert.equal(c.stages.find(s=>s.code==='1ST').outAmt,0);
 assert.equal(c.stages.find(s=>s.code==='2ND').outAmt,0);
 assert.equal(c.stages.find(s=>s.code==='3RD').outAmt,97150);
 assert.equal(c.stages.find(s=>s.code==='DLD').settledAmount,85180);
 assert.equal(c.stages.find(s=>s.code==='DLD').outAmt,0);
 assert.equal(c.dldAdminOutstanding,0);
 assert.equal(c.dldAdminCashReceived,82500);
 assert.equal(c.dldAdminCreditNoteTotal,2680);
 assert.equal(c.cashReceived,360460);
 assert.equal(c.creditNoteTotal,125290);
 assert.equal(c.settledReceived,485750);
 assert.equal(c.contractualPropertyOutstanding,1516250);
 assert.equal(c.expectedPropertyCashOutstanding,1457250);
 assert.equal(c.outstanding,-1516250);
 assert.equal(c.upAmt,97150);
});
test('issuance switches from protected net bridge to actually posted note without changing expected cash',()=>{
 const {c,tx}=fixture();
 c.stages.find(s=>s.code==='DP').spaCollectionDue=null;
 c.stages.find(s=>s.code==='DP').creditNoteTotal=12600;
 c.spaContractRevision.pendingApprovedCredits=53100;
 getReconciliation().reconcileCustomer(c,tx);
 assert.equal(c.stages.find(s=>s.code==='DP').outAmt,0);
 assert.equal(c.creditNoteTotal,131190);
 assert.equal(c.contractualPropertyOutstanding,1510350);
 assert.equal(c.expectedPropertyCashOutstanding,1457250);
});
test('SPA/DLD migration changes due amount and verified provenance only',()=>{
 assert.match(sql,/v_dld_total<>85180/);
 assert.match(sql,/v_confirmed<>82500/);
 assert.match(sql,/v_credit<>2680/);
 assert.match(sql,/set due_amount=v_dld_total/);
 assert.match(sql,/spa_status='Signed'/);
 assert.match(sql,/'executed_spa_revision_id'/);
 assert.match(sql,/'executed_spa_signed_on'/);
 assert.match(sql,/'signed_agreement_verified',true/);
 assert.doesNotMatch(sql,/'customer_signed_on',/);
 assert.doesNotMatch(sql,/'developer_signed_on',/);
 assert.doesNotMatch(sql,/update public.payment_transactions/i);
 assert.doesNotMatch(sql,/update public.credit_notes/i);
 assert.doesNotMatch(sql,/update public.scheduled_actions/i);
 assert.doesNotMatch(sql,/set\s+due_date\s*=/i);
});
test('signed SPA customer disclosure stays in existing compact note, with clear separate statuses',()=>{
 const a=build.indexOf('function fixInstallmentLedgerRender(');
 const b=build.indexOf('function simplifyDldTracker(',a);
 const c=build.indexOf('function showAccountsPendingInInstallmentLedger(');
 const d=build.indexOf('function renderExecutedSpaContractRevisionNote(',c);
 const e=build.indexOf('function transformCore(',d);
 assert.ok(a>=0&&b>a&&c>b&&d>c&&e>d);
 const norm=new Function(build.slice(a,b)+';return fixInstallmentLedgerRender')();
 const pending=new Function(build.slice(c,d)+';return showAccountsPendingInInstallmentLedger')();
 const note=new Function(build.slice(d,e)+';return renderExecutedSpaContractRevisionNote')();
 const output=note(pending(norm(core)));
 new Function(output);
 assert.match(output,/Expected remaining cash after approved credits/);
 assert.match(output,/Contractual balance after issued credits/);
 assert.match(output,/Unit record:/);
 assert.match(output,/Availability:/);
 assert.match(output,/separate statuses/);
 assert.match(output,/Payment Recorded — Accounts Confirmation Pending/);
 assert.match(sourceTruth,/spa_credit_allocations/);
 assert.match(sourceTruth,/pendingApprovedCredits/);
 assert.doesNotMatch(build,/set dateValue\s*=/i);
});
