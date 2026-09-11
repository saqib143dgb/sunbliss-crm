(function(){
  'use strict';
  if(window.__sunblissBoldHeadingsInstalled)return;
  window.__sunblissBoldHeadingsInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissBoldHeadingsStyle';
  style.textContent=[
    'h1,h2,h3,h4,h5,h6{font-weight:700!important;}',
    '.title,.page-title,.section-title,.panel-title,.card-title,.detail-title,.editor-title,.modal-title,.overview-title,.insights-title,.report-title,.print-title,.ps-title{font-weight:700!important;}',
    '[class$="-title"],[class*="-title "],[class$="-heading"],[class*="-heading "]{font-weight:700!important;}',
    '.detail .name,.detail .customer-name,.broker-detail-name,.rm-detail-name,.ps-customer-name{font-weight:700!important;}',
    '.print-doc h1,.print-doc h2,.print-doc h3,.professional-payment-statement h1,.professional-payment-statement h2,.professional-payment-statement h3{font-weight:700!important;}',
    '#app .row-name,#app [class*="customer-name"],#app [class*="customerName"],#app [class*="customer_name"],#app .credit-note-mini-main,#monthlySalesOverlay .monthly-sale-customer{display:block!important;max-width:100%!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
    '#app .d-name{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;box-sizing:border-box!important;font-size:22px!important;line-height:1.15!important;font-weight:600!important;}',
    '#app .d-name>span:first-child{display:block!important;flex:1 1 auto!important;min-width:0!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-weight:600!important;}',
    '#app .d-name>span:last-child:not(:first-child){flex:0 0 auto!important;margin-left:auto!important;overflow:visible!important;}',
    '@media(max-width:420px){#app .d-name{font-size:20px!important;}}',
    '@media(min-width:1024px){body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-bottom{grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:stretch!important;}body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-bottom>.sb-v2-panel:last-child{display:none!important;}body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-bottom>.sb-v2-panel{height:100%!important;min-height:218px!important;}}'
  ].join('');
  document.head.appendChild(style);
})();

(function(){
  'use strict';
  if(window.__sunblissApprovedDesktopHeaderInstalled)return;
  window.__sunblissApprovedDesktopHeaderInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissApprovedDesktopHeaderStyle';
  style.textContent=`
@media(min-width:1024px){
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header{
    --sb-desktop-header-h:166px!important;
    position:relative!important;
    height:166px!important;
    min-height:166px!important;
    max-height:166px!important;
    padding:17px 24px 13px 30px!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
    isolation:isolate!important;
    border:0!important;
    border-bottom:1px solid rgba(214,162,70,.50)!important;
    background-image:
      linear-gradient(90deg,rgba(2,12,22,.80) 0%,rgba(2,12,22,.55) 25%,rgba(2,12,22,.14) 53%,rgba(2,12,22,.20) 77%,rgba(2,12,22,.36) 100%),
      url('https://raw.githubusercontent.com/saqib143dgb/sunbliss-crm/3bd49b6efe227932e1f5db3968b4e8582b588232/assets/sunbliss-desktop-header-night.webp')!important;
    background-repeat:no-repeat,no-repeat!important;
    background-position:center center,center center!important;
    background-size:100% 100%,100% 100%!important;
    box-shadow:0 7px 22px rgba(2,9,15,.12)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header:before,
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header:after,
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-visual,
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline,
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-v2-tagline{
    display:none!important;
    content:none!important;
  }

  body.sunbliss-ref-desktop #app main#main{
    min-height:calc(100vh - 166px)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-top,
  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-main{
    position:relative!important;
    z-index:5!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-top{
    min-height:41px!important;
    height:41px!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
    display:none!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-brand-name{
    margin:0!important;
    color:#e3ad50!important;
    font:600 25px/1 Fraunces,Georgia,'Times New Roman',serif!important;
    letter-spacing:.085em!important;
    white-space:nowrap!important;
    text-shadow:0 2px 10px rgba(0,0,0,.48)!important;
    transform:none!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-brand-sub{
    margin-top:6px!important;
    color:rgba(248,240,221,.94)!important;
    font:600 7px/1.1 Inter,system-ui,sans-serif!important;
    letter-spacing:.16em!important;
    white-space:nowrap!important;
    text-shadow:0 2px 7px rgba(0,0,0,.48)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main{
    height:83px!important;
    margin-top:8px!important;
    display:flex!important;
    align-items:center!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-copy{
    display:block!important;
    width:auto!important;
    min-width:0!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-welcome{
    margin:0 0 5px!important;
    color:#e3ad50!important;
    font:600 10.5px/1 Inter,system-ui,sans-serif!important;
    text-shadow:0 2px 8px rgba(0,0,0,.60)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-name-row{
    display:flex!important;
    align-items:center!important;
    gap:12px!important;
    flex-wrap:nowrap!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-name{
    margin:0!important;
    color:#fff4df!important;
    font:500 31px/1 Fraunces,Georgia,'Times New Roman',serif!important;
    letter-spacing:-.018em!important;
    white-space:nowrap!important;
    text-shadow:0 2px 12px rgba(0,0,0,.58)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-role{
    min-height:29px!important;
    height:29px!important;
    display:inline-flex!important;
    align-items:center!important;
    padding:0 12px!important;
    border:1px solid rgba(224,170,78,.88)!important;
    border-radius:999px!important;
    background:rgba(3,13,22,.46)!important;
    color:#e7b456!important;
    font:650 9.5px/1 Inter,system-ui,sans-serif!important;
    box-shadow:inset 0 1px 0 rgba(255,231,184,.06)!important;
    -webkit-backdrop-filter:blur(5px)!important;
    backdrop-filter:blur(5px)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-row{
    display:none!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-actions{
    position:absolute!important;
    z-index:8!important;
    top:0!important;
    right:0!important;
    display:flex!important;
    align-items:flex-start!important;
    justify-content:flex-end!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-signout{
    height:35px!important;
    min-width:94px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:7px!important;
    padding:0 14px!important;
    border:1px solid rgba(224,170,78,.82)!important;
    border-radius:11px!important;
    background:rgba(3,13,22,.55)!important;
    color:#fff2dc!important;
    font:600 10.5px/1 Inter,system-ui,sans-serif!important;
    box-shadow:0 5px 15px rgba(0,0,0,.17)!important;
    -webkit-backdrop-filter:blur(5px)!important;
    backdrop-filter:blur(5px)!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-signout svg{
    width:15px!important;
    height:15px!important;
    stroke:#e3ad50!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-sync{
    position:absolute!important;
    z-index:8!important;
    right:1px!important;
    top:91px!important;
    bottom:auto!important;
    left:auto!important;
    transform:none!important;
    height:auto!important;
    min-height:0!important;
    display:flex!important;
    align-items:center!important;
    gap:7px!important;
    padding:0!important;
    border:0!important;
    border-radius:0!important;
    background:transparent!important;
    color:#fff!important;
    font:600 10px/1 Inter,system-ui,sans-serif!important;
    white-space:nowrap!important;
    box-shadow:none!important;
    text-shadow:0 2px 8px rgba(0,0,0,.58)!important;
    -webkit-backdrop-filter:none!important;
    backdrop-filter:none!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-sync svg{
    width:13px!important;
    height:13px!important;
    stroke:#35ce6c!important;
    color:#35ce6c!important;
    stroke-width:2.2!important;
  }

  body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-v2-sync{
    display:none!important;
  }
}
`;
  document.head.appendChild(style);
})();
