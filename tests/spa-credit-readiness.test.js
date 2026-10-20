const test=require('node:test');
const assert=require('node:assert/strict');
const readiness=require('../lib/spa_credit_issuance_readiness.js');

const raw=[
 [1200,'Down Payment',194300,200200,5900,1205,187600],
 [1199,'1st Installment',194300,200200,5900,1205,75710],
 [1205,'2nd Installment',97150,100100,2950,null,97150],
 [1204,'3rd Installment',97150,100100,2950,null,0],
 [1203,'4th Installment',97150,100100,2950,null,0],
 [1202,'5th Installment',97150,100100,2950,null,0],
 [1201,'Final Installment (Handover)',1165800,1201200,35400,null,0]
];
const allocations=raw.map(([payment_schedule_id,stage,due,spa_gross_amount,approved_amount,clearance_schedule_id],i)=>({
 id:i+1,revision_id:1,unit_id:467,payment_schedule_id,approved_amount,
 spa_gross_amount,clearance_schedule_id,status:'approved_pending_issue',credit_note_id:null
}));
const schedules=raw.map(([id,stage_name,due_amount,spa,credit,gate,paid_amount])=>({
 id,unit_id:467,stage_name,due_amount,revised_due_amount:null,paid_amount
}));
const notes=[
 {id:37,payment_schedule_id:1200,amount:6700},
 {id:38,payment_schedule_id:1199,amount:118590}
];
const payments=(secondStatus='pending')=>[
 {payment_schedule_id:1200,amount:187600,accounts_confirmation_status:'confirmed'},
 {payment_schedule_id:1199,amount:75710,accounts_confirmation_status:'confirmed'},
 {payment_schedule_id:1205,amount:97150,accounts_confirmation_status:secondStatus}
];
const inspect=(a=allocations,s=schedules,tx=payments(),cn=notes)=>readiness.inspect(a,s,tx,cn);
test('all seven supplements remain unissued: DP and first await Accounts, later stages await their payment',()=>{
 const x=inspect();
 assert.equal(x.length,7);
 assert.equal(x.reduce((n,r)=>n+r.approvedAmount,0),59000);
 assert.deepEqual(x.map(r=>r.state),[
  'awaiting_accounts','awaiting_accounts','awaiting_accounts',
  'awaiting_stage_payment','awaiting_stage_payment',
  'awaiting_stage_payment','awaiting_stage_payment'
 ]);
 assert.ok(x.every(x=>!x.canIssue));
 assert.ok(x.every(x=>x.canReconcileAtomically));
});
test('after second installment Accounts confirms, only DP, first, second are eligible',()=>{
 const x=inspect(allocations,schedules,payments('confirmed'));
 assert.deepEqual(x.slice(0,3).map(row=>row.state),Array(3).fill('ready_for_manual_issuance'));
 assert.ok(x.slice(3).every(row=>row.state==='awaiting_stage_payment'));
 assert.ok(x.every(row=>row.issuedCreditNoteId===null));
});
test('later installments require their own confirmed payment, not merely due date',()=>{
 const tx=payments('confirmed').concat([{payment_schedule_id:1204,amount:97150,accounts_confirmation_status:'pending'}]);
 const paid=schedules.map(s=>s.id===1204?{...s,paid_amount:97150}:s);
 assert.equal(inspect(allocations,paid,tx)[3].state,'awaiting_accounts');
 tx[3].accounts_confirmation_status='confirmed';
 assert.equal(inspect(allocations,paid,tx)[3].state,'ready_for_manual_issuance');
});
test('gross ledger mismatch cannot issue; no double-credit for issued allocation',()=>{
 const altered=schedules.map(s=>s.id===1205?{...s,due_amount:100000}:s);
 assert.equal(inspect(allocations,altered,payments('confirmed'))[2].state,'ledger_preparation');
 const issued=allocations.map(a=>({...a}));
 issued[0]={...issued[0],status:'issued',credit_note_id:51};
 const ledger=schedules.map(s=>s.id===1200?{...s,due_amount:200200}:s);
 const posted=notes.concat([{id:51,payment_schedule_id:1200,amount:5900}]);
 const rows=inspect(issued,ledger,payments('confirmed'),posted);
 assert.equal(rows[0].state,'issued');
 assert.equal(rows[0].canIssue,false);
 assert.equal(rows[0].issuedCreditNoteId,51);
});
test('reject duplicate allocations, missing proof, and invalid clearance stage',()=>{
 assert.throws(()=>inspect([...allocations,allocations[0]]),/Duplicate/);
 const missing=allocations.map(x=>({...x}));missing[0].status='issued';missing[0].credit_note_id=51;
 assert.throws(()=>inspect(missing),/matching posted credit note/);
 const bad=allocations.map(x=>({...x}));bad[0].clearance_schedule_id=999;
 assert.throws(()=>inspect(bad),/invalid installment/);
});
