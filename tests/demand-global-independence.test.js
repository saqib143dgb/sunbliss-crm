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
