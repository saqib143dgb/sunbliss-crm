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
  assert.match(css,/\.brand-field :is\(input,select\)\{display:block!important/);
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
