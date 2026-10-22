const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('scheduled_actions_patch.js','utf8');
const migration=fs.readFileSync('supabase/migrations/20261022200000_grouped_collection_contacts_and_promises.sql','utf8');
const a=src.indexOf('  function groupedSelectedIds(panel){');
const b=src.indexOf('  async function loadOutcomePayment(task,panel){',a);
assert(a>0&&b>a,'Grouped contact helpers exist in original task source');
const setup=()=>{
 const checked=[{value:'1232'},{value:'1233'}],allocation=[
 {querySelector:q=>q.includes('Schedule')?{value:'1232'}:q.includes('Amount')?{value:'15000'}:{value:'2026-11-01'}},
 {querySelector:q=>q.includes('Schedule')?{value:'1233'}:q.includes('Amount')?{value:'20000'}:{value:'2026-11-12'}}
 ];
 const panel={querySelectorAll:q=>q.includes('saGroupPay')?checked:allocation};
 const context={document:{},window:{},text:x=>String(x),safe:x=>String(x),addDaysIso:()=> '2026-11-01'};
 vm.createContext(context);
 vm.runInContext(src.slice(a,b)+';globalThis.api={groupedSelectedIds,groupedAllocations};',context);
 return {api:context.api,panel};
};
test('one customer contact can cover two linked installments',()=>{
 const {api,panel}=setup();
 assert.deepEqual(Array.from(api.groupedSelectedIds(panel)),[1232,1233]);
});
test('distinct amounts and dates remain allocated to their own installments',()=>{
 const {api,panel}=setup();
 const rows=api.groupedAllocations(panel);
 assert.deepEqual(Array.from(rows).map(x=>[x.schedule_id,x.amount,x.date]),[
 [1232,15000,'2026-11-01'],[1233,20000,'2026-11-12']]);
});
test('payment reporting remains single-stage but no response and promises use grouped RPC',()=>{
 assert.match(src,/Choose one installment for this specific payment action/);
 assert.match(src,/p_schedule_ids:selected/);
 assert.match(src,/p_allocations:allocations/);
 assert.match(src,/saContactMethod/);
 assert.match(src,/Customer contact history/);
});
test('contact log is separate from verified email correspondence and contractual accounting',()=>{
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public\.crm_collection_contacts/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public\.crm_collection_promises/);
 assert.match(migration,/contact_method text/);
 assert.match(migration,/p_method NOT IN/);
 assert.match(migration,/coalesce\(cv\.revised_due_amount/);
 assert.doesNotMatch(migration,/UPDATE public\.payment_schedule SET/i);
 assert.doesNotMatch(migration,/UPDATE public\.payment_transactions SET/i);
});
test('one promise per date, including repeat installment on different dates without pending FK collision',()=>{
 assert.match(migration,/GROUP BY promised_date ORDER BY promised_date/);
 assert.match(migration,/schedule_id=NULL, -- group key is canonical/);
 assert.match(migration,/NULL,'promise_follow_up',now\(\),now\(\)/);
 assert.match(migration,/sum\(promised_amount\)/);
});
