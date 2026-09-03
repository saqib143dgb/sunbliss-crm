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
          left:50%!important;
          right:auto!important;
          margin:0!important;
          transform:translateX(-50%)!important;
          z-index:4!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function alignSync(sync,actions,project){
    if(!sync||!actions||!project)return;
    var actionsRect=actions.getBoundingClientRect();
    var projectRect=project.getBoundingClientRect();
    var syncRect=sync.getBoundingClientRect();
    if(!actionsRect.height||!projectRect.height||!syncRect.height)return;
    var projectCenter=projectRect.top+(projectRect.height/2);
    var targetTop=projectCenter-actionsRect.top-(syncRect.height/2);
    sync.style.setProperty('top',Math.round(targetTop)+'px','important');
    sync.style.setProperty('left','50%','important');
    sync.style.setProperty('right','auto','important');
    sync.style.setProperty('transform','translateX(-50%)','important');
  }

  function placeSync(){
    installStyle();
    var h=document.querySelector('.topbar.sunbliss-professional-header');
    if(!h)return;
    var sync=h.querySelector('.sb-pro-sync');
    if(!sync)return;
    var actions=h.querySelector('.sb-pro-actions');
    var projectRow=h.querySelector('.sb-pro-project-row');
    var project=h.querySelector('.sb-pro-project');
    if(desktop()){
      if(actions&&sync.parentNode!==actions)actions.appendChild(sync);
      requestAnimationFrame(function(){alignSync(sync,actions,project||projectRow)});
    }else if(projectRow&&sync.parentNode!==projectRow){
      sync.style.removeProperty('top');
      sync.style.removeProperty('left');
      sync.style.removeProperty('right');
      sync.style.removeProperty('transform');
      projectRow.appendChild(sync);
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
