(function(){
'use strict';
if(window.__sunblissDetailStatusFlashFixInstalled)return;
window.__sunblissDetailStatusFlashFixInstalled=true;

var style=document.createElement('style');
style.id='detailStatusFlashFixStyles';
style.textContent=[
  '.detail #customerNotesCard{display:none!important}',
  '.detail #actionRequiredCard,.detail #activeCustomerNoteCard{animation:none!important;transition:none!important}',
  '.detail #actionRequiredCard *,.detail #activeCustomerNoteCard *{animation:none!important;transition:none!important}',
  '.topbar{animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header *{animation:none!important}'
].join('');
document.head.appendChild(style);

var cachedHeader=null;
var restoring=false;
function bindSignout(header){
  var button=header&&header.querySelector('#btnSignOut');
  if(!button||button.dataset.flashFixBound==='1')return;
  button.dataset.flashFixBound='1';
  button.addEventListener('click',async function(){button.disabled=true;try{if(window.sb&&sb.auth)await sb.auth.signOut();}finally{location.reload();}});
}
function snapshotHeader(){
  var header=document.querySelector('.topbar.sunbliss-professional-header');
  if(!header)return;
  cachedHeader={className:header.className,html:header.innerHTML,textV2Sig:header.dataset.textV2Sig||''};
}
function restoreHeaderIfNeeded(){
  if(restoring||!cachedHeader)return;
  var header=document.querySelector('.topbar');
  if(!header||header.classList.contains('sunbliss-professional-header')){snapshotHeader();return;}
  restoring=true;
  try{
    header.className=cachedHeader.className;
    header.innerHTML=cachedHeader.html;
    if(cachedHeader.textV2Sig)header.dataset.textV2Sig=cachedHeader.textV2Sig;
    bindSignout(header);
  }finally{restoring=false;}
}
snapshotHeader();
if(typeof window.render==='function'&&!window.__sunblissHeaderFlashRenderWrapped){
  var previousRender=window.render;
  window.render=function(){snapshotHeader();var result=previousRender.apply(this,arguments);restoreHeaderIfNeeded();return result;};
  window.__sunblissHeaderFlashRenderWrapped=true;
}
function touchesHeader(node){
  if(!node||node.nodeType!==1)return false;
  if(node.matches&&node.matches('.topbar,.topbar *'))return true;
  return !!(node.querySelector&&node.querySelector('.topbar'));
}
var app=document.getElementById('app');
if(app&&window.MutationObserver){
  new MutationObserver(function(mutations){
    if(restoring)return;
    var relevant=false;
    for(var i=0;i<mutations.length&&!relevant;i++){
      if(touchesHeader(mutations[i].target)){relevant=true;break;}
      for(var j=0;j<mutations[i].addedNodes.length;j++)if(touchesHeader(mutations[i].addedNodes[j])){relevant=true;break;}
      for(var k=0;k<mutations[i].removedNodes.length;k++)if(touchesHeader(mutations[i].removedNodes[k])){relevant=true;break;}
    }
    if(!relevant)return;
    var professional=document.querySelector('.topbar.sunbliss-professional-header');
    if(professional)snapshotHeader();else restoreHeaderIfNeeded();
  }).observe(app,{childList:true,subtree:true});
}
})();