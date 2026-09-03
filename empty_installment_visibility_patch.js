(function(){
  'use strict';

  if(window.__sunblissEmptyInstallmentVisibilityInstalled)return;
  window.__sunblissEmptyInstallmentVisibilityInstalled=true;

  function number(value){
    var parsed=Number(value);
    return isFinite(parsed)?parsed:0;
  }
  function hasDate(value){
    if(!value)return false;
    if(value instanceof Date)return !isNaN(value.getTime());
    return String(value).trim()!=='';
  }
  function hasText(value){return value!==null&&value!==undefined&&String(value).trim()!=='';}
  function isEmptyStage(stage){
    if(!stage)return false;
    var dueMissing=stage.due===null||stage.due===undefined||Math.abs(number(stage.due))<0.005;
    var noActivity=[
      stage.paid,
      stage.cashPaid,
      stage.transactionCash,
      stage.settledAmount,
      stage.creditNoteTotal,
      stage.carryApplied
    ].every(function(value){return Math.abs(number(value))<0.005;});
    return dueMissing&&
      !hasDate(stage.dueDate)&&
      !hasDate(stage.paidDate)&&
      noActivity&&
      number(stage.transactionCount)===0&&
      !hasText(stage.remarks);
  }
  function selectedCustomer(){
    if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
    return state.dues.find(function(customer){
      return customer&&(String(customer.unit)+'::'+String(customer.sno))===String(state.selectedUnit);
    })||null;
  }
  function updateCards(){
    var customer=selectedCustomer();
    if(!customer||!Array.isArray(customer.stages))return;
    document.querySelectorAll('.detail .ledger-scroll .stage-card').forEach(function(card,index){
      var empty=isEmptyStage(customer.stages[index]);
      card.classList.toggle('sunbliss-empty-installment',empty);
      card.setAttribute('aria-hidden',empty?'true':'false');
    });
  }
  function wrapRenderDetail(){
    var original=window.renderDetail;
    if(typeof original!=='function'||original.__sunblissEmptyInstallmentWrapped)return false;
    window.renderDetail=function(){
      var result=original.apply(this,arguments);
      updateCards();
      return result;
    };
    window.renderDetail.__sunblissEmptyInstallmentWrapped=true;
    window.renderDetail.__sunblissOriginal=original;
    return true;
  }
  function install(){
    var style=document.createElement('style');
    style.id='sunblissEmptyInstallmentVisibilityStyles';
    style.textContent='.detail .ledger-scroll .stage-card.sunbliss-empty-installment{display:none!important;}';
    document.head.appendChild(style);
    if(!wrapRenderDetail())setTimeout(wrapRenderDetail,50);
    updateCards();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
