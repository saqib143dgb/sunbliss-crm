(function(){
  'use strict';

  if (window.__sunblissMobileInputZoomGuardInstalled) return;
  window.__sunblissMobileInputZoomGuardInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissMobileInputZoomGuardStyle';
  style.textContent = [
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}',
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="hidden"]),select,textarea{box-sizing:border-box!important;max-width:100%!important;min-width:0!important;}',
    'input[type="date"],input[type="datetime-local"],input[type="month"],input[type="time"]{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;-webkit-min-logical-width:0!important;-webkit-appearance:none!important;appearance:none!important;}',
    '@media(max-width:900px){',
      'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="hidden"]),select,textarea,[contenteditable="true"]{font-size:16px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
