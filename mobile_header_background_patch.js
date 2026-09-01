(function(){
  'use strict';
  if(document.getElementById('sunblissMobileHeaderBackgroundStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissMobileHeaderBackgroundStyles';
  style.textContent=`
    @media(max-width:720px){
      .topbar.sunbliss-professional-header{
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
        background-repeat:no-repeat!important;
        background-size:auto 82%!important;
        background-position:right 16px bottom!important;
      }
      .topbar.sunbliss-professional-header::before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        width:auto!important;
        height:auto!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        background:linear-gradient(90deg,rgba(3,12,20,.82) 0%,rgba(3,12,20,.64) 52%,rgba(3,12,20,.30) 100%)!important;
        pointer-events:none!important;
        z-index:1!important;
      }
      .topbar.sunbliss-professional-header::after{z-index:2!important;}
      .topbar.sunbliss-professional-header .sb-pro-signout,
      .topbar.sunbliss-professional-header .sb-pro-sync{
        background:transparent!important;
        border-color:rgba(214,162,70,.68)!important;
        box-shadow:none!important;
        -webkit-backdrop-filter:none!important;
        backdrop-filter:none!important;
      }
      .topbar.sunbliss-professional-header .sb-pro-sync{color:rgba(255,250,240,.90)!important;}
      .topbar.sunbliss-professional-header .sb-pro-name,
      .topbar.sunbliss-professional-header .sb-pro-project,
      .topbar.sunbliss-professional-header .sb-pro-welcome{text-shadow:0 2px 8px rgba(0,0,0,.72)!important;}
      .topbar.sunbliss-professional-header .sb-dubai-skyline{display:none!important;}
    }
  `;
  document.head.appendChild(style);
})();