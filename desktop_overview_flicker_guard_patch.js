(function(){
'use strict';
if(window.__sunblissDesktopOverviewFlickerGuardInstalled)return;
window.__sunblissDesktopOverviewFlickerGuardInstalled=true;

var MQ='(min-width:1024px)';
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function onOverview(){return desktop()&&window.state&&state.view==='overview'}

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
    if(!onOverview())return fn.apply(this,arguments);
    var keep=document.getElementById('sbRefOverviewV2');
    if(keep&&keep.parentNode)keep.parentNode.removeChild(keep);
    var result;
    try{result=fn.apply(this,arguments)}finally{
      if(keep&&!keep.isConnected&&window.state&&state.view==='overview'){
        var host=document.querySelector('.overview');
        if(host&&!document.getElementById('sbRefOverviewV2'))host.insertBefore(keep,host.firstChild);
      }
    }
    return result;
  }
  guarded.__sbFlickerGuard=true;
  guarded.__sbFlickerGuardOriginal=fn;
  window[name]=guarded;
}

function install(){
  wrap('renderOverview');
  wrap('renderMain');
  wrap('render');
  /* Some late CRM patches replace render functions during startup. Re-wrap only the
     function references themselves; there is no DOM observer and no recurring timer. */
  setTimeout(function(){wrap('renderOverview');wrap('renderMain');wrap('render')},120);
  setTimeout(function(){wrap('renderOverview');wrap('renderMain');wrap('render')},500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
