'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function sourceOf(file,signature,nextSignature){
  const text=read(file), start=text.indexOf(signature);
  assert.ok(start>=0,'Missing '+signature);
  const end=text.indexOf(nextSignature,start+signature.length);
  assert.ok(end>start,'Missing '+nextSignature);
  return text.slice(start,end);
}
test('cancelled archive filters scheduled tasks by both unit and booking customer',()=>{
  const source=read('cancelled_unit_archive_patch.js');
  const marker='var unitTasks=rows.filter(function(t){';
  const start=source.indexOf(marker);assert.ok(start>=0);
  const end=source.indexOf('});',start);
  const filter=source.slice(start+marker.length,end);
  const allowed=vm.runInNewContext('(function(t,record){'+filter+'})');
  const record={cancel:{unit_id:483,customer_id:63}};
  assert.equal(allowed({unit_id:483,booking_customer_id:63},record),true);
  assert.equal(allowed({unit_id:483,booking_customer_id:85},record),false);
  assert.equal(allowed({unit_id:484,booking_customer_id:63},record),false);
  assert.equal(allowed({unit_id:483,booking_customer_id:null},record),false);
});
test('active booking task pill excludes a previous buyer on resold unit',()=>{
  const fn=sourceOf('customer_scheduled_tasks_pill_patch.js','  function activeTasks(c){','  function dateISO(){');
  const tasks=[
    {id:1,unit_id:483,booking_customer_id:85,status:'pending',due_date:'2026-10-17'},
    {id:2,unit_id:483,booking_customer_id:63,status:'pending',due_date:'2026-10-17'},
    {id:3,unit_id:483,booking_customer_id:85,status:'completed',due_date:'2026-10-17'}
  ];
  const context={taskRows:()=>tasks,str:String};vm.runInNewContext(fn+'this.activeTasks=activeTasks;',context);
  const result=context.activeTasks({sno:483,customerId:85});
  assert.deepEqual(Array.from(result,t=>t.id),[1]);
});
test('task customer resolver never substitutes current customer for archived task',()=>{
  const fn=sourceOf('scheduled_actions_patch.js','  function customerForUnit(unitId,bookingCustomerId){','  function canUse(){');
  const state={dues:[{sno:483,customerId:85,name:'Kishor',unit:'B2-808'}],cancelled:[]};
  const record={cancel:{unit_id:483,customer_id:63},unitNo:'B2-808',customer:{customer_name:'Sudarshana'}};
  const context={window:{state,__sunblissCancelledUnitArchive:{records:[record]}},state};vm.runInNewContext(fn+'this.customerForUnit=customerForUnit;',context);
  const former=context.customerForUnit(483,63);
  assert.equal(former.status,'Cancelled');
  assert.equal(former.name,'Sudarshana');
  assert.equal(context.customerForUnit(483,85).name,'Kishor');
  context.window.__sunblissCancelledUnitArchive.records=[];
  assert.equal(context.customerForUnit(483,63),null);
});
test('task list fetches persisted booking identity',()=>{
  const source=read('scheduled_actions_patch.js');
  assert.ok(source.includes('transaction_id,booking_customer_id,workflow_kind'));
});
