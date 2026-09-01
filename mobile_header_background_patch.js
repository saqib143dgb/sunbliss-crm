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
        background-size:cover!important;
        background-position:45% 50%!important;
      }
      .topbar.sunbliss-professional-header::before{display:none!important;}
      .topbar.sunbliss-professional-header .sb-dubai-skyline{display:none!important;}
    }
  `;
  document.head.appendChild(style);
})();