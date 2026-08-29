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
      'isolation:isolate!important;',
      'background-clip:padding-box!important;',
      '-webkit-backface-visibility:hidden!important;',
      'backface-visibility:hidden!important;',
      'overflow-anchor:none!important;',
    '}',
    'body>.tabs,body>.tabs *,body>.tabs::before,body>.tabs::after,body>.tabs *::before,body>.tabs *::after{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;text-shadow:none!important;}',
    'body>.tabs .tab{transition:none!important;will-change:auto!important;-webkit-tap-highlight-color:rgba(0,0,0,0)!important;tap-highlight-color:transparent!important;-webkit-appearance:none!important;appearance:none!important;outline:none!important;touch-action:manipulation!important;}',
    'body>.tabs .tab:not([aria-pressed="true"]),body>.tabs .tab:not([aria-pressed="true"]):hover,body>.tabs .tab:not([aria-pressed="true"]):active,body>.tabs .tab:not([aria-pressed="true"]):focus,body>.tabs .tab:not([aria-pressed="true"]):focus-visible{background:transparent!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"],body>.tabs .tab[aria-pressed="true"]:hover,body>.tabs .tab[aria-pressed="true"]:active,body>.tabs .tab[aria-pressed="true"]:focus{background:#ddd8cc!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"]::after{box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .dock-add,body>.tabs .dock-add:hover,body>.tabs .dock-add:active,body>.tabs .dock-add:focus{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;}',
    '@media(hover:none),(pointer:coarse){body>.tabs .tab{transition:none!important}body>.tabs .tab:not([aria-pressed="true"]):hover{background:transparent!important}}',
    '@media(max-width:520px){',
      'html{height:100svh!important;min-height:100svh!important;max-height:100svh!important;overflow:hidden!important;overscroll-behavior:none!important;}',
      'body{position:relative!important;height:100svh!important;min-height:100svh!important;max-height:100svh!important;overflow:hidden!important;overscroll-behavior:none!important;}',
      '#app{height:100svh!important;min-height:0!important;max-height:100svh!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;scroll-behavior:auto!important;touch-action:pan-y!important;padding-bottom:calc(122px + env(safe-area-inset-bottom,0px))!important;}',
      'body>.tabs{position:absolute!important;left:8px!important;right:8px!important;top:auto!important;bottom:8px!important;width:auto!important;margin:0!important;transform:none!important;-webkit-transform:none!important;will-change:auto!important;contain:layout paint style!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  var nativeScrollTo=typeof window.scrollTo==='function'?window.scrollTo.bind(window):null;
  var nativeScroll=typeof window.scroll==='function'?window.scroll.bind(window):null;

  function mobileShellMode(){
    return !!(window.matchMedia&&window.matchMedia('(max-width:520px)').matches);
  }

  function appScroller(){
    return document.getElementById('app');
  }

  function scrollApp(args){
    var app=appScroller();
    if(!app)return false;
    var first=args[0];
    if(first&&typeof first==='object'){
      var top=Number.isFinite(Number(first.top))?Number(first.top):app.scrollTop;
      var left=Number.isFinite(Number(first.left))?Number(first.left):app.scrollLeft;
      if(typeof app.scrollTo==='function')app.scrollTo({top:top,left:left,behavior:first.behavior||'auto'});
      else{app.scrollTop=top;app.scrollLeft=left;}
    }else{
      var x=Number.isFinite(Number(args[0]))?Number(args[0]):0;
      var y=Number.isFinite(Number(args[1]))?Number(args[1]):0;
      if(typeof app.scrollTo==='function')app.scrollTo(x,y);
      else{app.scrollLeft=x;app.scrollTop=y;}
    }
    return true;
  }

  if(nativeScrollTo){
    window.scrollTo=function(){
      if(mobileShellMode()&&scrollApp(arguments))return;
      return nativeScrollTo.apply(window,arguments);
    };
  }
  if(nativeScroll){
    window.scroll=function(){
      if(mobileShellMode()&&scrollApp(arguments))return;
      return nativeScroll.apply(window,arguments);
    };
  }

  function stabilize(){
    if(!mobileShellMode())return;
    var app=appScroller();
    var tabs=document.querySelector('body>.tabs');
    if(app){
      app.style.webkitOverflowScrolling='touch';
      app.style.overflowY='auto';
    }
    if(tabs){
      tabs.style.removeProperty('--sunbliss-vv-dock-y');
      tabs.style.top='';
    }
    document.body.classList.remove('sunbliss-vv-dock');
  }

  window.addEventListener('pageshow',stabilize,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(stabilize,80);},{passive:true});
  stabilize();
})();
