(function(){
'use strict';
if(window.__sunblissActionRequiredReferenceRefinement)return;
window.__sunblissActionRequiredReferenceRefinement=true;
var observer=null,observedCard=null,syncing=false,queued=false;
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]})}
function icon(kind){
  var common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(kind==='layers')return '<svg '+common+'><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>';
  if(kind==='hourglass')return '<svg '+common+'><path d="M6 2h12M6 22h12M8 2v5c0 2 1.5 3.5 4 5-2.5 1.5-4 3-4 5v5M16 2v5c0 2-1.5 3.5-4 5 2.5 1.5 4 3 4 5v5"/></svg>';
  return '<svg '+common+'><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';
}
function ensureStyle(){
  if(document.getElementById('actionRequiredReferenceRefinementStyles'))return;
  var s=document.createElement('style');s.id='actionRequiredReferenceRefinementStyles';s.textContent=[
    '.action-required-card .action-required-message{font-size:14.4px!important;line-height:1.24!important}',
    '.action-required-card .action-required-status-wrap{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1.4px solid currentColor!important;border-radius:999px!important;padding:6px 11px!important;background:transparent!important;white-space:nowrap!important;line-height:1!important}',
    '.action-required-card .action-required-status-wrap .action-required-status{display:inline-block!important;border:0!important;border-radius:0!important;padding:0!important;background:transparent!important;color:inherit!important;font:700 10.5px/1 Inter,sans-serif!important}',
    '.action-required-card .action-required-status-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:14px!important;height:14px!important;flex:none!important}',
    '.action-required-card .action-required-status-icon svg{width:14px!important;height:14px!important;display:block!important}',
    '.action-required-card .action-required-divider{display:block!important}',
    '.action-required-card .action-required-meta{display:grid!important}',
    '@media(max-width:520px){.action-required-card .action-required-message{font-size:12px!important;line-height:1.24!important}.action-required-card .action-required-status-wrap{gap:5px!important;padding:5px 9px!important}.action-required-card .action-required-status-wrap .action-required-status{font-size:9px!important}.action-required-card .action-required-status-icon,.action-required-card .action-required-status-icon svg{width:12px!important;height:12px!important}}',
    '@media(max-width:380px){.action-required-card .action-required-message{font-size:10.8px!important}.action-required-card .action-required-status-wrap{padding:4px 8px!important}.action-required-card .action-required-status-wrap .action-required-status{font-size:8.5px!important}}'
  ].join('');document.head.appendChild(s);
}
function parseMeta(status,message,detail){
  status=text(status).trim();message=text(message).trim();detail=text(detail).trim();
  var stage='',by='',due='',m;
  m=detail.match(/Stage:\s*([^·.]+)/i);if(m)stage=m[1].trim();
  if(!stage){m=message.match(/\bfor\s+(.+?)\s+(?:was due|is due)\b/i);if(m)stage=m[1].trim()}
  if(!stage){m=message.match(/total overdue for\s+(.+?)\.\s*Follow/i);if(m)stage=m[1].trim()}
  if(!stage&&/installments overdue/i.test(detail))stage='Multiple installments';
  if(!stage&&/up to date/i.test(status))stage='No pending stage';
  if(!stage)stage='Next installment';
  m=message.match(/\bdue on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1];
  if(!by){m=message.match(/\bwas due on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1]}
  if(!by){var all=[],re=/(?:Extended to|Revised to|By)\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/gi,x;while((x=re.exec(detail)))all.push(x[1]);if(all.length)by=all[all.length-1]}
  if(!by&&/due today/i.test(status))by='Today';
  if(!by&&/date needed/i.test(status))by='Not set';
  if(!by)by='—';
  m=detail.match(/Due in\s+([0-9]+\s+day(?:s)?)/i);if(m)due=m[1];
  if(!due){m=detail.match(/([0-9]+\s+day(?:s)?\s+overdue)/i);if(m)due=m[1]}
  if(!due&&/due today/i.test(status))due='Today';
  if(!due&&/overdue/i.test(status))due='Overdue';
  if(!due)due='—';
  return{stage:stage,by:by,due:due};
}
function ensurePill(card,status){
  var wrap=status.closest('.action-required-status-wrap');
  if(!wrap){
    wrap=document.createElement('span');wrap.className='action-required-status-wrap';
    status.parentNode.insertBefore(wrap,status);wrap.appendChild(status);
  }
  var iconNode=wrap.querySelector('.action-required-status-icon');
  if(!iconNode){iconNode=document.createElement('span');iconNode.className='action-required-status-icon';iconNode.innerHTML=icon('calendar');wrap.insertBefore(iconNode,wrap.firstChild)}
}
function ensureMeta(card,meta){
  var divider=card.querySelector('.action-required-divider');
  if(!divider){divider=document.createElement('div');divider.className='action-required-divider';card.appendChild(divider)}
  var row=card.querySelector('.action-required-meta');
  if(!row){
    row=document.createElement('div');row.className='action-required-meta';
    row.innerHTML='<div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('layers')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">Stage</div><div class="action-required-meta-value"></div></span></div><div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('calendar')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">By</div><div class="action-required-meta-value"></div></span></div><div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('hourglass')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">Due In</div><div class="action-required-meta-value"></div></span></div>';
    divider.insertAdjacentElement('afterend',row);
  }
  var values=row.querySelectorAll('.action-required-meta-value');
  if(values.length>=3){if(text(values[0].textContent)!==meta.stage)values[0].textContent=meta.stage;if(text(values[1].textContent)!==meta.by)values[1].textContent=meta.by;if(text(values[2].textContent)!==meta.due)values[2].textContent=meta.due}
}
function enforce(){
  queued=false;if(syncing||!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail');
  if(!status||!message)return;
  syncing=true;
  try{ensureStyle();ensurePill(card,status);ensureMeta(card,parseMeta(status.textContent,message.textContent,detail&&detail.textContent));card.classList.add('action-reference-card-v2')}finally{syncing=false}
}
function queue(){if(queued)return;queued=true;Promise.resolve().then(enforce)}
function attach(){
  if(!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');
  if(!card)return;
  if(observedCard!==card){if(observer)observer.disconnect();observedCard=card;observer=new MutationObserver(function(){if(!syncing)queue()});observer.observe(card,{childList:true,characterData:true,subtree:true})}
  enforce();
}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,60);return}
  ensureStyle();
  var rd=window.renderDetail;if(!rd.__sunblissActionReferenceRefinementWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);attach();setTimeout(attach,80);setTimeout(attach,260);return out};window.renderDetail.__sunblissActionReferenceRefinementWrapped=true}
  if(state.view==='detail'){attach();setTimeout(attach,80);setTimeout(attach,260)}
  window.addEventListener('pageshow',attach);
}
install();
})();