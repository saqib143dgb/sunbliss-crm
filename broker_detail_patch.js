(function(){
  'use strict';

  if (window.__sunblissBrokerDetailInstalled) return;
  window.__sunblissBrokerDetailInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBrokerDetailStyle';
  style.textContent = [
    '.broker-performance-clickable{position:relative!important;cursor:pointer!important;padding-right:32px!important;transition:background .15s ease;}',
    '.broker-performance-clickable:hover,.broker-performance-clickable:active{background:var(--paper-dim)!important;}',
    '.broker-performance-clickable:focus-visible{outline:2px solid var(--gold-deep);outline-offset:-2px;border-radius:8px;}',
    '.broker-performance-clickable::after{content:"›";position:absolute;right:10px;top:50%;transform:translateY(-50%);font-family:Inter,sans-serif;font-size:22px;line-height:1;color:var(--gold-deep);}',
    '.broker-detail-page{padding:14px 18px 30px;}',
    '.broker-detail-back{display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--muted);font-size:13px;font-weight:600;padding:7px 2px;margin:0 0 8px;}',
    '.broker-detail-back:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;border-radius:6px;}',
    '.broker-detail-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-deep);margin:2px 0 5px;}',
    '.broker-detail-name{font-family:Fraunces,serif;font-size:24px;line-height:1.12;font-weight:600;color:var(--ink);margin:0 0 4px;}',
    '.broker-detail-company{font-size:12px;font-weight:600;color:var(--gold-deep);margin:0 0 3px;}',
    '.broker-detail-sub{font-size:12px;color:var(--muted);margin:0 0 16px;line-height:1.5;}',
    '.broker-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:14px;overflow:hidden;margin-bottom:14px;}',
    '.broker-detail-summary .stat-cell{min-width:0;}',
    '.broker-detail-extra{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px;}',
    '.broker-detail-extra-card{border:1px solid var(--paper-line);border-radius:11px;padding:10px 11px;background:var(--paper);min-width:0;}',
    '.broker-detail-extra-label{font-family:"IBM Plex Mono",monospace;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 4px;}',
    '.broker-detail-extra-value{font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--ink);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.broker-detail-extra-sub{font-size:10px;color:var(--muted);margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.broker-unit-list{display:flex;flex-direction:column;gap:10px;}',
    '.broker-unit-card{width:100%;text-align:left;background:var(--paper);border:1px solid var(--paper-line);border-radius:12px;padding:12px;box-shadow:0 1px 2px rgba(15,26,38,.03);}',
    '.broker-unit-card:hover,.broker-unit-card:active{background:var(--paper-dim);}',
    '.broker-unit-card:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;}',
    '.broker-unit-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}',
    '.broker-unit-head-main{flex:1;min-width:0;overflow:hidden;}',
    '.broker-unit-customer{display:block;font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--ink);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.broker-unit-head-sub{display:block;font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.broker-unit-value{flex:none;text-align:right;font-family:"IBM Plex Mono",monospace;font-size:11.5px;font-weight:600;color:var(--ink);white-space:nowrap;}',
    '.broker-unit-value small{display:block;font-family:Inter,sans-serif;font-size:8.5px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:2px;}',
    '.broker-unit-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;border-top:1px solid var(--paper-line);padding-top:6px;}',
    '.broker-unit-field{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(220,210,182,.55);min-width:0;}',
    '.broker-unit-field-label{font-size:9.5px;color:var(--muted);flex:none;}',
    '.broker-unit-field-value{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--ink);text-align:right;min-width:0;word-break:break-word;}',
    '.broker-unit-open{font-size:9.5px;color:var(--gold-deep);font-weight:700;text-align:right;margin-top:8px;}',
    '@media(max-width:420px){.broker-detail-page{padding-left:14px;padding-right:14px}.broker-detail-name{font-size:22px}.broker-unit-grid{grid-template-columns:1fr}.broker-unit-head{gap:8px}.broker-unit-value{font-size:10.5px}}'
  ].join('');
  document.head.appendChild(style);

  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function personKey(value){
    if (typeof window.normPersonName === 'function') return window.normPersonName(value || '');
    return String(value || '').trim().toLowerCase().replace(/\s+/g,' ');
  }

  function nice(value){
    var text = String(value || '').trim();
    if (!text) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(text);
    return text.toLowerCase().replace(/\b\w/g,function(ch){return ch.toUpperCase();});
  }

  function shortCustomerName(value){
    return nice(value).split(/\s+/).filter(Boolean).slice(0,2).join(' ');
  }

  function money(value){
    var num = Number(value || 0);
    if (typeof window.fmtAED === 'function') return window.fmtAED(num);
    return 'AED ' + Math.round(num).toLocaleString('en-US');
  }

  function compact(value){
    var num = Number(value || 0);
    if (typeof window.fmtCompact === 'function') return window.fmtCompact(num);
    return Math.round(num).toLocaleString('en-US');
  }

  function dateText(value){
    if (!value) return '—';
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }

  function customersForBroker(brokerName){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var key = personKey(brokerName);
    return dues.filter(function(customer){
      return customer && customer.info && personKey(customer.info.brokerName) === key;
    }).slice().sort(function(a,b){
      var ad = a.info && a.info.bookingDate ? new Date(a.info.bookingDate).getTime() : 0;
      var bd = b.info && b.info.bookingDate ? new Date(b.info.bookingDate).getTime() : 0;
      if (ad !== bd) return bd - ad;
      return String(a.unit || '').localeCompare(String(b.unit || ''),undefined,{numeric:true});
    });
  }

  function findBrokerList(){
    var labels = document.querySelectorAll('.overview .section-label');
    for (var i=0;i<labels.length;i++){
      var text = String(labels[i].textContent || '').trim().toLowerCase();
      if (text.indexOf('broker performance') !== 0) continue;
      var list = labels[i].nextElementSibling;
      if (list && list.classList && list.classList.contains('list')) return list;
    }
    return null;
  }

  function field(label,value){
    if (value === null || value === undefined || String(value).trim() === '') return '';
    return '<div class="broker-unit-field"><span class="broker-unit-field-label">'+esc(label)+'</span><span class="broker-unit-field-value">'+esc(value)+'</span></div>';
  }

  function unitCard(customer){
    var info = customer.info || {};
    var total = Number(customer.total || 0);
    var received = Number(customer.received || 0);
    var outstanding = Math.max(0,total-received);
    var typeLine = customer.type ? nice(customer.type) : '';
    var areaFloor = [];
    if (info.floor !== null && info.floor !== undefined && String(info.floor).trim() !== '') areaFloor.push('Floor ' + info.floor);
    if (info.area !== null && info.area !== undefined && String(info.area).trim() !== '') areaFloor.push(info.area + ' sqft');
    var sub = [typeLine,areaFloor.join(' · ')].filter(Boolean).join(' · ');

    var html = '<button type="button" class="broker-unit-card" data-unit="'+esc(customer.unit)+'" data-sno="'+esc(customer.sno)+'">';
    html += '<div class="broker-unit-head"><span class="row-unit">'+esc(customer.unit || '—')+'</span><span class="broker-unit-head-main"><span class="broker-unit-customer">'+esc(shortCustomerName(customer.name))+'</span><span class="broker-unit-head-sub">'+esc(sub)+'</span></span><span class="broker-unit-value">'+esc(money(total))+'<small>sales value</small></span></div>';
    html += '<div class="broker-unit-grid">';
    html += field('Booking',dateText(info.bookingDate));
    html += field('RM',nice(info.soldBy));
    html += field('Collected',money(received));
    html += field('Outstanding',money(outstanding));
    html += field('Source',nice(info.source));
    html += field('SPA',customer.spa || 'Not started');
    html += field('OQOOD',customer.oqood || 'Not started');
    html += field('Brokerage %',info.brokeragePct !== null && info.brokeragePct !== undefined ? info.brokeragePct + '%' : '');
    html += field('Brokerage amount',info.brokerageAmt ? money(info.brokerageAmt) : '');
    html += field('Booking amount',info.bookingAmt ? money(info.bookingAmt) : '');
    html += '</div><div class="broker-unit-open">Open full unit details ›</div></button>';
    return html;
  }

  function uniqueRmNames(customers){
    var seen = {};
    var names = [];
    customers.forEach(function(c){
      var name = c.info ? nice(c.info.soldBy) : '';
      var key = personKey(name);
      if (name && !seen[key]){seen[key]=true;names.push(name);}
    });
    return names;
  }

  function openBrokerPage(brokerName){
    var main = document.getElementById('main');
    if (!main) return;

    var customers = customersForBroker(brokerName);
    var totalValue = customers.reduce(function(sum,c){return sum + Number(c.total || 0);},0);
    var received = customers.reduce(function(sum,c){return sum + Number(c.received || 0);},0);
    var outstanding = Math.max(0,totalValue-received);
    var pct = totalValue > 0 ? Math.round(received/totalValue*1000)/10 : 0;
    var brokerage = customers.reduce(function(sum,c){return sum + Number(c.info && c.info.brokerageAmt || 0);},0);
    var rmNames = uniqueRmNames(customers);
    var company = '';
    for (var i=0;i<customers.length;i++){
      var candidate = customers[i].info && String(customers[i].info.brokerCompany || '').trim();
      if (candidate){ company = nice(candidate); break; }
    }
    var displayName = nice(brokerName);

    var html = '<div class="broker-detail-page">';
    html += '<button type="button" class="broker-detail-back" id="brokerDetailBack">← Back to Insights</button>';
    html += '<p class="broker-detail-eyebrow">Broker performance</p>';
    html += '<h2 class="broker-detail-name">'+esc(displayName)+'</h2>';
    if (company) html += '<p class="broker-detail-company">'+esc(company)+'</p>';
    html += '<p class="broker-detail-sub">Complete sales portfolio for this broker, using the same Broker data as the Insights totals.</p>';
    html += '<div class="broker-detail-summary">';
    html += '<div class="stat-cell"><p class="stat-label">Units sold</p><p class="stat-value">'+customers.length+'</p><p class="stat-sub">total brokered units</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Sales value</p><p class="stat-value">AED '+esc(compact(totalValue))+'</p><p class="stat-sub">total sold value</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Collected</p><p class="stat-value">AED '+esc(compact(received))+'</p><p class="stat-sub">'+esc(pct)+'% collected</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Outstanding</p><p class="stat-value">AED '+esc(compact(outstanding))+'</p><p class="stat-sub">remaining on these sales</p></div>';
    html += '</div>';
    html += '<div class="broker-detail-extra">';
    html += '<div class="broker-detail-extra-card"><p class="broker-detail-extra-label">Brokerage value</p><p class="broker-detail-extra-value">AED '+esc(compact(brokerage))+'</p><p class="broker-detail-extra-sub">recorded brokerage amount</p></div>';
    html += '<div class="broker-detail-extra-card"><p class="broker-detail-extra-label">RMs involved</p><p class="broker-detail-extra-value">'+rmNames.length+'</p><p class="broker-detail-extra-sub">'+esc(rmNames.join(' · ') || 'No RM recorded')+'</p></div>';
    html += '</div>';
    html += '<p class="section-label">Units sold through '+esc(displayName)+'</p>';
    html += '<div class="broker-unit-list">';
    if (customers.length){
      customers.forEach(function(customer){ html += unitCard(customer); });
    } else {
      html += '<div class="tx-empty">No units are currently assigned to this broker.</div>';
    }
    html += '</div></div>';

    main.innerHTML = html;
    if (window.state) window.state.__brokerDetailName = brokerName;

    var back = document.getElementById('brokerDetailBack');
    if (back) back.addEventListener('click',function(){
      if (window.state) window.state.__brokerDetailName = null;
      if (typeof window.renderInsights === 'function') window.renderInsights();
      if (window.scrollTo) window.scrollTo(0,0);
    });

    main.querySelectorAll('.broker-unit-card').forEach(function(card){
      card.addEventListener('click',function(){
        if (typeof window.goToDetail === 'function'){
          window.goToDetail(card.getAttribute('data-unit'),card.getAttribute('data-sno'),'insights');
        }
      });
    });

    if (window.scrollTo) window.scrollTo(0,0);
  }

  function decorateBrokerRows(){
    var list = findBrokerList();
    if (!list) return;
    var rows = Array.prototype.slice.call(list.children || []).filter(function(row){return row.classList && row.classList.contains('row-btn');});
    rows.forEach(function(row){
      if (row.getAttribute('data-broker-detail-ready') === '1') return;
      var nameEl = row.querySelector('.row-name');
      var brokerName = nameEl ? String(nameEl.textContent || '').trim() : '';
      if (!brokerName) return;
      row.setAttribute('data-broker-detail-ready','1');
      row.setAttribute('data-broker-name',brokerName);
      row.classList.add('broker-performance-clickable');
      row.setAttribute('role','button');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label','Open full sales details for broker ' + brokerName);
      row.addEventListener('click',function(){ openBrokerPage(brokerName); });
      row.addEventListener('keydown',function(event){
        if (event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          openBrokerPage(brokerName);
        }
      });
    });
  }

  decorateBrokerRows();
  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    new MutationObserver(function(){ decorateBrokerRows(); }).observe(app,{childList:true,subtree:true});
  }
})();
