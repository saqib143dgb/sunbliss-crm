(function(){
  'use strict';
  if(window.__sunblissPillProportionsInstalled)return;
  window.__sunblissPillProportionsInstalled=true;
  var style=document.createElement('style');
  style.id='sunblissPillProportionsStyles';
  style.textContent="@media(max-width:719px){\nbody>.tabs{box-sizing:border-box!important;width:calc(100vw - 44px)!important;max-width:580px!important;min-height:0!important;height:58px!important;padding:5px 6px!important;gap:2px!important;bottom:calc(24px + env(safe-area-inset-bottom))!important;border-radius:999px!important;transition:width .24s cubic-bezier(.2,.8,.2,1),height .24s cubic-bezier(.2,.8,.2,1),padding .24s ease!important;}\nbody>.tabs .tab{box-sizing:border-box!important;min-height:46px!important;height:46px!important;padding:3px 2px!important;gap:2px!important;transition:background-color .18s ease,transform .14s ease!important;}\nbody>.tabs .tab::before{width:23px!important;height:23px!important;}\nbody>.tabs.sunbliss-scroll-compact{width:calc(100vw - 80px)!important;max-width:510px!important;height:52px!important;padding:4px 6px!important;}\nbody>.tabs.sunbliss-scroll-compact .tab{height:42px!important;min-height:42px!important;gap:1px!important;}\nbody>.tabs.sunbliss-scroll-compact .tab::before{width:22px!important;height:22px!important;}\n}\n@media(max-width:359px){body>.tabs{width:calc(100vw - 28px)!important;}body>.tabs.sunbliss-scroll-compact{width:calc(100vw - 48px)!important;}}\n@media(prefers-reduced-motion:reduce){body>.tabs,body>.tabs .tab{transition:none!important;}}\n@media(max-width:719px){\n #sunblissPersistentBackDock{padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;}\n #sunblissPersistentBack{width:calc(100vw - 44px)!important;max-width:580px!important;height:58px!important;min-height:58px!important;transition:width .24s cubic-bezier(.2,.8,.2,1),height .24s cubic-bezier(.2,.8,.2,1),background .16s ease,border-color .16s ease!important;}\n #sunblissPersistentBack.sunbliss-scroll-compact{width:calc(100vw - 80px)!important;max-width:510px!important;height:52px!important;min-height:52px!important;}\n}\n@media(max-width:359px){\n #sunblissPersistentBack{width:calc(100vw - 28px)!important;}\n #sunblissPersistentBack.sunbliss-scroll-compact{width:calc(100vw - 48px)!important;}\n}\n@media(prefers-reduced-motion:reduce){#sunblissPersistentBack{transition:none!important;}}";
  document.head.appendChild(style);
  // Preserve existing labels, icons and button handlers; only resize the dock.
  var lastY=null,downTravel=0,upTravel=0,scheduled=false;
  function dock(){return document.querySelector('body>.tabs');}
  function position(){return Math.max(0,window.scrollY||document.documentElement.scrollTop||0);}
  function compact(enabled){var el=dock();if(el)el.classList.toggle('sunbliss-scroll-compact',!!enabled);var back=document.getElementById('sunblissPersistentBack');if(back)back.classList.toggle('sunbliss-scroll-compact',!!enabled);}
  function reset(){lastY=position();downTravel=0;upTravel=0;compact(false);}
  function update(){
    scheduled=false;
    if(window.innerWidth>719){reset();return;}
    var y=position();
    if(lastY===null){lastY=y;return;}
    var delta=y-lastY;lastY=y;
    if(y<45){downTravel=0;upTravel=0;compact(false);return;}
    if(Math.abs(delta)>220){downTravel=0;upTravel=0;return;}
    if(delta>1){downTravel+=delta;upTravel=0;if(downTravel>=85){compact(true);downTravel=0;}}
    else if(delta< -1){upTravel-=delta;downTravel=0;if(upTravel>=30){compact(false);upTravel=0;}}
  }
  window.addEventListener('scroll',function(){if(!scheduled){scheduled=true;window.requestAnimationFrame(update);}},{passive:true});
  document.addEventListener('click',function(event){
    var target=event.target;
    if(target&&target.closest&&(target.closest('body>.tabs .tab')||target.closest('#sunblissPersistentBack')))reset();
  },true);
  window.addEventListener('resize',reset,{passive:true});
  window.addEventListener('pageshow',reset,{passive:true});
  reset();
})();