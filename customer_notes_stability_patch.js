(function(){
'use strict';
if(window.__sunblissCustomerNotesStabilityInstalled)return;
window.__sunblissCustomerNotesStabilityInstalled=true;

function lockStableCard(){
  if(!window.state||state.view!=='detail'||!state.selectedUnit)return;
  var detail=document.querySelector('.detail');
  var card=document.getElementById('customerNotesCard');
  if(!detail||!card||!detail.contains(card))return;
  var key=String(state.selectedUnit);
  if(card.dataset.noteKey!==key)return;
  detail.dataset.customerNotesLoading=key;
}

function install(){
  var root=document.getElementById('app')||document.body;
  new MutationObserver(function(){lockStableCard();}).observe(root,{childList:true,subtree:true});
  requestAnimationFrame(lockStableCard);
}

install();
})();
