(function(){
  'use strict';
  if(window.__sunblissGlobalVisualStabilityInstalled)return;
  window.__sunblissGlobalVisualStabilityInstalled=true;

  function installStyle(){
    if(document.getElementById('globalVisualStabilityStyles'))return;
    var style=document.createElement('style');
    style.id='globalVisualStabilityStyles';
    style.textContent=[
      '#app,#app *{animation:none!important;transition:none!important}',
      '#main,.overview,.detail,.units,.insights{opacity:1!important;transform:none!important}',
      '.detail .ledger-scroll,.overview,.detail,.units,.insights{overflow-anchor:none}',
      '@media(prefers-reduced-motion:no-preference){html{scroll-behavior:auto!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  /*
    Avoid layout containment and forced backface compositing on the whole CRM. Those
    optimizations create extra rendering layers on iOS Safari and can flash/ghost when
    large sections are replaced. Keep the stability patch limited to motion suppression.
  */
  installStyle();
  window.addEventListener('pageshow',installStyle);
})();
