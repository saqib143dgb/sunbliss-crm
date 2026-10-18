const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('unit_editor_mobile_reference_patch.js','utf8');
const logic=fs.readFileSync('unit_editor_patch.js','utf8');

function fixture(width=390){
  const styles=[],callbacks={},ctx={panel:null};
  let observer;
  const classSet=(val)=>new Set(String(val||'').split(/\s+/).filter(Boolean));
  function node(tag,id='',classString=''){
    let classes=classSet(classString);
    const el={nodeType:1,tagName:tag.toUpperCase(),id,parentNode:null,children:[],attrs:{},_html:'',events:{}};
    Object.defineProperty(el,'className',{get(){return Array.from(classes).join(' ')},set(s){classes=classSet(s)}});
    el.classList={
      contains(name){return classes.has(name)},
      add(name){classes.add(name)},
      remove(name){classes.delete(name)},
      toggle(name,on){if(on===undefined)on=!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on}
    };
    Object.defineProperty(el,'firstChild',{get(){return el.children[0]||null}});
    Object.defineProperty(el,'innerHTML',{get(){return el._html},set(v){el._html=v}});
    el.getAttribute=k=>el.attrs[k]??null;
    el.setAttribute=(k,v)=>{el.attrs[k]=v};
    el.removeAttribute=k=>{delete el.attrs[k]};
    el.hasAttribute=k=>Object.prototype.hasOwnProperty.call(el.attrs,k);
    el.appendChild=child=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);el.children.push(child);child.parentNode=el;return child};
    el.insertBefore=(child,before)=>{if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(x=>x!==child);let j=el.children.indexOf(before);el.children.splice(j<0?el.children.length:j,0,child);child.parentNode=el};
    Object.defineProperty(el,'nextSibling',{get(){if(!el.parentNode)return null;const list=el.parentNode.children;return list[list.indexOf(el)+1]||null}});
    el.remove=()=>{if(el.parentNode)el.parentNode.children=el.parentNode.children.filter(x=>x!==el);el.parentNode=null;if(ctx.panel===el)ctx.panel=null};
    el.querySelector=sel=>{
      if(sel==='button'&&el._html.includes('<button')){
        if(!el._button)el._button={addEventListener(k,fn){el.events[k]=fn}};
        return el._button;
      }
      if(sel.startsWith('.')){
        const klass=sel.slice(1);
        const walk=parent=>{for(const c of parent.children){if(c.classList.contains(klass))return c;let x=walk(c);if(x)return x}return null};
        return walk(el);
      }
      return null;
    };
    el.closest=sel=>{if(sel!=='#unitEditPanel')return null;let curr=el;while(curr){if(curr.id==='unitEditPanel')return curr;curr=curr.parentNode}return null};
    return el;
  }
  const body=node('body');
  const detail=node('div','','detail');
  const badges=node('div','','badges');
  detail.appendChild(badges);
  const document={
    body,documentElement:{},
    createElement(type){return type==='style'?{id:'',textContent:''}:node(type)},
    head:{appendChild(style){styles.push(style)}},
    getElementById(id){return id==='unitEditPanel'?ctx.panel:null},
    querySelector(sel){return sel==='.detail'?detail:null},
    addEventListener(k,fn){callbacks['document:'+k]=fn}
  };
  const window={
    innerWidth:width,state:{view:'detail',selectedUnit:'B2-408::543'},
    matchMedia(){return {matches:window.innerWidth<=1023}},
    requestAnimationFrame(fn){fn()},
    MutationObserver:class{constructor(fn){observer=fn}observe(){}},
    addEventListener(k,fn){callbacks['window:'+k]=fn}
  };
  vm.runInNewContext(source,{document,window,setTimeout(){}});
  function open(){
    const panel=node('div','unitEditPanel','brand-editor');
    panel.appendChild(node('p','','section-label'));
    panel.appendChild(node('p','','stat-sub'));
    panel.appendChild(node('p','unitEditError','brand-error'));
    panel.appendChild(node('p','','unit-editor-note'));
    const grid=node('div','','unit-editor-grid');
    const fields=['euUnitNo','euProject','euUnitType','euFloor','euArea','euPpsf','euTotalPrice','euStatus','euFurnishing'];
    const original=fields.map(id=>{const field=node('label','','brand-field');field.fieldId=id;field.value='original-'+id;grid.appendChild(field);return field});
    panel.appendChild(grid);
    panel.appendChild(node('p','','unit-editor-protected'));
    panel.appendChild(node('div','','brand-editor-actions'));
    detail.appendChild(panel);ctx.panel=panel;
    observer([{type:'childList',target:detail,addedNodes:[panel],removedNodes:[]}]);
    return {panel,grid,original};
  }
  function notify(node){
    observer([{type:'childList',target:detail,addedNodes:[],removedNodes:[node]}]);
  }
  return {open,notify,window,document,body,detail,styles,ctx,callbacks};
}

function rule(css,selector){
  const pos=css.indexOf(selector+'{');
  assert.ok(pos>=0,'Missing rule '+selector);
  return css.slice(pos,css.indexOf('}',pos)+1);
}

