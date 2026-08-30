(function(){
  'use strict';
  if(window.__sunblissBottomNavViewportAnchorInstalled)return;
  window.__sunblissBottomNavViewportAnchorInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBottomNavViewportAnchorStyles';
  style.textContent=[
    /* Never let a temporary dock created inside #app reach the screen. */
    '#app .tabs{visibility:hidden!important;pointer-events:none!important}',
    'body>.tabs{visibility:visible!important;pointer-events:auto!important;position:fixed!important;left:50%!important;right:auto!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;top:auto!important;transform:translateX(-50%)!important;-webkit-transform:translateX(-50%)!important;width:min(600px,calc(100vw - 20px))!important;z-index:1200!important;margin:0!important;border-radius:999px!important}',
    'body.sunbliss-back-dock-mode> .tabs{display:none!important}',
    '#app{padding-bottom:0!important}',
    '@media(max-width:420px){body>.tabs{bottom:calc(14px + env(safe-area-inset-bottom))!important;width:calc(100vw - 16px)!important}#app{padding-bottom:0!important}}'
  ].join('');
  document.head.appendChild(style);

  /*
   * The frozen base wireTabs() adds another click listener to every .tab on
   * every render. Because this dock is intentionally persistent, those
   * listeners stack up and each tap eventually triggers many renderMain()
   * calls. Wire only the freshly rendered dock inside #app. When that first
   * dock is promoted to body, its single listener moves with it permanently.
   */
  if(typeof window.wireTabs==='function'&&!window.wireTabs.__sunblissPersistentDockSafe){
    var safeWireTabs=function(){
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
    safeWireTabs.__sunblissPersistentDockSafe=true;
    window.wireTabs=safeWireTabs;
  }

  function copyButtonState(source,target){
    if(!source||!target)return;
    var pressed=source.getAttribute('aria-pressed');
    if(pressed!==null)target.setAttribute('aria-pressed',pressed);
    else target.removeAttribute('aria-pressed');
    var expanded=source.getAttribute('aria-expanded');
    if(expanded!==null)target.setAttribute('aria-expanded',expanded);
    else target.removeAttribute('aria-expanded');
  }

  function syncDockState(source,target){
    if(!source||!target||source===target)return;
    var mode=source.getAttribute('data-dock-mode');
    if(mode)target.setAttribute('data-dock-mode',mode);
    source.querySelectorAll('.tab[data-view]').forEach(function(sourceButton){
      var view=sourceButton.getAttribute('data-view');
      if(!view)return;
      var targetButton=target.querySelector('.tab[data-view="'+view.replace(/"/g,'\\"')+'"]');
      if(targetButton)copyButtonState(sourceButton,targetButton);
    });
  }

  function syncFromState(dock){
    if(!dock||!window.state)return;
    var view=state.view;
    if(view!=='overview'&&view!=='insights'&&view!=='list')return;
    dock.querySelectorAll('.tab[data-view]').forEach(function(button){
      button.setAttribute('aria-pressed',button.getAttribute('data-view')===view?'true':'false');
    });
  }

  function anchor(){
    var persistent=document.querySelector('body>.tabs');
    var incoming=document.querySelector('#app .tabs');

    if(persistent){
      if(incoming&&incoming!==persistent){
        syncDockState(incoming,persistent);
        incoming.remove();
      }
      syncFromState(persistent);
      return persistent;
    }

    var first=incoming||document.querySelector('.tabs');
    if(!first)return null;
    document.body.appendChild(first);
    syncFromState(first);
    return first;
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
  window.addEventListener('pageshow',anchor);
  anchor();
})();
