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
      '#app{contain:layout style;}',
      '#main,.overview,.detail,.units,.insights{opacity:1!important;transform:none!important}',
      '.stage-card,.scheduled-task-card,.scheduled-overview-row,.notice,.card,.detail section{backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '@media(prefers-reduced-motion:no-preference){html{scroll-behavior:auto!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  installStyle();
  window.addEventListener('pageshow',installStyle);
})();
