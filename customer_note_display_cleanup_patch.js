(function(){
'use strict';
if(window.__sunblissCustomerNoteDisplayCleanupInstalled)return;
window.__sunblissCustomerNoteDisplayCleanupInstalled=true;

var loadingKey='';
var cache={};

function text(v){return v==null?'':String(v);}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
function unitId(){
  if(!window.state||!state.selectedUnit)return null;
  var p=String(state.selectedUnit).split('::');
  return p.length>1&&Number(p[1])?Number(p[1]):null;
}
function isLowerNoteLabel(label){
  var n=norm(label);
  return n==='remarks'||n==='remark'||n==='special note'||n==='customer note'||n==='note'||n==='notes';
}
function hideLowerDuplicateRows(){
  if(!window.state||state.view!=='detail')return;
  var detail=document.querySelector('.detail');
  if(!detail)return;
  var rows=detail.querySelectorAll('.field-row,.field-address');
  for(var i=0;i<rows.length;i++){
    var row=rows[i];
    if(row.closest('#customerNotesCard,#customerNotesHistoryPanel,#saleComplianceEditPanel'))continue;
    var label=row.querySelector('.field-label');
    if(label&&isLowerNoteLabel(label.textContent)){
      row.style.display='none';
      row.dataset.customerNoteDuplicateHidden='1';
    }
  }
}
function hideLegacyRemarksNotices(){
  if(!window.state||state.view!=='detail')return;
  var detail=document.querySelector('.detail');
  if(!detail)return;
  var notices=detail.querySelectorAll('.notice');
  for(var i=0;i<notices.length;i++){
    var notice=notices[i];
    if(notice.closest('#customerNotesCard,#customerNotesHistoryPanel,#saleComplianceEditPanel,#customerEditPanel,#unitCancellationPanel'))continue;
    var subs=notice.querySelectorAll('.notice-sub');
    var changed=false;
    for(var j=0;j<subs.length;j++){
      var subText=norm(subs[j].textContent);
      if(!subText)continue;
      if(subText.indexOf('latest update:')===0)continue;
      subs[j].style.display='none';
      subs[j].dataset.customerLegacyRemarkHidden='1';
      changed=true;
    }
    if(!changed)continue;
    var parts=notice.querySelectorAll('.notice-title,.notice-body,.notice-sub');
    var hasVisibleContent=false;
    for(var k=0;k<parts.length;k++){
      if(parts[k].style.display!=='none'&&norm(parts[k].textContent)){
        hasVisibleContent=true;
        break;
      }
    }
    if(!hasVisibleContent){
      notice.style.display='none';
      notice.dataset.customerLegacyRemarkHidden='1';
    }
  }
}
function isPriceStage(stage){
  var s=norm(stage&&stage.stage_name);
  return Number(stage&&stage.due_amount)>0&&!/(dld|admin|fee)/.test(s);
}
function specialLifecycle(note,schedules,credits){
  var n=norm(note);
  if(!n||n.indexOf('credit note')<0)return {completed:false};
  schedules=schedules||[];
  credits=credits||[];
  var credited={};
  credits.forEach(function(c){if(c.payment_schedule_id!=null)credited[String(c.payment_schedule_id)]=true;});
  var multi=/\bcredit notes\b/.test(n)||/\b(each|every|all|future)\b.{0,45}\binstallments?\b/.test(n)||/\bagainst installments\b/.test(n)||/\binstallment-wise\b/.test(n);
  if(multi){
    var stages=schedules.filter(isPriceStage);
    return {completed:stages.length>0&&stages.every(function(s){return !!credited[String(s.id)];})};
  }
  var named=schedules.filter(function(s){
    var stage=norm(s.stage_name);
    if(!stage)return false;
    if(n.indexOf(stage)>=0)return true;
    var simple=stage.replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();
    return simple&&n.indexOf(simple)>=0;
  });
  if(named.length)return {completed:named.some(function(s){return !!credited[String(s.id)];})};
  return {completed:credits.length>0};
}
async function getData(uid){
  var key=String(uid);
  var hit=cache[key];
  if(hit&&Date.now()-hit.at<2500)return hit.data;
  var results=await Promise.all([
    sb.from('sales').select('remarks,partial_booking_note').eq('unit_id',uid).order('id',{ascending:false}).limit(1),
    sb.from('payment_schedule').select('id,stage_name,due_amount,paid_amount,status').eq('unit_id',uid),
    sb.from('credit_notes').select('id,payment_schedule_id').eq('unit_id',uid)
  ]);
  for(var i=0;i<results.length;i++){if(results[i].error)throw results[i].error;}
  var sale=(results[0].data||[])[0]||{};
  var schedules=results[1].data||[];
  var dp=schedules.filter(function(s){return norm(s.stage_name)==='down payment';})[0]||null;
  var dpPaid=false;
  if(dp){
    dpPaid=norm(dp.status)==='paid'||(Number(dp.due_amount)>0&&Number(dp.paid_amount)>=Number(dp.due_amount)-0.01);
  }
  var special=text(sale.remarks).trim();
  var partial=text(sale.partial_booking_note).trim();
  var life=specialLifecycle(special,schedules,results[2].data||[]);
  var data={special:special,partial:partial,dpPaid:dpPaid,specialCompleted:life.completed};
  cache[key]={at:Date.now(),data:data};
  return data;
}
function noteRow(label,value){
  var row=document.createElement('div');
  row.className='customer-note-display-row';
  var h=document.createElement('p');
  h.className='customer-note-display-label';
  h.textContent=label;
  var b=document.createElement('p');
  b.className='customer-note-display-text';
  b.textContent=value;
  row.appendChild(h);row.appendChild(b);
  return row;
}
async function ensureDedicatedNotice(){
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit)return;
  var detail=document.querySelector('.detail');
  var uid=unitId();
  if(!detail||!uid)return;
  var key=String(state.selectedUnit);
  if(loadingKey===key)return;
  loadingKey=key;
  try{
    var data=await getData(uid);
    if(!window.state||state.view!=='detail'||String(state.selectedUnit)!==key)return;
    hideLegacyRemarksNotices();
    var existing=document.getElementById('customerNotesCard');
    if(existing&&detail.contains(existing))return;
    var showSpecial=!!data.special&&!data.specialCompleted;
    var showPartial=!!data.partial&&!data.dpPaid;
    if(!showSpecial&&!showPartial)return;
    var card=document.createElement('section');
    card.id='customerNotesCard';
    card.dataset.noteKey=key;
    card.dataset.customerNoteFallback='1';
    if(showSpecial)card.appendChild(noteRow('Special Note',data.special));
    if(showPartial)card.appendChild(noteRow('Partial Booking Note',data.partial));
    var anchor=detail.querySelector('.badges')||detail.querySelector('.d-type')||detail.querySelector('.d-name');
    if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',card);else detail.insertBefore(card,detail.firstChild);
  }catch(e){
    console.warn('Could not restore dedicated customer note notice',e);
  }finally{
    if(loadingKey===key)loadingKey='';
  }
}
function refresh(){
  hideLowerDuplicateRows();
  hideLegacyRemarksNotices();
  ensureDedicatedNotice();
}
function install(){
  if(!window.state||!window.sb){setTimeout(install,80);return;}
  var root=document.getElementById('app')||document.body;
  new MutationObserver(function(){requestAnimationFrame(refresh);}).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#scSave')){
      var uid=unitId();
      if(uid)delete cache[String(uid)];
      var detail=document.querySelector('.detail');
      if(detail)delete detail.dataset.customerNotesLoading;
    }
  },true);
  refresh();
}
install();
})();
