(function(){
  'use strict';

  if (window.__sunblissPremiumHeroRefineInstalled) return;
  window.__sunblissPremiumHeroRefineInstalled = true;

  function brandMarkup(){
    return '<div class="sunbliss-reference-brand" aria-label="Purvanchal Real Estate Developers LLC">'+
      '<svg class="sunbliss-reference-brand-mark" viewBox="0 0 84 96" aria-hidden="true">'+
        '<path d="M42 4 73 23v50L42 92 11 73V23Z"/>'+
        '<path d="M24 68V31l18-11v52"/>'+
        '<path d="M42 72V18l18 12v38"/>'+
        '<path d="M17 72h50"/>'+
        '<path d="M29 38v7M29 52v7M36 34v7M36 48v7M49 32v7M49 46v7M56 37v7M56 51v7"/>'+
      '</svg>'+
      '<span class="sunbliss-reference-brand-copy">'+
        '<span class="sunbliss-reference-brand-name">PURVANCHAL</span>'+
        '<span class="sunbliss-reference-brand-sub">REAL ESTATE DEVELOPERS LLC</span>'+
      '</span>'+
    '</div>';
  }

  function ensureReferenceBrand(){
    var top=document.querySelector('.sunbliss-header-top');
    if(!top) return;
    var current=top.querySelector('.sunbliss-reference-brand');
    if(current) return;
    var legacy=top.querySelector('.sunbliss-brand-logo');
    var holder=document.createElement('div');
    holder.innerHTML=brandMarkup();
    var brand=holder.firstChild;
    if(legacy) legacy.replaceWith(brand);
    else top.insertBefore(brand,top.firstChild);
  }

  function ensureStyles(){
    var old=document.getElementById('sunblissPremiumHeroRefineStyles');
    if(old) old.remove();
    var style=document.createElement('style');
    style.id='sunblissPremiumHeroRefineStyles';
    style.textContent=`
      .topbar.sunbliss-premium-header{
        min-height:372px!important;
        padding:20px 26px 66px!important;
        background:
          radial-gradient(420px 250px at 75% 40%,rgba(198,145,52,.08),transparent 68%),
          linear-gradient(118deg,#09141d 0%,#0b1822 54%,#101e28 100%)!important;
      }

      .sunbliss-header-top{align-items:flex-start!important;gap:16px!important;}
      .sunbliss-reference-brand{display:flex;align-items:center;gap:13px;min-width:0;color:#e5b864;filter:drop-shadow(0 7px 18px rgba(0,0,0,.14));}
      .sunbliss-reference-brand-mark{width:58px;height:66px;flex:none;fill:none;stroke:#e5b864;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;}
      .sunbliss-reference-brand-copy{display:flex;flex-direction:column;min-width:0;padding-top:4px;}
      .sunbliss-reference-brand-name{display:block;color:#fffaf1;font:500 24px/1.04 Georgia,'Times New Roman',serif;letter-spacing:.16em;white-space:nowrap;}
      .sunbliss-reference-brand-sub{display:block;margin-top:7px;color:#e0ad55;font:700 8px/1 Inter,system-ui,sans-serif;letter-spacing:.17em;white-space:nowrap;}
      .sunbliss-brand-logo{display:none!important;}

      .sunbliss-header-tools{gap:8px!important;padding-top:4px!important;}
      .sunbliss-sync-pill{height:44px!important;min-width:154px!important;padding:0 14px!important;gap:9px!important;border-radius:14px!important;border-color:rgba(230,212,180,.23)!important;background:rgba(8,18,27,.58)!important;font-size:12.5px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 10px 25px rgba(0,0,0,.14)!important;}
      .sunbliss-sync-pill svg{width:18px!important;height:18px!important;stroke:#e0ab50!important;}
      .sunbliss-bell{width:44px!important;height:44px!important;border-radius:14px!important;border-color:rgba(230,212,180,.23)!important;background:rgba(8,18,27,.58)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 10px 25px rgba(0,0,0,.14)!important;}
      .sunbliss-bell svg{width:20px!important;height:20px!important;}
      .sunbliss-bell-dot{right:6px!important;top:5px!important;width:9px!important;height:9px!important;background:linear-gradient(135deg,#f4c267,#c88a2c)!important;}

      .sunbliss-hero-art{
        top:72px!important;
        right:-18px!important;
        bottom:auto!important;
        width:355px!important;
        height:300px!important;
        border-radius:0!important;
        background-size:cover!important;
        background-position:center 52%!important;
        opacity:.60!important;
        filter:grayscale(.18) sepia(.14) saturate(.62) brightness(.48) contrast(1.16)!important;
        mix-blend-mode:screen;
        -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.28) 11%,#000 30%,#000 100%)!important;
        mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.28) 11%,#000 30%,#000 100%)!important;
      }
      .sunbliss-hero-shade{
        background:
          linear-gradient(90deg,#09141d 0%,rgba(9,20,29,.99) 34%,rgba(9,20,29,.82) 52%,rgba(9,20,29,.18) 82%,rgba(9,20,29,.05) 100%),
          linear-gradient(0deg,#09141d 0%,rgba(9,20,29,.12) 42%,rgba(9,20,29,.28) 100%)!important;
      }
      .sunbliss-hero-shade::after{content:'';position:absolute;right:112px;top:104px;width:142px;height:92px;background-image:radial-gradient(circle,rgba(216,166,77,.28) 1px,transparent 1.4px);background-size:9px 9px;opacity:.36;-webkit-mask-image:radial-gradient(ellipse,#000 30%,transparent 74%);mask-image:radial-gradient(ellipse,#000 30%,transparent 74%);}
      .sunbliss-hero-line{right:-18px!important;top:196px!important;width:355px!important;height:1px!important;transform:rotate(-42deg)!important;background:linear-gradient(90deg,transparent 0%,rgba(221,168,74,.08) 10%,rgba(221,168,74,.64) 48%,rgba(221,168,74,.18) 82%,transparent 100%)!important;opacity:.88!important;}

      .sunbliss-hero-copy{max-width:60%!important;margin-top:44px!important;}
      .sunbliss-welcome{margin:0 0 9px!important;font-size:15px!important;font-weight:500!important;color:rgba(255,250,241,.94)!important;}
      .sunbliss-name-line{gap:10px 13px!important;align-items:center!important;}
      .sunbliss-name-line h1{font-size:36px!important;line-height:1.03!important;font-weight:650!important;letter-spacing:-.035em!important;color:#fff!important;}
      .sunbliss-role-pill{min-height:34px!important;padding:0 15px!important;border-radius:999px!important;border-color:rgba(218,161,66,.84)!important;background:rgba(9,20,29,.43)!important;color:#e6b35d!important;font-size:11.5px!important;font-weight:650!important;}
      .sunbliss-project-line{margin-top:20px!important;gap:9px!important;font-size:16px!important;font-weight:520!important;color:#fffaf1!important;}
      .sunbliss-project-line svg{width:20px!important;height:20px!important;stroke:#dfad58!important;}

      .sunbliss-hero-signout{right:24px!important;bottom:64px!important;height:44px!important;min-width:126px!important;padding:0 18px!important;gap:9px!important;border-radius:14px!important;border-color:rgba(221,165,69,.86)!important;background:rgba(8,18,27,.58)!important;color:#fff!important;font-size:13px!important;font-weight:650!important;box-shadow:0 12px 28px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.03)!important;}
      .sunbliss-hero-signout svg{width:19px!important;height:19px!important;stroke:#e1ad57!important;}

      .sunbliss-hero-curve{
        height:38px!important;
        left:0!important;
        right:0!important;
        bottom:-1px!important;
        border-radius:34px 34px 0 0!important;
        background:var(--paper,#f6f1e4)!important;
        box-shadow:0 -4px 0 rgba(42,52,61,.94),0 -2px 0 #d8a64d!important;
      }
      .sunbliss-curve-medallion{
        display:flex!important;
        top:-27px!important;
        width:56px!important;
        height:56px!important;
        border:2px solid #d5a049!important;
        background:linear-gradient(145deg,#fffaf0,#ede0ca)!important;
        box-shadow:0 0 0 5px var(--paper,#f6f1e4),0 -1px 0 6px #d5a049,0 7px 17px rgba(10,20,29,.16)!important;
      }
      .sunbliss-curve-bars{height:23px!important;gap:3px!important;}
      .sunbliss-curve-bars i{width:5px!important;background:linear-gradient(180deg,#e9ba61,#bd7e25)!important;}

      main{border-radius:28px 28px 0 0!important;}

      @media(max-width:720px){
        .topbar.sunbliss-premium-header{min-height:334px!important;padding:14px 14px 58px!important;}
        .sunbliss-header-top{gap:8px!important;}
        .sunbliss-reference-brand{gap:7px;}
        .sunbliss-reference-brand-mark{width:34px;height:40px;stroke-width:2.5;}
        .sunbliss-reference-brand-copy{padding-top:1px;}
        .sunbliss-reference-brand-name{font-size:13px;letter-spacing:.12em;}
        .sunbliss-reference-brand-sub{margin-top:4px;font-size:4.7px;letter-spacing:.13em;}
        .sunbliss-header-tools{gap:6px!important;padding-top:0!important;}
        .sunbliss-sync-pill{height:37px!important;min-width:118px!important;padding:0 10px!important;gap:6px!important;border-radius:12px!important;font-size:10.5px!important;}
        .sunbliss-sync-pill svg{width:15px!important;height:15px!important;}
        .sunbliss-bell{width:37px!important;height:37px!important;border-radius:12px!important;}
        .sunbliss-bell svg{width:18px!important;height:18px!important;}
        .sunbliss-bell-dot{right:5px!important;top:4px!important;width:8px!important;height:8px!important;}

        .sunbliss-hero-art{top:86px!important;right:-128px!important;width:370px!important;height:248px!important;opacity:.56!important;background-position:center 54%!important;filter:grayscale(.16) sepia(.12) saturate(.62) brightness(.47) contrast(1.14)!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 10%,#000 29%,#000 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 10%,#000 29%,#000 100%)!important;}
        .sunbliss-hero-shade{background:linear-gradient(90deg,#09141d 0%,rgba(9,20,29,.99) 38%,rgba(9,20,29,.77) 58%,rgba(9,20,29,.12) 100%),linear-gradient(0deg,#09141d 0%,rgba(9,20,29,.08) 44%,rgba(9,20,29,.24) 100%)!important;}
        .sunbliss-hero-shade::after{right:43px;top:96px;width:106px;height:72px;background-size:8px 8px;opacity:.30;}
        .sunbliss-hero-line{right:-93px!important;top:182px!important;width:286px!important;opacity:.72!important;}

        .sunbliss-hero-copy{max-width:76%!important;margin-top:42px!important;}
        .sunbliss-welcome{margin-bottom:6px!important;font-size:13px!important;}
        .sunbliss-name-line{gap:7px 8px!important;}
        .sunbliss-name-line h1{font-size:28px!important;letter-spacing:-.038em!important;}
        .sunbliss-role-pill{min-height:28px!important;padding:0 10px!important;font-size:9.5px!important;}
        .sunbliss-project-line{margin-top:15px!important;gap:7px!important;font-size:14px!important;}
        .sunbliss-project-line svg{width:17px!important;height:17px!important;}
        .sunbliss-hero-signout{right:14px!important;bottom:47px!important;height:38px!important;min-width:104px!important;padding:0 13px!important;gap:7px!important;border-radius:12px!important;font-size:11.5px!important;}
        .sunbliss-hero-signout svg{width:16px!important;height:16px!important;}
        .sunbliss-hero-curve{height:30px!important;border-radius:28px 28px 0 0!important;box-shadow:0 -3px 0 rgba(42,52,61,.94),0 -1.5px 0 #d8a64d!important;}
        .sunbliss-curve-medallion{top:-23px!important;width:46px!important;height:46px!important;box-shadow:0 0 0 4px var(--paper,#f6f1e4),0 -1px 0 5px #d5a049,0 6px 14px rgba(10,20,29,.15)!important;}
        .sunbliss-curve-bars{height:19px!important;}
        .sunbliss-curve-bars i{width:4px!important;}
        .sunbliss-curve-bars i:nth-child(1){height:10px!important}.sunbliss-curve-bars i:nth-child(2){height:19px!important}.sunbliss-curve-bars i:nth-child(3){height:14px!important}
        main{border-radius:24px 24px 0 0!important;}
      }

      @media(max-width:385px){
        .sunbliss-reference-brand-mark{width:31px;height:37px;}
        .sunbliss-reference-brand-name{font-size:12px;}
        .sunbliss-reference-brand-sub{font-size:4.2px;}
        .sunbliss-sync-pill{min-width:110px!important;padding:0 8px!important;font-size:9.8px!important;}
        .sunbliss-hero-copy{max-width:79%!important;}
        .sunbliss-name-line h1{font-size:26px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function refineHeader(){
    ensureReferenceBrand();
  }

  ensureStyles();

  if(typeof window.render==='function'&&!window.__sunblissPremiumHeroReferenceRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      refineHeader();
      return result;
    };
    window.__sunblissPremiumHeroReferenceRenderWrapped=true;
  }

  window.addEventListener('pageshow',refineHeader);
  refineHeader();
})();
