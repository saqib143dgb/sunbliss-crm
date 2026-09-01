(function(){
'use strict';
/*
  Stable desktop shell.
  This file loads before the legacy desktop responsive/executive shells.
  Their sentinels are set here so the old whole-app MutationObservers never install.
  The exact reference dashboard and exact reference header still load afterwards.
*/
if(window.__sunblissStableDesktopShellInstalled)return;
window.__sunblissStableDesktopShellInstalled=true;
window.__sunblissDesktopResponsiveCRMInstalled=true;
window.__sunblissExactDesktopPreviewInstalled=true;

var MQ='(min-width:1024px)',queued=false;
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function icon(name){
  var p={
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    units:'<path d="M4 21V8l8-4 8 4v13M9 21v-5h6v5M8 10h1M12 10h1M16 10h1"/>',
    insights:'<path d="M4 19V5M4 19h16M7 15l4-5 3 3 5-7"/>',
    tasks:'<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    add:'<path d="M12 5v14M5 12h14"/>',
    project:'<path d="M4 21V8l6-3v16M10 21V3l8 4v14M2 21h20M7 11h1M7 15h1M13 9h1M13 13h1M16 10h1M16 14h1"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(p[name]||p.overview)+'</svg>';
}
function sunLogo(){return '<img class="sb-stable-brand-logo" src="assets/purvanchal-p-logo.svg" alt="Purvanchal logo">'}
function styles(){
  if(document.getElementById('sunblissStableDesktopShellStyles'))return;
  var s=document.createElement('style');s.id='sunblissStableDesktopShellStyles';s.textContent=`
#sbRefSidebar{display:none}
@media(min-width:1024px){
 html,body{min-width:1024px}
 body.sunbliss-ref-desktop{background:#fff!important;background-image:none!important;overflow-x:hidden!important}
 body.sunbliss-ref-desktop #app{width:100%!important;max-width:none!important;margin:0!important;padding:0 0 0 216px!important;padding-bottom:0!important;contain:none!important;min-height:100vh!important}
 body.sunbliss-ref-desktop .tabs{display:none!important}
 body.sunbliss-ref-desktop main#main{position:relative!important;width:100%!important;max-width:none!important;margin:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;overflow:visible!important}
 #sbRefSidebar{display:flex;position:fixed;z-index:5000;left:0;top:0;bottom:0;width:216px;flex-direction:column;background:linear-gradient(180deg,var(--ink-2),#0b1a29);color:var(--cream-text);border-right:1px solid rgba(198,151,46,.30);box-shadow:none}
 .sb-ref-brand{height:145px;padding:13px 16px 15px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;border-bottom:1px solid rgba(237,230,214,.12)}
 .sb-stable-brand-logo{display:block;width:54px;height:54px;object-fit:contain;margin:0 auto 3px;flex:none}
 .sb-ref-brand strong{font:600 25px/1 Georgia,'Times New Roman',serif;color:var(--cream-text);letter-spacing:-.015em}.sb-ref-brand small{margin-top:7px;font:700 8px/1 Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
 .sb-ref-nav{padding:0;display:flex;flex-direction:column;gap:0}.sb-ref-nav button{position:relative;width:100%;height:51px;border:0;border-radius:0;background:transparent;color:var(--cream-text);display:flex;align-items:center;gap:15px;padding:0 28px;font:500 13px/1 Inter,sans-serif;text-align:left;cursor:pointer}.sb-ref-nav button svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}.sb-ref-nav button:hover{background:rgba(237,230,214,.045)}.sb-ref-nav button.active{background:rgba(237,230,214,.10);color:var(--gold);font-weight:650}.sb-ref-nav button.active:before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--gold)}
 .sb-ref-nav .sb-ref-add{margin:17px 16px 0;width:calc(100% - 32px);height:44px;border:1px solid var(--gold);border-radius:10px;color:var(--gold);background:transparent;padding:0 17px}.sb-ref-nav .sb-ref-add:hover{background:rgba(198,151,46,.07)}
 .sb-ref-side-bottom{margin:0 17px 0;margin-top:auto;padding:26px 7px 28px;border-top:1px solid rgba(237,230,214,.12)}.sb-ref-project-card{display:grid;grid-template-columns:30px 1fr 28px;gap:9px;align-items:center;color:var(--cream-text);font:500 10px/1.35 Inter,sans-serif}.sb-ref-project-card>svg{width:26px;height:26px;fill:none;stroke:var(--gold);stroke-width:1.7}.sb-ref-project-card b{display:block;font-size:10px;margin-bottom:3px}.sb-ref-project-card em{font-style:normal;color:var(--cream-text-dim);font-size:9px}.sb-ref-project-card .arr{width:28px;height:28px;border:1px solid rgba(237,230,214,.18);border-radius:50%;display:grid;place-items:center;font-size:18px;color:var(--cream-text-dim)}
 body.sunbliss-ref-desktop .overview,body.sunbliss-ref-desktop .overview *,body.sunbliss-ref-desktop .topbar.sunbliss-professional-header,body.sunbliss-ref-desktop #sbRefSidebar{animation:none!important;transition:none!important}
}
`;document.head.appendChild(s)
}
function original(sel){return document.querySelector(sel)}
function route(view){
  var b=original('.tabs .tab[data-view="'+view+'"]')||original('.tab[data-view="'+view+'"]');
  if(b){b.click();return}
  if(window.state&&typeof window.renderMain==='function'){state.view=view;renderMain();window.scrollTo(0,0)}
}
function dock(sel){var b=original(sel);if(b)b.click()}
function ensureSidebar(){
  if(!desktop())return;
  var n=document.getElementById('sbRefSidebar');if(n)return;
  n=document.createElement('aside');n.id='sbRefSidebar';
  n.innerHTML='<div class="sb-ref-brand">'+sunLogo()+'<strong>Sunbliss CRM</strong><small>Desktop Workspace</small></div><nav class="sb-ref-nav"><button data-route="overview">'+icon('overview')+'<span>Overview</span></button><button data-route="list">'+icon('units')+'<span>Units &amp; Customers</span></button><button data-route="insights">'+icon('insights')+'<span>Insights</span></button><button data-action="search">'+icon('search')+'<span>Search</span></button><button class="sb-ref-add" data-action="add">'+icon('add')+'<span>Add Customer</span></button></nav><div class="sb-ref-side-bottom"><div class="sb-ref-project-card">'+icon('project')+'<div><b>Sunbliss Residences</b><em>Real Estate Project</em></div><span class="arr">›</span></div></div>';
  document.body.appendChild(n);
  n.querySelectorAll('[data-route]').forEach(function(b){b.onclick=function(){route(b.getAttribute('data-route'))}});
  n.querySelector('[data-action="search"]').onclick=function(){dock('.dock-search')};
  n.querySelector('[data-action="add"]').onclick=function(){dock('.dock-add')};
}
function syncSidebar(){
  var n=document.getElementById('sbRefSidebar');if(!n)return;
  var v=(window.state&&state.view)||'overview';
  n.querySelectorAll('[data-route]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-route')===v)});
  var add=n.querySelector('[data-action="add"]');if(add)add.style.display=original('.dock-add')?'flex':'none';
}
function apply(){
  styles();var on=desktop();document.body.classList.toggle('sunbliss-ref-desktop',on);
  if(!on){var n=document.getElementById('sbRefSidebar');if(n)n.remove();return}
  ensureSidebar();syncSidebar();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply()})}
function wrap(name){
  var fn=window[name];if(typeof fn!=='function'||fn.__sbStableShell)return;
  function wrapped(){var r=fn.apply(this,arguments);schedule();return r}
  wrapped.__sbStableShell=true;window[name]=wrapped;
}
function install(){
  styles();apply();wrap('renderMain');wrap('renderOverview');wrap('render');
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);
  setTimeout(function(){apply();wrap('renderMain');wrap('renderOverview');wrap('render')},120);
  setTimeout(function(){apply();wrap('renderMain');wrap('renderOverview');wrap('render')},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
