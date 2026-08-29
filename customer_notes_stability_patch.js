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

function containsNotesCard(node){
  if(!node||node.nodeType!==1)return false;
  if(node.id==='customerNotesCard')return true;
  return !!(node.querySelector&&node.querySelector('#customerNotesCard'));
}
function install(){
  var root=document.getElementById('app')||document.body;
  if(window.MutationObserver)new MutationObserver(function(mutations){
    for(var i=0;i<mutations.length;i++){
      for(var j=0;j<mutations[i].addedNodes.length;j++){
        if(containsNotesCard(mutations[i].addedNodes[j])){lockStableCard();return;}
      }
    }
  }).observe(root,{childList:true,subtree:true});
  requestAnimationFrame(lockStableCard);
}

install();
})();