(function(){
  'use strict';
  if(window.__sunblissBottomNavFloatSpacingInstalled)return;
  window.__sunblissBottomNavFloatSpacingInstalled=true;
  var style=document.createElement('style');
  style.id='sunblissBottomNavFloatSpacingStyle';
  style.textContent=[
    '#app{padding-bottom:0!important}',
    '#app>main{padding-bottom:calc(108px + env(safe-area-inset-bottom))!important}',
    '.tabs{bottom:calc(22px + env(safe-area-inset-bottom))!important;width:min(600px,calc(100vw - 24px))!important}',
    '@media(max-width:420px){#app{padding-bottom:0!important}#app>main{padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}.tabs{bottom:calc(20px + env(safe-area-inset-bottom))!important;width:calc(100vw - 20px)!important}}'
  ].join('');
  document.head.appendChild(style);
})();
