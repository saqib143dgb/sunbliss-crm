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
    '#partialBookingNoteNew[hidden]{display:none!important}'
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
  }catch(e){
    console.warn('Could not save customer notes after customer creation',e);
  }finally{
    state.__customerNotesSaving=false;
  }
}
function removeFrontPageNotes(){
  var card=document.getElementById('customerNotesCard');
  if(card)card.remove();
}
function decorate(){styles();decorateNewCustomer();flushPending();removeFrontPageNotes();}
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