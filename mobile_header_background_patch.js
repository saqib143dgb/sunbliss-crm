(function(){
  'use strict';
  if(document.getElementById('sunblissMobileHeaderBackgroundStyles'))return;

  var style=document.createElement('style');
  style.id='sunblissMobileHeaderBackgroundStyles';
  style.textContent=`
    @media(max-width:720px){
      .topbar.sunbliss-professional-header{
        min-height:220px!important;
        box-sizing:border-box!important;
        padding:14px 16px 20px!important;
        border:0!important;
        border-radius:0!important;
        background-color:#071520!important;
        background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
        background-repeat:no-repeat!important;
        background-size:auto 124%!important;
        background-position:64% 82%!important;
        box-shadow:
          inset 0 0 0 1px rgba(224,170,78,.16),
          inset 0 -34px 54px rgba(1,8,14,.20),
          0 14px 34px rgba(2,9,15,.24)!important;
      }

      .topbar.sunbliss-professional-header::before{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        width:auto!important;
        height:auto!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
        background:
          linear-gradient(90deg,rgba(3,12,20,.91) 0%,rgba(3,12,20,.76) 45%,rgba(3,12,20,.20) 82%,rgba(3,12,20,.08) 100%),
          linear-gradient(180deg,rgba(3,12,20,.12) 0%,transparent 42%,rgba(3,12,20,.28) 100%)!important;
        pointer-events:none!important;
        z-index:1!important;
      }

      .topbar.sunbliss-professional-header::after{
        content:''!important;
        display:block!important;
        position:absolute!important;
        inset:0!important;
        width:auto!important;
        height:auto!important;
        border:0!important;
        border-radius:0!important;
        background:
          radial-gradient(ellipse 58% 38% at 82% 98%,rgba(214,162,70,.14),transparent 72%),
          radial-gradient(ellipse 34% 24% at 18% 0%,rgba(214,162,70,.08),transparent 76%)!important;
        pointer-events:none!important;
        z-index:2!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-top,
      .topbar.sunbliss-professional-header .sb-pro-main{
        position:relative!important;
        z-index:3!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-top{
        min-height:54px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand{
        min-width:0!important;
        width:auto!important;
        max-width:calc(100% - 74px)!important;
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:3px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
        display:grid!important;
        place-items:center!important;
        width:48px!important;
        height:48px!important;
        min-width:48px!important;
        min-height:48px!important;
        max-width:48px!important;
        max-height:48px!important;
        flex:0 0 48px!important;
        overflow:hidden!important;
        border-radius:50%!important;
        line-height:0!important;
        filter:drop-shadow(0 5px 14px rgba(214,162,70,.20))!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand-logo{
        display:block!important;
        width:auto!important;
        height:auto!important;
        min-width:0!important;
        min-height:0!important;
        max-width:44px!important;
        max-height:44px!important;
        aspect-ratio:auto!important;
        object-fit:contain!important;
        object-position:50% 50%!important;
        align-self:center!important;
        justify-self:center!important;
        margin:auto!important;
        transform:none!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand-copy{
        display:flex!important;
        min-width:0!important;
        width:max-content!important;
        max-width:calc(100% - 51px)!important;
        flex-direction:column!important;
        justify-content:center!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand-name{
        display:block!important;
        margin:0!important;
        color:#e0aa4e!important;
        font:700 20px/1.02 'Avenir Next',Avenir,'Helvetica Neue',Arial,sans-serif!important;
        letter-spacing:.055em!important;
        font-kerning:normal!important;
        text-rendering:geometricPrecision!important;
        white-space:nowrap!important;
        text-shadow:0 2px 14px rgba(214,162,70,.18)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-brand-sub{
        display:block!important;
        width:100%!important;
        box-sizing:border-box!important;
        margin-top:4px!important;
        color:rgba(228,180,92,.92)!important;
        font:600 6px/1.25 Inter,system-ui,sans-serif!important;
        letter-spacing:.30em!important;
        white-space:nowrap!important;
        text-align:left!important;
        text-align-last:auto!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-signout{
        height:34px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:6px!important;
        padding:0 9px!important;
        border:1px solid rgba(214,162,70,.56)!important;
        border-radius:10px!important;
        background:transparent!important;
        color:#fffaf0!important;
        font:600 9.4px/1 Inter,system-ui,sans-serif!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.10),0 8px 22px rgba(1,8,14,.18)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        backdrop-filter:blur(7px)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-signout svg{
        width:15px!important;
        height:15px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-main{
        margin-top:24px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-main::before{
        content:''!important;
        position:absolute!important;
        left:-16px!important;
        top:14px!important;
        width:2px!important;
        height:54px!important;
        border-radius:999px!important;
        background:linear-gradient(180deg,transparent,rgba(224,170,78,.88) 38%,rgba(224,170,78,.32) 72%,transparent)!important;
        box-shadow:0 0 14px rgba(214,162,70,.28)!important;
        pointer-events:none!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-welcome{
        margin:0 0 4px!important;
        color:rgba(248,244,234,.84)!important;
        font:500 11px/1.3 Inter,system-ui,sans-serif!important;
        letter-spacing:.01em!important;
        text-shadow:0 2px 8px rgba(0,0,0,.72)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-name-row{
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        flex-wrap:nowrap!important;
        white-space:nowrap!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-name{
        margin:0!important;
        color:#fff!important;
        font:650 23px/1.04 Inter,system-ui,sans-serif!important;
        letter-spacing:-.035em!important;
        white-space:nowrap!important;
        text-shadow:0 2px 8px rgba(0,0,0,.72)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-role{
        min-height:26px!important;
        display:inline-flex!important;
        align-items:center!important;
        padding:0 8px!important;
        border:1px solid rgba(214,162,70,.76)!important;
        border-radius:999px!important;
        background:linear-gradient(180deg,rgba(198,151,46,.09),rgba(198,151,46,.025))!important;
        color:#e2b157!important;
        font:650 8px/1 Inter,system-ui,sans-serif!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project-row{
        min-width:0!important;
        margin-top:35px!important;
        position:relative!important;
        isolation:isolate!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project-row::before{
        content:''!important;
        position:absolute!important;
        inset:-7px -6px!important;
        z-index:-1!important;
        border:1px solid rgba(224,170,78,.18)!important;
        border-radius:12px!important;
        background:linear-gradient(90deg,rgba(5,18,29,.46),rgba(5,18,29,.16))!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.055),0 10px 28px rgba(1,8,14,.16)!important;
        -webkit-backdrop-filter:blur(6px)!important;
        backdrop-filter:blur(6px)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project{
        min-width:0!important;
        display:flex!important;
        align-items:center!important;
        gap:7px!important;
        color:#f5f0e6!important;
        font:600 11.3px/1.2 Inter,system-ui,sans-serif!important;
        text-shadow:0 2px 8px rgba(0,0,0,.72)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project-icon{
        width:27px!important;
        height:27px!important;
        flex:0 0 27px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border:1px solid rgba(214,162,70,.46)!important;
        border-radius:8px!important;
        background:linear-gradient(145deg,rgba(214,162,70,.10),rgba(7,21,32,.18))!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.08),0 7px 18px rgba(1,8,14,.16)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project-icon svg{
        width:15px!important;
        height:15px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-project-sep{
        display:none!important;
        width:12px!important;
        height:1px!important;
        flex:0 0 12px!important;
        background:linear-gradient(90deg,#c6972e,transparent)!important;
        opacity:.75!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-sync{
        height:28px!important;
        display:flex!important;
        align-items:center!important;
        gap:5px!important;
        padding:0 7px!important;
        border:1px solid rgba(214,162,70,.52)!important;
        border-radius:9px!important;
        background:transparent!important;
        color:rgba(255,250,240,.90)!important;
        font:500 8.2px/1 Inter,system-ui,sans-serif!important;
        white-space:nowrap!important;
        box-shadow:inset 0 1px 0 rgba(255,231,184,.08),0 7px 18px rgba(1,8,14,.15)!important;
        -webkit-backdrop-filter:blur(6px)!important;
        backdrop-filter:blur(6px)!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-sync svg{
        width:12px!important;
        height:12px!important;
      }

      .topbar.sunbliss-professional-header .sb-pro-name,
      .topbar.sunbliss-professional-header .sb-pro-project,
      .topbar.sunbliss-professional-header .sb-pro-welcome{
        text-shadow:0 2px 8px rgba(0,0,0,.72)!important;
      }

      .topbar.sunbliss-professional-header .sb-dubai-skyline{
        display:none!important;
      }
    }

    @media(max-width:370px){
      .topbar.sunbliss-professional-header{
        padding-left:13px!important;
        padding-right:13px!important;
      }
      .topbar.sunbliss-professional-header .sb-pro-brand-name{
        font-size:19px!important;
      }
      .topbar.sunbliss-professional-header .sb-pro-project-sep{
        display:none!important;
      }
    }
  `;

  document.head.appendChild(style);
})();
