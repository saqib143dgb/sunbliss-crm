const test=require('node:test');
const assert=require('node:assert/strict');
const readiness=require('../lib/spa_credit_issuance_readiness.js');

const stages=[
 [1200,'Down Payment',194300,200200,5900,1205],
 [1199,'1st Installment',194300,200200,5900,1205],
 [1205,'2nd Installment',97150,100100,2950,null],
 [1204,'3rd Installment',97150,100100,2950,null],
 [1203,'4th Installment',97150,100100,2950,null],
 [1202,'5th Installment',97150,100100,2950,null],
 [1201,'Final Installment (Handover)',1165800,1201200,35400,null]
];
const allocations=stages.map(([sid,label,due,gross,amount,gate],i)=>({
 id:i+1,revision_id:1,unit_id:467,payment_schedule_id:sid,
 approved_amount:amount,spa_gross_amount:gross,
 clearance_schedule_id:gate,status:'approved_pending_issue',credit_note_id:null
}));
const schedules=stages.map(([id,stage_name,due_amount])=>({id,unit_id:467,stage_name,due_amount}));
function tx(status){return [{id:910,payment_schedule_id:1205,amount:97150,accounts_confirmation_status:status}];}

test('seven notes remain unissued and none becomes eligible while Accounts is pending',()=>{
 const x=readiness.inspect(allocations,schedules,tx('pending'));
 assert.equal(x.length,7);
 assert.equal(x.reduce((n,row)=>n+row.approvedAmount,0),59000);
 assert.deepEqual(x.map(row=>row.state),[
   'awaiting_accounts','awaiting_accounts',
   'ledger_preparation','ledger_preparation','ledger_preparation',
   'ledger_preparation','ledger_preparation'
 ]);
 assert.ok(x.every(row=>row.canIssue===false));
});

test('Accounts confirmation alone cannot accidentally issue or enable credits on old SPA ledger',()=>{
 const x=readiness.inspect(allocations,schedules,tx('confirmed'));
 assert.ok(x.every(row=>row.state==='ledger_preparation'));
 assert.ok(x.every(row=>row.canIssue===false));
 assert.ok(x.every(row=>row.issuedCreditNoteId===null));
});

test('only after Accounts confirmation and ledger alignment are notes eligible for manual issuance',()=>{
 const aligned=schedules.map(s=>({...s,due_amount:stages.find(x=>x[0]===s.id)[3]}));
 const stillAwaiting=readiness.inspect(allocations,aligned,tx('pending'));
 assert.equal(stillAwaiting[0].state,'awaiting_accounts');
 assert.equal(stillAwaiting[1].state,'awaiting_accounts');
 assert.ok(stillAwaiting.slice(2).every(row=>row.canIssue));
 const approved=readiness.inspect(allocations,aligned,tx('confirmed'));
 assert.ok(approved.every(row=>row.canIssue));
 assert.ok(approved.every(row=>row.state==='ready_for_manual_issuance'));
 const shortfall=readiness.inspect(allocations,aligned,[{payment_schedule_id:1205,amount:97000,accounts_confirmation_status:'confirmed'}]);
 assert.equal(shortfall[0].state,'awaiting_accounts');
});

test('do not accept approval duplicates or an issued allocation without a real credit note',()=>{
 assert.throws(()=>readiness.inspect([...allocations,allocations[0]],schedules,tx('pending')), /Duplicate/);
 const unsafe=allocations.map(r=>({...r}));
 unsafe[0].status='issued';
 assert.throws(()=>readiness.inspect(unsafe,schedules,tx('confirmed')),/linked issued credit note/);
});

test('invalid Accounts schedule is blocked',()=>{
 const bad=allocations.map(x=>({...x}));
 bad[0].clearance_schedule_id=999;
 assert.throws(()=>readiness.inspect(bad,schedules,tx('confirmed')),/invalid installment/);
});
