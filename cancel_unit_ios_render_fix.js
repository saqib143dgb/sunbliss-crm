(function(){
  'use strict';
  if (window.__sunblissCancelUnitIOSRenderFixInstalled) return;
  window.__sunblissCancelUnitIOSRenderFixInstalled = true;

  var style=document.createElement('style');
  style.id='sunblissCancelUnitIOSRenderFixStyle';
  style.textContent=[
    'body.cancel-unit-render-safe,body.cancel-unit-render-safe #app,body.cancel-unit-render-safe main,body.cancel-unit-render-safe #main,body.cancel-unit-render-safe .detail{transform:none!important;filter:none!important;-webkit-filter:none!important;perspective:none!important;}',
    'body.cancel-unit-render-safe *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}',
    'body.cancel-unit-render-safe .detail-top-actions-sticky{position:relative!important;top:auto!important;background:var(--paper)!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}',
    'body.cancel-unit-render-safe #unitCancellationPanel{position:relative!important;z-index:1!important;transform:none!important;filter:none!important;-webkit-filter:none!important;opacity:1!important;isolation:auto!important;will-change:auto!important;backface-visibility:visible!important;-webkit-backface-visibility:visible!important;box-shadow:none!important;background:var(--paper)!important;}',
    'body.cancel-unit-render-safe #customerActionMenu{display:none!important;}',
    '@media(max-width:760px){body.cancel-unit-render-safe .tabs,body.cancel-unit-render-safe .bottom-nav,body.cancel-unit-render-safe [class*="bottom-nav"],body.cancel-unit-render-safe [class*="dock"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;transform:none!important;}}'
  ].join('');
  document.head.appendChild(style);

  var suppressInitialFocus=false;
  var clearTimer=null;

  function forceRepaint(){
    var main=document.getElementById('main') || document.querySelector('main');
    if (!main) return;
    void main.offsetHeight;
    main.style.visibility='hidden';
    void main.offsetHeight;
    main.style.visibility='';
  }

  function enterSafeMode(){
    if (clearTimer){ clearTimeout(clearTimer); clearTimer=null; }
    document.body.classList.add('cancel-unit-render-safe');
    suppressInitialFocus=true;
    setTimeout(function(){ suppressInitialFocus=false; },350);
    requestAnimationFrame(function(){ requestAnimationFrame(forceRepaint); });
  }

  function leaveSafeMode(){
    document.body.classList.remove('cancel-unit-render-safe');
    requestAnimationFrame(forceRepaint);
  }

  document.addEventListener('click',function(event){
    var target=event.target && event.target.closest ? event.target.closest('#actionCancelUnit') : null;
    if (target) enterSafeMode();

    var close=event.target && event.target.closest ? event.target.closest('#cuKeep') : null;
    if (close) setTimeout(leaveSafeMode,0);
  },true);

  document.addEventListener('focusin',function(event){
    if (!suppressInitialFocus) return;
    if (!document.body.classList.contains('cancel-unit-render-safe')) return;
    if (event.target && event.target.id==='cuReason'){
      try{ event.target.blur(); }catch(_e){}
    }
  },true);

  var observer=new MutationObserver(function(){
    if (!document.body.classList.contains('cancel-unit-render-safe')) return;
    if (document.getElementById('unitCancellationPanel')) return;
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer=setTimeout(function(){
      if (!document.getElementById('unitCancellationPanel')) leaveSafeMode();
    },500);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('pageshow',function(){
    document.body.classList.remove('cancel-unit-render-safe');
    forceRepaint();
  });
})();
