const test=require('node:test');
const assert=require('node:assert/strict');
const Source=require('../lib/spa_financial_reconciliation_source.js');
const fixture={
 spa_price_revisions:[{id:1,unit_id:467,status:'executed',spa_price:2002000,commercial_price_snapshot:1876000,dld_rate_percent:4,dld_admin_fees:5100,approval_reference:'official CRM confirmation',is_current:true}],
 spa_credit_allocations:[
  [1200,200200,5900,1205],[1199,200200,5900,1205],[1205,100100,2950,null],
  [1204,100100,2950,null],[1203,100100,2950,null],[1202,100100,2950,null],
  [1201,1201200,35400,null]
 ].map(([payment_schedule_id,spa_gross_amount,approved_amount,clearance_schedule_id],i)=>({id:i+1,revision_id:1,unit_id:467,payment_schedule_id,spa_gross_amount,approved_amount,clearance_schedule_id,status:'approved_pending_issue',credit_note_id:null})),
 payment_schedule:[
  [1200,'Down Payment',194300,187600],[1199,'1st Installment',194300,75710],
  [1205,'2nd Installment',97150,97150],[1204,'3rd Installment',97150,0],
  [1203,'4th Installment',97150,0],[1202,'5th Installment',97150,0],
  [1201,'Final Installment (Handover)',1165800,0],[1198,'DLD + Admin Fees (SPA)',82820,80140]
 ].map(([id,stage_name,due_amount,paid_amount])=>({id,unit_id:467,stage_name,due_amount,revised_due_amount:null,paid_amount})),
 credit_notes:[
  {id:37,unit_id:467,payment_schedule_id:1200,amount:6700},
  {id:38,unit_id:467,payment_schedule_id:1199,amount:118590},
  {id:39,unit_id:467,payment_schedule_id:1198,amount:2680}
 ],
 payment_transactions:[
  {id:217,unit_id:467,payment_schedule_id:1200,amount:187600,accounts_confirmation_status:'confirmed'},
  {id:480,unit_id:467,payment_schedule_id:1199,amount:75710,accounts_confirmation_status:'confirmed'},
  {id:481,unit_id:467,payment_schedule_id:1198,amount:80140,accounts_confirmation_status:'confirmed'},
  {id:910,unit_id:467,payment_schedule_id:1205,amount:97150,accounts_confirmation_status:'pending'}
 ]
};
function fakeDb(values){
 return {from(name){
   const data=(values[name]||[]).map(x=>({...x}));
   const filters=[];
   const chain={select(){return chain},eq(k,v){filters.push([k,v]);return chain},
     limit(n){chain.limitValue=n;return chain},
     then(resolve,reject){try{
       let rows=data.filter(row=>filters.every(([k,v])=>String(row[k])===String(v)));
       if(chain.limitValue!=null)rows=rows.slice(0,chain.limitValue);
       return Promise.resolve({data:rows,error:null}).then(resolve,reject);
     }catch(e){return Promise.reject(e).then(resolve,reject)}}
   };return chain;
 }};
}
test('signed SPA reconciles while 2nd installment is awaiting Accounts',async()=>{
 const x=await Source.loadForUnit(fakeDb(fixture),467);
 assert.equal(x.signedSpa,2002000);
 assert.equal(x.model.totalCashObligation,1817710);
 assert.equal(x.model.pendingNewCredit,59000);
 assert.equal(x.model.additionalIssuedCredit,0);
 assert.equal(x.model.expectedCashOutstanding,1457250);
 assert.equal(x.pendingAccounts,97150);
 assert.equal(x.dld.additionalCashDue,2360);
 assert.equal(x.contingentCreditsClearanceConfirmed,false);
 assert.equal(x.legacyMatchesApprovedNet,true);
 assert.equal(x.rows.length,7);
});
test('confirming Accounts does not issue an approved credit note',async()=>{
 const copy=JSON.parse(JSON.stringify(fixture));
 copy.payment_transactions.find(t=>t.id===910).accounts_confirmation_status='confirmed';
 const x=await Source.loadForUnit(fakeDb(copy),467);
 assert.equal(x.pendingAccounts,0);
 assert.equal(x.contingentCreditsClearanceConfirmed,true);
 assert.equal(x.model.additionalIssuedCredit,0);
 assert.equal(x.model.pendingNewCredit,59000);
});
test('reject differing net installment obligations before documents are generated',async()=>{
 const copy=JSON.parse(JSON.stringify(fixture));
 copy.spa_credit_allocations.find(a=>a.payment_schedule_id===1204).approved_amount=2900;
 await assert.rejects(Source.loadForUnit(fakeDb(copy),467),/do not reconcile/);
});
test('return null for unaffected customers',async()=>{
 const x=await Source.loadForUnit(fakeDb(fixture),999);
 assert.equal(x,null);
});
