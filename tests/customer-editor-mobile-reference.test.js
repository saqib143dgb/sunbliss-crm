const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');

function fixture(width=390){
  const classes=new Set(),callback={},styles=[],records={},model={panel:null};
  let observe;
  function node(tag,id='',classString=''){
    const el={tagName:tag.toUpperCase(),nodeType:1,id,children:[],parentNode:null,attrs:{},_html:'',events:{}};
    let cls=new Set(classString.split(/\s+/).filter(Boolean));
    el.classList={add(v){cls.add(v)},remove(v){cls.delete(v)},contains(v){return cls.has(v)}};
    el.matches=(sel)=>sel==='label.brand-field'&&el.tagName==='LABEL'&&cls.has('brand-field');
    el.setAttribute=(k,v)=>{el.attrs[k]=v};
    el.getAttribute=k=>el.attrs[k]||null;
    el.removeAttribute=k=>{delete el.attrs[k]};
    el.appendChild=child=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);el.children.push(child);child.parentNode=el};
    el.insertBefore=(child,before)=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);const i=el.children.indexOf(before);el.children.splice(i<0?el.children.length:i,0,child);child.parentNode=el};
    el.querySelector=selector=>{
      if(selector==='button'&&el._html.includes('<button')){
        if(!el._button)el._button={addEventListener(k,fn){el.events[k]=fn}};
        return el._button;
      }
      if(selector.startsWith('.'))return el.children.find(x=>x.classList.contains(selector.slice(1)))||null;
      return null;
    };
    Object.defineProperty(el,'firstChild',{get(){return el.children[0]||null}});
    Object.defineProperty(el,'innerHTML',{get(){return el._html},set(v){el._html=v}});
    el.remove=()=>{if(el.parentNode)el.parentNode.children=el.parentNode.children.filter(x=>x!==el);el.parentNode=null;if(model.panel===el)model.panel=null};
    return el;
  }
  const body=node('body');
  body.classList={toggle(k,v){if(v)classes.add(k);else classes.delete(k)},contains(k){return classes.has(k)}};
  const oldParent=node('div');
  const editAction=node('button','btnEditCustomer');
  oldParent.appendChild(editAction);
  editAction.insertAdjacentElement=(where,el)=>{oldParent.insertBefore(el,oldParent.children[oldParent.children.indexOf(editAction)+1])};
  const document={
    body,documentElement:{},
    head:{appendChild(el){styles.push(el)}},
    createElement(tag){return tag==='style'?{id:'',textContent:''}:node(tag)},
    getElementById(id){if(id==='customerEditPanel')return model.panel;if(id==='btnEditCustomer')return editAction;return null},
    addEventListener(k,fn){callback['document:'+k]=fn}
  };
  const window={
    innerWidth:width,state:{view:'detail',selectedUnit:'B2-408::439'},
    matchMedia(){return {matches:window.innerWidth<=1023}},
    requestAnimationFrame(fn){fn()},
    MutationObserver:class{constructor(fn){observe=fn}observe(){}},
    addEventListener(k,fn){callback['window:'+k]=fn}
  };
  vm.runInNewContext(source,{document,window,MutationObserver:window.MutationObserver,setTimeout(){}});
  function open(){
    const panel=node('div','customerEditPanel','brand-editor');
    panel.appendChild(node('p','','section-label'));
    panel.appendChild(node('p','','stat-sub'));
    panel.appendChild(node('p','customerEditError','brand-error'));
    const inputs=[];
    ['ceName','cePhone','ceEmail','ceNationality','ceDesignation','ceDob','cePassport','ceEid','ceAddress','cePermanentAddress','ceCoApplicant'].forEach(id=>{
      const label=node('label','','brand-field');label.fieldId=id;label.value='existing-'+id;
      panel.appendChild(label);inputs.push(label);
    });
    panel.appendChild(node('div','','brand-editor-actions'));
    oldParent.appendChild(panel);model.panel=panel;
    observe([{type:'childList',addedNodes:[panel],removedNodes:[]}]);
    return {panel,inputs};
  }
  return {open,body,oldParent,styles,classes,model,window,callback,notifyRemoved(panel){observe([{type:'childList',addedNodes:[],removedNodes:[panel]}])}};
}

