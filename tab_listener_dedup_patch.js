(function(){
  'use strict';
  if(window.__sunblissTabListenerDedupInstalled)return;
  window.__sunblissTabListenerDedupInstalled=true;

  /*
   * The frozen base wireTabs() scans every .tab in document and adds a new
   * click listener on every render. The bottom dock is persistent, so those
   * listeners accumulate and one tap eventually triggers many renderMain()
   * calls. Only wire the freshly-rendered dock inside #app. When that node is
   * promoted to body by the viewport-anchor patch, its single listener moves
   * with it and is never rebound.
   */
  window.wireTabs=function(){
    var app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('.tabs .tab[data-view]').forEach(function(button){
      if(button.__sunblissTabNavigationBound)return;
      button.__sunblissTabNavigationBound=true;
      button.addEventListener('click',function(){
        var view=button.getAttribute('data-view');
        if(!view||!window.state)return;
        if(state.view===view){
          if(typeof window.scrollTo==='function')window.scrollTo(0,0);
          return;
        }
        state.view=view;
        if(typeof window.renderMain==='function')window.renderMain();
        if(typeof window.scrollTo==='function')window.scrollTo(0,0);
      });
    });
  };
})();
