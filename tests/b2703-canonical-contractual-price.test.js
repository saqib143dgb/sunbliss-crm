const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const ROOT=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(ROOT,'supabase/migrations/20261020_b2703_executed_spa_canonical_contract_price.sql'),'utf8');
const patch=fs.readFileSync(path.join(ROOT,'payment_schedule_source_truth_patch.js'),'utf8');
const build=fs.readFileSync(path.join(ROOT,'build.js'),'utf8');
const core=fs.readFileSync(path.join(ROOT,'vendor/base/chunk_10.js'),'utf8');
const latest={
 id:1,unit_id:467,is_current:true,status:'executed',signed_on:'2026-10-15',
 spa_price:2002000,dld_rate_percent:4,dld_admin_fees:5100
};
const audit={
 unit_id:467,revision_id:1,previous_contract_total:1943000,
 executed_spa_contract_total:2002000,revision_increase:59000,
 signed_on:'2026-10-15',customer_page_note:
 'Contractual purchase price revised in accordance with the executed SPA. AED 59,000 in management-approved supplementary credits is handled stage-wise.'
};
function loadAuditedCustomer(auditRecord=audit){
 const db={
  units:[{id:467,unit_no:'B2-703'},{id:468,unit_no:'B2-704'}],
  payment_schedule:[
   {id:1200,unit_id:467,stage_name:'Down Payment',due_amount:200200,revised_due_amount:194300,paid_amount:187600,status:'Paid',due_date:'2025-12-08'},
   {id:1199,unit_id:467,stage_name:'1st Installment',due_amount:200200,revised_due_amount:194300,paid_amount:75710,status:'Paid',due_date:'2026-02-14'},
   {id:1205,unit_id:467,stage_name:'2nd Installment',due_amount:100100,revised_due_amount:97150,paid_amount:97150,status:'Paid',due_date:'2026-04-14'},
   {id:1300,unit_id:468,stage_name:'Down Payment',due_amount:100000,revised_due_amount:null,paid_amount:0,status:'Outstanding',due_date:'2026-12-01'}
  ],
  credit_notes:[{payment_schedule_id:1200,amount:6700},{payment_schedule_id:1199,amount:118590}],
  payment_transactions:[{unit_id:467,payment_schedule_id:1205,amount:97150,accounts_confirmation_status:'pending',payment_workflow_status:'awaiting_accounts'}],
  spa_price_revisions:[latest],
  spa_contract_price_sync_audit:auditRecord?[auditRecord]:[]
 };
 const sb={from(table){
  assert.ok(table in db,'Unmocked DB table '+table);
  const filters=[];
  const query={
   select(){return query},
   eq(field,value){filters.push([field,value]);return query},
   then(resolve,reject){return Promise.resolve({
    data:db[table].filter(row=>filters.every(([field,value])=>String(row[field])===String(value))),error:null
   }).then(resolve,reject)}
  };
  return query;
 }};
 const window={sb};
 const sandbox={window,sb,console,Date,Math,Number,String,isFinite,setTimeout};
 const exposed=patch.replace(/\ninstall\(\);\s*\}\)\(\);\s*$/,'\nwindow.__testContract={fetchTruth,applyCustomer};\n})();');
 assert.notEqual(exposed,patch,'must suppress UI initialization');
 vm.runInNewContext(exposed,sandbox,{filename:'payment_schedule_source_truth_patch.js'});
 return window.__testContract;
}
test('canonical price migration is strictly for B2-703 and records old price and price-per-sqft',()=>{
 assert.match(sql,/id=467 and unit_no='B2-703' for update/);
 assert.match(sql,/v_unit\.total_price<>1943000/);
 assert.match(sql,/v_unit\.price_per_sqft<>1450/);
 assert.match(sql,/v_rev\.spa_price=2002000|spa_price=2002000/);
 assert.match(sql,/v_n<>7 or v_gross<>2002000 or v_cash_basis<>1943000/);
 assert.match(sql,/v_supplementary<>59000/);
 assert.match(sql,/insert into public\.spa_contract_price_sync_audit/);
 assert.match(sql,/previous_contract_total/);
 assert.match(sql,/original_price_per_sqft/);
 assert.match(sql,/update public\.units set total_price=v_rev\.spa_price/);
 assert.match(sql,/price_per_sqft=round\(v_rev\.spa_price\/v_unit\.area,2\)/);
 assert.match(sql,/guard_executed_spa_contract_price/);
});
test('migration cannot modify installment collections, historical receipts, credit notes, dates or SOA template',()=>{
 assert.doesNotMatch(sql,/update public\.payment_schedule/i);
 assert.doesNotMatch(sql,/update public\.credit_notes/i);
 assert.doesNotMatch(sql,/update public\.payment_transactions/i);
 assert.doesNotMatch(sql,/update public\.sales/i);
 assert.doesNotMatch(sql,/delete from public\./i);
 assert.doesNotMatch(sql,/insert into public\.credit_notes/i);
 assert.doesNotMatch(sql,/set revised_due_date/i);
 assert.doesNotMatch(sql,/set paid_date/i);
 assert.doesNotMatch(sql,/set due_date/i);
});
test('customer contractual total and signed SPA audit display while collections remain separate',async()=>{
 const truth=loadAuditedCustomer();
 assert.equal(await truth.fetchTruth(),true);
 const customer={unit:'B2-703',total:1943000,stages:[
  {code:'DOWN',label:'Down Payment'},
  {code:'1ST',label:'1st Installment'},
  {code:'2ND',label:'2nd Installment'}
 ]};
 truth.applyCustomer(customer);
 assert.equal(customer.total,2002000);
 assert.equal(customer.spaContractRevision.previousPrice,1943000);
 assert.equal(customer.spaContractRevision.increase,59000);
 assert.equal(customer.spaContractRevision.signedOn,'2026-10-15');
 assert.match(customer.spaContractRevision.note,/supplementary credits/i);
 assert.equal(customer.stages[0].due,200200);
 assert.equal(customer.stages[0].spaCollectionDue,194300);
 assert.equal(customer.stages[0].spaPendingCN,5900);
 assert.equal(customer.stages[0].outAmt,0);
 assert.equal(customer.stages[2].accountsConfirmationPending,true);
 const other={unit:'B2-704',total:100000,stages:[{code:'DOWN',label:'Down Payment'}]};
 truth.applyCustomer(other);
 assert.equal(other.total,100000);
 assert.equal(other.spaContractRevision,null);
});
test('no unverified audit can silently add a customer revision note',async()=>{
 const truth=loadAuditedCustomer(null);await truth.fetchTruth();
 const customer={unit:'B2-703',total:1943000,stages:[{code:'DOWN'}]};
 truth.applyCustomer(customer);
 assert.equal(customer.spaContractRevision,null);
 assert.equal(customer.total,1943000);
});
test('root customer page includes compact signed SPA note beside original financial cards',()=>{
 const a=build.indexOf('function renderExecutedSpaContractRevisionNote(');
 const b=build.indexOf('function transformCore(',a);
 assert.ok(a>=0&&b>a);
 const render=new Function(build.slice(a,b)+';return renderExecutedSpaContractRevisionNote;')();
 const after=render(core);
 assert.match(after,/Contract price revised per signed SPA/);
 assert.match(after,/t\.spaContractRevision\.previousPrice/);
 assert.match(after,/t\.spaContractRevision\.note/);
 assert.match(after,/money-grid/);
 assert.match(after,/h\("Total",fmtAED\(t\.total\)/);
 assert.doesNotMatch(build,/update public\.units/i);
 assert.doesNotMatch(patch,/sb\.from\('units'\)\.update/i);
});
