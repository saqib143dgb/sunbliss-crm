const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const migration=fs.readFileSync('supabase/migrations/20261022141500_dld_date_independent_from_first.sql','utf8');
const forward=fs.readFileSync('supabase/migrations/20261022130000_first_installment_dld_date_sync.sql','utf8');
const editor=fs.readFileSync('installment_edit_patch.js','utf8');

test('reverse DLD-to-first date synchronization is removed from the save RPC',()=>{
  assert.match(migration,/v_stage_name = ''DLD \+ Admin Fees \(SPA\)''/);
  assert.match(migration,/EXECUTE replace\(function_sql,old_block,marker\)/);
  assert.match(migration,/trg_sync_first_dld_on_date_change/);
  assert.match(migration,/No existing due dates or payment records are modified/);
});

test('first installment date edits still sync DLD through database trigger',()=>{
  assert.match(forward,/AFTER UPDATE OF due_date, revised_due_date ON public\.payment_schedule/);
  assert.match(forward,/NEW\.due_date IS DISTINCT FROM OLD\.due_date/);
  assert.match(forward,/d\.customer_id = NEW\.customer_id/);
});

test('installment editor explains one-way syncing rather than claiming both directions',()=>{
  assert.match(editor,/Changing the 1st Installment due date also updates DLD \+ Admin Fees/);
  assert.match(editor,/You can edit the DLD date independently without changing the 1st Installment/);
  assert.doesNotMatch(editor,/Changing either one updates the other/);
  assert.match(editor,/sb\.rpc\('crm_save_installment'/);
});

test('new-customer booking form still permits independently entered DLD dates',()=>{
  assert.match(editor,/function fromDld\(\)\{ state\.__ncDldDateManual=true; \}/);
  assert.match(editor,/if \(!state\.__ncDldDateManual\) dld\.value=first\.value/);
});
