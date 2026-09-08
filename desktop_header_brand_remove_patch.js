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