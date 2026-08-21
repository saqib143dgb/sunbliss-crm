(function(){
  'use strict';

  var style = document.createElement('style');
  style.id = 'hideDuplicateRecordPaymentStyle';
  style.textContent = '#btnOpenPaymentForm{display:none!important;}';
  document.head.appendChild(style);
})();
