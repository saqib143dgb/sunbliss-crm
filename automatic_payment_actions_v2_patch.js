(function(){
'use strict';
if(window.__sunblissAutomaticPaymentActionsV2Installed)return;
window.__sunblissAutomaticPaymentActionsV2Installed=true;

var syncing=null,lastSyncAt=0,syncTimer=null,autoMeta={};
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase().replace(/\s+/g,' ')}
function iso(v){if(!v)return'';var s=String(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function day(v){var s=iso(v),d=s?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function dubaiToday(){var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value});return o.year+'-'+o.month+'-'+o.day}
function daysUntil(v){var d=iso(v),t=dubaiToday();return d?Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(t+'T00:00:00Z'))/86400000):null}
function addDays(v,n){var d=iso(v);return d?new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10):''}
function dateText(v){var d=day(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):text(v)}
function money(v){var n=Math.max(0,Number(v)||0);return typeof window.fmtAED==='function'?window.fmtAED(n):'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2})}
function effectiveDue(r){return iso(r&&r.revised_due_date)||iso(r&&r.due_date)}
function stageKind(r){var n=norm(r&&r.stage_name).replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return''}
function manualPaymentTask(r){if(!r||r.status!=='pending'||(r.source&&r.source!=='manual')||r.auto_kind)return false;return /(payment|installment|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection|dld|admin fee)/.test(norm(text(r.action_label)+' '+text(r.note)))}
function idsFromKey(k){var m=text(k).match(/\|schedules?:([0-9,]+)/);return m?m[1].split(',').map(String):[]}
function activeUnitIds(){var x={};if(window.state&&Array.isArray(state.dues))state.dues.forEach(function(c){if(Number(c&&c.sno)>0)x[c.sno]=1});return Object.keys(x).map(Number)}
function carryManaged(){var x={};if(window.state&&Array.isArray(state.dues))state.dues.forEach(function(c){(c.stages||[]).forEach(function(s){if(s&&s.id&&s.carryForwardManaged===true)x[String(s.id)]=1})});return x}
function keyFor(k,id,d){return k+'|schedule:'+id+'|due:'+d}
function groupKey(k,uid,rows,d){if(rows.length===1)return keyFor(k,rows[0].row.id,d);return k+'|unit:'+uid+'|schedules:'+rows.map(function(x){return Number(x.row.id)}).sort(function(a,b){return a-b}).join(',')+'|due:'+d}
function overdueKey(uid,rows){return'overdue_follow_up|unit:'+uid+'|schedules:'+rows.map(function(x){return Number(x.row.id)}).sort(function(a,b){return a-b}).join(',')}
function label(k,remaining){return k==='demand_letter'?'Send Demand Letter':k==='gentle_reminder'?'Send Gentle Reminder':'Urgent Follow-up — '+money(remaining)+' overdue'}
function priority(k){return k==='demand_letter'?'Medium':'High'}
function actionDue(k,d){return k==='demand_letter'?addDays(d,-10):k==='gentle_reminder'?addDays(d,-2):d}
function dateDescription(r){var contractual=iso(r.due_date),revised=iso(r.revised_due_date);return revised&&revised!==contractual?'contractual due '+dateText(contractual)+' · revised to '+dateText(revised):'payment due '+dateText(contractual)}
function taskNote(r,remaining,credit){var p=[text(r.stage_name),money(remaining)+' outstanding'];if(credit>0)p.push(money(credit)+' credit note applied');p.push(dateDescription(r)+'.');return p.join(' · ')}
function groupedNote(rows,total){rows=rows.slice().sort(function(a,b){return effectiveDue(a.row).localeCompare(effectiveDue(b.row))||Number(a.row.id)-Number(b.row.id)});if(rows.length===1)return taskNote(rows[0].row,total,rows[0].creditApplied||0);var c=Math.round(rows.reduce(function(s,x){return s+(Number(x.creditApplied)||0)},0)*100)/100,n=rows.map(function(x){return text(x.row.stage_name)}).join(' + ')+' · '+money(total)+' total outstanding';if(c>0)n+=' after '+money(c)+' linked credit notes';return n+' · payment due '+dateText(effectiveDue(rows[0].row))+'.'}
function overdueNote(rows,total){rows=rows.slice().sort(function(a,b){return effectiveDue(a.row).localeCompare(effectiveDue(b.row))});if(rows.length===1)return taskNote(rows[0].row,total,rows[0].creditApplied||0);var c=Math.round(rows.reduce(function(s,x){return s+(Number(x.creditApplied)||0)},0)*100)/100,n=rows.length+' payment obligations overdue · '+money(total)+' total outstanding';if(c>0)n+=' after '+money(c)+' linked credit notes';return n+' · '+rows.map(function(x){return text(x.row.stage_name)}).join(' + ')+' · oldest effective due '+dateText(effectiveDue(rows[0].row))+'.'}
function ensureStyles(){if(document.getElementById('automaticPaymentActionStyles'))return;var s=document.createElement('style');s.id='automaticPaymentActionStyles';s.textContent='.scheduled-auto-badge{display:inline-flex;align-items:center;margin-left:7px;padding:2px 6px;border:1px solid rgba(162,124,53,.38);border-radius:999px;background:rgba(162,124,53,.08);color:var(--gold-deep,#A27C35);font:700 8px/1.2 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;vertical-align:1px}.scheduled-task-card.scheduled-auto .scheduled-edit{display:none!important}';document.head.appendChild(s)}
function decorate(){ensureStyles();document.querySelectorAll('[data-task-id]').forEach(function(n){var m=autoMeta[text(n.getAttribute('data-task-id'))];if(!m)return;n.classList.add('scheduled-auto');n.setAttribute('data-auto-kind',m.auto_kind||'');var t=n.querySelector('.scheduled-overview-title,.scheduled-task-title');if(t&&!t.querySelector('.scheduled-auto-badge')){var b=document.createElement('span');b.className='scheduled-auto-badge';b.textContent='Automatic';t.appendChild(b)}})}
async function refreshMeta(){if(!window.sb)return;var r=await sb.from('scheduled_actions').select('id,auto_kind').eq('source','automatic');if(r.error)return;autoMeta={};(r.data||[]).forEach(function(x){autoMeta[String(x.id)]={auto_kind:x.auto_kind}});decorate()}
async function cancel(ids){if(!ids.length)return false;var n=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'cancelled',cancelled_at:n,updated_at:n}).in('id',ids);if(r.error)throw r.error;return true}
async function run(){
 if(!window.state||state.userRole!=='crm_officer'||!window.sb)return false;
 var units=activeUnitIds();if(!units.length){await refreshMeta();return false}
 var ur=await sb.auth.getUser(),user=ur&&ur.data&&ur.data.user;if(!user)return false;
 var q=await Promise.all([
   sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,revised_due_amount,due_date,revised_due_date,paid_amount,status').in('unit_id',units),
   sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,created_at,updated_at,completion_note'),
   sb.from('credit_notes').select('payment_schedule_id,unit_id,amount').in('unit_id',units),
   sb.from('payment_extensions').select('payment_schedule_id,status,extended_due_date').in('unit_id',units).eq('status','active')
 ]);q.forEach(function(r){if(r.error)throw r.error});
 var schedules=q[0].data||[],tasks=q[1].data||[],credits=q[2].data||[],extensions=q[3].data||[],credit={},extended={};
 credits.forEach(function(c){if(c.payment_schedule_id!=null){var k=String(c.payment_schedule_id);credit[k]=Math.round(((credit[k]||0)+(Number(c.amount)||0))*100)/100}});
 extensions.forEach(function(e){if(e.payment_schedule_id!=null&&iso(e.extended_due_date)>=iso(new Date().toISOString()))extended[String(e.payment_schedule_id)]=1});
 var managed=carryManaged(),manualSchedule={},manualGentleBySchedule={},pendingDemand={},recentDemand={},finishedDemand={},activeUnits={},schedulesById={};
 units.forEach(function(x){activeUnits[String(x)]=1});
 schedules.forEach(function(r){schedulesById[String(r.id)]=r});
 tasks.forEach(function(t){
   var ids=t.schedule_id!=null?[String(t.schedule_id)]:idsFromKey(t.auto_key);
   if(manualPaymentTask(t))ids.forEach(function(id){manualSchedule[String(id)]=1});
   if(t.status==='pending'&&(t.source==='manual'||!t.source)&&/\bgentle reminder\b/i.test(text(t.action_label)))ids.forEach(function(id){manualGentleBySchedule[String(id)]=1});
   if(t.auto_kind!=='demand_letter')return;
   if(t.status==='pending')ids.forEach(function(id){pendingDemand[String(id)]=1});
   if(t.status==='completed'){
     ids.forEach(function(id){finishedDemand[String(id)]=1});
     if(t.updated_at&&Date.now()-new Date(t.updated_at).getTime()<86400000)
       ids.forEach(function(id){recentDemand[String(id)]=1});
   }
   // A customer-confirmed payment or other explicitly resolved cancellation must never be reopened.
   if(t.status==='cancelled'&&text(t.completion_note).trim())
     ids.forEach(function(id){finishedDemand[String(id)]=1});
 });
 // Keep ownership of this synchronizer restricted to payment tasks; never cancel SPA/extension workflows.
 var auto=tasks.filter(function(t){return t.source==='automatic'&&['demand_letter','gentle_reminder','overdue_follow_up'].indexOf(t.auto_kind)>=0}),byKey={};
 auto.forEach(function(t){if(t.auto_key)byKey[t.auto_key]=t});
 var byUnit={},allByUnit={};
 schedules.forEach(function(r){var sid=String(r.id),kind=stageKind(r);if(!kind||managed[sid])return;var applied=credit[sid]||0,contractedNetDue=r.revised_due_amount==null?(Number(r.due_amount)||0):(Number(r.revised_due_amount)||0),remaining=Math.round(Math.max(0,contractedNetDue-(Number(r.paid_amount)||0)-applied)*100)/100,due=effectiveDue(r),delta=daysUntil(due);if(!due||delta===null)return;var entry={row:r,kind:kind,remaining:remaining,creditApplied:applied,delta:delta,due:due,extended:!!extended[sid],manual:!!manualSchedule[sid]};(allByUnit[String(r.unit_id)]=allByUnit[String(r.unit_id)]||[]).push(entry);if(remaining>1000)(byUnit[String(r.unit_id)]=byUnit[String(r.unit_id)]||[]).push(entry)});
 var pairedBySchedule={},pairedGroups=[];
 // Shared date: first installment and DLD/Admin must have one task.
 // The linked IDs are stable even after either component is paid.
 Object.keys(allByUnit).forEach(function(uid){
   var byDate={};
   allByUnit[uid].forEach(function(x){
     if(x.extended||(x.kind!=='first'&&x.kind!=='dld'))return;
     (byDate[x.due]=byDate[x.due]||[]).push(x);
   });
   Object.keys(byDate).forEach(function(d){
     var group=byDate[d];
     if(!group.some(function(x){return x.kind==='first'})||!group.some(function(x){return x.kind==='dld'}))return;
     pairedGroups.push({uid:uid,due:d,rows:group});
     group.forEach(function(x){pairedBySchedule[String(x.row.id)]=group});
   });
 });
 var desired=[],desiredKeys={};
 function addDesired(kind,uid,rows,due,keyRows){
   if(!rows.length)return;
   var total=Math.round(rows.reduce(function(s,x){return s+x.remaining},0)*100)/100,
     links=keyRows||rows,
     k=kind==='overdue_follow_up'?overdueKey(uid,links):groupKey(kind,uid,links,due),
     existing=byKey[k],
     isDownPaymentReminder=kind==='gentle_reminder'&&rows.length===1&&rows[0].kind==='dp',
     dueForTask=isDownPaymentReminder?(existing&&existing.status==='pending'&&iso(existing.due_date)||dubaiToday()):
       kind==='overdue_follow_up'?rows[0].due:actionDue(kind,due),
     p={unit_id:Number(uid),action_label:label(kind,total),due_date:dueForTask,
       priority:priority(kind),note:groupedNote(rows,total),status:'pending',owner_id:user.id,
       source:'automatic',auto_kind:kind,auto_key:k,
       schedule_id:links.length===1?Number(links[0].row.id):null,updated_at:new Date().toISOString()};
   if(kind==='overdue_follow_up')p.note=overdueNote(rows,total);
   desired.push(p);desiredKeys[k]=1;
 }
 // A previous overdue stage or a manual payment follow-up must not hide the next installment.
 Object.keys(byUnit).forEach(function(uid){
   var rows=byUnit[uid].slice().sort(function(a,b){return a.due.localeCompare(b.due)||Number(a.row.id)-Number(b.row.id)});
   var dp=rows.filter(function(x){return x.kind==='dp'}),pre=rows.filter(function(x){return x.kind==='first'||x.kind==='dld'});
   // Retain the established single overdue-follow-up priority without blocking future demands.
   var current=dp.length?dp:pre.length?pre:rows.filter(function(x){return x.kind==='later'});
   var overdue=current.filter(function(x){return x.delta<0&&!x.extended&&!x.manual&&!pendingDemand[String(x.row.id)]});
   if(overdue.length)addDesired('overdue_follow_up',uid,overdue,overdue[0].due);
   // Create only one scheduled task for the shared payment obligation.
   var seen={};
   rows.forEach(function(x){
     if(x.kind==='dp'){
       // Down Payment is a booking-stage balance: never issue a Demand Letter.
       // Send one gentle reminder as soon as an unpaid balance enters the 10-day window.
       // When created inside that window, its action date is today (not a date in the past).
       if(x.delta>=0&&x.delta<=10&&!x.extended&&!manualGentleBySchedule[String(x.row.id)])
         addDesired('gentle_reminder',uid,[x],x.due);
       return;
     }
     if(x.delta<0||x.delta>10||x.extended)return;
     var links=pairedBySchedule[String(x.row.id)]||[x],key=groupKey('demand_letter',uid,links,x.due);
     if(seen[key])return;seen[key]=1;
     var unpaid=links.filter(function(y){return y.remaining>1000&&!y.extended});
     if(!unpaid.length)return;
     var ids=links.map(function(y){return String(y.row.id)}),
       pending=ids.some(function(id){return pendingDemand[id]}),
       resolved=ids.some(function(id){return finishedDemand[id]}),
       recent=ids.some(function(id){return recentDemand[id]});
     if(pending||!resolved)addDesired('demand_letter',uid,unpaid,x.due,links);
     if(x.delta===2&&!pending&&!recent&&!resolved)addDesired('gentle_reminder',uid,unpaid,x.due,links);
   });
 });
 // Merge previously created pending single-stage Demand Letters into the shared task.
 // Keep one task ID and preserve every other row in the audit history.
 for(var g=0;g<pairedGroups.length;g++){
   var group=pairedGroups[g],ids=group.rows.map(function(x){return String(x.row.id)}),
     newKey=groupKey('demand_letter',group.uid,group.rows,group.due);
   var matches=auto.filter(function(t){
     if(t.auto_kind!=='demand_letter'||t.status!=='pending'||String(t.unit_id)!==String(group.uid))return false;
     var taskDue=(text(t.auto_key).match(/[|]due:(\d{4}-\d{2}-\d{2})/)||[])[1];
     if(taskDue!==group.due)return false;
     var linked=t.schedule_id!=null?[String(t.schedule_id)]:idsFromKey(t.auto_key);
     return linked.some(function(id){return ids.indexOf(id)>=0});
   });
   if(!matches.length)continue;
   matches.sort(function(a,b){
     function order(t){if(t.auto_key===newKey)return 0;
       return group.rows.some(function(x){return x.kind==='first'&&Number(x.row.id)===Number(t.schedule_id)})?1:2}
     return order(a)-order(b)||Number(a.id)-Number(b.id);
   });
   var keep=matches[0],unpaid=group.rows.filter(function(x){return x.remaining>1000&&!x.extended});
   if(keep.auto_key!==newKey||keep.schedule_id!==null){
     var oldKey=keep.auto_key,upd={auto_key:newKey,schedule_id:null,updated_at:new Date().toISOString()};
     if(unpaid.length)upd.note=groupedNote(unpaid,unpaid.reduce(function(n,x){return n+x.remaining},0));
     var result=await sb.from('scheduled_actions').update(upd).eq('id',keep.id);
     if(result.error)throw result.error;
     if(byKey[oldKey]===keep)delete byKey[oldKey];
     Object.assign(keep,upd);byKey[newKey]=keep;
   }
   ids.forEach(function(id){pendingDemand[id]=1});
   for(var j=1;j<matches.length;j++){
     var duplicate=matches[j],now=new Date().toISOString(),msg='Consolidated into Demand Letter task #'+keep.id+' for shared due date.';
     var result=await sb.from('scheduled_actions').update({status:'cancelled',cancelled_at:now,updated_at:now,completion_note:msg}).eq('id',duplicate.id);
     if(result.error)throw result.error;
     duplicate.status='cancelled';duplicate.completion_note=msg;
     if(byKey[duplicate.auto_key]===duplicate)delete byKey[duplicate.auto_key];
   }
 }
 var dead=[],obsoleteDownPaymentDemands=[];
 auto.forEach(function(t){
   if(t.status!=='pending')return;
   if(t.auto_kind==='demand_letter'){
     var ids=t.schedule_id!=null?[String(t.schedule_id)]:idsFromKey(t.auto_key);
     // Never preserve an unsent Down Payment Demand Letter. Audit-trail the cancellation;
     // do not alter already sent/completed Demand Letters.
     if(ids.length&&ids.every(function(id){return !!schedulesById[id]})&&
        ids.some(function(id){return stageKind(schedulesById[id])==='dp'})){
       obsoleteDownPaymentDemands.push(t.id);
       return;
     }
     // Other unsent Demand Letters remain actionable unless their due date changed.
     var oldDue=(text(t.auto_key).match(/[|]due:(\d{4}-\d{2}-\d{2})/)||[])[1];
     if(oldDue&&ids.length&&ids.every(function(id){return !!schedulesById[id]})&&
       ids.some(function(id){return effectiveDue(schedulesById[id])!==oldDue}))
       dead.push(t.id);
     return;
   }
   if(!activeUnits[String(t.unit_id)]||!desiredKeys[t.auto_key])dead.push(t.id);
 });
 var changed=await cancel(dead);
 if(obsoleteDownPaymentDemands.length){
   var retiredAt=new Date().toISOString(),retired=await sb.from('scheduled_actions')
     .update({status:'cancelled',cancelled_at:retiredAt,updated_at:retiredAt,
       completion_note:'Automatically replaced: Down Payment requires Gentle Reminder, not Demand Letter.'})
     .in('id',obsoleteDownPaymentDemands);
   if(retired.error)throw retired.error;
   changed=true;
 }
 for(var i=0;i<desired.length;i++){var p=desired[i],old=byKey[p.auto_key];if(old){if(old.status==='completed'||(old.status==='cancelled'&&text(old.completion_note).trim()))continue;var fieldsChanged=text(old.action_label)!==p.action_label||text(old.due_date)!==p.due_date||text(old.priority)!==p.priority||text(old.note)!==p.note;if(old.status!=='pending'||fieldsChanged){var update={action_label:p.action_label,due_date:p.due_date,priority:p.priority,note:p.note,status:'pending',completed_at:null,completion_note:null,cancelled_at:null,updated_at:p.updated_at},u=await sb.from('scheduled_actions').update(update).eq('id',old.id);if(u.error)throw u.error;changed=true}continue}var ins=await sb.from('scheduled_actions').insert(p);if(ins.error&&ins.error.code!=='23505')throw ins.error;if(!ins.error)changed=true}
 await refreshMeta();if(changed&&typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();return changed
}
function sync(force){if(syncing)return syncing;if(!force&&Date.now()-lastSyncAt<5000){decorate();return Promise.resolve(false)}syncing=run().catch(function(e){console.warn('Automatic payment actions v2 could not sync',e);return false}).then(function(v){lastSyncAt=Date.now();syncing=null;return v});return syncing}
window.__sunblissEnsureAutomaticActions=function(force){return sync(force===true)};
function schedule(ms){clearTimeout(syncTimer);syncTimer=setTimeout(function(){sync(false)},ms==null?250:ms)}
function install(){if(!window.state||!window.sb||typeof window.renderOverview!=='function'||typeof window.renderDetail!=='function'||typeof window.loadFromSupabase!=='function'){setTimeout(install,60);return}ensureStyles();var ro=window.renderOverview;window.renderOverview=function(){var x=ro.apply(this,arguments);schedule(80);decorate();return x};var rd=window.renderDetail;window.renderDetail=function(){var x=rd.apply(this,arguments);schedule(80);decorate();return x};var ld=window.loadFromSupabase;window.loadFromSupabase=async function(){var x=await ld.apply(this,arguments);await sync(true);return x};window.addEventListener('pageshow',function(){decorate();schedule(120)});sync(true)}
install();
})();