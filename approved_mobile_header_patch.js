(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='sunblissApprovedMobileHeaderStyles';
  style.textContent=`
    @media(max-width:480px){
      html body #app .topbar.sunbliss-professional-header{
        min-height:198px!important;
        height:auto!important;
        overflow:hidden!important;
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
        background-repeat:no-repeat!important;
        /* Crop the approved artwork to its clean Dubai skyline + Sunbliss area only.
           This keeps all baked-in labels, logo and buttons outside the visible crop. */
        background-size:220% auto!important;
        background-position:100% 50%!important;
        box-shadow:0 12px 28px rgba(2,9,15,.22)!important;
      }

      /* Keep the real CRM header UI live and dynamic above the background. */
      html body #app .topbar.sunbliss-professional-header .sb-pro-top,
      html body #app .topbar.sunbliss-professional-header .sb-pro-main{
        opacity:1!important;
        visibility:visible!important;
        position:relative!important;
        z-index:3!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-brand,
      html body #app .topbar.sunbliss-professional-header .sb-pro-main,
      html body #app .topbar.sunbliss-professional-header .sb-pro-signout{
        pointer-events:auto!important;
      }
    }

    /* Extra zoom on narrower phones keeps the crop clear of the baked artwork. */
    @media(max-width:370px){
      html body #app .topbar.sunbliss-professional-header{
        background-size:245% auto!important;
        background-position:100% 50%!important;
      }
    }
  `;

  var existing=document.getElementById(style.id);
  if(existing)existing.remove();
  document.head.appendChild(style);
})();
