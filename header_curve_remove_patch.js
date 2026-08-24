(function(){
  'use strict';
  if (window.__sunblissHeaderCurveRemoveInstalled) return;
  window.__sunblissHeaderCurveRemoveInstalled = true;

  var style=document.createElement('style');
  style.id='sunblissHeaderCurveRemoveStyles';
  style.textContent=`
    .sunbliss-hero-curve,
    .sunbliss-curve-medallion{
      display:none!important;
    }

    .topbar.sunbliss-premium-header{
      min-height:338px!important;
      padding-bottom:30px!important;
    }

    @media(max-width:720px){
      .topbar.sunbliss-premium-header{
        min-height:305px!important;
        padding-bottom:28px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
