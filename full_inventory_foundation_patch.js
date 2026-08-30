(function(){
  'use strict';
  if(window.__sunblissFullInventoryFoundationInstalled)return;
  window.__sunblissFullInventoryFoundationInstalled=true;

  var rows=[];
  var byId={};
  var byUnit={};
  var loading=null;
  var activeFilter='all';
  var openInventoryId=null;

  function text(v){return v==null?'':String(v);}
  function safe(v){
    var s=text(v);
    if(typeof window.esc==='function')return window.esc(s);
    return s.replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function norm(v){return text(v).trim().toLowerCase();}
  function num(v){var n=Number(v);return isFinite(n)?n:null;}
  function fmtNum(v){var n=num(v);return n==null?'—':n.toLocaleString('en-US',{maximumFractionDigits:2});}
  function fmtMoney(v){var n=num(v);return n==null?'—':'AED '+n.toLocaleString('en-US',{maximumFractionDigits:0});}

  var style=document.createElement('style');
  style.id='sunblissFullInventoryFoundationStyle';
  style.textContent=[
    '.inventory-status-bar{margin:10px 0 8px;padding:10px;border:1px solid var(--paper-line);border-radius:12px;background:var(--paper-dim);}',
    '.inventory-status-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}',
    '.inventory-status-title{font:600 11px/1.2 "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);}',
    '.inventory-status-total{font:600 11px/1.2 "IBM Plex Mono",monospace;color:var(--ink);}',
    '.inventory-status-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:1px;-webkit-overflow-scrolling:touch;scrollbar-width:none;}',
    '.inventory-status-chips::-webkit-scrollbar{display:none}',
    '.inventory-status-chip{flex:none;border:1px solid var(--paper-line);background:var(--paper);color:var(--muted);border-radius:999px;padding:7px 10px;font:600 11px/1 Inter,sans-serif;white-space:nowrap;}',
    '.inventory-status-chip[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper);}',
    '.inventory-badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font:700 9px/1.1 Inter,sans-serif;margin-left:4px;white-space:nowrap;}',
    '.inventory-badge.available{background:rgba(63,122,87,.12);color:var(--sage);border:1px solid rgba(63,122,87,.28);}',
    '.inventory-badge.reserved{background:rgba(156,90,18,.11);color:var(--amber);border:1px solid rgba(156,90,18,.26);}',
    '.inventory-badge.blocked{background:rgba(69,86,107,.11);color:var(--slate);border:1px solid rgba(69,86,107,.24);}',
    '.inventory-only-row .row-name{font-weight:600;}',
    '.inventory-only-row .row-meta{flex-wrap:wrap;}',
    '.inventory-only-row .row-amt-val{color:var(--sage);}',
    '.inventory-list-empty{padding:26px 16px;text-align:center;color:var(--muted);font-size:12.5px;}',
    '.inventory-detail-page .inventory-hero{padding:14px;border:1px solid rgba(63,122,87,.28);background:rgba(63,122,87,.07);border-radius:12px;margin:0 0 16px;}',
    '.inventory-detail-page .inventory-hero-title{font:700 12.5px/1.25 Inter,sans-serif;color:var(--sage);margin-bottom:4px;}',
    '.inventory-detail-page .inventory-hero-copy{font-size:12px;line-height:1.5;color:var(--muted);}',
    '.inventory-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:12px;overflow:hidden;margin-bottom:16px;}',
    '.inventory-detail-cell{background:var(--paper);padding:12px;min-width:0;}',
    '.inventory-detail-label{font:600 9.5px/1.2 "IBM Plex Mono",monospace;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;}',
    '.inventory-detail-value{font:600 13px/1.3 Inter,sans-serif;color:var(--ink);word-break:break-word;}',
    '.inventory-history-card{border:1px solid rgba(174,59,43,.22);background:rgba(174,59,43,.055);border-radius:12px;padding:13px 14px;margin-bottom:16px;}',
    '.inventory-history-title{font:700 12px/1.3 Inter,sans-serif;color:var(--rust);margin-bottom:4px;}',
    '.inventory-history-copy{font-size:11.5px;line-height:1.5;color:var(--muted);margin-bottom:10px;}',
    '.inventory-history-card .btn-paper{margin:0;width:100%;justify-content:center;}',
    '@media(max-width:420px){.inventory-status-bar{margin-top:8px}.inventory-detail-grid{grid-template-columns:1fr 1fr}.inventory-detail-cell{padding:10px}.inventory-detail-value{font-size:12px}}'
  ].join('');
  document.head.appendChild(style);

  function rebuildMaps(){
    byId={};byUnit={};
    rows.forEach(function(r){
      if(r&&r.id!=null)byId[String(r.id)]=r;
      if(r&&r.unit_no)byUnit[norm(r.unit_no)]=r;
    });
  }

  function loadInventory(force){
    if(!window.sb)return Promise.resolve(rows);
    if(loading&&!force)return loading;
    if(rows.length&&!force)return Promise.resolve(rows);
    loading=window.sb.from('units').select('id,unit_no,project_name,unit_type,floor,area,price_per_sqft,total_price,status,customer_id,availability_status,layout_type,leg_no,unit_area_sqft,balcony_terrace_area_sqft,furnishing_status,list_price,list_price_per_sqft').order('unit_no',{ascending:true}).then(function(result){
      if(result.error)throw result.error;
      rows=Array.isArray(result.data)?result.data:[];
      rebuildMaps();
      return rows;
    }).catch(function(err){
      console.error('Could not load physical inventory',err);
      return rows;
    }).finally(function(){loading=null;});
    return loading;
  }

  function unitForRow(row){
    if(!row)return null;
    var id=row.getAttribute('data-sno');
    var unit=row.getAttribute('data-unit');
    return (id&&byId[String(id)]) || (unit&&byUnit[norm(unit)]) || null;
  }
  function availability(unit){return text(unit&&unit.availability_status)||'Sold';}
  function isCancelled(unit){return norm(unit&&unit.status)==='cancelled';}
  function matchesFilter(unit){
    if(!unit)return activeFilter==='all';
    if(activeFilter==='all')return true;
    if(activeFilter==='cancelled')return isCancelled(unit);
    return norm(availability(unit))===activeFilter;
  }
  function currentSearch(){
    if(window.state&&text(state.search).trim())return norm(state.search);
    var input=document.getElementById('searchInput');
    return input?norm(input.value):'';
  }
  function inventorySearchText(unit){
    return norm([unit.unit_no,unit.unit_type,unit.floor,unit.layout_type,unit.leg_no,unit.project_name,unit.availability_status].join(' '));
  }
  function matchesSearch(unit){var q=currentSearch();return !q||inventorySearchText(unit).indexOf(q)!==-1;}

  function counts(){
    var c={all:rows.length,available:0,reserved:0,sold:0,blocked:0,cancelled:0};
    rows.forEach(function(u){
      var a=norm(availability(u));
      if(Object.prototype.hasOwnProperty.call(c,a))c[a]++;
      if(isCancelled(u))c.cancelled++;
    });
    return c;
  }

  function chip(label,key,count){
    return '<button type="button" class="inventory-status-chip" data-inventory-filter="'+safe(key)+'" aria-pressed="'+(activeFilter===key?'true':'false')+'">'+safe(label)+' · '+safe(count)+'</button>';
  }
  function ensureStatusBar(){
    if(!window.state||state.view!=='list'||openInventoryId)return null;
    var controls=document.querySelector('#main .controls');
    if(!controls)return null;
    var bar=controls.querySelector('.inventory-status-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.className='inventory-status-bar';
      var toolbar=controls.querySelector('.units-action-toolbar');
      if(toolbar)toolbar.insertAdjacentElement('afterend',bar); else controls.appendChild(bar);
    }
    var c=counts();
    var chips=[chip('All','all',c.all),chip('Available','available',c.available),chip('Reserved','reserved',c.reserved),chip('Sold','sold',c.sold),chip('Cancelled','cancelled',c.cancelled)];
    if(c.blocked)chips.splice(4,0,chip('Blocked','blocked',c.blocked));
    bar.innerHTML='<div class="inventory-status-head"><span class="inventory-status-title">Physical Inventory</span><span class="inventory-status-total">'+safe(c.all)+' units</span></div><div class="inventory-status-chips">'+chips.join('')+'</div>';
    return bar;
  }

  function badgeLabel(unit){
    var a=availability(unit);
    if(a==='Available')return isCancelled(unit)?'Available for Resale':'Available';
    if(a==='Reserved')return 'Reserved';
    if(a==='Blocked')return 'Blocked';
    return '';
  }
  function decorateBaseRows(){
    document.querySelectorAll('#main .list .row-btn[data-sno][data-unit]').forEach(function(row){
      if(row.classList.contains('inventory-only-row'))return;
      var unit=unitForRow(row);
      if(!unit)return;
      row.setAttribute('data-inventory-availability',availability(unit));
      row.setAttribute('data-inventory-record-status',text(unit.status));
      var label=badgeLabel(unit);
      var meta=row.querySelector('.row-meta');
      var existing=row.querySelector('.inventory-badge');
      if(label&&meta){
        if(!existing){existing=document.createElement('span');existing.className='inventory-badge';meta.appendChild(existing);}
        existing.className='inventory-badge '+norm(availability(unit));
        existing.textContent=label;
      }else if(existing){existing.remove();}
      row.hidden=!matchesFilter(unit);
    });
  }

  function orphanRow(unit){
    var button=document.createElement('button');
    button.type='button';
    button.className='row-btn inventory-only-row';
    button.setAttribute('data-inventory-id',text(unit.id));
    button.setAttribute('data-inventory-unit',text(unit.unit_no));
    var meta=[];
    if(unit.floor)meta.push('Floor '+text(unit.floor));
    if(unit.area!=null)meta.push(fmtNum(unit.area)+' sq.ft');
    meta.push(availability(unit));
    button.innerHTML='<span class="row-unit">'+safe(unit.unit_no||'—')+'</span><span class="row-main"><span class="row-name">'+safe(unit.unit_type||'Available Unit')+'</span><span class="row-meta">'+safe(meta.join(' · '))+'<span class="inventory-badge '+safe(norm(availability(unit)))+'">'+safe(badgeLabel(unit)||availability(unit))+'</span></span></span><span class="row-amt"><span class="row-amt-val">'+safe(unit.list_price!=null?fmtMoney(unit.list_price):'Available')+'</span><span class="row-amt-lbl">'+safe(unit.list_price!=null?'List price':'Inventory')+'</span></span>';
    return button;
  }

  function injectCustomerlessRows(){
    var list=document.querySelector('#main .list');
    if(!list)return;
    list.querySelectorAll('.inventory-only-row,.inventory-list-empty').forEach(function(el){el.remove();});
    rows.filter(function(u){return !u.customer_id&&matchesFilter(u)&&matchesSearch(u);}).forEach(function(u){list.appendChild(orphanRow(u));});
    var visibleBase=Array.prototype.some.call(list.querySelectorAll('.row-btn:not(.inventory-only-row)'),function(el){return !el.hidden;});
    var visibleOrphans=list.querySelectorAll('.inventory-only-row').length;
    if(!visibleBase&&!visibleOrphans){
      var empty=document.createElement('div');empty.className='inventory-list-empty';empty.textContent='No units match this inventory view.';list.appendChild(empty);
    }
  }

  function applyInventoryView(){
    if(openInventoryId||!window.state||state.view!=='list')return;
    ensureStatusBar();
    decorateBaseRows();
    injectCustomerlessRows();
  }

  function previousCustomer(unit){
    var dues=window.state&&Array.isArray(state.dues)?state.dues:[];
    var id=text(unit&&unit.id),uno=norm(unit&&unit.unit_no);
    return dues.find(function(c){return c&&(text(c.sno)===id||norm(c.unit)===uno);})||null;
  }
  function cell(label,value){return '<div class="inventory-detail-cell"><div class="inventory-detail-label">'+safe(label)+'</div><div class="inventory-detail-value">'+safe(value||'—')+'</div></div>';}

  function renderInventoryDetail(){
    if(!openInventoryId)return false;
    var unit=byId[String(openInventoryId)];
    var main=document.getElementById('main');
    if(!unit||!main)return false;
    var prev=previousCustomer(unit);
    var history='';
    if(isCancelled(unit)){
      history='<div class="inventory-history-card"><div class="inventory-history-title">Previous booking cancelled · History preserved</div><div class="inventory-history-copy">This physical unit is available for resale. The cancelled booking, customer, payments and cancellation audit remain in the CRM and are not replaced.</div>'+(prev?'<button type="button" class="btn-paper" id="inventoryOpenPreviousCustomer">Open Previous Customer Record</button>':'')+'</div>';
    }
    main.innerHTML='<div class="detail inventory-detail-page"><button type="button" class="back" id="inventoryBackToUnits">← Back to Units</button><div class="d-unit">'+safe(unit.unit_no)+'</div><div class="d-name">'+safe(unit.unit_type||'Inventory Unit')+'</div><div class="d-type">'+safe(unit.project_name||'Sunbliss Residences')+'</div><div class="badges"><span class="badge badge-good">'+safe(isCancelled(unit)?'Available for Resale':availability(unit))+'</span>'+(isCancelled(unit)?'<span class="badge badge-warn">Previous booking cancelled</span>':'')+'</div><div class="inventory-hero"><div class="inventory-hero-title">Ready for inventory management</div><div class="inventory-hero-copy">This unit is managed as physical inventory, independently from customer sales and collection records.</div></div><p class="section-label">Unit Details</p><div class="inventory-detail-grid">'+cell('Floor',unit.floor)+cell('Total Area',unit.area!=null?fmtNum(unit.area)+' sq.ft':'—')+cell('Internal Area',unit.unit_area_sqft!=null?fmtNum(unit.unit_area_sqft)+' sq.ft':'—')+cell('Balcony / Terrace',unit.balcony_terrace_area_sqft!=null?fmtNum(unit.balcony_terrace_area_sqft)+' sq.ft':'—')+cell('Layout Type',unit.layout_type)+cell('LEG',unit.leg_no)+cell('Furnishing',unit.furnishing_status)+cell('List Price',unit.list_price!=null?fmtMoney(unit.list_price):'—')+'</div>'+history+'</div>';
    var back=document.getElementById('inventoryBackToUnits');
    if(back)back.onclick=function(){
      openInventoryId=null;
      if(window.state)state.view='list';
      if(typeof window.renderMain==='function')window.renderMain();
      else if(typeof window.renderList==='function')window.renderList();
      applyInventoryView();
      if(typeof window.scrollTo==='function')window.scrollTo(0,0);
    };
    var previous=document.getElementById('inventoryOpenPreviousCustomer');
    if(previous&&prev)previous.onclick=function(){
      openInventoryId=null;
      if(typeof window.__sunblissOpenCustomerDetail==='function')window.__sunblissOpenCustomerDetail(unit.unit_no,unit.id,'list');
    };
    return true;
  }

  function openDetail(unit){
    if(!unit)return;
    openInventoryId=unit.id;
    if(window.state)state.view='list';
    window.__sunblissDockSearchOpen=false;
    var panel=document.getElementById('sunblissDockSearchPanel');if(panel)panel.classList.remove('is-open');
    renderInventoryDetail();
    if(typeof window.scrollTo==='function')window.scrollTo(0,0);
  }

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest)return;
    var chipEl=event.target.closest('[data-inventory-filter]');
    if(chipEl){
      event.preventDefault();event.stopPropagation();
      activeFilter=chipEl.getAttribute('data-inventory-filter')||'all';
      applyInventoryView();
      return;
    }
    var nav=event.target.closest('.tabs .tab[data-view]');
    if(nav&&openInventoryId)openInventoryId=null;
  },false);

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest)return;
    var row=event.target.closest('#main .list .row-btn');
    if(!row)return;
    var unit=null;
    if(row.classList.contains('inventory-only-row'))unit=byId[String(row.getAttribute('data-inventory-id'))];
    else unit=unitForRow(row);
    if(!unit||availability(unit)!=='Available')return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openDetail(unit);
  },true);

  function wrapRender(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sunblissInventoryFoundationWrapped)return;
    function wrapped(){
      if(name==='renderMain'&&openInventoryId)return renderInventoryDetail();
      var out=original.apply(this,arguments);
      if(!openInventoryId&&window.state&&state.view==='list')applyInventoryView();
      return out;
    }
    wrapped.__sunblissInventoryFoundationWrapped=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }
  wrapRender('renderList');
  wrapRender('renderMain');

  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__sunblissInventoryRefreshWrapped){
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var result=await originalLoad.apply(this,arguments);
      await loadInventory(true);
      if(!openInventoryId&&window.state&&state.view==='list')applyInventoryView();
      return result;
    };
    window.loadFromSupabase.__sunblissInventoryRefreshWrapped=true;
    window.loadFromSupabase.__sunblissOriginal=originalLoad;
  }

  document.addEventListener('input',function(event){
    if(event.target&&(event.target.id==='searchInput'||event.target.id==='dockPersistentSearchInput')){
      if(!openInventoryId&&window.state&&state.view==='list')setTimeout(applyInventoryView,0);
    }
  },false);

  window.addEventListener('pageshow',function(){
    if(openInventoryId)renderInventoryDetail();
    else loadInventory(false).then(applyInventoryView);
  });
  loadInventory(false).then(applyInventoryView);
})();
