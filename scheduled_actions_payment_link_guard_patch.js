(function(){
'use strict';
if(window.__sunblissScheduledPaymentLinkGuardInstalled)return;
window.__sunblissScheduledPaymentLinkGuardInstalled=true;

function text(v){return v==null?'':String(v)}
function value(id){var el=document.getElementById(id);return el?text(el.value).trim():''}
function isPaymentRelated(){
  var action=value('saAction');
  if(action==='Other')action=value('saCustom');
  // Notes may quote payment clauses while the action is about an SPA or document.
  // Classify the requested action, not incidental wording in its notes.
  return /(payment|installment|dld|admin fee|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection)/i.test(action);
}

// A payment-related manual action must point to a concrete payment obligation.
// This prevents a general/manual task from coexisting with the automatic card
// for the same installment simply because schedule_id was left blank.
document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('#saSave'):null;
  if(!btn)return;
  var select=document.getElementById('saRelatedSchedule');
  if(!select||!isPaymentRelated()||value('saRelatedSchedule'))return;
  var hasPayment=false;
  Array.prototype.forEach.call(select.options||[],function(o){if(text(o.value).trim())hasPayment=true;});
  if(!hasPayment)return;

  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation)e.stopImmediatePropagation();

  var err=document.getElementById('saError');
  if(err){
    err.textContent='Select the related payment obligation so the CRM can prevent duplicate follow-up cards.';
    err.style.display='block';
  }
  try{select.focus();}catch(_){ }
},true);
})();
