(function(){
'use strict';
if(window.__sunblissScheduledExtensionRowRefineInstalled)return;
window.__sunblissScheduledExtensionRowRefineInstalled=true;

/*
  Presentation-only refinement for extension cards.

  IMPORTANT: this patch must not route extension tasks between Scheduled Actions
  filters or rewrite filter counts. Routing is owned by the Scheduled Actions
  filter layer, where extension_active tasks belong exclusively to Extensions.
  The previous implementation injected due-today extension rows into Today while
  the cleanup layer removed them again, creating a permanent DOM/count loop.
*/
if(!document.getElementById('scheduledExtensionRowTextRefineStyles')){
  var s=document.createElement('style');
  s.id='scheduledExtensionRowTextRefineStyles';
  s.textContent=[
    '.extension-reference-card .extref-label{font-size:10.4px!important;line-height:1.18!important}',
    '.extension-reference-card .extref-value{font-size:10.8px!important;line-height:1.18!important}',
    '@media(max-width:520px){.extension-reference-card .extref-label{font-size:9.7px!important}.extension-reference-card .extref-value{font-size:10.1px!important}}',
    '@media(max-width:370px){.extension-reference-card .extref-label{font-size:9.1px!important}.extension-reference-card .extref-value{font-size:9.5px!important}}'
  ].join('');
  document.head.appendChild(s);
}
})();
