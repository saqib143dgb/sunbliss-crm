(function(){
  'use strict';

  var style = document.createElement('style');
  style.id = 'transactionUiRefineStyle';
  style.textContent = [
    '.tx-list .tx-actions-btn{width:24px!important;height:24px!important;border-radius:6px!important;font-size:17px!important;line-height:18px!important;}',
    '.tx-list .tx-actions-menu{top:28px!important;}'
  ].join('');
  document.head.appendChild(style);

  function removeRecordPaymentHeading(){
    document.querySelectorAll('.detail .section-label').forEach(function(label){
      if (label.textContent.trim().toLowerCase() === 'record a payment') label.remove();
    });
  }

  removeRecordPaymentHeading();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    new MutationObserver(removeRecordPaymentHeading).observe(app,{childList:true,subtree:true});
  }
})();
