(function(){
'use strict';
if(window.__sunblissScheduledExtensionFilterFreezeFix)return;
window.__sunblissScheduledExtensionFilterFreezeFix=true;

/*
  Keep the Payment Extension editor stable while it is open. Earlier versions of
  this patch modified native innerHTML, textContent and select value setters across
  the whole CRM. Those global overrides are intentionally removed: the extension
  workflow now relies only on its own targeted refresh guard.
*/
function installPaymentExtensionPanelStability(){
  if(!window.PaymentExtensionsUI||typeof window.PaymentExtensionsUI.refresh!=='function'){
    setTimeout(installPaymentExtensionPanelStability,80);
    return;
  }
  if(window.PaymentExtensionsUI.__stableOpenPanel)return;
  var originalRefresh=window.PaymentExtensionsUI.refresh;
  window.PaymentExtensionsUI.refresh=function(){
    if(document.getElementById('paymentExtensionPanel'))return;
    return originalRefresh.apply(this,arguments);
  };
  window.PaymentExtensionsUI.__stableOpenPanel=true;
}

installPaymentExtensionPanelStability();
})();