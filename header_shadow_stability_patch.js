(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderShadowStabilityStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissHeaderShadowStabilityStyle';
  style.textContent=`
    @media(max-width:720px){
      html body #app .topbar{
        animation:none!important;
        transition:none!important;
        box-shadow:
          inset 0 0 0 1px rgba(224,170,78,.16),
          inset 0 -34px 54px rgba(1,8,14,.20),
          0 14px 34px rgba(2,9,15,.24)!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
