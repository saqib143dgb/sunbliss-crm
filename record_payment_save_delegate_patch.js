(function(){
'use strict';
if(window.__sunblissRecordPaymentSaveDelegateInstalled)return;
window.__sunblissRecordPaymentSaveDelegateInstalled=true;

function reliablePanel(){return document.getElementById('recordPaymentReliablePanel')}
function isSaveButton(target){return !!(target&&target.closest&&target.closest('#recordPaymentReliablePanel #pfSave'))}
function isReliableForm(target){return !!(target&&target.matches&&target.matches('#recordPaymentReliableForm'))}
function invokeSave(event){
  var panel=reliablePanel();
  if(!panel||typeof window.__sunblissRecordPaymentSave!=='function')return false;
  if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation()}
  try{
    var result=window.__sunblissRecordPaymentSave();
    if(result&&typeof result.catch==='function')result.catch(function(err){console.error('[Sunbliss] delegated payment save failed',err)});
  }catch(err){
    console.error('[Sunbliss] delegated payment save failed',err);
    var box=document.getElementById('recordPaymentReliableError');
    if(box){box.textContent=(err&&err.message)||'Could not save that payment.';box.style.display='block'}
    var button=document.getElementById('pfSave');
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
