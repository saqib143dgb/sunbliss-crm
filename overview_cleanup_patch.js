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
  var internalActivation=false;
  var bypassGeneration=0;

  var LIVE_COMMIT_DISTANCE=18;
  var END_COMMIT_DISTANCE=18;
  var MAX_DURATION=1050;
  var EDGE_GUARD=18;
  var AXIS_LOCK_DISTANCE=5;
  var HORIZONTAL_RATIO=1.05;
  var NAV_LOCK_MS=170;
  var CONTENT_ANIMATION_MS=145;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }

  function reducedMotion(){
    return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

  function pageKey(button){
    if(!button||!button.getAttribute)return '';
    var view=button.getAttribute('data-view');
    return view?'view:'+normaliseView(view):'';
  }

  function pageEntries(){
    var tabs=document.querySelector('.tabs');
    if(!visible(tabs))return [];
    return Array.prototype.slice.call(tabs.querySelectorAll('.tab[data-view]')).filter(function(button){
      return visible(button)&&!button.disabled&&!button.classList.contains('dock-add')&&!button.classList.contains('dock-search');
    }).map(function(button){
      var rect=button.getBoundingClientRect();
      return {button:button,key:pageKey(button),left:rect.left};
    }).filter(function(entry){return !!entry.key;}).sort(function(a,b){return a.left-b.left;});
  }

  function activeIndex(entries){
    if(!entries.length)return -1;
    for(var a=0;a<entries.length;a++){
      var button=entries[a].button;
      if(button.getAttribute('aria-pressed')==='true'||button.classList.contains('active')||button.classList.contains('is-active'))return a;
    }
    if(window.state){
      var stateKey='view:'+normaliseView(state.view);
      for(var v=0;v<entries.length;v++)if(entries[v].key===stateKey)return v;
    }
    return -1;
  }

  function surface(){
    var node=document.getElementById('main')||document.querySelector('#app main');
    return visible(node)?node:null;
  }

  function contentNodes(){
    var main=surface();
    if(!main)return [];
    return Array.prototype.slice.call(main.children).filter(function(node){
      return node&&node.nodeType===1&&!node.classList.contains('tabs')&&!node.matches('.tabs');
    });
  }

  function blockingUiOpen(){
    var selectors=[
      '#sunblissDockSearchPanel.is-open',
      '[role="dialog"]:not([aria-hidden="true"])',
      '.modal.is-open','.modal.open','.sheet.is-open','.sheet.open',
      '.drawer.is-open','.drawer.open','.menu-portal','.context-menu',
      '#customerActionMenu.is-open','#customerActionMenu.open'
    ];
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
    var entries=pageEntries();
    if(entries.length<2||activeIndex(entries)<0)return false;
    if(x<EDGE_GUARD||x>window.innerWidth-EDGE_GUARD)return false;
    if(excludedStartTarget(target)||horizontalScroller(target))return false;
    return true;
  }

  function targetFrom(entries,index,dx){
    var next=index+(dx<0?1:-1);
    return next>=0&&next<entries.length?entries[next]:null;
  }

  function resetDraggedNodes(nodes,animate){
    (nodes||[]).forEach(function(node){
      if(!node||!node.isConnected)return;
      if(animate){
        node.style.transition='transform 110ms cubic-bezier(.22,1,.36,1),opacity 100ms ease';
        node.style.transform='translate3d(0,0,0)';
        node.style.opacity='1';
        window.setTimeout(function(){
          if(!node.isConnected)return;
          node.style.transition='';
          node.style.transform='';
          node.style.opacity='';
          node.style.willChange='';
        },130);
      }else{
        node.style.transition='';
        node.style.transform='';
        node.style.opacity='';
        node.style.willChange='';
      }
    });
  }

  function ensureStyles(){
    if(document.getElementById('sunblissSwipeDirectStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissSwipeDirectStyles';
    style.textContent=[
      'html.sbx-swipe-active .tabs{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:none!important;}',
      'html.sbx-swipe-active #sbxLoader{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}',
      '@media(prefers-reduced-motion:reduce){html.sbx-swipe-active #main>*:not(.tabs){transition:none!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function beginBypass(){
    bypassGeneration+=1;
    var generation=bypassGeneration;
    window.__sunblissSwipeNavigating=true;
    document.documentElement.classList.add('sbx-swipe-active');
    window.setTimeout(function(){
      if(generation!==bypassGeneration)return;
      window.__sunblissSwipeNavigating=false;
      document.documentElement.classList.remove('sbx-swipe-active');
    },260);
  }

  function activate(target){
    if(!target||!target.button)return false;
    beginBypass();
    internalActivation=true;
    try{target.button.click();}
    finally{internalActivation=false;}
    return true;
  }

  function animateNewContent(dx){
    if(reducedMotion())return;
    window.requestAnimationFrame(function(){
      var nodes=contentNodes();
      if(!nodes.length)return;
      var from=dx<0?24:-24;
      nodes.forEach(function(node){
        node.style.willChange='transform,opacity';
        node.style.transition='none';
        node.style.transform='translate3d('+from+'px,0,0)';
        node.style.opacity='.985';
      });
      window.requestAnimationFrame(function(){
        nodes.forEach(function(node){
          if(!node.isConnected)return;
          node.style.transition='transform '+CONTENT_ANIMATION_MS+'ms cubic-bezier(.22,1,.36,1),opacity '+CONTENT_ANIMATION_MS+'ms ease';
          node.style.transform='translate3d(0,0,0)';
          node.style.opacity='1';
        });
        window.setTimeout(function(){resetDraggedNodes(nodes,false);},CONTENT_ANIMATION_MS+30);
      });
    });
  }

  function finishNavigation(current,dx){
    var target=targetFrom(current.entries,current.index,dx);
    if(!target){resetDraggedNodes(current.dragNodes,true);return false;}
    navigationLockedUntil=Date.now()+NAV_LOCK_MS;
    suppressClickUntil=Date.now()+220;
    resetDraggedNodes(current.dragNodes,false);
    activate(target);
    animateNewContent(dx);
    return true;
  }

  document.addEventListener('touchstart',function(event){
    gesture=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    var entries=pageEntries();
    var index=activeIndex(entries);
    if(index<0)return;
    gesture={x:touch.clientX,y:touch.clientY,time:Date.now(),axis:null,entries:entries,index:index,dragNodes:contentNodes(),drag:0};
  },{passive:true});

  document.addEventListener('touchmove',function(event){
    if(!gesture||!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    var dx=touch.clientX-gesture.x;
    var dy=touch.clientY-gesture.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);

    if(gesture.axis===null&&Math.max(ax,ay)>=AXIS_LOCK_DISTANCE){
      if(ay>ax*1.12){resetDraggedNodes(gesture.dragNodes,true);gesture=null;return;}
      if(ax>ay*HORIZONTAL_RATIO)gesture.axis='x';
    }

    if(gesture.axis!=='x')return;
    event.preventDefault();

    var allowed=!!targetFrom(gesture.entries,gesture.index,dx);
    var drag=allowed?dx*.72:dx*.08;
    drag=Math.max(-32,Math.min(32,drag));
    gesture.drag=drag;

    gesture.dragNodes.forEach(function(node){
      if(!node||!node.isConnected)return;
      node.style.willChange='transform,opacity';
      node.style.transition='none';
      node.style.transform='translate3d('+drag+'px,0,0)';
      node.style.opacity=String(1-Math.min(Math.abs(drag)/1300,.02));
    });

    if(allowed&&ax>=LIVE_COMMIT_DISTANCE&&ax>=ay*HORIZONTAL_RATIO){
      var current=gesture;
      gesture=null;
      finishNavigation(current,dx);
    }
  },{passive:false});

  document.addEventListener('touchend',function(event){
    if(!gesture)return;
    var current=gesture;
    gesture=null;
    if(!event.changedTouches||event.changedTouches.length!==1){resetDraggedNodes(current.dragNodes,true);return;}
    if(!mobile()||blockingUiOpen()||Date.now()<navigationLockedUntil){resetDraggedNodes(current.dragNodes,true);return;}

    var touch=event.changedTouches[0];
    var dx=touch.clientX-current.x;
    var dy=touch.clientY-current.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);
    var valid=Date.now()-current.time<=MAX_DURATION&&ax>=END_COMMIT_DISTANCE&&(current.axis==='x'||ax>=ay*HORIZONTAL_RATIO)&&!!targetFrom(current.entries,current.index,dx);

    if(!valid){resetDraggedNodes(current.dragNodes,true);return;}
    finishNavigation(current,dx);
  },{passive:true});

  document.addEventListener('touchcancel',function(){
    if(gesture)resetDraggedNodes(gesture.dragNodes,true);
    gesture=null;
  },{passive:true});

  document.addEventListener('click',function(event){
    if(internalActivation||Date.now()>=suppressClickUntil)return;
    var pageButton=event.target&&event.target.closest?event.target.closest('.tabs .tab[data-view]'):null;
    if(!pageButton)return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);

  ensureStyles();
})();