(function(){
'use strict';
if(window.__sunblissScheduledExtensionReferenceCard)return;
window.__sunblissScheduledExtensionReferenceCard=true;

var timers=[];
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]})}
function todayIso(){var d=new Date();d.setHours(0,0,0,0);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function day(v){var s=text(v).slice(0,10),d=/^\d{4}-\d{2}-\d{2}$/.test(s)?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function currentCustomer(){if(!window.state||state.view!=='detail'||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function stageKind(r){var n=text(r&&r.stage_name).trim().toLowerCase().replace(/instalment/g,'installment');if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return''}
function unique(values){var seen={},out=[];values.forEach(function(v){v=text(v).trim();if(v&&!seen[v]){seen[v]=1;out.push(v)}});return out}
function ensureStyles(){
  if(document.getElementById('scheduledExtensionConsolidatedStyles'))return;
  var s=document.createElement('style');s.id='scheduledExtensionConsolidatedStyles';s.textContent=[
    '#actionRequiredCard[data-extension-consolidated="true"]{display:none!important}',
    '#extensionConsolidatedActionCard{margin-bottom:16px!important}',
    '#extensionConsolidatedActionCard .action-required-status-wrap{color:var(--amber,#9C5A12)!important}',
    '#extensionConsolidatedActionCard .action-required-meta-icon{color:var(--amber,#9C5A12)!important;background:rgba(156,90,18,.06)!important}'
  ].join('');document.head.appendChild(s)
}
function extensionData(){
  var C=window.PaymentExtensionsCore,cache=C&&C.cache,c=currentCustomer();if(!C||!cache||!c)return null;
  var sm=C.scheduleMap(),cm=C.creditMap(),now=todayIso(),groups={};
  (cache.e||[]).forEach(function(e){
    if(!e||e.status!=='active'||Number(e.unit_id)!==Number(c.sno))return;
    var due=text(e.extended_due_date).slice(0,10);if(!due||due<now)return;
    var r=sm[e.payment_schedule_id];if(!r)return;
    var n=C.remaining(r,cm);if(n<=1)return;
    (groups[due]||(groups[due]=[])).push({e:e,r:r,n:n});
  });
  var dates=Object.keys(groups).sort();if(!dates.length)return null;
  var due=dates[0],items=groups[due];
  items.sort(function(a,b){var da=text(a.e.original_due_date||a.r.due_date),db=text(b.e.original_due_date||b.r.due_date);return da.localeCompare(db)||Number(a.r.id)-Number(b.r.id)});
  var total=Math.round(items.reduce(function(sum,x){return sum+x.n},0)*100)/100;
  var names=unique(items.map(function(x){return x.r.stage_name}));
  var installmentCount=items.filter(function(x){return stageKind(x.r)!=='dld'}).length;
  var hasFees=items.some(function(x){return stageKind(x.r)==='dld'});
  var scope=[];if(installmentCount)scope.push(installmentCount+' installment'+(installmentCount===1?'':'s'));if(hasFees)scope.push('DLD/Admin Fees');
  var dueDay=day(due),nowDay=day(now),delta=dueDay&&nowDay?Math.max(0,Math.round((dueDay-nowDay)/86400000)):null;
  return{
    amount:C.money(total),
    due:C.formatDate(due),
    dueIso:due,
    stage:names.join(' + '),
    scope:scope.join(' + '),
    dueIn:delta===0?'Today':delta===1?'1 day':delta!=null?delta+' days':'—'
  }
}
function setText(node,value){if(node&&text(node.textContent)!==text(value))node.textContent=text(value)}
function removeDuplicateExtensionTasks(){
  var C=window.PaymentExtensionsCore,cache=C&&C.cache,host=document.getElementById('scheduledActionsDetail');if(!cache||!host)return;
  var extensionIds={};(cache.t||[]).forEach(function(t){if(t&&t.auto_kind==='extension_active')extensionIds[String(t.id)]=1});
  host.querySelectorAll('[data-task-id]').forEach(function(card){if(extensionIds[String(card.getAttribute('data-task-id'))])card.remove()});
  var cards=host.querySelectorAll('.scheduled-task-card');
  if(!cards.length){host.remove();return}
  var count=host.querySelector('.scheduled-actions-count'),label=host.querySelector('.scheduled-actions-heading .section-label');
  setText(count,cards.length+' pending');setText(label,'Scheduled Action'+(cards.length===1?'':'s'));
}
function restoreBase(){
  var base=document.getElementById('actionRequiredCard');if(base)base.removeAttribute('data-extension-consolidated');
  var card=document.getElementById('extensionConsolidatedActionCard');if(card)card.remove();
}
function renderConsolidated(data){
  var base=document.getElementById('actionRequiredCard');if(!base||!data)return;
  var card=document.getElementById('extensionConsolidatedActionCard');
  if(!card){card=base.cloneNode(true);card.id='extensionConsolidatedActionCard';card.removeAttribute('hidden');card.removeAttribute('aria-hidden');card.style.removeProperty('display')}
  base.setAttribute('data-extension-consolidated','true');
  if(card.parentNode!==base.parentNode||base.nextElementSibling!==card)base.insertAdjacentElement('afterend',card);
  card.hidden=false;card.removeAttribute('aria-hidden');card.setAttribute('data-tone','warn');
  var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail'),values=card.querySelectorAll('.action-required-meta-value');
  setText(status,'Extension Active');
  setText(message,'Collect '+data.amount+' total for '+(data.scope||'the covered obligations')+' by '+data.due+' under the active extension.');
  setText(detail,'Stage: '+data.stage+' · Extended to '+data.due+(data.dueIn==='Today'?' · Due today.':' · Due in '+data.dueIn+'.'));
  if(values.length>=3){setText(values[0],data.stage);setText(values[1],data.due);setText(values[2],data.dueIn)}
}
function apply(){
  ensureStyles();
  if(!window.state||state.view!=='detail'||!window.PaymentExtensionsCore){restoreBase();return}
  removeDuplicateExtensionTasks();
  var data=extensionData();if(data)renderConsolidated(data);else restoreBase();
}
function queue(){timers.forEach(clearTimeout);timers=[];Promise.resolve().then(apply);timers.push(setTimeout(apply,60));timers.push(setTimeout(apply,180));timers.push(setTimeout(apply,450))}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'||!window.PaymentExtensionsCore){setTimeout(install,80);return}
  ensureStyles();
  var rd=window.renderDetail;if(!rd.__sunblissExtensionConsolidatedWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);queue();return out};window.renderDetail.__sunblissExtensionConsolidatedWrapped=true;window.renderDetail.__sunblissOriginal=rd}
  if(typeof PaymentExtensionsCore.render==='function'&&!PaymentExtensionsCore.render.__sunblissExtensionConsolidatedWrapped){var pr=PaymentExtensionsCore.render;PaymentExtensionsCore.render=function(){var out=pr.apply(this,arguments);queue();return out};PaymentExtensionsCore.render.__sunblissExtensionConsolidatedWrapped=true}
  if(typeof PaymentExtensionsCore.load==='function')PaymentExtensionsCore.load(false).then(queue).catch(function(){});else queue();
  window.addEventListener('pageshow',queue);
  document.addEventListener('click',function(){setTimeout(queue,0)},true);
}
install();
})();