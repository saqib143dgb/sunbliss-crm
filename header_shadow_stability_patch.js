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