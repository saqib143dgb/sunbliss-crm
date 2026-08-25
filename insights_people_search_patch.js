(function(){
  'use strict';

  if (window.__sunblissInsightsPeopleSearchInstalled) return;
  window.__sunblissInsightsPeopleSearchInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissInsightsPeopleSearchStyle';
  style.textContent = [
    '#sunblissPeopleSearchResults{display:none;margin-top:9px;border-top:1px solid rgba(220,210,182,.78);padding-top:7px;max-height:min(52vh,420px);overflow-y:auto;-webkit-overflow-scrolling:touch;}',
    '#sunblissPeopleSearchResults.is-visible{display:block;}',
    '.people-search-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 4px 5px;font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}',
    '.people-search-count{font-size:9px;letter-spacing:0;color:var(--muted);}',
    '.people-search-list{display:flex;flex-direction:column;gap:4px;margin-bottom:5px;}',
    '.people-search-row{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid transparent;background:transparent;border-radius:10px;padding:9px 10px;color:var(--ink);}',
    '.people-search-row:hover,.people-search-row:active{background:var(--paper-dim);border-color:var(--paper-line);}',
    '.people-search-row:focus-visible{outline:2px solid var(--gold-deep);outline-offset:1px;}',
    '.people-search-kind{flex:none;min-width:45px;padding:4px 7px;border-radius:999px;background:rgba(198,151,46,.13);color:var(--gold-deep);font-family:"IBM Plex Mono",monospace;font-size:8.5px;font-weight:700;text-transform:uppercase;text-align:center;}',
    '.people-search-main{flex:1;min-width:0;}',
    '.people-search-name{display:block;font-family:Fraunces,serif;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.people-search-meta{display:block;margin-top:2px;font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.people-search-chevron{flex:none;color:var(--gold-deep);font-size:20px;line-height:1;}',
    '@media(max-width:420px){#sunblissPeopleSearchResults{max-height:48vh}.people-search-row{padding:8px}.people-search-kind{min-width:41px;font-size:8px}.people-search-name{font-size:13.5px}.people-search-meta{font-size:9.5px}}'
  ].join('');
  document.head.appendChild(style);

  function norm(value){
    return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g,' ');
  }

  function nice(value){
    var text = String(value == null ? '' : value).trim();
    if (!text) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(text);
    return text.toLowerCase().replace(/\b\w/g,function(ch){ return ch.toUpperCase(); });
  }

  function compact(value){
    var num = Number(value || 0);
    if (typeof window.fmtCompact === 'function') return window.fmtCompact(num);
    return Math.round(num).toLocaleString('en-US');
  }

  function findInsightsLabel(prefix){
    var labels = document.querySelectorAll('.overview .section-label');
    var key = norm(prefix);
    for (var i=0;i<labels.length;i++){
      if (norm(labels[i].textContent).indexOf(key) === 0) return labels[i];
    }
    return null;
  }

  function sectionList(label){
    if (!label) return null;
    var next = label.nextElementSibling;
    return next && next.classList && next.classList.contains('list') ? next : null;
  }

  function keepRmBeforeBroker(){
    var overview = document.querySelector('.overview');
    if (!overview) return;
    var rmLabel = findInsightsLabel('rm performance');
    var brokerLabel = findInsightsLabel('broker performance');
    if (!rmLabel || !brokerLabel) return;

    var relation = rmLabel.compareDocumentPosition(brokerLabel);
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return;

    var rmList = sectionList(rmLabel);
    overview.insertBefore(rmLabel,brokerLabel);
    if (rmList) overview.insertBefore(rmList,brokerLabel);
  }

  function buildPeople(){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var rms = {};
    var brokers = {};

    dues.forEach(function(customer){
      if (!customer) return;
      var info = customer.info || {};
      var total = Number(customer.total || 0);
      var rmName = String(info.soldBy || '').trim();
      if (rmName){
        var rk = norm(rmName);
        if (!rms[rk]) rms[rk] = {kind:'rm',name:rmName,count:0,value:0,search:''};
        rms[rk].count += 1;
        rms[rk].value += total;
      }

      var brokerName = String(info.brokerName || '').trim();
      if (brokerName){
        var bk = norm(brokerName);
        if (!brokers[bk]) brokers[bk] = {kind:'broker',name:brokerName,company:'',count:0,value:0,search:''};
        brokers[bk].count += 1;
        brokers[bk].value += total;
        if (!brokers[bk].company && String(info.brokerCompany || '').trim()) brokers[bk].company = String(info.brokerCompany || '').trim();
      }
    });

    var rmList = Object.keys(rms).map(function(key){
      var item = rms[key];
      item.search = norm(item.name);
      return item;
    }).sort(function(a,b){ return nice(a.name).localeCompare(nice(b.name)); });

    var brokerList = Object.keys(brokers).map(function(key){
      var item = brokers[key];
      item.search = norm(item.name + ' ' + (item.company || ''));
      return item;
    }).sort(function(a,b){ return nice(a.name).localeCompare(nice(b.name)); });

    return {rms:rmList,brokers:brokerList};
  }

  function ensurePeopleResults(){
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (!panel) return null;
    var results = document.getElementById('sunblissPeopleSearchResults');
    if (results && results.parentNode === panel) return results;
    if (results) results.remove();
    results = document.createElement('div');
    results.id = 'sunblissPeopleSearchResults';
    results.setAttribute('aria-live','polite');
    panel.appendChild(results);
    return results;
  }

  function sectionHtml(title,kind,items){
    if (!items.length) return '';
    var html = '<div class="people-search-heading"><span>'+title+'</span><span class="people-search-count">'+items.length+' match'+(items.length===1?'':'es')+'</span></div><div class="people-search-list">';
    items.forEach(function(item){
      var meta = item.count + ' unit' + (item.count===1?'':'s') + ' · AED ' + compact(item.value);
      if (kind === 'broker' && item.company) meta = nice(item.company) + ' · ' + meta;
      html += '<button type="button" class="people-search-row" data-person-kind="'+kind+'" data-person-name="'+String(item.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'">';
      html += '<span class="people-search-kind">'+(kind === 'rm' ? 'RM' : 'Broker')+'</span>';
      html += '<span class="people-search-main"><span class="people-search-name">'+nice(item.name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span><span class="people-search-meta">'+String(meta).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span></span>';
      html += '<span class="people-search-chevron">›</span></button>';
    });
    return html + '</div>';
  }

  function renderPeopleResults(query){
    var results = ensurePeopleResults();
    if (!results) return;
    var q = norm(query);
    if (!q){
      results.innerHTML = '';
      results.classList.remove('is-visible');
      return;
    }

    var people = buildPeople();
    var rms = people.rms.filter(function(item){ return item.search.indexOf(q) !== -1; }).slice(0,10);
    var brokers = people.brokers.filter(function(item){ return item.search.indexOf(q) !== -1; }).slice(0,10);
    var html = sectionHtml('Relationship Managers','rm',rms) + sectionHtml('Brokers','broker',brokers);
    results.innerHTML = html;
    results.classList.toggle('is-visible',!!html);
  }

  function clearDockSearch(){
    if (window.state) window.state.search = '';
    var dockInput = document.getElementById('dockPersistentSearchInput');
    if (dockInput) dockInput.value = '';
    var internal = document.getElementById('searchInput');
    if (internal) internal.value = '';
    var results = document.getElementById('sunblissPeopleSearchResults');
    if (results){ results.innerHTML = ''; results.classList.remove('is-visible'); }
  }

  function closeDockSearch(){
    window.__sunblissDockSearchOpen = false;
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (panel) panel.classList.remove('is-open');
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){ button.setAttribute('aria-expanded','false'); });
  }

  function personRow(kind,name){
    var label = findInsightsLabel(kind === 'rm' ? 'rm performance' : 'broker performance');
    var list = sectionList(label);
    if (!list) return null;
    var key = norm(name);
    var rows = list.querySelectorAll('.row-btn');
    for (var i=0;i<rows.length;i++){
      var nameEl = rows[i].querySelector('.row-name');
      if (nameEl && norm(nameEl.textContent) === key) return rows[i];
    }
    return null;
  }

  function openPersonFromSearch(kind,name){
    closeDockSearch();
    clearDockSearch();
    if (window.state){
      window.state.view = 'insights';
      window.state.__salesChannelOpen = null;
    }

    if (typeof window.renderMain === 'function') window.renderMain();
    else if (typeof window.renderInsights === 'function') window.renderInsights();

    var attempts = 0;
    function openWhenReady(){
      keepRmBeforeBroker();
      var row = personRow(kind,name);
      var readyClass = kind === 'rm' ? 'rm-performance-clickable' : 'broker-performance-clickable';
      if (row && row.classList.contains(readyClass)){
        row.click();
        return;
      }
      attempts += 1;
      if (attempts < 8) window.setTimeout(openWhenReady,25 + attempts * 15);
      else if (row) row.click();
    }
    window.setTimeout(openWhenReady,0);
  }

  document.addEventListener('input',function(event){
    if (!event.target || event.target.id !== 'dockPersistentSearchInput') return;
    renderPeopleResults(event.target.value);
  });

  document.addEventListener('click',function(event){
    var row = event.target && event.target.closest ? event.target.closest('.people-search-row') : null;
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    openPersonFromSearch(row.getAttribute('data-person-kind'),row.getAttribute('data-person-name'));
  });

  function refresh(){
    keepRmBeforeBroker();
    ensurePeopleResults();
    var input = document.getElementById('dockPersistentSearchInput');
    if (input && window.__sunblissDockSearchOpen) renderPeopleResults(input.value);
  }

  refresh();
  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      observer.disconnect();
      try { refresh(); }
      finally { observer.observe(app,{childList:true,subtree:true}); }
    });
    observer.observe(app,{childList:true,subtree:true});
  }

  var panelObserverTarget = document.body;
  if (panelObserverTarget && window.MutationObserver){
    new MutationObserver(function(){ ensurePeopleResults(); }).observe(panelObserverTarget,{childList:true,subtree:false});
  }
})();
