(function(){
  'use strict';

  if (window.__sunblissDetailRenderStabilityInstalled) return;
  window.__sunblissDetailRenderStabilityInstalled = true;

  var scheduledBarrierToken = 0;

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

  function ensureScheduledBarrierStyles(){
    if (document.getElementById('scheduledDetailBarrierStyles')) return;
    var style = document.createElement('style');
    style.id = 'scheduledDetailBarrierStyles';
    style.textContent = [
      'html.sb-scheduled-detail-sync:not(.sbx-booting) #sbxLoader{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:opacity .12s ease!important,visibility 0s!important}',
      'html.sb-scheduled-detail-sync:not(.sbx-booting) #sbxRoutePill{opacity:1!important;transform:none!important}',
      'html.sb-scheduled-detail-sync:not(.sbx-booting) #sbxTopProgress{opacity:1!important}',
      'html.sb-scheduled-detail-sync:not(.sbx-booting) #app #main{opacity:.30!important;transform:translateY(7px) scale(.997)!important;filter:saturate(.82)!important;pointer-events:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function selectedUnitId(){
    if (!window.state || state.view !== 'detail' || !state.selectedUnit || !Array.isArray(state.dues)) return 0;
    var key = String(state.selectedUnit);
    var customer = state.dues.find(function(c){
      return c && (String(c.unit) + '::' + String(c.sno)) === key;
    });
    if (customer) return Number(customer.sno) || 0;
    var raw = key.split('::')[1];
    return Number(raw) || 0;
  }

  function scheduledCoreReady(){
    var core = window.PaymentExtensionsCore;
    var cache = core && core.cache;
    return !!(cache && cache.loaded && Array.isArray(cache.t));
  }

  function visibleTaskIds(){
    var section = document.getElementById('scheduledActionsDetail');
    if (!section) return [];
    return Array.prototype.slice.call(section.querySelectorAll('.scheduled-task-card[data-task-id]')).map(function(card){
      return Number(card.getAttribute('data-task-id'));
    }).filter(Boolean).sort(function(a,b){ return a-b; });
  }

  function sameIds(a,b){
    if (a.length !== b.length) return false;
    for (var i=0;i<a.length;i++) if (Number(a[i]) !== Number(b[i])) return false;
    return true;
  }

  function releaseScheduledBarrier(token){
    if (token !== scheduledBarrierToken) return;
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(function(){
        if (token !== scheduledBarrierToken) return;
        document.documentElement.classList.remove('sb-scheduled-detail-sync');
      });
    });
  }

  function waitForScheduledDom(token, unitId, expected, started){
    if (token !== scheduledBarrierToken) return;
    if (!window.state || state.view !== 'detail' || selectedUnitId() !== Number(unitId)) {
      releaseScheduledBarrier(token);
      return;
    }
    if (sameIds(visibleTaskIds(), expected) || Date.now() - started > 1800) {
      releaseScheduledBarrier(token);
      return;
    }
    window.setTimeout(function(){ waitForScheduledDom(token, unitId, expected, started); }, 30);
  }

  function beginScheduledBarrier(){
    if (!window.state || state.view !== 'detail' || !window.sb) return;
    if (state.userRole !== 'crm_officer' && state.userRole !== 'manager') return;
    if (scheduledCoreReady()) return;
    var unitId = selectedUnitId();
    if (!unitId) return;

    ensureScheduledBarrierStyles();
    var token = ++scheduledBarrierToken;
    document.documentElement.classList.add('sb-scheduled-detail-sync');
    var started = Date.now();

    Promise.resolve(sb.from('scheduled_actions').select('id').eq('unit_id',unitId).eq('status','pending')).then(function(result){
      if (token !== scheduledBarrierToken) return;
      if (result && result.error) throw result.error;
      var expected = ((result && result.data) || []).map(function(row){ return Number(row.id); }).filter(Boolean).sort(function(a,b){ return a-b; });
      waitForScheduledDom(token, unitId, expected, started);
    }).catch(function(err){
      console.warn('[Sunbliss] scheduled detail readiness check failed', err);
      releaseScheduledBarrier(token);
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
      if (name === 'renderDetail') beginScheduledBarrier();
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
  ensureScheduledBarrierStyles();
  wrapRenderer('renderMain', false);
  wrapRenderer('renderDetail', true);
  wrapGoToDetail();

  window.addEventListener('pageshow', function(){
    currentMain();
    if (window.state && state.view === 'detail') beginScheduledBarrier();
  });
})();