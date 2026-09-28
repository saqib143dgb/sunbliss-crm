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
  style.textContent=`
#actionRequiredCard{
  position:relative!important;
  margin:0 0 16px!important;
  border:1px solid var(--paper-line,#dfd2c0)!important;
  border-left:7px solid var(--amber,#9C5A12)!important;
  border-radius:16px!important;
  background:var(--paper,#fffdf7)!important;
  overflow:hidden!important;
  box-shadow:none!important;
}
#actionRequiredCard[data-tone="danger"]{border-left-color:var(--rust,#B44732)!important}
#actionRequiredCard[data-tone="good"]{border-left-color:var(--sage,#3F7A57)!important}
#actionRequiredCard[data-action-status="upcoming"]{border-left-color:var(--sage,#3F7A57)!important}

#actionRequiredCard .action-required-head{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:14px!important;
  padding:15px 16px 7px 18px!important;
}
#actionRequiredCard .action-required-title{
  color:var(--amber,#9C5A12)!important;
  font:700 10.5px/1.1 "IBM Plex Mono",monospace!important;
  letter-spacing:.105em!important;
  text-transform:uppercase!important;
  white-space:nowrap!important;
}
#actionRequiredCard .action-required-status-wrap{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  min-height:34px!important;
  padding:0 13px!important;
  border:1px solid var(--gold-deep,#B77A1F)!important;
  border-radius:999px!important;
  background:transparent!important;
  color:var(--ink,#16232F)!important;
  box-sizing:border-box!important;
  flex:none!important;
}
#actionRequiredCard .action-required-status-icon{display:flex!important;align-items:center!important;justify-content:center!important}
#actionRequiredCard .action-required-status-icon svg{width:16px!important;height:16px!important}
#actionRequiredCard .action-required-status{
  color:inherit!important;
  font:700 11.5px/1 Inter,sans-serif!important;
  white-space:nowrap!important;
}
#actionRequiredCard[data-tone="danger"] .action-required-status-wrap{
  color:var(--rust,#B44732)!important;
  border-color:var(--rust,#B44732)!important;
  background:transparent!important;
}
#actionRequiredCard[data-tone="good"] .action-required-status-wrap,
#actionRequiredCard[data-action-status="upcoming"] .action-required-status-wrap{
  color:var(--sage,#3F7A57)!important;
  border-color:var(--sage,#3F7A57)!important;
  background:transparent!important;
}

#actionRequiredCard .action-required-message{
  margin:0!important;
  padding:13px 18px 17px!important;
  color:var(--ink,#16232F)!important;
  font:700 15px/1.35 Inter,sans-serif!important;
  letter-spacing:-.01em!important;
}
#actionRequiredCard .action-required-detail{display:none!important}
#actionRequiredCard .action-required-divider{display:none!important}

#actionRequiredCard .action-required-extension{
  margin:0 18px 12px!important;
  padding:9px 11px!important;
  border:1px solid rgba(156,90,18,.26)!important;
  border-radius:9px!important;
  background:transparent!important;
  color:var(--amber,#9C5A12)!important;
  font:600 11.5px/1.4 Inter,sans-serif!important;
}

#actionRequiredCard .action-required-upcoming{
  margin:0!important;
  padding:0 18px 12px!important;
  color:var(--muted,#746b5e)!important;
  font:500 12px/1.45 Inter,sans-serif!important;
}

#actionRequiredCard .action-required-meta{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:8px!important;
  padding:0 18px 17px!important;
  border:0!important;
}
#actionRequiredCard .action-required-meta-block,
#actionRequiredCard .action-required-meta-block+.action-required-meta-block{
  display:grid!important;
  grid-template-columns:auto 1px minmax(0,1fr)!important;
  align-items:center!important;
  gap:12px!important;
  min-width:0!important;
  min-height:54px!important;
  padding:8px 14px!important;
  border:1px solid var(--paper-line,#dfd2c0)!important;
  border-radius:10px!important;
  background:transparent!important;
  box-sizing:border-box!important;
  text-align:left!important;
}
#actionRequiredCard .action-required-meta-block:before{
  content:""!important;
  grid-column:2!important;
  width:1px!important;
  height:28px!important;
  background:var(--paper-line,#dfd2c0)!important;
}
#actionRequiredCard .action-required-meta-icon{display:none!important}
#actionRequiredCard .action-required-meta-block>span:last-child{
  display:contents!important;
}
#actionRequiredCard .action-required-meta-label{
  grid-column:1!important;
  grid-row:1!important;
  display:block!important;
  min-width:0!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  color:var(--muted,#746b5e)!important;
  font:600 11.5px/1.2 Inter,sans-serif!important;
  white-space:nowrap!important;
}
#actionRequiredCard .action-required-meta-value{
  grid-column:3!important;
  grid-row:1!important;
  display:block!important;
  min-width:0!important;
  color:var(--ink,#16232F)!important;
  font:700 13px/1.2 Inter,sans-serif!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
#actionRequiredCard .action-required-meta-block:last-child .action-required-meta-value{
  color:var(--rust,#B44732)!important;
  font-weight:700!important;
}

@media(max-width:520px){
  #actionRequiredCard{
    border-left-width:6px!important;
    border-radius:14px!important;
  }
  #actionRequiredCard .action-required-head{
    gap:9px!important;
    padding:12px 12px 6px 14px!important;
  }
  #actionRequiredCard .action-required-title{
    font-size:9.7px!important;
    letter-spacing:.095em!important;
  }
  #actionRequiredCard .action-required-status-wrap{
    min-height:32px!important;
    gap:6px!important;
    padding:0 10px!important;
  }
  #actionRequiredCard .action-required-status-icon svg{width:15px!important;height:15px!important}
  #actionRequiredCard .action-required-status{font-size:10.6px!important}
  #actionRequiredCard .action-required-message{
    padding:11px 14px 15px!important;
    font-size:13.7px!important;
    line-height:1.36!important;
  }
  #actionRequiredCard .action-required-extension{
    margin:0 14px 10px!important;
    padding:8px 9px!important;
    font-size:10.5px!important;
  }
  #actionRequiredCard .action-required-upcoming{
    padding:0 14px 10px!important;
    font-size:11px!important;
  }
  #actionRequiredCard .action-required-meta{
    gap:7px!important;
    padding:0 14px 14px!important;
  }
  #actionRequiredCard .action-required-meta-block,
  #actionRequiredCard .action-required-meta-block+.action-required-meta-block{
    grid-template-columns:auto 1px minmax(0,1fr)!important;
    gap:8px!important;
    min-height:50px!important;
    padding:7px 9px!important;
    border-radius:9px!important;
  }
  #actionRequiredCard .action-required-meta-block:before{height:25px!important}
  #actionRequiredCard .action-required-meta-label{font-size:10.4px!important}
  #actionRequiredCard .action-required-meta-value{font-size:11.7px!important}
}
@media(max-width:370px){
  #actionRequiredCard .action-required-head{padding-left:12px!important;padding-right:10px!important}
  #actionRequiredCard .action-required-status-wrap{padding:0 8px!important}
  #actionRequiredCard .action-required-title{font-size:9px!important}
  #actionRequiredCard .action-required-status{font-size:10px!important}
  #actionRequiredCard .action-required-message{padding-left:12px!important;padding-right:12px!important;font-size:12.8px!important}
  #actionRequiredCard .action-required-meta{padding-left:12px!important;padding-right:12px!important;gap:6px!important}
  #actionRequiredCard .action-required-meta-block,
  #actionRequiredCard .action-required-meta-block+.action-required-meta-block{gap:6px!important;padding:7px 7px!important}
  #actionRequiredCard .action-required-meta-label{font-size:9.8px!important}
  #actionRequiredCard .action-required-meta-value{font-size:10.8px!important}
}
@media(min-width:720px){
  #actionRequiredCard .action-required-head{padding:20px 22px 9px 24px!important}
  #actionRequiredCard .action-required-title{font-size:12px!important}
  #actionRequiredCard .action-required-status-wrap{min-height:42px!important;padding:0 17px!important;gap:10px!important}
  #actionRequiredCard .action-required-status-icon svg{width:20px!important;height:20px!important}
  #actionRequiredCard .action-required-status{font-size:14px!important}
  #actionRequiredCard .action-required-message{padding:20px 24px 24px!important;font-size:20px!important}
  #actionRequiredCard .action-required-extension{margin:0 24px 14px!important;padding:11px 13px!important;font-size:12px!important}
  #actionRequiredCard .action-required-upcoming{padding:0 24px 14px!important;font-size:13px!important}
  #actionRequiredCard .action-required-meta{gap:12px!important;padding:0 24px 22px!important}
  #actionRequiredCard .action-required-meta-block,
  #actionRequiredCard .action-required-meta-block+.action-required-meta-block{
    min-height:66px!important;
    gap:15px!important;
    padding:10px 18px!important;
    border-radius:11px!important;
  }
  #actionRequiredCard .action-required-meta-block:before{height:34px!important}
  #actionRequiredCard .action-required-meta-label{font-size:14px!important}
  #actionRequiredCard .action-required-meta-value{font-size:16px!important}
}
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
