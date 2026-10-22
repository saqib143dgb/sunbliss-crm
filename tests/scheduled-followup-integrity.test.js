const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const src=fs.readFileSync('scheduled_actions_patch.js','utf8');
const from=src.indexOf('  function idsFromKey(k){');
const until=src.indexOf('  function selectedPaymentIds(panel){',from);
assert(from>0&&until>from,'task payment identity helpers are present');
function helpers(){
 const cache={payments:{
  1234:{id:1234,stage_name:'2nd Installment',due_amount:105487.5,paid_amount:90000,due_date:'2026-02-28'},
  1233:{id:1233,stage_name:'3rd Installment',due_amount:105487.5,paid_amount:0,due_date:'2026-04-30'},
  1232:{id:1232,stage_name:'4th Installment',due_amount:105487.5,paid_amount:0,due_date:'2026-07-31'},
  1231:{id:1231,stage_name:'5th Installment',due_amount:105487.5,paid_amount:0,due_date:'2026-10-31'}
 },credits:{},outcomes:{21:{outcome:'no_response',created_at:'2026-10-19T12:29:40Z',before_task:{source:'automatic'}}}};
 const env={cache,text:v=>v==null?'':String(v),formatDate:v=>String(v).slice(0,10),
   isPaymentAction:a=>/payment|follow-up|overdue|installment/i.test(String(a))};
 vm.createContext(env);
 vm.runInContext(src.slice(from,until)+';globalThis.helpers={linkedPaymentIds,taskPaymentContext,taskOriginText};',env);
 return env.helpers;
}
test('group key overrides stale single schedule ID, preserving all 1010 obligations',()=>{
 const h=helpers();
 const t={auto_key:'overdue_follow_up|unit:471|schedules:1232,1233,1234',schedule_id:1231};
 assert.deepEqual(Array.from(h.linkedPaymentIds(t)),[1232,1233,1234]);
 assert.doesNotMatch(h.taskPaymentContext({...t,action_label:'Payment Follow-up with Customer'}),/5th Installment/);
 assert.match(h.taskPaymentContext({...t,action_label:'Payment Follow-up with Customer'}),/226,462\.50/);
});
test('origin shows automatic to no-response transition',()=>{
 const h=helpers();
 assert.match(h.taskOriginText({id:21,source:'manual',created_at:'2026-08-29T16:46:13Z'}),/Automatic task → No response on 2026-10-19/);
});
test('manual save rejects an overlapping follow-up on the same date',()=>{
 assert.match(src,/Payment already covered by task #/);
 assert.match(src,/linkedPaymentIds\(t\)\.some\(function\(id\)/);
});
test('automatic sync honors all group ids before one stray foreign key',()=>{
 const auto=fs.readFileSync('automatic_payment_actions_v2_patch.js','utf8');
 assert.match(auto,/var ids=keyIds\.length\?keyIds:/);
 assert.match(auto,/manualSchedule\[String\(id\)\]=1/);
});
test('database migration preserves group identity during an outcome and deduplicates',()=>{
 const migration=fs.readFileSync('supabase/migrations/20261022183000_preserve_followup_payment_group.sql','utf8');
 assert.match(migration,/overdue_follow_up/);
 assert.match(migration,/v_followup_key/);
 assert.match(migration,/v_duplicate/);
 assert.match(migration,/when v_is_group then null else s.id/);
});
