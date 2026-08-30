(function(){
  'use strict';
  if(window.__sunblissInventoryFoundationV2Installed)return;
  window.__sunblissInventoryFoundationV2Installed=true;

  var rows=[];
  var byId={};
  var byUnit={};
  var loading=null;
  var activeFilter='all';
  var openInventoryId=null;

  function text(v){return v==null?'':String(v);}
  function norm(v){return text(v).trim().toLowerCase();}
  function safe(v){
    var s=text(v);
    if(typeof window.esc==='function')return window.esc(s);
    return s.replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function num(v){var n=Number(v);return isFinite(n)?n:null;}
  function fmtNum(v){var n=num(v);return n==null?'—':n.toLocaleString('en-US',{maximumFractionDigits:2});}
  function fmtMoney(v){var n=num(v);return n==null?'—':'AED '+Math.round(n).toLocaleString('en-US');}
  function fmtCompact(v){
    var n=Number(v)||0,a=Math.abs(n);
    return a>=1000000?(n/1000000).toFixed(1)+'M':a>=1000?(n/1000).toFixed(0)+'K':Math.round(n).toLocaleString('en-US');
  }

  var style=document.createElement('style');
  style.id='sunblissInventoryFoundationV2Style';
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
    '.inventory-history-copy{font-size:11.5px;line-height:1.5;color:var(--muted);}',
    '@media(max-width:420px){.inventory-status-bar{margin-top:8px}.inventory-detail-grid{grid-template-columns:1fr 1fr}.inventory-detail-cell{padding:10px}.inventory-detail-value{font-size:12px}}'
  ].join('');
  document.head.appendChild(style);

  function sanitizeSalesState(){
    if(!window.state||!Array.isArray(state.dues))return;
    var clean=state.dues.filter(function(c){
      return !!c&&c.customerId!==null&&c.customerId!==undefined&&text(c.customerId).trim()!=='';
    });
    if(clean.length!==state.dues.length)state.dues=clean;
  }

  function clearInventoryCache(){rows=[];byId={};byUnit={};loading=null;}
  function rebuildMaps(){
    byId={};byUnit={};
    rows.forEach(function(r){
      if(r&&r.id!=null)byId[String(r.id)]=r;
      if(r&&r.unit_no)byUnit[norm(r.unit_no)]=r;
    });
  }
  function availability(unit){
    var value=text(unit&&unit.availability_status)||'Sold';
    return norm(value)==='reserved'?'Sold':value;
  }
  function isCancelled(unit){return norm(unit&&unit.status)==='cancelled';}

  function loadInventory(force){
    if(!window.sb)return Promise.resolve(rows);
    if(loading)return loading;
    if(rows.length&&!force)return Promise.resolve(rows);
    loading=window.sb.from('units')
      .select('id,unit_no,project_name,unit_type,floor,area,price_per_sqft,total_price,status,customer_id,availability_status,layout_type,leg_no,unit_area_sqft,balcony_terrace_area_sqft,furnishing_status,list_price,list_price_per_sqft')
      .order('unit_no',{ascending:true})
      .then(function(result){
        if(result.error)throw result.error;
        rows=Array.isArray(result.data)?result.data:[];
        rebuildMaps();
        return rows;
      })
      .catch(function(err){console.error('Could not load physical inventory',err);return rows;})
      .finally(function(){loading=null;});
    return loading;
  }

  function counts(){
    var c={all:rows.length,available:0,sold:0,cancelled:0};
    rows.forEach(function(u){
      var a=norm(availability(u));
      if(a==='available')c.available++;
      else if(a==='sold')c.sold++;
      if(isCancelled(u))c.cancelled++;
    });
    return c;
  }
  function matchesFilter(unit){
    if(!unit)return false;
    if(activeFilter==='all')return true;
    if(activeFilter==='cancelled')return isCancelled(unit);
    return norm(availability(unit))===activeFilter;
  }
  function currentSearch(){
    if(window.state&&text(state.search).trim())return norm(state.search);
    var input=document.getElementById('searchInput');
    if(input&&text(input.value).trim())return norm(input.value);
    var dock=document.getElementById('dockPersistentSearchInput');
    return dock?norm(dock.value):'';
  }
  function inventorySearchText(unit){
    return norm([unit.unit_no,unit.unit_type,unit.floor,unit.layout_type,unit.leg_no,unit.project_name,availability(unit)].join(' '));
  }
  function matchesSearch(unit){var q=currentSearch();return !q||inventorySearchText(unit).indexOf(q)!==-1;}

  function chip(label,key,count){
    return '<button type="button" class="inventory-status-chip" data-inventory-filter="'+safe(key)+'" aria-pressed="'+(activeFilter===key?'true':'false')+'">'+safe(label)+' · '+safe(count)+'</button>';
  }
  function ensureStatusBar(){
    if(!window.state||state.view!=='list'||openInventoryId||!rows.length)return null;
    var controls=document.querySelector('#main .controls');
    if(!controls)return null;
    var bar=controls.querySelector('.inventory-status-bar');
    if(!bar){
      bar=document.createElement('div');bar.className='inventory-status-bar';
      var toolbar=controls.querySelector('.units-action-toolbar');
      if(toolbar)toolbar.insertAdjacentElement('afterend',bar);else controls.appendChild(bar);
    }
    var c=counts();
    bar.innerHTML='<div class="inventory-status-head"><span class="inventory-status-title">Physical Inventory</span><span class="inventory-status-total">'+c.all+' units</span></div><div class="inventory-status-chips">'+[
      chip('All','all',c.all),chip('Available','available',c.available),chip('Sold','sold',c.sold),chip('Cancelled','cancelled',c.cancelled)
    ].join('')+'</div>';
    return bar;
  }

  function unitForBaseRow(row){
    if(!row)return null;
    var id=row.getAttribute('data-sno'),uno=row.getAttribute('data-unit');
    return (id&&byId[String(id)])||(uno&&byUnit[norm(uno)])||null;
  }
  function decorateBaseRows(){
    var list=document.querySelector('#main .list');
    if(!list)return [];
    var visible=[];
    list.querySelectorAll('.row-btn[data-sno][data-unit]:not(.inventory-only-row)').forEach(function(row){
      var unit=unitForBaseRow(row);
      var show=!!unit&&matchesFilter(unit);
      row.hidden=!show;
      if(show){row.style.removeProperty('display');visible.push(row);}
      else row.style.setProperty('display','none','important');
    });
    return visible;
  }

  function inventoryRow(unit){
    var button=document.createElement('button');
    button.type='button';button.className='row-btn inventory-only-row';
    button.setAttribute('data-inventory-id',text(unit.id));
    button.setAttribute('data-inventory-unit',text(unit.unit_no));
    var meta=[];
    if(unit.floor)meta.push('Floor '+text(unit.floor));
    if(unit.area!=null)meta.push(fmtNum(unit.area)+' sq.ft');
    if(isCancelled(unit))meta.push('Previous booking cancelled');else meta.push(availability(unit));
    var badge=isCancelled(unit)?'Available for Resale':availability(unit);
    var amount=unit.list_price!=null?fmtMoney(unit.list_price):badge;
    var amountLabel=unit.list_price!=null?'List price':'Inventory';
    button.innerHTML='<span class="row-unit">'+safe(unit.unit_no||'—')+'</span><span class="row-main"><span class="row-name">'+safe(unit.unit_type||'Inventory Unit')+'</span><span class="row-meta">'+safe(meta.join(' · '))+'<span class="inventory-badge available">'+safe(badge)+'</span></span></span><span class="row-amt"><span class="row-amt-val">'+safe(amount)+'</span><span class="row-amt-lbl">'+safe(amountLabel)+'</span></span>';
    return button;
  }
  function injectPhysicalOnlyRows(){
    var list=document.querySelector('#main .list');
    if(!list)return 0;
    list.querySelectorAll('.inventory-only-row,.inventory-list-empty').forEach(function(el){el.remove();});
    var generated=rows.filter(function(u){
      return (!u.customer_id||isCancelled(u))&&matchesFilter(u)&&matchesSearch(u);
    });
    generated.forEach(function(u){list.appendChild(inventoryRow(u));});
    return generated.length;
  }

  function updateResultLine(visibleBaseCount,inventoryOnlyCount){
    var line=document.querySelector('#main .result-count');
    if(!line)return;
    var c=counts(),q=currentSearch(),shown=visibleBaseCount+inventoryOnlyCount,copy='';
    if(activeFilter==='all'&&!q){
      copy=c.all+' physical units · '+c.sold+' sold · '+c.available+' available';
    }else if(activeFilter==='sold'&&!q){
      var sales=0,outstanding=0;
      (window.state&&Array.isArray(state.dues)?state.dues:[]).forEach(function(x){sales+=Number(x&&x.total)||0;outstanding+=Math.abs(Number(x&&x.outstanding)||0);});
      copy=shown+' of '+c.all+' physical units · AED '+fmtCompact(sales)+' active sales value · AED '+fmtCompact(outstanding)+' outstanding';
    }else{
      copy=shown+' of '+c.all+' physical units';
      if(q)copy+=' · matching inventory';
      else if(activeFilter==='available')copy+=' · Available inventory';
      else if(activeFilter==='cancelled')copy+=' · Available for resale';
    }
    if(text(line.textContent)!==copy)line.textContent=copy;
  }

  function applyInventoryView(){
    if(openInventoryId||!window.state||state.view!=='list'||!rows.length)return;
    ensureStatusBar();
    var visibleBase=decorateBaseRows();
    var generated=injectPhysicalOnlyRows();
    var list=document.querySelector('#main .list');
    if(list){
      var hasRows=visibleBase.length+generated>0;
      list.querySelectorAll('.no-results').forEach(function(el){el.style.display=hasRows?'none':'';});
      if(!hasRows){var empty=document.createElement('div');empty.className='inventory-list-empty';empty.textContent='No units match this inventory view.';list.appendChild(empty);}
    }
    updateResultLine(visibleBase.length,generated);
  }

  function previousCancelled(unit){
    var list=window.state&&Array.isArray(state.cancelled)?state.cancelled:[];
    return list.find(function(c){return c&&(text(c.sno)===text(unit.id)||norm(c.unit)===norm(unit.unit_no));})||null;
  }
  function cell(label,value){return '<div class="inventory-detail-cell"><div class="inventory-detail-label">'+safe(label)+'</div><div class="inventory-detail-value">'+safe(value||'—')+'</div></div>';}
  function renderInventoryDetail(){
    var unit=byId[String(openInventoryId)],main=document.getElementById('main');
    if(!unit||!main)return false;
    var previous=previousCancelled(unit),history='';
    if(isCancelled(unit)){
      history='<div class="inventory-history-card"><div class="inventory-history-title">Previous booking cancelled · History preserved</div><div class="inventory-history-copy">'+(previous&&previous.name?'Previous customer: '+safe(previous.name)+'. ':'')+'This unit is available for resale. The previous customer, payments and cancellation audit remain preserved in the CRM.</div></div>';
    }
    main.innerHTML='<div class="detail inventory-detail-page"><button type="button" class="back" id="inventoryBackToUnits">← Back to Units</button><div class="d-unit">'+safe(unit.unit_no)+'</div><div class="d-name">'+safe(unit.unit_type||'Inventory Unit')+'</div><div class="d-type">'+safe(unit.project_name||'Sunbliss Residences')+'</div><div class="badges"><span class="badge badge-good">'+safe(isCancelled(unit)?'Available for Resale':availability(unit))+'</span>'+(isCancelled(unit)?'<span class="badge badge-warn">Previous booking cancelled</span>':'')+'</div><div class="inventory-hero"><div class="inventory-hero-title">Physical inventory</div><div class="inventory-hero-copy">This unit is kept separate from customer sales and collections until it is sold.</div></div><p class="section-label">Unit Details</p><div class="inventory-detail-grid">'+cell('Floor',unit.floor)+cell('Total Area',unit.area!=null?fmtNum(unit.area)+' sq.ft':'—')+cell('Internal Area',unit.unit_area_sqft!=null?fmtNum(unit.unit_area_sqft)+' sq.ft':'—')+cell('Balcony / Terrace',unit.balcony_terrace_area_sqft!=null?fmtNum(unit.balcony_terrace_area_sqft)+' sq.ft':'—')+cell('Layout Type',unit.layout_type)+cell('LEG',unit.leg_no)+cell('Furnishing',unit.furnishing_status)+cell('List Price',unit.list_price!=null?fmtMoney(unit.list_price):'—')+'</div>'+history+'</div>';
    var back=document.getElementById('inventoryBackToUnits');
    if(back)back.onclick=function(){openInventoryId=null;if(window.state)state.view='list';if(typeof window.renderMain==='function')window.renderMain();if(typeof window.scrollTo==='function')window.scrollTo(0,0);};
    return true;
  }

  function ensureInventoryForUnits(){
    if(!window.state||state.view!=='list'||openInventoryId)return;
    if(rows.length){applyInventoryView();return;}
    loadInventory(false).then(function(){if(window.state&&state.view==='list'&&!openInventoryId)applyInventoryView();});
  }

  var originalRenderList=window.renderList;
  if(typeof originalRenderList==='function'&&!originalRenderList.__sunblissInventoryV2Wrapped){
    function inventoryRenderList(){
      var out=originalRenderList.apply(this,arguments);
      ensureInventoryForUnits();
      return out;
    }
    inventoryRenderList.__sunblissInventoryV2Wrapped=true;
    inventoryRenderList.__sunblissOriginal=originalRenderList;
    window.renderList=inventoryRenderList;
  }

  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__sunblissInventoryV2Wrapped){
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var result=await originalLoad.apply(this,arguments);
      sanitizeSalesState();
      clearInventoryCache();
      if(window.state&&state.view==='list')loadInventory(false).then(applyInventoryView);
      return result;
    };
    window.loadFromSupabase.__sunblissInventoryV2Wrapped=true;
    window.loadFromSupabase.__sunblissOriginal=originalLoad;
  }

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest)return;
    var nav=event.target.closest('.tabs .tab[data-view]');
    if(nav&&openInventoryId)openInventoryId=null;
    var chipEl=event.target.closest('[data-inventory-filter]');
    if(!chipEl)return;
    event.preventDefault();event.stopPropagation();
    activeFilter=chipEl.getAttribute('data-inventory-filter')||'all';
    applyInventoryView();
  },false);

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest)return;
    var row=event.target.closest('#main .list .inventory-only-row[data-inventory-id]');
    if(!row)return;
    var unit=byId[String(row.getAttribute('data-inventory-id'))];
    if(!unit)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    openInventoryId=unit.id;
    window.__sunblissDockSearchOpen=false;
    var panel=document.getElementById('sunblissDockSearchPanel');if(panel)panel.classList.remove('is-open');
    renderInventoryDetail();
    if(typeof window.scrollTo==='function')window.scrollTo(0,0);
  },true);

  window.addEventListener('pageshow',function(){
    if(openInventoryId)renderInventoryDetail();
    else if(window.state&&state.view==='list')ensureInventoryForUnits();
  });

  sanitizeSalesState();
})();
