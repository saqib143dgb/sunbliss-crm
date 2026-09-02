(function(){
'use strict';
if(window.__sunblissAutomaticPaymentActionsV2Installed)return;
window.__sunblissAutomaticPaymentActionsV2Installed=true;

var syncing=null,lastSyncAt=0,syncTimer=null,autoMeta={};
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase().replace(/\s+/g,' ')}
function iso(v){if(!v)return'';var s=String(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function day(v){var s=iso(v),d=s?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function daysUntil(v){var d=day(v),t=new Date();t.setHours(0,0,0,0);return d?Math.round((d-t)/86400000):null}
function addDays(v,n){var d=day(v);if(!d)return'';d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateText(v){var d=day(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):text(v)}
function money(v){var n=Math.max(0,Number(v)||0);return typeof window.fmtAED==='function'?window.fmtAED(n):'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2})}
function effectiveDue(r){return iso(r&&r.revised_due_date)||iso(r&&r.due_date)}
function stageKind(r){var n=norm(r&&r.stage_name).replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return''}
function isPaymentStage(r){return!!stageKind(r)}
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
   sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,status').in('unit_id',units),
   sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,created_at,updated_at'),
   sb.from('credit_notes').select('payment_schedule_id,unit_id,amount').in('unit_id',units),
   sb.from('payment_extensions').select('payment_schedule_id,status,extended_due_date').in('unit_id',units).eq('status','active')
 ]);q.forEach(function(r){if(r.error)throw r.error});
 var schedules=q[0].data||[],tasks=q[1].data||[],credits=q[2].data||[],extensions=q[3].data||[],credit={},extended={};
 credits.forEach(function(c){if(c.payment_schedule_id!=null){var k=String(c.payment_schedule_id);credit[k]=Math.round(((credit[k]||0)+(Number(c.amount)||0))*100)/100}});
 extensions.forEach(function(e){if(e.payment_schedule_id!=null&&iso(e.extended_due_date)>=iso(new Date().toISOString()))extended[String(e.payment_schedule_id)]=1});
 var managed=carryManaged(),manualSchedule={},activeUnits={};units.forEach(function(x){activeUnits[String(x)]=1});tasks.forEach(function(t){if(!manualPaymentTask(t))return;var ids=t.schedule_id!=null?[String(t.schedule_id)]:idsFromKey(t.auto_key);ids.forEach(function(id){manualSchedule[String(id)]=1})});
 var auto=tasks.filter(function(t){return t.source==='automatic'}),byKey={};auto.forEach(function(t){if(t.auto_key)byKey[t.auto_key]=t});
 var byUnit={};
 schedules.forEach(function(r){var sid=String(r.id),kind=stageKind(r);if(!kind||managed[sid])return;var applied=kind==='dld'?0:(credit[sid]||0),remaining=Math.round(Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-applied)*100)/100,due=effectiveDue(r),delta=daysUntil(due);if(remaining<=1||!due||delta===null)return;(byUnit[String(r.unit_id)]=byUnit[String(r.unit_id)]||[]).push({row:r,kind:kind,remaining:remaining,creditApplied:applied,delta:delta,due:due,extended:!!extended[sid],manual:!!manualSchedule[sid]})});
 var desired=[],desiredKeys={};
 function addDesired(kind,uid,rows,due){if(!rows.length)return;var total=Math.round(rows.reduce(function(s,x){return s+x.remaining},0)*100)/100,k=kind==='overdue_follow_up'?overdueKey(uid,rows):groupKey(kind,uid,rows,due),p={unit_id:Number(uid),action_label:label(kind,total),due_date:kind==='overdue_follow_up'?rows[0].due:actionDue(kind,due),priority:priority(kind),note:kind==='overdue_follow_up'?overdueNote(rows,total):groupedNote(rows,total),status:'pending',owner_id:user.id,source:'automatic',auto_kind:kind,auto_key:k,schedule_id:rows.length===1?Number(rows[0].row.id):null,updated_at:new Date().toISOString()};desired.push(p);desiredKeys[k]=1}
 Object.keys(byUnit).forEach(function(uid){var rows=byUnit[uid].slice().sort(function(a,b){return a.due.localeCompare(b.due)||Number(a.row.id)-Number(b.row.id)}),dp=rows.filter(function(x){return x.kind==='dp'}),pre=rows.filter(function(x){return x.kind==='first'||x.kind==='dld'}),current=dp.length?dp:pre.length?pre:rows.filter(function(x){return x.kind==='later'});current=current.filter(function(x){return!x.extended&&!x.manual});if(!current.length)return;var overdue=current.filter(function(x){return x.delta<0});if(overdue.length){addDesired('overdue_follow_up',uid,overdue,overdue[0].due);return}var groups={};current.forEach(function(x){var kind=x.delta===10?'demand_letter':x.delta===2?'gentle_reminder':'';if(!kind)return;var k=kind+'|'+x.due;(groups[k]=groups[k]||{kind:kind,due:x.due,rows:[]}).rows.push(x)});Object.keys(groups).forEach(function(k){var g=groups[k];addDesired(g.kind,uid,g.rows,g.due)})});
 var dead=[];auto.forEach(function(t){if(t.status!=='pending')return;if(!activeUnits[String(t.unit_id)]||!desiredKeys[t.auto_key])dead.push(t.id)});
 var changed=await cancel(dead);for(var i=0;i<desired.length;i++){var p=desired[i],old=byKey[p.auto_key];if(old){var fieldsChanged=text(old.action_label)!==p.action_label||text(old.due_date)!==p.due_date||text(old.priority)!==p.priority||text(old.note)!==p.note;if(old.status!=='pending'||fieldsChanged){var update={action_label:p.action_label,due_date:p.due_date,priority:p.priority,note:p.note,status:'pending',completed_at:null,completion_note:null,cancelled_at:null,updated_at:p.updated_at},u=await sb.from('scheduled_actions').update(update).eq('id',old.id);if(u.error)throw u.error;changed=true}continue}var ins=await sb.from('scheduled_actions').insert(p);if(ins.error&&ins.error.code!=='23505')throw ins.error;if(!ins.error)changed=true}
 await refreshMeta();return changed
}
function sync(force){if(syncing)return syncing;if(!force&&Date.now()-lastSyncAt<5000){decorate();return Promise.resolve(false)}syncing=run().catch(function(e){console.warn('Automatic payment actions v2 could not sync',e);return false}).then(function(v){lastSyncAt=Date.now();syncing=null;return v});return syncing}
function schedule(ms){clearTimeout(syncTimer);syncTimer=setTimeout(function(){sync(false)},ms==null?250:ms)}
function install(){if(!window.state||!window.sb||typeof window.renderOverview!=='function'||typeof window.renderDetail!=='function'||typeof window.loadFromSupabase!=='function'){setTimeout(install,60);return}ensureStyles();var ro=window.renderOverview;window.renderOverview=function(){var x=ro.apply(this,arguments);schedule(80);decorate();return x};var rd=window.renderDetail;window.renderDetail=function(){var x=rd.apply(this,arguments);schedule(80);decorate();return x};var ld=window.loadFromSupabase;window.loadFromSupabase=async function(){var x=await ld.apply(this,arguments);await sync(true);return x};window.addEventListener('pageshow',function(){decorate();schedule(120)});sync(true)}
install();
})();
