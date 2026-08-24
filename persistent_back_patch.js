(function(){
  'use strict';

  if (window.__sunblissPersistentBackInstalled) return;
  window.__sunblissPersistentBackInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissPersistentBackStyles';
  style.textContent = [
    '#app #btnBack,#app button.back,#app a.back,#app .sunbliss-inline-back-source{display:none!important;}',
    '#app .detail-top-actions-sticky{position:static!important;top:auto!important;z-index:auto!important;padding:0!important;margin:0 0 10px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;justify-content:flex-end!important;}',
    '#app .detail-top-actions-sticky #btnPrintStatement{margin-left:auto!important;}',
    'body.sunbliss-back-dock-mode .tabs{display:none!important;}',
    '#sunblissPersistentBack{position:fixed;z-index:1298;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));display:none;align-items:center;justify-content:center;gap:6px;width:min(600px,calc(100vw - 20px));height:56px;padding:0 16px;box-sizing:border-box;border:1px solid rgba(255,255,255,.62);border-radius:999px;background:rgba(246,241,228,.50);color:var(--ink-2);font:650 12px/1 Inter,system-ui,sans-serif;box-shadow:0 7px 22px rgba(15,26,38,.16),inset 0 1px 0 rgba(255,255,255,.52);-webkit-backdrop-filter:blur(22px) saturate(1.16);backdrop-filter:blur(22px) saturate(1.16);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transform:translateX(-50%);transition:background .16s ease,box-shadow .16s ease,transform .12s ease;}',
    '#sunblissPersistentBack.is-visible{display:flex;}',
    '#sunblissPersistentBack::before{content:"";width:17px;height:17px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z%22/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z%22/%3E%3C/svg%3E") center/contain no-repeat;}',
    '#sunblissPersistentBack:hover{background:rgba(246,241,228,.62);box-shadow:0 8px 24px rgba(15,26,38,.18),inset 0 1px 0 rgba(255,255,255,.62);}',
    '#sunblissPersistentBack:active{transform:translateX(-50%) scale(.988);}',
    '#sunblissPersistentBack:focus-visible{outline:2px solid var(--gold-deep);outline-offset:3px;}',
    '@media(max-width:420px){#sunblissPersistentBack{bottom:calc(8px + env(safe-area-inset-bottom));width:calc(100vw - 16px);height:54px;padding:0 14px;font-size:11.8px;}}'
  ].join('');
  document.head.appendChild(style);

  function isBackText(value){
    return /^(?:\u2190|\u2039|<)?\s*Back\b/i.test(String(value || '').replace(/\s+/g,' ').trim());
  }

  function collectInlineBacks(){
    var app = document.getElementById('app');
    if (!app) return [];
    var found = [];
    app.querySelectorAll('button,a').forEach(function(el){
      if (!el || el.id === 'sunblissPersistentBack') return;
      var explicit = el.id === 'btnBack' || (el.classList && el.classList.contains('back'));
      if (!explicit && !isBackText(el.textContent)) return;
      el.classList.add('sunbliss-inline-back-source');
      el.setAttribute('aria-hidden','true');
      el.tabIndex = -1;
      found.push(el);
    });
    return found;
  }

  function preferredBackSource(sources){
    for (var i=0;i<sources.length;i++) if (sources[i].id === 'btnBack') return sources[i];
    return sources.length ? sources[sources.length - 1] : null;
  }

  function ensureButton(){
    var button = document.getElementById('sunblissPersistentBack');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'sunblissPersistentBack';
    button.textContent = 'Back';
    button.setAttribute('aria-label','Back to previous CRM screen');
    button.setAttribute('title','Back');
    button.addEventListener('click',function(){
      var sources = collectInlineBacks();
      var existing = preferredBackSource(sources);
      if (existing && existing.isConnected){
        existing.click();
        return;
      }
      if (!window.state) return;
      if (state.view === 'detail'){
        state.view = state.detailFrom || 'list';
        state.selectedUnit = null;
        if (typeof window.renderMain === 'function') window.renderMain();
        if (typeof window.scrollTo === 'function') window.scrollTo(0,0);
      }
    });
    document.body.appendChild(button);
    return button;
  }

  function closeDockSearch(){
    if (!window.__sunblissDockSearchOpen) return;
    window.__sunblissDockSearchOpen = false;
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (panel) panel.classList.remove('is-open');
    var input = document.getElementById('dockPersistentSearchInput');
    if (input && document.activeElement === input) input.blur();
  }

  function sync(){
    var button = ensureButton();
    var sources = collectInlineBacks();
    var detailVisible = !!(window.state && state.view === 'detail' && document.querySelector('.detail'));
    var shouldShow = detailVisible || sources.length > 0;
    button.classList.toggle('is-visible',shouldShow);
    button.setAttribute('aria-hidden',shouldShow ? 'false' : 'true');
    button.tabIndex = shouldShow ? 0 : -1;
    if (document.body) document.body.classList.toggle('sunbliss-back-dock-mode',shouldShow);
    if (shouldShow) closeDockSearch();
  }

  var observer = new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',sync);
  window.addEventListener('popstate',sync);
  window.addEventListener('resize',sync);
  sync();
})();
