const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('uniform_form_typography_patch.js','utf8');

function typographyCss(){
  const styles=[];
  const doc={
    createElement(tag){assert.equal(tag,'style');return {id:'',textContent:''};},
    head:{appendChild(el){styles.push(el)}}
  };
  const win={};
  vm.runInNewContext(source,{window:win,document:doc});
  vm.runInNewContext(source,{window:win,document:doc});
  assert.equal(styles.length,1,'the typography CSS must install only once');
  assert.equal(styles[0].id,'sunblissUniformFormTypographyStyles');
  return styles[0].textContent;
}

test('field captions match reference image: muted grey, regular, CRMInter',()=>{
  const css=typographyCss();
  assert.match(css,/--crm-form-label-size:14px/);
  assert.match(css,/--crm-form-label-weight:400/);
  assert.match(css,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
  assert.match(css,/font-size:var\(--crm-form-label-size\)!important/);
  assert.match(css,/font-weight:var\(--crm-form-label-weight\)!important/);
  assert.match(css,/color:var\(--muted,#66635c\)!important/);
});

test('filled values match reference image: navy, medium-bold, unchanged field size',()=>{
  const css=typographyCss();
  assert.match(css,/--crm-form-value-size:16px/);
  assert.match(css,/--crm-form-value-weight:650/);
  assert.match(css,/font-weight:var\(--crm-form-value-weight\)!important/);
  assert.match(css,/color:var\(--ink,#102333\)!important/);
  assert.match(css,/::placeholder/);
  assert.match(css,/font-weight:400!important;color:var\(--muted,#66635c\)!important/);
});

test('style covers customer, unit, sale, SPA/Oqood and scheduled action forms',()=>{
  const css=typographyCss();
  for(const part of ['.brand-editor label.brand-field','#scheduledActionPanel label.brand-field','#customerPaymentResponsePanel label.brand-field','#modificationRequestPanel label.brand-field','#paymentPlanRevisionPanel label.rpp-field','#installmentEditDialog label.brand-field','#paymentDetailDialog label.brand-field','#inlineComplianceEditor .crm-compliance-field-label','#customerEditPanel .crm-customer-editor-card label.brand-field']){
    assert.ok(css.includes(part),'missing coverage: '+part);
  }
});

test('styling is limited to forms and does not change dashboard headings or controls',()=>{
  const css=typographyCss();
  assert.doesNotMatch(css,/\.stat-cell|#btnGenerateDocument|\.overview|#monthlySales|#unitSold|\.dashboard|\.btn-gold|\.crm-customer-editor-actions>button/);
  assert.doesNotMatch(source,/sb\.from\(|sb\.rpc\(|fetch\(|localStorage|addEventListener\(/);
});

test('last-loaded typography rules override older customer editor weights',()=>{
  const build=fs.readFileSync('build.js','utf8');
  const customer=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');
  assert.ok(build.indexOf("'uniform_form_typography_patch.js'")>build.indexOf("'customer_editor_mobile_reference_patch.js'"));
  assert.match(customer,/\.crm-customer-editor-card \.brand-field/);
  const css=typographyCss();
  assert.match(css,/body\.crm-customer-editor-open>#customerEditPanel \.crm-customer-editor-card label\.brand-field\{/);
  assert.match(css,/body\.crm-customer-editor-open>#customerEditPanel \.crm-customer-editor-card label\.brand-field input\{/);
});
