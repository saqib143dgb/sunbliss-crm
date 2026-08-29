(function(){
  'use strict';
  if(window.__sunblissBottomNavSmoothShadowInstalled)return;
  window.__sunblissBottomNavSmoothShadowInstalled=true;
  var style=document.createElement('style');
  style.id='sunblissBottomNavSmoothShadowStyle';
  style.textContent=[
    'body>.tabs{',
      'box-shadow:',
        '0 2px 5px rgba(15,26,38,.05),',
        '0 7px 18px rgba(15,26,38,.09),',
        '0 16px 38px rgba(15,26,38,.10),',
        '0 26px 58px rgba(15,26,38,.06),',
        'inset 0 1px 0 rgba(255,255,255,.72)!important;',
    '}',
    '@media(max-width:520px){body>.tabs{box-shadow:0 2px 5px rgba(15,26,38,.05),0 6px 16px rgba(15,26,38,.09),0 14px 32px rgba(15,26,38,.10),0 22px 46px rgba(15,26,38,.06),inset 0 1px 0 rgba(255,255,255,.72)!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
