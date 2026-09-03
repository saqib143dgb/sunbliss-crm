(function(){
'use strict';
if(window.__sunblissScheduledExtensionReferenceCard)return;
window.__sunblissScheduledExtensionReferenceCard=true;

var timers=[];
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function unique(values){var seen={},out=[];values.forEach(function(v){v=text(v).trim();if(v&&!seen[v]){seen[v]=1;out.push(v)}});return out}
function icon(kind){
  var common='width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(kind==='clipboard')return '<svg '+common+'><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3.3A1.3 1.3 0 0 1 10.3 2h3.4A1.3 1.3 0 0 1 15 3.3v1.2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>';
  if(kind==='note')return '<svg '+common+'><path d="M5 3h11a2 2 0 0 1 2 2v8"/><path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/><path d="M8 8h7M8 12h5"/><path d="m14 19 4.8-4.8a1.4 1.4 0 0 1 2 2L16 21h-2z"/></svg>';
  return '<svg '+common+'><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';
}
function flagIcon(){return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22V4"/><path d="M5 5c5-4 9 4 14 0v10c-5 4-9-4-14 0"/></svg>'}
function ensureStyles(){
  if(document.getElementById('scheduledExtensionReferenceCardStyles'))return;
  var s=document.createElement('style');s.id='scheduledExtensionReferenceCardStyles';s.textContent=[
    '.scheduled-actions-detail .scheduled-extension.extension-reference-card{padding:0!important;border:1px solid var(--paper-line)!important;border-left:4px solid var(--amber,#9C5A12)!important;border-radius:12px!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(156,90,18,.015)),var(--paper)!important;overflow:hidden!important;box-shadow:0 1px 0 rgba(15,26,38,.02)!important}',
    '.extension-reference-card .extref-top{display:grid;grid-template-columns:minmax(0,1fr) 132px;gap:10px;padding:9px 11px 8px;align-items:center}',
    '.extension-reference-card .extref-title{font:750 13px/1.05 Inter,sans-serif;color:var(--ink);letter-spacing:-.01em}',
    '.extension-reference-card .extref-amount{margin-top:4px;font:750 20px/1 Fraunces,serif;color:var(--ink);letter-spacing:-.012em;white-space:nowrap}',
    '.extension-reference-card .extref-amount-label{margin-top:3px;font:500 8px/1.15 Inter,sans-serif;color:var(--muted)}',
    '.extension-reference-card .extref-due{min-height:52px;border-left:1px solid var(--paper-line);padding-left:9px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}',
    '.extension-reference-card .extref-due-main{display:flex;align-items:center;gap:5px;font:700 9px/1.1 Inter,sans-serif;color:var(--ink);white-space:nowrap}',
    '.extension-reference-card .extref-due-main svg{width:12px;height:12px}',
    '.extension-reference-card .extref-due-label{margin:2px 0 4px 17px;font:500 6.8px/1.1 Inter,sans-serif;color:var(--muted);white-space:nowrap}',
    '.extension-reference-card .extref-priority{display:inline-flex;align-items:center;gap:4px;margin-left:0;padding:3px 5px;border:1px solid rgba(156,90,18,.15);border-radius:6px;background:rgba(156,90,18,.045);font:700 7px/1.1 Inter,sans-serif;color:var(--amber,#9C5A12);white-space:nowrap}',
    '.extension-reference-card .extref-divider{height:1px;background:var(--paper-line);margin:0 11px}',
    '.extension-reference-card .extref-row{display:grid;grid-template-columns:23px 94px minmax(0,1fr);gap:6px;align-items:center;min-height:35px;margin:0 11px;border-bottom:1px solid var(--paper-line)}',
    '.extension-reference-card .extref-row:last-child{border-bottom:0}',
    '.extension-reference-card .extref-icon{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--amber,#9C5A12);background:rgba(156,90,18,.055)}',
    '.extension-reference-card .extref-icon svg{width:11px;height:11px}',
    '.extension-reference-card .extref-row.extref-until .extref-icon{color:var(--sage,#3F7A57);background:rgba(63,122,87,.065)}',
    '.extension-reference-card .extref-label{font:700 8px/1.15 Inter,sans-serif;color:var(--ink)}',
    '.extension-reference-card .extref-value{font:500 10.8px/1.18 Inter,sans-serif;color:var(--ink);overflow-wrap:anywhere}',
    '.extension-reference-card .extref-until .extref-value{font-weight:750;color:var(--sage,#3F7A57)}',
    '@media(max-width:520px){.extension-reference-card .extref-top{grid-template-columns:minmax(0,1fr) 122px;gap:7px;padding:8px 9px 7px}.extension-reference-card .extref-title{font-size:11px}.extension-reference-card .extref-amount{font-size:17px;margin-top:3px}.extension-reference-card .extref-amount-label{font-size:7.2px;margin-top:2px}.extension-reference-card .extref-due{min-height:46px;padding-left:7px}.extension-reference-card .extref-due-main{font-size:8.2px;gap:4px}.extension-reference-card .extref-due-main svg{width:11px;height:11px}.extension-reference-card .extref-due-label{font-size:6.3px;margin:2px 0 3px 15px}.extension-reference-card .extref-priority{font-size:6.6px;margin-left:0;padding:3px 4px;gap:3px}.extension-reference-card .extref-priority svg{width:9px;height:9px}.extension-reference-card .extref-divider{margin:0 9px}.extension-reference-card .extref-row{grid-template-columns:20px 88px minmax(0,1fr);gap:5px;min-height:32px;margin:0 9px}.extension-reference-card .extref-icon{width:18px;height:18px}.extension-reference-card .extref-icon svg{width:10px;height:10px}.extension-reference-card .extref-label{font-size:7.5px}.extension-reference-card .extref-value{font-size:10.2px;line-height:1.15}}',
    '@media(max-width:370px){.extension-reference-card .extref-top{grid-template-columns:minmax(0,1fr) 108px}.extension-reference-card .extref-title{font-size:10px}.extension-reference-card .extref-amount{font-size:15px}.extension-reference-card .extref-row{grid-template-columns:19px 78px minmax(0,1fr);gap:4px}.extension-reference-card .extref-label{font-size:7.1px}.extension-reference-card .extref-value{font-size:9.4px}}'
  ].join('');document.head.appendChild(s)
}
function taskData(task){
  var C=window.PaymentExtensionsCore,cache=C&&C.cache;if(!C||!cache)return null;
  var sm=C.scheduleMap(),cm=C.creditMap(),due=text(task.due_date).slice(0,10),unit=Number(task.unit_id);
  var ext=(cache.e||[]).filter(function(e){return e.status==='active'&&Number(e.unit_id)===unit&&text(e.extended_due_date).slice(0,10)===due});
  if(!ext.length){var m=text(task.auto_key).match(/\|schedules:([0-9,]+)/);if(m){m[1].split(',').map(Number).forEach(function(id){var r=sm[id];if(r)ext.push({payment_schedule_id:id,original_due_date:r.due_date,extended_due_date:due,status:'active'})})}}
  var items=ext.map(function(e){var r=sm[e.payment_schedule_id];return r?{e:e,r:r,n:C.remaining(r,cm)}:null}).filter(Boolean).filter(function(x){return x.n>1});
  if(!items.length)return null;
  items.sort(function(a,b){var d=text(a.e.original_due_date||a.r.due_date).localeCompare(text(b.e.original_due_date||b.r.due_date));if(d)return d;return Number(a.r.id)-Number(b.r.id)});
  var total=Math.round(items.reduce(function(sum,x){return sum+x.n},0)*100)/100;
  var names=unique(items.map(function(x){return x.r.stage_name}));
  var dates=unique(items.map(function(x){return C.formatDate(x.e.original_due_date||x.r.due_date)}));
  return{amount:C.money(total),installments:names.join(' • '),originalDates:dates.join(' • '),due:C.formatDate(due),priority:text(task.priority||'Medium'),note:'Extension granted until '+C.formatDate(due)+' for the outstanding amount.'}
}
function cardHtml(task,data){
  var priority=data.priority.charAt(0).toUpperCase()+data.priority.slice(1).toLowerCase()+' Priority';
  return '<div class="extref-top"><div><div class="extref-title">Extension Active</div><div class="extref-amount">'+safe(data.amount)+'</div><div class="extref-amount-label">Outstanding Amount</div></div><div class="extref-due"><div class="extref-due-main">'+icon('calendar')+'<span>'+safe(data.due)+'</span></div><div class="extref-due-label">Extended Due Date</div><div class="extref-priority">'+flagIcon()+'<span>'+safe(priority)+'</span></div></div></div><div class="extref-divider"></div><div class="extref-row"><div class="extref-icon">'+icon('clipboard')+'</div><div class="extref-label">Outstanding Installments</div><div class="extref-value">'+safe(data.installments)+'</div></div><div class="extref-row"><div class="extref-icon">'+icon('calendar')+'</div><div class="extref-label">Original Due Dates</div><div class="extref-value">'+safe(data.originalDates)+'</div></div><div class="extref-row extref-until"><div class="extref-icon">'+icon('calendar')+'</div><div class="extref-label">Extension Until</div><div class="extref-value">'+safe(data.due)+'</div></div><div class="extref-row"><div class="extref-icon">'+icon('note')+'</div><div class="extref-label">Extension Note</div><div class="extref-value">'+safe(data.note)+'</div></div>'
}
function apply(){
  ensureStyles();
  if(!window.state||state.view!=='detail'||!window.PaymentExtensionsCore)return;
  var cache=PaymentExtensionsCore.cache||{},taskMap={};(cache.t||[]).forEach(function(t){if(t&&t.auto_kind==='extension_active')taskMap[String(t.id)]=t});
  var host=document.getElementById('scheduledActionsDetail');if(!host)return;
  host.querySelectorAll('[data-task-id]').forEach(function(card){var task=taskMap[String(card.getAttribute('data-task-id'))];if(!task)return;var data=taskData(task);if(!data)return;var sig=[task.id,data.amount,data.installments,data.originalDates,data.due,data.priority].join('|');if(card.dataset.extrefSig===sig)return;card.dataset.extrefSig=sig;card.classList.add('scheduled-extension','extension-reference-card');card.innerHTML=cardHtml(task,data)})
}
function queue(){timers.forEach(clearTimeout);timers=[];Promise.resolve().then(apply);timers.push(setTimeout(apply,70));timers.push(setTimeout(apply,260));timers.push(setTimeout(apply,650))}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'||!window.PaymentExtensionsCore){setTimeout(install,80);return}
  ensureStyles();
  var rd=window.renderDetail;if(!rd.__sunblissExtensionReferenceWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);queue();return out};window.renderDetail.__sunblissExtensionReferenceWrapped=true;window.renderDetail.__sunblissOriginal=rd}
  if(typeof PaymentExtensionsCore.render==='function'&&!PaymentExtensionsCore.render.__sunblissExtensionReferenceWrapped){var pr=PaymentExtensionsCore.render;PaymentExtensionsCore.render=function(){var out=pr.apply(this,arguments);queue();return out};PaymentExtensionsCore.render.__sunblissExtensionReferenceWrapped=true}
  if(typeof PaymentExtensionsCore.load==='function')PaymentExtensionsCore.load(false).then(queue).catch(function(){});else queue();
  window.addEventListener('pageshow',queue)
}
install();
})();