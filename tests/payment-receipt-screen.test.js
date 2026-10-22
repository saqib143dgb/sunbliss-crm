const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('scheduled_actions_patch.js','utf8');
const a=src.indexOf('  function receiptAmountLabel('),b=src.indexOf('  function openComplete(task){',a);
assert.ok(a>0&&b>a,'receipt functions reside in original Scheduled Actions implementation');
const helpers=src.slice(a,b);
async function render(tx,stage,welcome){
 const host={innerHTML:''},button={disabled:false};
 const panel={isConnected:true,querySelector:id=>id==='#saReceiptInfo'?host:button};
 const task={id:1,unit_id:703,transaction_id:80,schedule_id:90};
 const cache={rows:welcome?[{unit_id:703,status:'pending',auto_key:'booking_welcome|703'}]:[]};
 const sb={from:()=>({select:()=>({eq:()=>({single:async()=>({data:tx,error:null}),maybeSingle:async()=>({data:stage,error:null})})})})};
 const ctx={cache,sb,console:{warn(){}},text:x=>String(x??''),safe:x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
   isBookingWelcome:x=>String(x.auto_key||'').startsWith('booking_welcome|'),formatDate:x=>x};
 vm.createContext(ctx);vm.runInContext(helpers+';globalThis.renderReceipt=loadReceiptDetails;',ctx);
 await ctx.renderReceipt(task,panel);return {host,button};
}
const tx={id:80,unit_id:703,amount:97150,payment_type:'2nd Installment',payment_date:'2026-10-15',remarks:'Card',payment_schedule_id:90,accounts_confirmation_status:'confirmed'};
const stage={id:90,stage_name:'2nd Installment',due_date:'2026-08-31'};
test('later instalment uses verified transaction value, independent of outstanding balance and welcome',async()=>{
 const v=await render(tx,stage,true);assert.match(v.host.innerHTML,/AED 97,150/);
 assert.match(v.host.innerHTML,/2nd Installment/);assert.equal(v.button.disabled,false);
 assert.match(v.host.innerHTML,/Paid on/);
 assert.match(v.host.innerHTML,/2026-10-15/);
 assert.match(v.host.innerHTML,/Payment method/);
 assert.match(v.host.innerHTML,/Card/);
 assert.doesNotMatch(v.host.innerHTML,/outstanding|WhatsApp|Created manually/i);
});
test('initial booking receipt pauses for an unsent Welcome Letter',async()=>{
 const v=await render({...tx,payment_type:'Booking Amount'},stage,true);assert.equal(v.button.disabled,true);
 assert.match(v.host.innerHTML,/Complete the pending Welcome Letter/);
});
test('receipt cannot be completed without Accounts confirmation',async()=>{
 const v=await render({...tx,accounts_confirmation_status:'pending'},stage,false);assert.equal(v.button.disabled,true);
});
test('receipt omits generic next step and delivery choices',()=>{
 const enhancer=fs.readFileSync('task_outcome_experience.js','utf8');
 assert.match(enhancer,/config\.task\.workflow_kind==='payment_receipt'\)return/);
 assert.match(src,/button='Mark Receipt Sent'/);assert.match(src,/sa-receipt-note/);
 const x=src.slice(src.indexOf("}else if(task.workflow_kind==='payment_receipt'){"),src.indexOf("}else if(task.workflow_kind==='payment_reported'){"));
 assert.doesNotMatch(x,/WhatsApp|Delivery method|Send and complete the Welcome Letter task first/);
});
