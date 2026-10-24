const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');

test('Credit Note three-dot menu is not hidden by cash transaction portal CSS',()=>{
  const s=read('transaction_action_menu_root_fix.js');
  new vm.Script(s);
  assert.match(s,/\.detail \.tx-actions-menu:not\(\.credit-note-actions-menu\)\{display:none!important/);
  assert.match(s,/\.detail \.credit-note-actions-menu\{visibility:visible!important;pointer-events:auto!important/);
  assert.doesNotMatch(s,/'\.detail \.tx-actions-menu\{display:none!important/);
  const credit=read('credit_note_edit_patch.js');
  assert.match(credit,/class="tx-actions-menu credit-note-actions-menu"/);
  assert.match(credit,/showEditor\(c,n,row\)/);
});

test('Desktop editors never sit beneath a body level click-blocking pseudo element',()=>{
  const s=read('desktop_deep_page_shell_patch.js');
  new vm.Script(s);
  assert.doesNotMatch(s,/body:has\([^)]*\)::before\{/);
  assert.match(s,/box-shadow:0 0 0 100vmax var\(--crm-form-workspace-overlay\)/);
  assert.match(s,/#transactionEditPanel,\s*#unitCancellationPanel,/);
  assert.match(s,/body:has\(:is\(#customerEditPanel/);
  assert.match(s,/#app\{\s*contain:none!important;/);
  assert.match(s,/:is\(#transactionEditPanel,#unitCancellationPanel\)>\.brand-editor-actions/);
  const workflow=read('full_page_action_workflow_patch.js');
  assert.match(workflow,/function markInlinePanels\(/);
  assert.match(workflow,/function markOverlays\(/);
});

test('Installment three-dot menu reopens and closes without duplicate body portals',()=>{
  const s=read('installment_menu_portal_patch.js');
  const base=read('installment_edit_patch.js');
  new vm.Script(s);new vm.Script(base);
  assert.match(s,/menu\.__crmSourceCard=card/);
  assert.match(s,/alreadyOpen/);
  assert.match(s,/e\.preventDefault\(\);e\.stopPropagation\(\);e\.stopImmediatePropagation\(\)/);
  assert.match(s,/closeMenus\(\);return;/);
  assert.match(base,/menu\.className='installment-menu-pop'/);
  assert.match(base,/openEditor\(c,stage\)/);
  assert.match(s,/attachDeleteAction\(menu,card\)/);
  assert.match(s,/openDeleteDialog\(pair\.customer,pair\.stage\)/);
});

test('Three-dot reliability changes do not modify stored customer, transaction, or installment data',()=>{
  for(const p of ['desktop_deep_page_shell_patch.js','transaction_action_menu_root_fix.js','installment_menu_portal_patch.js']){
    const s=read(p);
    assert.doesNotMatch(s,/\bsb\.rpc\(|\bsb\.from\(/,'DB write path must remain out of menu UI source');
  }
});
