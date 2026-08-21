(function(){
  'use strict';

  var style = document.createElement('style');
  style.id = 'transactionUiRefineStyle';
  style.textContent = [
    '.tx-list .tx-actions-btn{width:22px!important;height:22px!important;border-radius:6px!important;font-size:16px!important;line-height:16px!important;}',
    '.tx-list .tx-actions-menu{top:26px!important;}',
    '.tx-list .tx-row>.tx-date,.tx-list .tx-row>.tx-amt{align-self:center!important;}',
    '.tx-list .tx-row>.tx-main{align-self:stretch!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}',
    '.tx-list .tx-row>.tx-main>.tx-status:empty{display:none!important;}'
  ].join('');
  document.head.appendChild(style);

  function refineTransactionActions(){
    document.querySelectorAll('.tx-list .tx-actions-btn').forEach(function(btn){
      var wrap = btn.parentElement;
      if (wrap) wrap.style.setProperty('align-self','center','important');
    });
  }

  function removeRecordPaymentHeading(){
    document.querySelectorAll('.detail .section-label').forEach(function(label){
      if (label.textContent.trim().toLowerCase() === 'record a payment') label.remove();
    });
  }

  function refineDetail(){
    refineTransactionActions();
    removeRecordPaymentHeading();
  }

  refineDetail();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    new MutationObserver(refineDetail).observe(app,{childList:true,subtree:true});
  }
})();
