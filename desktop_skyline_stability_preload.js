(function(){
  'use strict';

  /* Preload the approved, unchanged image from this deployment. The desktop
     stylesheet frames its banner; existing CRM nodes supply live text/actions. */
  var APPROVED_DESKTOP_BG='assets/sunbliss-desktop-header-approved-20260914.png';

  if(document.getElementById('sunblissDesktopApprovedHeaderPreload'))return;

  var preload=document.createElement('link');
  preload.id='sunblissDesktopApprovedHeaderPreload';
  preload.rel='preload';
  preload.as='image';
  preload.media='(min-width: 1024px)';
  preload.href=APPROVED_DESKTOP_BG;
  preload.fetchPriority='high';
  document.head.appendChild(preload);
})();
