(function(){
'use strict';
if(window.__sunblissCreditNoteNoteLifecycleInstalled)return;
window.__sunblissCreditNoteNoteLifecycleInstalled=true;

var cache={};
var queued=false;
function text(v){return v==null?'':String(v);}
function unitId(){if(!window.state||!state.selectedUnit)return null;var p=String(state.selectedUnit).split('::');return p.length>1&&Number(p[1])?Number(p[1]):null;}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
function isPriceStage(stage){var s=norm(stage&&stage.stage_name);return Number(stage&&stage.due_amount)>0 && !/(dld|admin|fee)/.test(s);}
function specialLifecycle(note,schedules,credits){
  var n=norm(note);if(!n||n.indexOf('credit note')<0)return {creditRelated:false,multi:false,completed:false};schedules=schedules||[];credits=credits||[];var credited={};credits.forEach(function(c){if(c.payment_schedule_id!=null)credited[String(c.payment_schedule_id)]=true;});var multi=/\bcredit notes\b/.test(n)||/\b(each|every|all|future)\b.{0,45}\binstallments?\b/.test(n)||/\bagainst installments\b/.test(n)||/\binstallment-wise\b/.test(n);if(multi){var priceStages=schedules.filter(isPriceStage);return {creditRelated:true,multi:true,completed:priceStages.length>0&&priceStages.every(function(s){return !!credited[String(s.id)];})};}var named=schedules.filter(function(s){var stage=norm(s.stage_name);if(!stage)return false;if(n.indexOf(stage)>=0)return true;var simple=stage.replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();return simple&&n.indexOf(simple)>=0;});if(named.length)return {creditRelated:true,multi:false,completed:named.some(function(s){return !!credited[String(s.id)];})};return {creditRelated:true,multi:false,completed:credits.length>0};
}
async function getState(uid,force){var now=Date.now(),c=cache[String(uid)];if(!force&&c&&now-c.at<1500)return c.data;var results=await Promise.all([sb.from('sales').select('remarks').eq('unit_id',uid).order('id',{ascending:false}).limit(1),sb.from('payment_schedule').select('id,stage_name,due_amount').eq('unit_id',uid),sb.from('credit_notes').select('id,payment_schedule_id').eq('unit_id',uid)]);for(var i=0;i<results.length;i++){if(results[i].error)throw results[i].error;}var sale=(results[0].data||[])[0]||{},note=text(sale.remarks).trim(),life=specialLifecycle(note,results[1].data||[],results[2].data||[]),data={note:note,life:life};cache[String(uid)]={at:now,data:data};return data;}
function findSpecialRow(root){if(!root)return null;var rows=root.querySelectorAll('.customer-note-display-row');for(var i=0;i<rows.length;i++){var label=rows[i].querySelector('.customer-note-display-label');if(label&&norm(label.textContent).indexOf('special note')===0)return rows[i];}return null;}
function hasVisibleRows(card){if(!card)return false;var rows=card.querySelectorAll('.customer-note-display-row');for(var i=0;i<rows.length;i++)if(rows[i].style.display!=='none')return true;return false;}
async function applyFront(){
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit)return;var uid=unitId(),card=document.getElementById('customerNotesCard');if(!uid||!card)return;var key=String(state.selectedUnit);if(card.dataset.creditLifecycleKey===key&&card.dataset.creditLifecycleDone==='1')return;card.dataset.creditLifecycleKey=key;
  try{var data=await getState(uid,false);if(!window.state||String(state.selectedUnit)!==key||!document.body.contains(card))return;var row=findSpecialRow(card);if(data.life.completed){if(row){row.style.display='none';row.dataset.creditLifecycleHidden='1';}if(!hasVisibleRows(card)){card.style.display='none';card.dataset.creditLifecycleHidden='1';}}else{if(row){row.style.display='';delete row.dataset.creditLifecycleHidden;}card.style.display='';delete card.dataset.creditLifecycleHidden;}card.dataset.creditLifecycleDone='1';}catch(e){console.warn('Could not apply credit-note special-note lifecycle',e);}
}
async function applyHistory(){
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit)return;var uid=unitId(),panel=document.getElementById('customerNotesHistoryPanel');if(!uid||!panel)return;var key=String(state.selectedUnit);if(panel.dataset.creditLifecycleKey===key&&panel.dataset.creditLifecycleDone==='1')return;panel.dataset.creditLifecycleKey=key;
  try{var data=await getState(uid,true);if(!window.state||String(state.selectedUnit)!==key||!document.body.contains(panel))return;if(data.life.completed){var row=findSpecialRow(panel);if(row){row.style.display='';var label=row.querySelector('.customer-note-display-label');if(label)label.textContent='Special Note · Completed';if(!row.querySelector('.customer-note-archive-help')){var help=document.createElement('p');help.className='customer-note-archive-help';help.textContent=data.life.multi?'Archived after all required installment credit notes were issued.':'Archived after the required credit note was issued.';row.appendChild(help);}}}panel.dataset.creditLifecycleDone='1';}catch(e){console.warn('Could not update credit-note note history',e);}
}
function decorate(){queued=false;applyFront();applyHistory();}
function queue(){if(queued)return;queued=true;requestAnimationFrame(decorate);}
function relevant(node){if(!node||node.nodeType!==1)return false;if(node.matches&&node.matches('#customerNotesCard,#customerNotesHistoryPanel'))return true;return !!(node.querySelector&&node.querySelector('#customerNotesCard,#customerNotesHistoryPanel'));}
function install(){
  if(!window.state||!window.sb){setTimeout(install,80);return;}
  var root=document.getElementById('app')||document.body;
  if(window.MutationObserver)new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++)for(var j=0;j<mutations[i].addedNodes.length;j++)if(relevant(mutations[i].addedNodes[j])){queue();return;}}).observe(root,{childList:true,subtree:true});
  if(typeof window.renderDetail==='function'){var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);queue();return out;};}
  document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#scSave')){var uid=unitId();if(uid)delete cache[String(uid)];setTimeout(queue,180);}},true);
  window.addEventListener('pageshow',queue);
  queue();
}
install();
})();