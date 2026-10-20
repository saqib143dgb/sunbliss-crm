const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../lib/soa_spa_projection_core.js');
const schedule=[
 [1200,'Down Payment',194300,'2025-12-08',194300],
 [1199,'1st Installment',194300,'2026-02-14',194300],
 [1205,'2nd Installment',97150,'2026-08-31',97150],
 [1204,'3rd Installment',97150,'2026-09-30',0],
 [1203,'4th Installment',97150,'2026-10-31',0],
 [1202,'5th Installment',97150,'2026-11-30',0],
 [1201,'Final Installment (Handover)',1165800,null,0]
].map(([id,label,due,date,paid])=>({id,label,due,dueDate:date,paid,code:id===1201?'FIN':null}));
const gross=[200200,200200,100100,100100,100100,100100,1201200];
const pending=[5900,5900,2950,2950,2950,2950,35400];
const credit=[6700,118590,0,0,0,0,0];
const spa={
 spaPrice:2002000,pendingNewCredit:59000,
 stages:schedule.map((s,i)=>({id:s.id,label:s.label,gross:gross[i],existingIssuedCredit:credit[i],pendingNewCredit:pending[i]}))
};
test('main SOA shows signed SPA price and 7 gross installments',()=>{
 const p=model.project(schedule,spa,{asOfDate:'2026-10-20',pendingAccountsIds:[1205],tolerance:.005});
 assert.equal(p.total,2002000);
 assert.deepEqual(p.stages.map(s=>s.due),gross);
 assert.equal(p.pendingCredits,59000);
 assert.equal(p.paid,485750); // AED 360,460 cash plus AED 125,290 issued credit notes
 assert.equal(p.contractBalance,1516250);
 assert.equal(p.expectedCashOutstanding,1457250);
 assert.equal(p.overdue,97150);
 assert.deepEqual(p.stages.map(s=>s.cashDue),[0,0,0,97150,97150,97150,1165800]);
 assert.deepEqual(p.stages.map(s=>s.status),['CN Pending','CN Pending','Pending Accounts','Overdue','Upcoming','Upcoming','At Possession']);
});
test('pending credits never get reported as paid',()=>{
 const p=model.project(schedule,spa,{asOfDate:'2026-10-20',pendingAccountsIds:[1205]});
 assert.equal(p.stages[0].paid,194300);
 assert.equal(p.stages[0].balance,5900);
 assert.equal(p.stages[0].pendingCredit,5900);
 assert.equal(p.stages[0].cashDue,0);
 assert.equal(p.stages[2].paid,97150);
 assert.equal(p.stages[2].balance,2950);
 assert.equal(p.stages[2].pendingCredit,2950);
});
test('confirmed Accounts only changes second-stage status',()=>{
 const p=model.project(schedule,spa,{asOfDate:'2026-10-20',pendingAccountsIds:[]});
 assert.equal(p.stages[2].status,'CN Pending');
 assert.equal(p.stages[2].cashDue,0);
 assert.equal(p.pendingCredits,59000);
});
test('reject accidental SPA mismatch and missing installments',()=>{
 assert.throws(()=>model.project(schedule,{...spa,spaPrice:2003000},{asOfDate:'2026-10-20'}),/SPA price/);
 assert.throws(()=>model.project(schedule.slice(1),spa,{asOfDate:'2026-10-20'}),/does not match/);
});
