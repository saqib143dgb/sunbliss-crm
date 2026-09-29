(function(){
  'use strict';
  if(window.__sunblissInstallmentMenuButtonPositionInstalled)return;
  window.__sunblissInstallmentMenuButtonPositionInstalled=true;

  function ensureStyle(){
    if(document.getElementById('installmentMenuButtonPositionStyle'))return;
    var style=document.createElement('style');
    style.id='installmentMenuButtonPositionStyle';
    style.textContent=[
      '.ledger-scroll{padding-top:14px}',
      '.ledger-scroll .stage-card{position:relative}',
      '.ledger-scroll .stage-card .installment-menu-btn{position:absolute!important;top:-15px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;margin:0!important;z-index:12!important}',
      '@media(max-width:520px){.ledger-scroll{padding-top:14px}.ledger-scroll .stage-card .installment-menu-btn{top:-15px!important;left:50%!important;right:auto!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  ensureStyle();
  window.addEventListener('pageshow',ensureStyle);
})();
