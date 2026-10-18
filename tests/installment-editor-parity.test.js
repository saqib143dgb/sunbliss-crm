const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const logic=fs.readFileSync('installment_edit_patch.js','utf8');
const stylesheet=fs.readFileSync('payment_plan_mobile_reference_patch.js','utf8');

function runtime(){
  const start=logic.indexOf('  function text(value)');
  const end=logic.indexOf('  function ensureStyles()',start);
  const txStart=logic.indexOf('  async function transactionSummary(');
  const txEnd=logic.indexOf('  async function openEditor(',txStart);
  assert.ok(start>=0&&end>start&&txStart>0&&txEnd>txStart);
  const code=logic.slice(start,end)+'\n'+logic.slice(txStart,txEnd);
  const sandbox={
    window:{},
    sb:{
      from(table){
        assert.equal(table,'payment_transactions');
        return {
          select(query){
            assert.match(query,/payment_schedule_id/);
            return {eq(key,unit){
              assert.equal(key,'unit_id');
              assert.equal(unit,543);
              return Promise.resolve({data:[
                {payment_date:'2026-10-16',payment_type:'Booking Amount',amount:20634,payment_schedule_id:1524},
                {payment_date:'2026-10-16',payment_type:'DLD + Admin Fees (SPA) Partial-1',amount:5100,payment_schedule_id:1526},
                {payment_date:'2026-10-17',payment_type:'1st Installment partial-1',amount:3000,payment_schedule_id:null}
              ],error:null});
            }};
          }
        };
      }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(code+'\nthis.summarize=transactionSummary;',sandbox);
  return sandbox;
}

function css(){
  const styles=[];
  const document={createElement(){return {textContent:'',id:''}},head:{appendChild(x){styles.push(x)}}};
  vm.runInNewContext(stylesheet,{window:{},document});
  assert.equal(styles.length,1);
  return styles[0].textContent;
}

test('booking amount linked to Down Payment is counted regardless of label',async()=>{
  const x=runtime();
  const result=await x.summarize({sno:543},{id:1524,code:'DP',label:'Down Payment'});
  assert.equal(result.count,1);
  assert.equal(result.total,20634);
  assert.equal(result.lastDate,'2026-10-16');
});

test('DLD transaction is counted only in its corresponding schedule',async()=>{
  const x=runtime();
  const result=await x.summarize({sno:543},{id:1526,code:'DLD',label:'DLD + Admin Fees'});
  assert.equal(result.count,1);
  assert.equal(result.total,5100);
});

test('unlinked legacy payments use exact stage-label fallback without duplicates',async()=>{
  const x=runtime();
  const result=await x.summarize({sno:543},{id:1525,code:'1ST',label:'1st Installment'});
  assert.equal(result.count,1);
  assert.equal(result.total,3000);
});

test('editing an installment remains separate from transaction history writes',()=>{
  assert.match(logic,/sb\.from\('payment_transactions'\)\.select\('payment_date,payment_type,amount,payment_schedule_id'\)/);
  assert.match(logic,/linkedId!==null && linkedId!==undefined/);
  assert.match(logic,/Number\(linkedId\)===scheduleId/);
  assert.doesNotMatch(logic,/sb\.from\('payment_transactions'\)\.(?:update|delete|insert|upsert)/);
  assert.match(logic,/sb\.rpc\('crm_save_installment'/);
  assert.match(logic,/Verify the payment record before changing any amount/);
});

test('nested installment editor has back navigation, scroll frame and fixed actions',()=>{
  assert.match(logic,/class="installment-edit-head"/);
  assert.match(logic,/id="ieBack"/);
  assert.match(logic,/class="installment-edit-scroll"/);
  assert.match(logic,/class="installment-edit-actions"/);
  assert.match(logic,/document\.getElementById\('ieBack'\)\.addEventListener\('click'/);
  const style=css();
  for(const part of ['#installmentEditOverlay','#installmentEditDialog.crm-full-page-dialog','#installmentEditDialog .installment-edit-head','#installmentEditDialog .installment-edit-scroll','#installmentEditDialog .installment-edit-actions']){
    assert.ok(style.includes(part),part);
  }
  assert.match(style,/\.installment-edit-scroll\{[^}]*flex:1 1 auto!important;min-height:0!important/);
  assert.match(style,/\.installment-edit-scroll\{[^}]*border-bottom:0!important/);
  assert.match(style,/\.installment-edit-actions\{[^}]*flex-direction:row!important/);
  assert.match(style,/\.installment-edit-actions\{[^}]*calc\(32px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(style,/\.installment-edit-actions>button\{[^}]*flex:1 1 0%!important/);
});

test('stronger footer specificity prevents legacy 18px blank gap',()=>{
  const style=css();
  assert.match(style,/#paymentDetailOverlay #paymentDetailDialog\.crm-full-page-dialog \.payment-detail-actions\{[^}]*margin:0 -16px calc\(-14px - env\(safe-area-inset-bottom\)\)!important/);
  assert.match(style,/#installmentEditOverlay #installmentEditDialog\.crm-full-page-dialog \.installment-edit-actions/);
  assert.match(style,/border-top:1px solid var\(--paper-line,#ded7c8\)!important/);
});

test('new CSS does not change customer editors, other workflows or monetary records',()=>{
  const style=css();
  assert.doesNotMatch(style,/#customerEditPanel|#inlineComplianceEditor|\.dashboard|\.overview/);
  assert.doesNotMatch(stylesheet,/sb\.from\(|sb\.rpc\(|fetch\(/);
  const build=fs.readFileSync('build.js','utf8');
  assert.ok(build.includes("'payment_plan_mobile_reference_patch.js'"));
});
