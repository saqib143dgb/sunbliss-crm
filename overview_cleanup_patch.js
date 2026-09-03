(function(){
  'use strict';
  if (window.__sunblissOverviewCleanupInstalled) return;
  window.__sunblissOverviewCleanupInstalled = true;

  function norm(value){return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g,' ');}
  function removeSectionByPrefixes(prefixes){
    var overview=document.querySelector('.overview');
    if(!overview)return;
    Array.prototype.slice.call(overview.querySelectorAll('.section-label')).forEach(function(label){
      var value=norm(label.textContent);
      if(!prefixes.some(function(prefix){return value.indexOf(prefix)===0;}))return;
      var next=label.nextElementSibling;
      if(next && (next.classList.contains('list') || next.classList.contains('all-tasks-empty'))) next.remove();
      label.remove();
    });
  }
  function removeRedundantFinancialPercentages(){
    ['btnCollected','btnOutstanding'].forEach(function(id){
      var cell=document.getElementById(id);
      if(!cell)return;
      var sub=cell.querySelector('.stat-sub');
      if(!sub)return;
      Array.prototype.slice.call(sub.childNodes).forEach(function(node){
        if(node.nodeType!==3)return;
        node.nodeValue=String(node.nodeValue||'').replace(/\s*\d+(?:\.\d+)?%\s+of\s+sales\s*/ig,' ');
      });
      if(!norm(sub.textContent))sub.remove();
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
    removeRedundantFinancialPercentages();
  }
  function relevant(node){
    if(!node||node.nodeType!==1)return false;
    if(node.classList&&(node.classList.contains('section-label')||node.classList.contains('stat-hero')))return true;
    return !!(node.querySelector&&node.querySelector('.overview .section-label,.overview .stat-hero,#sunblissAllTasksEmptyLabel,#sunblissAllTasksEmpty'));
  }
  function install(){
    if(typeof window.renderOverview!=='function'){setTimeout(install,50);return;}
    var base=window.renderOverview;
    window.renderOverview=function(){var out=base.apply(this,arguments);cleanup();return out;};
    var app=document.getElementById('app');
    if(app && window.MutationObserver){
      new MutationObserver(function(mutations){
        if(!window.state||state.view!=='overview')return;
        for(var i=0;i<mutations.length;i++)for(var j=0;j<mutations[i].addedNodes.length;j++)if(relevant(mutations[i].addedNodes[j])){cleanup();return;}
      }).observe(app,{childList:true,subtree:true});
    }
    cleanup();
  }
  install();
})();

(function(){
  'use strict';
  if(window.__sunblissMobileTabSwipeInstalled)return;
  window.__sunblissMobileTabSwipeInstalled=true;

  var ORDER=['overview','list','insights'];
  var start=null;
  var MIN_DISTANCE=64;
  var MAX_DURATION=700;
  var EDGE_GUARD=24;
  var HORIZONTAL_RATIO=1.35;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }
  function currentView(){
    if(!window.state)return '';
    var view=String(state.view||'').toLowerCase();
    return view==='units'?'list':view;
  }
  function visible(node){
    if(!node)return false;
    var style=window.getComputedStyle?window.getComputedStyle(node):null;
    if(style&&(style.display==='none'||style.visibility==='hidden'))return false;
    var rect=node.getBoundingClientRect?node.getBoundingClientRect():null;
    return !rect||(rect.width>0&&rect.height>0);
  }
  function blockingUiOpen(){
    var selectors=['#sunblissDockSearchPanel.is-open','[role="dialog"]:not([aria-hidden="true"])','.modal.is-open','.modal.open','.sheet.is-open','.sheet.open','.drawer.is-open','.drawer.open','.menu-portal','.context-menu'];
    for(var i=0;i<selectors.length;i++){
      var nodes=document.querySelectorAll(selectors[i]);
      for(var j=0;j<nodes.length;j++)if(visible(nodes[j]))return true;
    }
    return false;
  }
  function interactiveTarget(target){
    if(!target||!target.closest)return false;
    return !!target.closest('input,textarea,select,button,a,[contenteditable="true"],.tabs,[role="slider"],[data-swipe-ignore]');
  }
  function horizontalScroller(target){
    var node=target&&target.nodeType===1?target:target&&target.parentElement;
    while(node&&node!==document.body&&node!==document.documentElement){
      if(node.scrollWidth>node.clientWidth+6){
        var style=window.getComputedStyle?window.getComputedStyle(node):null;
        var overflow=style?style.overflowX:'';
        if(overflow==='auto'||overflow==='scroll')return true;
      }
      node=node.parentElement;
    }
    return false;
  }
  function eligible(target,x){
    if(!mobile()||blockingUiOpen())return false;
    if(ORDER.indexOf(currentView())===-1)return false;
    if(x<EDGE_GUARD||x>window.innerWidth-EDGE_GUARD)return false;
    if(interactiveTarget(target)||horizontalScroller(target))return false;
    return true;
  }
  function go(view){
    var tab=document.querySelector('.tabs .tab[data-view="'+view+'"]');
    if(!tab)return false;
    tab.click();
    return true;
  }
  function navigate(direction){
    var index=ORDER.indexOf(currentView());
    if(index<0)return;
    var next=index+direction;
    if(next<0||next>=ORDER.length)return;
    go(ORDER[next]);
  }

  document.addEventListener('touchstart',function(event){
    start=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    start={x:touch.clientX,y:touch.clientY,time:Date.now()};
  },{passive:true});

  document.addEventListener('touchend',function(event){
    if(!start)return;
    var gesture=start;
    start=null;
    if(!event.changedTouches||event.changedTouches.length!==1)return;
    if(!mobile()||blockingUiOpen())return;
    var touch=event.changedTouches[0];
    var dx=touch.clientX-gesture.x;
    var dy=touch.clientY-gesture.y;
    if(Date.now()-gesture.time>MAX_DURATION)return;
    if(Math.abs(dx)<MIN_DISTANCE)return;
    if(Math.abs(dx)<Math.abs(dy)*HORIZONTAL_RATIO)return;
    navigate(dx<0?1:-1);
  },{passive:true});

  document.addEventListener('touchcancel',function(){start=null;},{passive:true});
})();
