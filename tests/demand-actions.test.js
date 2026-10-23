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
test('Demand Letter form has only issue date, multi-select installments and editable payment due date',()=>{
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 assert.ok(doc.includes("kind==='demand'?'Demand Letter date':'Document date'"));
 assert.ok(doc.includes('id="demandStagePicker"'));
 assert.ok(doc.includes('type="checkbox" name="demandStage"'));
 assert.ok(doc.includes("field('dueDate','Payment due date','',true)"));
 assert.ok(doc.includes("$('dueDate').value=dates[0]||''"));
 assert.ok(!doc.includes('demand-readonly'));
 assert.ok(!doc.includes("field('demandAmount'"));
 assert.ok(!doc.includes("field('address','Customer address'"));
 assert.ok(!doc.includes('<textarea id="accountDetails"'));
});
test('Demand Letter defaults to Action Required and permits additional unpaid installments',()=>{
 const action=fs.readFileSync('effective_action_required_patch.js','utf8');
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 const bridge=fs.readFileSync('welcome_documents_patch.js','utf8');
 assert.ok(action.includes('result.documentFocus='));
 assert.ok(action.includes('window.__sunblissDemandActionForUnit=async function'));
 assert.ok(action.includes('selection.available=rows.filter'));
 assert.ok(action.includes("String(r.customer_id)===String(customerId)"));
 assert.ok(bridge.includes('__sunblissDemandActionForUnit(unit.id,unit.customer_id)'));
 assert.ok(doc.includes('ctx.demandAction?.scheduleIds'));
 assert.ok(doc.includes('function selectedDemandRows(){'));
 assert.ok(doc.includes("r.kind!=='dp'"));
});
test('Official project bank details are applied to the PDF but absent from the form',()=>{
 const doc=fs.readFileSync('welcome-letter.html','utf8');
 const bridge=fs.readFileSync('welcome_documents_patch.js','utf8');
 const build=fs.readFileSync('build.js','utf8');
 const migration=fs.readFileSync('supabase/migrations/20261023190000_demand_letter_project_payment_accounts.sql','utf8');
 assert.ok(bridge.includes(".from('branding').select('demand_account_details')"));
 assert.ok(doc.includes('function demandPaymentAccounts(rows)'));
 assert.ok(doc.includes('p(demandPaymentAccounts(stage?.items||[]))'));
 assert.ok(doc.includes("r.kind==='dld'?'Developer Account':'Escrow Account'"));
 assert.ok(doc.includes('Verified payment account details are unavailable'));
 assert.ok(build.includes("'demand_account_settings_patch.js'"));
 for(const schema of ['public','crm_test','crm_triana','crm_triana_test'])
  assert.ok(migration.includes('alter table '+schema+'.branding add column if not exists demand_account_details text;'));
});
function paymentCardFocus(rows,{credits={},extensions={},stages=[]}={}){
 const script=fs.readFileSync('effective_action_required_patch.js','utf8')
  .replace('install();\n})();','window.__testFocus=build;\n})();');
 const context={Date,Math,console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,
  document:{getElementById:()=>({}),addEventListener(){}},
  state:{},sessionStorage:{},window:null};
 context.window=context;
 vm.runInNewContext(script,context);
 const result=context.__testFocus({rows,credit:credits,ext:extensions,tasks:[]},{customerId:27,stages});
 return JSON.parse(JSON.stringify(result.documentFocus||null));
}
test('Action Required groups first installment and same-date DLD after partial payment',()=>{
 const rows=[
  {id:1,customer_id:27,stage_name:'1st Installment',due_amount:100000,paid_amount:49224.88,due_date:'2099-03-10',revised_due_date:'2099-05-20',status:'Pending'},
  {id:2,customer_id:27,stage_name:'DLD + Admin Fees',due_amount:44000,paid_amount:0,due_date:'2099-05-20',status:'Pending'},
  {id:3,customer_id:27,stage_name:'2nd Installment',due_amount:200000,paid_amount:0,due_date:'2099-10-01',status:'Pending'}
 ];
 const got=paymentCardFocus(rows);
 assert.deepEqual(got.scheduleIds,['1','2']);
 assert.equal(got.amount,94775.12);
 assert.equal(got.dueDate,'2099-05-20');
 assert.equal(got.stage,'1st Installment & DLD+Admin Fees');
});
test('Action Required respects approved extensions when selecting demand stage',()=>{
 const rows=[
  {id:1,customer_id:27,stage_name:'1st Installment',due_amount:100000,paid_amount:0,due_date:'2099-03-10',status:'Pending'},
  {id:2,customer_id:27,stage_name:'DLD + Admin Fees',due_amount:44000,paid_amount:0,due_date:'2099-03-10',status:'Pending'}
 ];
 const got=paymentCardFocus(rows,{extensions:{1:{status:'active',extended_due_date:'2099-05-20'}}});
 assert.deepEqual(got.scheduleIds,['2']);
 assert.equal(got.dueDate,'2099-03-10');
 assert.equal(got.amount,44000);
});

