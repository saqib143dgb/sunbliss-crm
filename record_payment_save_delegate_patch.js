(function(){
'use strict';
if(window.__sunblissRecordPaymentSaveDelegateInstalled)return;
window.__sunblissRecordPaymentSaveDelegateInstalled=true;

var paymentFieldIds=['recordPaymentReliableForm','recordPaymentReliableError','pfStage','pfAmount','pfDate','pfRef','pfRemarks','pfCreditFields','pfCreditAmount','pfCreditDate','pfCreditReason','pfCreditRef','pfSave','pfCancel'];
var pointerStart=null;
var lastPointerAction={kind:'',at:0};

function reliablePanel(){return document.getElementById('recordPaymentReliablePanel')}
function closestInPanel(target,selector){
  var panel=reliablePanel(),node=target&&target.closest?target.closest(selector):null;
  return panel&&node&&panel.contains(node)?node:null;
}
function isSaveButton(target){return !!closestInPanel(target,'#pfSave')}
function isCreditToggle(target){return !!closestInPanel(target,'#pfCreditToggle')}
function isReliableForm(target){var panel=reliablePanel();return !!(panel&&target&&target.matches&&target.matches('#recordPaymentReliableForm')&&panel.contains(target))}
function actionKind(target){if(isSaveButton(target))return'save';if(isCreditToggle(target))return'credit';return''}
function ensureInteractionStyles(){
  if(document.getElementById('recordPaymentTapReliabilityStyles'))return;
  var s=document.createElement('style');s.id='recordPaymentTapReliabilityStyles';
  s.textContent='#recordPaymentReliablePanel #pfSave,#recordPaymentReliablePanel #pfCreditToggle{pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(0,0,0,0)!important;position:relative!important;z-index:42!important}';
  document.head.appendChild(s);
}
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
function stop(event){
  if(!event)return;
  event.preventDefault();
  event.stopPropagation();
  if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
}
function invokeSave(event){
  var panel=reliablePanel();
  if(!panel||typeof window.__sunblissRecordPaymentSave!=='function')return false;
  stop(event);
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
function toggleCredit(event){
  var panel=reliablePanel(),toggle=panel&&panel.querySelector('#pfCreditToggle'),box=panel&&panel.querySelector('#pfCreditFields');
  if(!toggle||!box)return false;
  stop(event);
  var opening=box.hasAttribute('hidden')||box.hidden||window.getComputedStyle(box).display==='none';
  if(opening){
    box.removeAttribute('hidden');box.hidden=false;box.style.setProperty('display','block','important');
    toggle.setAttribute('aria-expanded','true');toggle.textContent='− Remove credit note';
  }else{
    box.setAttribute('hidden','');box.hidden=true;box.style.setProperty('display','none','important');
    toggle.setAttribute('aria-expanded','false');toggle.textContent='+ Add credit note (optional)';
  }
  return true;
}
function invokeAction(kind,event){
  if(kind==='save')return invokeSave(event);
  if(kind==='credit')return toggleCredit(event);
  return false;
}

/*
  Mobile Safari can lose a synthetic click when a full-screen form is restyled after
  insertion. Resolve the user's actual tap on pointerup instead. Requiring the same
  action at pointerdown/pointerup plus a small movement threshold prevents accidental
  activation while scrolling. The click/submit handlers remain as keyboard/fallback paths.
*/
document.addEventListener('pointerdown',function(event){
  var kind=actionKind(event.target);if(!kind){pointerStart=null;return}
  pointerStart={kind:kind,id:event.pointerId,x:Number(event.clientX)||0,y:Number(event.clientY)||0};
},true);
document.addEventListener('pointerup',function(event){
  var kind=actionKind(event.target),start=pointerStart;pointerStart=null;
  if(!kind||!start||start.kind!==kind||start.id!==event.pointerId)return;
  var dx=(Number(event.clientX)||0)-start.x,dy=(Number(event.clientY)||0)-start.y;
  if(Math.sqrt(dx*dx+dy*dy)>12)return;
  if(invokeAction(kind,event))lastPointerAction={kind:kind,at:Date.now()};
},true);
document.addEventListener('pointercancel',function(){pointerStart=null},true);

document.addEventListener('click',function(event){
  var kind=actionKind(event.target);if(!kind)return;
  if(kind==='credit'&&event.defaultPrevented)return;
  if(lastPointerAction.kind===kind&&Date.now()-lastPointerAction.at<800){stop(event);return}
  invokeAction(kind,event);
},true);

document.addEventListener('submit',function(event){
  if(!isReliableForm(event.target))return;
  if(lastPointerAction.kind==='save'&&Date.now()-lastPointerAction.at<800){stop(event);return}
  invokeSave(event);
},true);

ensureInteractionStyles();
})();
