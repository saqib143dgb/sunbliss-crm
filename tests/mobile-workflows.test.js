const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const read=name=>fs.readFileSync(name,'utf8');
const source=read('mobile_workflow_hardening_patch.js');

function setupMobile(){
  const bodyClasses=new Set();
  const callbacks={};
  const added=[];
  const styles=[];
  const fields={};
  const makeInput=value=>({
    value,classList:{
      names:new Set(),
      add(name){this.names.add(name)},
      toggle(name){if(this.names.has(name)){this.names.delete(name);return false}this.names.add(name);return true},
      contains(name){return this.names.has(name)}
    },
    dataset:{},
    setAttribute(){},
    insertAdjacentElement(where,node){added.push(node)}
  });
  fields.cePassport=makeInput('PASSPORT-EXAMPLE');
  fields.ceEid=makeInput('EMIRATES-EXAMPLE');
  const panel={
    id:'customerEditPanel',isConnected:true,hidden:false,style:{},
    classList:{add(){}},
    hasAttribute(){return false},setAttribute(){},
    getAttribute(){return null},
    querySelector(selector){return fields[selector.replace('#','')]||null}
  };
  const document={
    head:{appendChild(el){styles.push(el)}},
    createElement(tag){
      if(tag==='style')return {textContent:'',id:''};
      return {className:'',textContent:'',type:'button',attrs:{},
        setAttribute(key,val){this.attrs[key]=val},
        addEventListener(event,fn){this.handlers=this.handlers||{};this.handlers[event]=fn}
      };
    },
    querySelectorAll(){return [panel]},
    body:{classList:{toggle(name,on){if(on)bodyClasses.add(name);else bodyClasses.delete(name)}}},
    addEventListener(event,fn){callbacks['document:'+event]=fn}
  };
  const window={
    innerWidth:390,
    getComputedStyle(){return {display:'block'}},
    requestAnimationFrame(callback){callback()},
    addEventListener(event,fn){callbacks['window:'+event]=fn}
  };
  vm.runInNewContext(source,{window,document});
  return {bodyClasses,callbacks,fields,added,styles,window,panel};
}

test('full-screen mobile editor hides background, respects safe areas, retains footer',()=>{
  const v=setupMobile();
  assert.equal(v.bodyClasses.has('crm-mobile-editor-open'),true);
  const css=v.styles[0].textContent;
  for(const selector of ['#inlineComplianceEditor','#paymentPlanRevisionPanel','#customerNotesManagementPanel']){
    assert.ok(css.includes(selector),selector+' must be accounted for');
  }
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/top:var\(--crm-vtop,0px\)/);
  assert.match(css,/#app>\.topbar/);
  v.window.innerWidth=1300;
  v.callbacks['window:resize']();
  assert.equal(v.bodyClasses.has('crm-mobile-editor-open'),false);
});

test('passport and Emirates ID are visually masked without modifying their values',()=>{
  const v=setupMobile();
  assert.equal(v.added.length,2);
  assert.equal(v.fields.cePassport.value,'PASSPORT-EXAMPLE');
  assert.equal(v.fields.ceEid.value,'EMIRATES-EXAMPLE');
  assert.equal(v.added[0].textContent,'Show');
  v.added[0].handlers.click({preventDefault(){},stopPropagation(){}});
  assert.equal(v.added[0].textContent,'Hide');
  assert.equal(v.fields.cePassport.value,'PASSPORT-EXAMPLE');
  assert.equal(v.fields.cePassport.classList.contains('crm-reveal-value'),true);
});

test('completion dates must be present before SPA signed or Oqood completed save',()=>{
  const s=read('inline_spa_oqood_patch.js');
  assert.match(s,/var complete=kind==='spa'\?statusEl\.value==='Signed':statusEl\.value==='Completed'/);
  assert.match(s,/if\(complete && !\(dateEl && dateEl\.value\)\)/);
});

test('payment revisions are balanced, cents preserved, and approvals not invented',()=>{
  const s=read('payment_plan_revision_ui_patch.js');
  assert.match(s,/netAmountDelta\+=round2/);
  assert.match(s,/if\(Math\.abs\(netAmountDelta\)>\.01\)/);
  assert.match(s,/safe\(amountValue\.toFixed\(2\)\)/);
  assert.match(s,/id="rppApprovedOn" value=""/);
  assert.match(s,/id="rppApprovedBy" value=""/);
});

test('no silent sale repricing; payment stage controls stay explicit',()=>{
  const unit=read('unit_editor_patch.js');
  const payment=read('payment_detail_patch.js');
  const installment=read('installment_edit_patch.js');
  const build=read('build.js');
  assert.match(unit,/data-original-total/);
  assert.match(unit,/Math\.abs\(enteredValue-originalValue\)>\.005/);
  assert.match(payment,/payment-detail-add\"><summary>Add additional installment \(advanced\)/);
  assert.match(installment,/label\.textContent='Paid:'/);
  assert.ok(build.indexOf("'mobile_workflow_hardening_patch.js'")>build.indexOf("'inventory_layout_refinement_patch.js'"));
  assert.doesNotMatch(source,/\bsb\.from\(|\bsb\.rpc\(/);
});
