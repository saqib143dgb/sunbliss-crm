(function(){
  'use strict';
  if(window.__sunblissFullWidthPrintButtonsInstalled)return;
  window.__sunblissFullWidthPrintButtonsInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissFullWidthPrintButtonsStyles';
  style.textContent=[
    '#btnPrintReport,#btnPrintStatement{display:flex!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;justify-content:center!important;align-items:center!important;margin-left:0!important;margin-right:0!important;}',
    '#btnPrintStatement{flex:0 0 100%!important;}',
    '.detail>div:has(>#btnPrintStatement){flex-wrap:wrap!important;width:100%!important;}',
    '@supports not selector(:has(*)){#btnPrintStatement{min-width:100%!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
