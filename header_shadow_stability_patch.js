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

  /*
    Startup safety: the KPI reconciliation patch may temporarily add
    sbx-overview-data-pending. That state must never own the whole application
    before authentication exists, and it must never be able to hold the boot
    loader forever if a reconciliation request fails or is interrupted.
  */
  var root=document.documentElement;
  var financialGateTimer=null;

  function authenticatedOverview(){
    return !!(window.state&&state.userRole&&state.view==='overview');
  }

  function releaseStaleFinancialGate(){
    if(!root.classList.contains('sbx-overview-data-pending'))return;
    if(!authenticatedOverview()||window.__sunblissOverviewFinancialReady===true){
      root.classList.remove('sbx-overview-data-pending');
    }
  }

  function armFinancialGateLimit(){
    window.clearTimeout(financialGateTimer);
    financialGateTimer=window.setTimeout(function(){
      root.classList.remove('sbx-overview-data-pending');
    },2500);
  }

  document.addEventListener('sunbliss:overview-financial-loading',function(){
    if(!authenticatedOverview()){
      window.setTimeout(releaseStaleFinancialGate,0);
      return;
    }
    armFinancialGateLimit();
  });

  document.addEventListener('sunbliss:overview-financial-ready',function(){
    window.clearTimeout(financialGateTimer);
    root.classList.remove('sbx-overview-data-pending');
  });

  if(window.MutationObserver){
    new MutationObserver(function(){
      releaseStaleFinancialGate();
    }).observe(root,{attributes:true,attributeFilter:['class']});
  }

  window.setTimeout(releaseStaleFinancialGate,0);
  window.setTimeout(function(){
    root.classList.remove('sbx-overview-data-pending');
  },4000);
})();
