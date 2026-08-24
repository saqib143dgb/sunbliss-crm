(function(){
  'use strict';

  if (window.__sunblissPersistentBackInstalled) return;
  window.__sunblissPersistentBackInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissPersistentBackStyles';
  style.textContent = [
    '#sunblissPersistentBack{position:fixed;z-index:1298;left:max(14px,calc(50vw - 306px));bottom:calc(88px + env(safe-area-inset-bottom));display:none;align-items:center;justify-content:center;gap:7px;min-width:88px;height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.72);border-radius:999px;background:rgba(22,35,47,.94);color:var(--paper);font:700 13px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 26px rgba(15,26,38,.28);-webkit-backdrop-filter:blur(16px) saturate(1.1);backdrop-filter:blur(16px) saturate(1.1);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '#sunblissPersistentBack.is-visible{display:flex;}',
    '#sunblissPersistentBack::before{content:"";width:18px;height:18px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z%22/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z%22/%3E%3C/svg%3E") center/contain no-repeat;}',
    '#sunblissPersistentBack:hover{background:rgba(15,26,38,.98);}',
    '#sunblissPersistentBack:active{transform:scale(.97);}',
    '#sunblissPersistentBack:focus-visible{outline:3px solid rgba(198,151,46,.55);outline-offset:3px;}',
    '@media(max-width:640px){#sunblissPersistentBack{left:14px;bottom:calc(84px + env(safe-area-inset-bottom));}}',
    '@media(max-width:420px){#sunblissPersistentBack{left:10px;bottom:calc(80px + env(safe-area-inset-bottom));min-width:82px;height:44px;padding:0 13px;}}'
  ].join('');
  document.head.appendChild(style);

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
      var existing = document.getElementById('btnBack');
      if (existing){
        existing.click();
        return;
      }
      if (!window.state) return;
      state.view = state.detailFrom || 'list';
      state.selectedUnit = null;
      if (typeof window.renderMain === 'function') window.renderMain();
      if (typeof window.scrollTo === 'function') window.scrollTo(0,0);
    });
    document.body.appendChild(button);
    return button;
  }

  function sync(){
    var button = ensureButton();
    var detailVisible = !!(window.state && state.view === 'detail' && document.querySelector('.detail'));
    button.classList.toggle('is-visible',detailVisible);
    button.setAttribute('aria-hidden',detailVisible ? 'false' : 'true');
    button.tabIndex = detailVisible ? 0 : -1;
  }

  var observer = new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',sync);
  window.addEventListener('popstate',sync);
  window.addEventListener('resize',sync);
  sync();
})();