test('Action Required excludes cancelled buyer installments on the same unit',()=>{
 const rows=[
  {id:991,customer_id:13,stage_name:'2nd Installment',due_amount:800000,paid_amount:0,due_date:'2099-01-01',status:'Pending'},
  {id:117,customer_id:27,stage_name:'1st Installment',due_amount:100000,paid_amount:0,due_date:'2099-05-20',status:'Pending'}
 ];
 const focus=paymentCardFocus(rows);
 assert.deepEqual(focus.scheduleIds,['117']);
 assert.equal(focus.amount,100000);
 assert.equal(focus.stage,'1st Installment');
});

test('Action Required offers all unpaid installment options while preserving its highlighted default',()=>{
 const source=fs.readFileSync('effective_action_required_patch.js','utf8').replace('install();\n})();','window.testBuild=build;\n})();');
 const context={window:null,console,Date,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,sessionStorage:{},state:{},
   document:{getElementById(){return null},addEventListener(){}}};
 context.window=context;
 vm.runInNewContext(source,context);
 const selection={};
 const result=context.testBuild({credit:{},ext:{},tasks:[],rows:[
  {id:4,customer_id:27,stage_name:'Down Payment',due_amount:20000,paid_amount:0,due_date:'2099-01-01',status:'pending'},
  {id:5,customer_id:27,stage_name:'1st Installment',due_amount:100000,paid_amount:49224.88,due_date:'2099-06-01',status:'pending'},
  {id:6,customer_id:27,stage_name:'2nd Installment',due_amount:200000,paid_amount:0,due_date:'2099-09-01',status:'pending'},
  {id:7,customer_id:27,stage_name:'DLD + Admin Fees',due_amount:40000,paid_amount:0,due_date:'2099-06-01',status:'pending'}
 ]},{customerId:27,stages:[]},selection);
 assert.deepEqual(JSON.parse(JSON.stringify(selection.available.map(r=>r.id))),['5','7','6']);
 assert.deepEqual(JSON.parse(JSON.stringify(result.documentFocus.scheduleIds)),['4']);
 // If Action Required highlights a Down Payment, the generator will not preselect it.
});
test('Demand helper totals selections and assigns escrow/developer instructions correctly',()=>{
 const html=fs.readFileSync('welcome-letter.html','utf8');
 const a=html.indexOf('function selectedDemandRows(){'),b=html.indexOf('function values(){',a);
 const helpers=new Function('crmContext','document','val',html.slice(a,b)+'return {selectedStage,demandPaymentAccounts,selectedDemandRows}');
 const options=[
  {id:'10',label:'1st Installment',kind:'first',amount:50775.12,dueDate:'2026-11-20'},
  {id:'11',label:'DLD+Admin Fees',kind:'dld',amount:1200,dueDate:'2026-11-22'},
  {id:'12',label:'Down Payment',kind:'dp',amount:25000,dueDate:'2026-10-23'}];
 const ctx={documentType:'demand',demandAction:{options},demandAccountDetails:'Escrow Account Details:\nEscrow IBAN\n\nDeveloper Account Details:\nDeveloper IBAN'};
 const d={querySelectorAll(){return [{value:'10'},{value:'11'},{value:'12'}]}};
 const h=helpers(ctx,d,()=> '2026-11-20'),stage=h.selectedStage();
 assert.equal(stage.amount,51975.12);
 assert.equal(stage.items.length,2);
 assert.equal(stage.dueDate,'2026-11-20');
 const accounts=h.demandPaymentAccounts(stage.items);
 assert.ok(accounts.includes('Escrow IBAN')&&accounts.includes('Developer IBAN'));
 assert.ok(!h.demandPaymentAccounts([{kind:'dld'}]).includes('Escrow IBAN'));
});
