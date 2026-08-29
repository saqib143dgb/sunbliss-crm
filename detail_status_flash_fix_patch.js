(function(){
'use strict';
if(window.__sunblissDetailStatusFlashFixInstalled)return;
window.__sunblissDetailStatusFlashFixInstalled=true;

var style=document.createElement('style');
style.id='detailStatusFlashFixStyles';
style.textContent=[
  '.detail #customerNotesCard{display:none!important}',
  '.detail,.detail *{animation:none!important;transition:none!important}',
  '.detail #actionRequiredCard,.detail #activeCustomerNoteCard,.detail #scheduledActionsDetail,.detail #detailAttentionPills{animation:none!important;transition:none!important}',
  '.detail .stage-card,.detail .action-required-card,.detail .scheduled-task-card,.detail #activeCustomerNoteCard,.detail #customerNotesCard{backface-visibility:hidden!important;-webkit-backface-visibility:hidden!important}',
  '.detail .ledger-scroll{overflow-anchor:none!important}',
  '.topbar{animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}',
  '.topbar.sunbliss-professional-header *{animation:none!important;transition:none!important}'
].join('');document.head.appendChild(style);

var cachedHeader=null,restoring=false;
function bindSignout(header){var button=header&&header.querySelector('#btnSignOut');if(!button||button.dataset.flashFixBound==='1')return;button.dataset.flashFixBound='1';button.addEventListener('click',async function(){button.disabled=true;try{if(window.sb&&sb.auth)await sb.auth.signOut();}finally{location.reload();}})}
function snapshotHeader(){var header=document.querySelector('.topbar.sunbliss-professional-header');if(!header)return;cachedHeader={className:header.className,html:header.innerHTML,textV2Sig:header.dataset.textV2Sig||''}}
function restoreHeaderIfNeeded(){if(restoring||!cachedHeader)return;var header=document.querySelector('.topbar');if(!header)return;if(header.classList.contains('sunbliss-professional-header')){snapshotHeader();bindSignout(header);return}restoring=true;try{header.className=cachedHeader.className;header.innerHTML=cachedHeader.html;if(cachedHeader.textV2Sig)header.dataset.textV2Sig=cachedHeader.textV2Sig;bindSignout(header)}finally{restoring=false}}
function afterRender(){restoreHeaderIfNeeded();snapshotHeader()}
function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissFlashStableWrapped)return;function wrapped(){snapshotHeader();var out=original.apply(this,arguments);afterRender();return out}wrapped.__sunblissFlashStableWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped}
function install(){snapshotHeader();wrap('render');wrap('renderMain');wrap('renderDetail');window.addEventListener('pageshow',afterRender);afterRender()}
install();
})();
