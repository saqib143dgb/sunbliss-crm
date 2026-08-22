(function(){
  'use strict';

  if (window.__sunblissBottomNavInstalled) return;
  window.__sunblissBottomNavInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBottomNavStyle';
  style.textContent = [
    '#app{padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;}',
    '.tabs{position:fixed!important;left:50%!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;width:min(600px,calc(100vw - 20px))!important;z-index:1200!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;margin:0!important;padding:7px!important;background:rgba(246,241,228,.84)!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:999px!important;box-shadow:0 10px 30px rgba(15,26,38,.24),inset 0 1px 0 rgba(255,255,255,.72)!important;-webkit-backdrop-filter:blur(20px) saturate(1.18);backdrop-filter:blur(20px) saturate(1.18);}',
    '.tabs[data-dock-mode="crm"]{grid-template-columns:repeat(4,minmax(0,1fr))!important;}',
    '.tabs .tab{position:relative!important;min-width:0!important;min-height:58px!important;padding:6px 5px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--ink-2)!important;font-family:Inter,system-ui,sans-serif!important;font-size:10px!important;font-weight:600!important;line-height:1!important;letter-spacing:0!important;text-transform:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;transition:background .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease!important;}',
    '.tabs .tab[data-view="overview"]{order:1}.tabs .tab[data-view="insights"]{order:2}.tabs .dock-add{order:3}.tabs .dock-search{order:4}',
    '.tabs .tab[data-view="list"]{display:none!important;}',
    '.tabs .tab::before{content:"";display:block;width:25px;height:25px;flex:none;background:currentColor;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-size:contain;mask-position:center;mask-repeat:no-repeat;mask-size:contain;}',
    '.tabs .tab[data-view="overview"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");}',
    '.tabs .tab[data-view="insights"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-search::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M10.8%203a7.8%207.8%200%201%200%204.86%2013.9L21%2022l1-1-5.1-5.34A7.8%207.8%200%200%200%2010.8%203zm0%202a5.8%205.8%200%201%201%200%2011.6%205.8%205.8%200%200%201%200-11.6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M10.8%203a7.8%207.8%200%201%200%204.86%2013.9L21%2022l1-1-5.1-5.34A7.8%207.8%200%200%200%2010.8%203zm0%202a5.8%205.8%200%201%201%200%2011.6%205.8%205.8%200%200%201%200-11.6z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-add{background:var(--gold)!important;color:var(--ink-2)!important;box-shadow:0 5px 14px rgba(143,106,30,.24)!important;}',
    '.tabs .dock-add::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M11%205h2v6h6v2h-6v6h-2v-6H5v-2h6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M11%205h2v6h6v2h-6v6h-2v-6H5v-2h6z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-add:hover{background:#d6a63e!important;}',
    '.tabs .tab:hover{background:rgba(15,26,38,.055)!important;}',
    '.tabs .tab:active{transform:scale(.98)!important;}',
    '.tabs .tab[aria-pressed="true"]{background:rgba(15,26,38,.105)!important;color:var(--ink-2)!important;box-shadow:inset 0 0 0 1px rgba(15,26,38,.055),0 3px 12px rgba(15,26,38,.08)!important;}',
    '.tabs .tab[aria-pressed="true"]::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:var(--gold);top:9px;left:calc(50% + 13px);box-shadow:0 0 0 2px rgba(246,241,228,.92);}',
    '.tabs .tab:focus-visible{outline:2px solid var(--gold-deep)!important;outline-offset:2px!important;}',
    '.controls>.search{display:none!important;}',
    '#sunblissDockSearchPanel{display:none;position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));bottom:auto;transform:translateX(-50%);width:min(572px,calc(100vw - 32px));z-index:1305;margin:0;padding:10px 12px;background:rgba(246,241,228,.98);border:1px solid rgba(255,255,255,.92);border-radius:16px;box-shadow:0 12px 32px rgba(15,26,38,.25);-webkit-backdrop-filter:blur(18px) saturate(1.12);backdrop-filter:blur(18px) saturate(1.12);}',
    '#sunblissDockSearchPanel.is-open{display:block;}',
    '#dockPersistentSearchInput{box-sizing:border-box;width:100%;height:46px;margin:0;padding:0 14px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper);color:var(--ink);font:500 16px/1.2 Inter,system-ui,sans-serif;outline:none;box-shadow:inset 0 1px 1px rgba(15,26,38,.03);}',
    '#dockPersistentSearchInput:focus{border-color:var(--gold-deep);box-shadow:0 0 0 2px rgba(183,137,42,.12);}',
    '@media(max-width:420px){#app{padding-bottom:calc(106px + env(safe-area-inset-bottom))!important}.tabs{width:calc(100vw - 16px)!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;padding:6px!important;gap:2px!important}.tabs .tab{min-height:56px!important;font-size:9.5px!important;padding-left:3px!important;padding-right:3px!important}.tabs .tab::before{width:23px;height:23px}.tabs .dock-add{font-size:9px!important}#sunblissDockSearchPanel{width:calc(100vw - 20px);padding:9px 10px;}}'
  ].join('');
  document.head.appendChild(style);

  window.__sunblissDockSearchOpen = false;

  function isCrmOfficer(){
    if (window.state && window.state.userRole) return window.state.userRole === 'crm_officer';
    if (document.getElementById('btnAddCustomer')) window.__sunblissCanAddCustomer = true;
    return window.__sunblissCanAddCustomer === true;
  }

  function openUnits(){
    if (document.getElementById('searchInput')) return true;
    var listTab = document.querySelector('.tabs .tab[data-view="list"]');
    if (!listTab) return false;
    listTab.click();
    return true;
  }

  function syncPersistentSearch(value){
    var internal = document.getElementById('searchInput');
    if (!internal) return;
    if (internal.value !== value) internal.value = value;
    internal.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function ensureSearchPanel(){
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'sunblissDockSearchPanel';
    panel.setAttribute('role','search');

    var input = document.createElement('input');
    input.id = 'dockPersistentSearchInput';
    input.type = 'search';
    input.placeholder = 'Search unit or customer name';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('enterkeyhint','search');
    input.setAttribute('aria-label','Search unit or customer name');
    input.addEventListener('input',function(){ syncPersistentSearch(input.value); });

    panel.appendChild(input);
    document.body.appendChild(panel);
    return panel;
  }

  function positionSearchPanel(){
    if (!window.__sunblissDockSearchOpen) return;
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (!panel) return;
    var vv = window.visualViewport;
    var offsetTop = vv && Number.isFinite(vv.offsetTop) ? vv.offsetTop : 0;
    panel.style.top = Math.max(10, offsetTop + 10) + 'px';
  }

  function setSearchOpen(open){
    window.__sunblissDockSearchOpen = !!open;
    var panel = ensureSearchPanel();
    panel.classList.toggle('is-open',window.__sunblissDockSearchOpen);
    if (window.__sunblissDockSearchOpen) positionSearchPanel();
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){
      button.setAttribute('aria-expanded',String(window.__sunblissDockSearchOpen));
    });
  }

  function focusUnitsSearch(){
    if (window.__sunblissDockSearchOpen){
      setSearchOpen(false);
      return;
    }

    var panel = ensureSearchPanel();
    openUnits();

    var visibleInput = panel.querySelector('#dockPersistentSearchInput');
    var internal = document.getElementById('searchInput');
    if (visibleInput && internal) visibleInput.value = internal.value || '';

    window.__sunblissDockSearchOpen = true;
    panel.classList.add('is-open');
    positionSearchPanel();
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){ button.setAttribute('aria-expanded','true'); });

    if (visibleInput){
      try { visibleInput.focus({preventScroll:true}); } catch (e) { visibleInput.focus(); }
      try { visibleInput.setSelectionRange(visibleInput.value.length,visibleInput.value.length); } catch (e) {}
      window.requestAnimationFrame(positionSearchPanel);
      window.setTimeout(positionSearchPanel,80);
      window.setTimeout(positionSearchPanel,260);
    }
  }

  function openAddCustomer(){
    if (!isCrmOfficer()) return;
    setSearchOpen(false);
    openUnits();
    var add = document.getElementById('btnAddCustomer');
    if (add){ add.click(); return; }
    window.setTimeout(function(){
      var delayed = document.getElementById('btnAddCustomer');
      if (delayed) delayed.click();
    },40);
  }

  function makeAction(className,label,ariaLabel,handler){
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab dock-action ' + className;
    button.textContent = label;
    button.setAttribute('aria-label',ariaLabel);
    button.setAttribute('title',ariaLabel);
    button.addEventListener('click',handler);
    return button;
  }

  function decorateDock(tabs){
    if (!tabs) return;
    var crm = isCrmOfficer();
    tabs.setAttribute('data-dock-mode',crm ? 'crm' : 'standard');

    var search = tabs.querySelector('.dock-search');
    if (!search){
      search = makeAction('dock-search','Search','Search units or customers',focusUnitsSearch);
      search.setAttribute('aria-expanded',String(window.__sunblissDockSearchOpen));
      tabs.appendChild(search);
    }

    var add = tabs.querySelector('.dock-add');
    if (crm && !add){
      add = makeAction('dock-add','Add','Add new customer',openAddCustomer);
      tabs.appendChild(add);
    } else if (!crm && add){
      add.remove();
    }
  }

  function decorateAll(){
    document.querySelectorAll('.tabs').forEach(decorateDock);
  }

  ensureSearchPanel();
  decorateAll();

  if (window.visualViewport){
    window.visualViewport.addEventListener('resize',positionSearchPanel);
    window.visualViewport.addEventListener('scroll',positionSearchPanel);
  }
  window.addEventListener('resize',positionSearchPanel);
  window.addEventListener('orientationchange',function(){ window.setTimeout(positionSearchPanel,80); });

  document.addEventListener('pointerdown',function(event){
    if (!window.__sunblissDockSearchOpen) return;
    var panel = document.getElementById('sunblissDockSearchPanel');
    var trigger = event.target && event.target.closest ? event.target.closest('.dock-search') : null;
    if (trigger || (panel && panel.contains(event.target))) return;
    setSearchOpen(false);
  },true);

  document.addEventListener('keydown',function(event){
    if (event.key === 'Escape' && window.__sunblissDockSearchOpen) setSearchOpen(false);
  });

  document.addEventListener('click',function(event){
    var nav = event.target && event.target.closest ? event.target.closest('.tabs .tab[data-view="overview"],.tabs .tab[data-view="insights"]') : null;
    if (nav) setSearchOpen(false);
  },true);

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      observer.disconnect();
      try { decorateAll(); }
      finally { observer.observe(app,{childList:true,subtree:true}); }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
})();
