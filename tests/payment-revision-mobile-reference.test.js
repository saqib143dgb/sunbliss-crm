const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const logic=fs.readFileSync('payment_plan_revision_ui_patch.js','utf8');
const layout=fs.readFileSync('payment_revision_mobile_reference_patch.js','utf8');

function css(){
  const added=[];
  const doc={head:{appendChild(s){added.push(s)}},createElement(tag){assert.equal(tag,'style');return {id:'',textContent:''}}};
  const w={};
  vm.runInNewContext(layout,{document:doc,window:w});
  vm.runInNewContext(layout,{document:doc,window:w});
  assert.equal(added.length,1);
  assert.equal(added[0].id,'sunblissRevisionMobileReferenceStyles');
  return added[0].textContent;
}
function rule(source,selector){
  const start=source.indexOf(selector+'{');
  assert.ok(start>=0,'Missing CSS '+selector);
  return source.slice(start,source.indexOf('}',start)+1);
}

test('revision editor uses standard CRM heading and an accessible back button',()=>{
  assert.match(logic,/function revisionHeader\(c\)\{/);
  assert.match(logic,/class="rpp-back" id="rppBack" aria-label="Back to customer"/);
  assert.match(logic,/class="rpp-mobile-title">Payment Plan Revision/);
  assert.match(logic,/class="rpp-unit-title">Unit /);
  assert.match(logic,/document\.getElementById\('rppBack'\)\.onclick=closePanel/);
  const s=css();
  const heading=rule(s,'#paymentPlanRevisionPanel .rpp-title');
  assert.match(heading,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
  assert.match(heading,/font-size:24px!important;line-height:1\.25!important;font-weight:700!important/);
  assert.match(s,/#paymentPlanRevisionPanel \.rpp-head \.rpp-back\{display:inline-flex!important/);
  assert.match(s,/#paymentPlanRevisionPanel \.rpp-kicker,#paymentPlanRevisionPanel \.rpp-unit-title,#paymentPlanRevisionPanel \.rpp-head #rppClose\{display:none!important/);
});

test('header/footer are fixed and bordered form alone scrolls like Edit Customer',()=>{
  const s=css();
  const panel=rule(s,'#paymentPlanRevisionPanel.rpp-panel');
  const shell=rule(s,'#paymentPlanRevisionPanel .rpp-shell');
  const heading=rule(s,'#paymentPlanRevisionPanel .rpp-head');
  const scroll=rule(s,'#paymentPlanRevisionPanel .rpp-scroll');
  const footer=rule(s,'#paymentPlanRevisionPanel .rpp-actions');
  assert.match(panel,/height:var\(--crm-vh,100dvh\)!important/);
  assert.match(panel,/overflow:hidden!important/);
  assert.match(shell,/display:flex!important;flex-direction:column!important/);
  assert.match(heading,/flex:0 0 auto!important/);
  assert.match(scroll,/flex:1 1 auto!important;min-height:0!important/);
  assert.match(scroll,/overflow-y:auto!important/);
  assert.match(scroll,/border:1px solid var\(--paper-line,#ded7c8\)!important;border-bottom:0!important;border-radius:14px 14px 0 0!important/);
  assert.match(footer,/position:relative!important;bottom:auto!important/);
  assert.match(footer,/margin:0 -16px calc\(-14px - env\(safe-area-inset-bottom\)\)!important/);
  assert.match(footer,/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
});

test('save and cancel remain equal-width in a single safe-area row',()=>{
  const s=css();
  const footer=rule(s,'#paymentPlanRevisionPanel .rpp-actions');
  const buttons=rule(s,'#paymentPlanRevisionPanel .rpp-actions>button');
  assert.match(footer,/flex-direction:row!important/);
  assert.match(footer,/gap:10px!important/);
  assert.match(buttons,/flex:1 1 0%!important/);
  assert.match(buttons,/min-height:48px!important/);
  assert.match(logic,/id="rppSave"/);
  assert.match(logic,/id="rppCancel"/);
  assert.match(logic,/save\.onclick=saveRevision/);
});

test('installment selectors and approval form retain original actions',()=>{
  assert.match(logic,/data-rpp-mode="single"/);
  assert.match(logic,/data-rpp-mode="multiple"/);
  assert.match(logic,/data-rpp-select/);
  assert.match(logic,/data-rpp-date/);
  assert.match(logic,/data-rpp-amount/);
  assert.match(logic,/id="rppApprovedOn"/);
  assert.match(logic,/id="rppApprovedBy"/);
  assert.match(logic,/id="rppReference"/);
  assert.match(logic,/id="rppReason"/);
  assert.match(logic,/shell\.querySelectorAll\('\[data-rpp-mode\]'\)/);
  assert.match(logic,/shell\.querySelectorAll\('\[data-rpp-select\]'\)/);
  assert.match(logic,/function setMode\(mode\)/);
  assert.match(logic,/function toggleSelection\(id,checked\)/);
  const s=css();
  assert.match(rule(s,'#paymentPlanRevisionPanel .rpp-card:not(.selected) .rpp-fields'),/display:none!important/);
  assert.match(rule(s,'#paymentPlanRevisionPanel .rpp-mode'),/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
});

test('existing approval notice, amounts, date validation and save RPC unchanged',()=>{
  assert.match(logic,/Management approval required\.<\/b> Use this for an approved change to the payment plan/);
  assert.match(logic,/var approvedOn=text\(document\.getElementById\('rppApprovedOn'\)/);
  assert.match(logic,/var approvedBy=text\(document\.getElementById\('rppApprovedBy'\)/);
  assert.match(logic,/if\(!approvedOn\)\{showError/);
  assert.match(logic,/if\(!approvedBy\)\{showError/);
  assert.match(logic,/var targetAmount=amount===''[\s\S]*?isFinite\(targetAmount\)/);
  assert.match(logic,/sb\.rpc\('crm_revise_payment_plan'/);
  assert.match(logic,/p_revisions:revisions/);
  assert.match(logic,/function remaining\(r,credits\)/);
  assert.doesNotMatch(layout,/sb\.from\(|sb\.rpc\(|fetch\(|XMLHttpRequest/);
});

test('loading and error screens also retain accessible back navigation',()=>{
  assert.match(logic,/p\.innerHTML='<div class="rpp-shell">'\+revisionHeader\(c\)/);
  assert.match(logic,/sh\.innerHTML=revisionHeader\(c\)/);
  assert.match(logic,/var back=document\.getElementById\('rppBack'\);if\(back\)back\.onclick=closePanel/);
});

test('styling is mobile-only and preserves desktop visual layout',()=>{
  const s=css();
  const first=s.indexOf('@media(max-width:1023px)');
  assert.ok(first>0);
  assert.ok(s.slice(0,first).includes('.rpp-back,.rpp-mobile-title,.rpp-mobile-context{display:none}'));
  assert.ok(s.slice(first).includes('#paymentPlanRevisionPanel .rpp-scroll'));
  assert.doesNotMatch(s,/#customerEditPanel|#inlineComplianceEditor|#installmentEditDialog|\.dashboard|\.overview/);
  const build=fs.readFileSync('build.js','utf8');
  assert.ok(build.indexOf("'payment_revision_mobile_reference_patch.js'")>build.indexOf("'payment_plan_mobile_reference_patch.js'"));
});
