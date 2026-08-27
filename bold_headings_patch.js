(function(){
  'use strict';
  if(window.__sunblissBoldHeadingsInstalled)return;
  window.__sunblissBoldHeadingsInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBoldHeadingsStyle';
  style.textContent=[
    'h1,h2,h3,h4,h5,h6{font-weight:700!important;}',
    '.title,.page-title,.section-title,.panel-title,.card-title,.detail-title,.editor-title,.modal-title,.overview-title,.insights-title,.report-title,.print-title,.ps-title{font-weight:700!important;}',
    '[class$="-title"],[class*="-title "],[class$="-heading"],[class*="-heading "]{font-weight:700!important;}',
    '.detail .name,.detail .customer-name,.broker-detail-name,.rm-detail-name,.ps-customer-name{font-weight:700!important;}',
    '.print-doc h1,.print-doc h2,.print-doc h3,.professional-payment-statement h1,.professional-payment-statement h2,.professional-payment-statement h3{font-weight:700!important;}',
    '#app .row-name,#app [class*="customer-name"],#app [class*="customerName"],#app [class*="customer_name"],#app .credit-note-mini-main,#monthlySalesOverlay .monthly-sale-customer{display:block!important;max-width:100%!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
    '#app .d-name{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;box-sizing:border-box!important;font-size:22px!important;line-height:1.15!important;font-weight:600!important;}',
    '#app .d-name>span:first-child{display:block!important;flex:1 1 auto!important;min-width:0!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-weight:600!important;}',
    '#app .d-name>span:last-child:not(:first-child){flex:0 0 auto!important;margin-left:auto!important;overflow:visible!important;}',
    '@media(max-width:420px){#app .d-name{font-size:20px!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
