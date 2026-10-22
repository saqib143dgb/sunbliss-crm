const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20261022130000_first_installment_dld_date_sync.sql','utf8');

test('first installment date edits sync DLD with a database trigger',()=>{
 assert.match(sql,/AFTER UPDATE OF due_date, revised_due_date ON public\.payment_schedule/);
 assert.match(sql,/NEW\.due_date IS DISTINCT FROM OLD\.due_date/);
 assert.match(sql,/NEW\.revised_due_date IS DISTINCT FROM OLD\.revised_due_date/);
 assert.match(sql,/NEW\.due_date.*THEN NEW\.due_date/s);
 assert.match(sql,/NEW\.revised_due_date.*THEN NEW\.revised_due_date/s);
});
test('DLD sync only matches the current customer and unit',()=>{
 assert.match(sql,/d\.unit_id = NEW\.unit_id/);
 assert.match(sql,/d\.customer_id = NEW\.customer_id/);
 assert.match(sql,/u\.id = NEW\.unit_id AND u\.customer_id = NEW\.customer_id/);
 assert.match(sql,/customer_id = v_customer_id and stage_name/);
});
test('the rule preserves past due dates until an installment is edited',()=>{
 assert.match(sql,/CREATE TRIGGER trg_sync_first_dld_on_date_change/);
 assert.doesNotMatch(sql,/UPDATE public\.payment_schedule.*SET due_date\s*=\s*\(\s*SELECT/s);
});
test('new-booking default excludes previous buyers on the same unit',()=>{
 assert.match(sql,/ps\.unit_id = NEW\.unit_id/);
 assert.match(sql,/ps\.customer_id = NEW\.customer_id/);
});
