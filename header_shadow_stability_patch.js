(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderShadowStabilityStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissHeaderShadowStabilityStyle';
  style.textContent=`
    @media(max-width:720px){
      /* Keep only the inset treatment on the header itself. The external drop
         shadow is painted by body::after so it survives route/tab re-renders
         even when the .topbar node is replaced for a frame. */
      html body #app .topbar{
        animation:none!important;
        transition:none!important;
        box-shadow:
          inset 0 0 0 1px rgba(224,170,78,.16),
          inset 0 -34px 54px rgba(1,8,14,.20)!important;
      }

      html body::after{
        content:'';
        position:absolute;
        top:220px;
        left:50%;
        width:min(100%,640px);
        height:1px;
        transform:translateX(-50%);
        pointer-events:none;
        z-index:20;
        box-shadow:0 14px 34px rgba(2,9,15,.24);
      }
    }
  `;
  document.head.appendChild(style);
})();
