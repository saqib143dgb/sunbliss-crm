const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261020_b2703_spa_gross_installments_net_protection.sql'),'utf8');
const source=fs.readFileSync(path.join(root,'payment_schedule_source_truth_patch.js'),'utf8');
const core=fs.readFileSync(path.join(root,'lib/spa_credit_issuance_readiness.js'),'utf8');
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const base=fs.readFileSync(path.join(root,'vendor/base/chunk_10.js'),'utf8');

test('exact signed SPA and approved net credit allocation totals are mandatory',()=>{
 assert.match(sql,/spa_price=2002000/);
 assert.match(sql,/v_allocation_count<>7 or v_credit_total<>59000 or v_gross_total<>2002000/);
 assert.match(sql,/v_allocation_count<>7 or v_old_total<>1943000/);
 assert.match(sql,/due_amount=rec.spa_gross_amount/);
 assert.match(sql,/revised_due_amount=old_due/);
 assert.match(sql,/if new_status is distinct from old_status then/);
 assert.match(sql,/signed_spa_due = original_due \+ approved_pending_credit/);
});
test('no existing payment/date/receipt/issued credit/DLD record is modified during migration',()=>{
 assert.doesNotMatch(sql,/update public\.payment_transactions/i);
 assert.doesNotMatch(sql,/delete from public\./i);
 assert.doesNotMatch(sql,/insert into public\.credit_notes/i);
 assert.doesNotMatch(sql,/set\s+due_date\s*=/i);
 assert.doesNotMatch(sql,/set\s+revised_due_date\s*=/i);
 assert.doesNotMatch(sql,/set\s+paid_date\s*=/i);
 assert.match(sql,/where s\.unit_id=467/);
 assert.match(sql,/where revision_id=v_revision_id and unit_id=467/);
 assert.doesNotMatch(sql,/update public\.units/i);
 assert.doesNotMatch(sql,/update public\.sales/i);
});
test('issuance removes net bridge only together with posting the matching credit note',()=>{
 assert.match(sql,/v_schedule\.revised_due_amount \+ v_allocation\.approved_amount <> v_schedule\.due_amount/);
 assert.match(sql,/v_before_net := v_schedule\.revised_due_amount - v_schedule\.paid_amount-v_prior_credit/);
 assert.match(sql,/update public\.payment_schedule\s+set revised_due_amount=null/);
 assert.match(sql,/insert into public\.credit_notes/);
 assert.match(sql,/v_after_net := v_schedule\.due_amount-v_schedule\.paid_amount-v_prior_credit/);
 assert.match(sql,/if abs\(v_before_net-v_after_net\)>0\.01/);
 assert.match(sql,/insert into public\.spa_stage_credit_issue_audit/);
 assert.match(sql,/v_confirmed < coalesce\(v_check_schedule\.revised_due_amount/);
});
test('customer stage displays signed gross without counting pending credit as issued',()=>{
 assert.match(source,/due:grossDue,spaCollectionDue:due,spaPendingCN/);
 assert.match(source,/dst\.spaCollectionDue=src\.spaCollectionDue/);
 assert.match(source,/dst\.spaPendingCN=src\.spaPendingCN/);
 assert.match(source,/remaining=round2\(due-cash-credit\)/);
 assert.match(build,/stageStatus\(n\.spaCollectionDue\|\|n\.due,n\.paid/);
 assert.match(build,/Approved CN \(Pending\)/);
 assert.doesNotMatch(source,/creditBySchedule\[k\].*approved_amount/);
});
test('compiled source customer card preserves DLD and existing Accounts status display',()=>{
 const a=build.indexOf('function fixInstallmentLedgerRender(');
 const b=build.indexOf('function simplifyDldTracker(',a);
 const c=build.indexOf('function showAccountsPendingInInstallmentLedger(');
 const d=build.indexOf('function transformCore(',c);
 assert.ok(a>=0&&b>a&&c>b&&d>c);
 const normalize=new Function(build.slice(a,b)+';return fixInstallmentLedgerRender;')();
 const transform=new Function(build.slice(c,d)+';return showAccountsPendingInInstallmentLedger;')();
 const rendered=transform(normalize(base));
 assert.match(rendered,/stageStatus\(n\.spaCollectionDue\|\|n\.due,n\.paid/);
 assert.match(rendered,/Approved CN \(Pending\)/);
 assert.match(rendered,/Accounts confirmation pending/);
 assert.match(rendered,/dldPaidWithinTolerance\(n\.due,dldSettledAmount\(n\)\)/);
});
