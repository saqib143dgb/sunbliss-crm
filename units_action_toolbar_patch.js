(function(){
  'use strict';

  if (window.__sunblissUnitsActionToolbarInstalled) return;
  window.__sunblissUnitsActionToolbarInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissUnitsActionToolbarStyle';
  style.textContent = [
    '.units-action-toolbar{display:block;margin:0 0 10px;width:100%;}',
    '.units-action-toolbar>#btnToggleFilters{width:100%!important;height:42px!important;margin:0 0 8px!important;padding:0 13px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;background:var(--paper)!important;border:1px solid var(--paper-line)!important;color:var(--ink)!important;box-shadow:0 1px 2px rgba(15,26,38,.035)!important;font-size:12.5px!important;font-weight:600!important;line-height:1.1!important;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .12s ease;}',
    '.units-action-toolbar>#btnToggleFilters:hover,.units-action-toolbar>#btnToggleFilters:active{background:var(--paper-dim)!important;border-color:var(--gold-deep)!important;}',
    '.units-action-toolbar>#btnToggleFilters:active{transform:translateY(1px);}',
    '.units-action-toolbar>#btnToggleFilters .filter-toggle-left{display:flex;align-items:center;gap:6px;min-width:0;}',
    '.units-action-toolbar>#btnToggleFilters>svg{flex:none;width:14px;height:14px;}',
    '.units-action-toolbar .filter-badge{font-size:9px;padding:2px 5px;}',
    '.units-action-toolbar>.active-pills{margin:0 0 8px!important;}',
    '.units-action-toolbar>.filter-panel{margin:0 0 8px!important;}',
    '.units-secondary-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;}',
    '.units-secondary-actions.single-action{grid-template-columns:1fr;}',
    '.units-secondary-actions>#btnAddCustomer,.units-secondary-actions>#btnExportList{width:100%!important;min-width:0!important;height:42px!important;margin:0!important;padding:0 12px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;line-height:1.1!important;white-space:nowrap!important;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .12s ease;}',
    '.units-secondary-actions>#btnAddCustomer{background:var(--gold)!important;border:1px solid var(--gold)!important;color:var(--ink-2)!important;box-shadow:0 2px 7px rgba(143,106,30,.16)!important;}',
    '.units-secondary-actions>#btnAddCustomer:hover,.units-secondary-actions>#btnAddCustomer:active{background:#d6a63e!important;border-color:#d6a63e!important;}',
    '.units-secondary-actions>#btnExportList{background:var(--paper)!important;border:1px solid var(--paper-line)!important;color:var(--ink)!important;box-shadow:0 1px 2px rgba(15,26,38,.035)!important;}',
    '.units-secondary-actions>#btnExportList:hover,.units-secondary-actions>#btnExportList:active{background:var(--paper-dim)!important;border-color:var(--gold-deep)!important;}',
    '.units-secondary-actions>#btnAddCustomer:active,.units-secondary-actions>#btnExportList:active{transform:translateY(1px);}',
    '.units-secondary-actions svg{width:15px;height:15px;flex:none;}',
    '.units-action-toolbar>.brand-error{margin:8px 0 0!important;}',
    '@media(max-width:420px){.units-action-toolbar>#btnToggleFilters,.units-secondary-actions>#btnAddCustomer,.units-secondary-actions>#btnExportList{height:40px!important}.units-secondary-actions{gap:7px}.units-secondary-actions>#btnAddCustomer,.units-secondary-actions>#btnExportList{font-size:11.5px!important;padding-left:9px!important;padding-right:9px!important}.units-secondary-actions svg{width:14px;height:14px}}'
  ].join('');
  document.head.appendChild(style);

  function labelButtonOnce(button,label){
    if (!button || button.getAttribute('data-units-toolbar-labelled') === '1') return;
    var changed = false;
    Array.prototype.forEach.call(button.childNodes,function(node){
      if (node.nodeType === 3 && String(node.nodeValue || '').trim()){
        node.nodeValue = label;
        changed = true;
      }
    });
    if (!changed) button.appendChild(document.createTextNode(label));
    button.setAttribute('data-units-toolbar-labelled','1');
  }

  function refineUnitsActions(){
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    var controls = searchInput.closest ? searchInput.closest('.controls') : null;
    if (!controls) return;

    var search = controls.querySelector('.search');
    var add = controls.querySelector('#btnAddCustomer');
    var filters = controls.querySelector('#btnToggleFilters');
    var exportBtn = controls.querySelector('#btnExportList');
    var activePills = controls.querySelector('.active-pills');
    var filterPanel = controls.querySelector('.filter-panel');
    var exportError = controls.querySelector('#exportError');
    if (!search || !filters || !exportBtn) return;

    var toolbar = controls.querySelector('.units-action-toolbar');
    if (!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'units-action-toolbar';
      search.insertAdjacentElement('afterend',toolbar);
    }

    var actionRow = toolbar.querySelector('.units-secondary-actions');
    if (!actionRow){
      actionRow = document.createElement('div');
      actionRow.className = 'units-secondary-actions';
    }

    toolbar.appendChild(filters);
    if (activePills) toolbar.appendChild(activePills);
    if (filterPanel) toolbar.appendChild(filterPanel);

    if (add && add.parentElement !== actionRow) actionRow.appendChild(add);
    if (exportBtn.parentElement !== actionRow) actionRow.appendChild(exportBtn);
    actionRow.classList.toggle('single-action',!add);
    toolbar.appendChild(actionRow);
    if (exportError) toolbar.appendChild(exportError);

    if (add){
      labelButtonOnce(add,'Add Customer');
      add.setAttribute('aria-label','Add new customer');
      add.setAttribute('title','Add new customer');
    }
    labelButtonOnce(exportBtn,'Export');
    exportBtn.setAttribute('aria-label','Export this list');
    exportBtn.setAttribute('title','Export this list');
  }

  refineUnitsActions();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      // This function moves existing Units controls into the requested layout.
      // Pause observation while moving them so those moves do not recursively
      // trigger this same observer and lock the UI in a repaint loop.
      observer.disconnect();
      try {
        refineUnitsActions();
      } finally {
        observer.observe(app,{childList:true,subtree:true});
      }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
})();
