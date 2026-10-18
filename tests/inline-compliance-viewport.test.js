const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');

function fixture(width=390){
  const classes=new Set(),attrs={},callbacks={},styles=[],model={panel:null};
  let observe,removed=0;
  const strip={id:'inlineComplianceStrip',parentNode:{insertAdjacentElement(pos,el){el.parentNode=this}}};
  const body={classList:{toggle(k,v){if(v)classes.add(k);else classes.delete(k)}},appendChild(el){el.parentNode=this}};
  const document={
    body,documentElement:{},
    head:{appendChild(el){styles.push(el)}},
    createElement(){return {id:'',textContent:''}},
    getElementById(id){
      if(id==='sunblissInlineComplianceFullPageFixStyles')return null;
      if(id==='inlineComplianceEditor')return model.panel;
      if(id==='inlineComplianceStrip')return model.strip===false?null:strip;
      return null;
    },
    addEventListener(name,fn){callbacks['document:'+name]=fn}
  };
  const window={
    innerWidth:width,state:{view:'detail',selectedUnit:'B2-408::543'},
    matchMedia(){return {matches:window.innerWidth<=1023}},
    MutationObserver:class{constructor(fn){observe=fn}observe(){}},
    addEventListener(name,fn){callbacks['window:'+name]=fn}
  };
  const context={window,document,MutationObserver:window.MutationObserver,requestAnimationFrame(fn){fn()},setTimeout(){}};
  vm.runInNewContext(source,context);
  function open(){
    const panel={
      id:'inlineComplianceEditor',nodeType:1,
      parentNode:{id:'customer-detail'},
      getAttribute(k){return attrs[k]||null},
      setAttribute(k,v){attrs[k]=v},
      remove(){removed++;model.panel=null}
    };
    model.panel=panel;
    observe([{addedNodes:[panel],removedNodes:[]}]);
    return panel;
  }
  return {classes,styles,model,body,strip,window,callbacks,open,get removed(){return removed},notify(node){observe([{addedNodes:[],removedNodes:[node]}])}};
}

test('SPA and Oqood mobile editor is elevated to body, above customer header',()=>{
  const a=fixture();
  const panel=a.open();
  assert.equal(panel.parentNode,a.body);
  assert.equal(a.classes.has('sunbliss-inline-compliance-full-page'),true);
  assert.equal(panel.getAttribute('data-crm-compliance-unit'),'B2-408::543');
  const css=a.styles[0].textContent;
  assert.match(css,/>#inlineComplianceEditor\{position:fixed!important/);
  assert.match(css,/z-index:30000!important/);
  assert.match(css,/#app>\.topbar\{visibility:hidden!important/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/\.crm-compliance-editor-card \.brand-field:last-child\{margin-bottom:0!important/);
});

test('closing an SPA/Oqood editor unlocks the page',()=>{
  const a=fixture(),panel=a.open();
  panel.remove();
  a.notify(panel);
  assert.equal(a.classes.has('sunbliss-inline-compliance-full-page'),false);
});

test('navigating to a different customer closes a portaled editor',()=>{
  const a=fixture();a.open();
  a.window.state.selectedUnit='B2-709::700';
  a.callbacks['window:pageshow']();
  assert.equal(a.removed,1);
  assert.equal(a.classes.has('sunbliss-inline-compliance-full-page'),false);
});

test('desktop editor retains its inline layout',()=>{
  const a=fixture(1200),panel=a.open();
  assert.notEqual(panel.parentNode,a.body);
  assert.equal(a.classes.has('sunbliss-inline-compliance-full-page'),false);
});

test('successful SPA/Oqood save explicitly removes portaled editor',()=>{
  const s=fs.readFileSync('inline_spa_oqood_patch.js','utf8');
  assert.match(s,/if\(savedEditor\)savedEditor\.remove\(\)/);
  assert.match(s,/if \(result\.error\) throw result\.error;[\s\S]*savedEditor\.remove\(\)/);
});

test('reference SPA/Oqood editor has matching header and grouped status/date inputs',()=>{
  const component=fs.readFileSync('inline_spa_oqood_patch.js','utf8');
  const css=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.match(component,/id="inlineComplianceBack"/);
  assert.match(component,/crm-compliance-editor-title/);
  assert.match(component,/crm-compliance-editor-card/);
  assert.match(component,/id="inlineComplianceStatus"/);
  assert.match(component,/id="inlineComplianceDate"/);
  assert.match(component,/crm-compliance-date-placeholder/);
  assert.match(component,/Select date/);
  assert.match(component,/aria-label="Back to customer"/);
  assert.match(component,/inlineComplianceBack'\)\.onclick=function\(\)\{ panel\.remove\(\); \}/);
  assert.match(css,/crm-compliance-select-wrap/);
  assert.match(css,/crm-compliance-optional/);
});

test('Save and Cancel share one fixed row, each equal width on narrow mobile',()=>{
  const component=fs.readFileSync('inline_spa_oqood_patch.js','utf8');
  const css=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.match(component,/crm-compliance-editor-actions/);
  assert.match(component,/id="inlineComplianceSave"/);
  assert.match(component,/id="inlineComplianceCancel"/);
  assert.match(css,/body\.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>\.crm-compliance-editor-actions\{[^']*flex-direction:row!important/);
  assert.match(css,/\.crm-compliance-editor-actions button\{[^']*flex:1 1 0%!important/);
  assert.match(css,/gap:10px!important/);
  assert.doesNotMatch(css,/body\.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>\.brand-editor-actions\{[^']*flex-direction:column!important/);
});

test('reference design preserves backend status update and does not introduce database mutations',()=>{
  const component=fs.readFileSync('inline_spa_oqood_patch.js','utf8');
  const css=fs.readFileSync('inline_compliance_full_page_fix_patch.js','utf8');
  assert.match(component,/sb\.from\('sales'\)\.update\(payload\)\.eq\('unit_id',c\.sno\)/);
  assert.doesNotMatch(css,/sb\.from\(|sb\.rpc\(/);
});
