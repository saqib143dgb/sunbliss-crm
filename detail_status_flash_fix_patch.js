(function(){
'use strict';
if(window.__sunblissDetailStatusFlashFixInstalled)return;
window.__sunblissDetailStatusFlashFixInstalled=true;

var style=document.createElement('style');
style.id='detailStatusFlashFixStyles';
style.textContent=[
  /* The legacy async notes card is superseded by active_note_front_page_patch.js.
     Keeping it display:none from first paint prevents it from briefly inserting
     between the badges and Action Required card while its async query resolves. */
  '.detail #customerNotesCard{display:none!important}',
  /* Safari can visibly animate/repaint these cards while nearby async DOM is settling. */
  '.detail #actionRequiredCard,.detail #activeCustomerNoteCard{animation:none!important;transition:none!important}',
  '.detail #actionRequiredCard *,.detail #activeCustomerNoteCard *{animation:none!important;transition:none!important}'
].join('');
document.head.appendChild(style);
})();
