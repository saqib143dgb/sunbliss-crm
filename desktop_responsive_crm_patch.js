(function(){
  'use strict';
  if(window.__sunblissDesktopResponsiveCRMInstalled)return;
  window.__sunblissDesktopResponsiveCRMInstalled=true;

  var MQ='(min-width: 980px)';
  var timer=null;

  function isExecutivePreview(){
    try{
      return new URLSearchParams(location.search).get('ceo-preview')==='1' || document.body.classList.contains('ceo-mode');
    }catch(_e){ return document.body.classList.contains('ceo-mode'); }
  }

  function installStyles(){
    if(document.getElementById('sunblissDesktopResponsiveCRMStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissDesktopResponsiveCRMStyles';
    style.textContent=`
@media (min-width:980px){
  body.sunbliss-desktop:not(.ceo-mode){
    background:#0F1A26!important;
    background-image:radial-gradient(900px 430px at 8% -8%,rgba(198,151,46,.09),transparent 62%),radial-gradient(760px 420px at 96% 2%,rgba(198,151,46,.055),transparent 58%)!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) #app{
    width:100%!important;max-width:none!important;margin:0!important;contain:none!important;
  }

  /* Compact desktop header — same CRM identity and controls. */
  body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{
    width:100%!important;min-height:184px!important;padding:20px 36px 22px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::after{
    left:36px!important;right:36px!important;top:88px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::before{
    width:280px!important;height:280px!important;right:-62px!important;bottom:-150px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-top,
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-main{
    width:100%!important;max-width:1480px!important;margin-left:auto!important;margin-right:auto!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-top{min-height:56px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-main{margin-top:17px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand{max-width:none!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand-name{font-size:26px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-brand-sub{font-size:7.5px!important;letter-spacing:.24em!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-welcome{font-size:11px!important;margin-bottom:3px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-name{font-size:28px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-role{min-height:27px!important;font-size:9px!important;padding:0 10px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project-row{margin-top:9px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project{font-size:12px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-project-icon{width:28px!important;height:28px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .sb-pro-sync{height:29px!important;font-size:9px!important;}

  /* Desktop workspace. The existing fixed pill dock is intentionally untouched. */
  body.sunbliss-desktop:not(.ceo-mode) main#main{
    width:calc(100% - 56px)!important;max-width:1480px!important;margin:-8px auto 0!important;
    min-height:calc(100vh - 205px)!important;border-radius:18px!important;overflow:visible!important;
    box-shadow:0 12px 34px rgba(5,12,18,.18)!important;
  }

  /* Overview — use the available horizontal space without changing workflows. */
  body.sunbliss-desktop:not(.ceo-mode) .overview{padding:24px 30px 38px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .overview>.btn-paper#btnPrintReport{float:right!important;margin:0 0 14px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .overview>.stat-hero{clear:both!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stat-hero{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;margin:10px 0 24px!important;border-radius:14px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .stat-cell{padding:17px 18px!important;min-height:92px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stat-cell.wide{grid-column:1/-1!important;min-height:auto!important;padding:13px 18px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stat-label{font-size:9px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stat-value{font-size:20px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .pipeline{
    display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;margin:2px 0 20px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .pill-stat{min-width:0!important;padding:13px 14px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .cf-select-wrap{max-width:420px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .cf-summary{max-width:760px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;}
  body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview{margin-top:26px!important;padding:0 16px 16px!important;}
  body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview:before{margin-left:-16px!important;margin-right:-16px!important;}
  body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-head{margin-left:-16px!important;margin-right:-16px!important;padding:14px 16px 13px!important;}
  body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-list{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
  body.sunbliss-desktop:not(.ceo-mode) #scheduledActionsOverview .scheduled-overview-row{min-height:82px!important;}

  /* Units — more efficient desktop density, same controls and click logic. */
  body.sunbliss-desktop:not(.ceo-mode) .controls{padding:22px 28px 12px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .filter-toggle{max-width:320px!important;margin-bottom:12px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .filter-panel{padding:16px 18px 6px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .list{padding:4px 24px 30px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .row-btn{
    gap:16px!important;padding:13px 14px!important;margin:0 0 7px!important;border:1px solid var(--paper-line)!important;border-radius:11px!important;background:rgba(255,255,255,.13)!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .row-btn:hover{background:var(--paper-dim)!important;}
  body.sunbliss-desktop:not(.ceo-mode) .row-unit{min-width:78px!important;text-align:center!important;padding:5px 9px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .row-name{font-size:14px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .row-meta{font-size:11px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .row-amt{max-width:220px!important;min-width:150px!important;}

  /* Customer detail — widen the record and wrap installment stages into a grid. */
  body.sunbliss-desktop:not(.ceo-mode) .detail{max-width:1360px!important;margin:0 auto!important;padding:26px 30px 42px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .d-name{font-size:25px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .money-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-width:900px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{
    display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;overflow:visible!important;scroll-snap-type:none!important;padding-bottom:10px!important;
  }
  body.sunbliss-desktop:not(.ceo-mode) .stage-card{flex:none!important;width:auto!important;min-width:0!important;}
  body.sunbliss-desktop:not(.ceo-mode) .tx-list{border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important;}
  body.sunbliss-desktop:not(.ceo-mode) .tx-row{padding:12px 14px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .field-row,
  body.sunbliss-desktop:not(.ceo-mode) .field-address{max-width:980px!important;}

  /* Insights — expand charts/tables to desktop width. */
  body.sunbliss-desktop:not(.ceo-mode) .insights{padding:24px 30px 40px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .insights svg{max-width:100%!important;height:auto!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stage-scroll{overflow-x:auto!important;border-radius:10px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stage-scroll .stage-tbl{min-width:720px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .stage-tbl{font-size:11.5px!important;}

  body.sunbliss-desktop:not(.ceo-mode) .brand-editor{max-width:760px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .notice{max-width:1100px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .footnote{padding-bottom:8px!important;}
}

@media (min-width:1280px){
  body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header{padding-left:48px!important;padding-right:48px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .topbar.sunbliss-professional-header::after{left:48px!important;right:48px!important;}
  body.sunbliss-desktop:not(.ceo-mode) main#main{width:calc(100% - 80px)!important;}
  body.sunbliss-desktop:not(.ceo-mode) .overview,
  body.sunbliss-desktop:not(.ceo-mode) .insights{padding-left:36px!important;padding-right:36px!important;}
  body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important;}
}

@media (min-width:1600px){
  body.sunbliss-desktop:not(.ceo-mode) .ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important;}
}
`;
    document.head.appendChild(style);
  }

  function decorate(){
    installStyles();
    var desktop=window.matchMedia ? window.matchMedia(MQ).matches : window.innerWidth>=980;
    var enabled=desktop && !isExecutivePreview();
    document.body.classList.toggle('sunbliss-desktop',enabled);
    if(!enabled)return;

    var main=document.getElementById('main');
    if(main){
      var view=(window.state&&state.view)||'';
      main.setAttribute('data-desktop-view',view);
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(decorate,35);
  }

  installStyles();
  decorate();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  }
  setTimeout(decorate,180);
  setTimeout(decorate,600);
})();
