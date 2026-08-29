(function(){
'use strict';
if(window.__sunblissActiveNoteFrontPageInstalled)return;
window.__sunblissActiveNoteFrontPageInstalled=true;

var cache={};
var scheduled=false;
var loadingKey='';

function text(v){return v==null?'':String(v);}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
function unitId(){
  if(!window.state||!state.selectedUnit)return null;
  var p=String(state.selectedUnit).split('::');
  return p.length>1&&Number(p[1])?Number(p[1]):null;
}
function styles(){
  if(document.getElementById('activeCustomerNoteStyles'))return;
  var s=document.createElement('style');
  s.id='activeCustomerNoteStyles';
  s.textContent=[
    '#activeCustomerNoteCard{margin:0 0 16px;padding:13px 14px;border:1px solid var(--paper-line);border-left:4px solid var(--amber);border-radius:12px;background:rgba(156,90,18,.07)}',
    '.active-note-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}',
    '.active-note-title{font-family:IBM Plex Mono,monospace;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700}',
    '.active-note-status{font-size:10px;font-weight:700;border:1px solid var(--amber);border-radius:999px;padding:3px 8px;white-space:nowrap;color:var(--amber)}',
    '.active-note-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 12.5px/1.55 Inter,Arial,sans-serif;color:var(--ink)}'
  ].join('');
  document.head.appendChild(s);
}
function hideDuplicateSpecial(){
  var legacy=document.getElementById('customerNotesCard');
  if(!legacy)return;
  var rows=legacy.querySelectorAll('.customer-note-display-row');
  var visible=false;
  for(var i=0;i<rows.length;i++){
    var label=rows[i].querySelector('.customer-note-display-label');
    if(label&&norm(label.textContent).indexOf('special note')===0){
      rows[i].style.display='none';
      rows[i].dataset.activeNoteDuplicateHidden='1';
    }else if(rows[i].style.display!=='none'){
      visible=true;
    }
  }
  if(!visible)legacy.style.display='none';
}
function place(card,detail){
  var action=document.getElementById('actionRequiredCard');
  if(action&&action.parentNode===detail){
    if(action.nextElementSibling!==card)action.insertAdjacentElement('afterend',card);
    return;
  }
  var badges=detail.querySelector('.badges');
  if(badges&&badges.parentNode===detail){
    if(badges.nextElementSibling!==card)badges.insertAdjacentElement('afterend',card);
    return;
  }
  if(detail.firstElementChild!==card)detail.insertBefore(card,detail.firstChild);
}
function show(note,key){
  var detail=document.querySelector('.detail');
  if(!detail)return;
  hideDuplicateSpecial();
  var card=document.getElementById('activeCustomerNoteCard');
  if(!note){if(card)card.remove();return;}
  if(!card){
    card=document.createElement('section');
    card.id='activeCustomerNoteCard';
    card.innerHTML='<div class="active-note-head"><span class="active-note-title">Note</span><span class="active-note-status">Active</span></div><p class="active-note-text"></p>';
  }
  card.dataset.noteKey=key;
  var body=card.querySelector('.active-note-text');
  if(body&&body.textContent!==note)body.textContent=note;
  place(card,detail);
}
async function fetchNote(uid,force){
  var k=String(uid),hit=cache[k];
  if(!force&&hit&&Date.now()-hit.at<2500)return hit.note;
  var r=await sb.from('sales').select('remarks,updated_at').eq('unit_id',uid).order('id',{ascending:false}).limit(1);
  if(r.error)throw r.error;
  var row=(r.data||[])[0]||{};
  var note=text(row.remarks).trim();
  cache[k]={at:Date.now(),note:note,updatedAt:row.updated_at||null};
  return note;
}
async function refresh(force){
  styles();
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit){
    var old=document.getElementById('activeCustomerNoteCard');if(old)old.remove();return;
  }
  var detail=document.querySelector('.detail'),uid=unitId();
  if(!detail||!uid)return;
  var key=String(state.selectedUnit);
  if(loadingKey===key&&!force)return;
  loadingKey=key;
  try{
    var note=await fetchNote(uid,!!force);
    if(!window.state||state.view!=='detail'||String(state.selectedUnit)!==key)return;
    show(note,key);
  }catch(e){
    console.warn('Could not load active customer note',e);
  }finally{
    if(loadingKey===key)loadingKey='';
  }
}
function schedule(force){
  if(force){scheduled=false;refresh(true);return;}
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(function(){scheduled=false;refresh(false);});
}
function install(){
  if(!window.state||!window.sb||typeof window.renderDetail!=='function'){setTimeout(install,80);return;}
  var rd=window.renderDetail;
  window.renderDetail=function(){var out=rd.apply(this,arguments);schedule(false);return out;};
  document.addEventListener('click',function(e){
    if(!e.target||!e.target.closest)return;
    if(e.target.closest('#notesSaveBtn,#scSave')){
      var uid=unitId();if(uid)delete cache[String(uid)];
      setTimeout(function(){schedule(true);},250);
    }
  },true);
  window.addEventListener('pageshow',function(){schedule(false);});
  schedule(true);
}
install();
})();