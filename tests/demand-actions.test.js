const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('automatic_payment_actions_v2_patch.js','utf8').replace('install();\n})();','window.testRun=run;\n})();');
async function run({delta=5,status='pending',paid=0}={}){
 const now=new Date();now.setHours(0,0,0,0);const due=new Date(now);due.setDate(due.getDate()+delta);const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const rows={payment_schedule:[{id:1,unit_id:2,stage_name:'5th Installment',due_amount:10000,paid_amount:paid,due_date:iso(due)}],scheduled_actions:[{id:3,unit_id:2,source:'automatic',auto_kind:'demand_letter',auto_key:'demand_letter|schedule:1|due:'+iso(due),status,action_label:'Send Demand Letter',due_date:iso(now),priority:'Medium'}],credit_notes:[],payment_extensions:[]};
 const writes=[];const sb={auth:{getUser:async()=>({data:{user:{id:'officer'}}})},from(table){let operation='read',value;const q=new Proxy({then(resolve){if(operation!=='read')writes.push({table,operation,value});return Promise.resolve({data:rows[table]||[],error:null}).then(resolve)}},{get(t,k){if(k==='then')return t.then;if(['update','insert'].includes(k))return v=>{operation=k;value=v;return q};return()=>q}});return q}};
 const document={getElementById:()=>true,querySelectorAll:()=>[]};const context={window:null,state:{userRole:'crm_officer',dues:[{sno:2,stages:[]}]},sb,document,console,Date,setTimeout,clearTimeout};context.window=context;vm.runInNewContext(source,context);await context.testRun();return writes;
}
test('pending demand letter survives after its trigger day and after payment due date',async()=>{for(const delta of [5,-4]){const writes=await run({delta});assert(!writes.some(x=>x.operation==='update'&&x.value.status==='cancelled'));}});
test('paid installment does not silently remove the unfinished demand-letter task',async()=>{const writes=await run({paid:10000});assert(!writes.some(x=>x.value.status==='cancelled'));});
test('completed demand letter is not reopened during automatic sync',async()=>{const writes=await run({status:'completed'});assert(!writes.some(x=>x.operation==='update'&&x.value.status==='pending'));});
test('unsent pending demand letter does not create a premature gentle reminder',async()=>{const writes=await run({delta:2});assert(!writes.some(x=>x.operation==='insert'&&x.value.auto_kind==='gentle_reminder'));});


test('Demand Letter appears inside the shared document menu used by both projects',()=>{
 const menu=fs.readFileSync('welcome_documents_patch.js','utf8');
 const build=fs.readFileSync('scripts/build-project-workspaces.js','utf8');
 assert.ok(menu.includes("demand:'Demand Letter'"));
 assert.ok(menu.includes("demand:'Payment request for outstanding installments'"));
 assert.ok(build.includes('welcome-letter.html'));
 assert.ok(build.includes('brand(fs.readFileSync'));
});
test('Demand Letter retains only issue date as an editable field',()=>{
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 assert.ok(doc.includes("kind==='demand'?'Demand Letter date':'Document date'"));
 assert.ok(doc.includes('demand-readonly'));
 assert.ok(!doc.includes('<select id="stage"'));
 assert.ok(!doc.includes("field('demandAmount'"));
 assert.ok(!doc.includes("field('dueDate'"));
 assert.ok(!doc.includes("field('address','Customer address'"));
 assert.ok(!doc.includes('<textarea id="accountDetails"'));
});
test('Demand Letter inherits the Action Required payment selection and effective due date',()=>{
 const action=fs.readFileSync('effective_action_required_patch.js','utf8');
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 const bridge=fs.readFileSync('welcome_documents_patch.js','utf8');
 assert.ok(action.includes('result.documentFocus='));
 assert.ok(action.includes('window.__sunblissDemandActionForUnit=async function'));
 assert.ok(action.includes('String(r.customer_id)===String(customerId)'));
 assert.ok(bridge.includes('__sunblissDemandActionForUnit(unit.id,unit.customer_id)'));
 assert.ok(doc.includes('crmContext.demandAction'));
 assert.ok(doc.includes("action.kinds.includes('dp')"));
 assert.ok(doc.includes('stage.dueDate'));
});
test('Bank details are isolated and loaded automatically, never manually entered on the document',()=>{
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 const bridge=fs.readFileSync('welcome_documents_patch.js','utf8');
 const ui=fs.readFileSync('demand_account_settings_patch.js','utf8');
 const build=fs.readFileSync('build.js','utf8');
 const migration=fs.readFileSync('supabase/migrations/20261023190000_demand_letter_project_payment_accounts.sql','utf8');
 assert.ok(bridge.includes(".from('branding').select('demand_account_details')"));
 assert.ok(doc.includes('crmContext.demandAccountDetails'));
 assert.ok(doc.includes('Verified bank details are not configured for this project'));
 assert.ok(ui.includes(".from('branding').update({demand_account_details:details})"));
 assert.ok(build.includes("'demand_account_settings_patch.js'"));
 for(const schema of ['public','crm_test','crm_triana','crm_triana_test'])
  assert.ok(migration.includes('alter table '+schema+'.branding add column if not exists demand_account_details text;'));
});
