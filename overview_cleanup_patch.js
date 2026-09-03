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
  var swipeGeneration=0;

  var EDGE_GUARD=18;
  var AXIS_LOCK_DISTANCE=6;
  var HORIZONTAL_RATIO=1.05;
  var COMMIT_RATIO=.30;
  var FLING_DISTANCE=44;
  var FLING_VELOCITY=.42;
  var SNAP_MS=190;
  var NAV_LOCK_MS=230;

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

  function tabsNode(){
    var all=document.querySelectorAll('#app .tabs,.tabs');
    for(var i=0;i<all.length;i++)if(visible(all[i])&&!all[i].closest('.sbx-swipe-stage'))return all[i];
    return null;
  }

  function pageEntries(){
    var tabs=tabsNode();
    if(!tabs)return [];
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

  function entryByKey(key){
    var entries=pageEntries();
    for(var i=0;i<entries.length;i++)if(entries[i].key===key)return entries[i];
    return null;
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
    if(!dx)return null;
    var next=index+(dx<0?1:-1);
    return next>=0&&next<entries.length?entries[next]:null;
  }

  function ensureStyles(){
    if(document.getElementById('sunblissSwipeInteractiveStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissSwipeInteractiveStyles';
    style.textContent=[
      'html.sbx-swipe-active{overscroll-behavior-x:none!important;}',
      'html.sbx-swipe-active body{overscroll-behavior-x:none!important;}',
      'html.sbx-swipe-active #sbxLoader{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}',
      '.sbx-swipe-stage{position:fixed;inset:0;z-index:2147482400;overflow:hidden;pointer-events:none;contain:layout paint style;}',
      '.sbx-swipe-panel{position:absolute;left:0;right:0;overflow:hidden;pointer-events:none;will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;}',
      '.sbx-swipe-panel>*{animation:none!important;transition:none!important;pointer-events:none!important;}',
      '.sbx-swipe-tabs-snapshot{position:fixed!important;z-index:2147482405!important;margin:0!important;pointer-events:none!important;animation:none!important;transition:none!important;backface-visibility:hidden;-webkit-backface-visibility:hidden;}',
      '.sbx-swipe-stage canvas{image-rendering:auto;}',
      '@media(prefers-reduced-motion:reduce){.sbx-swipe-panel{transition:none!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function enterSwipeMode(){
    swipeGeneration+=1;
    window.__sunblissSwipeNavigating=true;
    document.documentElement.classList.add('sbx-swipe-active');
    return swipeGeneration;
  }

  function exitSwipeMode(generation){
    if(generation!==swipeGeneration)return;
    window.__sunblissSwipeNavigating=false;
    document.documentElement.classList.remove('sbx-swipe-active');
  }

  function quietActivateKey(key){
    var entry=entryByKey(key);
    if(!entry||!entry.button)return false;
    internalActivation=true;
    try{entry.button.click();}
    finally{internalActivation=false;}
    return true;
  }

  function copyCanvasPixels(source,clone){
    var from=source.querySelectorAll?source.querySelectorAll('canvas'):[];
    var to=clone.querySelectorAll?clone.querySelectorAll('canvas'):[];
    for(var i=0;i<Math.min(from.length,to.length);i++){
      try{
        to[i].width=from[i].width;
        to[i].height=from[i].height;
        var context=to[i].getContext&&to[i].getContext('2d');
        if(context)context.drawImage(from[i],0,0);
      }catch(error){}
    }
  }

  function copyFormState(source,clone){
    var from=source.querySelectorAll?source.querySelectorAll('input,textarea,select'):[];
    var to=clone.querySelectorAll?clone.querySelectorAll('input,textarea,select'):[];
    for(var i=0;i<Math.min(from.length,to.length);i++){
      try{
        if('value' in from[i])to[i].value=from[i].value;
        if('checked' in from[i])to[i].checked=from[i].checked;
        if(from[i].tagName==='SELECT')to[i].selectedIndex=from[i].selectedIndex;
      }catch(error){}
    }
  }

  function contentBounds(nodes){
    var top=window.innerHeight;
    var bottom=0;
    for(var i=0;i<nodes.length;i++){
      var rect=nodes[i].getBoundingClientRect();
      if(rect.width<=0||rect.height<=0)continue;
      top=Math.min(top,rect.top);
      bottom=Math.max(bottom,rect.bottom);
    }
    if(top===window.innerHeight)top=0;

    var header=document.querySelector('.topbar');
    if(header&&visible(header)){
      var hr=header.getBoundingClientRect();
      if(hr.top<=0&&hr.bottom>0)top=Math.max(top,hr.bottom);
    }

    var tabs=tabsNode();
    var safeBottom=0;
    if(tabs){
      var tr=tabs.getBoundingClientRect();
      if(tr.top<window.innerHeight*.48)top=Math.max(top,tr.bottom);
      else if(tr.top>window.innerHeight*.52)safeBottom=Math.max(0,window.innerHeight-tr.top);
    }

    top=Math.max(0,Math.min(window.innerHeight,top));
    return {top:top,bottom:safeBottom,contentBottom:bottom};
  }

  function snapshotPanel(bounds){
    var nodes=contentNodes();
    var panel=document.createElement('div');
    panel.className='sbx-swipe-panel';
    panel.style.top=bounds.top+'px';
    panel.style.bottom=bounds.bottom+'px';

    var main=surface();
    var mainStyle=main&&window.getComputedStyle?window.getComputedStyle(main):null;
    var bg=mainStyle&&mainStyle.backgroundColor&&mainStyle.backgroundColor!=='rgba(0, 0, 0, 0)'?mainStyle.backgroundColor:'';
    if(!bg){
      var bodyStyle=window.getComputedStyle?window.getComputedStyle(document.body):null;
      bg=bodyStyle&&bodyStyle.backgroundColor?bodyStyle.backgroundColor:'#fff';
    }
    panel.style.background=bg;

    for(var i=0;i<nodes.length;i++){
      var source=nodes[i];
      var rect=source.getBoundingClientRect();
      var clone=source.cloneNode(true);
      copyCanvasPixels(source,clone);
      copyFormState(source,clone);
      clone.setAttribute('aria-hidden','true');
      clone.style.position='absolute';
      clone.style.left=rect.left+'px';
      clone.style.top=(rect.top-bounds.top)+'px';
      clone.style.width=rect.width+'px';
      clone.style.maxWidth='none';
      clone.style.margin='0';
      clone.style.transform='none';
      clone.style.pointerEvents='none';
      clone.style.boxSizing='border-box';
      panel.appendChild(clone);
    }
    return panel;
  }

  function snapshotTabs(){
    var tabs=tabsNode();
    if(!tabs)return null;
    var rect=tabs.getBoundingClientRect();
    var clone=tabs.cloneNode(true);
    copyCanvasPixels(tabs,clone);
    copyFormState(tabs,clone);
    clone.classList.add('sbx-swipe-tabs-snapshot');
    clone.setAttribute('aria-hidden','true');
    clone.style.left=rect.left+'px';
    clone.style.top=rect.top+'px';
    clone.style.width=rect.width+'px';
    clone.style.height=rect.height+'px';
    clone.style.maxWidth='none';
    clone.style.transform='none';
    return clone;
  }

  function makePreview(current,dx){
    var target=targetFrom(current.entries,current.index,dx);
    if(!target)return null;

    var nodes=contentNodes();
    if(!nodes.length)return null;
    var bounds=contentBounds(nodes);
    var stage=document.createElement('div');
    stage.className='sbx-swipe-stage';
    stage.setAttribute('aria-hidden','true');

    var generation=enterSwipeMode();
    var currentPanel=snapshotPanel(bounds);
    var tabsSnapshot=snapshotTabs();
    stage.appendChild(currentPanel);
    if(tabsSnapshot)stage.appendChild(tabsSnapshot);
    document.body.appendChild(stage);

    var preview={
      generation:generation,
      stage:stage,
      currentPanel:currentPanel,
      targetPanel:null,
      tabsSnapshot:tabsSnapshot,
      currentKey:current.entries[current.index].key,
      targetKey:target.key,
      direction:dx<0?-1:1,
      width:Math.max(1,window.innerWidth),
      bounds:bounds,
      ready:false,
      disposed:false,
      pendingFinish:null,
      savedX:window.scrollX||0,
      savedY:window.scrollY||0
    };

    quietActivateKey(preview.targetKey);

    window.requestAnimationFrame(function(){
      if(preview.disposed)return;
      preview.targetPanel=snapshotPanel(bounds);
      preview.targetPanel.style.transform='translate3d('+(preview.direction<0?preview.width:-preview.width)+'px,0,0)';
      preview.stage.insertBefore(preview.targetPanel,preview.tabsSnapshot||null);

      quietActivateKey(preview.currentKey);
      try{window.scrollTo(preview.savedX,preview.savedY);}catch(error){}

      window.requestAnimationFrame(function(){
        if(preview.disposed)return;
        preview.ready=true;
        updatePreview(preview,current.drag||0);
        if(preview.pendingFinish){
          var fn=preview.pendingFinish;
          preview.pendingFinish=null;
          fn();
        }
      });
    });

    return preview;
  }

  function updatePreview(preview,dx){
    if(!preview||preview.disposed)return;
    var width=preview.width;
    var drag=Math.max(-width,Math.min(width,dx));
    preview.currentPanel.style.transition='none';
    preview.currentPanel.style.transform='translate3d('+drag+'px,0,0)';
    if(preview.targetPanel){
      var base=preview.direction<0?width:-width;
      preview.targetPanel.style.transition='none';
      preview.targetPanel.style.transform='translate3d('+(base+drag)+'px,0,0)';
    }
  }

  function teardownPreview(preview,restoreCurrent){
    if(!preview||preview.disposed)return;
    preview.disposed=true;
    if(restoreCurrent)quietActivateKey(preview.currentKey);
    if(preview.stage&&preview.stage.parentNode)preview.stage.parentNode.removeChild(preview.stage);
    exitSwipeMode(preview.generation);
  }

  function animatePreview(preview,toDx,done){
    if(!preview||preview.disposed){if(done)done();return;}
    if(reducedMotion()){
      updatePreview(preview,toDx);
      if(done)done();
      return;
    }
    var duration=SNAP_MS;
    preview.currentPanel.style.transition='transform '+duration+'ms cubic-bezier(.22,1,.36,1)';
    if(preview.targetPanel)preview.targetPanel.style.transition='transform '+duration+'ms cubic-bezier(.22,1,.36,1)';
    window.requestAnimationFrame(function(){
      var width=preview.width;
      var drag=Math.max(-width,Math.min(width,toDx));
      preview.currentPanel.style.transform='translate3d('+drag+'px,0,0)';
      if(preview.targetPanel){
        var base=preview.direction<0?width:-width;
        preview.targetPanel.style.transform='translate3d('+(base+drag)+'px,0,0)';
      }
    });
    window.setTimeout(function(){if(done)done();},duration+24);
  }

  function cancelGesture(current){
    if(!current)return;
    if(current.preview){
      var preview=current.preview;
      var finish=function(){
        animatePreview(preview,0,function(){
          teardownPreview(preview,true);
        });
      };
      if(preview.ready)finish();
      else preview.pendingFinish=finish;
    }
  }

  function commitGesture(current,dx){
    if(!current)return;
    var target=targetFrom(current.entries,current.index,dx);
    if(!target){cancelGesture(current);return;}

    navigationLockedUntil=Date.now()+NAV_LOCK_MS;
    suppressClickUntil=Date.now()+320;

    if(!current.preview){
      var gen=enterSwipeMode();
      quietActivateKey(target.key);
      window.setTimeout(function(){exitSwipeMode(gen);},80);
      return;
    }

    var preview=current.preview;
    var finish=function(){
      var finalDx=preview.direction<0?-preview.width:preview.width;
      animatePreview(preview,finalDx,function(){
        quietActivateKey(preview.targetKey);
        teardownPreview(preview,false);
      });
    };

    if(preview.ready)finish();
    else preview.pendingFinish=finish;
  }

  document.addEventListener('touchstart',function(event){
    gesture=null;
    if(!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    if(!eligible(event.target,touch.clientX))return;
    var entries=pageEntries();
    var index=activeIndex(entries);
    if(index<0)return;
    gesture={
      x:touch.clientX,
      y:touch.clientY,
      time:Date.now(),
      lastX:touch.clientX,
      lastTime:Date.now(),
      velocityX:0,
      axis:null,
      entries:entries,
      index:index,
      drag:0,
      preview:null,
      direction:0
    };
  },{passive:true});

  document.addEventListener('touchmove',function(event){
    if(!gesture||!event.touches||event.touches.length!==1)return;
    var touch=event.touches[0];
    var now=Date.now();
    var dx=touch.clientX-gesture.x;
    var dy=touch.clientY-gesture.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);

    if(gesture.axis===null&&Math.max(ax,ay)>=AXIS_LOCK_DISTANCE){
      if(ay>ax*1.12){gesture=null;return;}
      if(ax>ay*HORIZONTAL_RATIO)gesture.axis='x';
    }

    if(gesture.axis!=='x')return;
    event.preventDefault();

    var dt=Math.max(1,now-gesture.lastTime);
    gesture.velocityX=(touch.clientX-gesture.lastX)/dt;
    gesture.lastX=touch.clientX;
    gesture.lastTime=now;

    var target=targetFrom(gesture.entries,gesture.index,dx);
    if(!target){
      gesture.drag=dx*.12;
      return;
    }

    var direction=dx<0?-1:1;
    if(gesture.preview&&gesture.direction&&direction!==gesture.direction){
      teardownPreview(gesture.preview,true);
      gesture.preview=null;
      gesture.direction=0;
      gesture.drag=0;
      return;
    }

    gesture.direction=direction;
    gesture.drag=Math.max(-window.innerWidth,Math.min(window.innerWidth,dx));

    if(!gesture.preview)gesture.preview=makePreview(gesture,dx);
    if(gesture.preview)updatePreview(gesture.preview,gesture.drag);
  },{passive:false});

  document.addEventListener('touchend',function(event){
    if(!gesture)return;
    var current=gesture;
    gesture=null;

    if(!event.changedTouches||event.changedTouches.length!==1){
      cancelGesture(current);
      return;
    }

    if(!mobile()||blockingUiOpen()){
      cancelGesture(current);
      return;
    }

    var touch=event.changedTouches[0];
    var dx=touch.clientX-current.x;
    var dy=touch.clientY-current.y;
    var ax=Math.abs(dx),ay=Math.abs(dy);
    var width=Math.max(1,window.innerWidth);
    var progress=ax/width;
    var velocity=Math.abs(current.velocityX||0);
    var horizontal=current.axis==='x'||ax>=ay*HORIZONTAL_RATIO;
    var target=targetFrom(current.entries,current.index,dx);
    var shouldCommit=!!target&&horizontal&&(progress>=COMMIT_RATIO||(ax>=FLING_DISTANCE&&velocity>=FLING_VELOCITY));

    if(shouldCommit)commitGesture(current,dx);
    else cancelGesture(current);
  },{passive:true});

  document.addEventListener('touchcancel',function(){
    if(gesture)cancelGesture(gesture);
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