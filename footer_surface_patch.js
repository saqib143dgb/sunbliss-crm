(function(){
  'use strict';
  if (window.__sunblissFooterSurfaceInstalled) return;
  window.__sunblissFooterSurfaceInstalled = true;

  var style=document.createElement('style');style.id='sunblissFooterSurfaceStyle';style.textContent=[
    '#app{padding-bottom:0!important;min-height:100vh!important;min-height:100dvh!important;display:flex!important;flex-direction:column!important;background:var(--paper,#f6f1e4)!important;}',
    '#app>.topbar{flex:0 0 auto!important;}','#app>main{flex:1 0 auto!important;min-height:0!important;box-sizing:border-box!important;padding-bottom:calc(88px + env(safe-area-inset-bottom))!important;background:var(--paper,#f6f1e4)!important;}',
    'body.sunbliss-back-dock-mode{background:var(--paper,#f6f1e4)!important;}','body.sunbliss-back-dock-mode #app{background:var(--paper,#f6f1e4)!important;}',
    '.tabs .dock-add{background:transparent!important;color:var(--ink-2)!important;box-shadow:none!important;}','.tabs .dock-add:hover{background:rgba(15,26,38,.055)!important;}',
    '.footnote.sunbliss-professional-footer{margin:0!important;padding:14px 18px 16px!important;text-align:center;font-family:"IBM Plex Mono",monospace;font-size:9.5px;line-height:1.45;letter-spacing:.04em;color:var(--muted);}',
    '@media(max-width:720px){html,body{background:var(--paper,#f6f1e4)!important;background-image:none!important;}#app{background:var(--paper,#f6f1e4)!important;}}','@media(max-width:420px){#app>main{padding-bottom:calc(80px + env(safe-area-inset-bottom))!important;}.footnote.sunbliss-professional-footer{padding:12px 14px 14px!important;font-size:9px;}}'
  ].join('');document.head.appendChild(style);

  var OLD_FOOTER='Figures are read directly from your uploaded workbook.';
  var NEW_FOOTER='Sunbliss Residences · CRM';
  function refineFooter(){document.querySelectorAll('p.footnote').forEach(function(note){if(String(note.textContent||'').trim()!==OLD_FOOTER)return;note.textContent=NEW_FOOTER;note.classList.add('sunbliss-professional-footer');});}
  var queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refineFooter();});}
  function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissFooterWrapped)return;function wrapped(){var out=original.apply(this,arguments);queue();return out;}wrapped.__sunblissFooterWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped;}
  wrap('render');wrap('renderMain');wrap('renderOverview');wrap('renderDetail');wrap('renderList');window.addEventListener('pageshow',queue);queue();
})();

