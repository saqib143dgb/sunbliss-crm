(function(){
  'use strict';
  if (window.__sunblissOverviewCleanupInstalled) return;
  window.__sunblissOverviewCleanupInstalled = true;

  function norm(value){
    return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g,' ');
  }

  function removeSectionByPrefixes(prefixes){
    var overview=document.querySelector('.overview');
    if(!overview)return;
    var labels=Array.prototype.slice.call(overview.querySelectorAll('.section-label'));
    labels.forEach(function(label){
      var value=norm(label.textContent);
      var matched=prefixes.some(function(prefix){return value.indexOf(prefix)===0;});
      if(!matched)return;
      var next=label.nextElementSibling;
      if(next && (next.classList.contains('list') || next.classList.contains('all-tasks-empty'))) next.remove();
      label.remove();
    });
  }

  function cleanup(){
    if(!window.state || state.view!=='overview')return;
    var emptyLabel=document.getElementById('sunblissAllTasksEmptyLabel');
    var empty=document.getElementById('sunblissAllTasksEmpty');
    if(emptyLabel)emptyLabel.remove();
    if(empty)empty.remove();
    removeSectionByPrefixes(['top overdue accounts']);
    removeSectionByPrefixes(['all tasks','follow-up tasks']);
  }

  function install(){
    if(typeof window.renderOverview!=='function'){
      setTimeout(install,50);
      return;
    }
    var base=window.renderOverview;
    window.renderOverview=function(){
      var out=base.apply(this,arguments);
      cleanup();
      return out;
    };
    var app=document.getElementById('app');
    if(app && window.MutationObserver){
      new MutationObserver(function(){cleanup();}).observe(app,{childList:true,subtree:true});
    }
    cleanup();
  }

  install();
})();
