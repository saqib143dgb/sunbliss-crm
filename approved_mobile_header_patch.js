(function(){
  'use strict';

  var style=document.createElement('style');
  style.id='sunblissApprovedMobileHeaderStyles';
  style.textContent=`
    @media(max-width:720px){
      html body #app .topbar.sunbliss-professional-header{
        min-height:198px!important;
        height:198px!important;
        overflow:hidden!important;
        position:relative!important;
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-skyline-6bf2fc29.jpeg')!important;
        background-repeat:no-repeat!important;
        background-size:cover!important;
        background-position:center center!important;
        box-shadow:0 12px 28px rgba(2,9,15,.22)!important;
      }

      html body #app .topbar.sunbliss-professional-header::before,
      html body #app .topbar.sunbliss-professional-header::after{
        content:none!important;
        display:none!important;
        background:none!important;
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
