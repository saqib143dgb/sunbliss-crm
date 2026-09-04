(function(){
  'use strict';
  if(window.__sunblissDesktopReferenceImageExact)return;
  window.__sunblissDesktopReferenceImageExact=true;

  var style=document.createElement('style');
  style.id='sunblissDesktopReferenceImageExactStyle';
  style.textContent=`
    @media(min-width:1280px){
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
        --sb-desktop-header-h:clamp(390px,28.4vw,436px)!important;
        width:calc(100% - 48px)!important;
        height:var(--sb-desktop-header-h)!important;
        min-height:var(--sb-desktop-header-h)!important;
        max-height:436px!important;
        margin:32px 24px 0!important;
        padding:34px 20px 30px 40px!important;
        border:1px solid rgba(224,170,78,.76)!important;
        border-radius:25px!important;
        background:linear-gradient(118deg,#061521 0%,#081a29 57%,#091b2a 100%)!important;
        box-shadow:0 14px 34px rgba(2,9,15,.14),inset 0 1px 0 rgba(255,231,184,.05)!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before{
        background:
          linear-gradient(90deg,rgba(3,13,22,.99) 0%,rgba(3,13,22,.98) 28%,rgba(3,13,22,.88) 39%,rgba(3,13,22,.47) 53%,rgba(3,13,22,.10) 73%,rgba(3,13,22,.02) 100%),
          radial-gradient(ellipse 44% 66% at 70% 52%,rgba(198,151,46,.09),transparent 74%)!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{
        left:48%!important;
        right:-3%!important;
        bottom:-21%!important;
        height:56%!important;
        background:repeating-radial-gradient(ellipse at 100% 100%,transparent 0 27px,rgba(214,162,70,.12) 28px 29px,transparent 30px 53px)!important;
        opacity:.68!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual{
        left:44%!important;
        background-size:cover!important;
        background-position:center 61%!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual:after{
        background:
          linear-gradient(90deg,#071723 0%,rgba(7,23,35,.82) 12%,rgba(7,23,35,.34) 34%,rgba(7,23,35,.05) 64%,rgba(7,23,35,.01) 82%),
          linear-gradient(180deg,rgba(3,12,20,.07),transparent 46%,rgba(3,12,20,.24))!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-top{
        min-height:78px!important;
        align-items:flex-start!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand{
        max-width:54%!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
        display:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{
        color:#e3ad50!important;
        font:600 38px/1 Fraunces,Georgia,'Times New Roman',serif!important;
        letter-spacing:.095em!important;
        text-shadow:0 2px 14px rgba(214,162,70,.12)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{
        margin-top:10px!important;
        color:rgba(229,180,91,.94)!important;
        font:600 10px/1.2 Inter,system-ui,sans-serif!important;
        letter-spacing:.17em!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
        position:absolute!important;
        z-index:6!important;
        top:26px!important;
        right:0!important;
        align-items:flex-start!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{
        height:50px!important;
        padding:0 20px!important;
        gap:10px!important;
        border:1px solid rgba(224,170,78,.82)!important;
        border-radius:15px!important;
        background:rgba(3,13,22,.31)!important;
        color:#fff0d1!important;
        font:600 16px/1 Inter,system-ui,sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.09),0 9px 24px rgba(1,8,14,.15)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout svg{
        width:22px!important;
        height:22px!important;
        stroke:#e3ad50!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{
        margin-top:25px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
        width:650px!important;
        min-width:650px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{
        margin:0 0 8px!important;
        color:#e2b158!important;
        font:500 17px/1.3 Inter,system-ui,sans-serif!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name-row{
        gap:22px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{
        color:#fff3dd!important;
        font:500 64px/.98 Fraunces,Georgia,'Times New Roman',serif!important;
        letter-spacing:-.026em!important;
        text-shadow:0 3px 13px rgba(0,0,0,.48)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{
        min-height:44px!important;
        padding:0 18px!important;
        border:1px solid rgba(224,170,78,.92)!important;
        border-radius:999px!important;
        background:rgba(5,18,29,.30)!important;
        color:#e5b45a!important;
        font:650 14px/1 Inter,system-ui,sans-serif!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{
        width:438px!important;
        height:116px!important;
        min-height:116px!important;
        margin-top:31px!important;
        padding:15px 18px!important;
        gap:0!important;
        box-sizing:border-box!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row:before{
        border:1px solid rgba(224,170,78,.70)!important;
        border-radius:18px!important;
        background:linear-gradient(90deg,rgba(5,18,29,.71),rgba(5,18,29,.43))!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.04),0 11px 26px rgba(1,8,14,.12)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project{
        gap:18px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{
        width:104px!important;
        height:80px!important;
        flex:0 0 104px!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{
        width:76px!important;
        height:76px!important;
        stroke:#e2ad51!important;
        stroke-width:1.45!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-name{
        color:#fff2dc!important;
        font:600 25px/1.08 Fraunces,Georgia,'Times New Roman',serif!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-sub{
        margin-top:9px!important;
        color:rgba(201,193,177,.76)!important;
        font:500 16px/1 Inter,system-ui,sans-serif!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{
        right:30px!important;
        bottom:31px!important;
        height:60px!important;
        gap:12px!important;
        padding:0 24px!important;
        border:1px solid rgba(224,170,78,.72)!important;
        border-radius:17px!important;
        background:rgba(3,13,22,.67)!important;
        color:#fff2dc!important;
        font:550 16px/1 Inter,system-ui,sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.05),0 9px 24px rgba(1,8,14,.15)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync svg{
        width:28px!important;
        height:28px!important;
        stroke:#65bd62!important;
        stroke-width:2.4!important;
      }

      body.sunbliss-ref-desktop main#main{
        min-height:calc(100vh - var(--sb-desktop-header-h) - 32px)!important;
      }
    }

    @media(min-width:1024px) and (max-width:1279px){
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
        --sb-desktop-header-h:360px!important;
        width:calc(100% - 36px)!important;
        height:var(--sb-desktop-header-h)!important;
        min-height:var(--sb-desktop-header-h)!important;
        max-height:360px!important;
        margin:18px 18px 0!important;
        padding:28px 24px 26px 28px!important;
        border-radius:21px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{font-size:31px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{font-size:8px!important;letter-spacing:.13em!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{position:absolute!important;top:21px!important;right:0!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{height:44px!important;padding:0 16px!important;font-size:12px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{margin-top:17px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{width:490px!important;min-width:490px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{font-size:14px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{font-size:48px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{min-height:36px!important;padding:0 14px!important;font-size:11px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{width:410px!important;height:96px!important;min-height:96px!important;margin-top:24px!important;padding:10px 14px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{width:78px!important;height:68px!important;flex-basis:78px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{width:60px!important;height:60px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-name{font-size:21px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-sub{font-size:13px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{right:24px!important;bottom:24px!important;height:48px!important;padding:0 18px!important;border-color:rgba(224,170,78,.72)!important;border-radius:14px!important;font-size:12px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync svg{width:21px!important;height:21px!important}
      body.sunbliss-ref-desktop main#main{min-height:calc(100vh - var(--sb-desktop-header-h) - 18px)!important}
    }
  `;
  document.head.appendChild(style);
})();