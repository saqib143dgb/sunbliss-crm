(function(){
'use strict';
if(window.__sunblissDetailStatusFlashFixInstalled)return;
window.__sunblissDetailStatusFlashFixInstalled=true;

var style=document.createElement('style');
style.id='detailStatusFlashFixStyles';
style.textContent=[
  '.detail #customerNotesCard{display:none!important}',
  '.detail,.detail *{animation:none!important;transition:none!important}',
  '.detail #actionRequiredCard,.detail #activeCustomerNoteCard,.detail #scheduledActionsDetail,.detail #detailAttentionPills{animation:none!important;transition:none!important}',
  '.detail .ledger-scroll{overflow-anchor:none!important}',
  '.topbar{animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header *{animation:none!important;transition:none!important}'
].join('');
document.head.appendChild(style);
})();
