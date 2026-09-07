(function(){
  'use strict';
  if(window.__sunblissDesktopResponsiveCRMInstalled)return;
  window.__sunblissDesktopResponsiveCRMInstalled=true;

  var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;

  function isExecutivePreview(){
    try{
      return new URLSearchParams(location.search).get('ceo-preview')==='1' || (document.body&&document.body.classList.contains('ceo-mode'));
    }catch(_e){
      return !!(document.body&&document.body.classList.contains('ceo-mode'));
    }
  }

  function installStyles(){
    var old=document.getElementById('sunblissDesktopResponsiveCRMStyles');
    if(old)old.remove();
    var style=document.createElement('style');
    style.id='sunblissDesktopResponsiveCRMStyles';
    style.textContent=`
/*
  Desktop responsiveness is driven by available CSS viewport width. Browser zoom
  therefore moves the workspace between compact / standard / wide desktop ranges
  instead of allowing fixed-width cards to collide or drift out of alignment.
*/
@media (min-width:1024px){
  html body.sunbliss-desktop:not(.ceo-mode){
    background:#0F1A26!important;
    background-image:radial-gradient(900px 430px at 8% -8%,rgba(198,151,46,.09),transparent 62%),radial-gradient(760px 420px at 96% 2%,rgba(198,151,46,.055),transparent 58%)!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) #app,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app{
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    min-width:0!important;
    contain:none!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) main#main,
  html body.sunbliss-ref-desktop:not(.ceo-mode) main#main{
    min-width:0!important;
    box-sizing:border-box!important;
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
  html body.sunbliss-ref-desktop:not(.ceo-mode) .list{
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .stat-hero,
  html body.sunbliss-desktop:not(.ceo-mode) .pipeline,
  html body.sunbliss-desktop:not(.ceo-mode) .money-grid,
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpis,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-grid,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom{
    min-width:0!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .stat-cell,
  html body.sunbliss-desktop:not(.ceo-mode) .pill-stat,
  html body.sunbliss-desktop:not(.ceo-mode) .stage-card,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-panel,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-cell,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-row{
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{
    width:100%!important;
    min-height:184px!important;
    padding:20px 36px 22px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::after{
    left:36px!important;
    right:36px!important;
    top:88px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::before{
    width:280px!important;
    height:280px!important;
    right:-62px!important;
    bottom:-150px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-top,
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-main{
    width:100%!important;
    max-width:1480px!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-top{min-height:56px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-main{margin-top:17px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand{max-width:none!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand-name{font-size:26px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand-sub{font-size:7.5px!important;letter-spacing:.24em!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-welcome{font-size:11px!important;margin-bottom:3px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-name{font-size:28px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-role{min-height:27px!important;font-size:9px!important;padding:0 10px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project-row{margin-top:9px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project{font-size:12px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project-icon{width:28px!important;height:28px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .sb-pro-sync{height:29px!important;font-size:9px!important;}

  html body.sunbliss-desktop:not(.ceo-mode) main#main{
    width:calc(100% - 56px)!important;
    max-width:1480px!important;
    margin:-8px auto 0!important;
    min-height:calc(100vh - 205px)!important;
    border-radius:18px!important;
    overflow:visible!important;
    box-shadow:0 12px 34px rgba(5,12,18,.18)!important;
  }

  html body.sunbliss-desktop:not(.ceo-mode) .overview{padding:24px 30px 38px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .overview>.btn-paper#btnPrintReport{float:right!important;margin:0 0 14px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .overview>.stat-hero{clear:both!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stat-hero{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    margin:10px 0 24px!important;
    border-radius:14px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stat-cell{padding:17px 18px!important;min-height:92px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stat-cell.wide{grid-column:1/-1!important;min-height:auto!important;padding:13px 18px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stat-label{font-size:9px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stat-value{font-size:20px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .pipeline{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:9px!important;
    margin:2px 0 20px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .pill-stat{min-width:0!important;padding:13px 14px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .cf-select-wrap{max-width:420px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .cf-summary{max-width:760px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview{margin-top:26px!important;padding:0 16px 16px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview:before{margin-left:-16px!important;margin-right:-16px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-head{margin-left:-16px!important;margin-right:-16px!important;padding:14px 16px 13px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-list{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-row{min-height:82px!important;}

  html body.sunbliss-desktop:not(.ceo-mode) .controls{padding:22px 28px 12px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .filter-toggle{max-width:320px!important;margin-bottom:12px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .filter-panel{padding:16px 18px 6px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .list{padding:4px 24px 30px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-btn{
    gap:16px!important;
    padding:13px 14px!important;
    margin:0 0 7px!important;
    border:1px solid var(--paper-line)!important;
    border-radius:11px!important;
    background:rgba(255,255,255,.13)!important;
    min-width:0!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .row-btn:hover{background:var(--paper-dim)!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-unit{min-width:78px!important;text-align:center!important;padding:5px 9px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-name{font-size:14px!important;min-width:0!important;overflow-wrap:anywhere!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-meta{font-size:11px!important;min-width:0!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-amt{max-width:220px!important;min-width:150px!important;}

  html body.sunbliss-desktop:not(.ceo-mode) .detail{max-width:1360px!important;margin:0 auto!important;padding:26px 30px 42px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .d-name{font-size:25px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .money-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-width:900px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:10px!important;
    overflow:visible!important;
    scroll-snap-type:none!important;
    padding-bottom:10px!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .stage-card{flex:none!important;width:auto!important;min-width:0!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .tx-list{border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .tx-row{padding:12px 14px!important;min-width:0!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .field-row,
  html body.sunbliss-desktop:not(.ceo-mode) .field-address{max-width:980px!important;min-width:0!important;}

  html body.sunbliss-desktop:not(.ceo-mode) .insights{padding:24px 30px 40px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .insights svg{max-width:100%!important;height:auto!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stage-scroll{overflow-x:auto!important;border-radius:10px!important;max-width:100%!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stage-scroll .stage-tbl{min-width:720px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stage-tbl{font-size:11.5px!important;}

  html body.sunbliss-desktop:not(.ceo-mode) .brand-editor{max-width:760px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .notice{max-width:1100px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .footnote{padding-bottom:8px!important;}
}

/* Compact desktop: browser zoom-in naturally lands here. */
@media (min-width:1024px) and (max-width:1199px){
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app{padding-left:196px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefSidebar{width:196px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-ref-brand{padding-left:12px!important;padding-right:12px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-ref-brand strong{font-size:22px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-ref-nav button{padding-left:20px!important;padding-right:16px!important;gap:11px!important;font-size:12px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-ref-nav .sb-ref-add{margin-left:12px!important;margin-right:12px!important;width:calc(100% - 24px)!important;padding:0 13px!important;}

  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{padding-left:24px!important;padding-right:20px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header:after{left:24px!important;right:70%!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-pro-brand-name{font-size:24px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-pro-name{font-size:26px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-pro-project{font-size:11px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-tagline{font-size:15px!important;width:92px!important;right:12px!important;top:98px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-dubai-skyline{width:40%!important;right:22px!important;}

  html body.sunbliss-ref-desktop:not(.ceo-mode) .overview{padding-left:18px!important;padding-right:18px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefOverviewV2{padding-top:14px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi{
    height:auto!important;
    min-height:102px!important;
    grid-template-columns:46px minmax(0,1fr) auto!important;
    gap:9px!important;
    padding:12px 13px!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-icon{width:42px!important;height:42px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-icon svg{width:23px!important;height:23px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-value{font-size:20px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-sub{font-size:9.5px!important;white-space:normal!important;overflow-wrap:anywhere!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-trend{font-size:9.5px!important;}

  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-collection{height:auto!important;min-height:108px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status{height:auto!important;min-height:118px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-grid>.sb-v2-status:last-child:nth-child(odd){grid-column:1/-1!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-cell{padding-left:9px!important;padding-right:9px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-cell strong{font-size:16px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status-cell span{font-size:9px!important;white-space:normal!important;}

  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-bottom>.sb-v2-panel:first-child{grid-column:1/-1!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-panel{height:auto!important;min-height:218px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-row{grid-template-columns:28px minmax(0,1fr) auto!important;}

  html body.sunbliss-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-desktop:not(.ceo-mode) .insights{padding-left:20px!important;padding-right:20px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .stat-hero{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .insights .pipeline{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .insights .pipeline:has(> .pill-stat:nth-child(4)){grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  html body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-list{grid-template-columns:1fr!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-btn{gap:10px!important;padding-left:10px!important;padding-right:10px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-unit{min-width:64px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .row-amt{min-width:118px!important;max-width:170px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .detail{padding-left:22px!important;padding-right:22px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .field-row,
  html body.sunbliss-desktop:not(.ceo-mode) .field-address{max-width:100%!important;}
}

/* Standard desktop: preserve the four-card dashboard, but compact card internals. */
@media (min-width:1200px) and (max-width:1439px){
  html body.sunbliss-ref-desktop:not(.ceo-mode) .overview{padding-left:22px!important;padding-right:22px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpis{gap:10px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi{
    height:auto!important;
    min-height:106px!important;
    grid-template-columns:48px minmax(0,1fr) auto!important;
    gap:10px!important;
    padding:12px 13px!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-icon{width:44px!important;height:44px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-icon svg{width:24px!important;height:24px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-value{font-size:20px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-kpi-sub{font-size:9.5px!important;white-space:normal!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-trend{font-size:9.5px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-status{height:auto!important;min-height:121px!important;}
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-v2-panel{height:auto!important;min-height:225px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(4,minmax(0,1fr))!important;}
}

/* Wide desktop: current reference composition stays visually unchanged. */
@media (min-width:1440px) and (max-width:1799px){
  html body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{padding-left:48px!important;padding-right:48px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::after{left:48px!important;right:48px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) main#main{width:calc(100% - 80px)!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .overview,
  html body.sunbliss-desktop:not(.ceo-mode) .insights{padding-left:36px!important;padding-right:36px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important;}
}

/* Extra-wide / zoomed-out desktop: stop the dashboard from stretching indefinitely. */
@media (min-width:1800px){
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-pro-top,
  html body.sunbliss-ref-desktop:not(.ceo-mode) .sb-pro-main,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #sbRefOverviewV2,
  html body.sunbliss-desktop:not(.ceo-mode) .insights,
  html body.sunbliss-desktop:not(.ceo-mode) .controls,
  html body.sunbliss-desktop:not(.ceo-mode) .list{
    max-width:1600px!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }
  html body.sunbliss-desktop:not(.ceo-mode) .detail{max-width:1360px!important;}
  html body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important;}
}
`;
    document.head.appendChild(style);
  }

  function syncDesktopClass(){
    if(!document.body)return;
    var desktop=MQ?MQ.matches:window.innerWidth>=1024;
    var enabled=desktop&&!isExecutivePreview();
    document.body.classList.toggle('sunbliss-desktop',enabled);
    if(!enabled)return;
    var main=document.getElementById('main');
    if(main){
      var view=(window.state&&state.view)||'';
      main.setAttribute('data-desktop-view',view);
    }
  }

  installStyles();
  syncDesktopClass();

  if(MQ){
    if(MQ.addEventListener)MQ.addEventListener('change',syncDesktopClass);
    else if(MQ.addListener)MQ.addListener(syncDesktopClass);
  }
  window.addEventListener('pageshow',syncDesktopClass,{passive:true});
})();
