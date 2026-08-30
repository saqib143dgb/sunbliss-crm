(function(){
'use strict';
if(window.__sunblissActionRequiredReferenceCard)return;
window.__sunblissActionRequiredReferenceCard=true;

var activeObserver=null,syncing=false;
function text(v){return v==null?'':String(v)}
function safe(v){return typeof window.esc==='function'?window.esc(text(v)):text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function icon(kind){
  var common='width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if(kind==='layers')return '<svg '+common+'><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>';
  if(kind==='hourglass')return '<svg '+common+'><path d="M6 2h12M6 22h12M8 2v5c0 2 1.5 3.5 4 5-2.5 1.5-4 3-4 5v5M16 2v5c0 2-1.5 3.5-4 5 2.5 1.5 4 3 4 5v5"/></svg>';
  return '<svg '+common+'><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';
}
function ensureStyles(){
  if(document.getElementById('actionRequiredReferenceCardStyles'))return;
  var s=document.createElement('style');s.id='actionRequiredReferenceCardStyles';s.textContent=[
    '.action-required-card.action-reference-card{padding:0!important;border:1px solid var(--paper-line)!important;border-left:4px solid var(--slate,#45566B)!important;border-radius:12px!important;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(69,86,107,.012)),var(--paper)!important;overflow:hidden!important;margin:0 0 12px!important;box-shadow:0 1px 0 rgba(15,26,38,.02)!important}',
    '.action-reference-card[data-tone="danger"]{border-left-color:var(--rust)!important}.action-reference-card[data-tone="warn"]{border-left-color:var(--amber)!important}.action-reference-card[data-tone="good"]{border-left-color:var(--sage)!important}',
    '.action-reference-card .ar-ref-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px 5px}',
    '.action-reference-card .action-required-title{font:700 7.8px/1.1 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--amber,#9C5A12)}',
    '.action-reference-card .ar-status-wrap{display:inline-flex;align-items:center;gap:4px;border:1px solid currentColor;border-radius:999px;padding:3px 6px;color:var(--slate,#45566B);white-space:nowrap}',
    '.action-reference-card[data-tone="danger"] .ar-status-wrap{color:var(--rust)}.action-reference-card[data-tone="warn"] .ar-status-wrap{color:var(--amber)}.action-reference-card[data-tone="good"] .ar-status-wrap{color:var(--sage)}',
    '.action-reference-card .ar-status-icon{display:flex;align-items:center;justify-content:center}.action-reference-card .ar-status-icon svg{width:9px;height:9px}',
    '.action-reference-card .action-required-status{font:700 7.3px/1.05 Inter,sans-serif;color:inherit;border:0!important;padding:0!important}',
    '.action-reference-card .action-required-message{margin:0!important;padding:4px 10px 8px;font:700 11.5px/1.28 Inter,sans-serif;color:var(--ink)}',
    '.action-reference-card .ar-ref-divider{height:1px;background:var(--paper-line);margin:0 10px}',
    '.action-reference-card .ar-ref-meta{display:grid;grid-template-columns:1.25fr 1fr .8fr;padding:0 10px}',
    '.action-reference-card .ar-ref-block{display:flex;align-items:center;gap:6px;min-width:0;min-height:38px;padding:6px 7px 6px 0}',
    '.action-reference-card .ar-ref-block+.ar-ref-block{border-left:1px solid var(--paper-line);padding-left:7px}',
    '.action-reference-card .ar-ref-icon{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex:none;color:var(--slate,#45566B);background:rgba(69,86,107,.055)}',
    '.action-reference-card[data-tone="danger"] .ar-ref-icon{color:var(--rust);background:rgba(174,59,43,.055)}.action-reference-card[data-tone="warn"] .ar-ref-icon{color:var(--amber);background:rgba(156,90,18,.055)}.action-reference-card[data-tone="good"] .ar-ref-icon{color:var(--sage);background:rgba(63,122,87,.055)}',
    '.action-reference-card .ar-ref-copy{min-width:0}.action-reference-card .ar-ref-label{font:500 6.8px/1.1 Inter,sans-serif;color:var(--muted);margin-bottom:2px}.action-reference-card .ar-ref-value{font:700 8.4px/1.15 Inter,sans-serif;color:var(--ink);overflow-wrap:anywhere}',
    '.action-reference-card .action-required-detail.ar-ref-source{display:none!important}',
    '@media(max-width:390px){.action-reference-card .action-required-message{font-size:10.8px;padding:3px 9px 7px}.action-reference-card .ar-ref-head{padding:7px 9px 4px}.action-reference-card .ar-ref-divider{margin:0 9px}.action-reference-card .ar-ref-meta{padding:0 9px}.action-reference-card .ar-ref-block{gap:5px;min-height:35px;padding-right:5px}.action-reference-card .ar-ref-block+.ar-ref-block{padding-left:5px}.action-reference-card .ar-ref-icon{width:18px;height:18px}.action-reference-card .ar-ref-icon svg{width:10px;height:10px}.action-reference-card .ar-ref-label{font-size:6.3px}.action-reference-card .ar-ref-value{font-size:7.7px}}'
  ].join('');document.head.appendChild(s)
}
function parseMeta(status,message,detail){
  status=text(status).trim();message=text(message).trim();detail=text(detail).trim();
  var stage='',by='',due='';
  var m=detail.match(/Stage:\s*([^·.]+)/i);if(m)stage=m[1].trim();
  if(!stage){m=message.match(/\bfor\s+(.+?)\s+(?:was due|is due)\b/i);if(m)stage=m[1].trim()}
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
  if(!due&&/up to date/i.test(status))due='—';
  if(!due)due='—';
  return{stage:stage,by:by,due:due};
}
function sync(card){
  if(syncing||!card)return;syncing=true;
  try{
    var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail');
    if(!status||!message)return;
    var meta=parseMeta(status.textContent,message.textContent,detail&&detail.textContent);
    var a=card.querySelector('[data-ar-meta="stage"]'),b=card.querySelector('[data-ar-meta="by"]'),d=card.querySelector('[data-ar-meta="due"]');
    if(a&&text(a.textContent)!==meta.stage)a.textContent=meta.stage;
    if(b&&text(b.textContent)!==meta.by)b.textContent=meta.by;
    if(d&&text(d.textContent)!==meta.due)d.textContent=meta.due;
  }finally{syncing=false}
}
function attach(card){
  if(activeObserver){activeObserver.disconnect();activeObserver=null}
  var targets=[card.querySelector('.action-required-status'),card.querySelector('.action-required-message'),card.querySelector('.action-required-detail')].filter(Boolean);
  if(!targets.length)return;
  activeObserver=new MutationObserver(function(){sync(card)});
  targets.forEach(function(t){activeObserver.observe(t,{childList:true,characterData:true,subtree:true})});
}
function transform(card){
  if(!card)return;
  ensureStyles();
  var statusNode=card.querySelector('.action-required-status'),messageNode=card.querySelector('.action-required-message'),detailNode=card.querySelector('.action-required-detail');
  var status=text(statusNode&&statusNode.textContent),message=text(messageNode&&messageNode.textContent),detail=text(detailNode&&detailNode.textContent);
  if(!statusNode||!messageNode)return;
  if(!card.classList.contains('action-reference-card')){
    card.classList.add('action-reference-card');
    var meta=parseMeta(status,message,detail);
    card.innerHTML='<div class="ar-ref-head"><span class="action-required-title">Action Required</span><span class="ar-status-wrap"><span class="ar-status-icon">'+icon('calendar')+'</span><span class="action-required-status">'+safe(status)+'</span></span></div><p class="action-required-message">'+safe(message)+'</p><p class="action-required-detail ar-ref-source">'+safe(detail)+'</p><div class="ar-ref-divider"></div><div class="ar-ref-meta"><div class="ar-ref-block"><span class="ar-ref-icon">'+icon('layers')+'</span><span class="ar-ref-copy"><span class="ar-ref-label">Stage</span><span class="ar-ref-value" data-ar-meta="stage">'+safe(meta.stage)+'</span></span></div><div class="ar-ref-block"><span class="ar-ref-icon">'+icon('calendar')+'</span><span class="ar-ref-copy"><span class="ar-ref-label">By</span><span class="ar-ref-value" data-ar-meta="by">'+safe(meta.by)+'</span></span></div><div class="ar-ref-block"><span class="ar-ref-icon">'+icon('hourglass')+'</span><span class="ar-ref-copy"><span class="ar-ref-label">Due In</span><span class="ar-ref-value" data-ar-meta="due">'+safe(meta.due)+'</span></span></div></div>';
  }
  sync(card);attach(card);
}
function apply(){if(!window.state||state.view!=='detail')return;transform(document.getElementById('actionRequiredCard'))}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,60);return}
  ensureStyles();
  var rd=window.renderDetail;if(!rd.__sunblissActionReferenceWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);apply();return out};window.renderDetail.__sunblissActionReferenceWrapped=true}
  if(state.view==='detail')apply();
  window.addEventListener('pageshow',apply);
}
install();
})();