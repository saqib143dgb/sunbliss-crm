const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../lib/price_revision_core.js');
const fixture={
  spaPrice:2002000,commercialPrice:1876000,
  stages:[
    {id:1200,label:'Down Payment',sharePercent:10,cashPaid:187600,existingIssuedCredit:6700,approvedNewCredit:5900},
    {id:1199,label:'1st Installment',sharePercent:10,cashPaid:75710,existingIssuedCredit:118590,approvedNewCredit:5900},
    {id:1205,label:'2nd Installment',sharePercent:5,cashPaid:97150,approvedNewCredit:2950},
    {id:1204,label:'3rd Installment',sharePercent:5,cashPaid:0,approvedNewCredit:2950},
    {id:1203,label:'4th Installment',sharePercent:5,cashPaid:0,approvedNewCredit:2950},
    {id:1202,label:'5th Installment',sharePercent:5,cashPaid:0,approvedNewCredit:2950},
    {id:1201,label:'Final Installment (Handover)',sharePercent:60,cashPaid:0,approvedNewCredit:35400}
  ]
};
test('B2-703 signed SPA and supplementary approval reconcile exactly',()=>{
  const x=model.summarize(fixture);
  assert.equal(x.spaPrice,2002000);
  assert.equal(x.commercialPrice,1876000);
  assert.equal(x.approvedPriceCredit,126000);
  assert.equal(x.existingIssuedCredit,125290); // includes referral bonus 58,290
  assert.equal(x.additionalApprovedCredit,59000);
  assert.equal(x.additionalIssuedCredit,0);
  assert.equal(x.pendingNewCredit,59000);
  assert.equal(x.totalCashObligation,1817710);
  assert.equal(x.cashPaid,360460);
  assert.equal(x.expectedCashOutstanding,1457250);
  assert.equal(x.accountingOutstanding,1516250);
  assert.deepEqual(x.stages.map(r=>r.gross),[200200,200200,100100,100100,100100,100100,1201200]);
  assert.deepEqual(x.stages.map(r=>r.customerCashObligation),[187600,75710,97150,97150,97150,97150,1165800]);
  assert.deepEqual(x.stages.map(r=>r.expectedCashOutstanding),[0,0,0,97150,97150,97150,1165800]);
});
test('issued notes are not counted again as pending approvals',()=>{
  const stages=fixture.stages.map(s=>({...s}));
  stages[0].newIssuedCredit=5900;
  stages[1].newIssuedCredit=5900;
  const r=model.summarize({...fixture,stages});
  assert.equal(r.additionalIssuedCredit,11800);
  assert.equal(r.pendingNewCredit,47200);
  assert.equal(r.totalCashObligation,1817710);
  assert.equal(r.accountingOutstanding,1504450);
  assert.equal(r.expectedCashOutstanding,1457250);
});
test('DLD retains earlier credit and charges AED 2,360 additionally',()=>{
  assert.deepEqual(model.dld({spaPrice:2002000,ratePercent:4,adminFees:5100,cashPaid:80140,existingIssuedCredit:2680}),
    {dldAmount:80080,adminFees:5100,totalObligation:85180,cashPaid:80140,existingIssuedCredit:2680,additionalCashDue:2360});
});
test('zero or negative balance is not shown as overdue',()=>{
  const stages=fixture.stages.map(s=>({...s,cashPaid:s.cashPaid+100}));
  const r=model.summarize({...fixture,stages});
  assert.equal(r.stages[0].expectedCashOutstanding,0);
});
test('invalid percentages, duplicate IDs and over-issued notes are rejected',()=>{
  assert.throws(()=>model.summarize({...fixture,stages:[...fixture.stages,{id:2,sharePercent:1}]}),/total 100/);
  assert.throws(()=>model.summarize({...fixture,stages:fixture.stages.map((s,i)=>({...s,id:i?fixture.stages[0].id:s.id}))}),/unique ID/);
  assert.throws(()=>model.summarize({...fixture,stages:fixture.stages.map((s,i)=>i===0?{...s,newIssuedCredit:6000}:s)}),/exceeds approval/);
});
