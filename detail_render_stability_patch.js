(function(){
  'use strict';

  if (window.__sunblissDetailRenderStabilityInstalled) return;
  window.__sunblissDetailRenderStabilityInstalled = true;

  function currentMain(){
    var main = document.getElementById('main');
    if (main && window.mainEl !== main) window.mainEl = main;
    return main;
  }

  function repairShellIfNeeded(){
    if (currentMain()) return true;
    if (window.__sunblissShellRepairing) return false;
    if (!window.state || !state.userRole || typeof window.render !== 'function') return false;

    window.__sunblissShellRepairing = true;
    try {
      window.render();
    } catch (err) {
      console.error('Could not repair CRM shell', err);
    } finally {
      window.__sunblissShellRepairing = false;
    }
    return !!currentMain();
  }

  function closeDockSearch(){
    window.__sunblissDockSearchOpen = false;
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (panel) panel.classList.remove('is-open');
    var input = document.getElementById('dockPersistentSearchInput');
    if (input && typeof input.blur === 'function') input.blur();
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){
      button.setAttribute('aria-expanded','false');
    });
  }

  function wrapRenderer(name, closeSearch){
    var original = window[name];
    if (typeof original !== 'function' || original.__sunblissStableRender) return;

    function guarded(){
      if (closeSearch) closeDockSearch();
      if (!currentMain()) {
        repairShellIfNeeded();
        return;
      }
      return original.apply(this, arguments);
    }
    guarded.__sunblissStableRender = true;
    guarded.__sunblissOriginal = original;
    window[name] = guarded;
  }

  function wrapGoToDetail(){
    var original = window.goToDetail;
    if (typeof original !== 'function' || original.__sunblissStableDetailNav) return;

    function guardedGoToDetail(){
      closeDockSearch();
      if (!currentMain() && !repairShellIfNeeded()) return;
      return original.apply(this, arguments);
    }
    guardedGoToDetail.__sunblissStableDetailNav = true;
    window.goToDetail = guardedGoToDetail;
  }

  /*
    Do not override Node.prototype.textContent here. Native DOM properties are left
    untouched so every CRM module uses the browser's normal, predictable setters.
  */
  wrapRenderer('renderMain', false);
  wrapRenderer('renderDetail', true);
  wrapGoToDetail();

  window.addEventListener('pageshow', currentMain);
})();