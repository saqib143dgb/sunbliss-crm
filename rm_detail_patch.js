(function(){
  'use strict';

  if (window.__sunblissRmDetailInstalled) return;
  window.__sunblissRmDetailInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissRmDetailStyle';
  style.textContent = [
    '.rm-performance-clickable{position:relative!important;cursor:pointer!important;padding-right:32px!important;transition:background .15s ease;}',
    '.rm-performance-clickable:hover,.rm-performance-clickable:active{background:var(--paper-dim)!important;}',
    '.rm-performance-clickable:focus-visible{outline:2px solid var(--gold-deep);outline-offset:-2px;border-radius:8px;}',
    '.rm-performance-clickable::after{content:"›";position:absolute;right:10px;top:50%;transform:translateY(-50%);font-family:Inter,sans-serif;font-size:22px;line-height:1;color:var(--gold-deep);}',
    '.rm-detail-page{padding:14px 18px 30px;}',
    '.rm-detail-back{display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--muted);font-size:13px;font-weight:600;padding:7px 2px;margin:0 0 8px;}',
    '.rm-detail-back:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;border-radius:6px;}',
    '.rm-detail-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-deep);margin:2px 0 5px;}',
    '.rm-detail-name{font-family:Fraunces,serif;font-size:24px;line-height:1.12;font-weight:600;color:var(--ink);margin:0 0 4px;}',
    '.rm-detail-sub{font-size:12px;color:var(--muted);margin:0 0 16px;line-height:1.5;}',
    '.rm-detail-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:14px;overflow:hidden;margin-bottom:14px;}',
    '.rm-detail-summary .stat-cell{min-width:0;}',
    '.rm-detail-channel{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px;}',
    '.rm-detail-channel-card{border:1px solid var(--paper-line);border-radius:11px;padding:10px 11px;background:var(--paper);}',
    '.rm-detail-channel-label{font-family:"IBM Plex Mono",monospace;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 4px;}',
    '.rm-detail-channel-value{font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--ink);margin:0;}',
    '.rm-detail-channel-sub{font-size:10px;color:var(--muted);margin:2px 0 0;}',
    '.rm-unit-list{display:flex;flex-direction:column;gap:10px;}',
    '.rm-unit-card{width:100%;text-align:left;background:var(--paper);border:1px solid var(--paper-line);border-radius:12px;padding:12px;box-shadow:0 1px 2px rgba(15,26,38,.03);}',
    '.rm-unit-card:hover,.rm-unit-card:active{background:var(--paper-dim);}',
    '.rm-unit-card:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;}',
    '.rm-unit-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;}',
    '.rm-unit-head-main{flex:1;min-width:0;overflow:hidden;}',
    '.rm-unit-customer{display:block;font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--ink);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.rm-unit-head-sub{font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.35;}',
    '.rm-unit-value{flex:none;text-align:right;font-family:"IBM Plex Mono",monospace;font-size:11.5px;font-weight:600;color:var(--ink);white-space:nowrap;}',
    '.rm-unit-value small{display:block;font-family:Inter,sans-serif;font-size:8.5px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:2px;}',
    '.rm-unit-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;border-top:1px solid var(--paper-line);padding-top:6px;}',
    '.rm-unit-field{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(220,210,182,.55);min-width:0;}',
    '.rm-unit-field-label{font-size:9.5px;color:var(--muted);flex:none;}',
    '.rm-unit-field-value{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--ink);text-align:right;min-width:0;word-break:break-word;}',
    '.rm-unit-open{font-size:9.5px;color:var(--gold-deep);font-weight:700;text-align:right;margin-top:8px;}',
    '@media(max-width:420px){.rm-detail-page{padding-left:14px;padding-right:14px}.rm-detail-name{font-size:22px}.rm-unit-grid{grid-template-columns:1fr}.rm-unit-head{gap:8px}.rm-unit-value{font-size:10.5px}}'
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

  function rmKey(value){
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

  function customersForRm(rmName){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var key = rmKey(rmName);
    return dues.filter(function(customer){
      return customer && customer.info && rmKey(customer.info.soldBy) === key;
    }).slice().sort(function(a,b){
      var ad = a.info && a.info.bookingDate ? new Date(a.info.bookingDate).getTime() : 0;
      var bd = b.info && b.info.bookingDate ? new Date(b.info.bookingDate).getTime() : 0;
      if (ad !== bd) return bd - ad;
      return String(a.unit || '').localeCompare(String(b.unit || ''),undefined,{numeric:true});
    });
  }

  function findRmList(){
    var labels = document.querySelectorAll('.overview .section-label');
    for (var i=0;i<labels.length;i++){
      var text = String(labels[i].textContent || '').trim().toLowerCase();
      if (text.indexOf('rm performance') !== 0) continue;
      var list = labels[i].nextElementSibling;
      if (list && list.classList && list.classList.contains('list')) return list;
    }
    return null;
  }

  function field(label,value){
    if (value === null || value === undefined || String(value).trim() === '') return '';
    return '<div class="rm-unit-field"><span class="rm-unit-field-label">'+esc(label)+'</span><span class="rm-unit-field-value">'+esc(value)+'</span></div>';
  }

  function unitCard(customer){
    var info = customer.info || {};
    var total = Number(customer.total || 0);
    var received = Number(customer.received || 0);
    var outstanding = Math.max(0,total-received);
    var broker = String(info.brokerName || '').trim();
    var channel = broker ? 'Broker' : 'Direct';
    var channelDetail = broker ? nice(broker) + (info.brokerCompany ? ' · ' + nice(info.brokerCompany) : '') : 'Direct sale';
    var typeLine = customer.type ? nice(customer.type) : '';
    var areaFloor = [];
    if (info.floor !== null && info.floor !== undefined && String(info.floor).trim() !== '') areaFloor.push('Floor ' + info.floor);
    if (info.area !== null && info.area !== undefined && String(info.area).trim() !== '') areaFloor.push(info.area + ' sqft');

    var html = '<button type="button" class="rm-unit-card" data-unit="'+esc(customer.unit)+'" data-sno="'+esc(customer.sno)+'">';
    html += '<div class="rm-unit-head"><span class="row-unit">'+esc(customer.unit || '—')+'</span><span class="rm-unit-head-main"><span class="rm-unit-customer">'+esc(shortCustomerName(customer.name))+'</span><span class="rm-unit-head-sub">'+esc([typeLine,areaFloor.join(' · ')].filter(Boolean).join(' · '))+'</span></span><span class="rm-unit-value">'+esc(money(total))+'<small>sales value</small></span></div>';
    html += '<div class="rm-unit-grid">';
    html += field('Booking',dateText(info.bookingDate));
    html += field('Channel',channel);
    html += field('Collected',money(received));
    html += field('Outstanding',money(outstanding));
    html += field('Source',nice(info.source));
    html += field('Broker',channelDetail);
    html += field('SPA',customer.spa || 'Not started');
    html += field('OQOOD',customer.oqood || 'Not started');
    html += field('Booking amount',info.bookingAmt ? money(info.bookingAmt) : '');
    html += field('Price / sqft',info.pricePerSqft ? money(info.pricePerSqft) : '');
    html += '</div><div class="rm-unit-open">Open full unit details ›</div></button>';
    return html;
  }

  function openRmPage(rmName){
    var main = document.getElementById('main');
    if (!main) return;

    var customers = customersForRm(rmName);
    var totalValue = customers.reduce(function(sum,c){return sum + Number(c.total || 0);},0);
    var received = customers.reduce(function(sum,c){return sum + Number(c.received || 0);},0);
    var outstanding = Math.max(0,totalValue-received);
    var pct = totalValue > 0 ? Math.round(received/totalValue*1000)/10 : 0;
    var direct = customers.filter(function(c){return !(c.info && String(c.info.brokerName || '').trim());});
    var broker = customers.filter(function(c){return c.info && String(c.info.brokerName || '').trim();});
    var directValue = direct.reduce(function(sum,c){return sum + Number(c.total || 0);},0);
    var brokerValue = broker.reduce(function(sum,c){return sum + Number(c.total || 0);},0);
    var displayName = nice(rmName);

    var html = '<div class="rm-detail-page">';
    html += '<button type="button" class="rm-detail-back" id="rmDetailBack">← Back to Insights</button>';
    html += '<p class="rm-detail-eyebrow">Relationship Manager performance</p>';
    html += '<h2 class="rm-detail-name">'+esc(displayName)+'</h2>';
    html += '<p class="rm-detail-sub">Complete sales portfolio for this RM, using the same Sold By data as the Insights totals.</p>';
    html += '<div class="rm-detail-summary">';
    html += '<div class="stat-cell"><p class="stat-label">Units sold</p><p class="stat-value">'+customers.length+'</p><p class="stat-sub">total units</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Sales value</p><p class="stat-value">AED '+esc(compact(totalValue))+'</p><p class="stat-sub">total sold value</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Collected</p><p class="stat-value">AED '+esc(compact(received))+'</p><p class="stat-sub">'+esc(pct)+'% collected</p></div>';
    html += '<div class="stat-cell"><p class="stat-label">Outstanding</p><p class="stat-value">AED '+esc(compact(outstanding))+'</p><p class="stat-sub">remaining on these sales</p></div>';
    html += '</div>';
    html += '<p class="section-label">Sales channel</p><div class="rm-detail-channel">';
    html += '<div class="rm-detail-channel-card"><p class="rm-detail-channel-label">Direct</p><p class="rm-detail-channel-value">'+direct.length+' unit'+(direct.length===1?'':'s')+'</p><p class="rm-detail-channel-sub">AED '+esc(compact(directValue))+'</p></div>';
    html += '<div class="rm-detail-channel-card"><p class="rm-detail-channel-label">Broker</p><p class="rm-detail-channel-value">'+broker.length+' unit'+(broker.length===1?'':'s')+'</p><p class="rm-detail-channel-sub">AED '+esc(compact(brokerValue))+'</p></div>';
    html += '</div>';
    html += '<p class="section-label">Units sold by '+esc(displayName)+'</p>';
    html += '<div class="rm-unit-list">';
    if (customers.length){
      customers.forEach(function(customer){ html += unitCard(customer); });
    } else {
      html += '<div class="tx-empty">No units are currently assigned to this RM.</div>';
    }
    html += '</div></div>';

    main.innerHTML = html;
    if (window.state) window.state.__rmDetailName = rmName;

    var back = document.getElementById('rmDetailBack');
    if (back) back.addEventListener('click',function(){
      if (window.state) window.state.__rmDetailName = null;
      if (typeof window.renderInsights === 'function') window.renderInsights();
      if (window.scrollTo) window.scrollTo(0,0);
    });

    main.querySelectorAll('.rm-unit-card').forEach(function(card){
      card.addEventListener('click',function(){
        if (typeof window.goToDetail === 'function'){
          window.goToDetail(card.getAttribute('data-unit'),card.getAttribute('data-sno'),'insights');
        }
      });
    });

    if (window.scrollTo) window.scrollTo(0,0);
  }

  function decorateRmRows(){
    var list = findRmList();
    if (!list) return;
    var rows = Array.prototype.slice.call(list.children || []).filter(function(row){return row.classList && row.classList.contains('row-btn');});
    rows.forEach(function(row){
      if (row.getAttribute('data-rm-detail-ready') === '1') return;
      var nameEl = row.querySelector('.row-name');
      var rmName = nameEl ? String(nameEl.textContent || '').trim() : '';
      if (!rmName) return;
      row.setAttribute('data-rm-detail-ready','1');
      row.setAttribute('data-rm-name',rmName);
      row.classList.add('rm-performance-clickable');
      row.setAttribute('role','button');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label','Open full sales details for ' + rmName);
      row.addEventListener('click',function(){ openRmPage(rmName); });
      row.addEventListener('keydown',function(event){
        if (event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          openRmPage(rmName);
        }
      });
    });
  }

  decorateRmRows();
  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    new MutationObserver(function(){ decorateRmRows(); }).observe(app,{childList:true,subtree:true});
  }
})();