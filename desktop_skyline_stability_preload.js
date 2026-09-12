(function(){
  'use strict';

  /* Preload only. Do not style the desktop header here.
     The approved desktop header implementation is owned by the later CRM patch,
     which uses this exact immutable artwork and keeps all text/actions live. */
  var APPROVED_DESKTOP_BG='https://raw.githubusercontent.com/saqib143dgb/sunbliss-crm/3bd49b6efe227932e1f5db3968b4e8582b588232/assets/sunbliss-desktop-header-night.webp';

  if(document.getElementById('sunblissDesktopApprovedHeaderPreload'))return;

  var preload=document.createElement('link');
  preload.id='sunblissDesktopApprovedHeaderPreload';
  preload.rel='preload';
  preload.as='image';
  preload.href=APPROVED_DESKTOP_BG;
  preload.fetchPriority='high';
  document.head.appendChild(preload);
})();
