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
  style.textContent='\n.action-required-card .action-required-message{font-size:14.4px!important;}\n#actionRequiredCard .action-required-detail{display:none!important;}\n@media(max-width:520px){.action-required-card .action-required-message{font-size:12px!important;}}\n@media(max-width:380px){.action-required-card .action-required-message{font-size:10.8px!important;}}';
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
function observeTargets(targets){
  if(!observer)return;
  targets.forEach(function(node){observer.observe(node,{childList:true,characterData:true,subtree:true})});
}
function sync(){
  if(syncing||!window.state||state.view!=='detail')return;
  var card=document.getElementById('actionRequiredCard');if(!card)return;
  var status=card.querySelector('.action-required-status'),message=card.querySelector('.action-required-message'),detail=card.querySelector('.action-required-detail'),values=card.querySelectorAll('.action-required-meta-value');
  if(!status||!message||values.length<3)return;
  var targets=[status,message,detail].filter(Boolean),meta=parse(status.textContent,message.textContent,detail&&detail.textContent),headline=cleanHeadline(message.textContent,meta.by);
  syncing=true;
  if(observer)observer.disconnect();
  try{
    if(text(values[0].textContent)!==meta.stage)values[0].textContent=meta.stage;
    if(text(values[1].textContent)!==meta.by)values[1].textContent=meta.by;
    if(text(values[2].textContent)!==meta.due)values[2].textContent=meta.due;
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
