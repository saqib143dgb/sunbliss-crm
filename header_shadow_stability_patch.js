(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderShadowStabilityStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissHeaderShadowStabilityStyle';
  style.textContent=`
    @media(max-width:720px){
      /* Keep only the inset treatment on the header itself. The external drop
         shadow is painted by body::after so it survives route/tab re-renders
         even when the .topbar node is replaced for a frame. */
      html body #app .topbar{
        animation:none!important;
        transition:none!important;
        box-shadow:
          inset 0 0 0 1px rgba(224,170,78,.16),
          inset 0 -34px 54px rgba(1,8,14,.20)!important;
      }

      html body::after{
        content:'';
        position:absolute;
        top:220px;
        left:50%;
        width:min(100%,640px);
        height:1px;
        transform:translateX(-50%);
        pointer-events:none;
        z-index:20;
        box-shadow:0 14px 34px rgba(2,9,15,.24);
      }
    }

    /* KPI reconciliation is allowed to delay only KPI presentation. Once the
       real boot state has ended it can never bring the full-screen loader back. */
    html.sbx-overview-data-pending:not(.sbx-booting) body{
      overflow:auto!important;
    }
    html.sbx-overview-data-pending:not(.sbx-booting) #app{
      opacity:1!important;
      visibility:visible!important;
    }
    html.sbx-overview-data-pending:not(.sbx-booting) #sbxLoader{
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    html.sbx-overview-data-pending:not(.sbx-booting) #sbxBootScene{
      opacity:0!important;
    }
    html.sbx-overview-data-pending:not(.sbx-booting) #sbxBootCard{
      display:none!important;
    }

    /* DLD tracker first-paint guard.
       This stylesheet is preloaded in <head>, so the tracker is born in its
       final desktop composition instead of painting the old stacked layout
       for one frame and then being reorganized by deferred UI JavaScript. */
    @media(min-width:1024px){
      .overview > div:has(> #btnDldPaid){
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        width:100%!important;
        max-width:none!important;
        height:auto!important;
        min-height:0!important;
        align-items:stretch!important;
      }
      .overview > div:has(> #btnDldPaid) > .stat-cell{
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        min-width:0!important;
        width:100%!important;
        max-width:none!important;
        height:auto!important;
        min-height:104px!important;
        padding:15px 14px!important;
        box-sizing:border-box!important;
      }
      .overview > .pipeline:has(> #btnDldFullyPaid){
        display:grid!important;
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        width:100%!important;
        max-width:none!important;
        gap:9px!important;
        margin:2px 0 18px!important;
        height:auto!important;
        min-height:0!important;
        align-items:stretch!important;
        flex-wrap:nowrap!important;
      }
      .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat{
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        min-width:0!important;
        width:100%!important;
        max-width:none!important;
        height:76px!important;
        min-height:76px!important;
        margin:0!important;
        padding:11px 12px!important;
        box-sizing:border-box!important;
      }
      .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat > .pill-stat-num{
        display:flex!important;
        align-items:center!important;
        visibility:visible!important;
        opacity:1!important;
        height:auto!important;
        min-height:0!important;
        overflow:visible!important;
      }
      .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat > .pill-stat-lbl{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        height:auto!important;
        min-height:0!important;
      }

      /* Approved desktop header cleanup: keep the project name only. */
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-row .sb-desktop-project-sub{
        display:none!important;
      }

      /* Keep the project identity on the same horizontal baseline as the user
         name. The old rounded project card is intentionally removed so the
         header reads as one clean, centered identity row. */
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-copy{
        grid-template-columns:minmax(250px,1fr) max-content!important;
        grid-template-areas:'welcome .' 'name project'!important;
        grid-template-rows:22px 46px!important;
        align-items:center!important;
        column-gap:28px!important;
        width:min(720px,72%)!important;
        min-width:0!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-row{
        grid-area:project!important;
        align-self:center!important;
        justify-self:start!important;
        width:auto!important;
        min-width:0!important;
        height:46px!important;
        min-height:46px!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-row:before{
        content:none!important;
        display:none!important;
        border:0!important;
        background:none!important;
        box-shadow:none!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project{
        width:auto!important;
        gap:9px!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-icon{
        width:34px!important;
        height:34px!important;
        flex:0 0 34px!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-icon svg{
        width:30px!important;
        height:30px!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-name,
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project>span:not(.sb-pro-project-icon):not(.sb-pro-project-sep){
        font-size:13.5px!important;
        line-height:1!important;
      }

      /* Desktop header visual seam fix plus final project/building spacing.
         Keep the decorative project layer flush to the right edge, but start it
         slightly earlier so the Sunbliss building sits closer to the project
         identity without changing the header structure. */
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-visual{
        left:56%!important;
        right:0!important;
        border:0!important;
        outline:0!important;
        box-shadow:none!important;
        background-color:transparent!important;
        background-position:76% 66%!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-visual:after{
        right:-2px!important;
        border:0!important;
        outline:0!important;
        box-shadow:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  /*
    Desktop header lifecycle ownership.

    The professional header renderer owns header.innerHTML. Older desktop
    enhancements were appended afterwards, so any later render could erase the
    building layer and move the sync control back into the project row. A full
    page reload happened to run the enhancement scripts again, which is why the
    video recovered only after refresh.

    Keep the final desktop-only elements owned by the render lifecycle instead:
    restore them after render and observe only the header itself. Do NOT watch
    the whole application subtree; that previously caused expensive feedback
    loops elsewhere in the CRM.
  */
  var headerFixQueued=false;
  var observedHeader=null;
  var headerObserver=null;
  var hookAttempts=0;

  function desktopViewport(){
    return window.matchMedia?window.matchMedia('(min-width:1024px)').matches:window.innerWidth>=1024;
  }

  function directChildByClass(parent,className){
    if(!parent)return null;
    for(var i=0;i<parent.children.length;i++){
      var child=parent.children[i];
      if(child.classList&&child.classList.contains(className))return child;
    }
    return null;
  }

  function syncTimeText(){
    var value=window.state&&state.syncedAt;
    if(!value)return 'Just now';
    var d=new Date(value);
    if(isNaN(d.getTime()))return 'Just now';
    return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }

  function observeHeader(header){
    if(!window.MutationObserver||header===observedHeader)return;
    if(headerObserver)headerObserver.disconnect();
    observedHeader=header||null;
    if(!header){headerObserver=null;return;}
    headerObserver=new MutationObserver(function(){queueHeaderFix();});
    /* Header-only structural observation: enough to detect innerHTML rebuilds
       without waking up for dashboard/KPI/table mutations. */
    headerObserver.observe(header,{childList:true,subtree:true});
  }

  function stabilizeDesktopHeader(){
    var header=document.querySelector('.topbar.sunbliss-professional-header');
    if(!header){observeHeader(null);return;}
    observeHeader(header);

    var visual=directChildByClass(header,'sb-desktop-project-visual');
    var directSync=directChildByClass(header,'sb-pro-sync');
    var projectRow=header.querySelector('.sb-pro-project-row');
    var nestedSync=projectRow?directChildByClass(projectRow,'sb-pro-sync'):null;

    if(!desktopViewport()){
      if(visual)visual.remove();
      if(directSync&&projectRow&&!nestedSync)projectRow.appendChild(directSync);
      return;
    }

    if(!visual){
      visual=document.createElement('div');
      visual.className='sb-desktop-project-visual';
      visual.setAttribute('aria-hidden','true');
      header.insertBefore(visual,header.firstChild);
    }

    /* The newest sync node wins. If the renderer has just rebuilt the header,
       it creates a fresh nested sync; move that exact node to the desktop slot
       instead of cloning it, preserving accessibility and delegated actions. */
    if(nestedSync){
      if(directSync&&directSync!==nestedSync)directSync.remove();
      header.appendChild(nestedSync);
      directSync=nestedSync;
    }

    if(directSync){
      var label=directSync.querySelector('span');
      var expected='Synced '+syncTimeText();
      if(label&&label.textContent!==expected)label.textContent=expected;
    }
  }

  function queueHeaderFix(){
    if(headerFixQueued)return;
    headerFixQueued=true;
    requestAnimationFrame(function(){
      headerFixQueued=false;
      stabilizeDesktopHeader();
    });
  }

  function wrapHeaderRender(name){
    var fn=window[name];
    if(typeof fn!=='function'||fn.__sunblissHeaderLifecycleStable)return;
    function wrapped(){
      var out;
      try{out=fn.apply(this,arguments)}
      finally{queueHeaderFix();}
      if(out&&typeof out.then==='function')out.then(queueHeaderFix,queueHeaderFix);
      return out;
    }
    wrapped.__sunblissHeaderLifecycleStable=true;
    wrapped.__sunblissOriginal=fn;
    window[name]=wrapped;
  }

  function installHeaderLifecycle(){
    wrapHeaderRender('render');
    wrapHeaderRender('renderMain');
    wrapHeaderRender('renderOverview');
    wrapHeaderRender('renderDetail');
    queueHeaderFix();

    /* Header render wrappers are installed by several deferred CRM patches.
       Retry only during startup so we end up outside the final wrapper chain,
       then stop; there is no permanent polling loop. */
    hookAttempts+=1;
    if(hookAttempts<14)window.setTimeout(installHeaderLifecycle,140);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',installHeaderLifecycle,{once:true});
  }else{
    installHeaderLifecycle();
  }
  window.addEventListener('pageshow',queueHeaderFix);
  window.addEventListener('resize',queueHeaderFix,{passive:true});

  /*
    Startup safety: the KPI reconciliation patch may temporarily add
    sbx-overview-data-pending. That state must never own the whole application
    before authentication exists, and it must never be able to hold the boot
    loader forever if a reconciliation request fails or is interrupted.
  */
  var root=document.documentElement;
  var financialGateTimer=null;

  function authenticatedOverview(){
    return !!(window.state&&state.userRole&&state.view==='overview');
  }

  function releaseStaleFinancialGate(){
    if(!root.classList.contains('sbx-overview-data-pending'))return;
    if(!authenticatedOverview()||window.__sunblissOverviewFinancialReady===true){
      root.classList.remove('sbx-overview-data-pending');
    }
  }

  function armFinancialGateLimit(){
    window.clearTimeout(financialGateTimer);
    financialGateTimer=window.setTimeout(function(){
      root.classList.remove('sbx-overview-data-pending');
    },2500);
  }

  document.addEventListener('sunbliss:overview-financial-loading',function(){
    if(!authenticatedOverview()){
      window.setTimeout(releaseStaleFinancialGate,0);
      return;
    }
    armFinancialGateLimit();
  });

  document.addEventListener('sunbliss:overview-financial-ready',function(){
    window.clearTimeout(financialGateTimer);
    root.classList.remove('sbx-overview-data-pending');
  });

  if(window.MutationObserver){
    new MutationObserver(function(){
      releaseStaleFinancialGate();
    }).observe(root,{attributes:true,attributeFilter:['class']});
  }

  window.setTimeout(releaseStaleFinancialGate,0);
  window.setTimeout(function(){
    root.classList.remove('sbx-overview-data-pending');
  },4000);
})();