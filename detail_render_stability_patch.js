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

  function suppressRedundantUiTextMutations(){
    try {
      var descriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
      if (!descriptor || !descriptor.get || !descriptor.set) return;
      var nativeGet = descriptor.get;
      var nativeSet = descriptor.set;
      var stableLeafSelector = [
        '.detail .d-type',
        '.detail .badges .badge',
        '.detail .money-label',
        '.detail .money-value',
        '.detail .stage-row > span',
        '#paymentDetailDialog .payment-detail-row-meta > span',
        '#installmentEditDialog #ieStatus'
      ].join(',');

      function stableSet(value){
        var next = value === null || value === undefined ? '' : String(value);
        var isTarget = this && this.nodeType === 1 && this.matches && this.matches(stableLeafSelector);
        if (isTarget && nativeGet.call(this) === next) return;
        return nativeSet.call(this, value);
      }

      Object.defineProperty(Node.prototype, 'textContent', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: nativeGet,
        set: stableSet
      });
    } catch (err) {
      console.warn('Could not install CRM redundant-text mutation guard', err);
    }
  }

  suppressRedundantUiTextMutations();
  wrapRenderer('renderMain', false);
  wrapRenderer('renderDetail', true);
  wrapGoToDetail();

  window.addEventListener('pageshow', currentMain);
})();
