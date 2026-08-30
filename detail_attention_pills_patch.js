(function(){
'use strict';
if(window.__sunblissDetailAttentionPillsInstalled)return;
window.__sunblissDetailAttentionPillsInstalled=true;
document.documentElement.classList.add('detail-attention-system');

var selectedByUnit={};
var scheduled=false;
var refreshTimer=null;
function tx(v){return v==null?'':String(v)}
function unitKey(){return window.state&&state.selectedUnit?tx(state.selectedUnit):''}
function norm(v){return tx(v).replace(/\s+/g,' ').trim().toLowerCase()}
function styles(){
  if(document.getElementById('detailAttentionPillsStyles'))return;
  var s=document.createElement('style');s.id='detailAttentionPillsStyles';s.textContent=[
    '#detailAttentionPills{width:100%;margin:0 0 10px;overflow:hidden;box-sizing:border-box}',
    '#detailAttentionPills[data-attention-pending="1"]{visibility:hidden!important;pointer-events:none!important}',
    '.detail-attention-pills-scroll{display:flex;width:100%;gap:7px;overflow:visible;padding:1px 0 2px;box-sizing:border-box}',
    '.detail-attention-pill{flex:1 1 0;min-width:0;min-height:31px;margin:0!important;padding:6px 7px;border:1px solid var(--paper-line,#DCD2B6);border-radius:999px;background:var(--paper-dim,#EFE8D6);color:var(--muted,#6F706D);font:700 9.5px/1.2 IBM Plex Mono,monospace;letter-spacing:.01em;text-align:center;white-space:normal;overflow-wrap:anywhere;cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}',
    '.detail-attention-pill[aria-selected="true"]{background:var(--ink,#0F1A26);border-color:var(--ink,#0F1A26);color:var(--paper,#F6F1E4)}',
    '.detail-attention-pill[data-kind="action"][aria-selected="true"]{background:var(--rust,#AE3B2B);border-color:var(--rust,#AE3B2B)}',
    '.detail-attention-pill[data-kind="scheduled"][aria-selected="true"]{background:var(--slate,#45566B);border-color:var(--slate,#45566B)}',
    '.detail-attention-pill[data-kind="note"][aria-selected="true"],.detail-attention-pill[data-kind="special"][aria-selected="true"],.detail-attention-pill[data-kind="partial"][aria-selected="true"]{background:var(--amber,#9C5A12);border-color:var(--amber,#9C5A12)}',
    'html.detail-attention-system .detail #actionRequiredCard,html.detail-attention-system .detail #activeCustomerNoteCard,html.detail-attention-system .detail #customerNotesCard,html.detail-attention-system .detail #scheduledActionsDetail{display:none!important}',
    'html.detail-attention-system .detail #actionRequiredCard.detail-attention-selected,html.detail-attention-system .detail #activeCustomerNoteCard.detail-attention-selected,html.detail-attention-system .detail #customerNotesCard.detail-attention-selected,html.detail-attention-system .detail #scheduledActionsDetail.detail-attention-selected{display:block!important}',
    '.detail-attention-managed.detail-attention-hidden{display:none!important}',
    '#actionRequiredCard.detail-attention-managed,#activeCustomerNoteCard.detail-attention-managed,#customerNotesCard.detail-attention-managed,#scheduledActionsDetail.detail-attention-managed{margin-top:0!important;margin-bottom:14px!important}',
    '@media(max-width:520px){#detailAttentionPills{margin-bottom:9px}.detail-attention-pills-scroll{gap:6px}.detail-attention-pill{min-height:32px;padding:6px 5px;font-size:8.7px;line-height:1.15}}'
  ].join('');document.head.appendChild(s)
}
function visibleCustomerNoteRows(card){if(!card)return[];return Array.prototype.slice.call(card.querySelectorAll('.customer-note-display-row')).filter(function(r){return r.style.display!=='none'})}
function candidateList(detail){
  var out=[],action=document.getElementById('actionRequiredCard');if(action&&detail.contains(action))out.push({kind:'action',label:'Action Required',node:action,priority:0});
  var scheduledAction=document.getElementById('scheduledActionsDetail');if(scheduledAction&&detail.contains(scheduledAction)){var count=scheduledAction.querySelectorAll('.scheduled-task-card').length;out.push({kind:'scheduled',label:'Scheduled Action'+(count>1?' · '+count:''),node:scheduledAction,priority:1})}
  var note=document.getElementById('activeCustomerNoteCard');if(note&&detail.contains(note))out.push({kind:'note',label:'Note',node:note,priority:2});
  var special=document.getElementById('customerNotesCard');if(special&&detail.contains(special)){var rows=visibleCustomerNoteRows(special);if(rows.length){var hasSpecial=rows.some(function(r){var l=r.querySelector('.customer-note-display-label');return l&&norm(l.textContent).indexOf('special note')===0}),hasPartial=rows.some(function(r){var l=r.querySelector('.customer-note-display-label');return l&&norm(l.textContent).indexOf('partial booking note')===0});out.push({kind:hasSpecial?'special':hasPartial?'partial':'special',label:hasSpecial?'Special Note':hasPartial?'Partial Note':'Special Note',node:special,priority:3})}}
  return out.sort(function(a,b){return a.priority-b.priority})
}
function cleanup(detail,keep){Array.prototype.slice.call(detail.querySelectorAll('.detail-attention-managed,.detail-attention-selected')).forEach(function(n){if(keep.indexOf(n)<0){n.classList.remove('detail-attention-managed','detail-attention-hidden','detail-attention-selected');delete n.dataset.attentionKind}})}
function ensureBar(detail,items){
  var bar=document.getElementById('detailAttentionPills');if(!items.length){if(bar)bar.remove();cleanup(detail,[]);return null}
  if(!bar){bar=document.createElement('nav');bar.id='detailAttentionPills';bar.setAttribute('aria-label','Customer alerts');bar.innerHTML='<div class="detail-attention-pills-scroll" role="tablist"></div>'}
  var first=items.map(function(x){return x.node}).filter(function(n){return n&&n.parentNode===detail}).sort(function(a,b){return Array.prototype.indexOf.call(detail.children,a)-Array.prototype.indexOf.call(detail.children,b)})[0];
  if(first&&bar.parentNode!==detail)detail.insertBefore(bar,first);else if(first&&bar.nextElementSibling!==first)detail.insertBefore(bar,first);else if(!bar.parentNode){var badges=detail.querySelector('.badges');if(badges&&badges.parentNode===detail)badges.insertAdjacentElement('afterend',bar);else detail.insertBefore(bar,detail.firstChild)}return bar
}
function notesPending(detail,key){return detail.dataset.customerNotesLoading===key||detail.dataset.activeNoteLoading===key}
function render(){
  scheduled=false;styles();if(!window.state||state.view!=='detail'){var old=document.getElementById('detailAttentionPills');if(old)old.remove();return}
  var detail=document.querySelector('.detail');if(!detail)return;var key=unitKey(),items=candidateList(detail),keep=items.map(function(x){return x.node});cleanup(detail,keep);var bar=ensureBar(detail,items);if(!bar)return;
  var available={};items.forEach(function(i){available[i.kind]=i});var selected=selectedByUnit[key];if(!selected||!available[selected])selected=items[0].kind;selectedByUnit[key]=selected;
  items.forEach(function(i){i.node.classList.add('detail-attention-managed');i.node.dataset.attentionKind=i.kind;i.node.classList.toggle('detail-attention-hidden',i.kind!==selected);i.node.classList.toggle('detail-attention-selected',i.kind===selected)});
  var host=bar.querySelector('.detail-attention-pills-scroll'),signature=items.map(function(i){return i.kind+':'+i.label}).join('|')+'|selected:'+selected;
  if(bar.dataset.signature!==signature){bar.dataset.signature=signature;host.innerHTML=items.map(function(i){return '<button type="button" class="detail-attention-pill" role="tab" data-kind="'+i.kind+'" aria-selected="'+(i.kind===selected?'true':'false')+'">'+i.label+'</button>'}).join('')}else Array.prototype.slice.call(host.querySelectorAll('.detail-attention-pill')).forEach(function(b){b.setAttribute('aria-selected',b.dataset.kind===selected?'true':'false')});
  if(notesPending(detail,key))bar.setAttribute('data-attention-pending','1');else bar.removeAttribute('data-attention-pending')
}
function queue(delay){
  if(scheduled||refreshTimer)return;
  if(delay){refreshTimer=setTimeout(function(){refreshTimer=null;if(scheduled)return;scheduled=true;requestAnimationFrame(render)},delay);return}
  scheduled=true;requestAnimationFrame(render)
}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#detailAttentionPills .detail-attention-pill'):null;if(b){e.preventDefault();var key=unitKey();if(key){selectedByUnit[key]=b.dataset.kind;render();return}}if(e.target&&e.target.closest&&e.target.closest('#notesSaveBtn,#scSave,#extSave,.scheduled-mark-done,.scheduled-edit'))queue(60)},true);
document.addEventListener('sunbliss:customer-notes-ready',function(e){if(!window.state||state.view!=='detail')return;var key=e&&e.detail?tx(e.detail.key):'';if(!key||key===unitKey())render()});
document.addEventListener('sunbliss:active-note-ready',function(e){if(!window.state||state.view!=='detail')return;var key=e&&e.detail?tx(e.detail.key):'';if(!key||key===unitKey())render()});
function install(){
  styles();var rd=window.renderDetail;if(typeof rd==='function'&&!rd.__sunblissAttentionStable){var original=rd;window.renderDetail=function(){var o=original.apply(this,arguments);queue(0);return o};window.renderDetail.__sunblissAttentionStable=true}
  window.addEventListener('pageshow',function(){queue(0)});queue(0)
}
install();
})();