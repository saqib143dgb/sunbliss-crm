(function(){
'use strict';
if(window.__sunblissDesktopExecutiveShellPreviewInstalled)return;
window.__sunblissDesktopExecutiveShellPreviewInstalled=true;

var MQ='(min-width:1024px)';
var timer=null,observer=null;

function isDesktop(){
  return window.matchMedia ? window.matchMedia(MQ).matches : window.innerWidth>=1024;
}

function svg(name){
  var icons={
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    units:'<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-5h6v5M8 10h1M12 10h1M16 10h1"/>',
    insights:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/>',
    tasks:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    add:'<path d="M12 5v14M5 12h14"/>',
    refresh:'<path d="M20 11a8 8 0 10-2.34 5.66"/><path d="M20 4v7h-7"/>',
    person:'<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-4 3-6 7-6s6.2 2 7 6"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(icons[name]||icons.overview)+'</svg>';
}

function installStyles(){
  if(document.getElementById('sunblissDesktopExecutiveShellPreviewStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissDesktopExecutiveShellPreviewStyles';
  style.textContent=`
#sunblissDesktopRail,#sunblissDesktopSidebar,#sunblissDesktopUtility{display:none}
@media(min-width:1024px){
  /* Reference-style desktop shell using only the CRM's existing colour variables. */
  body.sunbliss-desktop-exec-preview{
    overflow-x:hidden!important;
  }
  body.sunbliss-desktop-exec-preview #app{
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding:94px 24px 34px 326px!important;
    contain:none!important;
  }
  body.sunbliss-desktop-exec-preview .topbar{
    display:none!important;
  }
  body.sunbliss-desktop-exec-preview .tabs{
    display:none!important;
  }

  /* Narrow icon rail: the first vertical strip from the reference. */
  #sunblissDesktopRail{
    display:flex;
    position:fixed;
    left:18px;
    top:18px;
    bottom:18px;
    width:68px;
    z-index:1700;
    flex-direction:column;
    align-items:center;
    padding:16px 10px;
    border:1px solid rgba(237,230,214,.14);
    border-radius:18px;
    background:var(--ink-2);
    box-shadow:0 16px 42px rgba(15,26,38,.22);
  }
  .sb-rail-mark{
    width:38px;
    height:38px;
    border-radius:11px;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:21px;
    border:1px solid rgba(198,151,46,.34);
    color:var(--gold);
    font:600 16px/1 Fraunces,serif;
  }
  .sb-rail-nav{
    width:100%;
    display:flex;
    flex-direction:column;
    gap:9px;
    align-items:center;
  }
  .sb-rail-nav button{
    position:relative;
    width:42px;
    height:42px;
    display:flex;
    align-items:center;
    justify-content:center;
    border:1px solid transparent;
    border-radius:11px;
    background:transparent;
    color:var(--cream-text-dim);
    cursor:pointer;
  }
  .sb-rail-nav button svg{
    width:18px;
    height:18px;
    fill:none;
    stroke:currentColor;
    stroke-width:1.8;
    stroke-linecap:round;
    stroke-linejoin:round;
  }
  .sb-rail-nav button:hover{
    border-color:rgba(237,230,214,.14);
  }
  .sb-rail-nav button.active{
    color:var(--gold);
    border-color:rgba(198,151,46,.34);
  }
  .sb-rail-nav button.active:after{
    content:"";
    position:absolute;
    right:-14px;
    width:3px;
    height:25px;
    border-radius:3px;
    background:var(--gold);
  }
  .sb-rail-spacer{flex:1}
  .sb-rail-user{
    width:40px;
    height:40px;
    display:flex;
    align-items:center;
    justify-content:center;
    border:1px solid rgba(237,230,214,.14);
    border-radius:50%;
    color:var(--cream-text-dim);
  }
  .sb-rail-user svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

  /* Second navigation panel: the labelled menu column from the reference. */
  #sunblissDesktopSidebar{
    display:flex;
    position:fixed;
    left:100px;
    top:18px;
    bottom:18px;
    width:204px;
    z-index:1650;
    flex-direction:column;
    padding:16px 14px;
    border:1px solid rgba(237,230,214,.14);
    border-radius:18px;
    background:var(--ink-2);
    box-shadow:0 16px 42px rgba(15,26,38,.16);
  }
  .sb-desk-window{
    display:flex;
    gap:6px;
    padding:3px 8px 18px;
    margin-bottom:10px;
    border-bottom:1px solid rgba(237,230,214,.14);
  }
  .sb-desk-window i{
    width:7px;
    height:7px;
    border-radius:50%;
    background:var(--cream-text-dim);
    opacity:.55;
  }
  .sb-desk-window i:first-child{background:var(--gold);opacity:1}
  .sb-desk-brand{
    padding:2px 8px 14px;
  }
  .sb-desk-brand strong{
    display:block;
    font-family:Fraunces,serif;
    font-size:18px;
    font-weight:600;
    letter-spacing:.01em;
    color:var(--cream-text);
  }
  .sb-desk-brand span{
    display:block;
    margin-top:4px;
    font-family:IBM Plex Mono,monospace;
    font-size:7.5px;
    letter-spacing:.13em;
    text-transform:uppercase;
    color:var(--gold);
  }
  .sb-desk-nav{
    display:flex;
    flex-direction:column;
    gap:6px;
  }
  .sb-desk-nav button{
    width:100%;
    min-height:42px;
    display:flex;
    align-items:center;
    gap:10px;
    padding:0 11px;
    border:1px solid transparent;
    border-radius:9px;
    background:transparent;
    color:var(--cream-text-dim);
    font:500 11.5px/1 Inter,system-ui,sans-serif;
    text-align:left;
    cursor:pointer;
  }
  .sb-desk-nav button svg{
    width:17px;
    height:17px;
    flex:none;
    fill:none;
    stroke:currentColor;
    stroke-width:1.8;
    stroke-linecap:round;
    stroke-linejoin:round;
  }
  .sb-desk-nav button:hover{
    border-color:rgba(237,230,214,.14);
  }
  .sb-desk-nav button.active{
    background:var(--paper-dim);
    color:var(--ink);
    border-color:var(--paper-line);
    font-weight:650;
  }
  .sb-desk-nav button.active svg{color:var(--gold)}
  .sb-desk-nav .sb-desk-add{
    margin-top:6px;
    color:var(--gold);
    border-color:rgba(198,151,46,.34);
  }
  .sb-desk-spacer{flex:1}
  .sb-desk-foot{
    padding:14px 8px 3px;
    border-top:1px solid rgba(237,230,214,.14);
    font-size:9px;
    line-height:1.55;
    color:var(--cream-text-dim);
  }

  /* Top desktop utility strip: search bar plus compact actions. */
  #sunblissDesktopUtility{
    display:flex;
    position:fixed;
    left:326px;
    right:24px;
    top:18px;
    height:60px;
    z-index:1600;
    align-items:center;
    gap:12px;
    padding:8px 10px 8px 12px;
    border:1px solid rgba(237,230,214,.14);
    border-radius:15px;
    background:var(--ink-2);
    box-shadow:0 12px 34px rgba(15,26,38,.15);
  }
  .sb-util-search{
    flex:1;
    min-width:260px;
    max-width:650px;
    height:42px;
    display:flex;
    align-items:center;
    gap:10px;
    padding:0 14px;
    border:1px solid rgba(237,230,214,.14);
    border-radius:10px;
    background:transparent;
    color:var(--cream-text-dim);
    font:500 11.5px/1 Inter,system-ui,sans-serif;
    text-align:left;
    cursor:pointer;
  }
  .sb-util-search svg,
  .sb-util-action svg{
    width:17px;
    height:17px;
    fill:none;
    stroke:currentColor;
    stroke-width:1.8;
    stroke-linecap:round;
    stroke-linejoin:round;
  }
  .sb-util-meta{
    margin-left:auto;
    display:flex;
    align-items:center;
    gap:10px;
  }
  .sb-util-project{
    text-align:right;
    line-height:1.25;
  }
  .sb-util-project strong{
    display:block;
    color:var(--cream-text);
    font-size:11px;
    font-weight:600;
  }
  .sb-util-project span{
    display:block;
    color:var(--cream-text-dim);
    font-size:8.5px;
    margin-top:2px;
  }
  .sb-util-action{
    width:38px;
    height:38px;
    display:flex;
    align-items:center;
    justify-content:center;
    border:1px solid rgba(237,230,214,.14);
    border-radius:10px;
    background:transparent;
    color:var(--cream-text-dim);
    cursor:pointer;
  }
  .sb-util-action:hover{color:var(--gold);border-color:rgba(198,151,46,.34)}
  .sb-util-action.sb-util-add{color:var(--gold);border-color:rgba(198,151,46,.34)}

  /* Main dashboard canvas: compact and boxed like the reference, without changing colors. */
  body.sunbliss-desktop-exec-preview main#main{
    width:100%!important;
    max-width:1460px!important;
    min-height:calc(100vh - 128px)!important;
    margin:0 auto!important;
    border:1px solid var(--paper-line)!important;
    border-radius:18px!important;
    overflow:hidden!important;
    box-shadow:0 18px 44px rgba(15,26,38,.16)!important;
  }
  body.sunbliss-desktop-exec-preview .overview,
  body.sunbliss-desktop-exec-preview .insights{
    padding:22px 24px 32px!important;
  }
  body.sunbliss-desktop-exec-preview .detail{
    max-width:none!important;
    padding:24px 28px 38px!important;
  }

  /* Dense KPI row matching the reference's first dashboard band. */
  body.sunbliss-desktop-exec-preview .stat-hero{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:12px!important;
    background:transparent!important;
    border:0!important;
    overflow:visible!important;
    margin:10px 0 20px!important;
  }
  body.sunbliss-desktop-exec-preview .stat-hero>.stat-cell{
    min-height:100px!important;
    padding:15px 16px!important;
    border:1px solid var(--paper-line)!important;
    border-radius:12px!important;
    box-shadow:0 5px 16px rgba(15,26,38,.045)!important;
  }
  body.sunbliss-desktop-exec-preview .stat-hero>.stat-cell.wide{
    grid-column:1/-1!important;
    min-height:auto!important;
    padding:11px 16px!important;
    border-radius:10px!important;
  }
  body.sunbliss-desktop-exec-preview .stat-value{font-size:20px!important}
  body.sunbliss-desktop-exec-preview .stat-label{font-size:8.8px!important}

  /* Status cards become compact dashboard modules rather than mobile pills. */
  body.sunbliss-desktop-exec-preview .pipeline{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:10px!important;
    margin:2px 0 18px!important;
  }
  body.sunbliss-desktop-exec-preview .pill-stat{
    min-width:0!important;
    min-height:72px!important;
    padding:12px 13px!important;
    border-radius:11px!important;
    box-shadow:0 4px 14px rgba(15,26,38,.035)!important;
  }
  body.sunbliss-desktop-exec-preview .section-label{
    margin-top:20px!important;
    font-size:9.5px!important;
  }

  /* Scheduled actions become a broad operational panel, like the large table card in the reference. */
  body.sunbliss-desktop-exec-preview #scheduledActionsOverview{
    margin-top:22px!important;
    border-radius:13px!important;
    box-shadow:0 6px 18px rgba(15,26,38,.045)!important;
  }
  body.sunbliss-desktop-exec-preview #scheduledActionsOverview .scheduled-overview-list{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:9px!important;
  }
  body.sunbliss-desktop-exec-preview #scheduledActionsOverview .scheduled-overview-row{
    min-height:78px!important;
    border-radius:9px!important;
  }

  /* Cash flow and data rows stay readable but denser on desktop. */
  body.sunbliss-desktop-exec-preview .cf-select-wrap{max-width:360px!important}
  body.sunbliss-desktop-exec-preview .cf-summary{max-width:720px!important}
  body.sunbliss-desktop-exec-preview .row-btn{
    min-height:58px!important;
    border-radius:9px!important;
    margin-bottom:6px!important;
  }
  body.sunbliss-desktop-exec-preview .controls{padding:20px 24px 12px!important}
  body.sunbliss-desktop-exec-preview .list{padding:4px 20px 26px!important}

  /* Installments fit into a proper desktop card grid. */
  body.sunbliss-desktop-exec-preview .ledger-scroll{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:10px!important;
    overflow:visible!important;
    scroll-snap-type:none!important;
  }
  body.sunbliss-desktop-exec-preview .stage-card{
    width:auto!important;
    min-width:0!important;
    flex:none!important;
    border-radius:10px!important;
  }

  /* Charts/tables use the canvas width more like the reference. */
  body.sunbliss-desktop-exec-preview .insights svg{max-width:100%!important;height:auto!important}
  body.sunbliss-desktop-exec-preview .stage-scroll .stage-tbl{min-width:760px!important}

  /* Search panel is launched from the new desktop shell. */
  body.sunbliss-desktop-exec-preview #sunblissDockSearchPanel{
    left:calc(50% + 120px)!important;
    width:min(720px,calc(100vw - 390px))!important;
  }
}
@media(min-width:1380px){
  body.sunbliss-desktop-exec-preview #app{padding-left:338px!important;padding-right:30px!important}
  #sunblissDesktopUtility{left:338px;right:30px}
  body.sunbliss-desktop-exec-preview .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important}
}
@media(min-width:1700px){
  body.sunbliss-desktop-exec-preview .ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important}
}
`;
  document.head.appendChild(style);
}

function hiddenTab(view){
  return document.querySelector('.tabs .tab[data-view="'+view+'"]');
}

function clickView(view){
  var target=hiddenTab(view);
  if(target){target.click();return true;}
  if(window.state&&typeof window.renderMain==='function'){
    state.view=view;
    renderMain();
    window.scrollTo(0,0);
    return true;
  }
  return false;
}

function clickDock(selector){
  var target=document.querySelector('.tabs '+selector);
  if(target){target.click();return true;}
  return false;
}

function refreshCRM(){
  var btn=document.getElementById('btnUpload');
  if(btn){btn.click();return true;}
  if(typeof window.loadFromSupabase==='function'){loadFromSupabase();return true;}
  return false;
}

function goTasks(){
  function scrollToTasks(){
    var block=document.getElementById('scheduledActionsOverview');
    if(block)block.scrollIntoView({behavior:'smooth',block:'start'});
  }
  if(window.state&&state.view!=='overview'){
    clickView('overview');
    setTimeout(scrollToTasks,80);
  }else scrollToTasks();
}

function bindRouteButtons(root){
  root.querySelectorAll('[data-route]').forEach(function(btn){
    btn.addEventListener('click',function(){clickView(btn.getAttribute('data-route'));});
  });
  root.querySelectorAll('[data-action="tasks"]').forEach(function(btn){btn.addEventListener('click',goTasks);});
  root.querySelectorAll('[data-action="search"]').forEach(function(btn){btn.addEventListener('click',function(){clickDock('.dock-search');});});
  root.querySelectorAll('[data-action="add"]').forEach(function(btn){btn.addEventListener('click',function(){clickDock('.dock-add');});});
}

function ensureShell(){
  if(!isDesktop())return;

  var rail=document.getElementById('sunblissDesktopRail');
  if(!rail){
    rail=document.createElement('aside');
    rail.id='sunblissDesktopRail';
    rail.setAttribute('aria-label','CRM shortcuts');
    rail.innerHTML='\
      <div class="sb-rail-mark">S</div>\
      <nav class="sb-rail-nav">\
        <button type="button" data-route="overview" title="Overview">'+svg('overview')+'</button>\
        <button type="button" data-route="list" title="Units & Customers">'+svg('units')+'</button>\
        <button type="button" data-route="insights" title="Insights">'+svg('insights')+'</button>\
        <button type="button" data-action="tasks" title="Scheduled Actions">'+svg('tasks')+'</button>\
        <button type="button" data-action="search" title="Search">'+svg('search')+'</button>\
        <button type="button" data-action="add" title="Add Customer">'+svg('add')+'</button>\
      </nav>\
      <div class="sb-rail-spacer"></div>\
      <div class="sb-rail-user">'+svg('person')+'</div>';
    document.body.appendChild(rail);
    bindRouteButtons(rail);
  }

  var sidebar=document.getElementById('sunblissDesktopSidebar');
  if(!sidebar){
    sidebar=document.createElement('aside');
    sidebar.id='sunblissDesktopSidebar';
    sidebar.setAttribute('aria-label','Desktop CRM navigation');
    sidebar.innerHTML='\
      <div class="sb-desk-window"><i></i><i></i><i></i></div>\
      <div class="sb-desk-brand"><strong>Sunbliss CRM</strong><span>Sales & Collections</span></div>\
      <nav class="sb-desk-nav">\
        <button type="button" data-route="overview">'+svg('overview')+'<span>Dashboard</span></button>\
        <button type="button" data-route="list">'+svg('units')+'<span>Units & Customers</span></button>\
        <button type="button" data-route="insights">'+svg('insights')+'<span>Insights</span></button>\
        <button type="button" data-action="tasks">'+svg('tasks')+'<span>Scheduled Actions</span></button>\
        <button type="button" data-action="search">'+svg('search')+'<span>Search CRM</span></button>\
        <button type="button" class="sb-desk-add" data-action="add">'+svg('add')+'<span>Add Customer</span></button>\
      </nav>\
      <div class="sb-desk-spacer"></div>\
      <div class="sb-desk-foot">Sunbliss Residences<br>Desktop preview workspace</div>';
    document.body.appendChild(sidebar);
    bindRouteButtons(sidebar);
  }

  var utility=document.getElementById('sunblissDesktopUtility');
  if(!utility){
    utility=document.createElement('div');
    utility.id='sunblissDesktopUtility';
    utility.innerHTML='\
      <button type="button" class="sb-util-search" id="sbDeskSearchBox">'+svg('search')+'<span>Search unit, customer or payment...</span></button>\
      <div class="sb-util-meta">\
        <div class="sb-util-project"><strong>Sunbliss Residences</strong><span>CRM workspace</span></div>\
        <button type="button" class="sb-util-action" id="sbDeskRefresh" title="Refresh CRM">'+svg('refresh')+'</button>\
        <button type="button" class="sb-util-action sb-util-add" id="sbDeskAdd" title="Add customer">'+svg('add')+'</button>\
      </div>';
    document.body.appendChild(utility);
    document.getElementById('sbDeskSearchBox').addEventListener('click',function(){clickDock('.dock-search');});
    document.getElementById('sbDeskRefresh').addEventListener('click',refreshCRM);
    document.getElementById('sbDeskAdd').addEventListener('click',function(){clickDock('.dock-add');});
  }

  syncShell();
}

function syncShell(){
  var current=(window.state&&state.view)||'overview';
  [document.getElementById('sunblissDesktopRail'),document.getElementById('sunblissDesktopSidebar')].forEach(function(root){
    if(!root)return;
    root.querySelectorAll('[data-route]').forEach(function(btn){
      btn.classList.toggle('active',btn.getAttribute('data-route')===current);
    });
    root.querySelectorAll('[data-action="add"]').forEach(function(add){
      var original=document.querySelector('.tabs .dock-add');
      add.style.display=original?'flex':'none';
    });
  });
  var utilAdd=document.getElementById('sbDeskAdd');
  if(utilAdd){
    utilAdd.style.display=document.querySelector('.tabs .dock-add')?'flex':'none';
  }
}

function removeShell(){
  ['sunblissDesktopRail','sunblissDesktopSidebar','sunblissDesktopUtility'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.remove();
  });
}

function apply(){
  installStyles();
  var enabled=isDesktop();
  document.body.classList.toggle('sunbliss-desktop-exec-preview',enabled);
  if(enabled)ensureShell();else removeShell();
  syncShell();
}

function schedule(){
  clearTimeout(timer);
  timer=setTimeout(apply,45);
}

function attach(){
  installStyles();
  apply();
  var app=document.getElementById('app');
  if(app&&window.MutationObserver&&!observer){
    observer=new MutationObserver(schedule);
    observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
  }
  window.addEventListener('resize',schedule,{passive:true});
  setTimeout(apply,220);
  setTimeout(apply,650);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();