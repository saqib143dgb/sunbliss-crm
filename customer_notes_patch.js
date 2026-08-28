(function(){
'use strict';
if(window.__sunblissCustomerNotesInstalled)return;
window.__sunblissCustomerNotesInstalled=true;

function text(v){return v==null?'':String(v);}
function money(v){var n=Number(v);return isFinite(n)?n:0;}
function val(id){var e=document.getElementById(id);return e?text(e.value).trim():'';}
function unitId(){
  if(!window.state||!state.selectedUnit)return null;
  var p=String(state.selectedUnit).split('::');
  return p.length>1&&Number(p[1])?Number(p[1]):null;
}
function draft(){
  if(!window.state)return {general:'',partial:''};
  state.__customerNotesDraft=state.__customerNotesDraft||{general:'',partial:''};
  return state.__customerNotesDraft;
}
function isNewPartialBooking(){
  var booking=money(val('ncBookingAmount'));
  var down=money(val('ncAmt_DP'));
  return booking>0&&down>0&&booking<down-0.01;
}
function styles(){
  if(document.getElementById('customerNotesStyles'))return;
  var s=document.createElement('style');
  s.id='customerNotesStyles';
  s.textContent=[
    '.customer-note-field{display:block;margin:0 0 12px;font-size:12px;font-weight:600;color:var(--ink)}',
    '.customer-note-field textarea{display:block;width:100%;min-height:78px;margin-top:6px;padding:10px 11px;resize:vertical;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);font:500 14px/1.45 Inter,sans-serif;box-sizing:border-box}',
    '.customer-note-field textarea[aria-invalid="true"]{border-color:var(--rust);outline:1px solid rgba(174,59,43,.25)}',
    '.customer-note-required{color:var(--rust);font-weight:700}',
    '.customer-note-help{margin:-5px 0 12px;font-size:10.8px;line-height:1.45;color:var(--muted)}',
    '.customer-note-error{margin:-5px 0 12px;font-size:10.8px;line-height:1.45;color:var(--rust);font-weight:600}',
    '#partialBookingNoteNew[hidden]{display:none!important}',
    '#customerNotesCard{margin:12px 0 15px;padding:12px 13px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper-dim)}',
    '#customerNotesCard .customer-note-display-row+ .customer-note-display-row,#customerNotesHistoryPanel .customer-note-display-row+ .customer-note-display-row{margin-top:10px;padding-top:10px;border-top:1px solid var(--paper-line)}',
    '.customer-note-display-label{margin:0 0 4px;font:700 10px/1.25 IBM Plex Mono,monospace;letter-spacing:.055em;text-transform:uppercase;color:var(--muted)}',
    '.customer-note-display-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 12.5px/1.5 Inter,sans-serif;color:var(--ink)}',
    '.customer-note-archive-help{margin:5px 0 0;font-size:10.5px;line-height:1.45;color:var(--muted)}',
    '#customerNotesHistoryPanel{margin:0 0 16px;box-shadow:none;border:1px solid var(--paper-line)}'
  ].join('');
  document.head.appendChild(s);
}
function clearNewPartialError(){
  var ta=document.getElementById('ncPartialBookingNote');
  var err=document.getElementById('newPartialBookingError');
  if(ta)ta.removeAttribute('aria-invalid');
  if(err)err.remove();
}
function showNewPartialError(){
  var wrap=document.getElementById('partialBookingNoteNew');
  var ta=document.getElementById('ncPartialBookingNote');
  if(!wrap||!ta)return;
  ta.setAttribute('aria-invalid','true');
  var err=document.getElementById('newPartialBookingError');
  if(!err){
    err=document.createElement('p');
    err.id='newPartialBookingError';
    err.className='customer-note-error';
    err.textContent='Partial Booking Note is required because the Booking Amount is less than the Down Payment amount.';
    wrap.appendChild(err);
  }
  ta.focus();
}
function updateNewPartialVisibility(){
  var wrap=document.getElementById('partialBookingNoteNew');
  if(wrap)wrap.hidden=!isNewPartialBooking();
  if(!isNewPartialBooking())clearNewPartialError();
}
function decorateNewCustomer(){
  var booking=document.getElementById('ncBookingAmount');
  var soldBy=document.getElementById('ncSoldBy');
  if(!booking||!soldBy)return;
  var d=draft();
  if(!document.getElementById('ncGeneralNote')){
    var anchor=soldBy.closest('label')||soldBy;
    var field=document.createElement('label');
    field.className='customer-note-field';
    field.innerHTML='Special Note<textarea id="ncGeneralNote" placeholder="Write any important internal note about this customer or sale."></textarea>';
    anchor.insertAdjacentElement('afterend',field);
    var ta=field.querySelector('textarea');
    ta.value=d.general||'';
    ta.addEventListener('input',function(){draft().general=ta.value;});
  }
  if(!document.getElementById('partialBookingNoteNew')){
    var general=document.getElementById('ncGeneralNote');
    var wrap=document.createElement('div');
    wrap.id='partialBookingNoteNew';
    wrap.innerHTML='<label class="customer-note-field">Partial Booking Note <span class="customer-note-required">*</span><textarea id="ncPartialBookingNote" required placeholder="e.g. RM advised the remaining Down Payment to be completed by 01-Sep-2026."></textarea></label><p class="customer-note-help">Required for partial booking. Record the RM-advised completion follow-up here. It does not change the contractual Down Payment due date.</p>';
    general.closest('label').insertAdjacentElement('afterend',wrap);
    var pt=wrap.querySelector('textarea');
    pt.value=d.partial||'';
    pt.addEventListener('input',function(){draft().partial=pt.value;if(pt.value.trim())clearNewPartialError();});
  }
  if(!booking.dataset.customerNoteWatch){
    booking.dataset.customerNoteWatch='1';
    booking.addEventListener('input',updateNewPartialVisibility);
  }
  var dp=document.getElementById('ncAmt_DP');
  if(dp&&!dp.dataset.customerNoteWatch){
    dp.dataset.customerNoteWatch='1';
    dp.addEventListener('input',updateNewPartialVisibility);
  }
  updateNewPartialVisibility();
}
function capturePending(){
  var general=val('ncGeneralNote');
  var partial=val('ncPartialBookingNote');
  draft().general=general;
  draft().partial=partial;
  if(!window.state)return;
  state.__pendingCustomerNotes={unitNo:val('ncUnitNo'),general:general,partial:isNewPartialBooking()?partial:'',createdAt:Date.now()};
}
async function flushPending(){
  if(!window.state||!window.sb||!state.__pendingCustomerNotes||state.__customerNotesSaving)return;
  if(state.view!=='detail'||!state.selectedUnit)return;
  var pending=state.__pendingCustomerNotes;
  var uid=unitId();
  if(!uid)return;
  var selectedNo=String(state.selectedUnit).split('::')[0];
  if(pending.unitNo&&selectedNo&&pending.unitNo!==selectedNo)return;
  state.__customerNotesSaving=true;
  try{
    var r=await sb.from('sales').update({remarks:pending.general.trim()||null,partial_booking_note:pending.partial.trim()||null,updated_at:new Date().toISOString()}).eq('unit_id',uid);
    if(r.error)throw r.error;
    state.__pendingCustomerNotes=null;
    state.__customerNotesDraft={general:'',partial:''};
    var old=document.getElementById('customerNotesCard');
    if(old)old.remove();
  }catch(e){
    console.warn('Could not save customer notes after customer creation',e);
  }finally{
    state.__customerNotesSaving=false;
  }
}
function noteRow(label,value,help){
  var row=document.createElement('div');
  row.className='customer-note-display-row';
  var heading=document.createElement('p');
  heading.className='customer-note-display-label';
  heading.textContent=label;
  var body=document.createElement('p');
  body.className='customer-note-display-text';
  body.textContent=value;
  row.appendChild(heading);
  row.appendChild(body);
  if(help){
    var hint=document.createElement('p');
    hint.className='customer-note-archive-help';
    hint.textContent=help;
    row.appendChild(hint);
  }
  return row;
}
function noteAnchor(detail){
  return detail.querySelector('.badges')||detail.querySelector('.d-type')||detail.querySelector('.d-name')||detail.firstElementChild;
}
function panelAnchor(detail){
  var badges=detail&&detail.querySelector('.badges');
  if(badges&&badges.parentNode)return {node:badges,mode:'after'};
  var type=detail&&detail.querySelector('.d-type');
  if(type&&type.parentNode)return {node:type,mode:'after'};
  return null;
}
async function fetchNoteData(uid){
  var results=await Promise.all([
    sb.from('sales').select('id,remarks,partial_booking_note').eq('unit_id',uid).order('id',{ascending:false}).limit(1),
    sb.from('payment_schedule').select('due_amount,paid_amount,status').eq('unit_id',uid).eq('stage_name','Down Payment').limit(1)
  ]);
  if(results[0].error)throw results[0].error;
  if(results[1].error)throw results[1].error;
  var sale=(results[0].data||[])[0]||{};
  var dp=(results[1].data||[])[0]||null;
  var dpPaid=false;
  if(dp){
    dpPaid=text(dp.status).trim().toLowerCase()==='paid';
    if(!dpPaid&&Number(dp.due_amount)>0&&Number(dp.paid_amount)>=Number(dp.due_amount)-0.01)dpPaid=true;
  }
  return {sale:sale,dp:dp,dpPaid:dpPaid};
}
async function displayFrontPageNotes(){
  var old=document.getElementById('customerNotesCard');
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit){if(old)old.remove();return;}
  var uid=unitId();
  var detail=document.querySelector('.detail');
  if(!uid||!detail){if(old)old.remove();return;}
  var key=String(state.selectedUnit);
  if(detail.dataset.customerNotesLoading===key)return;
  detail.dataset.customerNotesLoading=key;
  try{
    var data=await fetchNoteData(uid);
    if(!window.state||state.view!=='detail'||String(state.selectedUnit)!==key)return;
    var special=text(data.sale.remarks).trim();
    var partial=text(data.sale.partial_booking_note).trim();
    old=document.getElementById('customerNotesCard');
    if(old)old.remove();
    if(!special&&(!partial||data.dpPaid))return;
    var card=document.createElement('section');
    card.id='customerNotesCard';
    card.dataset.noteKey=key;
    card.dataset.dpPaid=data.dpPaid?'1':'0';
    if(special)card.appendChild(noteRow('Special Note',special));
    if(partial&&!data.dpPaid)card.appendChild(noteRow('Partial Booking Note',partial));
    var anchor=noteAnchor(detail);
    if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',card);else detail.appendChild(card);
  }catch(e){
    console.warn('Could not load customer notes',e);
  }finally{
    if(detail&&detail.dataset.customerNotesLoading===key)delete detail.dataset.customerNotesLoading;
  }
}
async function archivePaidPartialInEditSale(){
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit)return;
  var panel=document.getElementById('saleComplianceEditPanel');
  var uid=unitId();
  if(!panel||!uid||panel.dataset.partialArchiveLoading==='1')return;
  panel.dataset.partialArchiveLoading='1';
  try{
    var data=await fetchNoteData(uid);
    if(!document.getElementById('saleComplianceEditPanel'))return;
    if(data.dpPaid){
      var partial=text(data.sale.partial_booking_note).trim();
      if(partial)panel.dataset.partialBookingDraft=partial;
      panel.dataset.partialBookingArchived='1';
      var wrap=document.getElementById('scPartialBookingWrap');
      if(wrap)wrap.remove();
    }else{
      panel.dataset.partialBookingArchived='0';
    }
  }catch(e){
    console.warn('Could not apply partial booking note lifecycle',e);
  }finally{
    if(panel)panel.dataset.partialArchiveLoading='0';
  }
}
function closeActionMenu(){
  var menu=document.getElementById('customerActionMenu');
  var button=document.getElementById('customerActionMenuButton');
  if(menu)menu.style.display='none';
  if(button)button.setAttribute('aria-expanded','false');
}
async function showNotesPanel(){
  var existing=document.getElementById('customerNotesHistoryPanel');
  if(existing){existing.remove();return;}
  var detail=document.querySelector('.detail');
  var uid=unitId();
  if(!detail||!uid)return;
  var panel=document.createElement('div');
  panel.id='customerNotesHistoryPanel';
  panel.className='brand-editor';
  panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p><p class="stat-sub">Loading notes…</p>';
  var anchor=panelAnchor(detail);
  if(anchor)anchor.node.insertAdjacentElement('afterend',panel);else detail.insertBefore(panel,detail.firstChild);
  try{
    var data=await fetchNoteData(uid);
    var special=text(data.sale.remarks).trim();
    var partial=text(data.sale.partial_booking_note).trim();
    panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p>';
    if(special)panel.appendChild(noteRow('Special Note',special));
    if(partial)panel.appendChild(noteRow(data.dpPaid?'Partial Booking Note · Completed':'Partial Booking Note',partial,data.dpPaid?'Archived after the Down Payment was completed.':''));
    if(!special&&!partial){
      var empty=document.createElement('p');
      empty.className='stat-sub';
      empty.textContent='No notes recorded for this customer.';
      panel.appendChild(empty);
    }
    var close=document.createElement('button');
    close.type='button';
    close.className='btn-paper';
    close.style.cssText='width:100%;justify-content:center;margin:12px 0 0';
    close.textContent='Close';
    close.onclick=function(){panel.remove();};
    panel.appendChild(close);
  }catch(e){
    panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p><p class="brand-error">Could not load notes.</p>';
  }
}
function ensureNotesMenu(){
  if(!window.state||state.view!=='detail'||state.userRole!=='crm_officer')return;
  var menu=document.getElementById('customerActionMenu');
  if(!menu||document.getElementById('actionViewNotes'))return;
  var item=document.createElement('button');
  item.type='button';
  item.id='actionViewNotes';
  item.textContent='Notes';
  item.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
  var editSale=document.getElementById('actionEditSaleCompliance');
  if(editSale&&editSale.parentNode===menu)editSale.insertAdjacentElement('afterend',item);else menu.appendChild(item);
  item.addEventListener('click',function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    closeActionMenu();
    showNotesPanel();
  });
}
function decorate(){
  styles();
  decorateNewCustomer();
  flushPending();
  displayFrontPageNotes();
  archivePaidPartialInEditSale();
  ensureNotesMenu();
}
function install(){
  if(!window.state||!window.sb){setTimeout(install,60);return;}
  document.addEventListener('click',function(e){
    var save=e.target&&e.target.closest?e.target.closest('#ncSave'):null;
    if(save){
      if(isNewPartialBooking()&&!val('ncPartialBookingNote')){
        e.preventDefault();
        e.stopPropagation();
        if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
        showNewPartialError();
        return;
      }
      clearNewPartialError();
      capturePending();
    }
    var cancel=e.target&&e.target.closest?e.target.closest('#ncCancel,#btnNcBack'):null;
    if(cancel&&window.state){state.__pendingCustomerNotes=null;state.__customerNotesDraft={general:'',partial:''};}
  },true);
  var root=document.getElementById('app')||document.body;
  new MutationObserver(function(){requestAnimationFrame(decorate);}).observe(root,{childList:true,subtree:true});
  decorate();
}
install();
})();
