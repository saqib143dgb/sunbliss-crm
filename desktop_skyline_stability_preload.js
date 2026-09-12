(function(){
  'use strict';
  if(document.getElementById('sunblissDesktopSkylineStabilityPreload'))return;

  /* Exact approved desktop header artwork already stored in this repository.
     Keep it as the visual background only; all company/user/project/sync/sign-out
     content remains live CRM HTML rendered above it. */
  var APPROVED_DESKTOP_BG='https://raw.githubusercontent.com/saqib143dgb/sunbliss-crm/main/assets/sunbliss-desktop-header-night.webp?v=6e607ff6fbef8f319ae56aeb2e268b2d4100edd7';

  if(!document.getElementById('sunblissDesktopApprovedHeaderPreload')){
    var preload=document.createElement('link');
    preload.id='sunblissDesktopApprovedHeaderPreload';
    preload.rel='preload';
    preload.as='image';
    preload.href=APPROVED_DESKTOP_BG;
    preload.fetchPriority='high';
    document.head.appendChild(preload);
  }

  var style=document.createElement('style');
  style.id='sunblissDesktopSkylineStabilityPreload';
  style.textContent=`
    @media(min-width:1024px){
      /* One desktop visual source only. Mobile remains untouched. */
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-visual,
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        animation:none!important;
        transition:none!important;
      }

      html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header{
        position:relative!important;
        overflow:hidden!important;
        isolation:isolate!important;
        background:#06131f!important;
      }

      /* Approved artwork is background-only. The restrained dark veil keeps the
         live CRM text/buttons readable while preserving the image itself. */
      html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header::before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        z-index:0!important;
        pointer-events:none!important;
        opacity:1!important;
        transform:none!important;
        border:0!important;
        outline:0!important;
        box-shadow:none!important;
        background-image:
          linear-gradient(90deg,rgba(2,10,17,.82) 0%,rgba(2,10,17,.69) 29%,rgba(2,10,17,.44) 54%,rgba(2,10,17,.22) 77%,rgba(2,10,17,.13) 100%),
          url('${APPROVED_DESKTOP_BG}')!important;
        background-repeat:no-repeat,no-repeat!important;
        background-size:cover,cover!important;
        background-position:center center,center center!important;
      }

      /* Remove the former line-art/duplicate skyline ornaments. */
      html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
        content:none!important;
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        background:none!important;
        filter:none!important;
        -webkit-mask-image:none!important;
        mask-image:none!important;
      }

      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header > .sb-pro-top,
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header > .sb-pro-main,
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header > .sb-pro-actions,
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header > .sb-pro-sync{
        position:relative!important;
        z-index:2!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