test('mobile Edit Customer is body-level and retains every existing input unchanged',()=>{
  const x=fixture(),{panel,inputs}=x.open();
  assert.equal(panel.parentNode,x.body);
  assert.equal(x.classes.has('crm-customer-editor-open'),true);
  const card=panel.querySelector('.crm-customer-editor-card');
  assert.ok(card);
  assert.equal(card.children.length,11);
  assert.deepEqual(card.children.map(n=>n.fieldId),inputs.map(n=>n.fieldId));
  assert.ok(inputs.every(n=>n.value==='existing-'+n.fieldId));
  assert.equal(panel.getAttribute('data-crm-customer-unit'),'B2-408::439');
  assert.equal(panel.querySelector('.crm-customer-editor-actions').parentNode,panel);
});

test('typography follows CRM global font family and consistent field scale',()=>{
  const css=fixture().styles[0].textContent;
  assert.match(css,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
  assert.match(css,/\.crm-customer-editor-title\{[^']*font-size:24px!important/);
  assert.match(css,/\.brand-field\{[^']*font-size:14px!important/);
  assert.match(css,/\.brand-field input\{[^']*font-size:16px!important/);
  assert.match(css,/\.crm-customer-editor-actions>button\{[^']*font-size:15px!important/);
});

test('Save and Cancel remain one row, above the iPhone bottom curvature',()=>{
  const css=fixture().styles[0].textContent;
  assert.match(css,/\.crm-customer-editor-actions\{[^']*flex-direction:row!important/);
  assert.match(css,/\.crm-customer-editor-actions\{[^']*padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
  assert.match(css,/\.crm-customer-editor-actions>button\{[^']*flex:1 1 0%!important/);
  assert.match(css,/top:var\(--crm-vtop,0px\)!important/);
  assert.match(css,/height:var\(--crm-vh,100dvh\)!important/);
});

test('Back closes editor, and navigation to another unit cleans up the modal',()=>{
  const x=fixture(),{panel}=x.open();
  const head=panel.querySelector('.crm-customer-editor-head');
  assert.ok(head&&head.events.click);
  head.events.click();
  x.notifyRemoved(panel);
  assert.equal(x.model.panel,null);
  assert.equal(x.classes.has('crm-customer-editor-open'),false);
  const b=fixture(),y=b.open();
  b.window.state.selectedUnit='B2-709::700';
  b.callback['window:pageshow']();
  assert.equal(b.model.panel,null);
});

test('desktop view keeps the existing fields inline and does not portal the editor',()=>{
  const x=fixture(1280),{panel}=x.open();
  assert.equal(panel.parentNode,x.oldParent);
  assert.equal(panel.querySelector('.crm-customer-editor-head'),null);
  assert.equal(x.classes.has('crm-customer-editor-open'),false);
});

test('customer Save logic and field names remain in original CRM code',()=>{
  const crm=fs.readFileSync('feature_patch.js','utf8');
  for(const field of ['ceName','cePhone','ceEmail','ceNationality','ceDesignation','ceDob','cePassport','ceEid','ceAddress','cePermanentAddress','ceCoApplicant']){
    assert.match(crm,new RegExp(field));
  }
  assert.match(crm,/sb\.from\('customers'\)\.update\(payload\)\.eq\('id',c\.customerId\)/);
  assert.match(crm,/if \(savedEditor\) savedEditor\.remove\(\)/);
  assert.match(crm,/if \(!name\)/);
  assert.doesNotMatch(source,/sb\.from\(|sb\.rpc\(/);
  const build=fs.readFileSync('build.js','utf8');
  assert.ok(build.indexOf("'customer_editor_mobile_reference_patch.js'")>build.indexOf("'inventory_layout_refinement_patch.js'"));
});
