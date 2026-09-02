(function(){
  'use strict';

  if(window.__sunblissScheduledFilterCleanupInstalled)return;
  window.__sunblissScheduledFilterCleanupInstalled=true;

  var ALLOWED={today:true,overdue:true,extensions:true};
  var LABELS={today:'Today',overdue:'Overdue',extensions:'Extensions'};
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

  function visibleListCount(){
    var host=document.getElementById('scheduledOverviewList');
    if(!host)return null;
    var rows=Array.prototype.slice.call(host.children).filter(function(el){
      if(!el||!el.classList||el.classList.contains('scheduled-empty'))return false;
      return el.classList.contains('scheduled-overview-row')||el.hasAttribute('data-task-id');
    });
    if(rows.length)return rows.length;
    if(host.querySelector('.scheduled-empty'))return 0;
    return null;
  }

  function syncSelectedCount(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select||!ALLOWED[select.value])return;
    var count=visibleListCount();
    if(count===null)return;
    var option=select.querySelector('option[value="'+select.value+'"]');
    if(!option)return;
    var label=LABELS[select.value]+' · '+count;
    if(option.textContent!==label)option.textContent=label;
  }

  function clean(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select)return;

    ensureExtensionOption(select);

    Array.prototype.slice.call(select.options).forEach(function(option){
      if(!ALLOWED[option.value])option.remove();
    });

    var order=['today','overdue','extensions'];
    var current=Array.prototype.map.call(select.options,function(o){return o.value;}).join('|');
    if(current!==order.filter(function(v){return !!select.querySelector('option[value="'+v+'"]');}).join('|')){
      order.forEach(function(value){
        var option=select.querySelector('option[value="'+value+'"]');
        if(option)select.appendChild(option);
      });
    }

    if(!ALLOWED[select.value])select.value='today';
    syncSelectedCount();
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
