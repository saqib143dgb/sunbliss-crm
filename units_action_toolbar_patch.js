(function(){
  'use strict';

  if (window.__sunblissUnitsActionToolbarInstalled) return;
  window.__sunblissUnitsActionToolbarInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissUnitsActionToolbarStyle';
  style.textContent = [
    '.units-action-toolbar{display:grid;gap:8px;margin:0 0 10px;width:100%;}',
    '.units-action-toolbar.three-actions{grid-template-columns:repeat(3,minmax(0,1fr));}',
    '.units-action-toolbar.two-actions{grid-template-columns:repeat(2,minmax(0,1fr));}',
    '.units-action-toolbar>#btnAddCustomer,.units-action-toolbar>#btnExportList,.units-action-toolbar>#btnToggleFilters{width:100%!important;min-width:0!important;height:42px!important;margin:0!important;padding:0 10px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;line-height:1.1!important;white-space:nowrap!important;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .12s ease;}',
    '.units-action-toolbar>#btnAddCustomer{background:var(--gold)!important;border-color:var(--gold)!important;color:var(--ink-2)!important;box-shadow:0 2px 7px rgba(143,106,30,.16)!important;}',
    '.units-action-toolbar>#btnAddCustomer:hover,.units-action-toolbar>#btnAddCustomer:active{background:#d6a63e!important;border-color:#d6a63e!important;}',
    '.units-action-toolbar>#btnToggleFilters,.units-action-toolbar>#btnExportList{background:var(--paper)!important;border:1px solid var(--paper-line)!important;color:var(--ink)!important;box-shadow:0 1px 2px rgba(15,26,38,.035)!important;}',
    '.units-action-toolbar>#btnToggleFilters:hover,.units-action-toolbar>#btnToggleFilters:active,.units-action-toolbar>#btnExportList:hover,.units-action-toolbar>#btnExportList:active{background:var(--paper-dim)!important;border-color:var(--gold-deep)!important;}',
    '.units-action-toolbar>#btnAddCustomer:active,.units-action-toolbar>#btnToggleFilters:active,.units-action-toolbar>#btnExportList:active{transform:translateY(1px);}',
    '.units-action-toolbar>#btnToggleFilters{justify-content:center!important;}',
    '.units-action-toolbar>#btnToggleFilters .filter-toggle-left{justify-content:center;gap:5px;min-width:0;}',
    '.units-action-toolbar>#btnToggleFilters>svg{flex:none;width:14px;height:14px;margin-left:-1px;}',
    '.units-action-toolbar .filter-badge{font-size:9px;padding:2px 5px;}',
    '.units-action-toolbar svg{width:15px;height:15px;flex:none;}',
    '.controls>.active-pills{margin-top:0;}',
    '.controls>.filter-panel{margin-top:0;}',
    '@media(max-width:420px){.units-action-toolbar{gap:6px}.units-action-toolbar>#btnAddCustomer,.units-action-toolbar>#btnExportList,.units-action-toolbar>#btnToggleFilters{height:40px!important;padding-left:7px!important;padding-right:7px!important;font-size:11.25px!important;gap:4px!important}.units-action-toolbar svg{width:14px;height:14px}.units-action-toolbar>#btnToggleFilters>svg{width:12px;height:12px}}'
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
    if (!search || !filters || !exportBtn) return;

    var toolbar = controls.querySelector('.units-action-toolbar');
    if (!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'units-action-toolbar';
      search.insertAdjacentElement('afterend',toolbar);
    }

    if (add && add.parentElement !== toolbar) toolbar.appendChild(add);
    if (filters.parentElement !== toolbar) toolbar.appendChild(filters);
    if (exportBtn.parentElement !== toolbar) toolbar.appendChild(exportBtn);

    toolbar.classList.toggle('three-actions',!!add);
    toolbar.classList.toggle('two-actions',!add);

    if (add){
      labelButtonOnce(add,'Add customer');
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
    new MutationObserver(refineUnitsActions).observe(app,{childList:true,subtree:true});
  }
})();
