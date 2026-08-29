(function(){
  'use strict';
  if(window.__sunblissBottomNavNormalizeInstalled)return;
  window.__sunblissBottomNavNormalizeInstalled=true;
  var style=document.createElement('style');
  style.id='sunblissBottomNavNormalizeStyle';
  style.textContent=[
    '#app{padding-bottom:48px!important}',
    '.tabs{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;transform:none!important;width:100%!important;max-width:none!important;z-index:auto!important;margin:0!important;padding:8px 10px!important;background:var(--paper)!important;border:0!important;border-top:1px solid var(--paper-line)!important;border-radius:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    '.tabs .tab{border-radius:10px!important;min-height:56px!important}',
    '.tabs .tab[aria-pressed="true"]{background:var(--paper-dim)!important;box-shadow:none!important}',
    '.tabs .dock-add{border-radius:10px!important;box-shadow:none!important}',
    '@media(max-width:420px){#app{padding-bottom:48px!important}.tabs{width:100%!important;padding:7px 8px!important;bottom:auto!important}}'
  ].join('');
  document.head.appendChild(style);
})();
