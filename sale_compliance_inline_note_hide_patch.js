(function(){
'use strict';
if(window.__sunblissSaleComplianceInlineNoteHideInstalled)return;
window.__sunblissSaleComplianceInlineNoteHideInstalled=true;

function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim().toLowerCase();}
function findEmiratesIdRow(detail){var labels=detail.querySelectorAll('.field-label');for(var i=0;i<labels.length;i++){if(norm(labels[i].textContent)==='emirates id')return labels[i].closest('.field-row,.field-address')||labels[i].parentElement;}return null;}
function isInstallmentLedger(node){return !!(node&&node.classList&&node.classList.contains('section-label')&&norm(node.textContent).indexOf('installment ledger')===0);}
function isProtected(node){if(!node||!node.matches)return true;if(node.matches('#customerNotesCard,#customerNotesHistoryPanel,#saleComplianceEditPanel,#customerEditPanel,#unitCancellationPanel'))return true;if(node.matches('.field-row,.field-address,.section-label,.ledger-scroll,.tx-list'))return true;if(node.querySelector('input,textarea,select,button'))return true;return false;}
function hideInlineSaleNote(){
  if(!window.state||state.view!=='detail')return;
  var detail=document.querySelector('.detail');if(!detail)return;
  var eidRow=findEmiratesIdRow(detail);if(!eidRow)return;
  var node=eidRow.nextElementSibling,guard=0;
  while(node&&guard++<12){
    if(isInstallmentLedger(node))break;
    var next=node.nextElementSibling;
    if(!isProtected(node)){var body=norm(node.textContent);if(body){node.style.display='none';node.dataset.saleComplianceInlineNoteHidden='1';}}
    node=next;
  }
}
function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissSaleNoteSyncWrapped)return;function wrapped(){var out=original.apply(this,arguments);hideInlineSaleNote();return out;}wrapped.__sunblissSaleNoteSyncWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped;}
function install(){
  wrap('renderDetail');wrap('renderMain');
  var root=document.getElementById('app')||document.body;
  if(window.MutationObserver)new MutationObserver(hideInlineSaleNote).observe(root,{childList:true,subtree:true});
  window.addEventListener('pageshow',hideInlineSaleNote);
  hideInlineSaleNote();
}
install();
})();
