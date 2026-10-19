const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const pill=fs.readFileSync('customer_scheduled_tasks_pill_patch.js','utf8');
const effective=fs.readFileSync('effective_action_required_patch.js','utf8');
const cardStyle=fs.readFileSync('reference_layout_viewport_patch.js','utf8');
const scheduled=fs.readFileSync('scheduled_actions_patch.js','utf8');

function section(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing source-owned function '+start);
 return source.slice(a,b);
}

function mock(){
 const button={hidden:false,attributes:{},setAttribute(k,v){this.attributes[k]=v},querySelector(){return count}};
 const count={hidden:false,textContent:'0'};
 const sandbox={
  rows:null,c:{sno:203,unit:'B2-203'},
  document:{getElementById(k){return k==='crmCustomerTasksPill'?button:null}}
 };
 const active=section(pill,'  function activeTasks(c){','  function dateISO(){');
 const updating=section(pill,'  function updateCount(){','  function close(){');
 const program=`function str(v){return v==null?'':String(v);}
 function taskRows(){return rows;}
 function currentCustomer(){return c;}
 var popover=null;
 function close(){}
 ${active}
 ${updating}
 this.ops={updateCount,activeTasks};`;
 vm.runInNewContext(program,sandbox);
 return {button,count,sandbox,refresh:()=>sandbox.ops.updateCount()};
}

test('CRM UI sources parse and continue to reuse the same scheduled workflow',()=>{
 for(const src of [pill,effective,cardStyle])new vm.Script(src);
 assert.match(scheduled,/__sunblissScheduledActionRows=function\(\)\{return cache\.loaded\?cache\.rows\.filter\(visibleTask\):null;\}/);
 assert.match(pill,/__sunblissOpenScheduledAction\(id\)/);
});
test('Task pill remains hidden until tasks are fetched, and hides when no actionable tasks exist',()=>{
 const m=mock();
 m.refresh();
 assert.equal(m.button.hidden,true);
 assert.equal(m.count.hidden,true);
 m.sandbox.rows=[
  {id:1,unit_id:203,status:'pending',auto_kind:'extension_active',due_date:'2026-12-29'},
  {id:2,unit_id:203,status:'completed',due_date:'2026-10-01'},
  {id:3,unit_id:204,status:'pending',due_date:'2026-10-20'}
 ];
 m.refresh();
 assert.equal(m.button.hidden,true);
 assert.equal(m.count.hidden,true);
});
test('Task pill appears only for actionable pending customer tasks and disappears again when completed',()=>{
 const m=mock();
 m.sandbox.rows=[
  {id:4,unit_id:203,status:'pending',action_label:'Send welcome letter',due_date:'2026-10-21'},
  {id:5,unit_id:203,status:'pending',action_label:'Confirm payment',due_date:'2026-10-20'},
  {id:6,unit_id:204,status:'pending',due_date:'2026-10-20'}
 ];
 m.refresh();
 assert.equal(m.button.hidden,false);
 assert.equal(m.count.textContent,'2');
 assert.deepEqual(Array.from(m.sandbox.ops.activeTasks(m.sandbox.c),x=>x.id),[5,4]);
 m.sandbox.rows.forEach(t=>{if(t.unit_id===203)t.status='completed'});
 m.refresh();
 assert.equal(m.button.hidden,true);
 assert.equal(m.count.hidden,true);
});
test('Extension notice is not repeated when the Action Required status already says Extension Active',()=>{
 assert.match(effective,/if\(protectedRows\.length&&status!=='Extension Active'\)/);
 assert.match(effective,/else if\(ext\)\{ext\.remove\(\);ext=null\}/);
 // An overdue OTHER installment can still explain a simultaneously active extension.
 assert.match(effective,/result\.extension='Extension active:/);
});
test('Action Required uses the same --paper background in both normal and good statuses',()=>{
 assert.match(cardStyle,/#actionRequiredCard\{[^\n]+background:var\(--paper,#faf7ef\)!important;/);
 assert.match(cardStyle,/#actionRequiredCard\[data-tone=good\]\{background:var\(--paper,#faf7ef\)!important\}/);
 assert.doesNotMatch(cardStyle,/#actionRequiredCard\{[^\n]+background:color-mix\(/);
 assert.match(cardStyle,/#actionRequiredCard\{[^\n]+border-left-width:7px!important/);
});
