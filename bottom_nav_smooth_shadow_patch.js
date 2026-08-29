(function(){
  'use strict';
  if(window.__sunblissBottomNavSmoothShadowInstalled)return;
  window.__sunblissBottomNavSmoothShadowInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBottomNavSmoothShadowStyle';
  style.textContent=[
    'body>.tabs{',
      'bottom:10px!important;',
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
      'background-clip:padding-box!important;',
      '-webkit-backface-visibility:hidden!important;',
      'backface-visibility:hidden!important;',
    '}',
    'body>.tabs,body>.tabs *,body>.tabs::before,body>.tabs::after,body>.tabs *::before,body>.tabs *::after{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;text-shadow:none!important;}',
    'body>.tabs .tab{transition:none!important;will-change:auto!important;-webkit-tap-highlight-color:rgba(0,0,0,0)!important;tap-highlight-color:transparent!important;-webkit-appearance:none!important;appearance:none!important;outline:none!important;touch-action:manipulation!important;}',
    'body>.tabs .tab:not([aria-pressed="true"]),body>.tabs .tab:not([aria-pressed="true"]):hover,body>.tabs .tab:not([aria-pressed="true"]):active,body>.tabs .tab:not([aria-pressed="true"]):focus,body>.tabs .tab:not([aria-pressed="true"]):focus-visible{background:transparent!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"],body>.tabs .tab[aria-pressed="true"]:hover,body>.tabs .tab[aria-pressed="true"]:active,body>.tabs .tab[aria-pressed="true"]:focus{background:#ddd8cc!important;transform:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .tab[aria-pressed="true"]::after{box-shadow:none!important;-webkit-box-shadow:none!important;}',
    'body>.tabs .dock-add,body>.tabs .dock-add:hover,body>.tabs .dock-add:active,body>.tabs .dock-add:focus{box-shadow:none!important;-webkit-box-shadow:none!important;filter:none!important;-webkit-filter:none!important;}',
    '@media(hover:none),(pointer:coarse){body>.tabs .tab{transition:none!important}body>.tabs .tab:not([aria-pressed="true"]):hover{background:transparent!important}}',
    '@media(max-width:520px){',
      'body.sunbliss-vv-dock>.tabs{',
        'position:fixed!important;',
        'left:8px!important;',
        'right:8px!important;',
        'top:0!important;',
        'bottom:auto!important;',
        'width:auto!important;',
        'margin:0!important;',
        'transform:translate3d(0,var(--sunbliss-vv-dock-y),0)!important;',
        '-webkit-transform:translate3d(0,var(--sunbliss-vv-dock-y),0)!important;',
        'will-change:transform!important;',
        '-webkit-backface-visibility:hidden!important;',
        'backface-visibility:hidden!important;',
        'contain:paint!important;',
      '}',
    '}'
  ].join('');
  document.head.appendChild(style);

  var vv=window.visualViewport;
  var dock=null;
  var dockHeight=0;
  var raf=0;
  var activeUntil=0;
  var lastY=null;
  var gap=8;

  function mobileViewportMode(){
    return !!vv && window.matchMedia && window.matchMedia('(max-width:520px)').matches;
  }

  function findDock(){
    var next=document.querySelector('body>.tabs');
    if(next!==dock){
      dock=next;
      dockHeight=0;
      lastY=null;
    }
    return dock;
  }

  function measureDock(){
    if(!findDock())return 0;
    var h=dock.getBoundingClientRect().height;
    if(h>0)dockHeight=h;
    return dockHeight;
  }

  function positionDock(){
    raf=0;
    if(!mobileViewportMode()){
      document.body.classList.remove('sunbliss-vv-dock');
      return;
    }
    if(!findDock())return;
    if(!dockHeight)measureDock();
    if(!dockHeight)return;

    var viewportBottom=vv.offsetTop+vv.height;
    var y=viewportBottom-dockHeight-gap;
    var dpr=window.devicePixelRatio||1;
    y=Math.round(y*dpr)/dpr;

    if(lastY===null||Math.abs(y-lastY)>=0.25){
      dock.style.setProperty('--sunbliss-vv-dock-y',y+'px');
      lastY=y;
    }
    if(!document.body.classList.contains('sunbliss-vv-dock')){
      document.body.classList.add('sunbliss-vv-dock');
    }

    if(performance.now()<activeUntil){
      raf=requestAnimationFrame(positionDock);
    }
  }

  function kick(duration){
    if(!mobileViewportMode())return;
    activeUntil=Math.max(activeUntil,performance.now()+(duration||260));
    if(!raf)raf=requestAnimationFrame(positionDock);
  }

  function remeasureAndKick(){
    dockHeight=0;
    lastY=null;
    measureDock();
    kick(700);
  }

  if(vv){
    vv.addEventListener('resize',function(){kick(700);},{passive:true});
    vv.addEventListener('scroll',function(){kick(500);},{passive:true});
  }
  window.addEventListener('scroll',function(){kick(420);},{passive:true});
  window.addEventListener('resize',remeasureAndKick,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(remeasureAndKick,80);},{passive:true});
  window.addEventListener('pageshow',remeasureAndKick,{passive:true});

  document.addEventListener('touchstart',function(){kick(900);},{passive:true,capture:true});
  document.addEventListener('touchmove',function(){kick(500);},{passive:true,capture:true});
  document.addEventListener('touchend',function(){kick(700);},{passive:true,capture:true});
  document.addEventListener('touchcancel',function(){kick(500);},{passive:true,capture:true});

  measureDock();
  kick(900);
})();
