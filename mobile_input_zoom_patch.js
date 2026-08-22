(function(){
  'use strict';

  if (window.__sunblissMobileInputZoomGuardInstalled) return;
  window.__sunblissMobileInputZoomGuardInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissMobileInputZoomGuardStyle';
  style.textContent = [
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}',
    '@media(max-width:900px){',
      'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="hidden"]),select,textarea,[contenteditable="true"]{font-size:16px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
