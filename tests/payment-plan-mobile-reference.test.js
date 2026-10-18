const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const logic=fs.readFileSync('payment_detail_patch.js','utf8');
const layout=fs.readFileSync('payment_plan_mobile_reference_patch.js','utf8');

function layoutCss(){
  const styles=[];
  const document={createElement(tag){assert.equal(tag,'style');return {id:'',textContent:''}},head:{appendChild(el){styles.push(el)}}};
  const window={};
  vm.runInNewContext(layout,{document,window});
  vm.runInNewContext(layout,{document,window});
  assert.equal(styles.length,1);
  assert.equal(styles[0].id,'sunblissPaymentPlanMobileReferenceStyles');
  return styles[0].textContent;
}

function examplePaymentPlan(){
  const stage=(label,due,paid,date,id)=>({label,due,paid,dueDate:date,id});
  return [
    stage('Down Payment',20633.5,20633.5,'2026-10-16',10),
    stage('1st Installment',598371.5,0,'2026-11-15',11),
    stage('DLD + Admin Fees',87634,5100,'2026-11-15',12),
    stage('Final (Handover)',1444345,0,'2027-10-31',13),
    stage('2nd Installment',null,0,null,null)
  ];
}

function openFixture(){
  const model={overlay:null,menu:null,styles:[],clicks:{},buttons:{}};
  function createElement(tag){
    const el={tag,attributes:{},listeners:{},style:{},children:[],innerHTML:'',id:'',textContent:'',
      appendChild(child){this.children.push(child);child.parentNode=this;if(this===model.menu)model.menuItem=child;if(this===model.body)model.overlay=child},
      addEventListener(k,fn){this.listeners[k]=fn},
      querySelectorAll(){return []},
      getAttribute(k){return this.attributes[k]||null},
      setAttribute(k,v){this.attributes[k]=v},
      remove(){if(model.overlay===this)model.overlay=null}
    };
    return el;
  }
  model.menu=createElement('div');model.body=createElement('body');
  const state={selectedUnit:'B2-408::777',detailFrom:'list',view:'detail',userRole:'crm_officer',dues:[{unit:'B2-408',sno:777,name:'Test Customer',stages:examplePaymentPlan()}]};
  const document={
    body:model.body,
    head:{appendChild(el){model.styles.push(el)}},
    createElement,
    getElementById(id){
      if(id==='sunblissPaymentDetailStyles')return model.styles.find(s=>s.id===id)||null;
      if(id==='customerActionMenu')return model.menu;
      if(id==='actionEditPaymentDetail')return model.menuItem||null;
      if(id==='paymentDetailOverlay')return model.overlay;
      if(['pdClose','pdBack','pdAddSave','paymentDetailError'].includes(id)){
        if(!model.buttons[id])model.buttons[id]=createElement('button');
        return model.buttons[id];
      }
      return null;
    }
  };
  const window={state,addEventListener(){},renderDetail(){},esc:s=>String(s)};
  const context={window,document,state,alert(){throw Error('Unexpected alert')}};
  vm.runInNewContext(logic,context);
  assert.ok(model.menuItem,'the existing menu item should remain registered');
  model.menuItem.listeners.click({preventDefault(){},stopPropagation(){}});
  assert.ok(model.overlay);
  return model;
}

test('existing Edit Payment Plan action opens the form with header, scroll body and footer',()=>{
  const f=openFixture();
  const html=f.overlay.innerHTML;
  for(const x of ['id="paymentDetailDialog"','id="paymentDetailTitle"','id="pdBack"','class="payment-plan-head"','class="payment-plan-scroll"','class="payment-detail-actions"','id="pdClose"']){
    assert.ok(html.includes(x),x);
  }
  assert.ok(html.includes('Edit payment plan'));
  assert.ok(html.includes('Unit B2-408'));
  assert.equal(typeof f.buttons.pdBack.onclick,'function');
  assert.equal(typeof f.buttons.pdClose.onclick,'function');
  f.buttons.pdBack.onclick();
  assert.equal(f.overlay,null,'back should close the panel');
});

test('property installment amounts retain their exact fils instead of rounding to AED',()=>{
  const html=openFixture().overlay.innerHTML;
  assert.ok(html.includes('AED 20,633.50'));
  assert.ok(html.includes('AED 598,371.50'));
  assert.ok(html.includes('AED 1,444,345'));
  assert.ok(html.includes('Paid: AED 20,633.50'));
  assert.ok(html.includes('Paid: AED 5,100'));
  assert.equal((html.match(/data-stage-index=/g)||[]).length,5,'original stage index mapping retained');
});

