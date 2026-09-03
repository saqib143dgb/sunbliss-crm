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
  var currentDockKey='';
  var navigationLockedUntil=0;
  var suppressClickUntil=0;
  var internalActivation=false;
  var bypassGeneration=0;

  var MIN_DISTANCE=42;
  var MAX_DURATION=1050;
  var EDGE_GUARD=18;
  var AXIS_LOCK_DISTANCE=10;
  var HORIZONTAL_RATIO=1.08;
  var NAV_LOCK_MS=360;
  var EXIT_DISTANCE=64;
  var EXIT_DURATION=85;
  var INCOMING_DISTANCE=40;
  var INCOMING_DURATION=205;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }

  function normalise(value){
    return String(value==null?'':value).trim().toLowerCase().replace(/\s+/g,' ');
  }

  function normaliseView(view){
    view=normalise(view);
    return view==='units'?'list':view;
  }

  function visible(node){
    if(!node)return false;
    var style=window.getComputedStyle?window.getComputedStyle(node):null;
    if(style&&(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0))return false;
    var rect=node.getBoundingClientRect?node.getBoundingClientRect():null;
    return !rect||(rect.width>0&&rect.height>0);
  }

  function buttonKey(button){
    if(!button)return '';
    var explicit=button.getAttribute&&button.getAttribute('data-swipe-key');
    if(explicit)return 'custom:'+normalise(explicit);
    var view=button.getAttribute&&button.getAttribute('data-view');
    if(view)return 'view:'+normaliseView(view);
    if(button.classList&&button.classList.contains('dock-add'))return 'action:add';
    if(button.classList&&button.classList.contains('dock-search'))return 'action:search';
    var label=(button.getAttribute&&button.getAttribute('aria-label'))||button.textContent||button.id||'';
    return 'action:'+normalise(label);
  }

  function dockEntries(){
    var tabs=document.querySelector('.tabs');
    if(!visible(tabs))return [];
    return Array.prototype.slice.call(tabs.querySelectorAll('.tab')).filter(function(button){
      return visible(button)&&!button.disabled;
    }).map(function(button){
      var rect=button.getBoundingClientRect();
      return {button:button,key:buttonKey(button),left:rect.left};
    }).filter(function(entry){return !!entry.key;}).sort(function(a,b){return a.left-b.left;});
  }

  function activeIndex(entries){
    if(!entries.length)return -1;

    if(currentDockKey){
      for(var i=0;i<entries.length;i++)if(entries[i].key===currentDockKey)return i;
    }

    if(window.__sunblissDockSearchOpen){
      for(var s=0;s<entries.length;s++)if(entries[s].key==='action:search')return s;
    }

    for(var a=0;a<entries.length;a++){
      var button=entries[a].button;
      if(button.getAttribute('aria-pressed')==='true'||button.classList.contains('active')||button.classList.contains('is-active')){
        currentDockKey=entries[a].key;
        return a;
      }
    }

    if(window.state){
      var stateKey='view:'+normaliseView(state.view);
      for(var v=0;v<entries.length;v++)if(entries[v].key===stateKey){
        currentDockKey=stateKey;
        return v;
      }
    }

    currentDockKey=entries[0].key;
    return 0;
  }

  function surface(){
    var node=document.getElementById('main')||document.querySelector('#app main');
    return visible(node)?node:null;
  }

  function menuBlockingSwipe(){
    var selectors=['.menu-portal','.context-menu','#customerActionMenu.is-open','#customerActionMenu.open'];
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
    if(!mobile()||menuBlockingSwipe()||loadingOrLocked())return false;
    var entries=dockEntries();
    if(entries.length<2||activeIndex(entries)<0)return false;
    if(x<EDGE_GUARD||x>window.innerWidth-EDGE_GUARD)return false;
    if(excludedStartTarget(target)||horizontalScroller(target))return false;
    return true;
  }

  function directionFor(dx){return dx<0?1:-1;}

  function targetFrom(entries,index,dx){
    var next=index+directionFor(dx);
    return next>=0&&next<entries.length?entries[next]:null;
  }

  function clearSurface(node,animate){
    if(!node)return;
    if(animate){
      node.style.transition='transform 145ms cubic-bezier(.22,1,.36,1),opacity 145ms ease';
      node.style.transform='translate3d(0,0,0)';
      node.style.opacity='1';
      window.setTimeout(function(){
        if(!node.isConnected)return;
        node.style.transition='';
        node.style.transform='';
        node.style.opacity='';
        node.style.willChange='';
      },165);
    }else{
      node.style.transition='';
      node.style.transform='';
      node.style.opacity='';
      node.style.willChange='';
    }
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

  function beginBypass(){
    bypassGeneration+=1;
    var generation=bypassGeneration;
    window.__sunblissSwipeNavigating=true;
    window.setTimeout(function(){
      if(generation!==bypassGeneration)return;
      window.__sunblissSwipeNavigating=false;
    },440);
  }

  function activateEntry(target,current,dx){
    if(!target||!target.button)return false;
    beginBypass();
    internalActivation=true;
    try{
      if(current&&current.key==='action:search'&&target.key!=='action:search'&&window.__sunblissDockSearchOpen&&current.button&&current.button.isConnected){
        current.button.click();
      }
      currentDockKey=target.key;
      target.button.click();
    }finally{
      internalActivation=false;
    }
    animateIncoming(dx);
    return true;
  }

  function finishNavigation(current,dx){
    var target=targetFrom(current.entries,current.index,dx);
    if(!target){clearSurface(current.surface,true);return;}

    navigationLockedUntil=Date.now()+NAV_LOCK_MS;
    suppressClickUntil=Date.now()+430;

    var node=current.surface;
    if(!node){activateEntry(target,current.entries[current.index],dx);return;}

    var exit=dx<0?-EXIT_DISTANCE:EXIT_DISTANCE;
    node.style.willChange='transform,opacity';
    node.style.transition='transform '+EXIT_DURATION+'ms cubic-bezier(.4,0,.2,1),opacity '+EXIT_DURATION+'ms ease';
    node.style.transform='translate3d('+exit+'px,0,0)';
    node.style.opacity='.95';

    window.setTimeout(function(){
      clearSurface(node,false);
      var refreshed=dockEntries();
      var refreshedTarget=null;
      for(var i=0;i<refreshed.length;i++)if(refreshed[i].key===target.key){refreshedTarget=refreshed[i];break;}
      activateEntry(refreshedTarget||target,current.entries[current.index],dx);
    },EXIT_DURATION);
  }

  document.addEventListener('touchstart',function(event){
    gesture=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    var entries=dockEntries();
    var index=activeIndex(entries);
    if(index<0)return;
    gesture={x:touch.clientX,y:touch.clientY,time:Date.now(),axis:null,entries:entries,index:index,surface:surface()};
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

    var allowed=!!targetFrom(gesture.entries,gesture.index,dx);
    var drag=allowed?dx:dx*.15;
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
    if(!mobile()||menuBlockingSwipe()||Date.now()<navigationLockedUntil){clearSurface(current.surface,true);return;}

    var touch=event.changedTouches[0];
    var dx=touch.clientX-current.x;
    var dy=touch.clientY-current.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);
    var valid=Date.now()-current.time<=MAX_DURATION&&ax>=MIN_DISTANCE&&(current.axis==='x'||ax>=ay*HORIZONTAL_RATIO)&&!!targetFrom(current.entries,current.index,dx);

    if(!valid){clearSurface(current.surface,true);return;}
    finishNavigation(current,dx);
  },{passive:true});

  document.addEventListener('touchcancel',function(){
    if(gesture)clearSurface(gesture.surface,true);
    gesture=null;
  },{passive:true});

  document.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('.tabs .tab'):null;
    if(button&&visible(button))currentDockKey=buttonKey(button);
    if(internalActivation||Date.now()>=suppressClickUntil)return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
})();