(function(){
  'use strict';
  if(window.__sunblissDesktopHeaderBrandRefineInstalled)return;
  window.__sunblissDesktopHeaderBrandRefineInstalled=true;

  var MQ='(min-width:1024px)';
  var queued=false;
  var observedHeader=null;
  var headerObserver=null;
  var observedApp=null;
  var appObserver=null;
  var hookAttempts=0;

  function desktop(){
    return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024;
  }

  function directChildByClass(parent,className){
    if(!parent)return null;
    for(var i=0;i<parent.children.length;i++){
      var child=parent.children[i];
      if(child.classList&&child.classList.contains(className))return child;
    }
    return null;
  }

  function watchApp(){
    var app=document.getElementById('app');
    if(!window.MutationObserver||app===observedApp)return;
    if(appObserver)appObserver.disconnect();
    observedApp=app||null;
    if(!app){appObserver=null;return;}
    appObserver=new MutationObserver(function(records){
      /* Watch only top-level #app child replacement. Dashboard/card mutations
         do not wake this observer, so there is no whole-app feedback loop. */
      for(var i=0;i<records.length;i++){
        if(records[i].type==='childList'){
          schedule();
          break;
        }
      }
    });
    appObserver.observe(app,{childList:true,subtree:false});
  }

  function watchHeader(header){
    if(!window.MutationObserver||header===observedHeader)return;
    if(headerObserver)headerObserver.disconnect();
    observedHeader=header||null;
    if(!header){headerObserver=null;return;}
    headerObserver=new MutationObserver(function(records){
      /* The professional renderer may rebuild header.innerHTML after late data
         arrives. Observe only this small header subtree and repair once. */
      for(var i=0;i<records.length;i++){
        if(records[i].type==='childList'){
          schedule();
          break;
        }
      }
    });
    headerObserver.observe(header,{childList:true,subtree:true});
  }

  function ensureProjectVisual(header){
    var visual=directChildByClass(header,'sb-desktop-project-visual');
    if(!visual){
      visual=document.createElement('div');
      visual.className='sb-desktop-project-visual';
      visual.setAttribute('aria-hidden','true');
      header.insertBefore(visual,header.firstChild);
    }
    return visual;
  }

  function placeSync(header){
    var projectRow=header.querySelector('.sb-pro-project-row');
    var directSync=directChildByClass(header,'sb-pro-sync');
    var nestedSync=projectRow?directChildByClass(projectRow,'sb-pro-sync'):null;

    if(desktop()){
      /* If a late render created a fresh nested sync, that fresh node is the
         source of truth. Move it instead of cloning so click/keyboard behavior
         and the current sync label remain intact. */
      if(nestedSync){
        if(directSync&&directSync!==nestedSync)directSync.remove();
        header.appendChild(nestedSync);
        directSync=nestedSync;
      }
      return directSync;
    }

    if(directSync&&projectRow&&!nestedSync){
      directSync.style.removeProperty('top');
      directSync.style.removeProperty('left');
      directSync.style.removeProperty('right');
      directSync.style.removeProperty('bottom');
      directSync.style.removeProperty('transform');
      projectRow.appendChild(directSync);
    }
    return directSync||nestedSync;
  }

  function stabilize(){
    watchApp();
    var header=document.querySelector('.topbar.sunbliss-professional-header');
    if(!header){
      watchHeader(null);
      return;
    }
    watchHeader(header);

    if(desktop()){
      ensureProjectVisual(header);
      placeSync(header);
    }else{
      var visual=directChildByClass(header,'sb-desktop-project-visual');
      if(visual)visual.remove();
      placeSync(header);
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){
      queued=false;
      stabilize();
    });
  }

  function wrap(name){
    var fn=window[name];
    if(typeof fn!=='function'||fn.__sbApprovedDesktopHeaderStable)return;
    function wrapped(){
      var result;
      try{result=fn.apply(this,arguments)}
      finally{schedule();}
      if(result&&typeof result.then==='function')result.then(schedule,schedule);
      return result;
    }
    wrapped.__sbApprovedDesktopHeaderStable=true;
    wrapped.__sunblissOriginal=fn;
    window[name]=wrapped;
  }

  function install(){
    watchApp();
    wrap('render');
    wrap('renderMain');
    wrap('renderOverview');
    wrap('renderDetail');
    schedule();

    /* Other deferred patches also wrap render methods. Re-wrap only during
       startup so this guard ends up outside the final chain, then stop. */
    hookAttempts+=1;
    if(hookAttempts<16)window.setTimeout(install,140);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }

  window.addEventListener('pageshow',schedule);
  window.addEventListener('resize',schedule,{passive:true});
})();

