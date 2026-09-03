(function(){
  'use strict';

  if (window.__sunblissInsightsResponsiveInstalled) return;
  window.__sunblissInsightsResponsiveInstalled = true;

  var MQ = '(min-width:1024px)';
  var renderTimer = null;
  var observer = null;
  var mutating = false;

  function desktop(){
    return window.matchMedia ? window.matchMedia(MQ).matches : window.innerWidth >= 1024;
  }
  function n(v){ v = Number(v); return isFinite(v) ? v : 0; }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function money(v){
    var x = Math.abs(n(v));
    if (x >= 1000000) return 'AED ' + (Math.round(x / 100000) / 10).toFixed(1) + 'M';
    if (x >= 1000) return 'AED ' + (Math.round(x / 100) / 10).toFixed(1) + 'K';
    return 'AED ' + Math.round(x).toLocaleString('en-AE');
  }
  function pct(v){ return (Math.round(n(v) * 10) / 10).toFixed(1) + '%'; }
  function dateObj(v){
    if (!v) return null;
    var d = v instanceof Date ? new Date(v.getTime()) : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function dayStart(v){
    var d = dateObj(v) || new Date();
    d.setHours(0,0,0,0);
    return d;
  }
  function icon(name){
    var p = {
      wallet:'<path d="M4 7h15a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4z"/>',
      alert:'<path d="M12 3 2.8 20h18.4L12 3z"/><path d="M12 9v5M12 17h.01"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
      chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      spark:'<path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3z"/>',
      arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
      shield:'<path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3z"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(p[name]||p.chart)+'</svg>';
  }

  function installStyle(){
    if (document.getElementById('insightsSalesChartResponsiveStyle')) return;
    var style = document.createElement('style');
    style.id = 'insightsSalesChartResponsiveStyle';
    style.textContent = [
      '.insights-sales-chart{display:block!important;height:auto!important;overflow:hidden!important;}',
      '#sbDesktopInsightSummary{display:none;}',
      '@media(max-width:640px){',
        '#app,main{max-width:100vw!important;overflow-x:hidden!important;}',
        '.overview{min-width:0!important;max-width:100%!important;overflow-x:hidden!important;}',
        '.overview>.section-label+svg[width="520"]{display:block!important;width:calc(100vw - 36px)!important;max-width:calc(100vw - 36px)!important;height:auto!important;}',
      '}',
      '@media(min-width:1024px){',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview{padding:18px 25px 36px!important;background:#f8f6ef!important;overflow:visible!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>*:not(#sbRefOverviewV2):not(#sbRefOverview){display:block!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>#sbRefOverviewV2,body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>#sbRefOverview{display:none!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights #sbDesktopInsightSummary{display:block!important;}',
        '#sbDesktopInsightSummary{font-family:Inter,sans-serif;color:var(--ink);margin:0 0 20px;}',
        '.sb-di-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:1px 0 13px;}',
        '.sb-di-kicker{display:flex;align-items:center;gap:7px;margin:0 0 5px;color:var(--gold-deep);font:700 8.5px/1 "IBM Plex Mono",monospace;letter-spacing:.13em;text-transform:uppercase;}',
        '.sb-di-kicker svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;}',
        '.sb-di-title{margin:0;font:650 22px/1.08 Fraunces,serif;letter-spacing:-.02em;color:var(--ink);}',
        '.sb-di-sub{margin:5px 0 0;color:var(--muted);font:500 10px/1.4 Inter,sans-serif;}',
        '.sb-di-asof{text-align:right;color:var(--muted);font:500 8.5px/1.4 "IBM Plex Mono",monospace;white-space:nowrap;}',
        '.sb-di-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}',
        '.sb-di-card{background:#fff;border:1px solid var(--paper-line);border-radius:11px;box-shadow:0 3px 14px rgba(15,26,38,.05);}',
        '.sb-di-kpi{min-height:105px;padding:14px 15px;display:grid;grid-template-columns:38px minmax(0,1fr);gap:11px;align-items:start;}',
        '.sb-di-kpi[data-insights-filter]{cursor:pointer;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease;}',
        '.sb-di-kpi[data-insights-filter]:hover{transform:translateY(-1px);border-color:rgba(198,151,46,.55);box-shadow:0 7px 18px rgba(15,26,38,.07);}',
        '.sb-di-icon{width:37px;height:37px;border-radius:10px;display:grid;place-items:center;background:rgba(198,151,46,.11);color:var(--gold-deep);}',
        '.sb-di-icon.green{background:rgba(63,122,87,.10);color:var(--sage);}.sb-di-icon.red{background:rgba(174,59,43,.09);color:var(--rust);}.sb-di-icon.blue{background:rgba(69,86,107,.10);color:var(--slate);}',
        '.sb-di-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}',
        '.sb-di-label{margin:1px 0 7px;color:var(--muted);font:700 8px/1 "IBM Plex Mono",monospace;letter-spacing:.09em;text-transform:uppercase;}',
        '.sb-di-value{margin:0;color:var(--ink);font:750 20px/1 Inter,sans-serif;letter-spacing:-.03em;white-space:nowrap;}',
        '.sb-di-meta{margin:7px 0 0;color:var(--muted);font:500 9px/1.3 Inter,sans-serif;}',
        '.sb-di-lower{display:grid;grid-template-columns:1.18fr .82fr;gap:12px;margin-top:12px;}',
        '.sb-di-panel{padding:13px 15px 14px;}',
        '.sb-di-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:9px;margin-bottom:2px;border-bottom:1px solid rgba(220,210,182,.62);}',
        '.sb-di-head strong{display:flex;align-items:center;gap:7px;font:700 10.5px/1 Inter,sans-serif;color:var(--ink);}.sb-di-head strong svg{width:16px;height:16px;fill:none;stroke:var(--gold-deep);stroke-width:1.8;}',
        '.sb-di-link{border:0;background:transparent;color:#3972a5;padding:2px 0;font:650 8.5px/1 Inter,sans-serif;cursor:pointer;display:flex;align-items:center;gap:4px;}.sb-di-link svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;}',
        '.sb-di-signal{min-height:45px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border-bottom:1px solid rgba(220,210,182,.52);}.sb-di-signal:last-child{border-bottom:0;}',
        '.sb-di-signal strong{display:block;font:650 9.5px/1.2 Inter,sans-serif;color:var(--ink);}.sb-di-signal span{display:block;margin-top:3px;color:var(--muted);font:500 8.5px/1.25 Inter,sans-serif;}.sb-di-signal b{font:750 10px/1 Inter,sans-serif;color:var(--ink);white-space:nowrap;}',
        '.sb-di-signal.risk b{color:var(--rust);}.sb-di-signal.good b{color:var(--sage);}',
        '.sb-di-exposure-row{width:100%;min-height:45px;display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:8px;border:0;border-bottom:1px solid rgba(220,210,182,.52);background:transparent;padding:0;text-align:left;cursor:pointer;color:var(--ink);}.sb-di-exposure-row:last-child{border-bottom:0;}.sb-di-exposure-row:hover{background:rgba(198,151,46,.045);}',
        '.sb-di-unit{font:700 9px/1 "IBM Plex Mono",monospace;color:var(--gold-deep);}.sb-di-person{min-width:0;font:600 9.5px/1.2 Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.sb-di-amount{text-align:right;font:700 9.5px/1 Inter,sans-serif;color:var(--rust);}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.section-label{margin-top:20px!important;margin-bottom:9px!important;color:var(--ink)!important;font-size:9px!important;letter-spacing:.11em!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.stage-scroll,body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.list{background:#fff!important;border:1px solid var(--paper-line)!important;border-radius:11px!important;box-shadow:0 3px 14px rgba(15,26,38,.045)!important;overflow:hidden!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.pipeline{background:#fff!important;border:1px solid var(--paper-line)!important;border-radius:11px!important;padding:6px!important;box-shadow:0 3px 14px rgba(15,26,38,.045)!important;}',
        'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.footnote{margin-top:22px!important;}',
        '@media(max-width:1180px){.sb-di-kpi{grid-template-columns:32px minmax(0,1fr);gap:9px;padding-left:12px;padding-right:12px}.sb-di-icon{width:32px;height:32px}.sb-di-value{font-size:17px}.sb-di-meta{font-size:8.5px}}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function stats(){
    try { if (typeof window.portfolioStats === 'function') return window.portfolioStats(); } catch(e){}
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var sales = 0, received = 0;
    dues.forEach(function(c){ sales += n(c.total); received += n(c.received); });
    return {units:dues.length,totalSales:sales,totalReceived:received,totalOutstanding:sales-received,collectedPct:sales?received/sales*100:0,spaCounts:{signed:0,drafted:0,none:dues.length},oqoodCounts:{completed:0,pending:0,none:dues.length,other:0}};
  }
  function aging(){
    try { if (typeof window.overdueAging === 'function') return window.overdueAging(); } catch(e){}
    var today = dayStart(new Date()), total = 0;
    (window.state && state.dues || []).forEach(function(c){
      (c.stages || []).forEach(function(s){
        var rem = n(s.outAmt), d = dayStart(s.revisedDueDate || s.revised_due_date || s.dueDate || s.due_date);
        if (rem > 1 && d < today) total += rem;
      });
    });
    return {total:total,buckets:[]};
  }
  function next30(){
    var start = dayStart(new Date()), end = new Date(start); end.setDate(end.getDate()+30);
    var amount = 0, count = 0, units = {};
    (window.state && state.dues || []).forEach(function(c){
      (c.stages || []).forEach(function(s){
        var rem = n(s.outAmt), d = dateObj(s.revisedDueDate || s.revised_due_date || s.dueDate || s.due_date);
        if (rem <= 1 || !d) return;
        d = dayStart(d);
        if (d >= start && d <= end){ amount += rem; count += 1; units[String(c.unit || c.sno || count)] = true; }
      });
    });
    return {amount:amount,count:count,units:Object.keys(units).length};
  }
  function thisMonth(){
    try { if (typeof window.thisMonthSummary === 'function') return window.thisMonthSummary(); } catch(e){}
    return {any:false,count:0,value:0};
  }
  function exposure(){
    try { if (typeof window.topOverdueAccounts === 'function') return window.topOverdueAccounts(3) || []; } catch(e){}
    return [];
  }

  function signals(k,a,u){
    var spa = k.spaCounts || {}, oq = k.oqoodCounts || {};
    var spaOpen = n(spa.drafted) + n(spa.none);
    var oqOpen = n(oq.pending) + n(oq.none) + n(oq.other);
    var rows = [];
    if (a.total > 1) rows.push({cls:'risk',title:'Collections risk',sub:'Overdue balance requires follow-up',value:money(a.total)});
    else rows.push({cls:'good',title:'Collections position',sub:'No overdue balance detected',value:'Healthy'});
    rows.push({cls:n(k.collectedPct)>=60?'good':'',title:'Collection efficiency',sub:'Received against total sales value',value:pct(k.collectedPct)});
    if (spaOpen > 0) rows.push({cls:'risk',title:'SPA completion gap',sub:'Customers still pending signed SPA',value:String(spaOpen)});
    else if (oqOpen > 0) rows.push({cls:'',title:'OQOOD registration gap',sub:'Registrations still open',value:String(oqOpen)});
    else rows.push({cls:'good',title:'Documentation position',sub:'SPA and OQOOD queues are clear',value:'Clear'});
    if (u.amount > 1) rows.push({cls:'',title:'30-day collection pipeline',sub:u.count+' installments across '+u.units+' units',value:money(u.amount)});
    return rows.slice(0,4);
  }

  function openList(kind){
    if (!window.state) return;
    var base = {payment:'all',spa:null,oqood:null,furniture:null,unitType:null,dld:null};
    if (kind === 'collected') { state.filters = Object.assign({},base,{payment:'all'}); state.sortBy = 'received'; }
    else if (kind === 'overdue') { state.filters = Object.assign({},base,{payment:'overdue'}); state.sortBy = 'outstanding'; }
    else if (kind === 'outstanding') { state.filters = Object.assign({},base,{payment:'outstanding'}); state.sortBy = 'outstanding'; }
    else return;
    state.search = ''; state.filtersExpanded = false; state.detailFrom = 'insights'; state.view = 'list';
    if (typeof window.renderMain === 'function') window.renderMain();
    window.scrollTo(0,0);
  }
  function openCustomer(unit,sno){
    if (!window.state) return;
    state.selectedUnit = String(unit || '') + '::' + String(sno || '');
    state.detailFrom = 'insights'; state.revealedFields = {}; state.view = 'detail';
    if (typeof window.renderMain === 'function') window.renderMain();
    window.scrollTo(0,0);
  }

  function renderDesktopInsights(){
    if (!desktop() || !window.state || state.view !== 'insights'){
      document.body.classList.remove('sunbliss-desktop-insights');
      var stale = document.getElementById('sbDesktopInsightSummary'); if (stale) stale.remove();
      return;
    }
    var host = document.querySelector('main#main .overview');
    if (!host) return;

    mutating = true;
    try {
      document.body.classList.add('sunbliss-desktop-insights');
      var wrong = document.getElementById('sbRefOverviewV2'); if (wrong) wrong.remove();
      var old = document.getElementById('sbDesktopInsightSummary'); if (old) old.remove();

      var k = stats(), a = aging(), u = next30(), tm = thisMonth(), top = exposure(), sig = signals(k,a,u);
      var asOf = new Date().toLocaleString('en-AE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      var html = '<section id="sbDesktopInsightSummary">'+
        '<div class="sb-di-intro"><div><p class="sb-di-kicker">'+icon('spark')+'Portfolio intelligence</p><h2 class="sb-di-title">Management Insights</h2><p class="sb-di-sub">A decision-focused snapshot of collections, upcoming cash flow, sales and compliance risk.</p></div><div class="sb-di-asof">LIVE CRM SNAPSHOT<br>'+esc(asOf)+'</div></div>'+
        '<div class="sb-di-kpis">'+
          '<article class="sb-di-card sb-di-kpi" data-insights-filter="collected"><span class="sb-di-icon green">'+icon('wallet')+'</span><div><p class="sb-di-label">Collection rate</p><p class="sb-di-value">'+esc(pct(k.collectedPct))+'</p><p class="sb-di-meta">'+esc(money(k.totalReceived))+' received of '+esc(money(k.totalSales))+'</p></div></article>'+
          '<article class="sb-di-card sb-di-kpi" data-insights-filter="overdue"><span class="sb-di-icon red">'+icon('alert')+'</span><div><p class="sb-di-label">Overdue exposure</p><p class="sb-di-value">'+esc(money(a.total))+'</p><p class="sb-di-meta">Open collection risk across overdue stages</p></div></article>'+
          '<article class="sb-di-card sb-di-kpi"><span class="sb-di-icon">'+icon('calendar')+'</span><div><p class="sb-di-label">Next 30 days</p><p class="sb-di-value">'+esc(money(u.amount))+'</p><p class="sb-di-meta">'+esc(u.count)+' installments · '+esc(u.units)+' units due</p></div></article>'+
          '<article class="sb-di-card sb-di-kpi"><span class="sb-di-icon blue">'+icon('chart')+'</span><div><p class="sb-di-label">Sales this month</p><p class="sb-di-value">'+esc(money(tm.value || 0))+'</p><p class="sb-di-meta">'+esc(tm.count || 0)+' unit'+(n(tm.count)===1?'':'s')+' booked this month</p></div></article>'+
        '</div>'+
        '<div class="sb-di-lower">'+
          '<div class="sb-di-card sb-di-panel"><div class="sb-di-head"><strong>'+icon('shield')+'Management signals</strong><button class="sb-di-link" data-insights-filter="outstanding">Open outstanding '+icon('arrow')+'</button></div>'+sig.map(function(s){return '<div class="sb-di-signal '+esc(s.cls)+'"><div><strong>'+esc(s.title)+'</strong><span>'+esc(s.sub)+'</span></div><b>'+esc(s.value)+'</b></div>';}).join('')+'</div>'+
          '<div class="sb-di-card sb-di-panel"><div class="sb-di-head"><strong>'+icon('alert')+'Priority overdue exposure</strong><button class="sb-di-link" data-insights-filter="overdue">View overdue '+icon('arrow')+'</button></div>'+
            (top.length ? top.map(function(x){var c=x.c||x.customer||{};return '<button class="sb-di-exposure-row" data-unit="'+esc(c.unit)+'" data-sno="'+esc(c.sno)+'"><span class="sb-di-unit">'+esc(c.unit||'—')+'</span><span class="sb-di-person">'+esc(c.name||'Customer')+'</span><span class="sb-di-amount">'+esc(money(x.overdueAmount||x.amount))+'</span></button>';}).join('') : '<div class="sb-di-signal good"><div><strong>No priority overdue accounts</strong><span>Nothing currently needs escalation.</span></div><b>Clear</b></div>')+
          '</div>'+
        '</div>'+
      '</section>';
      host.insertAdjacentHTML('afterbegin',html);
    } finally { mutating = false; }
  }

  function bind(){
    document.addEventListener('click',function(event){
      var filter = event.target && event.target.closest ? event.target.closest('[data-insights-filter]') : null;
      if (filter && document.getElementById('sbDesktopInsightSummary') && filter.closest('#sbDesktopInsightSummary')){
        event.preventDefault(); openList(filter.getAttribute('data-insights-filter')); return;
      }
      var row = event.target && event.target.closest ? event.target.closest('.sb-di-exposure-row') : null;
      if (row){ event.preventDefault(); openCustomer(row.getAttribute('data-unit'),row.getAttribute('data-sno')); }
    });
  }

  function fitInsightsSalesChart(){
    document.querySelectorAll('.overview .section-label').forEach(function(label){
      var text = (label.textContent || '').trim().toLowerCase();
      if (text.indexOf('monthly sales value') !== 0) return;
      var svg = label.nextElementSibling;
      if (!svg || !svg.tagName || svg.tagName.toLowerCase() !== 'svg') return;
      svg.classList.add('insights-sales-chart');
      svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      var overview = label.closest('.overview'); if (!overview) return;
      var cs = window.getComputedStyle ? window.getComputedStyle(overview) : null;
      var left = cs ? parseFloat(cs.paddingLeft)||0 : 18, right = cs ? parseFloat(cs.paddingRight)||0 : 18;
      var panel = Math.max(0,overview.clientWidth-left-right);
      var viewport = Math.max(0,(document.documentElement&&document.documentElement.clientWidth)||window.innerWidth||panel);
      var target = desktop() ? Math.min(760,panel||760) : Math.min(520,panel||520,Math.max(0,viewport-36)||520);
      if (target > 0){ svg.style.setProperty('width',target+'px','important'); svg.style.setProperty('max-width',target+'px','important'); svg.style.setProperty('height','auto','important'); }
    });
  }

  function schedule(ms){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){ renderDesktopInsights(); fitInsightsSalesChart(); },ms == null ? 18 : ms);
  }
  function install(){
    installStyle(); bind(); fitInsightsSalesChart();
    if (!window.state || typeof window.renderMain !== 'function'){ setTimeout(install,80); return; }
    if (!window.renderMain.__sbInsightsDesktop){
      var rm = window.renderMain;
      window.renderMain = function(){ var result = rm.apply(this,arguments); schedule(20); return result; };
      window.renderMain.__sbInsightsDesktop = true;
    }
    if (typeof window.renderInsights === 'function' && !window.renderInsights.__sbInsightsDesktop){
      var ri = window.renderInsights;
      window.renderInsights = function(){ var result = ri.apply(this,arguments); schedule(20); return result; };
      window.renderInsights.__sbInsightsDesktop = true;
    }
    observer = new MutationObserver(function(){
      if (mutating) return;
      if (desktop() && window.state && state.view === 'insights'){
        var wrong = document.getElementById('sbRefOverviewV2'), summary = document.getElementById('sbDesktopInsightSummary');
        if (wrong || !summary) schedule(10);
      } else fitInsightsSalesChart();
    });
    observer.observe(document.getElementById('main') || document.body,{childList:true,subtree:true});
    window.addEventListener('resize',function(){ schedule(70); });
    window.addEventListener('orientationchange',function(){ setTimeout(function(){ schedule(20); },80); });
    window.addEventListener('pageshow',function(){ schedule(30); });
    schedule(30);
  }

  install();
})();
