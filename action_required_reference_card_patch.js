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
  style.textContent='\n.action-required-card .action-required-message{font-size:14.4px!important;}\n#actionRequiredCard .action-required-detail{display:none!important;}\n.action-required-card[data-tone="danger"] .action-required-status-wrap{color:var(--rust,#B44732)!important;border-color:var(--rust,#B44732)!important;background:rgba(180,71,50,.07)!important;}\n.action-required-card .action-required-amount{font-weight:800!important;}\n.action-required-card .action-required-amount.is-overdue{color:var(--rust,#B44732)!important;}\n.action-required-card .action-required-amount.is-current{color:var(--sage,#4F6F52)!important;}\n@media(max-width:520px){.action-required-card .action-required-message{font-size:12px!important;}.action-required-card .action-required-meta{grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr) minmax(0,.8fr)!important;padding:0 10px!important;}.action-required-card .action-required-meta-block{display:block!important;min-width:0!important;min-height:auto!important;padding:10px 7px!important;text-align:center!important;}.action-required-card .action-required-meta-block+.action-required-meta-block{padding-left:7px!important;}.action-required-card .action-required-meta-icon{display:none!important;}.action-required-card .action-required-meta-label{margin:0 0 3px!important;font-size:9px!important;line-height:1.1!important;white-space:nowrap!important;}.action-required-card .action-required-meta-value{display:block!important;font-size:10.4px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;overflow-wrap:normal!important;word-break:normal!important;}}\n@media(max-width:380px){.action-required-card .action-required-message{font-size:10.8px!important;}.action-required-card .action-required-meta{padding:0 7px!important;}.action-required-card .action-required-meta-block{padding:9px 5px!important;}.action-required-card .action-required-meta-block+.action-required-meta-block{padding-left:5px!important;}.action-required-card .action-required-meta-label{font-size:8.5px!important;}.action-required-card .action-required-meta-value{font-size:9.6px!important;}}';
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
  m=message.match(/\bdue on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1];
  if(!by){m=message.match(/\bwas due on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1]}
  if(!by){var all=[],re=/(?:Extended to|Revised to|By)\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/gi,x;while((x=re.exec(detail)))all.push(x[1]);if(all.length)by=all[all.length-1]}
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
  var raw=text(value).trim(),m=raw.match(/^([0-9]{1,2})\s+([A-Za-z]{3})\s+([0-9]{4})$/);
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
  if(/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(exact)){
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
function colorAmount(message,isOverdue){
  if(!message)return;
  var raw=text(message.textContent),m=raw.match(/\bAED\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/i);if(!m)return;
  var cls='action-required-amount '+(isOverdue?'is-overdue':'is-current'),existing=message.querySelector('.action-required-amount');
  if(existing&&text(existing.textContent)===m[0]&&existing.className===cls)return;
  var before=raw.slice(0,m.index),after=raw.slice(m.index+m[0].length),span=document.createElement('span');span.className=cls;span.textContent=m[0];
  message.textContent='';if(before)message.appendChild(document.createTextNode(before));message.appendChild(span);if(after)message.appendChild(document.createTextNode(after));
}
function observeTargets(targets){
  if(!observer)return;
  targets.forEach(function(node){observer.observe(node,{childList:true,characterData:true,subtree:true})});
}
function sync(){
  if(syncing||!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail'),values=card.querySelectorAll('.action-required-meta-value'),labels=card.querySelectorAll('.action-required-meta-label');
  if(!status||!message||values.length<3)return;
  var targets=[status,message,detail].filter(Boolean),meta=parse(status.textContent,message.textContent,detail&&detail.textContent),headline=cleanHeadline(message.textContent,meta.by),byDisplay=compactDate(meta.by),dueDisplay=compactDue(meta.due),isOverdue=/overdue/i.test(text(status.textContent))||/overdue/i.test(text(meta.due));
  syncing=true;
  if(observer)observer.disconnect();
  try{
    if(text(values[0].textContent)!==meta.stage)values[0].textContent=meta.stage;
    if(text(values[1].textContent)!==byDisplay)values[1].textContent=byDisplay;
    if(text(values[2].textContent)!==dueDisplay)values[2].textContent=dueDisplay;
    if(labels.length>=3&&text(labels[2].textContent)!==(isOverdue?'Overdue':'Due In'))labels[2].textContent=isOverdue?'Overdue':'Due In';
    if(isOverdue)card.setAttribute('data-tone','danger');
    if(headline&&text(message.textContent).trim()!==headline)message.textContent=headline;
    colorAmount(message,isOverdue);
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
