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

  function cleanDetailActions(){
    document.querySelectorAll('.scheduled-edit').forEach(function(button){
      if(button.textContent!=='Reschedule')button.textContent='Reschedule';
      button.setAttribute('aria-label','Reschedule this unfinished action');
      button.setAttribute('title','Change the due date or details without marking the action done');
    });

    var panel=document.getElementById('scheduledActionPanel');
    if(!panel)return;
    var mode=panel.getAttribute('data-mode');
    if(mode==='complete'){
      var next=panel.querySelector('.scheduled-next-check span');
      if(next&&next.textContent!=='Create a follow-up after marking this action done')next.textContent='Create a follow-up after marking this action done';
    }else if(mode==='edit'){
      var heading=panel.querySelector('.section-label');
      if(heading&&heading.textContent==='Edit Scheduled Action')heading.textContent='Reschedule Scheduled Action';
      var summary=panel.querySelector('.scheduled-form-summary');
      if(summary)summary.textContent=summary.textContent.replace(/update or reschedule this action\.?/i,'change its due date or details without marking it done.');
    }
  }

  function clean(){
    cleanDetailActions();

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

  function wrap(name,flag){
    var original=window[name];
    if(typeof original!=='function'||original[flag])return;
    function wrapped(){
      var out=original.apply(this,arguments);
      queueClean();
      return out;
    }
    wrapped[flag]=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }

  function install(){
    if(!window.state||typeof window.renderOverview!=='function'||typeof window.renderDetail!=='function'){
      setTimeout(install,50);
      return;
    }

    wrap('renderOverview','__sunblissScheduledFilterEnsured');
    wrap('renderDetail','__sunblissScheduledDetailLabelsEnsured');

    document.addEventListener('change',function(e){
      if(!e.target||e.target.id!=='scheduledOverviewFilter')return;
      queueClean();
      refreshExtensionView();
    },true);

    document.addEventListener('click',function(){setTimeout(queueClean,0);},true);
    window.addEventListener('pageshow',queueClean);
    queueClean();
  }

  install();
})();