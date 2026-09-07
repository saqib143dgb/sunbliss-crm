(function(){
  'use strict';
  if(window.__sunblissDesktopReferenceImageExact)return;
  window.__sunblissDesktopReferenceImageExact=true;

  var style=document.createElement('style');
  style.id='sunblissDesktopReferenceImageExactStyle';
  style.textContent=`
    @media(min-width:1024px){
      body.sunbliss-ref-desktop{
        --sb-desktop-header-h:176px;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
        --sb-desktop-header-h:176px!important;
        position:relative!important;
        width:100%!important;
        height:var(--sb-desktop-header-h)!important;
        min-height:var(--sb-desktop-header-h)!important;
        max-height:var(--sb-desktop-header-h)!important;
        margin:0!important;
        padding:18px 28px 18px 34px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        border:0!important;
        border-bottom:1px solid rgba(224,170,78,.42)!important;
        border-radius:0!important;
        color:#f8f4ea!important;
        background:linear-gradient(112deg,#061521 0%,#081a29 56%,#091b2a 100%)!important;
        box-shadow:0 8px 24px rgba(2,9,15,.13)!important;
        isolation:isolate!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        z-index:1!important;
        width:auto!important;
        height:auto!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        background:
          linear-gradient(90deg,rgba(3,13,22,.985) 0%,rgba(3,13,22,.95) 30%,rgba(3,13,22,.78) 43%,rgba(3,13,22,.27) 62%,rgba(3,13,22,.04) 82%,rgba(3,13,22,.015) 100%),
          radial-gradient(ellipse 35% 76% at 70% 48%,rgba(198,151,46,.07),transparent 75%)!important;
        pointer-events:none!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{
        content:''!important;
        display:block!important;
        position:absolute!important;
        z-index:2!important;
        left:48%!important;
        right:-2%!important;
        top:auto!important;
        bottom:-48%!important;
        width:auto!important;
        height:78%!important;
        border:0!important;
        border-radius:0!important;
        background:repeating-radial-gradient(ellipse at 100% 100%,transparent 0 24px,rgba(214,162,70,.10) 25px 26px,transparent 27px 47px)!important;
        opacity:.6!important;
        pointer-events:none!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual{
        display:block!important;
        position:absolute!important;
        z-index:0!important;
        top:0!important;
        right:7.5%!important;
        bottom:0!important;
        left:58%!important;
        background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
        background-repeat:no-repeat!important;
        background-size:auto 175%!important;
        background-position:72% 66%!important;
        pointer-events:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual:after{
        content:''!important;
        position:absolute!important;
        inset:0!important;
        background:linear-gradient(90deg,#071723 0%,rgba(7,23,35,.63) 15%,rgba(7,23,35,.13) 45%,rgba(7,23,35,.015) 72%),linear-gradient(180deg,rgba(3,12,20,.04),transparent 48%,rgba(3,12,20,.18))!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-top,
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-main{
        position:relative!important;
        z-index:4!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-top{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:space-between!important;
        min-height:42px!important;
        height:42px!important;
        gap:18px!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand{
        display:flex!important;
        flex-direction:row!important;
        align-items:flex-start!important;
        justify-content:flex-start!important;
        width:auto!important;
        max-width:34%!important;
        min-width:0!important;
        gap:0!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{display:none!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-copy{
        display:flex!important;
        flex-direction:column!important;
        justify-content:flex-start!important;
        width:auto!important;
        max-width:none!important;
        min-width:0!important;
        height:auto!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{
        display:block!important;
        margin:0!important;
        color:#e3ad50!important;
        font:600 24px/1 Fraunces,Georgia,'Times New Roman',serif!important;
        letter-spacing:.095em!important;
        white-space:nowrap!important;
        text-shadow:0 2px 12px rgba(214,162,70,.10)!important;
        transform:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{
        display:block!important;
        width:100%!important;
        margin-top:7px!important;
        padding:0!important;
        color:rgba(229,180,91,.94)!important;
        font:600 7px/1.15 Inter,system-ui,sans-serif!important;
        letter-spacing:.12em!important;
        white-space:nowrap!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
        position:absolute!important;
        z-index:7!important;
        top:0!important;
        right:0!important;
        display:flex!important;
        align-items:flex-start!important;
        justify-content:flex-end!important;
        flex:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{
        height:36px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:7px!important;
        padding:0 13px!important;
        border:1px solid rgba(224,170,78,.76)!important;
        border-radius:11px!important;
        background:rgba(3,13,22,.42)!important;
        color:#fff0d1!important;
        font:600 10.5px/1 Inter,system-ui,sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.07),0 6px 16px rgba(1,8,14,.13)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        backdrop-filter:blur(7px)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout svg{
        width:16px!important;
        height:16px!important;
        stroke:#e3ad50!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{
        display:flex!important;
        align-items:center!important;
        margin-top:10px!important;
        height:88px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main:before{display:none!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
        display:grid!important;
        grid-template-columns:minmax(300px,390px) 300px!important;
        grid-template-areas:'welcome project' 'name project'!important;
        grid-template-rows:22px 46px!important;
        align-items:center!important;
        column-gap:38px!important;
        width:min(760px,61%)!important;
        min-width:620px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{
        grid-area:welcome!important;
        align-self:end!important;
        margin:0 0 2px!important;
        color:#e2b158!important;
        font:500 11px/1.2 Inter,system-ui,sans-serif!important;
        letter-spacing:.01em!important;
        text-shadow:0 2px 7px rgba(0,0,0,.50)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name-row{
        grid-area:name!important;
        display:flex!important;
        align-items:center!important;
        gap:12px!important;
        flex-wrap:nowrap!important;
        white-space:nowrap!important;
        min-width:0!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{
        margin:0!important;
        color:#fff3dd!important;
        font:500 36px/.98 Fraunces,Georgia,'Times New Roman',serif!important;
        letter-spacing:-.022em!important;
        white-space:nowrap!important;
        text-shadow:0 2px 10px rgba(0,0,0,.44)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{
        min-height:30px!important;
        display:inline-flex!important;
        align-items:center!important;
        padding:0 11px!important;
        border:1px solid rgba(224,170,78,.88)!important;
        border-radius:999px!important;
        background:rgba(5,18,29,.34)!important;
        color:#e5b45a!important;
        font:650 9.5px/1 Inter,system-ui,sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.05)!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{
        grid-area:project!important;
        position:relative!important;
        isolation:isolate!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        width:300px!important;
        height:68px!important;
        min-height:68px!important;
        margin:0!important;
        padding:8px 12px!important;
        gap:0!important;
        box-sizing:border-box!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row:before{
        content:''!important;
        position:absolute!important;
        inset:0!important;
        z-index:-1!important;
        border:1px solid rgba(224,170,78,.62)!important;
        border-radius:13px!important;
        background:linear-gradient(90deg,rgba(5,18,29,.72),rgba(5,18,29,.40))!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.035),0 7px 18px rgba(1,8,14,.10)!important;
        -webkit-backdrop-filter:blur(6px)!important;
        backdrop-filter:blur(6px)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project{
        display:flex!important;
        align-items:center!important;
        gap:11px!important;
        width:100%!important;
        min-width:0!important;
        color:#f5f0e6!important;
        text-shadow:0 2px 7px rgba(0,0,0,.54)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{
        width:46px!important;
        height:46px!important;
        flex:0 0 46px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{
        width:39px!important;
        height:39px!important;
        stroke:#e2ad51!important;
        stroke-width:1.5!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-copy{
        display:flex!important;
        flex-direction:column!important;
        min-width:0!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-name,
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project>span:not(.sb-pro-project-icon):not(.sb-pro-project-sep){
        color:#fff2dc!important;
        font:600 14px/1.08 Fraunces,Georgia,'Times New Roman',serif!important;
        white-space:nowrap!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-sub{
        display:block!important;
        margin-top:4px!important;
        color:rgba(201,193,177,.76)!important;
        font:500 10px/1 Inter,system-ui,sans-serif!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-sep{display:none!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row>.sb-pro-sync{display:none!important}

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{
        position:absolute!important;
        z-index:7!important;
        right:28px!important;
        bottom:18px!important;
        top:auto!important;
        left:auto!important;
        transform:none!important;
        height:36px!important;
        display:flex!important;
        align-items:center!important;
        gap:7px!important;
        padding:0 13px!important;
        border:1px solid rgba(224,170,78,.68)!important;
        border-radius:11px!important;
        background:rgba(3,13,22,.66)!important;
        color:#fff2dc!important;
        font:550 10px/1 Inter,system-ui,sans-serif!important;
        white-space:nowrap!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.04),0 6px 16px rgba(1,8,14,.13)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        backdrop-filter:blur(7px)!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync svg{
        width:16px!important;
        height:16px!important;
        stroke:#65bd62!important;
        stroke-width:2.2!important;
      }

      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-sync,
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-tagline,
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-dubai-skyline{display:none!important}

      body.sunbliss-ref-desktop main#main{
        min-height:calc(100vh - var(--sb-desktop-header-h))!important;
      }
    }

    @media(min-width:1024px) and (max-width:1279px){
      body.sunbliss-ref-desktop{--sb-desktop-header-h:164px}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
        --sb-desktop-header-h:164px!important;
        height:164px!important;
        min-height:164px!important;
        max-height:164px!important;
        padding:16px 22px 16px 26px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-top{height:38px!important;min-height:38px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{font-size:21px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{font-size:6.3px!important;margin-top:6px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{height:34px!important;padding:0 11px!important;font-size:9.5px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{height:82px!important;margin-top:8px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
        grid-template-columns:minmax(270px,330px) 260px!important;
        grid-template-rows:20px 43px!important;
        column-gap:24px!important;
        width:min(650px,68%)!important;
        min-width:555px!important;
      }
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{font-size:10px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{font-size:31px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{min-height:27px!important;padding:0 10px!important;font-size:8.5px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{width:260px!important;height:62px!important;min-height:62px!important;padding:7px 10px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{width:40px!important;height:40px!important;flex-basis:40px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{width:34px!important;height:34px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-name,
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project>span:not(.sb-pro-project-icon):not(.sb-pro-project-sep){font-size:12.5px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-sub{font-size:9px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{right:22px!important;bottom:16px!important;height:34px!important;padding:0 11px!important;font-size:9px!important}
      body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual{left:57%!important;right:7%!important;background-size:auto 185%!important;background-position:72% 66%!important}
      body.sunbliss-ref-desktop main#main{min-height:calc(100vh - 164px)!important}
    }
  `;
  document.head.appendChild(style);
})();