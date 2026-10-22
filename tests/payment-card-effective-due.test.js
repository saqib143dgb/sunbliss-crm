const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('payment_schedule_revised_dates_patch.js','utf8');
function block(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Could not locate source logic: '+start);
 return source.slice(a,b);
}
const helpers=[
 block('function text(v)','function unitId(){'),
 block('function iso(v)','function styles(){'),
 block('async function load(uid,force){','function byRow(card)'),
 block('function syncStamp(card,row,stage,effective,credits){','async function decorate(force){')
].join('\n');
class FixedDate extends Date{
 constructor(...args){super(...(args.length?args:['2026-10-22T08:00:00Z']))}
 static now(){return Date.parse('2026-10-22T08:00:00Z')}
}
const databaseRows=[
 {id:1193,stage_name:'2nd Installment Partial-2',due_amount:51728.75,paid_amount:0,status:'Outstanding',due_date:'2026-04-01',revised_due_date:'2026-09-30'},
 {id:1192,stage_name:'3rd Installment Partial-1',due_amount:51728.75,paid_amount:0,status:'Outstanding',due_date:'2026-07-01',revised_due_date:'2026-10-30'},
 {id:1191,stage_name:'3rd Installment Partial-2',due_amount:51728.75,paid_amount:0,status:'Outstanding',due_date:'2026-07-01',revised_due_date:'2026-11-30'},
 {id:1467,stage_name:'4th Installment Partial-1',due_amount:51728.75,paid_amount:0,status:'Outstanding',due_date:'2026-10-01',revised_due_date:'2026-12-30'},
 {id:1468,stage_name:'4th Installment Partial-2',due_amount:51728.75,paid_amount:0,status:'Outstanding',due_date:'2026-10-01',revised_due_date:'2027-01-30'},
 {id:1194,stage_name:'2nd Installment Partial-1',due_amount:51728.75,paid_amount:51729,status:'Paid',due_date:'2026-04-01',revised_due_date:'2026-08-30'}
];
function fixture(extensions=[{payment_schedule_id:1193,status:'active',extended_due_date:'2026-10-25'}]){
 const values={payment_schedule:databaseRows,payment_extensions:extensions,credit_notes:[]};
 const sb={from(table){return {select(){return {eq(){return Promise.resolve({data:values[table],error:null})}}}}}};
 const ctx=vm.createContext({Intl,Date:FixedDate,sb,cache:{},loading:{},window:{},console});
 vm.runInContext(helpers+';globalThis.exports={stageKey,scheduleForCard,syncStamp,load,dubaiToday};',ctx);
 const funcs=ctx.exports;
 function card(label){
  const badge={classes:new Set(['is-overdue']),classList:{
   remove(v){badge.classes.delete(v)},
   add(v){badge.classes.add(v)}
  },textContent:'Overdue'};
  return {badge,querySelector(sel){if(sel==='.stage-name')return {textContent:label};if(sel==='.stamp')return badge;return null}};
 }
 return {funcs,card};
}
test('separately links split installments by name rather than shared installment code or array index',async()=>{
 const {funcs,card}=fixture(),data=await funcs.load(466,true);
 for(const [id,label] of [
  [1192,'3rd Installment Partial-1 - 2.5%'],
  [1191,'3rd Installment Partial-2 - 2.5%'],
  [1467,'4th Installment Partial-1 - 2.5%'],
  [1468,'4th Installment Partial-2 - 2.5%']
 ]){
  const row=funcs.scheduleForCard(card(label),data,{id:1193});
  assert.equal(row.id,id,'wrong schedule record for '+label);
 }
});
test('active extension takes priority over a past revised date on A3-209',async()=>{
 const {funcs,card}=fixture(),data=await funcs.load(466,true),c=card('2nd Installment Partial-2 - 2.5%');
 const row=funcs.scheduleForCard(c,data,{id:1193});
 funcs.syncStamp(c,row,null,data.extensions[String(row.id)]||row.revised_due_date||row.due_date,data.credits);
 assert.equal(c.badge.textContent,'Upcoming');assert(c.badge.classes.has('is-upcoming'));
});
test('future revised installment dates are upcoming even if original due dates passed',async()=>{
 const {funcs,card}=fixture(),data=await funcs.load(466,true);
 for(const label of ['3rd Installment Partial-1 - 2.5%','3rd Installment Partial-2 - 2.5%','4th Installment Partial-1 - 2.5%','4th Installment Partial-2 - 2.5%']){
  const c=card(label),r=funcs.scheduleForCard(c,data,null);
  funcs.syncStamp(c,r,null,r.revised_due_date||r.due_date,data.credits);
  assert.equal(c.badge.textContent,'Upcoming',label);
 }
});
test('paid partial installment remains paid',async()=>{
 const {funcs,card}=fixture(),data=await funcs.load(466,true),c=card('2nd Installment Partial-1 - 2.5%');
 const r=funcs.scheduleForCard(c,data,null);
 funcs.syncStamp(c,r,null,r.revised_due_date,data.credits);
 assert.equal(c.badge.textContent,'Paid');
});
test('expired extension or past revised date without extension is overdue',async()=>{
 const {funcs,card}=fixture([{payment_schedule_id:1193,status:'expired',extended_due_date:'2026-10-21'}]),data=await funcs.load(466,true),c=card('2nd Installment Partial-2 - 2.5%');
 const r=funcs.scheduleForCard(c,data,null);
 assert.equal(data.extensions[String(r.id)],undefined);
 funcs.syncStamp(c,r,null,r.revised_due_date,data.credits);
 assert.equal(c.badge.textContent,'Overdue');
});
test('status decoration is read-only and does not revise contractual dates',()=>{
 assert(!/\.update\(|\.insert\(|\.delete\(|\.rpc\(/.test(source),'display patch must not modify payment schedules');
});
