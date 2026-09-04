(function(){
'use strict';
if(window.__sunblissDesktopOverviewFlickerGuardInstalled)return;
window.__sunblissDesktopOverviewFlickerGuardInstalled=true;

var MQ='(min-width:1024px)';
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function onOverview(){return desktop()&&window.state&&state.view==='overview'}

function ensureWordmarkTypography(){
  if(document.getElementById('sunblissPurvanchalTypographyRefine'))return;
  var style=document.createElement('style');
  style.id='sunblissPurvanchalTypographyRefine';
  style.textContent='@media(min-width:1024px){body.sunbliss-ref-desktop .sb-rh-brand-name{font-family:Fraunces,Georgia,"Times New Roman",serif!important;font-weight:700!important;font-size:34px!important;line-height:.98!important;letter-spacing:.05em!important;font-optical-sizing:auto;transform:scaleX(1.10)!important;transform-origin:left center!important;text-rendering:geometricPrecision}}';
  document.head.appendChild(style);
}

function ensureKpiCleanupStyles(){
  if(document.getElementById('sunblissDesktopKpiCleanupStyle'))return;
  var style=document.createElement('style');
  style.id='sunblissDesktopKpiCleanupStyle';
  /* Keep the mobile-style KPI supporting line (including collected/outstanding %),
     while removing historical trend noise from the executive first glance. */
  style.textContent='@media(min-width:1024px){body.sunbliss-ref-desktop .sb-v2-kpi .sb-v2-trend{display:none!important}body.sunbliss-ref-desktop .sb-v2-kpi-sub{display:block!important}}';
  document.head.appendChild(style);
}

function ensureDesktopMobileDesignStyles(){
  if(document.getElementById('sunblissDesktopMobileDesignSystemStyle'))return;
  var style=document.createElement('style');
  style.id='sunblissDesktopMobileDesignSystemStyle';
  style.textContent=`
@media(min-width:1024px){
  /* Desktop keeps the exact mobile palette and surface system. */
  body.sunbliss-ref-desktop{background:var(--ink-2)!important;color:var(--ink)!important}
  body.sunbliss-ref-desktop #app{background:var(--paper)!important}
  body.sunbliss-ref-desktop main#main{background:var(--paper)!important;color:var(--ink)!important;box-shadow:none!important}
  body.sunbliss-ref-desktop .overview{background:var(--paper)!important;padding:22px 28px 34px!important}
  body.sunbliss-ref-desktop #sbRefOverviewV2{max-width:1480px!important;margin:0 auto!important;padding:0!important}

  /* Sidebar: retain the existing desktop structure, but use the mobile CRM treatment. */
  body.sunbliss-ref-desktop #sbRefSidebar{background:linear-gradient(180deg,var(--ink-2),#0b1a29)!important;border-right:1px solid rgba(198,151,46,.30)!important}
  body.sunbliss-ref-desktop .sb-ref-brand{border-bottom:1px solid rgba(237,230,214,.12)!important}
  body.sunbliss-ref-desktop .sb-ref-nav button{color:var(--cream-text)!important}
  body.sunbliss-ref-desktop .sb-ref-nav button:hover{background:rgba(237,230,214,.045)!important}
  body.sunbliss-ref-desktop .sb-ref-nav button.active{background:rgba(237,230,214,.10)!important;color:var(--gold)!important}
  body.sunbliss-ref-desktop .sb-ref-nav button.active:before{width:4px!important;background:var(--gold)!important}
  body.sunbliss-ref-desktop .sb-ref-nav .sb-ref-add{border-radius:999px!important;border-color:var(--gold)!important;color:var(--gold)!important}

  /* Header stays in the mobile navy/gold family; only desktop geometry is preserved. */
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{background:linear-gradient(110deg,#0b2035 0%,var(--ink-2) 56%,#0c2134 100%)!important;border-bottom:1px solid rgba(198,151,46,.22)!important}
  body.sunbliss-ref-desktop .sb-pro-signout{border-radius:999px!important;border:1px solid rgba(237,230,214,.24)!important;background:rgba(237,230,214,.06)!important}
  body.sunbliss-ref-desktop .sb-v2-sync{border:1px solid rgba(198,151,46,.48)!important;border-radius:999px!important;color:var(--cream-text)!important;background:rgba(15,26,38,.18)!important}

  /* Executive KPI row: mobile typography + desktop proportions. */
  body.sunbliss-ref-desktop .sb-v2-kpis{gap:12px!important}
  body.sunbliss-ref-desktop .sb-v2-card{background:var(--paper)!important;border:1px solid var(--paper-line)!important;border-radius:var(--radius)!important;box-shadow:var(--shadow)!important}
  body.sunbliss-ref-desktop .sb-v2-kpi{height:104px!important;grid-template-columns:50px minmax(0,1fr)!important;gap:13px!important;padding:15px 17px!important;background:var(--paper)!important}
  body.sunbliss-ref-desktop .sb-v2-kpi:hover{background:var(--paper-dim)!important}
  body.sunbliss-ref-desktop .sb-v2-kpi-icon{width:44px!important;height:44px!important;border-radius:12px!important}
  body.sunbliss-ref-desktop .sb-v2-kpi-icon svg{width:23px!important;height:23px!important}
  body.sunbliss-ref-desktop .sb-v2-kpi-label{font-family:IBM Plex Mono,monospace!important;font-size:9.5px!important;font-weight:600!important;letter-spacing:.07em!important;color:var(--muted)!important;margin-bottom:6px!important}
  body.sunbliss-ref-desktop .sb-v2-kpi-value{font-family:Fraunces,Georgia,serif!important;font-size:22px!important;font-weight:600!important;letter-spacing:-.01em!important;color:var(--ink)!important}
  body.sunbliss-ref-desktop .sb-v2-kpi-sub{font:500 10.5px/1.3 Inter,sans-serif!important;color:var(--muted)!important;margin-top:4px!important}

  /* Collection overview mirrors the mobile progress treatment. */
  body.sunbliss-ref-desktop .sb-v2-collection{height:auto!important;min-height:106px!important;margin-top:14px!important;padding:14px 18px 15px!important}
  body.sunbliss-ref-desktop .sb-v2-head{height:29px!important;margin-bottom:10px!important;border-bottom:1px solid var(--paper-line)!important}
  body.sunbliss-ref-desktop .sb-v2-title{font:600 11.5px/1 Inter,sans-serif!important;color:var(--ink)!important}
  body.sunbliss-ref-desktop .sb-v2-title svg{width:18px!important;height:18px!important}
  body.sunbliss-ref-desktop .sb-v2-view{color:var(--gold-deep)!important;font:600 9.5px/1 IBM Plex Mono,monospace!important}
  body.sunbliss-ref-desktop .sb-v2-select{height:30px!important;background:var(--paper-dim)!important;border:1px solid var(--paper-line)!important;border-radius:9px!important;color:var(--ink)!important}
  body.sunbliss-ref-desktop .sb-v2-bar{height:8px!important;background:rgba(174,59,43,.15)!important}
  body.sunbliss-ref-desktop .sb-v2-bar i{background:var(--sage)!important}
  body.sunbliss-ref-desktop .sb-v2-bar-cap{margin-top:8px!important;font-size:11px!important}
  body.sunbliss-ref-desktop .sb-v2-bar-cap b{font-family:Fraunces,Georgia,serif!important;font-size:13.5px!important;font-weight:600!important}

  /* Status cards: same paper surfaces and restrained hierarchy as mobile. */
  body.sunbliss-ref-desktop .sb-v2-status-grid{gap:12px!important;margin-top:14px!important}
  body.sunbliss-ref-desktop .sb-v2-status{height:118px!important;padding:13px 16px!important}
  body.sunbliss-ref-desktop .sb-v2-status-body{height:62px!important}
  body.sunbliss-ref-desktop .sb-v2-status-cell{padding:3px 12px!important;border-left:1px solid var(--paper-line)!important}
  body.sunbliss-ref-desktop .sb-v2-status-cell strong{font-family:Fraunces,Georgia,serif!important;font-size:18px!important;font-weight:600!important}
  body.sunbliss-ref-desktop .sb-v2-status-cell span{font-size:10px!important;color:var(--muted)!important;margin-top:5px!important}

  /* Lower management panels stay equal and compact; content gets visual priority over borders. */
  body.sunbliss-ref-desktop .sb-v2-bottom{grid-template-columns:1.28fr 1fr 1fr!important;gap:12px!important;margin-top:14px!important;align-items:stretch!important}
  body.sunbliss-ref-desktop .sb-v2-panel{height:auto!important;min-height:205px!important;padding:13px 16px!important;overflow:hidden!important}
  body.sunbliss-ref-desktop .sb-v2-row,body.sunbliss-ref-desktop .sb-v2-action-row{min-height:39px!important;border-bottom:1px solid var(--paper-line)!important;font-size:10.5px!important}
  body.sunbliss-ref-desktop .sb-v2-mini{border-radius:8px!important}
  body.sunbliss-ref-desktop .sb-v2-empty{padding:21px 4px!important;color:var(--muted)!important}

  /* Units & Customers: mobile cards, expanded for desktop scanning. */
  body.sunbliss-ref-desktop .controls{max-width:1480px!important;margin:0 auto!important;padding:24px 30px 12px!important}
  body.sunbliss-ref-desktop .search{max-width:620px!important;background:var(--paper-dim)!important;border:1px solid var(--paper-line)!important;border-radius:12px!important}
  body.sunbliss-ref-desktop .filter-toggle{max-width:360px!important;background:var(--paper-dim)!important;border-color:var(--paper-line)!important}
  body.sunbliss-ref-desktop .filter-panel{background:var(--paper-dim)!important;border-color:var(--paper-line)!important}
  body.sunbliss-ref-desktop .list{max-width:1480px!important;margin:0 auto!important;padding:4px 30px 34px!important}
  body.sunbliss-ref-desktop .list>.row-btn{gap:16px!important;margin:0 0 8px!important;padding:12px 14px!important;background:var(--paper)!important;border:1px solid var(--paper-line)!important;border-radius:12px!important;box-shadow:0 1px 2px rgba(15,26,38,.035)!important}
  body.sunbliss-ref-desktop .list>.row-btn:hover{background:var(--paper-dim)!important}
  body.sunbliss-ref-desktop .row-unit{min-width:78px!important;text-align:center!important}
  body.sunbliss-ref-desktop .row-name{font-family:Fraunces,Georgia,serif!important;font-size:15px!important;font-weight:500!important}
  body.sunbliss-ref-desktop .row-amt{min-width:150px!important;max-width:220px!important}

  /* Customer detail: same mobile record system, using desktop width rather than stretching text. */
  body.sunbliss-ref-desktop .detail{max-width:1360px!important;margin:0 auto!important;padding:25px 30px 42px!important}
  body.sunbliss-ref-desktop .d-name{font-family:Fraunces,Georgia,serif!important;font-size:25px!important}
  body.sunbliss-ref-desktop .money-grid{max-width:900px!important;border-radius:14px!important;background:var(--paper-line)!important;border-color:var(--paper-line)!important}
  body.sunbliss-ref-desktop .money-cell{background:var(--paper)!important;padding:14px 13px!important}
  body.sunbliss-ref-desktop .ledger-scroll{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;overflow:visible!important;scroll-snap-type:none!important;padding-bottom:10px!important}
  body.sunbliss-ref-desktop .stage-card{width:auto!important;min-width:0!important;background:var(--paper)!important;border-color:var(--paper-line)!important;border-radius:12px!important;box-shadow:0 1px 2px rgba(15,26,38,.035)!important}
  body.sunbliss-ref-desktop .field-row,body.sunbliss-ref-desktop .field-address{max-width:980px!important}
  body.sunbliss-ref-desktop .tx-list{max-width:1100px!important;background:var(--paper)!important;border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important}
  body.sunbliss-ref-desktop .tx-row{padding:12px 14px!important}
  body.sunbliss-ref-desktop .notice{max-width:1100px!important}
  body.sunbliss-ref-desktop .btn-paper{background:var(--paper-dim)!important;border-color:var(--paper-line)!important;color:var(--ink)!important}
  body.sunbliss-ref-desktop .btn-paper:hover{background:var(--paper)!important;border-color:var(--gold-deep)!important}

  /* Insights and tables retain mobile typography while using the horizontal canvas. */
  body.sunbliss-ref-desktop .stage-scroll{border:1px solid var(--paper-line)!important;border-radius:12px!important;background:var(--paper)!important;padding:4px 14px!important;overflow-x:auto!important}
  body.sunbliss-ref-desktop .stage-scroll .stage-tbl{min-width:760px!important}
  body.sunbliss-ref-desktop .mix-row{padding:11px 4px!important}
  body.sunbliss-ref-desktop .section-label{font-family:IBM Plex Mono,monospace!important;letter-spacing:.10em!important;color:var(--muted)!important}

  @media(min-width:1400px){
    body.sunbliss-ref-desktop .overview{padding-left:34px!important;padding-right:34px!important}
    body.sunbliss-ref-desktop .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important}
  }
}
`;
  document.head.appendChild(style);
}

var DESKTOP_LOGO_ASSET='assets/purvanchal-p-thin-ring.png';

function lockSidebarLogoGeometry(img){
  img.style.setProperty('width','61px','important');
  img.style.setProperty('height','61px','important');
  img.style.setProperty('min-width','61px','important');
  img.style.setProperty('min-height','61px','important');
  img.style.setProperty('max-width','61px','important');
  img.style.setProperty('max-height','61px','important');
  img.style.setProperty('aspect-ratio','1 / 1','important');
  img.style.setProperty('object-fit','contain','important');
  img.style.setProperty('object-position','center','important');
  img.style.setProperty('display','block','important');
  img.style.setProperty('flex','0 0 61px','important');
  img.style.setProperty('margin','0 auto 1px','important');
  img.style.setProperty('transform','none','important');
}

function ensureRealSidebarLogo(){
  if(!desktop())return;
  var brand=document.querySelector('#sbRefSidebar .sb-ref-brand');
  if(!brand)return;
  var current=brand.querySelector('.sb-stable-brand-logo');
  if(current&&current.tagName&&current.tagName.toLowerCase()==='img'&&current.getAttribute('src')===DESKTOP_LOGO_ASSET){
    lockSidebarLogoGeometry(current);
    return;
  }
  var img=document.createElement('img');
  img.className='sb-stable-brand-logo';
  img.src=DESKTOP_LOGO_ASSET;
  img.alt='Purvanchal logo';
  img.decoding='async';
  lockSidebarLogoGeometry(img);
  if(current)current.replaceWith(img);else brand.insertBefore(img,brand.firstChild);
}

/*
  The exact desktop dashboard is rendered by a compatibility layer after the base CRM
  renderer. During a normal data refresh, the base renderer can replace .overview first
  and the exact dashboard follows on the next task. Keeping the already-rendered exact
  dashboard detached and restoring it synchronously across that base render removes the
  tiny blank frame without blocking any real data refresh. The exact renderer then swaps
  in the fresh dashboard normally.
*/
function wrap(name){
  var fn=window[name];
  if(typeof fn!=='function'||fn.__sbFlickerGuard)return;
  function guarded(){
    if(!onOverview()){
      var plain=fn.apply(this,arguments);
      requestAnimationFrame(ensureRealSidebarLogo);
      return plain;
    }
    var keep=document.getElementById('sbRefOverviewV2');
    if(keep&&keep.parentNode)keep.parentNode.removeChild(keep);
    var result;
    try{result=fn.apply(this,arguments)}finally{
      if(keep&&!keep.isConnected&&window.state&&state.view==='overview'){
        var host=document.querySelector('.overview');
        if(host&&!document.getElementById('sbRefOverviewV2'))host.insertBefore(keep,host.firstChild);
      }
      requestAnimationFrame(ensureRealSidebarLogo);
    }
    return result;
  }
  guarded.__sbFlickerGuard=true;
  guarded.__sbFlickerGuardOriginal=fn;
  window[name]=guarded;
}

function install(){
  ensureWordmarkTypography();
  ensureKpiCleanupStyles();
  ensureDesktopMobileDesignStyles();
  ensureRealSidebarLogo();
  wrap('renderOverview');
  wrap('renderMain');
  wrap('render');
  /* Some late CRM patches replace render functions during startup. Re-wrap only the
     function references themselves; there is no DOM observer and no recurring timer. */
  setTimeout(function(){ensureWordmarkTypography();ensureKpiCleanupStyles();ensureDesktopMobileDesignStyles();ensureRealSidebarLogo();wrap('renderOverview');wrap('renderMain');wrap('render')},120);
  setTimeout(function(){ensureWordmarkTypography();ensureKpiCleanupStyles();ensureDesktopMobileDesignStyles();ensureRealSidebarLogo();wrap('renderOverview');wrap('renderMain');wrap('render')},500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
