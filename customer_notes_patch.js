(function(){
'use strict';
if(window.__sunblissCustomerNotesInstalled)return;
window.__sunblissCustomerNotesInstalled=true;

function text(v){return v==null?'':String(v);}
function safe(v){
  if(typeof window.esc==='function')return window.esc(text(v));
  return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c];});
}
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
    '#partialBookingNoteNew[hidden],#customerPartialNoteWrap[hidden]{display:none!important}',
    '#customerNotesCard{margin:14px 0;padding:13px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper)}',
    '#customerNotesCard .section-label{margin:0 0 10px}',
    '#customerNotesSave{width:100%;justify-content:center;margin:2px 0 0}',
    '#customerNotesStatus{min-height:16px;margin:7px 0 0;font-size:10.8px;color:var(--muted);text-align:center}'
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
    field.innerHTML='Customer Note<textarea id="ncGeneralNote" placeholder="Write any important internal note about this customer or sale."></textarea>';
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
  state.__pendingCustomerNotes={
    unitNo:val('ncUnitNo'),
    general:general,
    partial:isNewPartialBooking()?partial:'',
    createdAt:Date.now()
  };
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
    var r=await sb.from('sales').update({
      remarks:pending.general.trim()||null,
      partial_booking_note:pending.partial.trim()||null,
      updated_at:new Date().toISOString()
    }).eq('unit_id',uid);
    if(r.error)throw r.error;
    state.__pendingCustomerNotes=null;
    state.__customerNotesDraft={general:'',partial:''};
    var card=document.getElementById('customerNotesCard');
    if(card)card.remove();
    decorateDetail();
  }catch(e){
    console.warn('Could not save customer notes after customer creation',e);
  }finally{
    state.__customerNotesSaving=false;
  }
}
async function fetchNoteData(uid){
  var saleReq=sb.from('sales').select('id,remarks,partial_booking_note,booking_amount').eq('unit_id',uid).limit(1);
  var dpReq=sb.from('payment_schedule').select('due_amount,paid_amount,due_date').eq('unit_id',uid).eq('stage_name','Down Payment').limit(1);
  var results=await Promise.all([saleReq,dpReq]);
  if(results[0].error)throw results[0].error;
  if(results[1].error)throw results[1].error;
  var sale=(results[0].data||[])[0]||null;
  var dp=(results[1].data||[])[0]||null;
  return {sale:sale,dp:dp};
}
function detailAnchor(detail){
  var rows=Array.prototype.slice.call(detail.querySelectorAll('.field-row'));
  if(rows.length)return rows[rows.length-1];
  var name=detail.querySelector('.d-name');
  return name||detail.firstElementChild;
}
async function decorateDetail(){
  if(!window.state||!window.sb||state.view!=='detail'||!state.selectedUnit)return;
  var uid=unitId();
  var detail=document.querySelector('.detail');
  if(!uid||!detail||document.getElementById('customerNotesCard'))return;
  var key=String(state.selectedUnit);
  detail.dataset.customerNotesLoading=key;
  try{
    var data=await fetchNoteData(uid);
    if(!window.state||state.view!=='detail'||String(state.selectedUnit)!==key)return;
    if(document.getElementById('customerNotesCard'))return;
    if(!data.sale)return;
    var booking=money(data.sale.booking_amount);
    var dpDue=data.dp?money(data.dp.due_amount):0;
    var partialEligible=booking>0&&dpDue>0&&booking<dpDue-0.01;
    var card=document.createElement('div');
    card.id='customerNotesCard';
    card.innerHTML='<p class="section-label">Internal Notes</p>'+
      '<label class="customer-note-field">Customer Note<textarea id="customerGeneralNote" placeholder="Write any important internal note about this customer or sale.">'+safe(data.sale.remarks||'')+'</textarea></label>'+
      '<div id="customerPartialNoteWrap"'+(partialEligible?'':' hidden')+'><label class="customer-note-field">Partial Booking Note <span class="customer-note-required">*</span><textarea id="customerPartialBookingNote" required placeholder="e.g. RM advised the remaining Down Payment to be completed by 01-Sep-2026.">'+safe(data.sale.partial_booking_note||'')+'</textarea></label><p class="customer-note-help">Mandatory for partial booking. Use it for the RM-advised completion follow-up; the contractual Down Payment schedule date stays unchanged.</p></div>'+
      '<button type="button" class="btn-paper" id="customerNotesSave">Save Notes</button><p id="customerNotesStatus"></p>';
    var anchor=detailAnchor(detail);
    if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',card);else detail.appendChild(card);
    var detailPartial=document.getElementById('customerPartialBookingNote');
    if(detailPartial)detailPartial.addEventListener('input',function(){if(detailPartial.value.trim())detailPartial.removeAttribute('aria-invalid');});
    var saveBtn=document.getElementById('customerNotesSave');
    saveBtn.addEventListener('click',async function(){
      var status=document.getElementById('customerNotesStatus');
      var general=val('customerGeneralNote');
      var partial=partialEligible?val('customerPartialBookingNote'):'';
      if(partialEligible&&!partial){
        var pta=document.getElementById('customerPartialBookingNote');
        if(pta){pta.setAttribute('aria-invalid','true');pta.focus();}
        if(status){status.style.color='var(--rust)';status.textContent='Partial Booking Note is required.';}
        return;
      }
      saveBtn.disabled=true;
      if(status){status.style.color='var(--muted)';status.textContent='Saving…';}
      try{
        var r=await sb.from('sales').update({
          remarks:general||null,
          partial_booking_note:partial||null,
          updated_at:new Date().toISOString()
        }).eq('id',data.sale.id);
        if(r.error)throw r.error;
        if(status){status.style.color='var(--muted)';status.textContent='Saved';}
        setTimeout(function(){if(status&&status.textContent==='Saved')status.textContent='';},1600);
      }catch(e){
        if(status){status.style.color='var(--rust)';status.textContent='Could not save: '+(e&&e.message?e.message:'Unknown error');}
      }finally{
        saveBtn.disabled=false;
      }
    });
  }catch(e){
    console.warn('Could not load customer notes',e);
  }finally{
    if(detail&&detail.dataset.customerNotesLoading===key)delete detail.dataset.customerNotesLoading;
  }
}
function decorate(){styles();decorateNewCustomer();flushPending();decorateDetail();}
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