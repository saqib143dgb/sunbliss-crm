(function(){
'use strict';
if(window.__sunblissDetailAttentionPillsInstalled)return;
window.__sunblissDetailAttentionPillsInstalled=true;
document.documentElement.classList.add('detail-attention-system');

var selectedByUnit={};
var scheduled=false;
var selfMutating=false;

function tx(v){return v==null?'':String(v)}
function unitKey(){return window.state&&state.selectedUnit?tx(state.selectedUnit):''}
function norm(v){return tx(v).replace(/\s+/g,' ').trim().toLowerCase()}

function styles(){
  if(document.getElementById('detailAttentionPillsStyles'))return;
  var s=document.createElement('style');
  s.id='detailAttentionPillsStyles';
  s.textContent=[
    '#detailAttentionPills{width:100%;margin:0 0 10px;overflow:hidden;box-sizing:border-box}',
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
  ].join('');
  document.head.appendChild(s);
}

function visibleCustomerNoteRows(card){
  if(!card)return[];
  return Array.prototype.slice.call(card.querySelectorAll('.customer-note-display-row')).filter(function(r){return r.style.display!=='none'});
}

function candidateList(detail){
  var out=[];
  var action=document.getElementById('actionRequiredCard');
  if(action&&detail.contains(action))out.push({kind:'action',label:'Action Required',node:action,priority:0});

  var scheduled=document.getElementById('scheduledActionsDetail');
  if(scheduled&&detail.contains(scheduled)){
    var count=scheduled.querySelectorAll('.scheduled-task-card').length;
    out.push({kind:'scheduled',label:'Scheduled Action'+(count>1?' · '+count:''),node:scheduled,priority:1});
  }

  var note=document.getElementById('activeCustomerNoteCard');
  if(note&&detail.contains(note))out.push({kind:'note',label:'Note',node:note,priority:2});

  var special=document.getElementById('customerNotesCard');
  if(special&&detail.contains(special)){
    var rows=visibleCustomerNoteRows(special);
    if(rows.length){
      var hasSpecial=rows.some(function(r){var l=r.querySelector('.customer-note-display-label');return l&&norm(l.textContent).indexOf('special note')===0});
      var hasPartial=rows.some(function(r){var l=r.querySelector('.customer-note-display-label');return l&&norm(l.textContent).indexOf('partial booking note')===0});
      var label=hasSpecial?'Special Note':hasPartial?'Partial Note':'Special Note';
      var kind=hasSpecial?'special':hasPartial?'partial':'special';
      out.push({kind:kind,label:label,node:special,priority:3});
    }
  }
  return out.sort(function(a,b){return a.priority-b.priority});
}

function cleanup(detail,keep){
  Array.prototype.slice.call(detail.querySelectorAll('.detail-attention-managed,.detail-attention-selected')).forEach(function(n){
    if(keep.indexOf(n)<0){n.classList.remove('detail-attention-managed','detail-attention-hidden','detail-attention-selected');delete n.dataset.attentionKind;}
  });
}

function ensureBar(detail,items){
  var bar=document.getElementById('detailAttentionPills');
  if(!items.length){
    if(bar)bar.remove();
    cleanup(detail,[]);
    return null;
  }
  if(!bar){
    bar=document.createElement('nav');
    bar.id='detailAttentionPills';
    bar.setAttribute('aria-label','Customer alerts');
    bar.innerHTML='<div class="detail-attention-pills-scroll" role="tablist"></div>';
  }
  var first=items.map(function(x){return x.node}).filter(function(n){return n&&n.parentNode===detail}).sort(function(a,b){return Array.prototype.indexOf.call(detail.children,a)-Array.prototype.indexOf.call(detail.children,b)})[0];
  if(first&&bar.parentNode!==detail)detail.insertBefore(bar,first);
  else if(first&&bar.nextElementSibling!==first){detail.insertBefore(bar,first);}
  else if(!bar.parentNode){
    var badges=detail.querySelector('.badges');
    if(badges&&badges.parentNode===detail)badges.insertAdjacentElement('afterend',bar);else detail.insertBefore(bar,detail.firstChild);
  }
  return bar;
}

function render(){
  scheduled=false;
  if(selfMutating)return;
  styles();
  if(!window.state||state.view!=='detail'){
    var old=document.getElementById('detailAttentionPills');if(old)old.remove();
    return;
  }
  var detail=document.querySelector('.detail');
  if(!detail)return;
  var items=candidateList(detail);
  var keep=items.map(function(x){return x.node});
  cleanup(detail,keep);
  var bar=ensureBar(detail,items);
  if(!bar)return;

  var key=unitKey();
  var available={};items.forEach(function(i){available[i.kind]=i});
  var selected=selectedByUnit[key];
  if(!selected||!available[selected])selected=items[0].kind;
  selectedByUnit[key]=selected;

  selfMutating=true;
  try{
    items.forEach(function(i){
      i.node.classList.add('detail-attention-managed');
      i.node.dataset.attentionKind=i.kind;
      i.node.classList.toggle('detail-attention-hidden',i.kind!==selected);
      i.node.classList.toggle('detail-attention-selected',i.kind===selected);
    });
    var host=bar.querySelector('.detail-attention-pills-scroll');
    var signature=items.map(function(i){return i.kind+':'+i.label}).join('|')+'|selected:'+selected;
    if(bar.dataset.signature!==signature){
      bar.dataset.signature=signature;
      host.innerHTML=items.map(function(i){return '<button type="button" class="detail-attention-pill" role="tab" data-kind="'+i.kind+'" aria-selected="'+(i.kind===selected?'true':'false')+'">'+i.label+'</button>'}).join('');
    }else{
      Array.prototype.slice.call(host.querySelectorAll('.detail-attention-pill')).forEach(function(b){b.setAttribute('aria-selected',b.dataset.kind===selected?'true':'false')});
    }
  }finally{
    selfMutating=false;
  }
}

function queue(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(render);
}

document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('#detailAttentionPills .detail-attention-pill'):null;
  if(!b)return;
  e.preventDefault();
  var key=unitKey();if(!key)return;
  selectedByUnit[key]=b.dataset.kind;
  render();
},true);

function install(){
  styles();
  var root=document.getElementById('app')||document.body;
  if(window.MutationObserver)new MutationObserver(function(){if(!selfMutating)render()}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  var rd=window.renderDetail;
  if(typeof rd==='function')window.renderDetail=function(){var o=rd.apply(this,arguments);render();return o};
  window.addEventListener('pageshow',render);
  render();
}
install();
})();