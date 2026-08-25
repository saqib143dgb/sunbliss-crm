(function(){
  'use strict';

  if (window.__sunblissUnitsTabSearchInstalled) return;
  window.__sunblissUnitsTabSearchInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissUnitsTabSearchStyle';
  style.textContent = [
    '.tabs{grid-template-columns:repeat(4,minmax(0,1fr))!important;}',
    '.tabs[data-dock-mode="crm"]{grid-template-columns:repeat(5,minmax(0,1fr))!important;}',
    '.tabs .tab[data-view="overview"]{order:1!important;}',
    '.tabs .tab[data-view="insights"]{order:2!important;}',
    '.tabs .tab[data-view="list"]{display:flex!important;order:3!important;}',
    '.tabs .dock-add{order:4!important;}',
    '.tabs .dock-search{order:5!important;}',
    '.tabs .tab[data-view="list"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%204h7v7H4V4zm9%200h7v7h-7V4zM4%2013h7v7H4v-7zm9%200h7v7h-7v-7z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%204h7v7H4V4zm9%200h7v7h-7V4zM4%2013h7v7H4v-7zm9%200h7v7h-7v-7z%22/%3E%3C/svg%3E");}',
    '@media(max-width:420px){.tabs .tab{font-size:9px!important;padding-left:2px!important;padding-right:2px!important}.tabs .tab::before{width:21px!important;height:21px!important}.tabs .dock-add{font-size:8.5px!important;}}'
  ].join('');
  document.head.appendChild(style);

  function getPanel(){
    return document.getElementById('sunblissDockSearchPanel');
  }

  function getDockInput(){
    return document.getElementById('dockPersistentSearchInput');
  }

  function setSearchOpen(open){
    window.__sunblissDockSearchOpen = !!open;
    var panel = getPanel();
    if (panel) panel.classList.toggle('is-open',window.__sunblissDockSearchOpen);
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){
      button.setAttribute('aria-expanded',String(window.__sunblissDockSearchOpen));
    });
    if (window.__sunblissDockSearchOpen) positionPanel();
  }

  function positionPanel(){
    var panel = getPanel();
    if (!panel || !window.__sunblissDockSearchOpen) return;
    var vv = window.visualViewport;
    var offsetTop = vv && Number.isFinite(vv.offsetTop) ? vv.offsetTop : 0;
    panel.style.top = Math.max(10,offsetTop + 10) + 'px';
  }

  function setDockSearchCopy(){
    var input = getDockInput();
    if (input){
      input.placeholder = 'Search unit, customer, broker or RM';
      input.setAttribute('aria-label','Search unit, customer, broker or RM');
    }
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){
      button.setAttribute('aria-label','Search unit, customer, broker or RM');
      button.setAttribute('title','Search unit, customer, broker or RM');
    });
  }

  function clearSearchState(){
    if (window.state) window.state.search = '';
    var dockInput = getDockInput();
    if (dockInput) dockInput.value = '';
  }

  function openSearchOnly(){
    var panel = getPanel();
    var input = getDockInput();
    if (!panel || !input) return;

    if (window.__sunblissDockSearchOpen){
      setSearchOpen(false);
      return;
    }

    var internal = document.getElementById('searchInput');
    if (internal){
      input.value = internal.value || '';
    } else {
      clearSearchState();
    }

    setSearchOpen(true);
    try { input.focus({preventScroll:true}); } catch (e) { input.focus(); }
    try { input.setSelectionRange(input.value.length,input.value.length); } catch (e) {}
  }

  function openUnitsForSearch(){
    if (document.getElementById('searchInput')) return true;
    var listTab = document.querySelector('.tabs .tab[data-view="list"]');
    if (!listTab) return false;
    window.__sunblissOpeningUnitsForSearch = true;
    try { listTab.click(); }
    finally { window.__sunblissOpeningUnitsForSearch = false; }
    return !!document.getElementById('searchInput');
  }

  function syncTypedSearch(value){
    var query = String(value || '');
    if (window.state) window.state.search = query;

    if (query.trim() && !document.getElementById('searchInput')){
      if (!openUnitsForSearch()) return;
    }

    var internal = document.getElementById('searchInput');
    if (!internal) return;
    if (internal.value !== query) internal.value = query;
  }

  document.addEventListener('click',function(event){
    var searchButton = event.target && event.target.closest ? event.target.closest('.tabs .dock-search') : null;
    if (searchButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      openSearchOnly();
      return;
    }

    var unitsButton = event.target && event.target.closest ? event.target.closest('.tabs .tab[data-view="list"]') : null;
    if (unitsButton && !window.__sunblissOpeningUnitsForSearch){
      clearSearchState();
      setSearchOpen(false);
    }
  },true);

  document.addEventListener('input',function(event){
    if (!event.target || event.target.id !== 'dockPersistentSearchInput') return;
    syncTypedSearch(event.target.value);
  },true);

  if (window.visualViewport){
    window.visualViewport.addEventListener('resize',positionPanel);
    window.visualViewport.addEventListener('scroll',positionPanel);
  }

  function searchableName(customer){
    var info = customer && customer.info ? customer.info : {};
    return [
      customer && customer.name,
      info.brokerName,
      info.brokerCompany,
      info.soldBy
    ].filter(function(value){ return value !== null && value !== undefined && String(value).trim(); }).join(' ');
  }

  function restoreRenderedCustomerNames(originalNames){
    var byKey = {};
    originalNames.forEach(function(item){
      var customer = item.customer;
      var key = String(customer.sno || '') + '|' + String(customer.unit || '');
      byKey[key] = item.name;
    });

    document.querySelectorAll('.list .row-btn[data-sno][data-unit]').forEach(function(row){
      var key = String(row.getAttribute('data-sno') || '') + '|' + String(row.getAttribute('data-unit') || '');
      if (!Object.prototype.hasOwnProperty.call(byKey,key)) return;
      var nameEl = row.querySelector('.row-name');
      if (!nameEl) return;
      var value = byKey[key];
      nameEl.textContent = typeof window.titleCase === 'function' ? window.titleCase(value || '') : String(value || '');
    });
  }

  function relabelExport(){
    var button = document.getElementById('btnExportList');
    if (!button) return;
    var changed = false;
    Array.prototype.forEach.call(button.childNodes,function(node){
      if (node.nodeType === 3 && String(node.nodeValue || '').trim()){
        node.nodeValue = 'Export Units';
        changed = true;
      }
    });
    if (!changed) button.appendChild(document.createTextNode('Export Units'));
    button.setAttribute('aria-label','Export sold units');
    button.setAttribute('title','Export sold units');
  }

  if (typeof window.renderList === 'function'){
    var originalRenderList = window.renderList;
    window.renderList = function(){
      var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
      var originalNames = [];

      dues.forEach(function(customer){
        if (!customer) return;
        originalNames.push({customer:customer,name:customer.name});
        customer.name = searchableName(customer);
      });

      var result;
      try {
        result = originalRenderList.apply(this,arguments);
      } finally {
        originalNames.forEach(function(item){ item.customer.name = item.name; });
      }

      restoreRenderedCustomerNames(originalNames);
      var internal = document.getElementById('searchInput');
      if (internal){
        internal.placeholder = 'Search unit, customer, broker or RM';
        internal.setAttribute('aria-label','Search unit, customer, broker or RM');
      }
      relabelExport();
      setDockSearchCopy();
      return result;
    };
  }

  setDockSearchCopy();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      observer.disconnect();
      try {
        setDockSearchCopy();
        relabelExport();
      } finally {
        observer.observe(app,{childList:true,subtree:true});
      }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
})();
