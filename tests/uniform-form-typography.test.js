const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('use the original CRM form typography rather than a late global override',()=>{
  const source=fs.readFileSync('vendor/base/index.html','utf8');
  const build=fs.readFileSync('build.js','utf8');
  assert.match(source,/\.brand-field\{display:block;font-size:11\.5px;color:var\(--muted\)/);
  assert.match(source,/\.brand-field input\[type=text\][^}]*font-size:13\.5px;color:var\(--ink\)/);
  assert.doesNotMatch(build,/'uniform_form_typography_patch\.js'/);
});

test('mobile Edit Customer labels use the original muted regular CRM scale',()=>{
  const customer=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');
  assert.match(customer,/\.crm-customer-editor-card \.brand-field\{[^']*font-size:11\.5px!important;font-weight:400!important;line-height:1\.4!important;color:var\(--muted,#66635c\)!important/);
  assert.match(customer,/\.brand-field input\{[^']*font-size:16px!important;font-weight:500!important/);
  assert.match(customer,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
  assert.match(customer,/\.crm-customer-editor-title\{[^']*font-size:24px!important/);
});

test('SPA and Oqood field captions share the same regular CRM label style',()=>{
  const spa=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.match(spa,/\.crm-compliance-field-label\{[^']*font-size:11\.5px;line-height:1\.4;font-weight:400;color:var\(--muted,#66635c\)/);
  assert.match(spa,/\.crm-compliance-select-wrap select,[^']*font-size:16px;font-weight:450/);
});

test('spacing, bottom actions, and scroll are preserved on mobile',()=>{
  const customer=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');
  const spa=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.match(customer,/\.crm-customer-editor-card\{[^']*flex:1 1 auto!important;min-height:0!important/);
  assert.match(customer,/\.crm-customer-editor-actions\{[^']*flex-direction:row!important/);
  assert.match(customer,/calc\(32px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(spa,/\.crm-compliance-editor-actions\{[^']*flex-direction:row!important/);
});

test('typography changes cannot mutate CRM business data',()=>{
  const build=fs.readFileSync('build.js','utf8');
  const customer=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');
  const spa=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.ok(build.includes("'customer_editor_mobile_reference_patch.js'"));
  assert.doesNotMatch(customer,/sb\.from\(|sb\.rpc\(/);
  assert.doesNotMatch(spa,/sb\.from\(|sb\.rpc\(/);
});
