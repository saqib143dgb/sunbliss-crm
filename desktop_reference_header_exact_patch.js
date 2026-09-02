(function(){
'use strict';
if(window.__sunblissDesktopReferenceHeaderExact)return;
window.__sunblissDesktopReferenceHeaderExact=true;

var MQ='(min-width:1024px)',queued=false;
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}

function styles(){
  if(document.getElementById('sunblissDesktopReferenceHeaderExactStyles'))return;
  var s=document.createElement('style');
  s.id='sunblissDesktopReferenceHeaderExactStyles';
  s.textContent=`
#sbReferenceHeaderExact{display:none!important}
@media(min-width:1024px){
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
    position:relative!important;
    height:286px!important;
    min-height:286px!important;
    box-sizing:border-box!important;
    padding:24px 40px 26px!important;
    overflow:hidden!important;
    border:0!important;
    border-radius:0!important;
    color:#f8f4ea!important;
    background-color:#071520!important;
    background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
    background-repeat:no-repeat!important;
    background-size:auto 136%!important;
    background-position:100% 72%!important;
    box-shadow:inset 0 0 0 1px rgba(224,170,78,.14),inset 0 -42px 70px rgba(1,8,14,.24),0 14px 34px rgba(2,9,15,.20)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before{
    content:''!important;
    display:block!important;
    position:absolute!important;
    inset:0!important;
    width:auto!important;
    height:auto!important;
    border:0!important;
    border-radius:0!important;
    box-shadow:none!important;
    background:linear-gradient(90deg,rgba(3,12,20,.97) 0%,rgba(3,12,20,.91) 31%,rgba(3,12,20,.66) 51%,rgba(3,12,20,.20) 76%,rgba(3,12,20,.05) 100%),linear-gradient(180deg,rgba(3,12,20,.15),transparent 46%,rgba(3,12,20,.31))!important;
    pointer-events:none!important;
    z-index:1!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{
    content:''!important;
    display:block!important;
    position:absolute!important;
    inset:0!important;
    width:auto!important;
    height:auto!important;
    border:0!important;
    border-radius:0!important;
    background:radial-gradient(ellipse 45% 52% at 82% 105%,rgba(214,162,70,.14),transparent 72%),radial-gradient(ellipse 28% 25% at 12% 0%,rgba(214,162,70,.10),transparent 76%)!important;
    pointer-events:none!important;
    z-index:2!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-top,
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-main{
    display:flex!important;
    position:relative!important;
    z-index:3!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-top{
    min-height:78px!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:28px!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand{
    display:flex!important;
    flex-direction:row!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:12px!important;
    width:auto!important;
    max-width:calc(100% - 170px)!important;
    min-width:0!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
    display:grid!important;
    place-items:center!important;
    width:70px!important;
    height:70px!important;
    min-width:70px!important;
    min-height:70px!important;
    max-width:70px!important;
    max-height:70px!important;
    flex:0 0 70px!important;
    overflow:hidden!important;
    border-radius:50%!important;
    line-height:0!important;
    filter:drop-shadow(0 7px 18px rgba(214,162,70,.22))!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo{
    display:block!important;
    width:auto!important;
    height:auto!important;
    min-width:0!important;
    min-height:0!important;
    max-width:66px!important;
    max-height:66px!important;
    aspect-ratio:auto!important;
    object-fit:contain!important;
    object-position:50% 50%!important;
    align-self:center!important;
    justify-self:center!important;
    margin:auto!important;
    transform:none!important;
    opacity:1!important;
    visibility:visible!important;
    animation:none!important;
    transition:none!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-copy{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    width:360px!important;
    max-width:360px!important;
    min-width:0!important;
    height:70px!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{
    display:block!important;
    margin:0!important;
    color:#e0aa4e!important;
    font:700 35px/1.02 'Avenir Next',Avenir,'Helvetica Neue',Arial,sans-serif!important;
    letter-spacing:.055em!important;
    font-kerning:normal!important;
    text-rendering:geometricPrecision!important;
    white-space:nowrap!important;
    text-shadow:0 2px 16px rgba(214,162,70,.18)!important;
    transform:none!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{
    display:block!important;
    width:100%!important;
    box-sizing:border-box!important;
    padding:0 2px!important;
    margin-top:7px!important;
    color:rgba(228,180,92,.94)!important;
    font:600 9px/1.25 Inter,system-ui,sans-serif!important;
    letter-spacing:0!important;
    white-space:nowrap!important;
    text-align:left!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub-inner{
    display:flex!important;
    width:100%!important;
    align-items:center!important;
    justify-content:space-between!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub-inner span{
    display:inline-block!important;
    flex:0 0 auto!important;
    letter-spacing:0!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
    position:relative!important;
    top:auto!important;
    right:auto!important;
    display:flex!important;
    align-items:center!important;
    flex:none!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-sync{display:none!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{
    height:42px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:9px!important;
    padding:0 16px!important;
    border:1px solid rgba(214,162,70,.62)!important;
    border-radius:12px!important;
    background:transparent!important;
    color:#fffaf0!important;
    font:600 12px/1 Inter,system-ui,sans-serif!important;
    box-shadow:inset 0 1px 0 rgba(255,231,184,.10),0 10px 26px rgba(1,8,14,.20)!important;
    -webkit-backdrop-filter:blur(8px)!important;
    backdrop-filter:blur(8px)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout svg{width:18px!important;height:18px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{
    margin-top:20px!important;
    align-items:flex-start!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
    width:min(610px,calc(100% - 80px))!important;
    min-width:0!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main:before{
    content:''!important;
    position:absolute!important;
    left:-40px!important;
    top:10px!important;
    width:3px!important;
    height:68px!important;
    border-radius:999px!important;
    background:linear-gradient(180deg,transparent,rgba(224,170,78,.88) 35%,rgba(224,170,78,.30) 76%,transparent)!important;
    box-shadow:0 0 16px rgba(214,162,70,.28)!important;
    pointer-events:none!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{
    margin:0 0 4px!important;
    color:rgba(248,244,234,.86)!important;
    font:500 13px/1.3 Inter,system-ui,sans-serif!important;
    letter-spacing:.01em!important;
    text-shadow:0 2px 9px rgba(0,0,0,.74)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name-row{
    display:flex!important;
    align-items:center!important;
    gap:12px!important;
    flex-wrap:nowrap!important;
    white-space:nowrap!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{
    margin:0!important;
    color:#fff!important;
    font:650 36px/1.04 Inter,system-ui,sans-serif!important;
    letter-spacing:-.035em!important;
    white-space:nowrap!important;
    text-shadow:0 2px 10px rgba(0,0,0,.72)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{
    min-height:31px!important;
    display:inline-flex!important;
    align-items:center!important;
    padding:0 12px!important;
    border:1px solid rgba(214,162,70,.78)!important;
    border-radius:999px!important;
    background:linear-gradient(180deg,rgba(198,151,46,.09),rgba(198,151,46,.025))!important;
    color:#e2b157!important;
    font:650 10px/1 Inter,system-ui,sans-serif!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{
    position:relative!important;
    isolation:isolate!important;
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:18px!important;
    min-width:0!important;
    margin-top:26px!important;
    padding:7px 8px!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row:before{
    content:''!important;
    position:absolute!important;
    inset:0!important;
    z-index:-1!important;
    border:1px solid rgba(224,170,78,.24)!important;
    border-radius:13px!important;
    background:linear-gradient(90deg,rgba(5,18,29,.56),rgba(5,18,29,.20))!important;
    box-shadow:inset 0 1px 0 rgba(255,231,184,.07),0 12px 32px rgba(1,8,14,.17)!important;
    -webkit-backdrop-filter:blur(7px)!important;
    backdrop-filter:blur(7px)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project{
    display:flex!important;
    align-items:center!important;
    gap:10px!important;
    min-width:0!important;
    color:#f5f0e6!important;
    font:600 14px/1.2 Inter,system-ui,sans-serif!important;
    text-shadow:0 2px 9px rgba(0,0,0,.72)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{
    width:34px!important;
    height:34px!important;
    flex:0 0 34px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    border:1px solid rgba(214,162,70,.50)!important;
    border-radius:9px!important;
    background:linear-gradient(145deg,rgba(214,162,70,.11),rgba(7,21,32,.20))!important;
    box-shadow:inset 0 1px 0 rgba(255,231,184,.08),0 7px 18px rgba(1,8,14,.16)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{width:18px!important;height:18px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-sep{display:none!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-sync{
    height:32px!important;
    display:flex!important;
    align-items:center!important;
    gap:7px!important;
    padding:0 11px!important;
    flex:none!important;
    border:1px solid rgba(214,162,70,.54)!important;
    border-radius:10px!important;
    background:transparent!important;
    color:rgba(255,250,240,.92)!important;
    font:500 10.5px/1 Inter,system-ui,sans-serif!important;
    white-space:nowrap!important;
    box-shadow:inset 0 1px 0 rgba(255,231,184,.08),0 7px 18px rgba(1,8,14,.15)!important;
    -webkit-backdrop-filter:blur(7px)!important;
    backdrop-filter:blur(7px)!important;
  }
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-sync svg{width:14px!important;height:14px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-tagline,
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-dubai-skyline{display:none!important}
  body.sunbliss-ref-desktop main#main{min-height:calc(100vh - 286px)!important}
}
@media(min-width:1024px) and (max-width:1180px){
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{padding-left:32px!important;padding-right:32px!important;background-position:112% 72%!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main:before{left:-32px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-copy{width:320px!important;max-width:320px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{font-size:31px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{font-size:8px!important}
  body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{width:min(560px,calc(100% - 32px))!important}
}
  `;
  document.head.appendChild(s);
}

function cleanup(){
  styles();
  var old=document.getElementById('sbReferenceHeaderExact');
  if(old)old.remove();
  if(!desktop())return;
  document.querySelectorAll('.topbar.sunbliss-professional-header .sb-v2-sync,.topbar.sunbliss-professional-header .sb-v2-tagline').forEach(function(node){node.remove()});
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(function(){queued=false;cleanup()});
}

styles();cleanup();setTimeout(cleanup,80);setTimeout(cleanup,300);
var app=document.getElementById('app');
if(app&&window.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('resize',schedule);
window.addEventListener('pageshow',schedule);
})();
