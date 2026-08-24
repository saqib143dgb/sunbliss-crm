(function(){
  'use strict';

  if (window.__sunblissPaymentPlanMenuOrderInstalled) return;
  window.__sunblissPaymentPlanMenuOrderInstalled = true;

  function renameDialog(){
    var title = document.getElementById('paymentDetailTitle');
    if (title) title.textContent = 'Edit payment plan';
  }

  function sync(){
    var item = document.getElementById('actionEditPaymentDetail');
    if (!item) return;

    item.textContent = 'Edit payment plan';
    item.setAttribute('aria-label','Edit payment plan');
    item.setAttribute('title','Edit payment plan');

    var menu = document.getElementById('customerActionMenu');
    var customerItem = document.getElementById('actionEditCustomer');
    if (menu && customerItem && customerItem.parentNode === menu && item.parentNode === menu && customerItem.nextElementSibling !== item){
      customerItem.insertAdjacentElement('afterend',item);
    }

    if (!item.__sunblissPaymentPlanRenameBound){
      item.__sunblissPaymentPlanRenameBound = true;
      item.addEventListener('click',function(){
        renameDialog();
        window.requestAnimationFrame(renameDialog);
      });
    }

    renameDialog();
  }

  if (typeof window.renderDetail === 'function'){
    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      sync();
      return out;
    };
  }

  window.addEventListener('pageshow',sync);
  window.addEventListener('popstate',sync);
  sync();
})();
