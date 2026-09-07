(function(){
  'use strict';
  if(window.__sunblissDesktopResponsiveCRMInstalled)return;
  window.__sunblissDesktopResponsiveCRMInstalled=true;

  var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;
  var raf=0;

  function isExecutivePreview(){
    try{
      return new URLSearchParams(location.search).get('ceo-preview')==='1' || (document.body&&document.body.classList.contains('ceo-mode'));
    }catch(_e){
      return !!(document.body&&document.body.classList.contains('ceo-mode'));
    }
  }

  function css(){return `
/*
  Final desktop responsive layer.
  This is intentionally fluid and container-driven so browser zoom changes the
  available workspace without creating a second fixed desktop layout or leaving
  unused islands of space.
*/
@media (min-width:1024px){
  html body.sunbliss-desktop:not(.ceo-mode),
  html body.sunbliss-ref-desktop:not(.ceo-mode){
    --sb-sidebar-w:clamp(190px,14vw,216px);
    --sb-page-pad:clamp(18px,2.2vw,36px);
    --sb-card-gap:clamp(9px,1vw,14px);
  }

  html body.sunbliss-desktop:not(.ceo-mode) #app,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin:0!important;
    box-sizing:border-box!important;
    contain:none!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app{
    padding-left:var(--sb-sidebar-w)!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefSidebar{
    width:var(--sb-sidebar-w)!important;
    min-width:var(--sb-sidebar-w)!important;
    max-width:var(--sb-sidebar-w)!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) main#main,
  html body.sunbliss-ref-desktop:not(.ceo-mode) main#main{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin:0!important;
    box-sizing:border-box!important;
    overflow-x:clip!important;
    container-type:inline-size!important;
    container-name:sb-workspace!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-desktop:not(.ceo-mode) .insights,
  html body.sunbliss-desktop:not(.ceo-mode) .detail,
  html body.sunbliss-desktop:not(.ceo-mode) .controls,
  html body.sunbliss-desktop:not(.ceo-mode) .list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .insights,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .detail,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .controls,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefOverviewV2{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin-left:0!important;
    margin-right:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-desktop:not(.ceo-mode) .insights,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .insights{
    padding-left:var(--sb-page-pad)!important;
    padding-right:var(--sb-page-pad)!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .detail,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .detail{
    max-width:none!important;
    margin:0!important;
    padding-left:var(--sb-page-pad)!important;
    padding-right:var(--sb-page-pad)!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .controls,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .controls{
    padding-left:var(--sb-page-pad)!important;
    padding-right:var(--sb-page-pad)!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .list{
    padding-left:var(--sb-page-pad)!important;
    padding-right:var(--sb-page-pad)!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .stat-hero,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stat-hero{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stat-cell,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stat-cell{
    min-width:0!important;
    height:auto!important;
    min-height:92px!important;
    box-sizing:border-box!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stat-cell.wide,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stat-cell.wide{
    grid-column:1/-1!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .pipeline,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .pipeline{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(min(245px,100%),1fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .pill-stat,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .pill-stat{
    width:100%!important;
    min-width:0!important;
    height:auto!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .money-grid,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .money-grid{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .ledger-scroll{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    overflow:visible!important;
    scroll-snap-type:none!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stage-card,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stage-card{
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    flex:none!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-list{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))!important;
    gap:var(--sb-card-gap)!important;
    min-width:0!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .field-row,
  html body.sunbliss-desktop:not(.ceo-mode) .field-address,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .field-row,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .field-address{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .tx-list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .tx-list,
  html body.sunbliss-desktop:not(.ceo-mode) .tx-row,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .tx-row,
  html body.sunbliss-desktop:not(.ceo-mode) .row-btn,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .row-btn{
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .row-name,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .row-name,
  html body.sunbliss-desktop:not(.ceo-mode) .row-meta,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .row-meta{
    min-width:0!important;
    overflow-wrap:anywhere!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .stage-scroll,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stage-scroll{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    overflow-x:auto!important;
    overscroll-behavior-x:contain!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stage-scroll .stage-tbl,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .stage-scroll .stage-tbl{
    min-width:720px!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefOverviewV2{
    padding-top:clamp(14px,1.2vw,18px)!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpis{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi{
    width:100%!important;
    min-width:0!important;
    height:auto!important;
    min-height:110px!important;
    box-sizing:border-box!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi>*,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status>*,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-panel>*{
    min-width:0!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-sub,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-cell span{
    white-space:normal!important;
    overflow-wrap:anywhere!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-collection{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    height:auto!important;
    min-height:111px!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-grid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status{
    width:100%!important;
    min-width:0!important;
    height:auto!important;
    min-height:121px!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom{
    display:grid!important;
    grid-template-columns:minmax(0,1.45fr) repeat(2,minmax(0,.95fr))!important;
    gap:var(--sb-card-gap)!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-panel{
    width:100%!important;
    min-width:0!important;
    height:auto!important;
    min-height:225px!important;
    box-sizing:border-box!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-row{
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{
    box-sizing:border-box!important;
    max-width:none!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header .sb-pro-top,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header .sb-pro-main{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header .sb-pro-brand,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header .sb-pro-copy{
    min-width:0!important;
  }
}

@container sb-workspace (max-width:1100px){
  .sb-v2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  .sb-v2-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  .sb-v2-status-grid>.sb-v2-status:last-child:nth-child(odd){grid-column:1/-1!important;}
  .sb-v2-bottom{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  .sb-v2-bottom>.sb-v2-panel:first-child{grid-column:1/-1!important;}
  .sb-v2-kpi,.sb-v2-status,.sb-v2-panel{height:auto!important;}
  .sb-v2-kpi{min-height:104px!important;}
  .sb-v2-panel{min-height:218px!important;}
  .sb-v2-kpi-value{font-size:clamp(18px,2.2cqi,23px)!important;}
  .sb-v2-kpi-sub{white-space:normal!important;}
}

@container sb-workspace (max-width:780px){
  .sb-v2-kpis{grid-template-columns:1fr!important;}
  .sb-v2-status-grid{grid-template-columns:1fr!important;}
  .sb-v2-status-grid>.sb-v2-status{grid-column:auto!important;}
  .sb-v2-bottom{grid-template-columns:1fr!important;}
  .sb-v2-bottom>.sb-v2-panel:first-child{grid-column:auto!important;}
  #scheduledActionsOverview .scheduled-overview-list{grid-template-columns:1fr!important;}
  .money-grid{grid-template-columns:1fr!important;}
}

@supports not (container-type:inline-size){
  @media (min-width:1024px) and (max-width:1280px){
    html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom>.sb-v2-panel:first-child{grid-column:1/-1!important;}
  }
}
`}

  function installStyles(){
    var style=document.getElementById('sunblissDesktopResponsiveCRMStyles');
    if(!style){
      style=document.createElement('style');
      style.id='sunblissDesktopResponsiveCRMStyles';
      style.textContent=css();
    }
    if(style.parentNode!==document.head)document.head.appendChild(style);
    else document.head.appendChild(style);
  }

  function syncDesktopClass(){
    if(!document.body)return;
    var desktop=MQ?MQ.matches:window.innerWidth>=1024;
    var enabled=desktop&&!isExecutivePreview();
    document.body.classList.toggle('sunbliss-desktop',enabled);
    if(enabled){
      var main=document.getElementById('main');
      if(main){
        var view=(window.state&&state.view)||'';
        main.setAttribute('data-desktop-view',view);
      }
    }
  }

  function finalize(){
    syncDesktopClass();
    installStyles();
  }

  function scheduleFinalize(){
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){raf=0;finalize();});
  }

  installStyles();
  syncDesktopClass();
  if(window.queueMicrotask)queueMicrotask(finalize);
  else Promise.resolve().then(finalize);

  if(MQ){
    if(MQ.addEventListener)MQ.addEventListener('change',scheduleFinalize);
    else if(MQ.addListener)MQ.addListener(scheduleFinalize);
  }
  window.addEventListener('resize',scheduleFinalize,{passive:true});
  window.addEventListener('pageshow',scheduleFinalize,{passive:true});
})();
