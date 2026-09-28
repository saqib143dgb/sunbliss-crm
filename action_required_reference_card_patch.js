(function(){
'use strict';
if(window.__sunblissActionRequiredMetaSync)return;
window.__sunblissActionRequiredMetaSync=true;
var observer=null,syncing=false;
function text(v){return v==null?'':String(v)}
function ensureHeadlineSize(){
  if(document.getElementById('actionRequiredHeadlineSizeRefine'))return;
  var style=document.createElement('style');
  style.id='actionRequiredHeadlineSizeRefine';
  style.textContent='\n.action-required-card .action-required-message{font-size:14.4px!important;}\n#actionRequiredCard .action-required-detail{display:none!important;}\n.action-required-card[data-tone="danger"] .action-required-status-wrap{color:var(--rust,#B44732)!important;border-color:var(--rust,#B44732)!important;background:rgba(180,71,50,.07)!important;}\n.action-required-card[data-action-status="upcoming"]{border-left-color:var(--sage,#3F7A57)!important;}\n.action-required-card[data-action-status="upcoming"] .action-required-status-wrap{color:var(--sage,#3F7A57)!important;border-color:var(--sage,#3F7A57)!important;background:rgba(63,122,87,.07)!important;}\n@media(max-width:520px){.action-required-card .action-required-message{font-size:12px!important;}.action-required-card .action-required-meta{grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr) minmax(0,.8fr)!important;padding:0 10px!important;}.action-required-card .action-required-meta-block{display:block!important;min-width:0!important;min-height:auto!important;padding:10px 7px!important;text-align:center!important;}.action-required-card .action-required-meta-block+.action-required-meta-block{padding-left:7px!important;}.action-required-card .action-required-meta-icon{display:none!important;}.action-required-card .action-required-meta-label{margin:0 0 3px!important;font-size:9px!important;line-height:1.1!important;white-space:nowrap!important;}.action-required-card .action-required-meta-value{display:block!important;font-size:10.4px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;overflow-wrap:normal!important;word-break:normal!important;}}\n@media(max-width:380px){.action-required-card .action-required-message{font-size:10.8px!important;}.action-required-card .action-required-meta{padding:0 7px!important;}.action-required-card .action-required-meta-block{padding:9px 5px!important;}.action-required-card .action-required-meta-block+.action-required-meta-block{padding-left:5px!important;}.action-required-card .action-required-meta-label{font-size:8.5px!important;}.action-required-card .action-required-meta-value{font-size:9.6px!important;}}';
  style.textContent+=`
#actionRequiredCard .action-required-divider{display:none!important}
#actionRequiredCard .action-required-meta{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;padding:0 10px 8px!important;border:0!important}
#actionRequiredCard .action-required-meta-block,#actionRequiredCard .action-required-meta-block+.action-required-meta-block{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;min-width:0!important;min-height:62px!important;padding:8px 5px 10px!important;border:1px solid #dfd2c0!important;border-radius:7px!important;background:transparent!important;text-align:center!important}
#actionRequiredCard .action-required-meta-icon{display:none!important}
#actionRequiredCard .action-required-meta-block>span:last-child{width:100%;min-width:0}
#actionRequiredCard .action-required-meta-label{display:table!important;min-width:60px;max-width:100%;margin:0 auto 8px!important;padding:4px 12px!important;border:1px solid #b5aa98!important;border-radius:999px!important;background:transparent!important;color:#746b5e!important;font:600 11px/1.1 Inter,sans-serif!important;box-sizing:border-box}
#actionRequiredCard .action-required-meta-value{display:block!important;font:500 12.5px/1.35 Inter,sans-serif!important;color:var(--ink)!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important}
#actionRequiredCard .action-required-meta-block:last-child .action-required-meta-value{color:#bb2634!important;font-weight:700!important}
#actionRequiredCard .action-required-upcoming{margin:0!important;padding:0 14px 12px;font:500 12px/1.45 Inter,sans-serif;color:var(--muted)}
@media(min-width:720px){#actionRequiredCard .action-required-meta{gap:12px!important;padding:0 18px 16px!important}#actionRequiredCard .action-required-meta-block{padding:12px!important}#actionRequiredCard .action-required-meta-label{font-size:12px!important}#actionRequiredCard .action-required-meta-value{font-size:14px!important}}
`;
  document.head.appendChild(style);
}
function parse(status,message,detail){
  status=text(status).trim();message=text(message).trim();detail=text(detail).trim();
  var stage='',by='',due='',m;
  m=detail.match(/Stage:\s*([^·.]+)/i);if(m)stage=m[1].trim();
  if(!stage){m=message.match(/\bfor\s+(.+?)\s+(?:was due|is due)\b/i);if(m)stage=m[1].trim()}
  if(!stage){m=message.match(/total overdue for\s+(.+?)\.\s*Follow/i);if(m)stage=m[1].trim()}
  if(!stage&&/installments overdue/i.test(detail))stage='Multiple installments';
  if(!stage&&/up to date/i.test(status))stage='No pending stage';
  if(!stage)stage='Next installment';
  m=message.match(/\bdue on\s+([0-9]{1,2}\s+[A-Za-z]{3,4}\s+[0-9]{4})/i);if(m)by=m[1];
  if(!by){m=message.match(/\bwas due on\s+([0-9]{1,2}\s+[A-Za-z]{3,4}\s+[0-9]{4})/i);if(m)by=m[1]}
  if(!by){var all=[],re=/(?:Extended to|Revised to|By)\s+([0-9]{1,2}\s+[A-Za-z]{3,4}\s+[0-9]{4})/gi,x;while((x=re.exec(detail)))all.push(x[1]);if(all.length)by=all[all.length-1]}
  if(!by&&/due today/i.test(status))by='Today';
  if(!by&&/date needed/i.test(status))by='Not set';
  if(!by&&/(?:due|payable) at handover/i.test(detail+' '+message))by='At handover';
  if(!by)by='—';
  m=detail.match(/Due in\s+([0-9]+\s+day(?:s)?)/i);if(m)due=m[1];
  if(!due){m=detail.match(/([0-9]+\s+day(?:s)?\s+overdue)/i);if(m)due=m[1]}
  if(!due&&/due today/i.test(status))due='Today';
  if(!due&&/overdue/i.test(status))due='Overdue';
  if(!due)due='—';
  return{stage:stage,by:by,due:due};
}
function compactDate(value){
  var raw=text(value).trim(),m=raw.match(/^([0-9]{1,2})\s+([A-Za-z]{3,4})\s+([0-9]{4})$/);
  return m?m[1]+' '+m[2]+' '+m[3].slice(-2):raw;
}
function compactDue(value){
  var raw=text(value).trim(),m=raw.match(/^([0-9]+\s+day(?:s)?)\s+overdue$/i);
  return m?m[1]:raw;
}
function escapeRegExp(value){return text(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function cleanHeadline(value,by){
  var out=text(value).trim(),exact=text(by).trim();
  if(!out)return out;
  if(/^\d{1,2}\s+[A-Za-z]{3,4}\s+\d{4}$/.test(exact)){
    var d=escapeRegExp(exact);
    out=out.replace(new RegExp('\\s+(?:It|They)\\s+(?:was|were)\\s+due\\s+on\\s+'+d+'\\.?','gi'),'');
    out=out.replace(new RegExp('\\s+was\\s+due\\s+on\\s+'+d,'gi'),' is overdue');
    out=out.replace(new RegExp('\\s+were\\s+due\\s+on\\s+'+d,'gi'),' are overdue');
    out=out.replace(new RegExp('\\s+by\\s+'+d+'(?=\\s+before\\s+SPA\\s+signing)','gi'),'');
    out=out.replace(new RegExp('\\s*[—–-]\\s*due\\s+'+d,'gi'),'');
    out=out.replace(new RegExp('\\s+due\\s+on\\s+'+d,'gi'),'');
    out=out.replace(new RegExp('\\s+due\\s+'+d,'gi'),'');
  }
  out=out.replace(/\s+([,.!?])/g,'$1').replace(/\.\s*\./g,'.').replace(/\s{2,}/g,' ').trim();
  if(out&&!/[.!?]$/.test(out))out+='.';
  return out;
}
function upcomingHeadline(value,status,isOverdue){
  if(isOverdue||!/(?:^|\b)(upcoming|due soon|extension active|revised schedule)(?:\b|$)/i.test(text(status).trim()))return'';
  var m=text(value).match(/\bAED\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/i);if(!m)return'';
  return 'Next installment is '+m[0]+'.';
}
function observeTargets(targets){
  if(!observer)return;
  targets.forEach(function(node){observer.observe(node,{childList:true,characterData:true,subtree:true})});
}
function sync(){
  if(syncing||!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail'),values=card.querySelectorAll('.action-required-meta-value'),labels=card.querySelectorAll('.action-required-meta-label');
  if(!status||!message||values.length<2)return;
  var targets=[status,message,detail].filter(Boolean),statusText=text(status.textContent).trim(),meta=parse(statusText,message.textContent,detail&&detail.textContent),byDisplay=compactDate(meta.by),dueDisplay=compactDue(meta.due),isOverdue=/overdue/i.test(statusText)||/overdue/i.test(text(meta.due)),isUpcoming=/^upcoming$/i.test(statusText),headline=text(message.textContent).trim();
  try{var exact=JSON.parse(card.dataset.actionMeta||'null');if(exact&&exact.stage){meta=exact;byDisplay=compactDate(exact.by);dueDisplay=compactDue(exact.due);isOverdue=!!exact.overdue;}}catch(e){}
  syncing=true;
  if(observer)observer.disconnect();
  try{
    if(text(values[0].textContent)!==byDisplay)values[0].textContent=byDisplay;
    if(text(values[1].textContent)!==dueDisplay)values[1].textContent=dueDisplay;
    if(labels.length>=2&&text(labels[1].textContent)!==(isOverdue?'Overdue':'Due In'))labels[1].textContent=isOverdue?'Overdue':'Due In';
    if(isOverdue)card.setAttribute('data-tone','danger');
    if(isUpcoming)card.setAttribute('data-action-status','upcoming');else card.removeAttribute('data-action-status');
    if(headline&&text(message.textContent).trim()!==headline)message.textContent=headline;
  }finally{
    syncing=false;
    observeTargets(targets);
  }
}
function attach(){
  if(observer){observer.disconnect();observer=null}
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var targets=[card.querySelector('.action-required-status'),card.querySelector('.action-required-message'),card.querySelector('.action-required-detail')].filter(Boolean);if(!targets.length)return;
  observer=new MutationObserver(sync);observeTargets(targets);sync();
}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'||typeof window.sunblissRenderActionRequiredCard!=='function'){setTimeout(install,60);return}
  ensureHeadlineSize();
  var rd=window.renderDetail;if(!rd.__sunblissActionMetaSyncWrapped){window.renderDetail=function(){var out=rd.apply(this,arguments);attach();return out};window.renderDetail.__sunblissActionMetaSyncWrapped=true}
  if(state.view==='detail')attach();window.addEventListener('pageshow',attach);
}
install();
})();
