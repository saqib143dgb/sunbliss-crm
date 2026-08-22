(function(){
  'use strict';

  if (window.__sunblissFooterSurfaceInstalled) return;
  window.__sunblissFooterSurfaceInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissFooterSurfaceStyle';
  style.textContent = [
    '#app{padding-bottom:0!important;}',
    'main{min-height:calc(100vh - 105px)!important;min-height:calc(100dvh - 105px)!important;padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;}',
    '.footnote.sunbliss-professional-footer{margin:0!important;padding:18px 18px 20px!important;text-align:center;font-family:"IBM Plex Mono",monospace;font-size:9.5px;line-height:1.45;letter-spacing:.04em;color:var(--muted);}',
    '@media(max-width:420px){main{padding-bottom:calc(106px + env(safe-area-inset-bottom))!important;}.footnote.sunbliss-professional-footer{padding:16px 14px 18px!important;font-size:9px;}}'
  ].join('');
  document.head.appendChild(style);

  var OLD_FOOTER = 'Figures are read directly from your uploaded workbook.';
  var NEW_FOOTER = 'Sunbliss Residences · Sales & Collections CRM';

  function refineFooter(){
    document.querySelectorAll('p.footnote').forEach(function(note){
      if (String(note.textContent || '').trim() !== OLD_FOOTER) return;
      note.textContent = NEW_FOOTER;
      note.classList.add('sunbliss-professional-footer');
    });
  }

  refineFooter();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    new MutationObserver(function(){ refineFooter(); }).observe(app,{childList:true,subtree:true});
  }
})();
