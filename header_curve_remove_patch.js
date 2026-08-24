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
      min-height:304px!important;
      padding:16px 22px 22px!important;
    }
    .sunbliss-hero-copy{
      margin-top:28px!important;
    }
    .sunbliss-project-line{
      margin-top:14px!important;
    }
    .sunbliss-hero-art{
      top:58px!important;
      height:246px!important;
    }
    .sunbliss-hero-line{
      top:164px!important;
    }
    .sunbliss-hero-signout{
      bottom:24px!important;
    }

    @media(max-width:720px){
      .topbar.sunbliss-premium-header{
        min-height:264px!important;
        padding:11px 12px 18px!important;
      }
      .sunbliss-header-top{
        gap:6px!important;
      }
      .sunbliss-reference-brand-mark{
        width:31px!important;
        height:36px!important;
      }
      .sunbliss-reference-brand-name{
        font-size:12px!important;
      }
      .sunbliss-reference-brand-sub{
        margin-top:3px!important;
        font-size:4.2px!important;
      }
      .sunbliss-sync-pill{
        height:34px!important;
        min-width:108px!important;
        padding:0 8px!important;
        font-size:9.8px!important;
      }
      .sunbliss-bell{
        width:34px!important;
        height:34px!important;
      }
      .sunbliss-hero-copy{
        max-width:77%!important;
        margin-top:24px!important;
      }
      .sunbliss-welcome{
        margin-bottom:4px!important;
        font-size:12px!important;
      }
      .sunbliss-name-line h1{
        font-size:25px!important;
      }
      .sunbliss-role-pill{
        min-height:26px!important;
        padding:0 9px!important;
        font-size:9px!important;
      }
      .sunbliss-project-line{
        margin-top:11px!important;
        font-size:13px!important;
      }
      .sunbliss-project-line svg{
        width:16px!important;
        height:16px!important;
      }
      .sunbliss-hero-art{
        top:62px!important;
        right:-118px!important;
        width:350px!important;
        height:202px!important;
      }
      .sunbliss-hero-shade::after{
        top:76px!important;
      }
      .sunbliss-hero-line{
        top:143px!important;
      }
      .sunbliss-hero-signout{
        right:12px!important;
        bottom:17px!important;
        height:36px!important;
        min-width:96px!important;
        padding:0 11px!important;
        font-size:10.8px!important;
      }
    }

    @media(max-width:385px){
      .topbar.sunbliss-premium-header{
        min-height:258px!important;
      }
      .sunbliss-reference-brand-mark{
        width:29px!important;
        height:34px!important;
      }
      .sunbliss-reference-brand-name{
        font-size:11px!important;
      }
      .sunbliss-sync-pill{
        min-width:101px!important;
        font-size:9.2px!important;
      }
      .sunbliss-hero-copy{
        margin-top:22px!important;
      }
      .sunbliss-name-line h1{
        font-size:23px!important;
      }
      .sunbliss-project-line{
        font-size:12.5px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
