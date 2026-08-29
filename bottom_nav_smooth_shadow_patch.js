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
      'border:1px solid rgba(255,255,255,.62)!important;',
      'border-radius:999px!important;',
      'background:rgba(246,241,228,.82)!important;',
      'box-shadow:none!important;',
      '-webkit-box-shadow:none!important;',
      'filter:none!important;',
      '-webkit-filter:none!important;',
      '-webkit-backdrop-filter:none!important;',
      'backdrop-filter:none!important;',
    '}',
    'body>.tabs,body>.tabs *,body>.tabs::before,body>.tabs::after,body>.tabs *::before,body>.tabs *::after{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;text-shadow:none!important;}',
    '@media(max-width:420px){body>.tabs{bottom:calc(8px + env(safe-area-inset-bottom))!important;width:calc(100vw - 16px)!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
