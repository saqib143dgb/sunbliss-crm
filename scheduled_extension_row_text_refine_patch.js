(function(){
'use strict';
if(document.getElementById('scheduledExtensionRowTextRefineStyles'))return;
var s=document.createElement('style');
s.id='scheduledExtensionRowTextRefineStyles';
s.textContent=[
  '.extension-reference-card .extref-label{font-size:8.8px!important}',
  '.extension-reference-card .extref-value{font-size:9px!important}',
  '@media(max-width:520px){.extension-reference-card .extref-label{font-size:8.25px!important}.extension-reference-card .extref-value{font-size:8.47px!important}}',
  '@media(max-width:370px){.extension-reference-card .extref-label,.extension-reference-card .extref-value{font-size:7.8px!important}}'
].join('');
document.head.appendChild(s);
})();