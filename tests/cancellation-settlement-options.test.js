const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const form=fs.readFileSync('unit_detail_workflow_patch.js','utf8');
const archive=fs.readFileSync('cancelled_unit_edit_patch.js','utf8');
const sql=fs.readFileSync('supabase/migrations/20261019131500_selectable_cancellation_settlement.sql','utf8');
const main=fs.readFileSync('build.js','utf8');

function mock(current='Forfeited',amount=20634){
 const elems={
   cuSettlement:{value:current},
   cuRefundAmount:{value:'0.00',disabled:false,dataset:{}},
   cuForfeitedAmount:{value:amount.toFixed(2),disabled:false,dataset:{}},
   cuSummaryRefund:{textContent:''},
   cuSummaryForfeit:{textContent:''},
   cuSummaryNote:{textContent:''}
 };
 const start=form.indexOf('  function settlementFields(paid){');
 const end=form.indexOf('  /* Visual grouping',start);
 assert.ok(start>=0&&end>start);
 const sandbox={document:{getElementById(k){return elems[k]}},valueOf(k){return elems[k]&&elems[k].value||''},formatMoney(n){return 'AED '+Number(n).toFixed(2)}};
 vm.runInNewContext(form.slice(start,end)+'\nthis.change=settlementFields;this.refresh=updateCancellationSettlementSummary;',sandbox);
 return {elems,change:()=>sandbox.change(amount),refresh:()=>sandbox.refresh()};
}
test('four settlement choices remain in the live form and Forfeited is a default not a lock',()=>{
 for(const opt of ['Refunded','Forfeited','Split','No settlement'])assert.ok(form.includes('<option value="'+opt+'"'),opt);
 assert.ok(form.includes('<option value="Forfeited" selected>'));
 assert.match(form,/settlement\.onchange = function\(\)\{ settlementFields\(paid\); \}/);
 assert.ok(!main.includes("'cancelled_forfeit_rule_patch_v2.js'"));
});
test('full Refund displays exact amount and locks only amount fields',()=>{
 const o=mock('Refunded');o.change();
 assert.equal(o.elems.cuSettlement.value,'Refunded');
 assert.equal(o.elems.cuRefundAmount.value,'20634.00');
 assert.equal(o.elems.cuForfeitedAmount.value,'0.00');
 assert.equal(o.elems.cuRefundAmount.disabled,true);
 assert.equal(o.elems.cuForfeitedAmount.disabled,true);
 assert.equal(o.elems.cuSummaryRefund.textContent,'AED 20634.00');
 assert.match(o.elems.cuSummaryNote.textContent,/full paid amount.*refund/);
});
test('full Forfeited displays exact amount and does not lock the selector',()=>{
 const o=mock();o.change();
 assert.equal(o.elems.cuSettlement.value,'Forfeited');
 assert.equal(o.elems.cuRefundAmount.value,'0.00');
 assert.equal(o.elems.cuForfeitedAmount.value,'20634.00');
 assert.equal(o.elems.cuSummaryForfeit.textContent,'AED 20634.00');
 assert.match(o.elems.cuSummaryNote.textContent,/marked as forfeited/);
});
test('Split permits editing both amounts and updates the preview',()=>{
 const o=mock('Split');o.change();
 assert.equal(o.elems.cuRefundAmount.disabled,false);
 assert.equal(o.elems.cuForfeitedAmount.disabled,false);
 o.elems.cuRefundAmount.value='10000.00';
 o.elems.cuForfeitedAmount.value='10634.00';
 o.refresh();
 assert.equal(o.elems.cuSummaryRefund.textContent,'AED 10000.00');
 assert.equal(o.elems.cuSummaryForfeit.textContent,'AED 10634.00');
 assert.match(form,/Math\.abs\(refund \+ forfeited - paid\) > 0\.01/);
});
test('No settlement records zero assigned to either bucket, retains amount paid separately',()=>{
 const o=mock('No settlement');o.change();
 assert.equal(o.elems.cuSettlement.value,'No settlement');
 assert.equal(o.elems.cuRefundAmount.value,'0.00');
 assert.equal(o.elems.cuForfeitedAmount.value,'0.00');
 assert.equal(o.elems.cuSummaryForfeit.textContent,'AED 0.00');
 assert.match(o.elems.cuSummaryNote.textContent,/No refund or forfeiture is recorded/);
});
test('existing cancellation date, payment amounts and confirmation remain unchanged',()=>{
 for(const field of ["id=\"cuDate\" value=\"' + todayISO()", "p_cancellation_date:date", "p_refund_amount:refund", "p_forfeited_amount:forfeited","sb.rpc('crm_cancel_unit'"])assert.ok(form.includes(field),field);
 assert.match(form,/window\.confirm\(summary\)/);
 assert.match(form,/state\.selectedUnit = null/);
});
test('new database functions honour all 4 options without touching existing rows',()=>{
 for(const k of ["when 'refunded' then 'Refunded'","when 'forfeited' then 'Forfeited'","when 'split' then 'Split'","when 'no settlement' then 'No settlement'"])assert.ok(sql.includes(k),k);
 assert.match(sql,/v_settlement,\s+v_refund,\s+v_forfeited/);
 assert.match(sql,/jsonb_build_object\([\s\S]*?'settlement_type', v_settlement/);
 assert.match(sql,/abs\(\(v_refund \+ v_forfeited\) - v_amount_paid\) > 0\.01/);
 assert.match(sql,/coalesce\(p_cancellation_date,current_date\)/);
 assert.match(sql,/profiles\.role = 'crm_officer'::user_role/);
 assert.match(sql,/v_settlement not in \('forfeited','refunded','customer retained','split','no settlement'\)/);
 assert.match(sql,/v_settlement = 'no settlement' then/);
 assert.doesNotMatch(sql,/\b(update|delete|truncate)\s+public\.cancelled_units\s+where\s+id\s*=/i);
});
test('cancelled unit archive shows and preserves No settlement if later edited',()=>{
 assert.ok(archive.includes("option('No settlement',outcome(record),'No settlement recorded yet')"));
 assert.ok(archive.includes("outcomeEl.value === 'No settlement'"));
 assert.match(archive,/sb\.rpc\('crm_edit_cancelled_unit'/);
});
