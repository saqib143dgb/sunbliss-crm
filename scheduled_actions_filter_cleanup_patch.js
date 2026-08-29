(function(){
  'use strict';

  if(window.__sunblissScheduledFilterCleanupInstalled)return;
  window.__sunblissScheduledFilterCleanupInstalled=true;

  var ALLOWED={today:true,overdue:true,extensions:true};

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
    option.textContent='Extensions · '+extensionCount();
  }

  function clean(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select)return;

    ensureExtensionOption(select);

    Array.from(select.options).forEach(function(option){
      if(!ALLOWED[option.value])option.remove();
    });

    var order=['today','overdue','extensions'];
    order.forEach(function(value){
      var option=select.querySelector('option[value="'+value+'"]');
      if(option)select.appendChild(option);
    });

    if(!ALLOWED[select.value])select.value='today';
  }

  function refreshExtensionView(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select||select.value!=='extensions')return;
    var P=window.PaymentExtensionsCore;
    if(!P)return;
    if(typeof P.load==='function'){
      Promise.resolve(P.load(false)).then(function(){
        if(typeof P.render==='function')P.render();
        clean();
      }).catch(function(){});
    }else if(typeof P.render==='function'){
      P.render();
      clean();
    }
  }

  function queueClean(){
    clean();
    if(window.requestAnimationFrame)requestAnimationFrame(clean);
    setTimeout(clean,80);
    setTimeout(clean,260);
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
      clean();
      refreshExtensionView();
    },true);

    window.addEventListener('pageshow',queueClean);
    queueClean();
  }

  install();
})();
