(function(){
  'use strict';

  if (window.__sunblissDockOrderInstalled) return;
  window.__sunblissDockOrderInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissDockOrderStyle';
  style.textContent = [
    '.tabs .dock-add{order:3!important;}',
    '.tabs .tab[data-view="list"]{order:4!important;}',
    '.tabs .dock-search{order:5!important;}'
  ].join('');
  document.head.appendChild(style);
})();
