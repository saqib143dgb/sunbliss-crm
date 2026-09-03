(function(){
  'use strict';

  // Intentionally reserve the swipe installer flag before the legacy
  // overview patch loads so no touch-swipe navigation listeners are added.
  window.__sunblissMobileTabSwipeInstalled=true;
  window.__sunblissSwipeNavigating=false;

  function cleanup(){
    document.documentElement.classList.remove('sbx-swipe-active');
    window.__sunblissSwipeNavigating=false;

    var stages=document.querySelectorAll('.sbx-swipe-stage');
    for(var i=0;i<stages.length;i++)stages[i].remove();

    var styles=document.getElementById('sunblissSwipeInteractiveStyles')||document.getElementById('sunblissSwipeDirectStyles')||document.getElementById('sunblissSwipeTransitionStyles');
    if(styles)styles.remove();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',cleanup,{once:true});
  }else{
    cleanup();
  }
  window.addEventListener('pageshow',cleanup);
})();
