(function(){
  'use strict';
  if(window.__sunblissBottomNavSmoothShadowInstalled)return;
  window.__sunblissBottomNavSmoothShadowInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBottomNavSmoothShadowStyle';
  style.textContent=[
    'body>.tabs{',
      'border:1px solid rgba(15,26,38,.58)!important;',
      'border-radius:999px!important;',
      'background:#f6f1e4!important;',
      'box-shadow:none!important;',
      '-webkit-box-shadow:none!important;',
      'filter:none!important;',
      '-webkit-filter:none!important;',
      '-webkit-backdrop-filter:none!important;',
      'backdrop-filter:none!important;',
      'overflow:hidden!important;',
      'background-clip:padding-box!important;',
      'overflow-anchor:none!important;',
    '}',
    'body>.tabs,body>.tabs *,body>.tabs::before,body>.tabs::after,body>.tabs *::before,body>.tabs *::after{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;text-shadow:none!important;}',
    'body>.tabs .tab{transition:none!important;will-change:auto!important;-webkit-tap-highlight-color:rgba(0,0,0,0)!important;tap-highlight-color:transparent!important;-webkit-appearance:none!important;appearance:none!important;outline:none!important;touch-action:manipulation!important;}',
    'body>.tabs .tab:not([aria-pressed="true"]),body>.tabs .tab:not([aria-pressed="true"]):hover,body>.tabs .tab:not([aria-pressed="true"]):active,body>.tabs .tab:not([aria-pressed="true"]):focus,body>.tabs .tab:not([aria-pressed="true"]):focus-visible{background:transparent!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"],body>.tabs .tab[aria-pressed="true"]:hover,body>.tabs .tab[aria-pressed="true"]:active,body>.tabs .tab[aria-pressed="true"]:focus{background:#ddd8cc!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"]::after{box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .dock-add,body>.tabs .dock-add:hover,body>.tabs .dock-add:active,body>.tabs .dock-add:focus{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;}',
    '@media(hover:none),(pointer:coarse){body>.tabs .tab{transition:none!important}body>.tabs .tab:not([aria-pressed="true"]):hover{background:transparent!important}}'
  ].join('');
  document.head.appendChild(style);

  /*
    Keep the browser viewport as the page scroller. The earlier viewport-anchor patch
    already owns dock positioning. Locking html/body and redirecting window.scroll()
    to #app caused Safari to repaint large parts of the CRM while scrolling.
  */
  function cleanupLegacyMobileShell(){
    document.documentElement.style.removeProperty('height');
    document.documentElement.style.removeProperty('min-height');
    document.documentElement.style.removeProperty('max-height');
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    document.body.style.removeProperty('min-height');
    document.body.style.removeProperty('max-height');
    document.body.style.removeProperty('overflow');
    document.body.classList.remove('sunbliss-vv-dock');
    var tabs=document.querySelector('body>.tabs');
    if(tabs){
      tabs.style.removeProperty('--sunbliss-vv-dock-y');
      tabs.style.removeProperty('top');
      tabs.setAttribute('data-sunbliss-dock-ready','1');
    }
  }

  cleanupLegacyMobileShell();
  window.addEventListener('pageshow',cleanupLegacyMobileShell,{passive:true});
})();
