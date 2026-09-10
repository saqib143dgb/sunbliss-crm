(function(){
'use strict';
if(window.__sunblissRecordPaymentSaveDelegateInstalled)return;
window.__sunblissRecordPaymentSaveDelegateInstalled=true;

var paymentFieldIds=['recordPaymentReliableForm','recordPaymentReliableError','pfStage','pfAmount','pfDate','pfRef','pfRemarks','pfCreditFields','pfCreditAmount','pfCreditDate','pfCreditReason','pfCreditRef','pfSave','pfCancel'];

function reliablePanel(){return document.getElementById('recordPaymentReliablePanel')}
function isSaveButton(target){return !!(target&&target.closest&&target.closest('#recordPaymentReliablePanel #pfSave'))}
function isReliableForm(target){return !!(target&&target.matches&&target.matches('#recordPaymentReliableForm'))}
function isolateReliableForm(panel){
  var changed=[];
  paymentFieldIds.forEach(function(id){
    var selector='[id="'+id+'"]';
    document.querySelectorAll(selector).forEach(function(node){
      if(node===panel||panel.contains(node))return;
      changed.push({node:node,id:id});
      node.removeAttribute('id');
      node.setAttribute('data-sunbliss-shadow-payment-id',id);
    });
  });
  return function(){
    changed.forEach(function(item){
      if(!item.node||!item.node.isConnected)return;
      if(!item.node.hasAttribute('id'))item.node.setAttribute('id',item.id);
      item.node.removeAttribute('data-sunbliss-shadow-payment-id');
    });
  };
}
function invokeSave(event){
  var panel=reliablePanel();
  if(!panel||typeof window.__sunblissRecordPaymentSave!=='function')return false;
  if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation()}
  var restore=isolateReliableForm(panel);
  try{
    var result=window.__sunblissRecordPaymentSave();
    if(result&&typeof result.then==='function'){
      Promise.resolve(result).catch(function(err){console.error('[Sunbliss] delegated payment save failed',err)}).finally(restore);
    }else restore();
  }catch(err){
    restore();
    console.error('[Sunbliss] delegated payment save failed',err);
    var box=panel.querySelector('#recordPaymentReliableError');
    if(box){box.textContent=(err&&err.message)||'Could not save that payment.';box.style.display='block'}
    var button=panel.querySelector('#pfSave');
    if(button){button.disabled=false;button.textContent='Save payment'}
  }
  return true;
}

document.addEventListener('click',function(event){
  if(!isSaveButton(event.target))return;
  invokeSave(event);
},true);

document.addEventListener('submit',function(event){
  if(!isReliableForm(event.target))return;
  invokeSave(event);
},true);
})();
