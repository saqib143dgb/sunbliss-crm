(function(){
  'use strict';
  if(window.__sunblissDesktopHeaderBrandRefineInstalled)return;
  window.__sunblissDesktopHeaderBrandRefineInstalled=true;

  var MQ='(min-width:1024px)',queued=false;
  function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}

  function installStyle(){
    if(document.getElementById('sunblissDesktopHeaderBrandRemoveStyle'))return;
    var style=document.createElement('style');
    style.id='sunblissDesktopHeaderBrandRemoveStyle';
    style.textContent=`
      @media(min-width:1024px){
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
          display:none!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{
          font-size:49px!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
          position:relative!important;
          overflow:visible!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions>.sb-pro-sync{
          position:absolute!important;
          top:50px!important;
          right:0!important;
          margin:0!important;
          z-index:4!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function placeSync(){
    installStyle();
    var h=document.querySelector('.topbar.sunbliss-professional-header');
    if(!h)return;
    var sync=h.querySelector('.sb-pro-sync');
    if(!sync)return;
    var actions=h.querySelector('.sb-pro-actions');
    var project=h.querySelector('.sb-pro-project-row');
    if(desktop()){
      if(actions&&sync.parentNode!==actions)actions.appendChild(sync);
    }else if(project&&sync.parentNode!==project){
      project.appendChild(sync);
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;placeSync()});
  }

  function wrap(name){
    var fn=window[name];
    if(typeof fn!=='function'||fn.__sbSyncBelowSignout)return;
    function wrapped(){var result=fn.apply(this,arguments);schedule();return result}
    wrapped.__sbSyncBelowSignout=true;
    window[name]=wrapped;
  }

  function install(){
    installStyle();
    placeSync();
    wrap('renderMain');
    wrap('render');
    wrap('renderOverview');
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule);
    setTimeout(function(){placeSync();wrap('renderMain');wrap('render');wrap('renderOverview')},120);
    setTimeout(function(){placeSync();wrap('renderMain');wrap('render');wrap('renderOverview')},500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
