const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sql=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','20261020_b2703_atomic_spa_credit_issuance.sql'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','spa_price_revision_ui_patch.js'),'utf8');
test('secure issuance is opt-in and restricted to authenticated CRM officers',()=>{
 assert.match(sql,/if v_user is null then raise exception 'Authentication required'/i);
 assert.match(sql,/if v_role is distinct from 'crm_officer'/i);
 assert.match(sql,/revoke all on function public\.crm_issue_b2703_spa_credit\(bigint\) from public,anon/i);
 assert.match(sql,/grant execute on function public\.crm_issue_b2703_spa_credit\(bigint\) to authenticated/i);
 assert.match(sql,/v_allocation\.status<>'approved_pending_issue'/i);
 assert.match(sql,/v_allocation\.unit_id<>467/i);
});
test('atomic operation preserves collectible balance and creates linked audit',()=>{
 assert.match(sql,/v_before_net := v_schedule\.due_amount - v_schedule\.paid_amount-v_prior_credit/);
 assert.match(sql,/v_after_net := v_schedule\.due_amount-v_schedule\.paid_amount-v_prior_credit/);
 assert.match(sql,/if abs\(v_before_net-v_after_net\)>0\.01 then/);
 assert.match(sql,/update public\.payment_schedule[\s\S]*?set due_amount=v_allocation\.spa_gross_amount/);
 assert.match(sql,/insert into public\.credit_notes/);
 assert.match(sql,/insert into public\.spa_stage_credit_issue_audit/);
 assert.match(sql,/unique\(allocation_id\)/);
 assert.match(sql,/v_reference := 'SPA-UPLIFT-B2703-'/);
 assert.match(sql,/lock table public\.credit_notes in share row exclusive mode/);
});
test('second installment Accounts clearance is mandatory before DP, first and second issuance',()=>{
 assert.match(sql,/v_schedule\.stage_name in \('Down Payment','1st Installment','2nd Installment'\)/);
 assert.match(sql,/v_confirmed < v_check_schedule\.due_amount-0\.01/);
 assert.match(sql,/accounts_confirmation_status='confirmed'/);
 assert.match(sql,/v_schedule\.paid_amount < v_required-0\.01/);
 assert.match(sql,/v_confirmed < v_required-0\.01/);
});
test('existing invoices and dates are untouched by migration and UI cannot bypass server eligibility',()=>{
 assert.doesNotMatch(sql,/update public\.payment_transactions/i);
 assert.doesNotMatch(sql,/update public\.sales/i);
 assert.doesNotMatch(sql,/set (?:due_date|revised_due_date|paid_date)\s*=/i);
 assert.match(sql,/issue_date,v_today/);
 assert.match(ui,/match\.canIssue/);
 assert.match(ui,/window\.confirm\(question\)/);
 assert.match(ui,/sb\.rpc\('crm_issue_b2703_spa_credit'/);
 assert.doesNotMatch(ui,/sb\.from\('credit_notes'\)\.insert/);
});
