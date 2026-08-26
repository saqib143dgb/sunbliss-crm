(function(){
  'use strict';
  if (window.__sunblissMonthlySalesDrilldownInstalled) return;
  window.__sunblissMonthlySalesDrilldownInstalled = true;

  var archivePromise = null;

  function text(v){ return v == null ? '' : String(v); }
  function safe(v){
    if (typeof window.esc === 'function') return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; });
  }
  function nice(v){
    var s=text(v).trim();
    if (!s) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(s);
    return s.toLowerCase().replace(/\b\w/g,function(ch){ return ch.toUpperCase(); });
  }
  function num(v){ var n=Number(v); return isFinite(n) ? n : null; }
  function money(v){
    var n=num(v);
    if (n===null) return 'Not recorded';
    if (typeof window.fmtAED === 'function') return window.fmtAED(n);
    return 'AED '+n.toLocaleString('en-US',{maximumFractionDigits:2});
  }
  function compact(v){
    var n=Number(v)||0;
    if (typeof window.fmtCompact === 'function') return window.fmtCompact(n);
    return Math.round(n).toLocaleString('en-US');
  }
  function monthKey(v){
    var s=text(v).trim();
    var m=s.match(/^(\d{4})-(\d{2})/);
    return m ? m[1]+'-'+m[2] : '';
  }
  function monthLabel(key){
    if (!/^\d{4}-\d{2}$/.test(key)) return key;
    var d=new Date(key+'-01T00:00:00');
    return d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  }
  function dateLabel(v){
    var s=text(v).trim();
    if (!s) return '—';
    var d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T00:00:00':s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function field(label,value){
    if (value===null || value===undefined || text(value).trim()==='') return '';
    return '<div class="monthly-sale-field"><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong></div>';
  }

  function ensureStyles(){
    if (document.getElementById('sunblissMonthlySalesStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissMonthlySalesStyles';
    style.textContent=[
      '.monthly-sales-panel{margin:0 0 20px}',
      '.monthly-sales-help{font-size:11px;color:var(--muted);margin:-5px 2px 10px;line-height:1.45}',
      '.monthly-sales-months{border-top:1px solid var(--paper-line)}',
      '.monthly-sales-month-btn{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;background:transparent;border:0;border-bottom:1px solid var(--paper-line);padding:12px 2px;color:var(--ink)}',
      '.monthly-sales-month-btn:hover,.monthly-sales-month-btn:active{background:rgba(198,151,46,.06)}',
      '.monthly-sales-month-btn:focus-visible{outline:2px solid var(--gold-deep);outline-offset:1px;border-radius:8px}',
      '.monthly-sales-month-main{min-width:0}.monthly-sales-month-name{display:block;font-family:Fraunces,serif;font-size:14px;font-weight:650}.monthly-sales-month-meta{display:block;margin-top:3px;font-size:10.5px;color:var(--muted)}',
      '.monthly-sales-month-value{text-align:right}.monthly-sales-month-value strong{display:block;font:700 12.5px/1.25 IBM Plex Mono,monospace}.monthly-sales-month-value span{display:block;margin-top:3px;font-size:9.5px;color:var(--gold-deep)}',
      '#monthlySalesOverlay{position:fixed;inset:0;z-index:5000;background:rgba(15,26,38,.76);display:flex;justify-content:center;align-items:flex-start;padding:16px 10px;overflow:auto;-webkit-overflow-scrolling:touch}',
      '#monthlySalesDialog{width:min(680px,100%);background:var(--paper);border:1px solid var(--paper-line);border-radius:18px;box-shadow:0 24px 70px rgba(15,26,38,.38);overflow:hidden;margin:auto 0}',
      '.monthly-sales-dialog-head{position:sticky;top:0;z-index:3;background:var(--paper);border-bottom:1px solid var(--paper-line);padding:14px 16px 12px}',
      '.monthly-sales-dialog-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.monthly-sales-back{border:0;background:transparent;color:var(--muted);font:600 12px/1.2 Inter,sans-serif;padding:7px 2px}.monthly-sales-back:hover{color:var(--ink)}',
      '.monthly-sales-dialog-head h2{font-family:Fraunces,serif;font-size:22px;line-height:1.1;margin:7px 0 2px}.monthly-sales-dialog-head p{font-size:11px;color:var(--muted);margin:0}',
      '.monthly-sales-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--paper-line);border-bottom:1px solid var(--paper-line)}.monthly-sales-summary>div{background:var(--paper);padding:12px 10px}.monthly-sales-summary span{display:block;font:500 8.5px/1.25 IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px}.monthly-sales-summary strong{display:block;font:700 13px/1.2 Fraunces,serif;color:var(--ink)}',
      '.monthly-sales-body{padding:14px 14px 20px}.monthly-sales-search{display:flex;align-items:center;border:1px solid var(--paper-line);background:var(--paper-dim);border-radius:10px;margin-bottom:12px}.monthly-sales-search input{width:100%;border:0;background:transparent;outline:0;padding:11px 12px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink)}',
      '.monthly-sale-card{border:1px solid var(--paper-line);border-radius:12px;background:var(--paper);margin-bottom:9px;overflow:hidden}.monthly-sale-card[open]{border-color:rgba(198,151,46,.55)}.monthly-sale-card summary{list-style:none;cursor:pointer;padding:12px}.monthly-sale-card summary::-webkit-details-marker{display:none}',
      '.monthly-sale-summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}.monthly-sale-unit{font:700 10.5px/1.2 IBM Plex Mono,monospace;color:var(--gold-deep);background:rgba(198,151,46,.12);padding:5px 7px;border-radius:7px}.monthly-sale-main{min-width:0}.monthly-sale-customer{display:block;font-family:Fraunces,serif;font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.monthly-sale-meta{display:block;margin-top:3px;font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.monthly-sale-price{text-align:right;font:700 11.5px/1.25 IBM Plex Mono,monospace;white-space:nowrap}.monthly-sale-people{margin-top:7px;font-size:10px;color:var(--muted);line-height:1.45}.monthly-sale-people b{color:var(--ink);font-weight:650}',
      '.monthly-sale-details{border-top:1px solid var(--paper-line);padding:10px 12px 12px;background:rgba(235,227,206,.36)}.monthly-sale-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.monthly-sale-field{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(220,210,182,.75);font-size:10.5px}.monthly-sale-field span{color:var(--muted)}.monthly-sale-field strong{text-align:right;color:var(--ink);font:650 10.5px/1.35 IBM Plex Mono,monospace;word-break:break-word}.monthly-sales-empty{padding:24px 4px;text-align:center;color:var(--muted);font-size:12px}',
      'body.monthly-sales-open{overflow:hidden}',
      '@media(max-width:520px){#monthlySalesOverlay{padding:0;background:var(--paper)}#monthlySalesDialog{border:0;border-radius:0;min-height:100%;box-shadow:none}.monthly-sales-summary{grid-template-columns:1fr 1fr}.monthly-sale-fields{grid-template-columns:1fr}.monthly-sale-summary{grid-template-columns:auto minmax(0,1fr)}.monthly-sale-price{grid-column:2;text-align:left;margin-top:-4px}.monthly-sales-dialog-head{padding-top:calc(12px + env(safe-area-inset-top))}}'
    ].join('');
    document.head.appendChild(style);
  }

  async function loadArchive(){
    if (archivePromise) return archivePromise;
    archivePromise=(async function(){
      if (!window.sb) throw new Error('Sales database is not available.');
      var results=await Promise.all([
        sb.from('sales').select('*').order('booking_date',{ascending:false}),
        sb.from('customers').select('id,customer_name'),
        sb.from('units').select('*'),
        sb.from('cancelled_units').select('customer_id,unit_id,cancelled_sale_value,cancellation_date')
      ]);
      results.forEach(function(r){ if(r.error) throw r.error; });
      var customers={},units={},cancelled={};
      (results[1].data||[]).forEach(function(c){ customers[c.id]=c; });
      (results[2].data||[]).forEach(function(u){ units[u.id]=u; });
      (results[3].data||[]).forEach(function(c){ cancelled[text(c.unit_id)+'|'+text(c.customer_id)]=c; });
      return (results[0].data||[]).filter(function(s){ return !!monthKey(s.booking_date); }).map(function(s){
        var u=units[s.unit_id]||{},c=customers[s.customer_id]||{},cx=cancelled[text(s.unit_id)+'|'+text(s.customer_id)]||null;
        var snap=cx&&num(cx.cancelled_sale_value)!==null?num(cx.cancelled_sale_value):null;
        var price=snap!==null?snap:num(u.total_price);
        return {
          id:s.id,month:monthKey(s.booking_date),bookingDate:s.booking_date||'',customerId:s.customer_id,customer:c.customer_name||'',unitId:s.unit_id,unit:u.unit_no||'',type:u.unit_type||'',floor:u.floor||'',area:num(u.area),pricePerSqft:num(u.price_per_sqft),price:price,unitStatus:cx?'Cancelled':(u.status||''),
          bookingAmount:num(s.booking_amount),rm:s.sold_by||'',source:s.source||'',individualSource:s.individual_source_name||'',broker:s.broker_name||'',brokerCompany:s.broker_company||'',brokeragePct:num(s.brokerage_percentage),brokerageAmount:num(s.brokerage_amount),spa:s.spa_status||'',spaDate:s.spa_date||'',oqood:s.oqood_status||'',oqoodDate:s.oqood_date||'',dldStatus:s.dld_status||'',furnishing:s.furniture_status||u.furnishing_type||u.furniture_type||'',incentiveType:s.incentive_type||'',remarks:s.remarks||'',cancelledDate:cx?cx.cancellation_date||'':''
        };
      });
    })().catch(function(err){ archivePromise=null; throw err; });
    return archivePromise;
  }

  function groupMonths(rows){
    var groups={};
    rows.forEach(function(r){
      var g=groups[r.month]||(groups[r.month]={key:r.month,count:0,value:0,knownValueCount:0,brokered:0,direct:0});
      g.count++;
      if (r.price!==null){g.value+=r.price;g.knownValueCount++;}
      var isBroker=!!text(r.broker).trim() || /broker/i.test(text(r.source));
      if(isBroker)g.brokered++;else g.direct++;
    });
    return Object.keys(groups).sort().reverse().map(function(k){return groups[k];});
  }

  function findOldMonthlyLabel(){
    var labels=document.querySelectorAll('.overview .section-label');
    for(var i=0;i<labels.length;i++){
      if(text(labels[i].textContent).trim().toLowerCase().indexOf('monthly sales value')===0) return labels[i];
    }
    return null;
  }

  function hideOldMonthlySection(label,foot){
    if(!label)return;
    label.style.display='none';
    var node=label.nextElementSibling;
    while(node&&node!==foot){node.style.display='none';node=node.nextElementSibling;}
  }

  function renderMonthPanel(rows){
    var groups=groupMonths(rows),wrap=document.createElement('div');
    wrap.id='sunblissMonthlySalesDrilldown';wrap.className='monthly-sales-panel';
    var html='<p class="section-label">Monthly sales · tap a month for full details</p><p class="monthly-sales-help">Choose any month to see only the sales booked in that month, including customer, RM, broker, unit, price, type and sale details.</p><div class="monthly-sales-months">';
    groups.forEach(function(g){
      var value=g.knownValueCount?('AED '+compact(g.value)):'Not recorded';
      html+='<button type="button" class="monthly-sales-month-btn" data-month="'+safe(g.key)+'"><span class="monthly-sales-month-main"><span class="monthly-sales-month-name">'+safe(monthLabel(g.key))+'</span><span class="monthly-sales-month-meta">'+g.count+' sale'+(g.count===1?'':'s')+' · '+g.direct+' direct · '+g.brokered+' broker</span></span><span class="monthly-sales-month-value"><strong>'+safe(value)+'</strong><span>View details ›</span></span></button>';
    });
    html+='</div>';
    wrap.innerHTML=html;
    wrap.addEventListener('click',function(ev){var btn=ev.target.closest('.monthly-sales-month-btn');if(btn)openMonth(btn.getAttribute('data-month'),rows);});
    return wrap;
  }

  async function decorateInsights(){
    ensureStyles();
    if(!window.state||state.view!=='insights')return;
    var overview=document.querySelector('.overview');
    if(!overview||document.getElementById('sunblissMonthlySalesDrilldown'))return;
    try{
      var rows=await loadArchive();
      if(!rows.length)return;
      if(!document.querySelector('.overview')||state.view!=='insights')return;
      overview=document.querySelector('.overview');
      if(document.getElementById('sunblissMonthlySalesDrilldown'))return;
      var foot=overview.querySelector('.footnote'),old=findOldMonthlyLabel();
      hideOldMonthlySection(old,foot);
      var panel=renderMonthPanel(rows);
      if(foot)overview.insertBefore(panel,foot);else overview.appendChild(panel);
    }catch(err){console.warn('Could not load monthly sales drill-down',err);}
  }

  function saleSearchText(r){return [r.unit,r.customer,r.type,r.rm,r.source,r.individualSource,r.broker,r.brokerCompany,r.incentiveType,r.unitStatus].join(' ').toLowerCase();}

  function saleCard(r){
    var brokerLine=text(r.broker).trim()?nice(r.broker)+(text(r.brokerCompany).trim()?' · '+nice(r.brokerCompany):''):'—';
    var sourceLine=nice(r.source)||'—';
    if(/individual/i.test(text(r.source))&&text(r.individualSource).trim())sourceLine+=' · '+nice(r.individualSource);
    var html='<details class="monthly-sale-card" data-search="'+safe(saleSearchText(r))+'"><summary><div class="monthly-sale-summary"><span class="monthly-sale-unit">'+safe(r.unit||'—')+'</span><span class="monthly-sale-main"><span class="monthly-sale-customer">'+safe(nice(r.customer)||'Customer not recorded')+'</span><span class="monthly-sale-meta">'+safe(r.type||'Type not recorded')+' · '+safe(dateLabel(r.bookingDate))+'</span></span><span class="monthly-sale-price">'+safe(money(r.price))+'</span></div><div class="monthly-sale-people"><b>RM:</b> '+safe(nice(r.rm)||'—')+' &nbsp;·&nbsp; <b>Broker:</b> '+safe(brokerLine)+'</div></summary><div class="monthly-sale-details"><div class="monthly-sale-fields">';
    html+=field('Booking date',dateLabel(r.bookingDate));
    html+=field('Customer',nice(r.customer)||'Not recorded');
    html+=field('Unit',r.unit||'Not recorded');
    html+=field('Unit type',r.type||'Not recorded');
    html+=field('Total price',money(r.price));
    html+=field('RM / Sold by',nice(r.rm)||'Not recorded');
    html+=field('Source',sourceLine);
    html+=field('Broker',text(r.broker).trim()?nice(r.broker):'Not recorded');
    html+=field('Broker company',text(r.brokerCompany).trim()?nice(r.brokerCompany):'Not recorded');
    html+=field('Booking amount',r.bookingAmount===null?'Not recorded':money(r.bookingAmount));
    html+=field('Area',r.area===null?'Not recorded':r.area.toLocaleString('en-US',{maximumFractionDigits:2})+' sqft');
    html+=field('Price / sqft',r.pricePerSqft===null?'Not recorded':money(r.pricePerSqft));
    html+=field('Floor',r.floor||'Not recorded');
    html+=field('Brokerage %',r.brokeragePct===null?'Not recorded':r.brokeragePct+'%');
    html+=field('Brokerage amount',r.brokerageAmount===null?'Not recorded':money(r.brokerageAmount));
    html+=field('Incentive type',r.incentiveType||'Not recorded');
    html+=field('SPA status',r.spa||'Not recorded');
    html+=field('SPA date',r.spaDate?dateLabel(r.spaDate):'Not recorded');
    html+=field('OQOOD status',r.oqood||'Not recorded');
    html+=field('OQOOD date',r.oqoodDate?dateLabel(r.oqoodDate):'Not recorded');
    html+=field('DLD status',r.dldStatus||'Not recorded');
    html+=field('Furniture status',r.furnishing||'Not recorded');
    html+=field('Sale / unit status',r.unitStatus||'Not recorded');
    if(r.cancelledDate)html+=field('Cancellation date',dateLabel(r.cancelledDate));
    html+=field('Sale remarks',r.remarks||'Not recorded');
    html+=field('Sale record','#'+r.id);
    html+='</div></div></details>';
    return html;
  }

  function openMonth(key,rows){
    closeMonth();
    var monthRows=rows.filter(function(r){return r.month===key;}).sort(function(a,b){return text(a.bookingDate).localeCompare(text(b.bookingDate));});
    var total=0,known=0,brokered=0,direct=0;
    monthRows.forEach(function(r){if(r.price!==null){total+=r.price;known++;}if(text(r.broker).trim()||/broker/i.test(text(r.source)))brokered++;else direct++;});
    var avg=known?total/known:null;
    var overlay=document.createElement('div');overlay.id='monthlySalesOverlay';
    var html='<div id="monthlySalesDialog" role="dialog" aria-modal="true" aria-label="Sales for '+safe(monthLabel(key))+'"><div class="monthly-sales-dialog-head"><div class="monthly-sales-dialog-top"><button type="button" class="monthly-sales-back" id="monthlySalesClose">← Back to Insights</button><span style="font:600 10px/1.2 IBM Plex Mono,monospace;color:var(--gold-deep)">'+safe(key)+'</span></div><h2>'+safe(monthLabel(key))+' sales</h2><p>Only bookings from this month are shown below. Tap a sale to expand all recorded details.</p></div><div class="monthly-sales-summary"><div><span>Sales</span><strong>'+monthRows.length+'</strong></div><div><span>Sales value</span><strong>'+(known?'AED '+safe(compact(total)):'Not recorded')+'</strong></div><div><span>Average price</span><strong>'+(avg!==null?'AED '+safe(compact(avg)):'Not recorded')+'</strong></div><div><span>Channel</span><strong>'+direct+' direct · '+brokered+' broker</strong></div></div><div class="monthly-sales-body"><label class="monthly-sales-search"><input id="monthlySalesSearch" type="search" placeholder="Search customer, unit, RM or broker" autocomplete="off" /></label><div id="monthlySalesRows">';
    monthRows.forEach(function(r){html+=saleCard(r);});
    html+='</div><div id="monthlySalesNoResults" class="monthly-sales-empty" style="display:none">No sales in this month match that search.</div></div></div>';
    overlay.innerHTML=html;document.body.appendChild(overlay);document.body.classList.add('monthly-sales-open');
    document.getElementById('monthlySalesClose').addEventListener('click',closeMonth);
    overlay.addEventListener('click',function(ev){if(ev.target===overlay)closeMonth();});
    document.getElementById('monthlySalesSearch').addEventListener('input',function(){
      var q=this.value.trim().toLowerCase(),shown=0;
      overlay.querySelectorAll('.monthly-sale-card').forEach(function(card){var ok=!q||text(card.getAttribute('data-search')).indexOf(q)!==-1;card.style.display=ok?'':'none';if(ok)shown++;});
      document.getElementById('monthlySalesNoResults').style.display=shown?'none':'block';
    });
    window.setTimeout(function(){var s=document.getElementById('monthlySalesSearch');if(s)s.focus();},80);
  }

  function closeMonth(){
    var old=document.getElementById('monthlySalesOverlay');if(old)old.remove();
    document.body.classList.remove('monthly-sales-open');
  }

  function install(){
    if(typeof window.renderInsights!=='function'||typeof window.loadFromSupabase!=='function'){window.setTimeout(install,50);return;}
    ensureStyles();
    var baseInsights=window.renderInsights;
    window.renderInsights=function(){var out=baseInsights.apply(this,arguments);window.setTimeout(decorateInsights,0);return out;};
    var baseLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){archivePromise=null;return await baseLoad.apply(this,arguments);};
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&document.getElementById('monthlySalesOverlay'))closeMonth();});
    if(window.state&&state.view==='insights')window.setTimeout(decorateInsights,0);
  }
  install();
})();
