(function(){
  'use strict';

  var ALLOWED={today:true,overdue:true};

  function clean(){
    var select=document.getElementById('scheduledOverviewFilter');
    if(!select)return;
    Array.from(select.options).forEach(function(option){
      if(!ALLOWED[option.value]) option.remove();
    });
    if(!ALLOWED[select.value]){
      select.value='today';
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function install(){
    if(!window.state || typeof window.renderOverview!=='function'){
      setTimeout(install,50);
      return;
    }
    if(window.__sunblissScheduledFilterCleanupInstalled)return;
    window.__sunblissScheduledFilterCleanupInstalled=true;

    var original=window.renderOverview;
    window.renderOverview=function(){
      var out=original.apply(this,arguments);
      setTimeout(clean,0);
      return out;
    };

    document.addEventListener('change',function(e){
      if(e.target&&e.target.id==='scheduledOverviewFilter')setTimeout(clean,0);
    },true);
    window.addEventListener('pageshow',function(){setTimeout(clean,0);});
    setTimeout(clean,0);
  }

  install();
})();
