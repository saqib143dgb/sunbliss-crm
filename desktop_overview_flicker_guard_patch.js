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

function ensureRealSidebarLogo(){
  if(!desktop())return;
  var brand=document.querySelector('#sbRefSidebar .sb-ref-brand');
  if(!brand)return;
  var current=brand.querySelector('.sb-stable-brand-logo');
  if(current&&current.tagName&&current.tagName.toLowerCase()==='img'&&current.getAttribute('src')==='assets/purvanchal-p-dubai.png')return;
  var img=document.createElement('img');
  img.className='sb-stable-brand-logo';
  img.src='assets/purvanchal-p-dubai.png';
  img.alt='Purvanchal logo';
  img.decoding='async';
  img.style.width='61px';
  img.style.height='61px';
  img.style.objectFit='contain';
  img.style.display='block';
  img.style.margin='0 auto 1px';
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
  ensureRealSidebarLogo();
  wrap('renderOverview');
  wrap('renderMain');
  wrap('render');
  /* Some late CRM patches replace render functions during startup. Re-wrap only the
     function references themselves; there is no DOM observer and no recurring timer. */
  setTimeout(function(){ensureWordmarkTypography();ensureRealSidebarLogo();wrap('renderOverview');wrap('renderMain');wrap('render')},120);
  setTimeout(function(){ensureWordmarkTypography();ensureRealSidebarLogo();wrap('renderOverview');wrap('renderMain');wrap('render')},500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
