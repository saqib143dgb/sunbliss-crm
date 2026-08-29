(function(){
  'use strict';
  if(window.__sunblissBottomNavSmoothShadowInstalled)return;
  window.__sunblissBottomNavSmoothShadowInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBottomNavSmoothShadowStyle';
  style.textContent=[
    'body>.tabs{',
      'bottom:calc(10px + env(safe-area-inset-bottom))!important;',
      'width:min(600px,calc(100vw - 20px))!important;',
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
      'isolation:isolate!important;',
      'contain:paint!important;',
      'background-clip:padding-box!important;',
    '}',
    'body>.tabs,body>.tabs *,body>.tabs::before,body>.tabs::after,body>.tabs *::before,body>.tabs *::after{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;text-shadow:none!important;}',
    'body>.tabs .tab{transition:none!important;will-change:auto!important;-webkit-tap-highlight-color:rgba(0,0,0,0)!important;tap-highlight-color:transparent!important;-webkit-appearance:none!important;appearance:none!important;outline:none!important;touch-action:manipulation!important;}',
    'body>.tabs .tab:not([aria-pressed="true"]),body>.tabs .tab:not([aria-pressed="true"]):hover,body>.tabs .tab:not([aria-pressed="true"]):active,body>.tabs .tab:not([aria-pressed="true"]):focus,body>.tabs .tab:not([aria-pressed="true"]):focus-visible{background:transparent!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"],body>.tabs .tab[aria-pressed="true"]:hover,body>.tabs .tab[aria-pressed="true"]:active,body>.tabs .tab[aria-pressed="true"]:focus{background:#ddd8cc!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"]::after{box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .dock-add,body>.tabs .dock-add:hover,body>.tabs .dock-add:active,body>.tabs .dock-add:focus{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;}',
    '@media(hover:none),(pointer:coarse){body>.tabs .tab{transition:none!important}body>.tabs .tab:not([aria-pressed="true"]):hover{background:transparent!important}}',
    '@media(max-width:520px){body>.tabs{left:8px!important;right:8px!important;width:auto!important;transform:none!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;}}'
  ].join('');
  document.head.appendChild(style);

  function clearTouchState(event){
    var tab=event.target&&event.target.closest?event.target.closest('body>.tabs .tab'):null;
    if(!tab)return;
    if(typeof tab.blur==='function')tab.blur();
    var tabs=tab.closest('.tabs');
    if(!tabs)return;
    requestAnimationFrame(function(){
      tabs.style.webkitTransform=tabs.style.webkitTransform||'';
      void tabs.offsetWidth;
    });
  }

  document.addEventListener('touchend',clearTouchState,true);
  document.addEventListener('pointerup',function(event){
    if(event.pointerType==='touch')clearTouchState(event);
  },true);
})();
