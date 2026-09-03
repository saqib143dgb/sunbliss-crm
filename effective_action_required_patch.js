(function(){
'use strict';
if(window.__sunblissEffectiveActionRequiredInstalled)return;
window.__sunblissEffectiveActionRequiredInstalled=true;
var cache={},loading={},preloading=null,timer=null,guardTimer=null,observer=null,rendering=false,CACHE_TTL=120000,STORE_KEY='sunblissEffectiveActionCacheV5';
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase().replace(/\s+/g,' ')}
function iso(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function day(v){var s=iso(v),d=s?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function today(){var d=new Date();d.setHours(0,0,0,0);return d}
function date(v){var d=day(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):text(v)}
function money(v){var n=Math.max(0,Number(v)||0);return typeof window.fmtAED==='function'?window.fmtAED(n):'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2})}
function safe(v){return typeof window.esc==='function'?window.esc(text(v)):text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ensureGuardStyle(){if(document.getElementById('effectiveActionFirstPaintGuard'))return;var s=document.createElement('style');s.id='effectiveActionFirstPaintGuard';s.textContent='.detail #actionRequiredCard:not([data-effective-ready="true"]){visibility:hidden!important;pointer-events:none!important}';document.head.appendChild(s)}
function markPending(){if(!window.state||state.view!=='detail')return;var card=document.getElementById('actionRequiredCard');if(!card)return;card.hidden=false;card.removeAttribute('aria-hidden');delete card.dataset.scheduledCovered;delete card.dataset.effectiveActionSig;card.removeAttribute('data-effective-ready')}
function revealFallback(key){if(!window.state||state.view!=='detail'||text(state.selectedUnit)!==key)return;var card=document.getElementById('actionRequiredCard');if(!card)return;card.hidden=false;card.removeAttribute('aria-hidden');delete card.dataset.scheduledCovered;card.dataset.effectiveReady='true'}
function armGuard(key){clearTimeout(guardTimer);guardTimer=setTimeout(function(){revealFallback(key)},2500)}
function current(){if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function unitIds(){var seen={},ids=[];(window.state&&Array.isArray(state.dues)?state.dues:[]).forEach(function(c){var id=Number(c&&c.sno);if(id>0&&!seen[id]){seen[id]=1;ids.push(id)}});return ids}
function stageKind(r){var n=norm(r&&r.stage_name).replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return''}
function paymentStage(r){return!!stageKind(r)}
function carryManaged(c){var x={};(c&&c.stages||[]).forEach(function(s){if(s&&s.id&&s.carryForwardManaged===true)x[String(s.id)]=1});return x}
function fresh(uid){var hit=cache[String(uid)];return hit&&Date.now()-hit.at<CACHE_TTL?hit:null}
function hydrate(){try{var raw=sessionStorage.getItem(STORE_KEY);if(!raw)return;var saved=JSON.parse(raw),now=Date.now();Object.keys(saved||{}).forEach(function(k){var h=saved[k];if(h&&h.data&&now-Number(h.at||0)<CACHE_TTL)cache[k]=h})}catch(e){}}
function persist(){try{sessionStorage.setItem(STORE_KEY,JSON.stringify(cache))}catch(e){}}
function assemble(rows,credits,extensions,tasks){var credit={},ext={};(credits||[]).forEach(function(c){if(c.payment_schedule_id==null)return;var id=String(c.payment_schedule_id);credit[id]=Math.round(((credit[id]||0)+(Number(c.amount)||0))*100)/100});(extensions||[]).forEach(function(e){if(e.status!=='active'||e.payment_schedule_id==null||!iso(e.extended_due_date))return;var id=String(e.payment_schedule_id),old=ext[id];if(!old||iso(e.extended_due_date)>iso(old.extended_due_date)||(iso(e.extended_due_date)===iso(old.extended_due_date)&&text(e.updated_at)>text(old.updated_at)))ext[id]=e});return{rows:rows||[],credit:credit,ext:ext,tasks:tasks||[]}}
async function preloadAll(force){if(!window.sb)return false;if(preloading&&!force)return preloading;var ids=unitIds();if(!ids.length)return false;var now=Date.now(),allFresh=!force&&ids.every(function(id){var h=cache[String(id)];return h&&now-h.at<CACHE_TTL});if(allFresh)return true;preloading=(async function(){var q=await Promise.all([
 sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,status').in('unit_id',ids),
 sb.from('credit_notes').select('unit_id,payment_schedule_id,amount').in('unit_id',ids),
 sb.from('payment_extensions').select('id,unit_id,payment_schedule_id,extended_due_date,status,approved_on,updated_at').in('unit_id',ids).neq('status','cancelled'),
 sb.from('scheduled_actions').select('id,unit_id,action_label,note,status,source,auto_kind,auto_key,schedule_id').in('unit_id',ids).eq('status','pending')
]);q.forEach(function(r){if(r.error)throw r.error});var rows={},credits={},exts={},tasks={};(q[0].data||[]).forEach(function(r){var k=String(r.unit_id);(rows[k]||(rows[k]=[])).push(r)});(q[1].data||[]).forEach(function(r){var k=String(r.unit_id);(credits[k]||(credits[k]=[])).push(r)});(q[2].data||[]).forEach(function(r){var k=String(r.unit_id);(exts[k]||(exts[k]=[])).push(r)});(q[3].data||[]).forEach(function(r){var k=String(r.unit_id);(tasks[k]||(tasks[k]=[])).push(r)});var at=Date.now();ids.forEach(function(id){var k=String(id);cache[k]={at:at,data:assemble(rows[k]||[],credits[k]||[],exts[k]||[],tasks[k]||[])}});persist();return true})().catch(function(e){console.warn('Could not preload effective payment actions',e);return false}).then(function(v){preloading=null;if(v&&window.state&&state.view==='detail')prepare();return v});return preloading}
async function load(uid,force){var k=String(uid),hit=cache[k];if(!force&&hit&&Date.now()-hit.at<CACHE_TTL)return hit.data;if(!force&&preloading){await preloading;hit=cache[k];if(hit&&Date.now()-hit.at<CACHE_TTL)return hit.data}if(loading[k])return loading[k];loading[k]=(async function(){var q=await Promise.all([
 sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,status').eq('unit_id',uid),
 sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',uid),
 sb.from('payment_extensions').select('id,payment_schedule_id,extended_due_date,status,approved_on,updated_at').eq('unit_id',uid).neq('status','cancelled'),
 sb.from('scheduled_actions').select('id,unit_id,action_label,note,status,source,auto_kind,auto_key,schedule_id').eq('unit_id',uid).eq('status','pending')
]);q.forEach(function(r){if(r.error)throw r.error});var data=assemble(q[0].data||[],q[1].data||[],q[2].data||[],q[3].data||[]);cache[k]={at:Date.now(),data:data};persist();delete loading[k];return data})().catch(function(e){delete loading[k];throw e});return loading[k]}
function effective(row,ext){var e=ext[String(row.id)];if(e&&iso(e.extended_due_date))return{date:iso(e.extended_due_date),kind:'extension',contractual:iso(row.due_date),revised:iso(row.revised_due_date)};var r=iso(row.revised_due_date);if(r)return{date:r,kind:'revised',contractual:iso(row.due_date),revised:r};var d=iso(row.due_date);return{date:d,kind:'contractual',contractual:d,revised:''}}
function idsFromKey(k){var m=text(k).match(/\|schedules?:([0-9,]+)/);return m?m[1].split(',').map(String):[]}
function coverage(data){var exact={};(data.tasks||[]).forEach(function(t){if(t.status!=='pending'||t.auto_kind==='extension_active')return;var ids=t.schedule_id!=null?[String(t.schedule_id)]:idsFromKey(t.auto_key);ids.forEach(function(id){exact[id]=1})});return exact}
function sourceLine(x){if(x.e.kind==='extension'){var p=[];if(x.e.contractual)p.push('By '+date(x.e.contractual));if(x.e.revised&&x.e.revised!==x.e.contractual)p.push('Revised to '+date(x.e.revised));p.push('Extended to '+date(x.e.date));return p.join(' · ')}if(x.e.kind==='revised')return 'By '+date(x.e.contractual)+' · Revised to '+date(x.e.date);return 'By '+date(x.e.date)}
function build(data,c){
 var managed=carryManaged(c),rows=[];
 data.rows.forEach(function(r){
  var kind=stageKind(r);if(!kind||managed[String(r.id)])return;
  var credit=kind==='dld'?0:(data.credit[String(r.id)]||0);
  var remaining=Math.round(Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-credit)*100)/100;
  if(remaining<=1)return;var e=effective(r,data.ext);if(!e.date)return;
  rows.push({r:r,remaining:remaining,e:e,kind:kind});
 });
 rows.sort(function(a,b){return a.e.date.localeCompare(b.e.date)||Number(a.r.id)-Number(b.r.id)});
 if(!rows.length)return{status:'Up to date',tone:'good',message:'No installment payment action is currently required.',detail:'The active payment schedule, including DLD and Admin Fees, is fully settled.'};
 var dp=rows.filter(function(x){return x.kind==='dp'}),pre=rows.filter(function(x){return x.kind==='first'||x.kind==='dld'}),gate=dp.length?'dp':pre.length?'pre_spa':'later',current=gate==='dp'?dp:gate==='pre_spa'?pre:rows.filter(function(x){return x.kind==='later'}),cov=coverage(data);
 current=current.filter(function(x){return!cov[String(x.r.id)]});
 if(!current.length)return{hidden:true,reason:'scheduled'};
 var td=today(),over=current.filter(function(x){var d=day(x.e.date);return d&&d<td}),focus;
 if(over.length)focus=over;
 else{var firstDate=current[0].e.date;focus=current.filter(function(x){return x.e.date===firstDate})}
 var sum=Math.round(focus.reduce(function(s,x){return s+x.remaining},0)*100)/100,first=focus[0],labels=focus.map(function(x){return text(x.r.stage_name)}),stage=labels.join(' + '),d=day(first.e.date),delta=Math.round((d-td)/86400000),kind=first.e.kind,status=over.length?'Overdue':kind==='extension'?'Extension Active':kind==='revised'?'Revised Schedule':delta===0?'Due today':delta<=7?'Due soon':'Upcoming',tone=over.length||delta===0?'danger':(kind==='extension'||kind==='revised'||delta<=7?'warn':'neutral'),msg,detail;
 if(gate==='pre_spa'){
  if(over.length)msg='Collect '+money(sum)+' for '+stage+' now. '+(focus.length===1?'It was':'They were')+' due on '+date(first.e.date)+'.';
  else if(delta===0)msg='Collect '+money(sum)+' for '+stage+' today before SPA signing.';
  else msg='Collect '+money(sum)+' for '+stage+' by '+date(first.e.date)+' before SPA signing.';
  detail='Stage: '+stage+' · '+sourceLine(first)+(over.length?' · '+Math.max(1,Math.floor((td-d)/86400000))+' day'+(Math.max(1,Math.floor((td-d)/86400000))===1?'':'s')+' overdue.':' · Due in '+delta+' day'+(delta===1?'':'s')+'.')+' The 2nd Installment remains blocked until the 1st Installment and DLD + Admin Fees are fully settled.';
  return{status:status,tone:tone,message:msg,detail:detail};
 }
 if(over.length){var days=Math.max(1,Math.floor((td-d)/86400000));msg=focus.length===1?money(sum)+' for '+stage+' was due on '+date(first.e.date)+'. Follow up for payment now.':money(sum)+' total overdue for '+stage+'. Follow up for payment now.';detail=(focus.length>1?focus.length+' installments overdue · ':'')+sourceLine(first)+' · '+days+' day'+(days===1?'':'s')+' overdue.';return{status:status,tone:tone,message:msg,detail:detail}}
 if(delta===0)msg=money(sum)+' for '+stage+' is due today.';else msg='Next installment is '+money(sum)+' due on '+date(first.e.date)+'.';
 return{status:status,tone:tone,message:msg,detail:'Stage: '+stage+' · '+sourceLine(first)+(delta>0?' · Due in '+delta+' day'+(delta===1?'':'s')+'.':'.')}
}
function visibleMatches(card,a){var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail');return card.getAttribute('data-tone')===a.tone&&!!status&&text(status.textContent)===text(a.status)&&!!message&&text(message.textContent)===text(a.message)&&text(detail&&detail.textContent)===text(a.detail)}
function setTextIfChanged(node,value){if(node&&text(node.textContent)!==text(value))node.textContent=text(value)}
function apply(a,key){if(!window.state||state.view!=='detail'||text(state.selectedUnit)!==key)return;var card=document.getElementById('actionRequiredCard');if(!card)return;clearTimeout(guardTimer);card.dataset.effectiveReady='true';if(a.hidden){card.hidden=true;card.setAttribute('aria-hidden','true');card.dataset.scheduledCovered='true';return}card.hidden=false;card.removeAttribute('aria-hidden');delete card.dataset.scheduledCovered;var sig=[a.status,a.tone,a.message,a.detail].join('|');if(card.dataset.effectiveActionSig===sig||visibleMatches(card,a)){card.dataset.effectiveActionSig=sig;return}rendering=true;try{card.dataset.effectiveActionSig=sig;if(card.getAttribute('data-tone')!==a.tone)card.setAttribute('data-tone',a.tone);var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail');if(status&&message){setTextIfChanged(status,a.status);setTextIfChanged(message,a.message);if(a.detail){if(!detail){detail=document.createElement('p');detail.className='action-required-detail';card.appendChild(detail)}setTextIfChanged(detail,a.detail)}else if(detail){detail.remove()}}else{card.innerHTML='<div class="action-required-head"><span class="action-required-title">Action Required</span><span class="action-required-status">'+safe(a.status)+'</span></div><p class="action-required-message">'+safe(a.message)+'</p>'+(a.detail?'<p class="action-required-detail">'+safe(a.detail)+'</p>':'')}}finally{rendering=false}}
function prepare(){if(!window.state||state.view!=='detail')return false;var c=current();if(!c||!Number(c.sno))return false;var hit=fresh(Number(c.sno));if(hit){apply(build(hit.data,c),text(state.selectedUnit));return true}return false}
async function render(force){if(!window.state||!window.sb||state.view!=='detail')return;var c=current();if(!c||!Number(c.sno))return;var key=text(state.selectedUnit);try{var data=await load(Number(c.sno),!!force);if(text(state.selectedUnit)!==key||state.view!=='detail')return;apply(build(data,c),key)}catch(e){revealFallback(key);console.warn('Effective Action Required could not load',e)}}
function schedule(force,ms){clearTimeout(timer);if(ms===0){render(!!force);return}timer=setTimeout(function(){render(!!force)},ms==null?30:ms)}
function invalidateCurrent(){var c=current();if(c&&Number(c.sno)){delete cache[String(Number(c.sno))];persist()}}
function install(){if(!window.state||!window.sb||typeof window.renderDetail!=='function'){setTimeout(install,60);return}hydrate();preloadAll(false);setTimeout(function(){preloadAll(false)},350);var rd=window.renderDetail;window.renderDetail=function(){var x=rd.apply(this,arguments);markPending();var key=text(state.selectedUnit);armGuard(key);if(!prepare())schedule(false,0);return x};if(typeof window.loadFromSupabase==='function'){var ld=window.loadFromSupabase;window.loadFromSupabase=async function(){var x=await ld.apply(this,arguments);preloadAll(true);return x}}document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#extSave,#ieSave,#scSave,#extCancel,#saSave,#saComplete,#saCancelTask')){invalidateCurrent();markPending();armGuard(text(state.selectedUnit));schedule(true,220)}},true);observer=new MutationObserver(function(m){if(rendering||!window.state||state.view!=='detail')return;for(var i=0;i<m.length;i++){var t=m[i].target;if(t&&(t.id==='actionRequiredCard'||(t.closest&&t.closest('#actionRequiredCard')))){schedule(false,0);break}}});observer.observe(document.body,{subtree:true,childList:true,characterData:true});window.addEventListener('pageshow',function(){markPending();armGuard(text(state.selectedUnit));preloadAll(false);schedule(false,40)});if(state.view==='detail'){markPending();armGuard(text(state.selectedUnit));if(!prepare())schedule(false,0)}}
ensureGuardStyle();
install();
})();
