(function(){
'use strict';
if(window.__sunblissExtensionOperationalSummaryInstalled)return;
window.__sunblissExtensionOperationalSummaryInstalled=true;

var timers=[],observer=null,observedDetail=null,applying=false,expanded={};
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}
function iso(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function today(){var d=new Date();d.setHours(0,0,0,0);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function day(v){var s=iso(v),d=s?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function daysUntil(v){var a=day(v),b=day(today());return a&&b?Math.round((a-b)/86400000):null}
function formatDate(v){var P=window.PaymentExtensionsCore;if(P&&typeof P.formatDate==='function')return P.formatDate(v);var d=day(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):text(v)}
function money(v){var P=window.PaymentExtensionsCore;if(P&&typeof P.money==='function')return P.money(v);var n=Math.max(0,Number(v)||0);return typeof window.fmtAED==='function'?window.fmtAED(n):'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2})}
function currentCustomer(){if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function stageKind(r){var n=text(r&&r.stage_name).trim().toLowerCase().replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return''}
function ensureStyles(){
  if(document.getElementById('extensionOperationalSummaryStyles'))return;
  var s=document.createElement('style');s.id='extensionOperationalSummaryStyles';s.textContent=[
    '.scheduled-actions-detail.extension-only-detail .scheduled-actions-heading{display:none!important}',
    '.scheduled-actions-detail.extension-only-detail{margin-top:10px!important}',
    '.extension-reference-card.extension-collapsible-card{padding:0!important;overflow:hidden!important}',
    '.extension-collapse-toggle{width:100%;min-height:54px;border:0;background:transparent;color:var(--ink);display:grid;grid-template-columns:minmax(0,1fr) auto 18px;gap:10px;align-items:center;padding:11px 13px;text-align:left;font-family:Inter,sans-serif;cursor:pointer}',
    '.extension-collapse-toggle:hover,.extension-collapse-toggle:active{background:rgba(156,90,18,.045)}',
    '.extension-collapse-toggle:focus-visible{outline:2px solid var(--gold-deep);outline-offset:-2px}',
    '.extension-collapse-title{font:700 12.5px/1.25 Inter,sans-serif;color:var(--ink)}',
    '.extension-collapse-sub{margin-top:3px;font:500 9.5px/1.25 Inter,sans-serif;color:var(--muted)}',
    '.extension-collapse-meta{font:650 9.5px/1.2 IBM Plex Mono,monospace;color:var(--amber,#9C5A12);white-space:nowrap;text-align:right}',
    '.extension-collapse-chevron{font:500 20px/1 Inter,sans-serif;color:var(--muted);transform:rotate(0deg);transition:transform .18s ease;display:flex;align-items:center;justify-content:center}',
    '.extension-collapse-toggle[aria-expanded="true"] .extension-collapse-chevron{transform:rotate(90deg)}',
    '.extension-collapse-body{border-top:1px solid var(--paper-line)}',
    '.extension-collapse-body[hidden]{display:none!important}',
    '@media(max-width:520px){.extension-collapse-toggle{min-height:50px;padding:10px 11px;grid-template-columns:minmax(0,1fr) auto 16px;gap:7px}.extension-collapse-title{font-size:11.5px}.extension-collapse-sub{font-size:8.8px}.extension-collapse-meta{font-size:8.7px}.extension-collapse-chevron{font-size:18px}}',
    '@media(prefers-reduced-motion:reduce){.extension-collapse-chevron{transition:none}}'
  ].join('');document.head.appendChild(s)
}
function extensionContext(){
  var P=window.PaymentExtensionsCore,C=P&&P.cache,c=currentCustomer();if(!P||!C||!c)return null;
  var unit=Number(c.sno),sm=typeof P.scheduleMap==='function'?P.scheduleMap():{},cm=typeof P.creditMap==='function'?P.creditMap():{},groups={},activeIds={},td=today();
  (C.e||[]).forEach(function(e){
    if(!e||e.status!=='active'||Number(e.unit_id)!==unit||!iso(e.extended_due_date)||iso(e.extended_due_date)<td)return;
    var r=sm[e.payment_schedule_id];if(!r)return;var n=typeof P.remaining==='function'?P.remaining(r,cm):0;if(n<=1)return;
    activeIds[String(r.id)]=1;var due=iso(e.extended_due_date),g=groups[due]||(groups[due]={unit:unit,due:due,items:[],total:0});g.items.push({e:e,r:r,remaining:n});g.total=Math.round((g.total+n)*100)/100;
  });
  var list=Object.keys(groups).map(function(k){return groups[k]}).sort(function(a,b){return a.due.localeCompare(b.due)});if(!list.length)return null;
  var selected=list.find(function(g){return g.items.length>1})||list[0];
  var outsideOverdue=(C.s||[]).some(function(r){if(!r||Number(r.unit_id)!==unit||!stageKind(r)||activeIds[String(r.id)])return false;var n=typeof P.remaining==='function'?P.remaining(r,cm):0;if(n<=1)return false;var d=iso(r.revised_due_date)||iso(r.due_date);return !!d&&d<td});
  return{customer:c,unit:unit,groups:list,selected:selected,outsideOverdue:outsideOverdue,activeIds:activeIds}
}
function setText(node,value){if(node&&text(node.textContent)!==text(value))node.textContent=value}
function applyActionSummary(ctx){
  if(!ctx||ctx.outsideOverdue||!ctx.selected||ctx.selected.items.length<2)return;
  var card=document.getElementById('actionRequiredCard');if(!card||card.hidden||card.getAttribute('aria-hidden')==='true')return;
  var g=ctx.selected,d=daysUntil(g.due),count=g.items.length,stage=count+' outstanding component'+(count===1?'':'s'),dueText=formatDate(g.due),message=money(g.total)+' under extension — due '+dueText+'.',detail='Stage: '+stage+' · Extended to '+dueText+(d==null?'':d===0?' · Due today.':d>0?' · Due in '+d+' day'+(d===1?'':'s')+'.':' · '+Math.abs(d)+' day'+(Math.abs(d)===1?'':'s')+' overdue.'),sig=[ctx.unit,g.due,g.total,count,d].join('|');
  if(card.dataset.extensionOperationalSig===sig&&text((card.querySelector('.action-required-message')||{}).textContent)===message)return;
  applying=true;
  try{
    card.dataset.extensionOperationalSig=sig;card.setAttribute('data-tone','extension');
    var status=card.querySelector('.action-required-status'),msg=card.querySelector('.action-required-message'),det=card.querySelector('.action-required-detail');
    if(!status||!msg){card.innerHTML='<div class="action-required-head"><span class="action-required-title">Action Required</span><span class="action-required-status">Extension Active</span></div><p class="action-required-message">'+safe(message)+'</p><p class="action-required-detail">'+safe(detail)+'</p>';}
    else{setText(status,'Extension Active');setText(msg,message);if(!det){det=document.createElement('p');det.className='action-required-detail';card.appendChild(det)}setText(det,detail)}
  }finally{applying=false}
}
function taskGroup(task,ctx){if(!task||!ctx)return null;var due=iso(task.due_date);return ctx.groups.find(function(g){return g.due===due})||ctx.selected}
function compactExtensionCards(ctx){
  var P=window.PaymentExtensionsCore,C=P&&P.cache,host=document.getElementById('scheduledActionsDetail');if(!P||!C||!host)return;
  var extTasks={};(C.t||[]).forEach(function(t){if(t&&t.status==='pending'&&t.auto_kind==='extension_active'&&Number(t.unit_id)===Number(ctx&&ctx.unit))extTasks[String(t.id)]=t});
  var cards=Array.prototype.slice.call(host.querySelectorAll('.scheduled-task-card[data-task-id]')),extCards=[],nonExt=[];
  cards.forEach(function(card){var id=String(card.getAttribute('data-task-id')),task=extTasks[id];if(task)extCards.push({card:card,task:task});else nonExt.push(card)});
  var heading=host.querySelector('.scheduled-actions-heading');if(extCards.length&&nonExt.length===0){host.classList.add('extension-only-detail');if(heading)heading.style.display='none'}else{host.classList.remove('extension-only-detail');if(heading){heading.style.display='';var cnt=heading.querySelector('.scheduled-actions-count'),label=heading.querySelector('.section-label');if(cnt)cnt.textContent=nonExt.length+' pending';if(label)label.textContent='Scheduled Action'+(nonExt.length===1?'':'s')}}
  extCards.forEach(function(x){
    var card=x.card,task=x.task;if(card.dataset.extensionCompactReady==='1')return;
    if(!card.classList.contains('extension-reference-card')||!card.querySelector('.extref-top'))return;
    var g=taskGroup(task,ctx),amount=g?money(g.total):'',due=g?formatDate(g.due):formatDate(task.due_date),count=g?g.items.length:0,body=card.innerHTML,id=String(task.id),open=!!expanded[id];
    card.dataset.extensionCompactReady='1';card.classList.add('extension-collapsible-card');
    card.innerHTML='<button type="button" class="extension-collapse-toggle" aria-expanded="'+(open?'true':'false')+'"><span><span class="extension-collapse-title">Extension details</span><span class="extension-collapse-sub">'+safe(count?(count+' outstanding component'+(count===1?'':'s')):'Approved payment extension')+'</span></span><span class="extension-collapse-meta">'+safe(amount)+(amount&&due?' · ':'')+safe(due)+'</span><span class="extension-collapse-chevron" aria-hidden="true">›</span></button><div class="extension-collapse-body"'+(open?'':' hidden')+'>'+body+'</div>';
    var toggle=card.querySelector('.extension-collapse-toggle'),detail=card.querySelector('.extension-collapse-body');toggle.onclick=function(){var next=toggle.getAttribute('aria-expanded')!=='true';expanded[id]=next;toggle.setAttribute('aria-expanded',next?'true':'false');if(detail)detail.hidden=!next};
  })
}
function observe(){
  var detail=document.querySelector('.detail');if(detail===observedDetail)return;if(observer)observer.disconnect();observedDetail=detail;if(!detail||!window.MutationObserver)return;
  observer=new MutationObserver(function(){if(!applying)queue(30)});observer.observe(detail,{childList:true,subtree:true,characterData:true})
}
function apply(){
  if(applying||!window.state||state.view!=='detail'||!window.PaymentExtensionsCore)return;ensureStyles();observe();var ctx=extensionContext();if(!ctx)return;applyActionSummary(ctx);compactExtensionCards(ctx)
}
function queue(ms){timers.forEach(clearTimeout);timers=[];timers.push(setTimeout(apply,ms==null?20:ms));timers.push(setTimeout(apply,120));timers.push(setTimeout(apply,420))}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'||!window.PaymentExtensionsCore){setTimeout(install,70);return}
  ensureStyles();var rd=window.renderDetail;if(!rd.__extensionOperationalSummaryWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);queue(0);return out};window.renderDetail.__extensionOperationalSummaryWrapped=true}
  var P=window.PaymentExtensionsCore;if(typeof P.render==='function'&&!P.render.__extensionOperationalSummaryWrapped){var pr=P.render;P.render=function(){var out=pr.apply(this,arguments);queue(0);return out};P.render.__extensionOperationalSummaryWrapped=true}
  if(typeof P.load==='function')P.load(false).then(function(){queue(0)}).catch(function(){});else queue(0);
  window.addEventListener('pageshow',function(){queue(40)})
}
install();
})();