(function(){
  'use strict';
  if(window.__sunblissDesktopGlobalSpaceFillInstalled)return;
  window.__sunblissDesktopGlobalSpaceFillInstalled=true;

  var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;
  var raf=0;
  var observer=null;

  function desktop(){return MQ?MQ.matches:window.innerWidth>=1024;}

  function installStyle(){
    var style=document.getElementById('sunblissDesktopGlobalSpaceFillStyle');
    if(!style){
      style=document.createElement('style');
      style.id='sunblissDesktopGlobalSpaceFillStyle';
      style.textContent=`
@media(min-width:1024px){
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .overview,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .insights,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .detail,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .controls,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .list{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin-left:0!important;
    margin-right:0!important;
    box-sizing:border-box!important;
    background:#f8f6ef!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main #sbRefOverviewV2{
    width:100%!important;
    max-width:none!important;
    margin:0!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .overview>*:not(.section-label):not(.footnote),
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .detail>*,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .controls>*,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .list>*{
    max-width:none!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .search,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .filter-toggle,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .filter-panel,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .money-grid,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .notice,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .tx-list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .field-row,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .field-address,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stage-scroll,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .cancelled-archive-table-wrap{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .sb-v2-card,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stat-cell,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .pill-stat,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .money-cell,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stage-card,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .tx-list,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stage-scroll,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .filter-panel,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .search{
    background:#fbf8ef!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stat-hero{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
    width:100%!important;
    max-width:none!important;
    background:transparent!important;
    border:0!important;
    overflow:visible!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .pipeline{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
    width:100%!important;
    max-width:none!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .money-grid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .ledger-scroll{
    display:grid!important;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;
    gap:12px!important;
    width:100%!important;
    max-width:none!important;
    overflow:visible!important;
  }

  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.cancelled-archive-summary{
    display:grid!important;
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
    gap:12px!important;
    width:100%!important;
    max-width:none!important;
    min-height:0!important;
    height:auto!important;
    margin:10px 0 12px!important;
    padding:0!important;
    background:transparent!important;
    border:0!important;
    overflow:visible!important;
  }

  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.cancelled-archive-summary>.stat-cell{
    min-height:96px!important;
    height:auto!important;
    padding:14px 15px!important;
    border:1px solid var(--paper-line)!important;
    border-radius:11px!important;
    background:#fbf8ef!important;
    box-shadow:0 3px 14px rgba(15,26,38,.04)!important;
  }

  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.list[data-cancelled-archive-version]{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:10px!important;
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding:10px!important;
    background:#fbf8ef!important;
    border:1px solid var(--paper-line)!important;
    border-radius:11px!important;
    overflow:visible!important;
  }

  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.list[data-cancelled-archive-version]>.cancelled-archive-row{
    width:100%!important;
    min-width:0!important;
    min-height:74px!important;
    height:auto!important;
    margin:0!important;
    padding:12px 28px 12px 12px!important;
    border:1px solid var(--paper-line)!important;
    border-radius:10px!important;
    background:#fbf8ef!important;
  }

  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.pipeline{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:10px!important;
    padding:6px!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .stage-tbl,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .cancelled-archive-table,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main table{
    width:100%!important;
    max-width:none!important;
  }

  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main svg.insights-sales-chart,
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .overview>.section-label+svg{
    display:block!important;
    width:100%!important;
    max-width:100%!important;
    height:auto!important;
  }
}

@media(min-width:1024px) and (max-width:1280px){
  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.cancelled-archive-summary{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
  html body.sunbliss-ref-desktop.sunbliss-desktop-insights:not(.ceo-mode) #app main#main .overview>.list[data-cancelled-archive-version]{
    grid-template-columns:1fr!important;
  }
  html body.sunbliss-ref-desktop:not(.ceo-mode) #app main#main .money-grid{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
`;
      document.head.appendChild(style);
    }else{
      document.head.appendChild(style);
    }
  }

  function fillVisuals(){
    if(!desktop()||!document.body||!document.body.classList.contains('sunbliss-ref-desktop'))return;
    installStyle();
    var main=document.getElementById('main');
    if(!main)return;
    var charts=main.querySelectorAll('svg.insights-sales-chart,.overview>.section-label+svg');
    charts.forEach(function(svg){
      if(!svg||!svg.style)return;
      svg.style.setProperty('width','100%','important');
      svg.style.setProperty('max-width','100%','important');
      svg.style.setProperty('height','auto','important');
      svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    });
  }

  function schedule(){
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){raf=0;fillVisuals();});
  }

  function observe(){
    if(observer||!window.MutationObserver)return;
    var main=document.getElementById('main');
    if(!main){window.setTimeout(observe,120);return;}
    observer=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        if(records[i].type==='childList'){schedule();break;}
      }
    });
    observer.observe(main,{childList:true,subtree:true});
  }

  installStyle();
  schedule();
  observe();
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  if(MQ){
    if(MQ.addEventListener)MQ.addEventListener('change',schedule);
    else if(MQ.addListener)MQ.addListener(schedule);
  }
})();