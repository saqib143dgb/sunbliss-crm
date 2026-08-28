(function(){
'use strict';
if(window.__sunblissDetailStatusFlashFixInstalled)return;
window.__sunblissDetailStatusFlashFixInstalled=true;

var style=document.createElement('style');
style.id='detailStatusFlashFixStyles';
style.textContent=[
  /* The legacy async notes card is superseded by active_note_front_page_patch.js.
     Keeping it display:none from first paint prevents it from briefly inserting
     between the badges and Action Required card while its async query resolves. */
  '.detail #customerNotesCard{display:none!important}',
  /* Safari can visibly animate/repaint these cards while nearby async DOM is settling. */
  '.detail #actionRequiredCard,.detail #activeCustomerNoteCard{animation:none!important;transition:none!important}',
  '.detail #actionRequiredCard *,.detail #activeCustomerNoteCard *{animation:none!important;transition:none!important}',
  /* The base CRM gives .topbar a fade-in animation. The production header is already
     fully designed by the professional-header patches, so that animation only creates
     a visible flash on Safari during initial/data renders. */
  '.topbar{animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header *{animation:none!important}'
].join('');
document.head.appendChild(style);

/*
  render() rebuilds #app, which briefly recreates the legacy .topbar. The professional
  header patch normally replaces it on requestAnimationFrame; Safari can paint the
  intermediate legacy frame, producing the one-time blink reported on every open.
  Cache the already-rendered professional header and restore it synchronously after any
  render, then allow the normal header patch to refresh its live values afterward.
*/
var cachedHeader=null;
var restoring=false;

function bindSignout(header){
  var button=header&&header.querySelector('#btnSignOut');
  if(!button||button.dataset.flashFixBound==='1')return;
  button.dataset.flashFixBound='1';
  button.addEventListener('click',async function(){
    button.disabled=true;
    try{if(window.sb&&sb.auth)await sb.auth.signOut();}
    finally{location.reload();}
  });
}

function snapshotHeader(){
  var header=document.querySelector('.topbar.sunbliss-professional-header');
  if(!header)return;
  cachedHeader={
    className:header.className,
    html:header.innerHTML,
    textV2Sig:header.dataset.textV2Sig||''
  };
}

function restoreHeaderIfNeeded(){
  if(restoring||!cachedHeader)return;
  var header=document.querySelector('.topbar');
  if(!header||header.classList.contains('sunbliss-professional-header')){
    snapshotHeader();
    return;
  }
  restoring=true;
  try{
    header.className=cachedHeader.className;
    header.innerHTML=cachedHeader.html;
    if(cachedHeader.textV2Sig)header.dataset.textV2Sig=cachedHeader.textV2Sig;
    bindSignout(header);
  }finally{
    restoring=false;
  }
}

snapshotHeader();

if(typeof window.render==='function'&&!window.__sunblissHeaderFlashRenderWrapped){
  var previousRender=window.render;
  window.render=function(){
    snapshotHeader();
    var result=previousRender.apply(this,arguments);
    restoreHeaderIfNeeded();
    return result;
  };
  window.__sunblissHeaderFlashRenderWrapped=true;
}

var app=document.getElementById('app');
if(app&&window.MutationObserver){
  new MutationObserver(function(){
    if(restoring)return;
    var professional=document.querySelector('.topbar.sunbliss-professional-header');
    if(professional)snapshotHeader();
    else restoreHeaderIfNeeded();
  }).observe(app,{childList:true,subtree:true});
}
})();
