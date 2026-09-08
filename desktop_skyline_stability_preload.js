(function(){
  'use strict';
  if(document.getElementById('sunblissDesktopSkylineStabilityPreload'))return;

  /* Public-domain / CC0 Dubai skyline source:
     https://commons.wikimedia.org/wiki/File:Dubai-Skyline-2019.jpg */
  var SKYLINE_URL='https://upload.wikimedia.org/wikipedia/commons/0/07/Dubai-Skyline-2019.jpg';

  if(!document.getElementById('sunblissDesktopSkylineImagePreload')){
    var preload=document.createElement('link');
    preload.id='sunblissDesktopSkylineImagePreload';
    preload.rel='preload';
    preload.as='image';
    preload.href=SKYLINE_URL;
    preload.fetchPriority='high';
    document.head.appendChild(preload);
  }

  var style=document.createElement('style');
  style.id='sunblissDesktopSkylineStabilityPreload';
  style.textContent=`
    @media(min-width:1024px){
      /* Desktop header now has one visual source only: the Dubai skyline photo.
         Disable the former Sunbliss-building layer and both old skyline layers. */
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

      /* Full-width skyline photo with a restrained dark veil so the existing
         Purvanchal/user/actions typography stays readable. */
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
          linear-gradient(90deg,rgba(2,10,17,.84) 0%,rgba(2,10,17,.72) 30%,rgba(2,10,17,.50) 55%,rgba(2,10,17,.34) 78%,rgba(2,10,17,.28) 100%),
          url('${SKYLINE_URL}')!important;
        background-repeat:no-repeat,no-repeat!important;
        background-size:cover,cover!important;
        background-position:center center,center 54%!important;
      }

      /* Remove the previous line-art skyline ornament completely. */
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
