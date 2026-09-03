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

  var gesture=null;
  var navigationLockedUntil=0;
  var suppressClickUntil=0;
  var MIN_DISTANCE=44;
  var MAX_DURATION=1000;
  var EDGE_GUARD=20;
  var AXIS_LOCK_DISTANCE=10;
  var HORIZONTAL_RATIO=1.10;
  var NAV_LOCK_MS=280;
  var INCOMING_DISTANCE=34;
  var INCOMING_DURATION=220;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }

  function visible(node){
    if(!node)return false;
    var style=window.getComputedStyle?window.getComputedStyle(node):null;
    if(style&&(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0))return false;
    var rect=node.getBoundingClientRect?node.getBoundingClientRect():null;
    return !rect||(rect.width>0&&rect.height>0);
  }

  function selectedView(){
    if(visible(document.querySelector('.overview')))return 'overview';
    if(visible(document.querySelector('.insights')))return 'insights';
    if(window.state){
      var view=String(state.view||'').toLowerCase();
      if(view==='overview'||view==='insights')return view;
    }
    return '';
  }

  function surfaceFor(view){
    var node=view==='overview'?document.querySelector('.overview'):document.querySelector('.insights');
    return visible(node)?node:null;
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
    var view=selectedView();
    if(view!=='overview'&&view!=='insights')return false;
    if(x<EDGE_GUARD||x>window.innerWidth-EDGE_GUARD)return false;
    if(excludedStartTarget(target)||horizontalScroller(target))return false;
    return true;
  }

  function correctDirection(view,dx){
    return (view==='overview'&&dx<0)||(view==='insights'&&dx>0);
  }

  function clearSurface(surface,animate){
    if(!surface)return;
    if(animate){
      surface.style.transition='transform 150ms cubic-bezier(.22,1,.36,1),opacity 150ms ease';
      surface.style.transform='translate3d(0,0,0)';
      surface.style.opacity='1';
      window.setTimeout(function(){
        if(!surface.isConnected)return;
        surface.style.transition='';
        surface.style.transform='';
        surface.style.opacity='';
        surface.style.willChange='';
      },170);
    }else{
      surface.style.transition='';
      surface.style.transform='';
      surface.style.opacity='';
      surface.style.willChange='';
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

  function animateIncoming(view,swipeDirection){
    var attempts=0;
    function run(){
      var surface=surfaceFor(view);
      if(!surface&&attempts<5){attempts+=1;window.requestAnimationFrame(run);return;}
      if(!surface)return;
      var from=swipeDirection<0?INCOMING_DISTANCE:-INCOMING_DISTANCE;
      surface.style.willChange='transform,opacity';
      if(typeof surface.animate==='function'){
        var animation=surface.animate([
          {transform:'translate3d('+from+'px,0,0)',opacity:.94},
          {transform:'translate3d(0,0,0)',opacity:1}
        ],{duration:INCOMING_DURATION,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
        animation.onfinish=function(){
          if(!surface.isConnected)return;
          surface.style.willChange='';
        };
      }else{
        surface.style.transition='none';
        surface.style.transform='translate3d('+from+'px,0,0)';
        surface.style.opacity='.94';
        window.requestAnimationFrame(function(){
          surface.style.transition='transform '+INCOMING_DURATION+'ms cubic-bezier(.22,1,.36,1),opacity '+INCOMING_DURATION+'ms ease';
          surface.style.transform='translate3d(0,0,0)';
          surface.style.opacity='1';
          window.setTimeout(function(){clearSurface(surface,false);},INCOMING_DURATION+30);
        });
      }
    }
    window.requestAnimationFrame(run);
  }

  function navigate(view,dx){
    var next=view==='overview'?'insights':'overview';
    if(!window.state)return false;
    var previous=state.view;
    state.view=next;
    navigationLockedUntil=Date.now()+NAV_LOCK_MS;
    suppressClickUntil=Date.now()+360;
    if(!renderDirectly()){
      state.view=previous;
      navigationLockedUntil=0;
      return false;
    }
    animateIncoming(next,dx<0?-1:1);
    return true;
  }

  document.addEventListener('touchstart',function(event){
    gesture=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    var view=selectedView();
    gesture={
      x:touch.clientX,
      y:touch.clientY,
      time:Date.now(),
      view:view,
      axis:null,
      surface:surfaceFor(view)
    };
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

    var allowed=correctDirection(gesture.view,dx);
    var drag=allowed?dx:dx*.16;
    drag=Math.max(-54,Math.min(54,drag));
    if(gesture.surface){
      gesture.surface.style.willChange='transform,opacity';
      gesture.surface.style.transition='none';
      gesture.surface.style.transform='translate3d('+drag+'px,0,0)';
      gesture.surface.style.opacity=String(1-Math.min(Math.abs(drag)/650,.07));
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
    var valid=Date.now()-current.time<=MAX_DURATION&&
      ax>=MIN_DISTANCE&&
      (current.axis==='x'||ax>=ay*HORIZONTAL_RATIO)&&
      correctDirection(current.view,dx);

    if(!valid){clearSurface(current.surface,true);return;}
    clearSurface(current.surface,false);
    navigate(current.view,dx);
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
