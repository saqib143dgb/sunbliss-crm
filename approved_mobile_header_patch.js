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
        border:1px solid rgba(224,170,78,.18)!important;
        border-radius:12px!important;
        background:linear-gradient(90deg,rgba(18,39,56,.71),rgba(11,29,45,.41))!important;
        -webkit-backdrop-filter:blur(6px)!important;
        backdrop-filter:blur(6px)!important;
        color:#f1d28a!important;
        white-space:nowrap!important;
        flex-shrink:0!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.055),0 10px 28px rgba(1,8,14,.16)!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-signout{
        height:27px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:5px!important;
        padding:0 7px!important;
        border:1px solid rgba(224,170,78,.18)!important;
        border-radius:10px!important;
        background:linear-gradient(90deg,rgba(18,39,56,.71),rgba(11,29,45,.41))!important;
        color:#f1d28a!important;
        font:600 7.5px/1 Inter,system-ui,sans-serif!important;
        white-space:nowrap!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.055),0 10px 28px rgba(1,8,14,.16)!important;
        -webkit-backdrop-filter:blur(6px)!important;
        backdrop-filter:blur(6px)!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-signout svg{
        width:12px!important;
        height:12px!important;
        stroke:#f1d28a!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-sync{
        background:linear-gradient(90deg,rgba(18,39,56,.71),rgba(11,29,45,.41))!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-project-row::before{
        background:linear-gradient(90deg,rgba(18,39,56,.71),rgba(11,29,45,.41))!important;
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
