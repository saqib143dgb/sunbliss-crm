(function(){
  'use strict';

  if (window.__sunblissCancelledUnitArchiveInstalled) return;
  window.__sunblissCancelledUnitArchiveInstalled = true;

  var cache = {
    loaded:false,
    loading:null,
    records:[],
    byId:{},
    version:0
  };
  window.__sunblissCancelledUnitArchive = cache;

  var style = document.createElement('style');
  style.id = 'sunblissCancelledUnitArchiveStyle';
  style.textContent = [
    '.cancelled-archive-summary{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1px!important;background:var(--paper-line)!important;border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important;margin-bottom:10px!important;}',
    '.cancelled-archive-summary .stat-cell{min-width:0!important;}',
    '.cancelled-archive-row{cursor:pointer!important;position:relative!important;padding-right:26px!important;}',
    '.cancelled-archive-row:hover,.cancelled-archive-row:active{background:var(--paper-dim)!important;}',
    '.cancelled-archive-row:focus-visible{outline:2px solid var(--gold-deep)!important;outline-offset:-2px!important;border-radius:8px!important;}',
    '.cancelled-archive-row::after{content:"›";position:absolute;right:7px;top:50%;transform:translateY(-50%);font-size:22px;line-height:1;color:var(--gold-deep);}',
    '.cancelled-archive-page{padding:14px 18px 34px;}',
    '.cancelled-archive-back{display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--muted);font-size:13px;font-weight:600;padding:7px 2px;margin:0 0 8px;}',
    '.cancelled-archive-back:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px;border-radius:6px;}',
    '.cancelled-archive-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--rust);margin:2px 0 5px;}',
    '.cancelled-archive-title{font-family:Fraunces,serif;font-size:24px;line-height:1.12;font-weight:600;color:var(--ink);margin:0 0 3px;}',
    '.cancelled-archive-customer{font-size:12.5px;color:var(--muted);margin:0 0 12px;line-height:1.45;}',
    '.cancelled-archive-badges{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px;}',
    '.cancelled-archive-finance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:13px;overflow:hidden;margin:0 0 14px;}',
    '.cancelled-archive-finance>div{background:var(--paper);padding:12px 11px;min-width:0;}',
    '.cancelled-archive-finance-label{font-family:"IBM Plex Mono",monospace;font-size:8.8px;text-transform:uppercase;letter-spacing:.055em;color:var(--muted);margin:0 0 5px;}',
    '.cancelled-archive-finance-value{font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--ink);margin:0;overflow-wrap:anywhere;}',
    '.cancelled-archive-finance-value.loss{color:var(--rust);}',
    '.cancelled-archive-finance-value.good{color:var(--sage);}',
    '.cancelled-archive-explain{padding:11px 12px;border:1px solid rgba(198,151,46,.35);border-radius:11px;background:rgba(198,151,46,.08);font-size:11.5px;line-height:1.55;color:var(--ink);margin:0 0 17px;}',
    '.cancelled-archive-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--paper-line);border-radius:11px;margin-bottom:14px;}',
    '.cancelled-archive-table{width:100%;min-width:620px;border-collapse:collapse;font-size:10.5px;}',
    '.cancelled-archive-table th{font-family:"IBM Plex Mono",monospace;font-size:8.5px;text-transform:uppercase;letter-spacing:.04em;text-align:left;color:var(--muted);padding:8px 9px;border-bottom:1px solid var(--paper-line);background:var(--paper-dim);white-space:nowrap;}',
    '.cancelled-archive-table td{padding:8px 9px;border-bottom:1px solid rgba(220,210,182,.7);vertical-align:top;}',
    '.cancelled-archive-table tr:last-child td{border-bottom:0;}',
    '.cancelled-archive-timeline{display:flex;flex-direction:column;margin:0 0 14px;}',
    '.cancelled-archive-event{display:grid;grid-template-columns:82px 12px 1fr;gap:8px;align-items:start;padding:6px 0;}',
    '.cancelled-archive-event-date{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--muted);padding-top:1px;}',
    '.cancelled-archive-event-dot{width:8px;height:8px;border-radius:50%;background:var(--gold-deep);margin-top:3px;position:relative;}',
    '.cancelled-archive-event-dot::after{content:"";position:absolute;left:3px;top:8px;width:1px;height:28px;background:var(--paper-line);}',
    '.cancelled-archive-event:last-child .cancelled-archive-event-dot::after{display:none;}',
    '.cancelled-archive-event-main{font-size:11.5px;line-height:1.45;color:var(--ink);}',
    '.cancelled-archive-event-main b{font-weight:650;}',
    '.cancelled-sensitive{border:0;background:none;padding:0;color:var(--ink);font-family:"IBM Plex Mono",monospace;font-size:11.5px;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;cursor:pointer;}',
    '.cancelled-archive-empty{padding:15px 2px;color:var(--muted);font-size:12px;}',
    '@media(max-width:420px){.cancelled-archive-page{padding-left:14px;padding-right:14px}.cancelled-archive-title{font-size:22px}.cancelled-archive-finance{grid-template-columns:1fr 1fr}.cancelled-archive-event{grid-template-columns:72px 10px 1fr;gap:6px}.cancelled-archive-row{gap:8px!important}.cancelled-archive-row .row-amt{max-width:115px!important}.cancelled-archive-row .row-amt-val{font-size:10.5px!important}}'
  ].join('');
  document.head.appendChild(style);

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function esc(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function nice(value){
    var v = text(value).trim();
    if (!v) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(v);
    return v.toLowerCase().replace(/\b\w/g,function(ch){ return ch.toUpperCase(); });
  }
  function num(value){
    if (value === null || value === undefined || value === '') return null;
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  function money(value){
    var n = num(value);
    if (n === null) return 'Not recorded';
    if (typeof window.fmtAED === 'function') return window.fmtAED(n);
    return 'AED ' + n.toLocaleString('en-US',{maximumFractionDigits:2});
  }
  function compactMoney(value){
    var n = num(value);
    if (n === null) return 'Not recorded';
    if (typeof window.fmtCompact === 'function') return 'AED ' + window.fmtCompact(n);
    return money(n);
  }
  function dateObj(value){
    if (!value) return null;
    var d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  function dateMs(value){
    var d = dateObj(value);
    return d ? d.getTime() : 0;
  }
  function dateLabel(value){
    var d = dateObj(value);
    if (!d) return 'Not recorded';
    if (typeof window.fmtDate === 'function') return window.fmtDate(d);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function firstNonBlank(){
    for (var i=0;i<arguments.length;i++){
      var value = arguments[i];
      if (value !== null && value !== undefined && text(value).trim() !== '') return value;
    }
    return null;
  }
  function maskValue(value){
    var v = text(value).trim();
    if (!v) return '';
    if (v.length <= 4) return '••••';
    return v.slice(0,2) + '••••' + v.slice(-2);
  }

  function queryError(result){
    return result && result.error ? result.error : null;
  }

  function saleWhen(sale){
    return firstNonBlank(sale && sale.booking_date,sale && sale.created_at);
  }

  function buildRecord(cancel, customerById, unitById, sales, txns, schedules, profileById){
    var cancelledUnit = unitById[String(cancel.unit_id)] || null;
    var unitNo = cancelledUnit ? cancelledUnit.unit_no : '';
    var cutoffRaw = firstNonBlank(cancel.cancellation_date,cancel.created_at);
    var cutoff = dateMs(cutoffRaw);

    var samePhysicalSales = sales.filter(function(sale){
      var saleUnit = unitById[String(sale.unit_id)] || null;
      if (String(sale.unit_id) === String(cancel.unit_id)) return true;
      return !!(unitNo && saleUnit && saleUnit.unit_no === unitNo);
    }).slice().sort(function(a,b){
      var diff = dateMs(saleWhen(a)) - dateMs(saleWhen(b));
      return diff || (Number(a.id||0)-Number(b.id||0));
    });

    var originalCandidates = samePhysicalSales.filter(function(sale){
      if (String(sale.customer_id) !== String(cancel.customer_id)) return false;
      var when = dateMs(saleWhen(sale));
      return !cutoff || !when || when <= cutoff;
    });
    var originalSale = originalCandidates.length ? originalCandidates[originalCandidates.length-1] : null;

    var resaleCandidates = samePhysicalSales.filter(function(sale){
      if (String(sale.customer_id) === String(cancel.customer_id)) return false;
      var when = dateMs(saleWhen(sale));
      return cutoff ? when > cutoff : true;
    });
    var resaleSale = resaleCandidates.length ? resaleCandidates[0] : null;

    var originalSaleUnit = originalSale ? (unitById[String(originalSale.unit_id)] || cancelledUnit) : cancelledUnit;
    var resaleUnit = resaleSale ? (unitById[String(resaleSale.unit_id)] || null) : null;

    var snapshotValue = num(cancel.cancelled_sale_value);
    var originalSaleValue = snapshotValue;
    if (originalSaleValue === null && originalSale && originalSaleUnit && num(originalSaleUnit.total_price) !== null && !resaleSale){
      originalSaleValue = num(originalSaleUnit.total_price);
    }
    if (originalSaleValue === null && !resaleSale && cancelledUnit && num(cancelledUnit.total_price) !== null){
      originalSaleValue = num(cancelledUnit.total_price);
    }

    var resaleValue = resaleSale && resaleUnit ? num(resaleUnit.total_price) : null;
    var lostAmount = null;
    if (originalSaleValue !== null){
      if (!resaleSale) lostAmount = originalSaleValue;
      else if (resaleValue !== null) lostAmount = Math.max(0,originalSaleValue-resaleValue);
    }

    var forfeited = num(cancel.forfeited_amount);
    if (forfeited === null) forfeited = 0;
    var refund = num(cancel.refund_amount);
    if (refund === null) refund = 0;

    var relatedTx = txns.filter(function(tx){
      return String(tx.customer_id) === String(cancel.customer_id) &&
        (String(tx.unit_id) === String(cancel.unit_id) || (unitNo && (unitById[String(tx.unit_id)]||{}).unit_no === unitNo));
    }).slice().sort(function(a,b){
      return dateMs(a.payment_date)-dateMs(b.payment_date) || Number(a.id||0)-Number(b.id||0);
    });

    var relatedSchedule = schedules.filter(function(row){
      return String(row.customer_id) === String(cancel.customer_id) &&
        (String(row.unit_id) === String(cancel.unit_id) || (unitNo && (unitById[String(row.unit_id)]||{}).unit_no === unitNo));
    }).slice().sort(function(a,b){
      return dateMs(a.due_date)-dateMs(b.due_date) || Number(a.id||0)-Number(b.id||0);
    });

    var transactionPaid = relatedTx.reduce(function(sum,tx){ return sum + (num(tx.amount)||0); },0);
    var amountPaid = num(cancel.amount_paid);
    if (amountPaid === null) amountPaid = transactionPaid;

    var netUnrecovered = lostAmount === null ? null : Math.max(0,lostAmount-forfeited);
    var resaleCustomer = resaleSale ? (customerById[String(resaleSale.customer_id)] || null) : null;

    return {
      id:Number(cancel.id),
      cancel:cancel,
      customer:customerById[String(cancel.customer_id)] || null,
      unit:cancelledUnit,
      unitNo:unitNo,
      originalSale:originalSale,
      originalSaleUnit:originalSaleUnit,
      originalSaleValue:originalSaleValue,
      resaleSale:resaleSale,
      resaleUnit:resaleUnit,
      resaleCustomer:resaleCustomer,
      resaleValue:resaleValue,
      lostAmount:lostAmount,
      amountPaid:amountPaid,
      refundAmount:refund,
      forfeitedAmount:forfeited,
      netUnrecovered:netUnrecovered,
      transactions:relatedTx,
      schedule:relatedSchedule,
      cancelledBy:profileById[String(cancel.cancelled_by)] || null
    };
  }

  function syncStateCancelled(records){
    if (!window.state) return;
    if (!Array.isArray(state.cancelled)) state.cancelled = [];
    var existingByUnit = {};
    var existingByNo = {};
    state.cancelled.forEach(function(item){
      if (!item) return;
      if (item.sno !== null && item.sno !== undefined) existingByUnit[String(item.sno)] = item;
      if (item.unit) existingByNo[String(item.unit)] = item;
    });

    records.forEach(function(record){
      var item = existingByUnit[String(record.cancel.unit_id)] || (record.unitNo ? existingByNo[String(record.unitNo)] : null);
      if (!item){
        item = {
          sno:record.cancel.unit_id,
          name:record.customer ? record.customer.customer_name || '' : '',
          unit:record.unitNo || '',
          type:record.unit ? record.unit.unit_type || '' : '',
          total:record.originalSaleValue,
          received:record.amountPaid,
          outstanding:null,
          spa:'',
          oqood:'',
          furniture:'',
          stages:[]
        };
        state.cancelled.push(item);
      }
      item.cancelArchiveId = record.id;
      item.cancelMeta = record.cancel;
      item.total = record.originalSaleValue;
      item.received = record.amountPaid;
      item.lostAmount = record.lostAmount;
      item.forfeitedAmount = record.forfeitedAmount;
      item.refundAmount = record.refundAmount;
      item.resold = !!record.resaleSale;
      if (!item.name && record.customer) item.name = record.customer.customer_name || '';
      if (!item.unit) item.unit = record.unitNo || '';
      if (!item.type && record.unit) item.type = record.unit.unit_type || '';
    });

    state.cancelled.sort(function(a,b){
      var ar = cache.byId[String(a.cancelArchiveId)] || null;
      var br = cache.byId[String(b.cancelArchiveId)] || null;
      return dateMs(br && firstNonBlank(br.cancel.cancellation_date,br.cancel.created_at)) -
        dateMs(ar && firstNonBlank(ar.cancel.cancellation_date,ar.cancel.created_at));
    });
  }

  async function loadArchive(force){
    if (!window.sb || !window.state) return [];
    if (cache.loading && !force) return cache.loading;
    if (cache.loaded && !force) return cache.records;

    cache.loading = (async function(){
      var results = await Promise.all([
        sb.from('cancelled_units').select('*').order('id',{ascending:true}),
        sb.from('customers').select('*'),
        sb.from('units').select('*'),
        sb.from('sales').select('*').order('id',{ascending:true}),
        sb.from('payment_transactions').select('*').order('payment_date',{ascending:true}).order('id',{ascending:true}),
        sb.from('payment_schedule').select('*').order('id',{ascending:true}),
        sb.from('profiles').select('id,full_name')
      ]);

      for (var i=0;i<6;i++){
        if (queryError(results[i])) throw results[i].error;
      }

      var customers = results[1].data || [];
      var units = results[2].data || [];
      var sales = results[3].data || [];
      var txns = results[4].data || [];
      var schedules = results[5].data || [];
      var profiles = results[6] && !results[6].error ? (results[6].data || []) : [];

      var customerById = {};
      var unitById = {};
      var profileById = {};
      customers.forEach(function(row){ customerById[String(row.id)] = row; });
      units.forEach(function(row){ unitById[String(row.id)] = row; });
      profiles.forEach(function(row){ profileById[String(row.id)] = row; });

      var records = (results[0].data || []).map(function(cancel){
        return buildRecord(cancel,customerById,unitById,sales,txns,schedules,profileById);
      }).sort(function(a,b){
        return dateMs(firstNonBlank(b.cancel.cancellation_date,b.cancel.created_at)) -
          dateMs(firstNonBlank(a.cancel.cancellation_date,a.cancel.created_at));
      });

      cache.records = records;
      cache.byId = {};
      records.forEach(function(record){ cache.byId[String(record.id)] = record; });
      cache.loaded = true;
      cache.version += 1;
      syncStateCancelled(records);
      return records;
    })();

    try{
      return await cache.loading;
    }finally{
      cache.loading = null;
    }
  }

  function summaryCell(label,value,sub){
    return '<div class="stat-cell"><p class="stat-label">'+esc(label)+'</p><p class="stat-value">'+esc(value)+'</p><p class="stat-sub">'+esc(sub||'')+'</p></div>';
  }

  function cancelledSection(){
    var labels = document.querySelectorAll('.overview .section-label');
    for (var i=0;i<labels.length;i++){
      var label = labels[i];
      if (text(label.textContent).trim().toLowerCase().indexOf('cancelled units') !== 0) continue;
      var summary = label.nextElementSibling;
      var list = summary ? summary.nextElementSibling : null;
      return {label:label,summary:summary,list:list};
    }
    return null;
  }

  function rowLossLabel(record){
    if (record.lostAmount === null) return 'Not recorded';
    return compactMoney(record.lostAmount);
  }

  function decorateInsights(){
    if (!cache.loaded || !cache.records.length || (window.state && state.__cancelledArchiveDetailOpen)) return;
    var section = cancelledSection();
    if (!section || !section.summary || !section.list) return;
    var version = String(cache.version);
    if (section.list.getAttribute('data-cancelled-archive-version') === version) return;

    section.label.textContent = 'Cancelled units · tap for full history';

    var totalLost = 0;
    var knownLost = 0;
    var forfeited = 0;
    var refunded = 0;
    cache.records.forEach(function(record){
      if (record.lostAmount !== null){ totalLost += record.lostAmount; knownLost += 1; }
      forfeited += record.forfeitedAmount || 0;
      refunded += record.refundAmount || 0;
    });
    var unknown = cache.records.length-knownLost;

    section.summary.className = 'cancelled-archive-summary';
    section.summary.removeAttribute('style');
    section.summary.innerHTML =
      summaryCell('Cancelled',String(cache.records.length),'archived units') +
      summaryCell('Current lost value',knownLost ? compactMoney(totalLost) : 'Not recorded',unknown ? unknown+' legacy value'+(unknown===1?'':'s')+' missing' : 'updates after resale') +
      summaryCell('Forfeited',compactMoney(forfeited),'retained from customers') +
      summaryCell('Refunded',compactMoney(refunded),'returned to customers');
    section.summary.setAttribute('data-cancelled-archive-version',version);

    var html = '';
    cache.records.forEach(function(record){
      var customerName = record.customer ? nice(record.customer.customer_name) : 'Customer not recorded';
      var cancelDate = dateLabel(firstNonBlank(record.cancel.cancellation_date,record.cancel.created_at));
      var reason = firstNonBlank(record.cancel.cancellation_type,record.cancel.cancellation_reason,'Cancellation');
      var lossCaption = record.resaleSale ? 'loss after resale' : 'lost until resale';
      var forfeitedLabel = record.forfeitedAmount > 0 ? ' · forfeited '+compactMoney(record.forfeitedAmount) : '';
      html += '<button type="button" class="row-btn cancelled-archive-row" data-cancel-id="'+esc(record.id)+'">' +
        '<span class="row-unit">'+esc(record.unitNo || '—')+'</span>' +
        '<span class="row-main"><span class="row-name">'+esc(customerName)+'</span>' +
          '<span class="row-meta"><span>'+esc(cancelDate)+'</span><span>·</span><span>'+esc(reason)+'</span></span></span>' +
        '<span class="row-amt"><span class="row-amt-val" style="color:var(--rust)">'+esc(rowLossLabel(record))+'</span>' +
          '<span class="row-amt-lbl">'+esc(lossCaption+forfeitedLabel)+'</span></span>' +
      '</button>';
    });
    section.list.innerHTML = html;
    section.list.setAttribute('data-cancelled-archive-version',version);

    section.list.querySelectorAll('.cancelled-archive-row').forEach(function(row){
      row.addEventListener('click',function(){
        openCancelledDetail(Number(row.getAttribute('data-cancel-id')));
      });
    });
  }

  function field(label,value){
    if (value === null || value === undefined || text(value).trim() === '') return '';
    return '<div class="field-row"><span class="field-label">'+esc(label)+'</span><span class="field-value">'+esc(value)+'</span></div>';
  }
  function addressField(label,value){
    if (!value) return '';
    return '<div class="field-address"><span class="field-label">'+esc(label)+'</span><span class="field-value">'+esc(value)+'</span></div>';
  }
  function sensitiveField(label,key,value){
    if (!value) return '';
    return '<div class="field-row"><span class="field-label">'+esc(label)+'</span><button type="button" class="cancelled-sensitive" data-sensitive="'+esc(key)+'">'+esc(maskValue(value))+' · show</button></div>';
  }
  function financeCell(label,value,className){
    return '<div><p class="cancelled-archive-finance-label">'+esc(label)+'</p><p class="cancelled-archive-finance-value '+esc(className||'')+'">'+esc(value)+'</p></div>';
  }
  function badge(label,good){
    return '<span class="badge '+(good?'badge-good':'badge-warn')+'">'+esc(label)+'</span>';
  }

  function customerSection(record){
    var c = record.customer;
    if (!c) return '<div class="cancelled-archive-empty">Customer record is no longer available.</div>';
    var html = '';
    html += field('Name',nice(c.customer_name));
    html += field('Phone',c.phone);
    html += field('Email',c.email);
    html += field('Nationality',nice(c.nationality));
    html += field('Occupation',nice(c.designation));
    html += field('Date of birth',c.date_of_birth ? dateLabel(c.date_of_birth) : '');
    html += field('Co-applicant',nice(c.co_applicant));
    html += sensitiveField('Passport','passport',c.passport_no);
    html += sensitiveField('Emirates ID','eid',c.eid_no);
    html += addressField('Address',c.address);
    html += addressField('Permanent address',c.permanent_address);
    return html || '<div class="cancelled-archive-empty">No customer details were recorded.</div>';
  }

  function unitSection(record){
    var u = record.unit || record.originalSaleUnit;
    if (!u) return '<div class="cancelled-archive-empty">Unit record is no longer available.</div>';
    var html = '';
    html += field('Unit',u.unit_no);
    html += field('Project',u.project_name);
    html += field('Type',u.unit_type);
    html += field('Floor',u.floor);
    html += field('Area',u.area !== null && u.area !== undefined ? u.area+' sqft' : '');
    html += field('Price / sqft',u.price_per_sqft !== null && u.price_per_sqft !== undefined ? money(u.price_per_sqft) : '');
    html += field('Current unit status',u.status);
    return html || '<div class="cancelled-archive-empty">No unit details were recorded.</div>';
  }

  function saleSection(record){
    var s = record.originalSale;
    if (!s) return '<div class="cancelled-archive-empty">The original sale record is not available for this legacy cancellation.</div>';
    var broker = [nice(s.broker_name),nice(s.broker_company)].filter(Boolean).join(' · ');
    var html = '';
    html += field('Booking date',s.booking_date ? dateLabel(s.booking_date) : '');
    html += field('Booking amount',s.booking_amount !== null && s.booking_amount !== undefined ? money(s.booking_amount) : '');
    html += field('Original sale value',record.originalSaleValue !== null ? money(record.originalSaleValue) : 'Not recorded');
    html += field('Sold by / RM',nice(s.sold_by));
    html += field('Source',nice(s.source));
    html += field('Broker',broker);
    html += field('Brokerage %',s.brokerage_percentage !== null && s.brokerage_percentage !== undefined ? s.brokerage_percentage+'%' : '');
    html += field('Brokerage amount',s.brokerage_amount !== null && s.brokerage_amount !== undefined ? money(s.brokerage_amount) : '');
    html += field('SPA',s.spa_status);
    html += field('SPA date',s.spa_date ? dateLabel(s.spa_date) : '');
    html += field('OQOOD',s.oqood_status);
    html += field('OQOOD date',s.oqood_date ? dateLabel(s.oqood_date) : '');
    html += field('Furniture',s.furniture_status);
    html += field('DLD',s.dld_status);
    html += addressField('Sale remarks',s.remarks);
    return html;
  }

  function cancellationSection(record){
    var c = record.cancel;
    var html = '';
    html += field('Cancellation date',c.cancellation_date ? dateLabel(c.cancellation_date) : 'Not recorded');
    html += field('Reason category',c.cancellation_type || 'Not recorded');
    html += addressField('Detailed reason',c.cancellation_reason || 'Not recorded');
    html += field('Settlement',c.settlement_type || 'Not recorded');
    html += field('Paid before cancellation',money(record.amountPaid));
    html += field('Refunded',money(record.refundAmount));
    html += field('Forfeited',money(record.forfeitedAmount));
    html += addressField('Remarks / follow-up',c.remarks);
    html += field('Cancelled by',record.cancelledBy ? record.cancelledBy.full_name : '');
    html += field('Archive created',c.created_at ? dateLabel(c.created_at) : '');
    return html;
  }

  function scheduleSection(record){
    if (!record.schedule.length) return '<div class="cancelled-archive-empty">No installment schedule is linked to this cancelled customer/unit.</div>';
    var html = '<div class="cancelled-archive-table-wrap"><table class="cancelled-archive-table"><thead><tr><th>Stage</th><th>Due</th><th>Due date</th><th>Paid</th><th>Paid date</th><th>Status</th></tr></thead><tbody>';
    record.schedule.forEach(function(row){
      html += '<tr><td>'+esc(row.stage_name || '—')+'</td><td>'+esc(money(row.due_amount))+'</td><td>'+esc(row.due_date ? dateLabel(row.due_date) : '—')+'</td><td>'+esc(money(row.paid_amount))+'</td><td>'+esc(row.paid_date ? dateLabel(row.paid_date) : '—')+'</td><td>'+esc(row.status || '—')+'</td></tr>';
    });
    return html + '</tbody></table></div>';
  }

  function transactionsSection(record){
    if (!record.transactions.length) return '<div class="cancelled-archive-empty">No payment transactions are linked to this cancelled customer/unit.</div>';
    var html = '<div class="tx-list">';
    record.transactions.forEach(function(tx){
      var sub = [tx.payment_reference ? 'Ref '+tx.payment_reference : '',tx.remarks || ''].filter(Boolean).join(' · ');
      html += '<div class="tx-row"><span class="tx-date">'+esc(tx.payment_date ? dateLabel(tx.payment_date) : '—')+'</span>' +
        '<span class="tx-main"><span class="tx-towards">'+esc(tx.payment_type || 'Payment')+'</span><br/><span class="tx-status">'+esc(sub)+'</span></span>' +
        '<span class="tx-amt">'+esc(money(tx.amount))+'</span></div>';
    });
    return html + '</div>';
  }

  function resaleSection(record){
    if (!record.resaleSale){
      return '<div class="cancelled-archive-explain">This unit has not been resold yet. Its cancelled sale value stays in <b>Current lost amount</b> until a new sale for the same unit is recorded.</div>';
    }
    var s = record.resaleSale;
    var broker = [nice(s.broker_name),nice(s.broker_company)].filter(Boolean).join(' · ');
    var html = '';
    html += field('Resale customer',record.resaleCustomer ? nice(record.resaleCustomer.customer_name) : 'Not recorded');
    html += field('Resale booking date',saleWhen(s) ? dateLabel(saleWhen(s)) : 'Not recorded');
    html += field('Resale sale value',record.resaleValue !== null ? money(record.resaleValue) : 'Not recorded');
    html += field('Sold by / RM',nice(s.sold_by));
    html += field('Source',nice(s.source));
    html += field('Broker',broker);
    return html;
  }

  function timelineEvents(record){
    var events = [];
    if (record.originalSale && saleWhen(record.originalSale)){
      events.push({date:saleWhen(record.originalSale),label:'Original sale booked',detail:record.customer ? nice(record.customer.customer_name) : ''});
    }
    record.transactions.forEach(function(tx){
      events.push({date:tx.payment_date,label:'Payment received',detail:(tx.payment_type || 'Payment')+' · '+money(tx.amount)});
    });
    var cancelWhen = firstNonBlank(record.cancel.cancellation_date,record.cancel.created_at);
    if (cancelWhen){
      events.push({date:cancelWhen,label:'Unit cancelled',detail:firstNonBlank(record.cancel.cancellation_reason,record.cancel.cancellation_type,'')});
    }
    if (record.resaleSale && saleWhen(record.resaleSale)){
      events.push({date:saleWhen(record.resaleSale),label:'Unit resold',detail:record.resaleCustomer ? nice(record.resaleCustomer.customer_name) : ''});
    }
    events.sort(function(a,b){ return dateMs(a.date)-dateMs(b.date); });
    return events;
  }

  function timelineSection(record){
    var events = timelineEvents(record);
    if (!events.length) return '<div class="cancelled-archive-empty">No dated history is available.</div>';
    var html = '<div class="cancelled-archive-timeline">';
    events.forEach(function(event){
      html += '<div class="cancelled-archive-event"><span class="cancelled-archive-event-date">'+esc(dateLabel(event.date))+'</span><span class="cancelled-archive-event-dot"></span><span class="cancelled-archive-event-main"><b>'+esc(event.label)+'</b>'+(event.detail ? '<br/>'+esc(event.detail) : '')+'</span></div>';
    });
    return html + '</div>';
  }

  function lossExplanation(record){
    if (record.originalSaleValue === null){
      return 'The original sale value was not retained for this legacy cancellation, so the lost amount is shown as “Not recorded” instead of incorrectly showing zero.';
    }
    if (!record.resaleSale){
      return 'This unit is still not resold. Current lost amount remains the full cancelled sale value ('+money(record.originalSaleValue)+') until a new sale for the same unit is recorded.';
    }
    if (record.resaleValue === null){
      return 'The unit has been resold, but the resale value is not recorded, so the remaining price loss cannot be calculated yet.';
    }
    return 'The unit has been resold. Current lost amount is the original cancelled sale value minus the resale sale value, never below zero: '+money(record.originalSaleValue)+' − '+money(record.resaleValue)+' = '+money(record.lostAmount)+'.';
  }

  function openCancelledDetail(id){
    var record = cache.byId[String(id)];
    if (!record) return;
    var main = document.getElementById('main') || window.mainEl;
    if (!main) return;

    if (window.state){
      state.__cancelledArchiveDetailOpen = true;
      state.__cancelledArchiveDetailId = id;
    }
    window.__sunblissDockSearchOpen = false;
    var dockPanel = document.getElementById('sunblissDockSearchPanel');
    if (dockPanel) dockPanel.classList.remove('is-open');

    var customerName = record.customer ? nice(record.customer.customer_name) : 'Customer not recorded';
    var settlement = record.cancel.settlement_type || 'Cancellation';
    var statusLabel = record.resaleSale ? 'Resold' : 'Awaiting resale';

    var html = '<div class="cancelled-archive-page">';
    html += '<button type="button" class="cancelled-archive-back" id="cancelledArchiveBack">← Back to Insights</button>';
    html += '<p class="cancelled-archive-eyebrow">Cancelled unit archive</p>';
    html += '<h2 class="cancelled-archive-title">Unit '+esc(record.unitNo || '—')+'</h2>';
    html += '<p class="cancelled-archive-customer">'+esc(customerName)+'</p>';
    html += '<div class="cancelled-archive-badges">'+badge('Cancelled',false)+badge(settlement,record.forfeitedAmount>0)+badge(statusLabel,!!record.resaleSale)+'</div>';

    html += '<div class="cancelled-archive-finance">';
    html += financeCell('Original sale value',record.originalSaleValue !== null ? money(record.originalSaleValue) : 'Not recorded','');
    html += financeCell('Current lost amount',record.lostAmount !== null ? money(record.lostAmount) : 'Not recorded','loss');
    html += financeCell('Paid before cancel',money(record.amountPaid),'');
    html += financeCell('Forfeited',money(record.forfeitedAmount),'good');
    html += financeCell('Refunded',money(record.refundAmount),'');
    html += financeCell('Net unrecovered after forfeiture',record.netUnrecovered !== null ? money(record.netUnrecovered) : 'Not recorded','loss');
    html += '</div>';
    html += '<div class="cancelled-archive-explain">'+esc(lossExplanation(record))+'</div>';

    html += '<p class="section-label">Cancellation</p>'+cancellationSection(record);
    html += '<p class="section-label">Unit details</p>'+unitSection(record);
    html += '<p class="section-label">Original customer</p>'+customerSection(record);
    html += '<p class="section-label">Original sale &amp; compliance</p>'+saleSection(record);
    html += '<p class="section-label">Installment schedule at cancellation</p>'+scheduleSection(record);
    html += '<p class="section-label">Payment history before cancellation</p>'+transactionsSection(record);
    html += '<p class="section-label">Resale / recovery</p>'+resaleSection(record);
    html += '<p class="section-label">Unit history timeline</p>'+timelineSection(record);
    html += '</div>';

    main.innerHTML = html;

    var back = document.getElementById('cancelledArchiveBack');
    if (back) back.addEventListener('click',function(){
      if (window.state){
        state.__cancelledArchiveDetailOpen = false;
        state.__cancelledArchiveDetailId = null;
        state.view = 'insights';
      }
      if (typeof window.renderInsights === 'function') window.renderInsights();
      if (window.scrollTo) window.scrollTo(0,0);
    });

    main.querySelectorAll('.cancelled-sensitive').forEach(function(button){
      button.addEventListener('click',function(){
        var key = button.getAttribute('data-sensitive');
        var value = '';
        if (record.customer){
          if (key === 'passport') value = record.customer.passport_no || '';
          if (key === 'eid') value = record.customer.eid_no || '';
        }
        var open = button.getAttribute('data-open') === '1';
        button.setAttribute('data-open',open ? '0' : '1');
        button.textContent = open ? (maskValue(value)+' · show') : (value+' · hide');
      });
    });

    if (window.scrollTo) window.scrollTo(0,0);
  }

  var priorRenderInsights = typeof window.renderInsights === 'function' ? window.renderInsights : null;
  if (priorRenderInsights){
    window.renderInsights = function(){
      if (window.state){
        state.__cancelledArchiveDetailOpen = false;
        state.__cancelledArchiveDetailId = null;
      }
      var out = priorRenderInsights.apply(this,arguments);
      decorateInsights();
      return out;
    };
  }

  var priorLoad = typeof window.loadFromSupabase === 'function' ? window.loadFromSupabase : null;
  if (priorLoad){
    window.loadFromSupabase = async function(){
      var out = await priorLoad.apply(this,arguments);
      try{
        await loadArchive(true);
      }catch(e){
        console.warn('Could not refresh cancelled-unit archive',e);
      }
      return out;
    };
  }

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      window.requestAnimationFrame(decorateInsights);
    });
    observer.observe(app,{childList:true,subtree:true});
  }

  loadArchive(false).then(function(){
    if (window.state && state.view === 'insights' && !state.__cancelledArchiveDetailOpen && typeof window.renderInsights === 'function'){
      window.renderInsights();
    }else{
      decorateInsights();
    }
  }).catch(function(e){
    console.warn('Could not load cancelled-unit archive',e);
  });
})();
