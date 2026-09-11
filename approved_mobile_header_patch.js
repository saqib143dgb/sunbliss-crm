(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='sunblissApprovedMobileHeaderStyles';
  style.textContent=`
    @media(max-width:480px){
      .topbar.sunbliss-professional-header{
        min-height:198px!important;
        height:198px!important;
        overflow:hidden!important;
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
        background-repeat:no-repeat!important;
        background-size:100% 100%!important;
        background-position:center center!important;
        box-shadow:0 12px 28px rgba(2,9,15,.22)!important;
      }

      .topbar.sunbliss-professional-header::before,
      .topbar.sunbliss-professional-header::after{
        content:none!important;
        display:none!important;
        background:none!important;
        box-shadow:none!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-top,
      .topbar.sunbliss-professional-header .sb-pro-main{
        opacity:0!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand{
        pointer-events:none!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-main{
        pointer-events:none!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-signout{
        pointer-events:auto!important;
      }
    }
  `;

  var existing=document.getElementById(style.id);
  if(existing)existing.remove();
  document.head.appendChild(style);
})();
