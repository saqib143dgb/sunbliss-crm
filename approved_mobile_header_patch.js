(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='sunblissApprovedMobileHeaderStyles';
  style.textContent=`
    @media(max-width:480px){
      html body #app .topbar.sunbliss-professional-header{
        min-height:198px!important;
        height:198px!important;
        overflow:hidden!important;
        position:relative!important;
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-header-clean.avif')!important;
        background-repeat:no-repeat!important;
        background-size:cover!important;
        background-position:center center!important;
        box-shadow:0 12px 28px rgba(2,9,15,.22)!important;
      }

      html body #app .topbar.sunbliss-professional-header::before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        width:auto!important;
        height:auto!important;
        border:0!important;
        border-radius:0!important;
        background:linear-gradient(90deg,rgba(4,14,23,.72) 0%,rgba(4,14,23,.48) 31%,rgba(4,14,23,.16) 58%,rgba(4,14,23,.03) 100%)!important;
        box-shadow:none!important;
        z-index:1!important;
        pointer-events:none!important;
      }

      html body #app .topbar.sunbliss-professional-header::after{
        content:none!important;
        display:none!important;
      }

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
  `;

  var existing=document.getElementById(style.id);
  if(existing)existing.remove();
  document.head.appendChild(style);
})();
