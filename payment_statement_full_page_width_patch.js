(function(){
  'use strict';

  if (window.__sunblissPaymentStatementFullPageWidthInstalled) return;
  window.__sunblissPaymentStatementFullPageWidthInstalled = true;

  function install(){
    if (document.getElementById('sunblissPaymentStatementFullPageWidthStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissPaymentStatementFullPageWidthStyles';
    style.textContent=[
      '@media print{',
      '  #printArea .professional-payment-statement>.ps-body{display:block!important;position:static!important;float:none!important;clear:both!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;height:auto!important;min-height:0!important;margin:0!important;padding:6.5mm 11.5mm 20mm 11.5mm!important;box-sizing:border-box!important;background:#fff!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;zoom:1!important;columns:auto!important;column-count:auto!important;}',
      '  #printArea .professional-payment-statement>.ps-body>.ps-customer,#printArea .professional-payment-statement>.ps-body>.ps-summary,#printArea .professional-payment-statement>.ps-body>.ps-section{width:100%!important;min-width:0!important;max-width:none!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;float:none!important;transform:none!important;}',
      '  #printArea .professional-payment-statement>.ps-body .ps-table{width:100%!important;max-width:none!important;}',
      '}',
      '@media screen{',
      '  #printArea .professional-payment-statement>.ps-body{display:block!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;margin:0!important;padding:6.5mm 11.5mm 20mm 11.5mm!important;box-sizing:border-box!important;background:#fff!important;transform:none!important;}',
      '  #printArea .professional-payment-statement>.ps-body>.ps-customer,#printArea .professional-payment-statement>.ps-body>.ps-summary,#printArea .professional-payment-statement>.ps-body>.ps-section{width:100%!important;max-width:none!important;box-sizing:border-box!important;}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
