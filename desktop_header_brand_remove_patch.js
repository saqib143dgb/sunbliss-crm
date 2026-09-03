(function(){
  'use strict';
  if(document.getElementById('sunblissDesktopHeaderBrandRemoveStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissDesktopHeaderBrandRemoveStyle';
  style.textContent=`
    @media(min-width:1024px){
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand{
        display:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
        margin-left:auto!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
