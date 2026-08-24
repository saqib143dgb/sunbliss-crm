(function(){
  'use strict';

  function normalizeLabel(value){
    return String(value || '').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function removeDeprecatedDetailActions(){
    if (!window.state || state.view !== 'detail') return;

    // Remove the welcome-letter action entirely. Removing the node also
    // discards the button-specific click handler attached by the base app.
    var welcome = document.getElementById('btnPrintWelcomeLetter');
    if (welcome) welcome.remove();

    // Remove only the customer-facing Email reminder action. Keep WhatsApp,
    // formal overdue notices, and CRM escalation emails unchanged.
    document.querySelectorAll('.detail a.btn-paper').forEach(function(link){
      if (normalizeLabel(link.textContent) === 'email reminder') link.remove();
    });

    // Do not leave empty action rows behind after removing a button.
    document.querySelectorAll('.detail .reminder-actions').forEach(function(group){
      if (!group.querySelector('a,button')) group.remove();
    });
  }

  function install(){
    if (!window.state || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissDetailActionCleanupInstalled) return;
    window.__sunblissDetailActionCleanupInstalled = true;

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      removeDeprecatedDetailActions();
      return out;
    };

    if (state.view === 'detail') removeDeprecatedDetailActions();
  }

  install();
})();
