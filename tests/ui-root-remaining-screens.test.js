const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sale=fs.readFileSync('compliance_editor_patch.js','utf8');
const notes=fs.readFileSync('notes_management_patch.js','utf8');
const tasks=fs.readFileSync('scheduled_actions_patch.js','utf8');
const preview=fs.readFileSync('task_outcome_experience.js','utf8');

function excerpt(s,start,end){
  let a=s.indexOf(start),b=s.indexOf(end,a+start.length);
  assert.ok(a>=0,'Missing code start '+start);
  assert.ok(b>a,'Missing code end '+end);
  return s.slice(a,b);
}
function cssRule(s,selector){
  let start=s.indexOf(selector+'{');
  assert.ok(start>=0,'Missing selector '+selector);
  return s.slice(start,s.indexOf('}',start)+1);
}
test('root sources not further overlay-patch files own the three mobile designs',()=>{
  for(const [file,src] of [
    ['compliance_editor_patch.js',sale],
    ['notes_management_patch.js',notes],
    ['scheduled_actions_patch.js',tasks]
  ])assert.ok(src.includes('crm-'),file);
  const build=fs.readFileSync('build.js','utf8');
  assert.doesNotMatch(build,/sale_notes_tasks_mobile_reference_patch/);
  for(const src of [sale,notes,tasks,preview])new vm.Script(src);
});

