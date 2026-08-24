(function(){
  'use strict';

  if (window.__sunblissPremiumHeroRefineInstalled) return;
  window.__sunblissPremiumHeroRefineInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissPremiumHeroRefineStyles';
  style.textContent = `
    .sunbliss-hero-art{
      right:-6%!important;
      bottom:22px!important;
      width:60%!important;
      height:88%!important;
      border-radius:0!important;
      -webkit-mask-image:radial-gradient(ellipse 92% 96% at 68% 54%,#000 0%,#000 52%,rgba(0,0,0,.95) 63%,rgba(0,0,0,.70) 76%,rgba(0,0,0,.28) 89%,transparent 100%)!important;
      mask-image:radial-gradient(ellipse 92% 96% at 68% 54%,#000 0%,#000 52%,rgba(0,0,0,.95) 63%,rgba(0,0,0,.70) 76%,rgba(0,0,0,.28) 89%,transparent 100%)!important;
    }

    .sunbliss-brand-logo{
      width:140px!important;
      max-height:132px!important;
    }

    .sunbliss-curve-medallion{
      display:none!important;
    }

    @media(max-width:720px){
      .sunbliss-hero-art{
        right:-31%!important;
        bottom:24px!important;
        width:94%!important;
        height:76%!important;
        border-radius:0!important;
        -webkit-mask-image:radial-gradient(ellipse 95% 96% at 67% 56%,#000 0%,#000 50%,rgba(0,0,0,.94) 62%,rgba(0,0,0,.66) 76%,rgba(0,0,0,.24) 90%,transparent 100%)!important;
        mask-image:radial-gradient(ellipse 95% 96% at 67% 56%,#000 0%,#000 50%,rgba(0,0,0,.94) 62%,rgba(0,0,0,.66) 76%,rgba(0,0,0,.24) 90%,transparent 100%)!important;
      }

      .sunbliss-brand-logo{
        width:92px!important;
        max-height:100px!important;
      }
    }

    @media(max-width:385px){
      .sunbliss-brand-logo{
        width:84px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
