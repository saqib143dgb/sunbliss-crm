(function(){
  'use strict';

  if (window.__sunblissBottomNavInstalled) return;
  window.__sunblissBottomNavInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBottomNavStyle';
  style.textContent = [
    '#app{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important;}',
    '.tabs{position:fixed!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;width:min(640px,100vw)!important;z-index:1200!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;margin:0!important;padding:8px 12px calc(8px + env(safe-area-inset-bottom))!important;background:rgba(15,26,38,.97)!important;border-top:1px solid rgba(198,151,46,.28)!important;border-radius:16px 16px 0 0!important;box-shadow:0 -8px 24px rgba(15,26,38,.18)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);}',
    '.tabs .tab{position:relative!important;min-width:0!important;min-height:46px!important;padding:8px 8px!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;color:rgba(237,230,214,.68)!important;font-family:Inter,system-ui,sans-serif!important;font-size:11.5px!important;font-weight:600!important;letter-spacing:.02em!important;text-transform:none!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:background .15s ease,border-color .15s ease,color .15s ease,transform .12s ease!important;}',
    '.tabs .tab:hover{background:rgba(237,230,214,.07)!important;color:var(--cream-text)!important;}',
    '.tabs .tab:active{transform:translateY(1px)!important;}',
    '.tabs .tab[aria-pressed="true"]{background:rgba(198,151,46,.14)!important;border-color:rgba(198,151,46,.34)!important;color:#F1D99F!important;box-shadow:inset 0 2px 0 rgba(198,151,46,.95)!important;}',
    '.tabs .tab:focus-visible{outline:2px solid var(--gold)!important;outline-offset:2px!important;}',
    '@media(max-width:420px){.tabs{gap:5px!important;padding-left:8px!important;padding-right:8px!important}.tabs .tab{min-height:44px!important;font-size:11px!important;padding-left:5px!important;padding-right:5px!important;}}'
  ].join('');
  document.head.appendChild(style);
})();
