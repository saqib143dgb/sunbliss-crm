(function(){
  'use strict';
  if(window.__sunblissBottomNavViewportAnchorInstalled)return;
  window.__sunblissBottomNavViewportAnchorInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBottomNavViewportAnchorStyles';
  style.textContent=[
    'body>.tabs{position:fixed!important;left:50%!important;right:auto!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;top:auto!important;transform:translateX(-50%)!important;width:min(600px,calc(100vw - 20px))!important;z-index:1200!important;margin:0!important;border-radius:999px!important}',
    'body.sunbliss-back-dock-mode> .tabs{display:none!important}',
    '#app{padding-bottom:calc(126px + env(safe-area-inset-bottom))!important}',
    '@media(max-width:420px){body>.tabs{bottom:calc(14px + env(safe-area-inset-bottom))!important;width:calc(100vw - 16px)!important}#app{padding-bottom:calc(120px + env(safe-area-inset-bottom))!important}}'
  ].join('');
  document.head.appendChild(style);

  function anchor(){
    var tabs=document.querySelector('#app .tabs')||document.querySelector('body>.tabs')||document.querySelector('.tabs');
    if(!tabs)return;
    if(tabs.parentNode!==document.body)document.body.appendChild(tabs);
    if(window.__sunblissBottomNavSmoothShadowInstalled)tabs.setAttribute('data-sunbliss-dock-ready','1');
    else tabs.removeAttribute('data-sunbliss-dock-ready');
  }

  function wrap(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sunblissBottomNavViewportWrapped)return;
    function wrapped(){
      var out=original.apply(this,arguments);
      anchor();
      return out;
    }
    wrapped.__sunblissBottomNavViewportWrapped=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }

  ['render','renderMain','renderOverview','renderList','renderInsights','renderDetail'].forEach(wrap);
  document.addEventListener('click',function(){setTimeout(anchor,0)},true);
  window.addEventListener('pageshow',anchor);
  window.addEventListener('resize',anchor);
  anchor();
})();