test('Edit Sale uses the approved fixed header, scrollable card, safe-area footer and CRM typography',()=>{
  assert.match(sale,/function saleRootLayout\(panel\)/);
  assert.match(sale,/function ensureSaleRootStyles\(\)/);
  assert.match(sale,/crm-sale-head/);
  assert.match(sale,/crm-sale-back/);
  assert.match(sale,/crm-sale-title/);
  assert.match(sale,/crm-sale-card/);
  assert.match(sale,/crm-sale-actions/);
  assert.match(sale,/font:700 24px\/1\.25 CRMInter/);
  assert.match(sale,/flex:1 1 auto!important;min-height:0!important;width:100%!important/);
  assert.match(sale,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
  assert.match(sale,/flex-direction:row!important;align-items:stretch!important;gap:10px!important/);
  assert.match(sale,/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
});
test('Edit Sale business input IDs, sale save fields and saved dates stay unchanged',()=>{
  for(const id of ['scBookingDate','scBookingAmount','scSoldBy','scSource','scBrokerName','scBrokerCompany','scBrokeragePct','scBrokerageAmount','scRemarks','scPartialBookingNote','scSave'])
    assert.ok(sale.includes(id),'Missing existing Sale field '+id);
  assert.match(sale,/booking_date:valueOf\('scBookingDate'\) \|\| null/);
  assert.match(sale,/var result = await sb\.from\('sales'\)\.update\(payload\)\.eq\('id',await currentSaleId\(c\.sno\)\)/);
  assert.match(sale,/\.eq\('customer_id',unit\.data\.customer_id\)/);
  assert.doesNotMatch(sale,/\.from\('sales'\)\.update\(payload\)\.eq\('unit_id'/);
  assert.match(sale,/await loadFromSupabase\(\)/);
  assert.match(sale,/function partialEligible\(bookingAmount,dpDue\)/);
  assert.match(sale,/if \(!partialNote && document\.getElementById/);
});
test('Sale panel reuses the existing input nodes rather than reconstructing a second form',()=>{
  let section=excerpt(sale,'function saleRootLayout(panel)','function cleanSaleEditor()');
  assert.match(section,/Array\.from\(panel\.children\)\.forEach/);
  assert.match(section,/card\.appendChild\(child\)/);
  assert.match(section,/while\(card\.firstChild\)panel\.insertBefore\(card\.firstChild,actions\)/);
  assert.doesNotMatch(section,/\.value\s*=|setAttribute\(['"]value|input\.value=/);
});
test('Notes are rendered at source with their own fixed header, scroll card and footer',()=>{
  assert.match(notes,/function buildNotesRoot\(panel,close\)/);
  assert.match(notes,/function closeNotesPanel\(panel\)/);
  assert.match(notes,/crm-notes-back/);
  assert.match(notes,/crm-notes-scroll/);
  assert.match(notes,/crm-notes-footer/);
  assert.match(notes,/font:700 24px\/1\.25 CRMInter/);
  assert.match(notes,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
  assert.match(notes,/calc\(32px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(notes,/\.notes-editor-actions\{position:static!important;bottom:auto!important;display:grid!important;grid-template-columns:1fr 1fr!important/);
});
test('Notes: all existing history, save and editor button paths remain intact',()=>{
  for(const id of ['notesHistoryBtn','notesEditBtn','notesEditorText','notesSaveBtn','notesCancelEditBtn','notesHistorySection','notesEditorSection'])
    assert.ok(notes.includes(id),id);
  assert.match(notes,/sb\.rpc\('crm_save_sales_note',\{p_unit_id:uid,p_note:ta\.value\}\)/);
  assert.match(notes,/fetchHistory\(uid\)/);
  assert.match(notes,/renderHistory\(history,await fetchHistory\(uid\)\)/);
  assert.match(notes,/function when\(v\)/);
  assert.match(notes,/ta\.value=txt\(sale\.customer_note\)/);
});
test('Scheduled Actions uses fixed chrome in the original renderer for new, edit and completion',()=>{
  assert.match(tasks,/function scheduledRootUi\(panel\)/);
  assert.equal((tasks.match(/scheduledRootUi\(p\);/g)||[]).length,2);
  assert.match(tasks,/crm-scheduled-back/);
  assert.match(tasks,/crm-scheduled-scroll/);
  assert.match(tasks,/crm-scheduled-actions/);
  assert.match(tasks,/font:700 24px\/1\.25 CRMInter/);
  assert.match(tasks,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
  assert.match(tasks,/flex-direction:row!important;align-items:stretch!important;gap:10px!important/);
  assert.match(tasks,/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
});
test('Scheduled Actions original due dates and all workflow handlers are preserved',()=>{
  assert.match(tasks,/task\?task\.due_date:''/);
  assert.match(tasks,/id="saDate" value/);
  assert.match(tasks,/function openComplete\(task\)/);
  assert.match(tasks,/async function completeTask\(task\)/);
  assert.match(tasks,/async function saveTask\(c,task\)/);
  assert.match(tasks,/async function cancelTask\(task\)/);
  assert.match(tasks,/sb\.rpc\('crm_record_scheduled_outcome'/);
  assert.match(tasks,/sb\.rpc\('crm_resolve_payment_workflow_task'/);
  assert.match(tasks,/sb\.rpc\('crm_record_extension_customer_response'/);
  assert.match(tasks,/if\(!due\)\{fail\('Select a due date\.'\)/);
  assert.match(tasks,/payload=\{action_label:action,due_date:due,priority:priority,note:selectedPaymentNote\(note,chosen\)/);
});
test('Scheduled Action preview remains in the scroll card when present',()=>{
  assert.match(preview,/panel\.querySelector\('\.crm-scheduled-scroll'\)/);
  assert.match(preview,/if\(scroll\)scroll\.appendChild\(box\);else actions\?\.before\(box\)/);
  assert.match(preview,/panel\.addEventListener\('outcome-options-changed',update\)/);
});
test('UI-only changes never manipulate original date inputs or business workflow state',()=>{
  const salePart=excerpt(sale,'function saleRootLayout(panel)','function cleanSaleEditor()');
  const notePart=excerpt(notes,'function noteRootStyles()','function closeActionMenu()');
  const taskPart=excerpt(tasks,'function scheduledRootUi(panel)','function openForm(task)');
  for(const [name,src] of [['sale',salePart],['notes',notePart],['tasks',taskPart]]){
    assert.doesNotMatch(src,/sb\.(?:rpc|from)\(|fetch\(|\.toISOString\(|\.setDate\(|\.value\s*=/,name);
    assert.doesNotMatch(src,/due_date\s*:|booking_date\s*:|payment_schedule/,name);
  }
});
test('desktop styling is unmodified because source-scoped UI applies only to mobile',()=>{
  assert.match(sale,/@media\(max-width:1023px\)/);
  assert.match(notes,/@media\(max-width:1023px\)/);
  assert.match(tasks,/@media\(max-width:1023px\)/);
  assert.match(sale,/if\(!mobile\)\{/);
  assert.match(tasks,/if\(!mobile\)return/);
  assert.match(notes,/if\(!window\.matchMedia\|\|!window\.matchMedia\('\(max-width:1023px\)'\)\.matches\)return/);
});


test('Record Payment credit-note heading and help are separate rows without overlap at desktop or mobile widths',()=>{
  const payment=fs.readFileSync('record_payment_reliability_patch.js','utf8');
  new vm.Script(payment);
  assert.match(payment, /class="credit-note-intro"><div class="credit-note-fields-title">Credit note<\/div><div class="credit-note-fields-help">Paperwork adjustment only\./);
  assert.match(payment, /#pfCreditFields \.credit-note-intro\{display:flex;flex-direction:column;align-items:flex-start;gap:6px/);
  assert.match(payment, /#pfCreditFields>\.credit-note-intro\{grid-column:1\/-1;margin:0 0 1px/);
  assert.doesNotMatch(payment, /credit-note-fields-title\{margin:0 0 -8px/);
  for (const id of ['pfCreditAmount','pfCreditDate','pfCreditReason','pfCreditRef','pfCreditToggle']) {
    assert.ok(payment.includes(id),'Existing credit-note input missing: '+id);
  }
  assert.match(payment, /crm_record_payment_with_method/);
  assert.match(payment, /crm_set_payment_confirmation_mode/);
});

test('desktop compact workspaces use the Record Payment proportions without changing saved CRM data',()=>{
  const desktop=fs.readFileSync('desktop_deep_page_shell_patch.js','utf8');
  new vm.Script(desktop);
  const begin=desktop.indexOf('/* Desktop form-workspace system.');
  assert.ok(begin>0,'Desktop form-workspace rules should be source-owned');
  const rules=desktop.slice(begin,desktop.indexOf("}${'\\n'}`;",begin)===-1?undefined:undefined);
  assert.match(desktop,/--crm-form-workspace-width:880px/);
  assert.match(desktop,/--crm-form-workspace-radius:16px/);
  assert.match(desktop,/max-height:min\(90dvh,850px\)!important/);
  assert.match(desktop,/overflow-y:auto!important/);
  assert.match(desktop,/min-width:0!important/);
  assert.match(desktop,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(desktop,/html body:not\(\.crm-scheduled-ui-open\) #scheduledActionPanel/);
  for(const id of [
    '#customerEditPanel','#unitEditPanel','#saleComplianceEditPanel',
    '#inlineComplianceEditor','#customerNotesManagementPanel','#creditNoteEditPanel',
    '#scheduledActionPanel','#customerPaymentResponsePanel',
    '#modificationRequestPanel','#paymentPlanRevisionPanel','#paymentExtensionPanel'
  ]) assert.ok(desktop.includes(id),'Missing desktop form '+id);
  assert.doesNotMatch(desktop,/sb\.from\(|sb\.rpc\(|payment_date\s*=|due_date\s*=|receipt_sent_at\s*=/);
  assert.doesNotMatch(desktop,/#crmDocumentDialog|#newCustomerPanel|#recordPaymentReliablePanel\{/);
  assert.match(desktop,/\/\* Existing centered Installment and Payment Details dialogs remain source-owned/);
});
