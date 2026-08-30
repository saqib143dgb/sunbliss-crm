(function(){
'use strict';
if(window.__sunblissActionRequiredReferenceRefinement)return;
window.__sunblissActionRequiredReferenceRefinement=true;
function calendarIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>'}
function ensureStyle(){
  if(document.getElementById('actionRequiredReferenceRefinementStyles'))return;
  var s=document.createElement('style');s.id='actionRequiredReferenceRefinementStyles';s.textContent=[
    '.action-required-card .action-required-message{font-size:14.4px!important;line-height:1.24!important}',
    '.action-required-card .action-required-status-wrap{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1.4px solid currentColor!important;border-radius:999px!important;padding:6px 11px!important;background:transparent!important;white-space:nowrap!important;line-height:1!important}',
    '.action-required-card .action-required-status-wrap .action-required-status{display:inline-block!important;border:0!important;border-radius:0!important;padding:0!important;background:transparent!important;color:inherit!important;font:700 10.5px/1 Inter,sans-serif!important}',
    '.action-required-card .action-required-status-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:14px!important;height:14px!important;flex:none!important}',
    '.action-required-card .action-required-status-icon svg{width:14px!important;height:14px!important;display:block!important}',
    '@media(max-width:520px){.action-required-card .action-required-message{font-size:12px!important;line-height:1.24!important}.action-required-card .action-required-status-wrap{gap:5px!important;padding:5px 9px!important}.action-required-card .action-required-status-wrap .action-required-status{font-size:9px!important}.action-required-card .action-required-status-icon,.action-required-card .action-required-status-icon svg{width:12px!important;height:12px!important}}',
    '@media(max-width:380px){.action-required-card .action-required-message{font-size:10.8px!important}.action-required-card .action-required-status-wrap{padding:4px 8px!important}.action-required-card .action-required-status-wrap .action-required-status{font-size:8.5px!important}}'
  ].join('');document.head.appendChild(s);
}
function enforce(){
  ensureStyle();
  if(!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var status=card.querySelector('.action-required-status');if(!status)return;
  var wrap=status.closest('.action-required-status-wrap');
  if(!wrap){
    wrap=document.createElement('span');wrap.className='action-required-status-wrap';
    var icon=document.createElement('span');icon.className='action-required-status-icon';icon.innerHTML=calendarIcon();
    status.parentNode.insertBefore(wrap,status);wrap.appendChild(icon);wrap.appendChild(status);
  }else if(!wrap.querySelector('.action-required-status-icon')){
    var icon2=document.createElement('span');icon2.className='action-required-status-icon';icon2.innerHTML=calendarIcon();wrap.insertBefore(icon2,wrap.firstChild);
  }
}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,60);return}
  ensureStyle();
  var rd=window.renderDetail;if(!rd.__sunblissActionReferenceRefinementWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);enforce();Promise.resolve().then(enforce);return out};window.renderDetail.__sunblissActionReferenceRefinementWrapped=true}
  if(state.view==='detail'){enforce();setTimeout(enforce,80);setTimeout(enforce,260)}
  window.addEventListener('pageshow',enforce);
}
install();
})();