(function(){
'use strict';
if(window.__sunblissDesktopApprovedHeaderBackgroundInstalled)return;
window.__sunblissDesktopApprovedHeaderBackgroundInstalled=true;

var style=document.createElement('style');
style.id='sunblissDesktopApprovedHeaderBackgroundStyle';
style.textContent=`
@media(min-width:1024px){
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
    height:166px!important;
    min-height:166px!important;
    padding:18px 24px 14px 30px!important;
    overflow:hidden!important;
    background:
      linear-gradient(90deg,rgba(4,16,29,.78) 0%,rgba(4,16,29,.48) 28%,rgba(4,16,29,.15) 57%,rgba(4,16,29,.32) 100%),
      url('assets/sunbliss-desktop-header-night.webp') center center/100% 100% no-repeat!important;
    border-bottom:1px solid rgba(198,151,46,.48)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{display:none!important}
  body.sunbliss-ref-desktop .sb-dubai-skyline,
  body.sunbliss-ref-desktop .sb-v2-tagline{display:none!important}
  body.sunbliss-ref-desktop main#main{min-height:calc(100vh - 166px)!important}

  body.sunbliss-ref-desktop .sb-pro-top{min-height:44px!important}
  body.sunbliss-ref-desktop .sb-pro-brand-name{
    font-size:27px!important;
    line-height:1!important;
    color:var(--gold)!important;
    text-shadow:0 2px 12px rgba(0,0,0,.32)!important;
  }
  body.sunbliss-ref-desktop .sb-pro-brand-sub{
    margin-top:5px!important;
    font-size:7.5px!important;
    letter-spacing:.21em!important;
    color:rgba(237,230,214,.92)!important;
    text-shadow:0 2px 8px rgba(0,0,0,.35)!important;
  }
  body.sunbliss-ref-desktop .sb-pro-main{margin-top:10px!important}
  body.sunbliss-ref-desktop .sb-pro-welcome{
    font-size:11px!important;
    color:var(--gold)!important;
    text-shadow:0 2px 8px rgba(0,0,0,.42)!important;
  }
  body.sunbliss-ref-desktop .sb-pro-name{
    margin-top:2px!important;
    font-size:29px!important;
    line-height:1.02!important;
    color:#fff!important;
    text-shadow:0 2px 12px rgba(0,0,0,.48)!important;
  }
  body.sunbliss-ref-desktop .sb-pro-role{
    min-height:27px!important;
    padding:0 12px!important;
    border-color:rgba(198,151,46,.82)!important;
    background:rgba(4,16,29,.42)!important;
    backdrop-filter:blur(4px)!important;
    -webkit-backdrop-filter:blur(4px)!important;
  }
  body.sunbliss-ref-desktop .sb-pro-project-row{display:none!important}

  body.sunbliss-ref-desktop .sb-pro-actions{
    position:absolute!important;
    right:22px!important;
    top:17px!important;
    display:flex!important;
    flex-direction:column-reverse!important;
    align-items:flex-end!important;
    gap:34px!important;
    z-index:6!important;
  }
  body.sunbliss-ref-desktop .sb-pro-signout{
    height:35px!important;
    min-width:96px!important;
    padding:0 15px!important;
    border:1px solid rgba(198,151,46,.82)!important;
    border-radius:11px!important;
    background:rgba(4,16,29,.56)!important;
    color:#fff!important;
    backdrop-filter:blur(4px)!important;
    -webkit-backdrop-filter:blur(4px)!important;
    box-shadow:0 4px 16px rgba(0,0,0,.18)!important;
  }
  body.sunbliss-ref-desktop .sb-v2-sync{
    height:auto!important;
    min-height:0!important;
    padding:0!important;
    border:0!important;
    background:transparent!important;
    color:#fff!important;
    font:600 10.5px/1 Inter,sans-serif!important;
    text-shadow:0 2px 8px rgba(0,0,0,.48)!important;
    gap:7px!important;
  }
  body.sunbliss-ref-desktop .sb-v2-sync svg{
    width:14px!important;
    height:14px!important;
    color:#32c56b!important;
    stroke:#32c56b!important;
  }
}
`;
document.head.appendChild(style);
})();
