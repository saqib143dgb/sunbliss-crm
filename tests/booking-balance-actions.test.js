const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('booking balance and receipt tasks coexist without duplicate automatic collection',async()=>{
 const source=fs.readFileSync('automatic_payment_actions_v2_patch.js','utf8').replace('install();\n})();','window.testRun=run;\n})();');
 const due=new Date();due.setDate(due.getDate()-1);
 const tasks=[{id:1,unit_id:2,schedule_id:3,source:'manual',status:'pending',workflow_kind:'accounts_confirmation',transaction_id:4,action_label:'Confirm Payment with Accounts'},{id:2,unit_id:2,schedule_id:3,source:'manual',status:'pending',workflow_kind:'payment_follow_up',auto_key:'booking_balance|unit:2|schedule:3',action_label:'Follow Up — Remaining Down Payment · AED 190,000.00'}];
 const rows={payment_schedule:[{id:3,unit_id:2,stage_name:'Down Payment',due_amount:200000,paid_amount:10000,due_date:due.toISOString().slice(0,10)}],scheduled_actions:tasks,credit_notes:[],payment_extensions:[]};
 const writes=[];const sb={auth:{getUser:async()=>({data:{user:{id:'officer'}}})},from(table){let op='read',value;const q=new Proxy({then(resolve){if(op!=='read')writes.push({table,op,value});return Promise.resolve({data:rows[table]||[],error:null}).then(resolve)}},{get(t,k){if(k==='then')return t.then;if(['insert','update'].includes(k))return v=>{op=k;value=v;return q};return()=>q}});return q}};
 const context={window:null,state:{userRole:'crm_officer',dues:[{sno:2,stages:[]}]},sb,document:{getElementById:()=>true,querySelectorAll:()=>[]},console,Date,setTimeout,clearTimeout};context.window=context;
 vm.runInNewContext(source,context);await context.testRun();assert.deepEqual(writes,[]);
});
