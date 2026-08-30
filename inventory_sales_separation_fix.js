(function(){
  'use strict';
  if(window.__sunblissInventorySalesSeparationInstalled)return;
  window.__sunblissInventorySalesSeparationInstalled=true;

  /* Reserved is not part of the inventory workflow. Keep it hidden without
     adding/removing DOM nodes during interaction. */
  var reservedStyle=document.createElement('style');
  reservedStyle.id='sunblissNoReservedInventoryOption';
  reservedStyle.textContent='.inventory-status-chip[data-inventory-filter="reserved"]{display:none!important;}';
  document.head.appendChild(reservedStyle);

  var renderDepth=0;

  function text(v){return v==null?'':String(v);}
  function norm(v){return text(v).trim().toLowerCase();}
  function safe(v){
    if(typeof window.esc==='function')return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function num(v){var n=Number(v);return isFinite(n)?n:0;}
  function fmtNum(v){var n=Number(v);return isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):'—';}
  function fmtCompact(v){
    var n=num(v),a=Math.abs(n);
    return a>=1000000?(n/1000000).toFixed(1)+'M':a>=1000?(n/1000).toFixed(0)+'K':Math.round(n).toLocaleString('en-US');
  }

  function sanitizeSalesState(){
    if(!window.state||!Array.isArray(state.dues))return;
    var changed=false;
    var clean=state.dues.filter(function(c){
      var keep=!!c&&c.customerId!==null&&c.customerId!==undefined&&text(c.customerId).trim()!=='';
      if(!keep)changed=true;
      return keep;
    });
    if(changed)state.dues=clean;
  }

  function activeFilter(){
    var selected=document.querySelector('#main .inventory-status-chip[aria-pressed="true"][data-inventory-filter]');
    return selected?norm(selected.getAttribute('data-inventory-filter')):'all';
  }
  function currentSearch(){
    if(window.state&&text(state.search).trim())return norm(state.search);
    var input=document.getElementById('searchInput');
    if(input&&text(input.value).trim())return norm(input.value);
    var dock=document.getElementById('dockPersistentSearchInput');
    return dock?norm(dock.value):'';
  }
  function cancelledMatchesSearch(c){
    var q=currentSearch();
    if(!q)return true;
    var info=c&&c.info||{};
    return norm([c&&c.unit,c&&c.name,c&&c.type,info.floor,info.area].join(' ')).indexOf(q)!==-1;
  }

  function cancelledRow(c){
    var info=c&&c.info||{};
    var button=document.createElement('button');
    button.type='button';
    button.className='row-btn inventory-only-row inventory-cancelled-resale-row';
    button.setAttribute('data-inventory-id',text(c&&c.sno));
    button.setAttribute('data-inventory-unit',text(c&&c.unit));
    button.setAttribute('data-inventory-availability','Available');
    button.setAttribute('data-inventory-record-status','Cancelled');
    var meta=[];
    if(info.floor)meta.push('Floor '+text(info.floor));
    if(info.area!=null)meta.push(fmtNum(info.area)+' sq.ft');
    meta.push('Previous booking cancelled');
    button.innerHTML='<span class="row-unit">'+safe(c&&c.unit||'—')+'</span>'+
      '<span class="row-main"><span class="row-name">'+safe(c&&c.type||'Inventory Unit')+'</span>'+
      '<span class="row-meta">'+safe(meta.join(' · '))+'<span class="inventory-badge available">Available for Resale</span></span></span>'+
      '<span class="row-amt"><span class="row-amt-val">Available</span><span class="row-amt-lbl">Inventory</span></span>';
    return button;
  }

  function chipCount(key){
    var chip=document.querySelector('#main .inventory-status-chip[data-inventory-filter="'+key+'"]');
    if(!chip)return 0;
    var match=text(chip.textContent).match(/(\d+)\s*$/);
    return match?Number(match[1])||0:0;
  }
  function totalPhysical(){
    var n=chipCount('all');
    if(n)return n;
    var total=document.querySelector('#main .inventory-status-total');
    var match=total&&text(total.textContent).match(/(\d+)/);
    return match?Number(match[1])||0:0;
  }

  function updateResultLine(list,filter){
    var line=document.querySelector('#main .result-count');
    if(!line)return;
    var visible=0;
    list.querySelectorAll('.row-btn').forEach(function(row){
      if(!row.hidden&&row.style.display!=='none')visible++;
    });
    var total=totalPhysical()||visible;
    var q=currentSearch();
    var sold=chipCount('sold')||(window.state&&Array.isArray(state.dues)?state.dues.length:0);
    var available=chipCount('available');
    var copy;
    if(filter==='all'&&!q){
      copy=total+' physical units · '+sold+' sold · '+available+' available';
    }else{
      copy=visible+' of '+total+' physical units';
      if(q)copy+=' · matching inventory';
      else if(filter==='available')copy+=' · Available inventory';
      else if(filter==='cancelled')copy+=' · Available for resale';
      else if(filter==='sold'&&window.state&&Array.isArray(state.dues)){
        var sales=0,outstanding=0;
        state.dues.forEach(function(c){sales+=num(c&&c.total);outstanding+=Math.abs(num(c&&c.outstanding));});
        copy+=' · AED '+fmtCompact(sales)+' active sales value · AED '+fmtCompact(outstanding)+' outstanding';
      }
    }
    if(text(line.textContent)!==copy)line.textContent=copy;
  }

  function finalizeUnitsList(){
    if(!window.state||state.view!=='list')return;
    var list=document.querySelector('#main .list');
    if(!list)return;
    var filter=activeFilter();

    list.querySelectorAll('.inventory-cancelled-resale-row').forEach(function(row){row.remove();});

    if(filter==='all'||filter==='available'||filter==='cancelled'){
      (Array.isArray(state.cancelled)?state.cancelled:[]).forEach(function(c){
        if(c&&cancelledMatchesSearch(c))list.appendChild(cancelledRow(c));
      });
    }

    var hasRows=false;
    list.querySelectorAll('.row-btn').forEach(function(row){if(!row.hidden&&row.style.display!=='none')hasRows=true;});
    if(hasRows){
      list.querySelectorAll('.inventory-list-empty,.no-results').forEach(function(el){el.style.setProperty('display','none','important');});
    }
    updateResultLine(list,filter);
  }

  function wrapRender(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sunblissInventorySalesLightweight)return;
    function wrapped(){
      sanitizeSalesState();
      renderDepth++;
      var out;
      try{out=original.apply(this,arguments);}
      finally{
        renderDepth--;
        if(renderDepth===0&&window.state&&state.view==='list')finalizeUnitsList();
      }
      return out;
    }
    wrapped.__sunblissInventorySalesLightweight=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }

  wrapRender('renderList');
  wrapRender('renderMain');

  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__sunblissInventorySalesLightweight){
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var result=await originalLoad.apply(this,arguments);
      sanitizeSalesState();
      return result;
    };
    window.loadFromSupabase.__sunblissInventorySalesLightweight=true;
    window.loadFromSupabase.__sunblissOriginal=originalLoad;
  }

  document.addEventListener('click',function(event){
    if(!event.target||!event.target.closest||!event.target.closest('[data-inventory-filter]'))return;
    if(window.state&&state.view==='list')finalizeUnitsList();
  },false);

  document.addEventListener('input',function(event){
    if(!event.target||(event.target.id!=='searchInput'&&event.target.id!=='dockPersistentSearchInput'))return;
    setTimeout(function(){if(window.state&&state.view==='list')finalizeUnitsList();},0);
  },true);

  sanitizeSalesState();
})();
