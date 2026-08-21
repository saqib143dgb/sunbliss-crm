(function(){
  'use strict';

  if (window.__sunblissSalesChannelDrilldownInstalled) return;
  window.__sunblissSalesChannelDrilldownInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissSalesChannelDrilldownStyle';
  style.textContent = [
    '.sales-channel-drilldown{position:relative;cursor:pointer;padding-right:30px!important;transition:background .15s ease,border-color .15s ease;}',
    '.sales-channel-drilldown:hover{background:var(--paper-dim);}',
    '.sales-channel-drilldown:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;}',
    '.sales-channel-drilldown::after{content:"⌄";position:absolute;right:11px;top:50%;font-size:16px;line-height:1;color:var(--muted);transform:translateY(-55%);transition:transform .15s ease;}',
    '.sales-channel-drilldown[aria-expanded="true"]::after{transform:translateY(-45%) rotate(180deg);}',
    '.sales-channel-detail{margin:-8px 0 18px;border:1px solid var(--paper-line);border-radius:12px;overflow:hidden;background:var(--paper);}',
    '.sales-channel-detail-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 12px;background:var(--paper-dim);border-bottom:1px solid var(--paper-line);}',
    '.sales-channel-detail-title{font-size:12.5px;font-weight:700;color:var(--ink);}',
    '.sales-channel-detail-count{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--muted);white-space:nowrap;}',
    '.sales-channel-detail .list{padding:0;}',
    '.sales-channel-detail .row-btn{padding:11px 10px;}',
    '.sales-channel-detail .row-btn:last-child{border-bottom:none;}',
    '.sales-channel-detail .row-meta{white-space:normal;line-height:1.35;}',
    '@media(max-width:480px){.sales-channel-drilldown{padding-right:26px!important}.sales-channel-drilldown::after{right:8px;font-size:14px}.sales-channel-detail .row-btn{gap:9px;padding:10px 8px}.sales-channel-detail .row-unit{font-size:10.5px;padding:4px 6px}.sales-channel-detail .row-amt{max-width:105px}.sales-channel-detail .row-amt-val{font-size:11px}}'
  ].join('');
  document.head.appendChild(style);

  function title(value){
    var text = String(value || '').trim();
    if (!text) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(text);
    return text.toLowerCase().replace(/\b\w/g, function(ch){ return ch.toUpperCase(); });
  }

  function amount(value){
    if (typeof window.fmtAED === 'function') return window.fmtAED(value);
    var num = Number(value || 0);
    return 'AED ' + Math.round(num).toLocaleString('en-US');
  }

  function isBrokerCustomer(customer){
    return !!(customer && customer.info && String(customer.info.brokerName || '').trim());
  }

  function customersFor(channel){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    return dues.filter(function(customer){
      return channel === 'broker' ? isBrokerCustomer(customer) : !isBrokerCustomer(customer);
    }).slice().sort(function(a,b){
      var an = String(a.name || '').toLowerCase();
      var bn = String(b.name || '').toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return String(a.unit || '').localeCompare(String(b.unit || ''), undefined, { numeric:true });
    });
  }

  function findSalesChannelPipeline(){
    var labels = document.querySelectorAll('.overview .section-label');
    for (var i=0; i<labels.length; i++){
      if (String(labels[i].textContent || '').trim().toLowerCase() !== 'sales channel') continue;
      var next = labels[i].nextElementSibling;
      if (next && next.classList && next.classList.contains('pipeline')) return next;
    }
    return null;
  }

  function removeDetail(){
    var old = document.getElementById('salesChannelCustomerDetail');
    if (old) old.remove();
  }

  function updateExpandedState(pipeline){
    if (!pipeline) return;
    var open = window.state && window.state.__salesChannelOpen;
    var cards = pipeline.querySelectorAll('.sales-channel-drilldown');
    cards.forEach(function(card){
      card.setAttribute('aria-expanded', String(card.getAttribute('data-channel') === open));
    });
  }

  function makeCustomerRow(customer, channel){
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'row-btn sales-channel-customer-row';

    var unit = document.createElement('span');
    unit.className = 'row-unit';
    unit.textContent = customer.unit || '—';

    var main = document.createElement('span');
    main.className = 'row-main';

    var name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = title(customer.name);
    main.appendChild(name);

    var meta = document.createElement('span');
    meta.className = 'row-meta';
    var info = customer.info || {};
    if (channel === 'broker'){
      var broker = title(info.brokerName);
      var company = title(info.brokerCompany);
      meta.textContent = 'Broker: ' + (broker || '—') + (company ? ' · ' + company : '');
    } else {
      meta.textContent = 'Direct sale';
    }
    main.appendChild(meta);

    var amt = document.createElement('span');
    amt.className = 'row-amt';
    var amtValue = document.createElement('span');
    amtValue.className = 'row-amt-val';
    amtValue.textContent = amount(customer.total);
    var amtLabel = document.createElement('span');
    amtLabel.className = 'row-amt-lbl';
    amtLabel.textContent = 'sales value';
    amt.appendChild(amtValue);
    amt.appendChild(amtLabel);

    row.appendChild(unit);
    row.appendChild(main);
    row.appendChild(amt);

    row.addEventListener('click', function(){
      if (typeof window.goToDetail === 'function'){
        window.goToDetail(customer.unit, customer.sno, 'insights');
      }
    });

    return row;
  }

  function renderDetail(pipeline, channel){
    removeDetail();
    if (!pipeline || !channel) return;

    var customers = customersFor(channel);
    var detail = document.createElement('div');
    detail.id = 'salesChannelCustomerDetail';
    detail.className = 'sales-channel-detail';

    var head = document.createElement('div');
    head.className = 'sales-channel-detail-head';

    var heading = document.createElement('span');
    heading.className = 'sales-channel-detail-title';
    heading.textContent = channel === 'broker' ? 'Broker customers' : 'Direct customers';

    var count = document.createElement('span');
    count.className = 'sales-channel-detail-count';
    count.textContent = customers.length + ' unit' + (customers.length === 1 ? '' : 's');

    head.appendChild(heading);
    head.appendChild(count);
    detail.appendChild(head);

    if (customers.length){
      var list = document.createElement('div');
      list.className = 'list';
      customers.forEach(function(customer){
        list.appendChild(makeCustomerRow(customer, channel));
      });
      detail.appendChild(list);
    } else {
      var empty = document.createElement('div');
      empty.className = 'tx-empty';
      empty.textContent = 'No customers in this sales channel.';
      detail.appendChild(empty);
    }

    pipeline.insertAdjacentElement('afterend', detail);
  }

  function toggleChannel(pipeline, channel){
    if (!window.state) return;
    window.state.__salesChannelOpen = window.state.__salesChannelOpen === channel ? null : channel;
    updateExpandedState(pipeline);
    renderDetail(pipeline, window.state.__salesChannelOpen);
  }

  function decorate(){
    var pipeline = findSalesChannelPipeline();
    if (!pipeline || pipeline.children.length < 2) return;

    var cards = [pipeline.children[0], pipeline.children[1]];
    var channels = ['direct', 'broker'];

    cards.forEach(function(card, index){
      if (!card || card.getAttribute('data-sales-channel-ready') === '1') return;
      var channel = channels[index];
      card.classList.add('sales-channel-drilldown');
      card.setAttribute('data-channel', channel);
      card.setAttribute('data-sales-channel-ready', '1');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-controls', 'salesChannelCustomerDetail');
      card.setAttribute('aria-label', (channel === 'broker' ? 'Broker sales' : 'Direct sales') + ' — show customers');
      card.addEventListener('click', function(){ toggleChannel(pipeline, channel); });
      card.addEventListener('keydown', function(event){
        if (event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          toggleChannel(pipeline, channel);
        }
      });
    });

    updateExpandedState(pipeline);
    var open = window.state && window.state.__salesChannelOpen;
    var currentDetail = document.getElementById('salesChannelCustomerDetail');
    if (open && !currentDetail) renderDetail(pipeline, open);
    if (!open && currentDetail) currentDetail.remove();
  }

  decorate();

  var main = document.getElementById('main');
  if (main && window.MutationObserver){
    new MutationObserver(function(){ decorate(); }).observe(main, { childList:true, subtree:true });
  }
})();
