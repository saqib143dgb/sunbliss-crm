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

      html body #app .topbar.sunbliss-professional-header .sb-pro-role{
        min-height:26px!important;
        padding:0 10px!important;
        border:1px solid rgba(244,204,126,.60)!important;
        border-radius:999px!important;
        background:rgba(18,33,49,.50)!important;
        -webkit-backdrop-filter:blur(10px) saturate(140%)!important;
        backdrop-filter:blur(10px) saturate(140%)!important;
        color:#ffe2a3!important;
        font:700 10px/1 Inter,system-ui,sans-serif!important;
        white-space:nowrap!important;
        flex-shrink:0!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(0,0,0,.12),0 2px 7px rgba(0,0,0,.18)!important;
        text-shadow:0 1px 2px rgba(0,0,0,.85)!important;
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
