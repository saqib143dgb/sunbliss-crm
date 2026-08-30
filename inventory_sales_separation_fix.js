(function(){
  'use strict';
  if(window.__sunblissInventorySalesSeparationInstalled)return;
  window.__sunblissInventorySalesSeparationInstalled=true;

  /* Reserved is intentionally not part of this CRM's inventory workflow.
     Hide it statically before the global navigation observer is installed;
     never add/remove this chip during user interaction. */
  var reservedStyle=document.createElement('style');
  reservedStyle.id='sunblissNoReservedInventoryOption';
  reservedStyle.textContent='.inventory-status-chip[data-inventory-filter="reserved"]{display:none!important;}';
  document.head.appendChild(reservedStyle);

  var inventoryRows=[];
  var byId={};
  var loading=null;
  var queued=false;

  function text(v){return v==null?'':String(v);}
  function norm(v){return text(v).trim().toLowerCase();}
  function safe(v){
    if(typeof window.esc==='function')return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function number(v){var n=Number(v);return isFinite(n)?n:null;}
  function fmtNum(v){var n=number(v);return n==null?'—':n.toLocaleString('en-US',{maximumFractionDigits:2});}
  function fmtCompact(v){
    var n=number(v);if(n==null)return '—';
    var a=Math.abs(n);
    return a>=1000000?(n/1000000).toFixed(1)+'M':a>=1000?(n/1000).toFixed(0)+'K':Math.round(n).toLocaleString('en-US');
  }

  function sanitizeSalesState(){
    if(!window.state||!Array.isArray(state.dues))return;
    state.dues=state.dues.filter(function(c){
      if(!c)return false;
      return c.customerId!==null&&c.customerId!==undefined&&text(c.customerId).trim()!=='';
    });
  }

  function rebuildMap(){
    byId={};
    inventoryRows.forEach(function(row){if(row&&row.id!=null)byId[text(row.id)]=row;});
  }

  function loadInventory(force){
    if(!window.sb)return Promise.resolve(inventoryRows);
    if(loading&&!force)return loading;
    if(inventoryRows.length&&!force)return Promise.resolve(inventoryRows);
    loading=window.sb.from('units')
      .select('id,unit_no,project_name,unit_type,floor,area,total_price,status,customer_id,availability_status,layout_type,leg_no,unit_area_sqft,balcony_terrace_area_sqft,furnishing_status,list_price,list_price_per_sqft')
      .order('unit_no',{ascending:true})
      .then(function(result){
        if(result.error)throw result.error;
        inventoryRows=Array.isArray(result.data)?result.data:[];
        rebuildMap();
        return inventoryRows;
      })
      .catch(function(err){console.error('Could not refresh physical inventory for sales separation',err);return inventoryRows;})
      .finally(function(){loading=null;});
    return loading;
  }

  function activeFilter(){
    var selected=document.querySelector('#main .inventory-status-chip[aria-pressed="true"][data-inventory-filter]');
    return selected?norm(selected.getAttribute('data-inventory-filter')):'all';
  }
  function isCancelled(unit){return norm(unit&&unit.status)==='cancelled';}
  function availability(unit){return text(unit&&unit.availability_status)||'Sold';}
  function matchesFilter(unit,filter){
    if(!unit)return false;
    if(filter==='all')return true;
    if(filter==='cancelled')return isCancelled(unit);
    return norm(availability(unit))===filter;
  }
  function currentSearch(){
    var dock=document.getElementById('dockPersistentSearchInput');
    var internal=document.getElementById('searchInput');
    var value=window.state&&text(state.search).trim()?state.search:(internal?internal.value:(dock?dock.value:''));
    return norm(value);
  }
  function inventorySearchText(unit){
    return norm([unit.unit_no,unit.unit_type,unit.floor,unit.layout_type,unit.leg_no,unit.project_name,unit.availability_status].join(' '));
  }
  function matchesSearch(unit){var q=currentSearch();return !q||inventorySearchText(unit).indexOf(q)!==-1;}

  function showRow(row,show){
    row.hidden=!show;
    if(show){row.style.removeProperty('display');}
    else{row.style.setProperty('display','none','important');}
  }

  function customerlessOrHistorical(unit){
    return !unit.customer_id||isCancelled(unit);
  }

  function badgeText(unit){
    if(isCancelled(unit)&&availability(unit)==='Available')return 'Available for Resale';
    return availability(unit);
  }

  function physicalRow(unit){
    var button=document.createElement('button');
    button.type='button';
    button.className='row-btn inventory-only-row inventory-separated-row';
    button.setAttribute('data-inventory-id',text(unit.id));
    button.setAttribute('data-inventory-unit',text(unit.unit_no));
    button.setAttribute('data-inventory-availability',availability(unit));
    button.setAttribute('data-inventory-record-status',text(unit.status));
    var meta=[];
    if(unit.floor)meta.push('Floor '+text(unit.floor));
    if(unit.area!=null)meta.push(fmtNum(unit.area)+' sq.ft');
    if(isCancelled(unit))meta.push('Previous booking cancelled');
    else meta.push(availability(unit));
    var amount=unit.list_price!=null?'AED '+Math.round(Number(unit.list_price)).toLocaleString('en-US'):badgeText(unit);
    var label=unit.list_price!=null?'List price':'Inventory';
    button.innerHTML='<span class="row-unit">'+safe(unit.unit_no||'—')+'</span>'+
      '<span class="row-main"><span class="row-name">'+safe(unit.unit_type||'Inventory Unit')+'</span>'+
      '<span class="row-meta">'+safe(meta.join(' · '))+'<span class="inventory-badge '+safe(norm(availability(unit)))+'">'+safe(badgeText(unit))+'</span></span></span>'+
      '<span class="row-amt"><span class="row-amt-val">'+safe(amount)+'</span><span class="row-amt-lbl">'+safe(label)+'</span></span>';
    return button;
  }

  function salesByUnitId(){
    var map={};
    if(window.state&&Array.isArray(state.dues))state.dues.forEach(function(c){if(c&&c.sno!=null)map[text(c.sno)]=c;});
    return map;
  }

  function fixResultCount(visibleBase,physicalOnlyShown){
    var line=document.querySelector('#main .result-count');
    if(!line)return;
    var shown=visibleBase.length+physicalOnlyShown;
    var salesMap=salesByUnitId();
    var salesValue=0,outstanding=0;
    visibleBase.forEach(function(row){
      var c=salesMap[text(row.getAttribute('data-sno'))];
      if(!c)return;
      salesValue+=Number(c.total)||0;
      outstanding+=Math.abs(Number(c.outstanding)||0);
    });
    var copy=shown+' of '+inventoryRows.length+' physical units';
    if(visibleBase.length){
      copy+=' · AED '+fmtCompact(salesValue)+' active sales value · AED '+fmtCompact(outstanding)+' outstanding';
    }else if(shown){
      copy+=' · Available inventory';
    }
    line.textContent=copy;
  }

  function applySeparatedInventory(){
    queued=false;
    if(!window.state||state.view!=='list')return;
    sanitizeSalesState();
    var list=document.querySelector('#main .list');
    if(!list||!inventoryRows.length)return;
    var filter=activeFilter();

    list.querySelectorAll('.inventory-only-row').forEach(function(row){row.remove();});

    var visibleBase=[];
    list.querySelectorAll('.row-btn[data-sno][data-unit]:not(.inventory-only-row)').forEach(function(row){
      var unit=byId[text(row.getAttribute('data-sno'))];
      var show=!!unit&&matchesFilter(unit,filter);
      showRow(row,show);
      if(show)visibleBase.push(row);
    });

    var generated=inventoryRows.filter(function(unit){
      return customerlessOrHistorical(unit)&&matchesFilter(unit,filter)&&matchesSearch(unit);
    });
    generated.forEach(function(unit){list.appendChild(physicalRow(unit));});

    list.querySelectorAll('.inventory-list-empty,.no-results').forEach(function(el){
      if(el.classList.contains('no-results')&&(visibleBase.length||generated.length))el.style.setProperty('display','none','important');
      else if(el.classList.contains('inventory-list-empty'))el.remove();
    });
    if(!visibleBase.length&&!generated.length){
      var empty=document.createElement('div');
      empty.className='inventory-list-empty';
      empty.textContent='No units match this inventory view.';
      list.appendChild(empty);
    }

    fixResultCount(visibleBase,generated.length);
  }

  function queueApply(){
    if(queued)return;
    queued=true;
    Promise.resolve().then(function(){
      if(!inventoryRows.length){
        loadInventory(false).then(applySeparatedInventory);
      }else applySeparatedInventory();
    });
  }

  function wrapRender(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sunblissInventorySalesSeparated)return;
    function wrapped(){
      sanitizeSalesState();
      var out=original.apply(this,arguments);
      if(window.state&&state.view==='list')queueApply();
      return out;
    }
    wrapped.__sunblissInventorySalesSeparated=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }

  wrapRender('renderList');
  wrapRender('renderMain');

  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__sunblissInventorySalesSeparated){
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var result=await originalLoad.apply(this,arguments);
      sanitizeSalesState();
      await loadInventory(true);
      if(window.state&&state.view==='list')queueApply();
      return result;
    };
    window.loadFromSupabase.__sunblissInventorySalesSeparated=true;
    window.loadFromSupabase.__sunblissOriginal=originalLoad;
  }

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest)return;
    if(event.target.closest('[data-inventory-filter]'))queueApply();
  },false);
  document.addEventListener('input',function(event){
    if(event.target&&(event.target.id==='searchInput'||event.target.id==='dockPersistentSearchInput'))queueApply();
  },true);
  window.addEventListener('pageshow',queueApply);

  sanitizeSalesState();
  loadInventory(false).then(function(){if(window.state&&state.view==='list')queueApply();});
})();
