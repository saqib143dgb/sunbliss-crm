(function(){
  'use strict';

  if (window.__sunblissPaymentStatementReferenceMatchInstalled) return;
  window.__sunblissPaymentStatementReferenceMatchInstalled = true;

  function install(){
    if (document.getElementById('sunblissPaymentStatementReferenceMatchStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissPaymentStatementReferenceMatchStyles';
    style.textContent=[
      '@media print{',
      '  @page{size:A4 portrait;margin:0!important;}',
      '  html,body{margin:0!important;padding:0!important;background:#fff!important;width:210mm!important;min-width:210mm!important;}',
      '  body>*:not(#printArea){display:none!important;}',
      '  #printArea{display:block!important;position:static!important;width:210mm!important;height:297mm!important;min-height:297mm!important;margin:0!important;padding:0!important;background:#fff!important;overflow:hidden!important;}',
      '  #printArea .professional-payment-statement{display:block!important;position:relative!important;width:210mm!important;height:297mm!important;min-height:297mm!important;max-height:297mm!important;margin:0!important;padding:0!important;overflow:hidden!important;box-shadow:none!important;background:#fff!important;color:#26313e!important;font-family:Arial,Inter,sans-serif!important;}',
      '  #printArea .ps-gold-rail{left:0!important;top:26mm!important;bottom:0!important;width:1.1mm!important;background:#b78a2d!important;}',
      '  #printArea .ps-header{height:26mm!important;padding:5.55mm 11.5mm 4.5mm 11.5mm!important;background:#102a40!important;color:#fff!important;}',
      '  #printArea .ps-company{font-family:Arial,Inter,sans-serif!important;font-size:3.2mm!important;font-weight:700!important;letter-spacing:.015em!important;color:#fff!important;}',
      '  #printArea .ps-company-rule{width:38mm!important;height:.65mm!important;background:#c79a37!important;margin:1.25mm 0 1.45mm!important;}',
      '  #printArea .ps-title{font-family:Arial,Inter,sans-serif!important;font-size:7.15mm!important;line-height:1!important;font-weight:700!important;letter-spacing:-.02em!important;color:#fff!important;}',
      '  #printArea .ps-header-right{font-family:Arial,Inter,sans-serif!important;font-size:2.65mm!important;line-height:1.45!important;color:#dce4ea!important;padding-top:.35mm!important;}',
      '  #printArea .ps-header-right strong{font-size:2.95mm!important;color:#fff!important;margin-top:2.05mm!important;}',
      '  #printArea .ps-body{padding:6.5mm 11.5mm 20mm 11.5mm!important;}',
      '  #printArea .ps-customer{height:17mm!important;min-height:17mm!important;margin-bottom:5.2mm!important;padding:3.8mm 5mm!important;border-radius:2.7mm!important;background:#f4f5f7!important;}',
      '  #printArea .ps-mini-label{font-size:2.15mm!important;font-weight:700!important;color:#66707d!important;margin-bottom:1.2mm!important;}',
      '  #printArea .ps-customer-name{font-size:4.6mm!important;line-height:1.05!important;font-weight:700!important;color:#202b38!important;}',
      '  #printArea .ps-customer-meta{font-size:2.55mm!important;color:#7a8490!important;}',
      '  #printArea .ps-summary{grid-template-columns:repeat(4,1fr)!important;gap:2.4mm!important;margin-bottom:4.3mm!important;}',
      '  #printArea .ps-card{height:21.5mm!important;border:1px solid #d8dde2!important;border-radius:2.3mm!important;padding:4mm 3.8mm 3.2mm 4.8mm!important;background:#fff!important;}',
      '  #printArea .ps-card:before{width:1.25mm!important;border-radius:2.3mm 0 0 2.3mm!important;}',
      '  #printArea .ps-card-label{font-size:2.05mm!important;font-weight:700!important;color:#69737e!important;letter-spacing:.04em!important;margin-bottom:2.4mm!important;}',
      '  #printArea .ps-card-value{font-size:4.3mm!important;line-height:1.05!important;font-weight:700!important;color:#26313e!important;white-space:nowrap!important;}',
      '  #printArea .ps-progress{height:1.25mm!important;margin-top:3.2mm!important;background:#e5e8eb!important;}',
      '  #printArea .ps-progress span{background:#b78a2d!important;}',
      '  #printArea .ps-section{margin-top:3.5mm!important;break-inside:avoid!important;page-break-inside:avoid!important;}',
      '  #printArea .ps-section h2{font-family:Arial,Inter,sans-serif!important;font-size:4.45mm!important;line-height:1.1!important;font-weight:700!important;color:#1c2734!important;margin:0!important;}',
      '  #printArea .ps-heading-rule{width:12mm!important;height:.75mm!important;background:#b78a2d!important;margin:1.25mm 0 3.2mm!important;}',
      '  #printArea .ps-table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;border:1px solid #d9dde2!important;border-radius:1.6mm!important;overflow:hidden!important;font-family:Arial,Inter,sans-serif!important;font-size:2.45mm!important;line-height:1.18!important;table-layout:fixed!important;}',
      '  #printArea .ps-table th{background:#12344f!important;color:#fff!important;text-align:left!important;padding:2.1mm 2.8mm!important;font-size:2.1mm!important;font-weight:700!important;letter-spacing:.025em!important;}',
      '  #printArea .ps-table td{padding:1.75mm 2.8mm!important;border-bottom:1px solid #e6e8eb!important;color:#303a45!important;vertical-align:middle!important;}',
      '  #printArea .ps-table tbody tr:nth-child(even) td{background:#f7f8f9!important;}',
      '  #printArea .ps-table tbody tr:last-child td{border-bottom:none!important;}',
      '  #printArea .ps-installments th:nth-child(1){width:29%!important;}#printArea .ps-installments th:nth-child(2){width:19%!important;}#printArea .ps-installments th:nth-child(3){width:18%!important;}#printArea .ps-installments th:nth-child(4){width:18%!important;}#printArea .ps-installments th:nth-child(5){width:16%!important;}',
      '  #printArea .ps-transactions th:nth-child(1){width:23%!important;}#printArea .ps-transactions th:nth-child(2){width:57%!important;}#printArea .ps-transactions th:nth-child(3){width:20%!important;}',
      '  #printArea .ps-transactions td:last-child,#printArea .ps-transactions th:last-child{text-align:right!important;}',
      '  #printArea .ps-footer{left:11.5mm!important;right:11.5mm!important;bottom:7.2mm!important;border-top:1px solid #d7dade!important;padding-top:3.1mm!important;font-family:Arial,Inter,sans-serif!important;font-size:1.95mm!important;color:#7b858e!important;}',
      '}',
      '@media screen{',
      '  #printArea .professional-payment-statement{width:210mm!important;min-height:297mm!important;margin:0 auto!important;background:#fff!important;}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
