(function(){
  'use strict';

  function normalizeLabel(value){
    return String(value || '').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function isRemovedAction(node){
    var label=normalizeLabel(node && (node.textContent || node.getAttribute && (node.getAttribute('aria-label')||node.getAttribute('title'))));
    var id=normalizeLabel(node && node.id).replace(/[^a-z0-9]/g,'');
    if(label==='email reminder') return true;
    if(label.indexOf('print reminder letter')!==-1 || label.indexOf('reminder letter')!==-1) return true;
    if(label.indexOf('print late charges')!==-1 || label.indexOf('late charges')!==-1 || label.indexOf('late charge')!==-1) return true;
    return id.indexOf('printreminder')!==-1 || id.indexOf('reminderletter')!==-1 || id.indexOf('printlate')!==-1 || id.indexOf('latecharge')!==-1;
  }

  function removeDeprecatedDetailActions(){
    if (!window.state || state.view !== 'detail') return;

    var welcome = document.getElementById('btnPrintWelcomeLetter');
    if (welcome) welcome.remove();

    document.querySelectorAll('.detail a,.detail button').forEach(function(node){
      if(isRemovedAction(node)) node.remove();
    });

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
