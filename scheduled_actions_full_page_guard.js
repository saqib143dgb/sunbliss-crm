(function(){
  'use strict';
  if(window.__sunblissScheduledActionFullPageGuardInstalled)return;
  window.__sunblissScheduledActionFullPageGuardInstalled=true;

  var style=document.createElement('style');
  style.id='scheduledActionFullPageGuardStyles';
  style.textContent=[
    'body.scheduled-action-open{overflow:hidden!important;overscroll-behavior:none!important}',
    'body.scheduled-action-open .detail-top-actions-sticky{visibility:hidden!important;pointer-events:none!important}',
    '#scheduledActionPanel{position:fixed!important;inset:0!important;z-index:12200!important;width:100%!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#F6F1E4)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:110px!important}',
    '#scheduledActionPanel>.section-label:first-child{position:sticky!important;top:calc(-18px - env(safe-area-inset-top))!important;z-index:8!important;margin:calc(-18px - env(safe-area-inset-top)) -16px 12px!important;padding:calc(17px + env(safe-area-inset-top)) 16px 13px!important;background:var(--paper,#F6F1E4)!important;border-bottom:1px solid var(--paper-line,#DCD2B6)!important}',
    '#scheduledActionPanel .brand-editor-actions{position:sticky!important;bottom:calc(-26px - env(safe-area-inset-bottom))!important;z-index:9!important;margin:18px -16px calc(-26px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#F6F1E4)!important;border-top:1px solid var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important}',
    '#scheduledActionPanel .brand-editor-actions .btn,#scheduledActionPanel .brand-editor-actions .btn-paper{min-height:46px!important;margin:0!important}',
    '@media(max-width:520px){#scheduledActionPanel{padding-left:14px!important;padding-right:14px!important}#scheduledActionPanel>.section-label:first-child{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important}#scheduledActionPanel .brand-editor-actions{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important;flex-direction:column!important}#scheduledActionPanel .brand-editor-actions button{width:100%!important}}'
  ].join('');
  document.head.appendChild(style);

  function refresh(){document.body.classList.toggle('scheduled-action-open',!!document.getElementById('scheduledActionPanel'));}
  new MutationObserver(function(){requestAnimationFrame(refresh);}).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();
