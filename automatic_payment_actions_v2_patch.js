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
function isPaymentStage(r){var n=norm(r&&r.stage_name);return !!n&&n.indexOf('dld')<0&&n.indexOf('admin fee')<0&&n.indexOf('booking')<0&&(n.indexOf('installment')>=0||n.indexOf('down payment')>=0||n.indexOf('final')>=0)}
function manualPaymentTask(r){if(!r||r.status!=='pending'||(r.source&&r.source!=='manual'))return false;return /(payment|installment|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection)/.test(norm(text(r.action_label)+' '+text(r.note)))}
function activeUnitIds(){var x={};if(window.state&&Array.isArray(state.dues))state.dues.forEach(function(c){if(Number(c&&c.sno)>0)x[c.sno]=1});return Object.keys(x).map(Number)}
function carryManaged(){var x={};if(window.state&&Array.isArray(state.dues))state.dues.forEach(function(c){(c.stages||[]).forEach(function(s){if(s&&s.id&&s.carryForwardManaged===true)x[String(s.id)]=1})});return x}
function keyFor(k,id,d){return k+'|schedule:'+id+'|due:'+d}
function overdueKey(uid,rows){return'overdue_follow_up|unit:'+uid+'|schedules:'+rows.map(function(x){return Number(x.row.id)}).sort(function(a,b){return a-b}).join(',')}
function label(k,remaining){return k==='demand_letter'?'Send Demand Letter':k==='gentle_reminder'?'Send Gentle Reminder':'Urgent Follow-up — '+money(remaining)+' overdue'}
function priority(k){return k==='demand_letter'?'Medium':'High'}
function actionDue(k,d){return k==='demand_letter'?addDays(d,-10):k==='gentle_reminder'?addDays(d,-2):d}
function dateDescription(r){var contractual=iso(r.due_date),revised=iso(r.revised_due_date);return revised&&revised!==contractual?'SPA/Booking due '+dateText(contractual)+' · revised to '+dateText(revised):'installment due '+dateText(contractual)}
function taskNote(r,remaining,credit){var p=[text(r.stage_name),money(remaining)+' outstanding'];if(credit>0)p.push(money(credit)+' credit note applied');p.push(dateDescription(r)+'.');return p.join(' · ')}
function overdueNote(rows,total){rows=rows.slice().sort(function(a,b){return effectiveDue(a.row).localeCompare(effectiveDue(b.row))});if(rows.length===1)return taskNote(rows[0].row,total,rows[0].creditApplied||0);var c=Math.round(rows.reduce(function(s,x){return s+(Number(x.creditApplied)||0)},0)*100)/100,n=rows.length+' installments overdue · '+money(total)+' total outstanding';if(c>0)n+=' after '+money(c)+' linked credit notes';return n+' · '+rows.map(function(x){return text(x.row.stage_name)}).join(' + ')+' · oldest effective due '+dateText(effectiveDue(rows[0].row))+'.'}
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
 var managed=carryManaged(),manual={},activeUnits={};units.forEach(function(x){activeUnits[String(x)]=1});tasks.forEach(function(t){if(manualPaymentTask(t))manual[String(t.unit_id)]=1});
 var auto=tasks.filter(function(t){return t.source==='automatic'}),byKey={};auto.forEach(function(t){if(t.auto_key)byKey[t.auto_key]=t});
 var phase={},overdue={},desired=[];
 schedules.forEach(function(r){var sid=String(r.id);if(!isPaymentStage(r)||managed[sid]||extended[sid])return;var remaining=Math.round(Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-(credit[sid]||0))*100)/100,due=effectiveDue(r),delta=daysUntil(due);if(!due||delta===null)return;var p={row:r,remaining:remaining,creditApplied:credit[sid]||0,delta:delta,paid:remaining<=1};if(!p.paid){if(delta===10)p.kind='demand_letter';else if(delta===2)p.kind='gentle_reminder';else if(delta<0)(overdue[String(r.unit_id)]=overdue[String(r.unit_id)]||[]).push({row:r,remaining:remaining,creditApplied:p.creditApplied})}if(p.kind){p.key=keyFor(p.kind,r.id,due);desired.push({unit_id:Number(r.unit_id),action_label:label(p.kind,remaining),due_date:actionDue(p.kind,due),priority:priority(p.kind),note:taskNote(r,remaining,p.creditApplied),status:'pending',owner_id:user.id,source:'automatic',auto_kind:p.kind,auto_key:p.key,schedule_id:Number(r.id),updated_at:new Date().toISOString()})}phase[sid]=p});
 var overdueExpected={};Object.keys(overdue).forEach(function(uid){var rows=overdue[uid];if(!rows.length||manual[uid])return;rows.sort(function(a,b){return effectiveDue(a.row).localeCompare(effectiveDue(b.row))});var total=Math.round(rows.reduce(function(s,x){return s+x.remaining},0)*100)/100,k=overdueKey(uid,rows);overdueExpected[uid]=k;desired.push({unit_id:Number(uid),action_label:label('overdue_follow_up',total),due_date:effectiveDue(rows[0].row),priority:'High',note:overdueNote(rows,total),status:'pending',owner_id:user.id,source:'automatic',auto_kind:'overdue_follow_up',auto_key:k,schedule_id:null,updated_at:new Date().toISOString()})});
 var dead=[];auto.forEach(function(t){if(t.status!=='pending')return;if(!activeUnits[String(t.unit_id)]){dead.push(t.id);return}if(t.auto_kind==='overdue_follow_up'){if(!overdueExpected[String(t.unit_id)]||t.auto_key!==overdueExpected[String(t.unit_id)])dead.push(t.id);return}var sid=t.schedule_id==null?'':String(t.schedule_id),p=phase[sid];if(!p){dead.push(t.id);return}var k=keyFor(t.auto_kind,p.row.id,effectiveDue(p.row));if(t.auto_key!==k||p.paid||(p.delta===2&&t.auto_kind==='demand_letter')||(p.delta<0&&(t.auto_kind==='demand_letter'||t.auto_kind==='gentle_reminder')))dead.push(t.id)});
 var changed=await cancel(dead);for(var i=0;i<desired.length;i++){var p=desired[i],old=byKey[p.auto_key];if(old){if(old.status==='pending'&&(text(old.action_label)!==p.action_label||text(old.due_date)!==p.due_date||text(old.priority)!==p.priority||text(old.note)!==p.note)){var u=await sb.from('scheduled_actions').update({action_label:p.action_label,due_date:p.due_date,priority:p.priority,note:p.note,updated_at:p.updated_at}).eq('id',old.id);if(u.error)throw u.error;changed=true}continue}var ins=await sb.from('scheduled_actions').insert(p);if(ins.error&&ins.error.code!=='23505')throw ins.error;if(!ins.error)changed=true}
 await refreshMeta();return changed
}
function sync(force){if(syncing)return syncing;if(!force&&Date.now()-lastSyncAt<5000){decorate();return Promise.resolve(false)}syncing=run().catch(function(e){console.warn('Automatic payment actions v2 could not sync',e);return false}).then(function(v){lastSyncAt=Date.now();syncing=null;return v});return syncing}
function schedule(ms){clearTimeout(syncTimer);syncTimer=setTimeout(function(){sync(false)},ms==null?250:ms)}
function install(){if(!window.state||!window.sb||typeof window.renderOverview!=='function'||typeof window.renderDetail!=='function'||typeof window.loadFromSupabase!=='function'){setTimeout(install,60);return}ensureStyles();var ro=window.renderOverview;window.renderOverview=function(){var x=ro.apply(this,arguments);schedule(80);decorate();return x};var rd=window.renderDetail;window.renderDetail=function(){var x=rd.apply(this,arguments);schedule(80);decorate();return x};var ld=window.loadFromSupabase;window.loadFromSupabase=async function(){var x=await ld.apply(this,arguments);await sync(true);return x};window.addEventListener('pageshow',function(){decorate();schedule(120)});sync(true)}
install();
})();
