const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const src=fs.readFileSync('scheduled_actions_patch.js','utf8');
const a=src.indexOf('  function linkedPaymentIds(t){');
const b=src.indexOf('  function stateForTask(t){',a);
assert(a>=0&&b>a,'Multi-payment selector helpers exist');
const helperSource=src.slice(a,b);
function setup({selectedTask=null}={}){
  const payment=[
    {id:1508,unit_id:556,stage_name:'Down Payment',due_amount:199665,paid_amount:50000,due_date:'2026-10-13'},
    {id:1510,unit_id:556,stage_name:'DLD + Admin Fees (SPA)',due_amount:84966,paid_amount:0,due_date:'2026-10-13'},
    {id:1509,unit_id:556,stage_name:'1st Installment',due_amount:199665,paid_amount:0,due_date:'2026-12-31'},
    {id:1511,unit_id:556,stage_name:'2nd Installment',due_amount:199665,paid_amount:199665,due_date:'2027-04-30'},
    {id:1512,unit_id:556,stage_name:'Final Installment (Handover)',due_amount:1397655,paid_amount:0,due_date:'2027-10-31'}
  ];
  const data={current_payment_schedule:payment,credit_notes:[],payment_extensions:[]};
  const list={innerHTML:'',textContent:'',addEventListener(){}},summary={textContent:''},total={textContent:''};
  const chosen=[];
  const panel={isConnected:true,__saPaymentRows:null,
    querySelector(q){return q==='#saPaymentList'?list:q==='#saPaymentSelectorSummary'?summary:total;},
    querySelectorAll(q){assert.match(q,/saPaymentIds/);return chosen.map(value=>({value:String(value)}));}
  };
  const sb={from(table){assert(Object.hasOwn(data,table),'bad DB table '+table);return {select(){return {eq(){return Promise.resolve({data:data[table],error:null})}}}}}};
  const ctx={sb,document:{querySelectorAll:()=>[]},window:{},
    text:x=>x==null?'':String(x),
    safe:x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
    formatDate:x=>String(x),
    paymentStage:r=>/down payment|installment|dld/i.test(r.stage_name),
    idsFromKey:k=>{const m=String(k).match(/\|schedules?:([0-9,]+)/);return m?m[1].split(',').map(Number):[];}
  };
  vm.createContext(ctx);
  vm.runInContext(helperSource+';globalThis.functions={loadRelatedPaymentChoices,linkedPaymentIds,selectedPaymentIds,selectedPaymentNote};',ctx);
  return {fn:ctx.functions,list,summary,total,panel,chosen,selectedTask,payment};
}
test('B3-605 selector lists Down Payment, DLD, 1st and future installment instead of only DP',async()=>{
 const x=setup();
 await x.fn.loadRelatedPaymentChoices({sno:556},null,x.panel);
 assert.equal(x.panel.__saPaymentRows.length,4,'exclude only fully paid stage');
 for(const id of [1508,1510,1509,1512])assert.match(x.list.innerHTML,new RegExp('value="'+id+'"'));
 assert.doesNotMatch(x.list.innerHTML,/value="1511"/);
 assert.equal(x.summary.textContent,'Select payment(s)');
});
test('multi-payment task retains selected links and calculates combined outstanding without changing account records',async()=>{
 const x=setup({selectedTask:{auto_key:'manual_payment|unit:556|schedules:1508,1510',schedule_id:null}});
 await x.fn.loadRelatedPaymentChoices({sno:556},x.selectedTask,x.panel);
 assert.match(x.list.innerHTML,/value="1508" checked/);
 assert.match(x.list.innerHTML,/value="1510" checked/);
 x.chosen.push(1508,1510);
 assert.deepEqual(Array.from(x.fn.selectedPaymentIds(x.panel)),[1508,1510]);
 const rows=x.panel.__saPaymentRows.filter(r=>[1508,1510].includes(r.id));
 const note=x.fn.selectedPaymentNote('Call customer',rows);
 assert.match(note,/Down Payment/);
 assert.match(note,/DLD \+ Admin Fees/);
 assert.match(note,/234,631\.00/);
 assert.match(note,/Call customer/);
});
test('manual tasks store one linked payment through FK or multiple through a group key',()=>{
 assert.match(src,/ids\.length>1\?'manual_payment\|unit:'/);
 assert.match(src,/schedule_id:related,auto_key:autoKey/);
 assert.match(src,/loadRelatedPaymentChoices\(c,task,p\)/);
 assert.match(src,/selectedPaymentNote\(note,chosen\)/);
});
test('grouped outcome selects exactly one linked installment without detaching the other IDs',()=>{
 assert.match(src,/linkedPaymentIds\(task\)\.length>1/);
 assert.match(src,/Select a payment linked to this task/);
 assert.match(src,/Select which installment this outcome concerns/);
 assert.match(src,/if\(outcome==='payment_reported'\)task=Object\.assign/);
});
test('database outcome procedure validates grouped payment IDs and preserves the multi-payment task relationship',()=>{
 const migration=fs.readFileSync('supabase/migrations/20261022170000_grouped_manual_scheduled_outcomes.sql','utf8');
 assert.match(migration,/p_schedule_id=any\(v_ids\)/);
 assert.match(migration,/and not v_is_group/);
 assert.match(migration,/case when v_is_group then p_schedule_id/);
 assert.match(migration,/No data is changed/);
});
