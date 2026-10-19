const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('unit_detail_workflow_patch.js','utf8');
const build=fs.readFileSync('build.js','utf8');

function extract(a,b){const start=source.indexOf(a),end=source.indexOf(b,start+a.length);assert.ok(start>=0&&end>start);return source.slice(start,end)}
test('settlement preview is authored directly in cancellation form before remarks and fixed footer',()=>{
  let markup=extract("    panel.innerHTML =","    insertAfterBadges(panel);");
  const select=markup.indexOf('id="cuSettlement"'),preview=markup.indexOf('id="cuSummaryRefund"'),remarks=markup.indexOf('id="cuRemarks"'),footer=markup.indexOf('class="brand-editor-actions"');
  assert.ok(select>=0&&preview>select&&remarks>preview&&footer>remarks);
  for(const id of ['cuSummaryForfeit','cuSummaryNote','cuRefundAmount','cuForfeitedAmount'])assert.ok(markup.includes(id));
});
test('deprecated forcing script is absent from compiled patch list',()=>{
  assert.ok(!build.includes("'cancelled_forfeit_rule_patch_v2.js'"));
  assert.ok(build.includes("'unit_detail_workflow_patch.js'"));
  assert.match(source,/function updateCancellationSettlementSummary\(\)/);
});
test('preview stays in scrolling form with no third flex sibling below footer',()=>{
  let form=extract("  function cancellationRootUi(panel){","  function showCancellationPanel(c){");
  assert.match(form,/card\.appendChild\(node\)/);
  assert.match(form,/panel\.insertBefore\(card,actions\)/);
  assert.match(source,/#unitCancellationPanel \.sunbliss-forfeit-rule\{/);
  assert.match(source,/body\.crm-cancel-ui-open>#unitCancellationPanel>.crm-cancel-scroll/);
});
test('existing date defaults, authorization, amount validation and save procedure stay in place',()=>{
  assert.match(source,/id="cuDate" value="' \+ todayISO\(\)/);
  assert.match(source,/var date = valueOf\('cuDate'\)/);
  assert.match(source,/p_cancellation_date:date/);
  assert.match(source,/sb\.rpc\('crm_cancel_unit'/);
  assert.match(source,/state\.userRole === 'crm_officer'/);
  assert.match(source,/if \(refund \+ forfeited > paid \+ 0\.01\)/);
});
