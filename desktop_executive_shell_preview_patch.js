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
    add:'<path d="M12 5v14M5 12h14"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(icons[name]||icons.overview)+'</svg>';
}

function installStyles(){
  if(document.getElementById('sunblissDesktopExecutiveShellPreviewStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissDesktopExecutiveShellPreviewStyles';
  style.textContent=`
#sunblissDesktopSidebar{display:none}
@media(min-width:1024px){
  /* Layout only: keep the CRM's existing colour system untouched. */
  body.sunbliss-desktop-exec-preview #app{
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding-left:252px!important;
    padding-bottom:34px!important;
    contain:none!important;
  }

  /* Remove the mobile pill dock on desktop preview. The original buttons stay in the DOM so their logic remains reusable. */
  body.sunbliss-desktop-exec-preview .tabs{
    display:none!important;
  }

  /* Left desktop navigation, using only the CRM's existing palette variables. */
  #sunblissDesktopSidebar{
    display:flex;
    position:fixed;
    left:18px;
    top:18px;
    bottom:18px;
    width:216px;
    z-index:1600;
    flex-direction:column;
    padding:18px 14px;
    border:1px solid rgba(237,230,214,.14);
    border-radius:18px;
    background:var(--ink-2);
    box-shadow:0 16px 42px rgba(15,26,38,.22);
  }
  .sb-desk-brand{
    padding:5px 8px 18px;
    margin-bottom:12px;
    border-bottom:1px solid rgba(237,230,214,.14);
  }
  .sb-desk-brand strong{
    display:block;
    font-family:Fraunces,serif;
    font-size:19px;
    font-weight:600;
    letter-spacing:.01em;
    color:var(--cream-text);
  }
  .sb-desk-brand span{
    display:block;
    margin-top:5px;
    font-family:IBM Plex Mono,monospace;
    font-size:8px;
    letter-spacing:.14em;
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
    min-height:44px;
    display:flex;
    align-items:center;
    gap:11px;
    padding:0 12px;
    border:1px solid transparent;
    border-radius:11px;
    background:transparent;
    color:var(--cream-text-dim);
    font:600 11.5px/1 Inter,system-ui,sans-serif;
    text-align:left;
    cursor:pointer;
  }
  .sb-desk-nav button svg{
    width:18px;
    height:18px;
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
    border-color:rgba(198,151,46,.34);
    color:var(--gold);
  }
  .sb-desk-nav .sb-desk-add{
    margin-top:8px;
    border-color:rgba(198,151,46,.40);
    color:var(--gold);
  }
  .sb-desk-spacer{flex:1}
  .sb-desk-foot{
    padding:14px 8px 3px;
    border-top:1px solid rgba(237,230,214,.14);
    font-size:9px;
    line-height:1.5;
    color:var(--cream-text-dim);
  }

  /* Keep the same desktop content logic, simply make it feel more structured. */
  body.sunbliss-desktop-exec-preview main#main{
    max-width:1480px!important;
  }
  body.sunbliss-desktop-exec-preview .overview,
  body.sunbliss-desktop-exec-preview .insights{
    padding-top:28px!important;
  }
  body.sunbliss-desktop-exec-preview .stat-hero{
    gap:10px!important;
    background:transparent!important;
    border:0!important;
    overflow:visible!important;
  }
  body.sunbliss-desktop-exec-preview .stat-hero>.stat-cell{
    border:1px solid var(--paper-line)!important;
    border-radius:13px!important;
  }
  body.sunbliss-desktop-exec-preview .stat-hero>.stat-cell.wide{
    border-radius:12px!important;
  }
  body.sunbliss-desktop-exec-preview .pipeline{
    gap:12px!important;
  }
  body.sunbliss-desktop-exec-preview .pill-stat{
    border-radius:13px!important;
  }
  body.sunbliss-desktop-exec-preview #scheduledActionsOverview{
    border-radius:14px!important;
  }
  body.sunbliss-desktop-exec-preview .row-btn{
    min-height:62px!important;
  }
  body.sunbliss-desktop-exec-preview .detail{
    max-width:1380px!important;
  }

  /* Desktop search panel is now launched from the sidebar, not the pill dock. */
  body.sunbliss-desktop-exec-preview #sunblissDockSearchPanel{
    left:calc(50% + 126px)!important;
    width:min(720px,calc(100vw - 340px))!important;
  }
}
@media(min-width:1500px){
  body.sunbliss-desktop-exec-preview #app{padding-left:270px!important;}
  #sunblissDesktopSidebar{left:22px;top:22px;bottom:22px;width:228px;}
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

function ensureSidebar(){
  if(!isDesktop())return;
  var sidebar=document.getElementById('sunblissDesktopSidebar');
  if(!sidebar){
    sidebar=document.createElement('aside');
    sidebar.id='sunblissDesktopSidebar';
    sidebar.setAttribute('aria-label','Desktop CRM navigation');
    sidebar.innerHTML='\
      <div class="sb-desk-brand"><strong>Sunbliss CRM</strong><span>Desktop workspace</span></div>\
      <nav class="sb-desk-nav">\
        <button type="button" data-route="overview">'+svg('overview')+'<span>Overview</span></button>\
        <button type="button" data-route="list">'+svg('units')+'<span>Units & Customers</span></button>\
        <button type="button" data-route="insights">'+svg('insights')+'<span>Insights</span></button>\
        <button type="button" data-action="tasks">'+svg('tasks')+'<span>Scheduled Actions</span></button>\
        <button type="button" data-action="search">'+svg('search')+'<span>Search</span></button>\
        <button type="button" class="sb-desk-add" data-action="add">'+svg('add')+'<span>Add Customer</span></button>\
      </nav>\
      <div class="sb-desk-spacer"></div>\
      <div class="sb-desk-foot">Sunbliss Residences<br>Desktop preview</div>';
    document.body.appendChild(sidebar);
    sidebar.querySelectorAll('[data-route]').forEach(function(btn){
      btn.addEventListener('click',function(){clickView(btn.getAttribute('data-route'));});
    });
    var tasks=sidebar.querySelector('[data-action="tasks"]');
    if(tasks)tasks.addEventListener('click',goTasks);
    var search=sidebar.querySelector('[data-action="search"]');
    if(search)search.addEventListener('click',function(){clickDock('.dock-search');});
    var add=sidebar.querySelector('[data-action="add"]');
    if(add)add.addEventListener('click',function(){clickDock('.dock-add');});
  }
  syncSidebar();
}

function syncSidebar(){
  var sidebar=document.getElementById('sunblissDesktopSidebar');
  if(!sidebar)return;
  var current=(window.state&&state.view)||'overview';
  sidebar.querySelectorAll('[data-route]').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-route')===current);
  });
  var add=sidebar.querySelector('[data-action="add"]');
  if(add){
    var original=document.querySelector('.tabs .dock-add');
    add.style.display=original?'flex':'none';
  }
}

function apply(){
  installStyles();
  var enabled=isDesktop();
  document.body.classList.toggle('sunbliss-desktop-exec-preview',enabled);
  if(enabled)ensureSidebar();
  else{
    var sidebar=document.getElementById('sunblissDesktopSidebar');
    if(sidebar)sidebar.remove();
  }
  syncSidebar();
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
