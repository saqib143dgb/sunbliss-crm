(function(){
  'use strict';
  if (window.__sunblissFurnishingRefreshInstalled) return;
  function install(){
    if (typeof window.loadFromSupabase !== 'function' || !window.state){ setTimeout(install,50); return; }
    if (window.__sunblissFurnishingRefreshInstalled) return;
    window.__sunblissFurnishingRefreshInstalled = true;
    var previousLoad = window.loadFromSupabase;
    window.loadFromSupabase = async function(){
      var result = await previousLoad.apply(this,arguments);
      if (typeof window.renderMain === 'function') window.renderMain();
      return result;
    };
  }
  install();
})();
