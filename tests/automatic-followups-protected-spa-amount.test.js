const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','automatic_payment_actions_v2_patch.js'),'utf8');
function prepare(payments){
  const tasks=[{id:462,unit_id:467,action_label:'Urgent Follow-up — AED 5,900 overdue',
    due_date:'2025-12-08',priority:'High',
    note:'Down Payment · AED 5,900 outstanding',
    status:'pending',owner_id:'test-crm-officer',source:'automatic',
    auto_kind:'overdue_follow_up',
    auto_key:'overdue_follow_up|unit:467|schedules:1200',
    schedule_id:1200,created_at:'2026-10-20',updated_at:'2026-10-20'}];
  const db={payment_schedule:payments,scheduled_actions:tasks,credit_notes:[
    {payment_schedule_id:1200,unit_id:467,amount:6700},
    {payment_schedule_id:1199,unit_id:467,amount:118590},
    {payment_schedule_id:1198,unit_id:467,amount:2680}
  ],payment_extensions:[]};
  const writes=[];
  function from(table){
    let filtered=[],mutation=null,mode='select';
    const chain={
      select(){mode='select';return chain;},
      in(k,values){filtered.push([k,values,'in']);return chain;},
      eq(k,value){filtered.push([k,[value],'in']);return chain;},
      update(payload){mode='update';mutation=payload;return chain;},
      insert(payload){mode='insert';mutation=payload;return chain;},
      then(resolve,reject){
        let rows=(db[table]||[]).filter(x=>filtered.every(([k,values])=>values.map(String).includes(String(x[k]))));
        if(mode==='update'){rows.forEach(x=>Object.assign(x,mutation));writes.push({table,mode,rows:rows.map(x=>x.id)});}
        if(mode==='insert'){db[table].push({...mutation,id:900});writes.push({table,mode});}
        return Promise.resolve({data:rows,error:null}).then(resolve,reject);
      }
    };
    return chain;
  }
  const sb={from,auth:{getUser:async()=>({data:{user:{id:'test-crm-officer'}}})}};
  const state={userRole:'crm_officer',dues:[{sno:467,stages:[]}]};
  const window={state,sb,__sunblissRefreshScheduledActions:async()=>{}};
  const document={getElementById:()=>({}),querySelectorAll:()=>[]};
  const sandbox={window,state,sb,document,console,Date,Math,String,Number,Promise,isFinite,setTimeout};
  const testSource=source.replace(/\ninstall\(\);\s*\}\)\(\);\s*$/,
   '\nwindow.__testPaymentActions={run};\n})();');
  assert.notEqual(testSource,source,'mock must avoid attaching production UI event listeners');
  vm.runInNewContext(testSource,sandbox,{filename:'automatic_payment_actions_v2_patch.js'});
  return {run:window.__testPaymentActions.run,db,writes};
}
const baseRows=[
 {id:1200,unit_id:467,stage_name:'Down Payment',due_amount:200200,
  revised_due_amount:194300,paid_amount:187600,status:'Paid',due_date:'2025-12-08'},
 {id:1199,unit_id:467,stage_name:'1st Installment',due_amount:200200,
  revised_due_amount:194300,paid_amount:75710,status:'Paid',due_date:'2026-02-14'},
 {id:1205,unit_id:467,stage_name:'2nd Installment',due_amount:100100,
  revised_due_amount:97150,paid_amount:97150,status:'Paid',due_date:'2026-04-14'},
 {id:1198,unit_id:467,stage_name:'DLD + Admin Fees (SPA)',due_amount:82820,
  revised_due_amount:null,paid_amount:80140,status:'Paid',due_date:'2026-02-14'}
];
test('automatic actions use protected net SPA amounts, not approved but unissued credits',async()=>{
 const t=prepare(baseRows.map(x=>({...x})));
 await t.run();
 assert.equal(t.db.scheduled_actions[0].status,'cancelled');
 assert.equal(t.writes.some(x=>x.mode==='insert'),false);
 assert.equal(t.db.payment_schedule[0].due_amount,200200);
 assert.equal(t.db.payment_schedule[0].revised_due_amount,194300);
 assert.equal(t.db.payment_schedule[0].paid_amount,187600);
});
test('once approved credit is issued, gross and issued credit still net to zero',async()=>{
 const schedules=baseRows.map(x=>({...x}));
 schedules[0].revised_due_amount=null;
 const t=prepare(schedules);
 t.db.credit_notes.push({payment_schedule_id:1200,unit_id:467,amount:5900});
 await t.run();
 assert.equal(t.db.scheduled_actions[0].status,'cancelled');
 assert.equal(t.writes.some(x=>x.mode==='insert'),false);
});
test('existing overdue installment with actual cash outstanding remains eligible for normal follow-up',async()=>{
 const schedules=baseRows.map(x=>({...x}));
 schedules.push({id:1204,unit_id:467,stage_name:'3rd Installment',due_amount:100100,
   revised_due_amount:97150,paid_amount:0,status:'Outstanding',due_date:'2026-06-14',
   revised_due_date:'2026-09-30'});
 const t=prepare(schedules);
 await t.run();
 assert.equal(t.db.scheduled_actions.some(x=>x.status==='pending'&&x.action_label.includes('97,150')),true);
 assert.equal(t.db.scheduled_actions.some(x=>x.status==='pending'&&x.action_label.includes('5,900')),false);
});
