(function(){
  'use strict';
  if(window.__sunblissBottomNavSmoothShadowInstalled)return;
  window.__sunblissBottomNavSmoothShadowInstalled=true;
  var style=document.createElement('style');
  style.id='sunblissBottomNavSmoothShadowStyle';
  style.textContent=[
    'body>.tabs{',
      'box-shadow:',
        '0 1px 2px rgba(15,26,38,.018),',
        '0 3px 8px rgba(15,26,38,.025),',
        '0 8px 20px rgba(15,26,38,.032),',
        '0 16px 38px rgba(15,26,38,.038),',
        '0 28px 64px rgba(15,26,38,.028)!important;',
    '}',
    '@media(max-width:520px){body>.tabs{box-shadow:0 1px 2px rgba(15,26,38,.016),0 3px 8px rgba(15,26,38,.022),0 8px 18px rgba(15,26,38,.030),0 15px 34px rgba(15,26,38,.034),0 25px 54px rgba(15,26,38,.024)!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
