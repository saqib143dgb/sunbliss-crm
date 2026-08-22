(function(){
  'use strict';

  if (window.__sunblissBottomNavInstalled) return;
  window.__sunblissBottomNavInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBottomNavStyle';
  style.textContent = [
    '#app{padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;}',
    '.tabs{position:fixed!important;left:50%!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;width:min(600px,calc(100vw - 20px))!important;z-index:1200!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;margin:0!important;padding:7px!important;background:rgba(246,241,228,.84)!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:999px!important;box-shadow:0 10px 30px rgba(15,26,38,.24),inset 0 1px 0 rgba(255,255,255,.72)!important;-webkit-backdrop-filter:blur(20px) saturate(1.18);backdrop-filter:blur(20px) saturate(1.18);}',
    '.tabs .tab{position:relative!important;min-width:0!important;min-height:58px!important;padding:6px 8px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--ink-2)!important;font-family:Inter,system-ui,sans-serif!important;font-size:10.5px!important;font-weight:600!important;line-height:1!important;letter-spacing:0!important;text-transform:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;transition:background .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease!important;}',
    '.tabs .tab::before{content:"";display:block;width:25px;height:25px;flex:none;background:currentColor;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-size:contain;mask-position:center;mask-repeat:no-repeat;mask-size:contain;}',
    '.tabs .tab[data-view="overview"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");}',
    '.tabs .tab[data-view="insights"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");}',
    '.tabs .tab[data-view="list"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%203h16v18h-6v-5h-4v5H4V3zm3%203v2h2V6H7zm4%200v2h2V6h-2zm4%200v2h2V6h-2zM7%2010v2h2v-2H7zm4%200v2h2v-2h-2zm4%200v2h2v-2h-2z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%203h16v18h-6v-5h-4v5H4V3zm3%203v2h2V6H7zm4%200v2h2V6h-2zm4%200v2h2V6h-2zM7%2010v2h2v-2H7zm4%200v2h2v-2h-2zm4%200v2h2v-2h-2z%22/%3E%3C/svg%3E");}',
    '.tabs .tab:hover{background:rgba(15,26,38,.055)!important;}',
    '.tabs .tab:active{transform:scale(.98)!important;}',
    '.tabs .tab[aria-pressed="true"]{background:rgba(15,26,38,.105)!important;color:var(--ink-2)!important;box-shadow:inset 0 0 0 1px rgba(15,26,38,.055),0 3px 12px rgba(15,26,38,.08)!important;}',
    '.tabs .tab[aria-pressed="true"]::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:var(--gold);top:9px;left:calc(50% + 13px);box-shadow:0 0 0 2px rgba(246,241,228,.92);}',
    '.tabs .tab:focus-visible{outline:2px solid var(--gold-deep)!important;outline-offset:2px!important;}',
    '@media(max-width:420px){#app{padding-bottom:calc(106px + env(safe-area-inset-bottom))!important}.tabs{width:calc(100vw - 16px)!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;padding:6px!important}.tabs .tab{min-height:56px!important;font-size:10px!important}.tabs .tab::before{width:24px;height:24px}}'
  ].join('');
  document.head.appendChild(style);
})();
