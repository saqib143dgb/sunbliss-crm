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
  var gesture=null;
  var navigationLockedUntil=0;
  var suppressClickUntil=0;
  var MIN_DISTANCE=44;
  var MAX_DURATION=1000;
  var EDGE_GUARD=20;
  var AXIS_LOCK_DISTANCE=10;
  var HORIZONTAL_RATIO=1.10;
  var NAV_LOCK_MS=360;
  var EXIT_DISTANCE=68;
  var EXIT_DURATION=90;
  var INCOMING_DISTANCE=42;
  var INCOMING_DURATION=210;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }

  function normaliseView(view){
    view=String(view||'').toLowerCase();
    return view==='units'?'list':view;
  }

  function visible(node){
    if(!node)return false;
    var style=window.getComputedStyle?window.getComputedStyle(node):null;
    if(style&&(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0))return false;
    var rect=node.getBoundingClientRect?node.getBoundingClientRect():null;
    return !rect||(rect.width>0&&rect.height>0);
  }

  function selectedView(){
    if(window.state&&state.view){
      var stateView=normaliseView(state.view);
      if(ORDER.indexOf(stateView)!==-1)return stateView;
      return '';
    }

    var selected=document.querySelector('.tabs .tab[data-view][aria-pressed="true"],.tabs .tab[data-view].active,.tabs .tab[data-view].is-active');
    if(selected){
      var tabView=normaliseView(selected.getAttribute('data-view'));
      if(ORDER.indexOf(tabView)!==-1)return tabView;
    }

    if(visible(document.querySelector('.overview')))return 'overview';
    if(visible(document.querySelector('.insights')))return 'insights';
    if(visible(document.getElementById('searchInput')))return 'list';
    return '';
  }

  function surface(){
    var main=document.getElementById('main')||document.querySelector('#app main');
    return visible(main)?main:null;
  }

  function blockingUiOpen(){
    var selectors=['#sunblissDockSearchPanel.is-open','[role="dialog"]:not([aria-hidden="true"])','.modal.is-open','.modal.open','.sheet.is-open','.sheet.open','.drawer.is-open','.drawer.open','.menu-portal','.context-menu'];
    for(var i=0;i<selectors.length;i++){
      var nodes=document.querySelectorAll(selectors[i]);
      for(var j=0;j<nodes.length;j++)if(visible(nodes[j]))return true;
    }
    return false;
  }

  function excludedStartTarget(target){
    if(!target||!target.closest)return false;
    return !!target.closest('input,textarea,select,[contenteditable="true"],.tabs,[role="slider"],[data-swipe-ignore]');
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

  function loadingOrLocked(){
    if(Date.now()<navigationLockedUntil)return true;
    var root=document.documentElement;
    return root.classList.contains('sbx-loading')||root.classList.contains('sbx-booting')||root.classList.contains('sbx-overview-data-pending');
  }

  function eligible(target,x){
    if(!mobile()||blockingUiOpen()||loadingOrLocked())return false;
    if(ORDER.indexOf(selectedView())===-1)return false;
    if(x<EDGE_GUARD||x>window.innerWidth-EDGE_GUARD)return false;
    if(excludedStartTarget(target)||horizontalScroller(target))return false;
    return true;
  }

  function directionFor(dx){return dx<0?1:-1;}

  function nextView(view,dx){
    var index=ORDER.indexOf(view);
    if(index<0)return '';
    var next=index+directionFor(dx);
    return next>=0&&next<ORDER.length?ORDER[next]:'';
  }

  function clearSurface(node,animate){
    if(!node)return;
    if(animate){
      node.style.transition='transform 150ms cubic-bezier(.22,1,.36,1),opacity 150ms ease';
      node.style.transform='translate3d(0,0,0)';
      node.style.opacity='1';
      window.setTimeout(function(){
        if(!node.isConnected)return;
        node.style.transition='';
        node.style.transform='';
        node.style.opacity='';
        node.style.willChange='';
      },170);
    }else{
      node.style.transition='';
      node.style.transform='';
      node.style.opacity='';
      node.style.willChange='';
    }
  }

  function unwrap(fn){
    var guard=0;
    while(typeof fn==='function'&&fn.__sunblissOriginal&&guard<10){
      fn=fn.__sunblissOriginal;
      guard+=1;
    }
    return fn;
  }

  function renderDirectly(){
    var main=unwrap(window.renderMain);
    if(typeof main==='function'){
      main.call(window);
      return true;
    }
    var render=unwrap(window.render);
    if(typeof render==='function'){
      render.call(window);
      return true;
    }
    return false;
  }

  function animateIncoming(dx){
    window.requestAnimationFrame(function(){
      var node=surface();
      if(!node)return;
      var from=dx<0?INCOMING_DISTANCE:-INCOMING_DISTANCE;
      node.style.willChange='transform,opacity';
      node.style.transition='none';
      node.style.transform='translate3d('+from+'px,0,0)';
      node.style.opacity='.96';
      window.requestAnimationFrame(function(){
        if(!node.isConnected)return;
        node.style.transition='transform '+INCOMING_DURATION+'ms cubic-bezier(.22,1,.36,1),opacity '+INCOMING_DURATION+'ms ease';
        node.style.transform='translate3d(0,0,0)';
        node.style.opacity='1';
        window.setTimeout(function(){clearSurface(node,false);},INCOMING_DURATION+35);
      });
    });
  }

  function commitNavigation(view,dx){
    var next=nextView(view,dx);
    if(!next||!window.state)return false;
    var previous=state.view;
    state.view=next;
    if(!renderDirectly()){
      state.view=previous;
      return false;
    }
    animateIncoming(dx);
    return true;
  }

  function finishNavigation(current,dx){
    var next=nextView(current.view,dx);
    if(!next){clearSurface(current.surface,true);return;}

    navigationLockedUntil=Date.now()+NAV_LOCK_MS;
    suppressClickUntil=Date.now()+420;

    var node=current.surface;
    if(!node){commitNavigation(current.view,dx);return;}

    var exit=dx<0?-EXIT_DISTANCE:EXIT_DISTANCE;
    node.style.willChange='transform,opacity';
    node.style.transition='transform '+EXIT_DURATION+'ms cubic-bezier(.4,0,.2,1),opacity '+EXIT_DURATION+'ms ease';
    node.style.transform='translate3d('+exit+'px,0,0)';
    node.style.opacity='.95';

    window.setTimeout(function(){
      clearSurface(node,false);
      commitNavigation(current.view,dx);
    },EXIT_DURATION);
  }

  document.addEventListener('touchstart',function(event){
    gesture=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    var view=selectedView();
    gesture={x:touch.clientX,y:touch.clientY,time:Date.now(),view:view,axis:null,surface:surface()};
  },{passive:true});

  document.addEventListener('touchmove',function(event){
    if(!gesture||!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    var dx=touch.clientX-gesture.x;
    var dy=touch.clientY-gesture.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);

    if(gesture.axis===null&&Math.max(ax,ay)>=AXIS_LOCK_DISTANCE){
      if(ay>ax*1.08){clearSurface(gesture.surface,true);gesture=null;return;}
      if(ax>ay*HORIZONTAL_RATIO)gesture.axis='x';
    }

    if(gesture.axis!=='x')return;
    event.preventDefault();

    var allowed=!!nextView(gesture.view,dx);
    var drag=allowed?dx:dx*.16;
    drag=Math.max(-60,Math.min(60,drag));
    if(gesture.surface){
      gesture.surface.style.willChange='transform,opacity';
      gesture.surface.style.transition='none';
      gesture.surface.style.transform='translate3d('+drag+'px,0,0)';
      gesture.surface.style.opacity=String(1-Math.min(Math.abs(drag)/700,.07));
    }
  },{passive:false});

  document.addEventListener('touchend',function(event){
    if(!gesture)return;
    var current=gesture;
    gesture=null;
    if(!event.changedTouches||event.changedTouches.length!==1){clearSurface(current.surface,true);return;}
    if(!mobile()||blockingUiOpen()||Date.now()<navigationLockedUntil){clearSurface(current.surface,true);return;}

    var touch=event.changedTouches[0];
    var dx=touch.clientX-current.x;
    var dy=touch.clientY-current.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);
    var valid=Date.now()-current.time<=MAX_DURATION&&ax>=MIN_DISTANCE&&(current.axis==='x'||ax>=ay*HORIZONTAL_RATIO)&&!!nextView(current.view,dx);

    if(!valid){clearSurface(current.surface,true);return;}
    finishNavigation(current,dx);
  },{passive:true});

  document.addEventListener('touchcancel',function(){
    if(gesture)clearSurface(gesture.surface,true);
    gesture=null;
  },{passive:true});

  document.addEventListener('click',function(event){
    if(Date.now()>=suppressClickUntil)return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
})();