test('installment cards remain two-column with smaller adjacent Edit controls on iPhone',()=>{
  const css=layoutCss();
  const row=css.match(/#paymentDetailDialog \.payment-detail-row\{([^}]+)\}/);
  const edit=css.match(/#paymentDetailDialog \.payment-detail-row \.payment-detail-edit\{([^}]+)\}/);
  assert.ok(row&&edit);
  assert.match(row[1],/grid-template-columns:minmax\(0,1fr\) auto!important/);
  assert.match(edit[1],/width:auto!important/);
  assert.match(edit[1],/min-width:57px!important/);
  assert.doesNotMatch(edit[1],/width:100%/);
  assert.match(css,/font-family:CRMInter,Inter,Arial,sans-serif!important/);
});

test('fixed header/footer and iPhone safe area surround a scrollable installment region',()=>{
  const css=layoutCss();
  const dialog=css.match(/#paymentDetailDialog,#paymentDetailDialog\.crm-full-page-dialog\{([^}]+)\}/);
  const scroll=css.match(/#paymentDetailDialog \.payment-plan-scroll\{([^}]+)\}/);
  const footer=css.match(/#paymentDetailDialog \.payment-detail-actions\{([^}]+)\}/);
  assert.ok(dialog&&scroll&&footer);
  assert.match(dialog[1],/display:flex!important;flex-direction:column!important/);
  assert.match(dialog[1],/overflow:hidden!important/);
  assert.match(scroll[1],/flex:1 1 auto!important;min-height:0!important/);
  assert.match(scroll[1],/overflow-y:auto!important/);
  assert.match(footer[1],/position:relative!important;bottom:auto!important/);
  assert.match(footer[1],/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
  assert.match(css,/top:var\(--crm-vtop,0px\)!important/);
});

test('unused stages and additional installment tools are available but collapsed initially',()=>{
  const html=openFixture().overlay.innerHTML;
  assert.match(html,/<details class="payment-detail-unused"><summary>Set up unused installment stages<\/summary>/);
  assert.match(html,/<details class="payment-detail-add"><summary>Add additional installment<\/summary>/);
  assert.ok(html.includes('id="pdAddAmount"'));
  assert.ok(html.includes('id="pdAddDueDate"'));
  assert.ok(html.includes('id="pdAddRemarks"'));
  assert.equal(typeof openFixture().buttons.pdAddSave.onclick,'function');
});

test('editing and adding installments retain original CRM handlers and data validation',()=>{
  assert.match(logic,/openExistingEditor\(Number\(button\.getAttribute\('data-stage-index'\)\)\)/);
  assert.match(logic,/function openExistingEditor\(index\)/);
  assert.match(logic,/var cards=document\.querySelectorAll\('\.ledger-scroll \.stage-card'\)/);
  assert.match(logic,/sb\.rpc\('crm_save_installment'/);
  assert.match(logic,/if \(!isFinite\(amount\) \|\| amount<=0\)/);
  assert.match(logic,/if \(!dueDate\)/);
  assert.doesNotMatch(layout,/sb\.from\(|sb\.rpc\(|fetch\(/);
});

test('mobile-only styling does not alter dashboards, desktop layouts or other editors',()=>{
  const css=layoutCss();
  assert.match(css,/@media\(max-width:1023px\)/);
  assert.doesNotMatch(css,/#customerEditPanel|#inlineComplianceEditor|\.dashboard|\.overview|\.sb-v2-kpi/);
  const build=fs.readFileSync('build.js','utf8');
  assert.ok(build.indexOf("'payment_plan_mobile_reference_patch.js'")>build.indexOf("'customer_editor_mobile_reference_patch.js'"));
});


test('payment plan header and form frame follow Edit Customer geometry',()=>{
  const css=layoutCss();
  const customer=fs.readFileSync('customer_editor_mobile_reference_patch.js','utf8');
  const header=css.match(/#paymentDetailDialog \.payment-plan-head\{([^}]+)\}/);
  const title=css.match(/#paymentDetailDialog #paymentDetailTitle\{([^}]+)\}/);
  const panel=css.match(/#paymentDetailDialog \.payment-plan-scroll\{([^}]+)\}/);
  const customerCard=customer.match(/body\.crm-customer-editor-open>#customerEditPanel \.crm-customer-editor-card\{([^}]+)\}/);
  assert.ok(header&&title&&panel&&customerCard);
  assert.match(header[1],/margin:0 0 22px!important/);
  assert.match(title[1],/font-size:24px!important;line-height:1\.25!important;font-weight:700!important/);
  assert.match(panel[1],/flex:1 1 auto!important;min-height:0!important/);
  assert.match(panel[1],/margin:0!important;padding:18px 15px 21px!important/);
  assert.match(panel[1],/border:1px solid var\(--paper-line,#ded7c8\)!important/);
  assert.match(panel[1],/border-bottom:0!important/);
  assert.match(panel[1],/border-radius:14px 14px 0 0!important/);
  for(const prop of ['padding:18px 15px 21px!important','border-bottom:0!important','border-radius:14px 14px 0 0!important','scroll-padding-bottom:28px!important']){
    assert.ok(customerCard[1].includes(prop),'approved Edit Customer form has '+prop);
    assert.ok(panel[1].includes(prop),'Payment Plan must share '+prop);
  }
});
test('payment form border ends at fixed footer divider with no spacer',()=>{
  const css=layoutCss();
  const panel=css.match(/#paymentDetailDialog \.payment-plan-scroll\{([^}]+)\}/);
  const footer=css.match(/#paymentDetailDialog \.payment-detail-actions\{([^}]+)\}/);
  assert.ok(panel&&footer);
  assert.match(panel[1],/border-bottom:0!important/);
  assert.match(footer[1],/margin:0 -16px calc\(-14px - env\(safe-area-inset-bottom\)\)!important/);
  assert.match(footer[1],/border-top:1px solid var\(--paper-line,#ded7c8\)!important/);
  assert.match(footer[1],/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
});