test('iPhone Edit Unit has a fixed CRM header and portals above the page',()=>{
  const f=fixture();
  const {panel}=f.open();
  assert.equal(panel.parentNode,f.body);
  assert.equal(f.body.classList.contains('crm-unit-editor-open'),true);
  assert.equal(panel.getAttribute('data-crm-unit-owner'),'B2-408::543');
  assert.ok(panel.querySelector('.crm-unit-editor-head'));
  const css=f.styles[0].textContent;
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel'),/z-index:30060!important/);
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel'),/height:var\(--crm-vh,100dvh\)!important/);
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel'),/overflow:hidden!important/);
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-title'),/font-size:24px!important/);
});

test('all nine original unit fields and existing values survive grouping',()=>{
  const f=fixture();
  const {panel,grid,original}=f.open();
  const card=panel.querySelector('.crm-unit-editor-card');
  assert.ok(card);
  assert.equal(grid.parentNode,card);
  assert.equal(grid.children.length,9);
  for(let i=0;i<original.length;i++){
    assert.equal(grid.children[i],original[i]);
    assert.equal(grid.children[i].value,'original-'+original[i].fieldId);
  }
  assert.ok(card.querySelector('.unit-editor-note'));
  assert.ok(card.querySelector('.unit-editor-protected'));
  assert.ok(card.querySelector('.brand-error'));
  assert.ok(panel.querySelector('.crm-unit-editor-actions'));
});

test('fixed footer has equal side-by-side buttons with approved iPhone clearance',()=>{
  const css=fixture().styles[0].textContent;
  const card=rule(css,'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card');
  const footer=rule(css,'body.crm-unit-editor-open>#unitEditPanel>.crm-unit-editor-actions');
  const buttons=rule(css,'body.crm-unit-editor-open>#unitEditPanel>.crm-unit-editor-actions>button');
  assert.match(card,/flex:1 1 auto!important;min-height:0!important/);
  assert.match(card,/overflow-y:auto!important/);
  assert.match(card,/border-bottom:0!important/);
  assert.match(card,/border-radius:14px 14px 0 0!important/);
  assert.match(footer,/flex-direction:row!important/);
  assert.match(footer,/margin:0 -16px calc\(-14px - env\(safe-area-inset-bottom\)\)!important/);
  assert.match(footer,/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
  assert.match(buttons,/flex:1 1 0%!important/);
  assert.match(buttons,/min-height:48px!important/);
});

test('CRM native label typography and single-column mobile fields are retained',()=>{
  const css=fixture().styles[0].textContent;
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field'),/font-size:11\.5px!important;font-weight:400!important/);
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field :is(input,select)'),/font-size:16px!important;font-weight:500!important/);
  assert.match(rule(css,'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .unit-editor-grid'),/grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
});

test('Back closes safely and route changes remove the portaled form',()=>{
  const f=fixture(),{panel}=f.open();
  const head=panel.querySelector('.crm-unit-editor-head');
  assert.ok(head.events.click);
  head.events.click();
  assert.equal(f.ctx.panel,null);
  assert.equal(f.body.classList.contains('crm-unit-editor-open'),false);
  const g=fixture();
  g.open();
  g.window.state.selectedUnit='B2-710::710';
  g.callbacks['window:pageshow']();
  assert.equal(g.ctx.panel,null);
  assert.equal(g.body.classList.contains('crm-unit-editor-open'),false);
});

test('desktop retains original inline location, grid and callbacks',()=>{
  const f=fixture(1280),{panel,grid}=f.open();
  assert.equal(panel.parentNode,f.detail);
  assert.equal(panel.querySelector('.crm-unit-editor-head'),null);
  assert.equal(grid.parentNode,panel);
  assert.equal(f.body.classList.contains('crm-unit-editor-open'),false);
});

test('resizing from mobile to desktop restores original node ownership',()=>{
  const f=fixture(),{panel,grid}=f.open();
  f.window.innerWidth=1280;
  f.callbacks['window:resize']();
  assert.equal(panel.parentNode,f.detail);
  assert.equal(grid.parentNode,panel);
  assert.equal(panel.getAttribute('data-crm-unit-mobile'),null);
  assert.equal(f.body.classList.contains('crm-unit-editor-open'),false);
});

test('existing edit permissions, validation and save RPC remain unchanged',()=>{
  const sourceCode=logic;
  for(const id of ['euUnitNo','euProject','euUnitType','euFloor','euArea','euPpsf','euTotalPrice','euStatus','euFurnishing']){
    assert.ok(sourceCode.includes(id),'missing original field '+id);
  }
  assert.match(sourceCode,/state\.userRole !== 'crm_officer'/);
  assert.match(sourceCode,/sb\.rpc\('crm_update_unit_details',payload\)/);
  assert.match(sourceCode,/if \(!unitNo\) throw new Error/);
  assert.match(sourceCode,/if \(!project\) throw new Error/);
  assert.match(sourceCode,/if \(status\.toLowerCase\(\) === 'cancelled'\) throw new Error/);
  assert.match(sourceCode,/await loadFromSupabase\(\);[\s\S]*?savedUnitEditor\.remove\(\)/);
  assert.doesNotMatch(source,/sb\.from\(|sb\.rpc\(|fetch\(/);
  const build=fs.readFileSync('build.js','utf8');
  assert.ok(build.indexOf("'unit_editor_mobile_reference_patch.js'")>build.indexOf("'payment_revision_mobile_reference_patch.js'"));
});
