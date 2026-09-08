(function(){
  'use strict';

  if(window.__sunblissScheduledFilterCleanupInstalled)return;
  window.__sunblissScheduledFilterCleanupInstalled=true;

  var ALLOWED={today:true,overdue:true,upcoming:true,extensions:true};
  var LABELS={today:'Today',overdue:'Overdue',upcoming:'Upcoming',extensions:'Extensions'};
  var observedList=null;
  var listObserver=null;
  var queued=false;

  function extensionCount(){
    var C=window.PaymentExtensionsCore&&window.PaymentExtensionsCore.cache;
    var rows=C&&Array.isArray(C.t)?C.t:[];
    return rows.filter(function(t){
      return t&&t.status==='pending'&&t.auto_kind==='extension_active';
    }).length;
  }

  function ensureExtensionOption(select){
    var option=select.querySelector('option[value="extensions"]');
    if(!option){
      option=document.createElement('option');
      option.value='extensions';
      select.appendChild(option);
    }
    var label='Extensions · '+extensionCount();
    if(option.textContent!==label)option.textContent=label;
  }

  function todayIso(){
    var d=new Date();
    d.setHours(0,0,0,0);
    var m=d.getMonth()+1,day=d.getDate();
    return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);
  }

  function sourceCounts(){
    var C=window.PaymentExtensionsCore&&window.PaymentExtensionsCore.cache;
    if(!C||!Array.isArray(C.t)||!C.loaded)return null;
    var today=todayIso();
    var counts={today:0,overdue:0,upcoming:0,extensions:0};
    C.t.forEach(function(t){
      if(!t)return;
      if(t.auto_kind==='extension_active'){
        if(t.status==='pending')counts.extensions++;
        return;
      }
      if(t.status!=='pending')return;
      var due=String(t.due_date||'').slice(0,10);
      if(!due)return;
      if(due<today)counts.overdue++;
      else if(due===today)counts.today++;
      else counts.upcoming++;
    });
    return counts;
  }

  function syncAllCounts(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select)return;
    var counts=sourceCounts();

    /*
      Never derive a filter count from the currently visible DOM rows. The list can
      briefly contain a stale extension row while the extension renderer and base
      scheduled-action renderer settle. Using that transient DOM state was the root
      cause of Today changing from 0 to 1 only while Today was selected.

      When the shared source cache is not ready yet, keep the counts already rendered
      by scheduled_actions_patch.js. Once the cache is ready, all four labels are
      updated together from the same source of truth.
    */
    if(!counts)return;

    Object.keys(ALLOWED).forEach(function(value){
      var option=select.querySelector('option[value="'+value+'"]');
      if(!option)return;
      var label=LABELS[value]+' · '+counts[value];
      if(option.textContent!==label)option.textContent=label;
    });
  }

  function removeLeakedExtensionRows(select){
    if(!select||select.value==='extensions')return;
    var C=window.PaymentExtensionsCore&&window.PaymentExtensionsCore.cache;
    if(!C||!Array.isArray(C.t))return;

    var extensionIds={};
    C.t.forEach(function(t){
      if(t&&t.status==='pending'&&t.auto_kind==='extension_active')extensionIds[String(t.id)]=true;
    });

    var host=document.getElementById('scheduledOverviewList');
    if(!host)return;
    var removed=false;
    host.querySelectorAll('[data-task-id]').forEach(function(row){
      if(extensionIds[String(row.getAttribute('data-task-id'))]){
        row.remove();
        removed=true;
      }
    });

    if(removed&&!host.querySelector('.scheduled-overview-row,[data-task-id]')&&!host.querySelector('.scheduled-empty')){
      host.innerHTML='<div class="scheduled-empty">No pending actions in this view.</div>';
    }
  }

  function clean(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select)return;

    ensureExtensionOption(select);

    Array.prototype.slice.call(select.options).forEach(function(option){
      if(!ALLOWED[option.value])option.remove();
    });

    var order=['today','overdue','upcoming','extensions'];
    var current=Array.prototype.map.call(select.options,function(o){return o.value;}).join('|');
    if(current!==order.filter(function(v){return !!select.querySelector('option[value="'+v+'"]');}).join('|')){
      order.forEach(function(value){
        var option=select.querySelector('option[value="'+value+'"]');
        if(option)select.appendChild(option);
      });
    }

    if(!ALLOWED[select.value])select.value='today';
    removeLeakedExtensionRows(select);
    syncAllCounts();
    observeList();
  }

  function observeList(){
    var host=document.getElementById('scheduledOverviewList');
    if(host===observedList)return;
    if(listObserver)listObserver.disconnect();
    observedList=host;
    if(!host||!window.MutationObserver)return;
    listObserver=new MutationObserver(function(){
      queueClean();
    });
    listObserver.observe(host,{childList:true,subtree:false});
  }

  function refreshExtensionView(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select||select.value!=='extensions')return;
    var P=window.PaymentExtensionsCore;
    if(!P)return;
    if(typeof P.load==='function'){
      Promise.resolve(P.load(false)).then(function(){
        if(typeof P.render==='function')P.render();
        queueClean();
      }).catch(function(){});
    }else if(typeof P.render==='function'){
      P.render();
      queueClean();
    }
  }

  function queueClean(){
    if(queued)return;
    queued=true;
    Promise.resolve().then(function(){
      queued=false;
      clean();
    });
  }

  function install(){
    if(!window.state||typeof window.renderOverview!=='function'){
      setTimeout(install,50);
      return;
    }

    var original=window.renderOverview;
    if(!original.__sunblissScheduledFilterEnsured){
      function wrapped(){
        var out=original.apply(this,arguments);
        queueClean();
        return out;
      }
      wrapped.__sunblissScheduledFilterEnsured=true;
      wrapped.__sunblissOriginal=original;
      window.renderOverview=wrapped;
    }

    document.addEventListener('change',function(e){
      if(!e.target||e.target.id!=='scheduledOverviewFilter')return;
      queueClean();
      refreshExtensionView();
    },true);

    window.addEventListener('pageshow',queueClean);
    queueClean();
  }

  install();
})();
