const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('automatic_payment_actions_v2_patch.js','utf8').replace('install();\n})();','window.testRun=run;\n})();');
function datePlus(n){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const o={};p.forEach(x=>o[x.type]=x.value);
 const y=o.year+'-'+o.month+'-'+o.day;
 return new Date(Date.parse(y+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
}
async function simulate({rows,tasks=[],extensions=[]}={}){
 const data={
  payment_schedule:rows||[{id:10,unit_id:2,stage_name:'5th Installment',due_amount:10000,paid_amount:0,due_date:datePlus(10)}],
  scheduled_actions:tasks,credit_notes:[],payment_extensions:extensions
 };
 const writes=[];
 const sb={auth:{getUser:async()=>({data:{user:{id:'officer'}}})},from(table){
  let op='read',val;
  const q=new Proxy({then(resolve){if(op!=='read')writes.push({table,op,val});return Promise.resolve({data:data[table]||[],error:null}).then(resolve)}},{
    get(target,key){if(key==='then')return target.then;
      if(key==='update'||key==='insert')return v=>{op=key;val=v;return q};
      return()=>q;
    }
  });return q;
 }};
 const document={getElementById:()=>true,querySelectorAll:()=>[]};
 const context={window:null,state:{userRole:'crm_officer',dues:[{sno:2,stages:[]}]},sb,document,Date,Intl,console,setTimeout,clearTimeout};
 context.window=context;
 vm.runInNewContext(source,context);
 assert.equal(typeof context.testRun,'function','test entrypoint');
 await context.testRun();
 return writes;
}
const payable=(id,days,stage='5th Installment')=>({id,unit_id:2,stage_name:stage,due_amount:10000,paid_amount:0,due_date:datePlus(days)});
const task=(id,scheduleId,status='pending',kind='demand_letter',extra={})=>({
 id,unit_id:2,source:'automatic',auto_kind:kind,auto_key:kind+'|schedule:'+scheduleId+'|due:'+datePlus(10),
 schedule_id:scheduleId,status,action_label:'Send Demand Letter',due_date:datePlus(0),updated_at:new Date().toISOString(),...extra
});
test('old overdue down payment does not block a new future installment',async()=>{
 const w=await simulate({rows:[payable(1,-200,'Down Payment'),payable(10,10)],tasks:[]});
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'&&x.val.schedule_id===10));
});
test('manual payment follow-up never suppresses future demand letter',async()=>{
 const w=await simulate({rows:[payable(10,10)],tasks:[{id:5,unit_id:2,status:'pending',source:'manual',auto_kind:null,action_label:'Payment Follow-up with Customer',schedule_id:10,note:''}]});
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'&&x.val.schedule_id===10));
});
test('same-date first installment and DLD share one Demand Letter while Down Payment only has a Gentle Reminder',async()=>{
 const w=await simulate({rows:[payable(10,6,'1st Installment'),payable(11,6,'DLD + Admin Fees (SPA)'),payable(12,6,'Down Payment')]});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 const reminders=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder');
 assert.equal(d.length,1);
 assert(d[0].val.auto_key.includes('schedules:10,11'));
 assert(d[0].val.note.includes('1st Installment')&&d[0].val.note.includes('DLD + Admin Fees'));
 assert(reminders.some(x=>x.val.schedule_id===12&&x.val.action_label==='Send Gentle Reminder'));
});
test('shared due date keeps one demand letter when first installment is paid',async()=>{
 const first=payable(10,6,'1st Installment');first.paid_amount=first.due_amount;
 const w=await simulate({rows:[first,payable(11,6,'DLD + Admin Fees (SPA)')]});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 assert.equal(d.length,1);
 assert(d[0].val.auto_key.includes('schedules:10,11'));
 assert(d[0].val.note.includes('DLD + Admin Fees'));
 assert(!d[0].val.note.includes('1st Installment'));
});
test('shared due date keeps one demand letter when DLD and admin fees are paid',async()=>{
 const dld=payable(11,6,'DLD + Admin Fees (SPA)');dld.paid_amount=dld.due_amount;
 const w=await simulate({rows:[payable(10,6,'1st Installment'),dld]});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 assert.equal(d.length,1);
 assert(d[0].val.auto_key.includes('schedules:10,11'));
 assert(d[0].val.note.includes('1st Installment'));
 assert(!d[0].val.note.includes('DLD + Admin Fees'));
});
test('different first installment and DLD due dates retain separate tasks',async()=>{
 const w=await simulate({rows:[payable(10,6,'1st Installment'),payable(11,8,'DLD + Admin Fees (SPA)')]});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 assert.equal(d.length,2);
 assert.deepEqual(d.map(x=>x.val.schedule_id).sort(),[10,11]);
});
test('completed and explicitly cancelled demand letters stay untouched',async()=>{
 const rows=[payable(10,10),payable(11,10)];
 const tasks=[task(1,10,'completed'),task(2,11,'cancelled','demand_letter',{completion_note:'Customer confirmed payment before Demand Letter'})];
 const w=await simulate({rows,tasks});
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
 assert(!w.some(x=>x.op==='update'&&x.val.status==='pending'));
});
test('pending demand letter survives and is never duplicated',async()=>{
 const w=await simulate({rows:[payable(10,10)],tasks:[task(1,10)]});
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
 assert(!w.some(x=>x.op==='update'&&x.val.status==='cancelled'));
});
test('extension prevents demand letter until the due date is reset',async()=>{
 const w=await simulate({rows:[payable(10,10)],extensions:[{payment_schedule_id:10,status:'active',extended_due_date:datePlus(20)}]});
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('unrelated automatic SPA task is never cancelled',async()=>{
 const w=await simulate({rows:[payable(10,10)],tasks:[task(50,99,'pending','spa_invitation',{auto_key:'spa:50'})]});
 assert(!w.some(x=>x.op==='update'&&x.val.status==='cancelled'));
});
test('scheduled demand task is dated exactly ten days before installment due date',async()=>{
 const w=await simulate({rows:[payable(10,10)]});
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'&&x.val.due_date===datePlus(0)));
});

test('revised due date cancels an obsolete demand task but does not issue a new one early',async()=>{
 const w=await simulate({rows:[payable(10,20)],tasks:[task(30,10)]});
 assert(w.some(x=>x.op==='update'&&x.val.status==='cancelled'));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});

test('B2-808 partial Down Payment generates one Gentle Reminder with AED 191335 outstanding',async()=>{
 const down={...payable(1481,5,'Down Payment'),due_amount:206335,paid_amount:15000};
 const w=await simulate({rows:[down]});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 const g=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder');
 assert.equal(d.length,0);
 assert.equal(g.length,1);
 assert.equal(g[0].val.schedule_id,1481);
 assert.equal(g[0].val.due_date,datePlus(0));
 assert(g[0].val.note.includes('191,335'));
 assert(g[0].val.note.includes('Down Payment'));
});
test('Down Payment without any payment also uses only Gentle Reminder',async()=>{
 const w=await simulate({rows:[payable(80,10,'Down Payment')]});
 assert.equal(w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder').length,1);
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('Down Payment outside the reminder window is not contacted early',async()=>{
 const w=await simulate({rows:[payable(80,25,'Down Payment')]});
 assert(!w.some(x=>x.op==='insert'&&(x.val.auto_kind==='gentle_reminder'||x.val.auto_kind==='demand_letter')));
});
test('Down Payment fully settled has no Demand Letter or Gentle Reminder',async()=>{
 const row=payable(80,5,'Down Payment');row.paid_amount=row.due_amount;
 const w=await simulate({rows:[row]});
 assert(!w.some(x=>x.op==='insert'&&['gentle_reminder','demand_letter'].includes(x.val.auto_kind)));
});
test('overdue Down Payment retains overdue follow-up, not an improper Demand Letter',async()=>{
 const w=await simulate({rows:[payable(80,-2,'Down Payment')]});
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='overdue_follow_up'));
 assert(!w.some(x=>x.op==='insert'&&['gentle_reminder','demand_letter'].includes(x.val.auto_kind)));
});
test('unsent legacy Down Payment Demand Letter is cancelled with a clear audit reason',async()=>{
 const old=task(17,80,'pending','demand_letter',{auto_key:'demand_letter|schedule:80|due:'+datePlus(5)});
 const w=await simulate({rows:[payable(80,5,'Down Payment')],tasks:[old]});
 const cancelled=w.filter(x=>x.op==='update'&&x.val.status==='cancelled');
 assert.equal(cancelled.length,1);
 assert.match(cancelled[0].val.completion_note,/Down Payment requires Gentle Reminder/);
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder'));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('completed historical Down Payment Demand Letter is retained without changing history',async()=>{
 const old=task(17,80,'completed','demand_letter',{auto_key:'demand_letter|schedule:80|due:'+datePlus(5)});
 const w=await simulate({rows:[payable(80,5,'Down Payment')],tasks:[old]});
 assert(!w.some(x=>x.op==='update'&&x.val.status==='cancelled'));
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder'));
});
test('manual gentle reminder for the same Down Payment prevents duplicate automatic gentle reminder',async()=>{
 const manual={id:55,unit_id:2,status:'pending',source:'manual',auto_kind:null,action_label:'Send Gentle Reminder',schedule_id:80,note:'DP pending'};
 const w=await simulate({rows:[payable(80,5,'Down Payment')],tasks:[manual]});
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder'));
});
test('existing pending Down Payment Gentle Reminder is not duplicated',async()=>{
 const old=task(17,80,'pending','gentle_reminder',{auto_key:'gentle_reminder|schedule:80|due:'+datePlus(5),action_label:'Send Gentle Reminder',due_date:datePlus(0)});
 const w=await simulate({rows:[payable(80,5,'Down Payment')],tasks:[old]});
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder'));
 assert(!w.some(x=>x.op==='update'&&x.val.status==='cancelled'));
});


test('B3-605 existing booking follow-up covers shared-date DLD without a duplicate demand',async()=>{
 const rows=[
  {...payable(1508,-9,'Down Payment'),customer_id:96,due_amount:199665,paid_amount:50000},
  {...payable(1509,70,'1st Installment'),customer_id:96,due_amount:199665},
  {...payable(1510,-9,'DLD + Admin Fees (SPA)'),customer_id:96,due_amount:84966}
 ];
 const followUp={id:361,unit_id:2,schedule_id:1508,status:'pending',source:'manual',auto_kind:null,
   action_label:'Follow Up — Remaining Down Payment · AED 149,665.00',
   auto_key:'booking_balance|unit:2|schedule:1508',
   workflow_kind:'payment_follow_up',note:'Customer commitment to complete remaining Down Payment'};
 const w=await simulate({rows,tasks:[followUp]});
 assert(!w.some(x=>x.op==='insert'&&['demand_letter','gentle_reminder','overdue_follow_up'].includes(x.val.auto_kind)
   &&(x.val.schedule_id===1510||String(x.val.auto_key).includes('1510'))));
});
test('same-date Down Payment and DLD without a manual booking task use one combined Gentle Reminder',async()=>{
 const rows=[
  {...payable(1508,5,'Down Payment'),customer_id:96,due_amount:199665,paid_amount:50000},
  {...payable(1510,5,'DLD + Admin Fees (SPA)'),customer_id:96,due_amount:84966}
 ];
 const w=await simulate({rows});
 const reminders=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder');
 assert.equal(reminders.length,1);
 assert(reminders[0].val.auto_key.includes('schedules:1508,1510'));
 assert(reminders[0].val.note.includes('Down Payment'));
 assert(reminders[0].val.note.includes('DLD + Admin Fees'));
 assert(reminders[0].val.note.includes('234,631'));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('shared-date Down Payment and DLD overdue without manual follow-up create one combined overdue task',async()=>{
 const rows=[
  {...payable(1508,-9,'Down Payment'),customer_id:96,due_amount:199665,paid_amount:50000},
  {...payable(1510,-9,'DLD + Admin Fees (SPA)'),customer_id:96,due_amount:84966}
 ];
 const w=await simulate({rows});
 const late=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='overdue_follow_up');
 assert.equal(late.length,1);
 assert(late[0].val.auto_key.includes('schedules:1508,1510'));
 assert(late[0].val.note.includes('234,631'));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('when Down Payment is fully paid but same-date DLD is outstanding, gentle reminder still covers DLD',async()=>{
 const rows=[
  {...payable(1508,5,'Down Payment'),customer_id:96,paid_amount:10000},
  {...payable(1510,5,'DLD + Admin Fees (SPA)'),customer_id:96,due_amount:8000}
 ];
 const w=await simulate({rows});
 const reminders=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder');
 assert.equal(reminders.length,1);
 assert(reminders[0].val.auto_key.includes('schedules:1508,1510'));
 assert(reminders[0].val.note.includes('DLD + Admin Fees'));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('when DP and DLD due dates differ they remain separately tracked',async()=>{
 const rows=[
  {...payable(1508,5,'Down Payment'),customer_id:96},
  {...payable(1510,8,'DLD + Admin Fees (SPA)'),customer_id:96}
 ];
 const w=await simulate({rows});
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder'&&x.val.schedule_id===1508));
 assert(w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'&&x.val.schedule_id===1510));
});
test('existing pending DLD Demand Letter is retired when same-date Down Payment follow-up covers it',async()=>{
 const rows=[
  {...payable(1508,5,'Down Payment'),customer_id:96},
  {...payable(1510,5,'DLD + Admin Fees (SPA)'),customer_id:96}
 ];
 const followUp={id:361,unit_id:2,schedule_id:1508,status:'pending',source:'manual',
   action_label:'Follow Up — Remaining Down Payment',auto_key:'booking_balance|unit:2|schedule:1508',
   workflow_kind:'payment_follow_up',note:'Booking balance'};
 const demand=task(491,1510,'pending','demand_letter',{auto_key:'demand_letter|schedule:1510|due:'+datePlus(5)});
 const w=await simulate({rows,tasks:[followUp,demand]});
 assert(w.some(x=>x.op==='update'&&x.val.status==='cancelled'&&
   /Consolidated into the same-date/.test(x.val.completion_note||'')));
 assert(!w.some(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter'));
});
test('if first installment shares DLD due date, keep first+DLD Demand Letter and independent Down Payment reminder',async()=>{
 const rows=[
  {...payable(1508,5,'Down Payment'),customer_id:96},
  {...payable(1509,5,'1st Installment'),customer_id:96},
  {...payable(1510,5,'DLD + Admin Fees (SPA)'),customer_id:96}
 ];
 const w=await simulate({rows});
 const d=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='demand_letter');
 const g=w.filter(x=>x.op==='insert'&&x.val.auto_kind==='gentle_reminder');
 assert.equal(d.length,1);
 assert(d[0].val.auto_key.includes('schedules:1509,1510'));
 assert(g.some(x=>x.val.schedule_id===1508));
});
