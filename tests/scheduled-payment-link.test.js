const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('scheduled_actions_payment_link_guard_patch.js','utf8');
function submit(action,note,related='',custom=''){
  let click,blocked=false;
  const elements={saAction:{value:action},saNote:{value:note},saCustom:{value:custom},saError:{style:{}},saRelatedSchedule:{value:related,options:[{value:''},{value:'1376'}],focus(){}}};
  vm.runInNewContext(source,{window:{},document:{getElementById:id=>elements[id],addEventListener:(type,fn)=>{click=fn}}});
  click({target:{closest:()=>({})},preventDefault(){blocked=true},stopPropagation(){},stopImmediatePropagation(){}});
  return blocked;
}
test('SPA and document notes can mention payments without requiring an installment',()=>{
  for(const action of ['SPA follow-up','Document follow-up','OQOOD follow-up']){
    assert.equal(submit(action,'NOC after 30% payment instead of 40%; payment receipt attached'),false);
  }
});
test('payment actions still require a related obligation',()=>{
  for(const action of ['Payment follow-up','Check payment receipt','DLD follow-up']){
    assert.equal(submit(action,''),true);
    assert.equal(submit(action,'','1376'),false);
  }
});
test('custom actions are classified using their title',()=>{
  assert.equal(submit('Other','','','Collect overdue installment'),true);
  assert.equal(submit('Other','Payment clause discussion','','Review SPA wording'),false);
});
