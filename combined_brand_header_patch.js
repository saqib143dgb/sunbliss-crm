(function(){
  'use strict';
  if(window.__sunblissCombinedBrandHeaderInstalled)return;
  window.__sunblissCombinedBrandHeaderInstalled=true;

  var ASSET='assets/purvanchal-full-lockup.webp';

  function skylineMarkup(){
    return '<div class="sunbliss-reference-skyline" aria-hidden="true">'+
      '<svg viewBox="0 0 900 430" preserveAspectRatio="xMidYMax meet">'+
        '<defs>'+
          '<linearGradient id="sbSkyGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9d6b24"/><stop offset=".45" stop-color="#e2b35f"/><stop offset="1" stop-color="#b97b2b"/></linearGradient>'+
          '<linearGradient id="sbGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4cf7a" stop-opacity=".92"/><stop offset="1" stop-color="#c7852a" stop-opacity=".16"/></linearGradient>'+
          '<filter id="sbSoftGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
        '</defs>'+
        '<g fill="none" stroke="url(#sbSkyGold)" stroke-width="1.45" stroke-linejoin="round" stroke-linecap="round" opacity=".94">'+
          '<path d="M18 388H888" opacity=".72"/>'+
          '<path d="M80 388V325h18v-32h13v95M101 293l6-15 6 15"/>'+
          '<path d="M126 388V346h18v-55h21v97M136 291h19M144 291v-21M138 309h20M138 327h20"/>'+
          '<path d="M174 388V310h20v-23h14v101M181 328h20M181 346h20M181 364h20"/>'+
          '<path d="M218 388V338h16v-81h24v131M225 338l18-30 15 30M229 356h24M229 374h24"/>'+
          '<path d="M267 388V321h17v-34h18v101M275 303h19M275 338h19M275 355h19M275 372h19"/>'+
          '<path d="M312 388V306h28v82M319 322h14M319 340h14M319 358h14M319 376h14"/>'+
          '<path d="M349 388V342h20v-88h28v134M361 342l22-41 14 41M360 360h29M360 377h29"/>'+
          '<path d="M404 388V298h22v-30h22v120M412 318h28M412 338h28M412 358h28M412 378h28"/>'+
          '<path d="M458 388V328h18v-106h28v166M468 328l21-47 15 47M468 347h28M468 367h28"/>'+
          '<path d="M517 388V344h17v-72h24v116M524 305h26M524 326h26M524 348h26M524 370h26"/>'+
          '<path d="M567 388V301h20v-33h22v120M575 321h26M575 342h26M575 363h26"/>'+
          '<path d="M616 388V336h18v-93h30v145M625 336l24-49 15 49M626 355h29M626 375h29"/>'+
          '<path d="M677 388V315h18v-71h27v144M686 315h27M686 337h27M686 359h27M686 379h27"/>'+
          '<path d="M731 388V342h17v-96h28v142M741 342l21-39 14 39M741 360h26M741 379h26"/>'+
          '<path d="M788 388V326h17v-69h22v131M796 326h24M796 348h24M796 370h24"/>'+
          '<path d="M838 388V340h15v-55h19v103M846 307h17M846 329h17M846 351h17M846 373h17"/>'+
        '</g>'+
        '<g fill="none" stroke="url(#sbSkyGold)" stroke-linejoin="round" stroke-linecap="round" opacity="1">'+
          '<path d="M604 388V320h22v-58h19v-76h15v-73h10V63h8V18h5v45h8v50h10v73h15v76h19v58h22v68" stroke-width="2.25"/>'+
          '<path d="M626 320h109M645 262h71M660 186h41M670 113h21" stroke-width="1.45"/>'+
          '<path d="M640 388V343h79v45M651 343v-42h57v42M662 301v-46h35v46" stroke-width="1.35"/>'+
          '<path d="M678 18V4" stroke-width="1.6"/>'+
        '</g>'+
        '<g fill="#dba64d" opacity=".75">'+
          '<circle cx="530" cy="260" r="1.6"/><circle cx="559" cy="217" r="1.1"/><circle cx="736" cy="203" r="1.4"/><circle cx="773" cy="242" r="1.1"/><circle cx="821" cy="213" r="1.4"/><circle cx="854" cy="275" r="1.1"/><circle cx="494" cy="308" r="1.1"/><circle cx="866" cy="173" r="1.2"/>'+
        '</g>'+
        '<ellipse cx="682" cy="392" rx="120" ry="7" fill="url(#sbGlow)" opacity=".58" filter="url(#sbSoftGlow)"/>'+
        '<path d="M120 403H870" stroke="#d99e3d" stroke-width="1" opacity=".28"/>'+
      '</svg>'+
    '</div>';
  }

  function curvesMarkup(){
    return '<div class="sunbliss-reference-curves" aria-hidden="true"><svg viewBox="0 0 420 150" preserveAspectRatio="none"><path d="M-10 88C68 28 127 20 194 68S312 159 430 70"/><path d="M-18 105C63 48 126 39 193 82S314 168 438 87"/><path d="M-22 122C60 67 126 59 194 96S315 176 443 104"/></svg></div>';
  }

  var style=document.createElement('style');
  style.id='sunblissCombinedBrandHeaderStyles';
  style.textContent=[
    '.topbar.sunbliss-premium-header{position:relative!important;isolation:isolate!important;overflow:hidden!important;height:420px!important;min-height:420px!important;max-height:none!important;padding:0!important;background:radial-gradient(560px 310px at 77% 66%,rgba(205,145,46,.06),transparent 72%),linear-gradient(118deg,#061626 0%,#081a2b 54%,#071726 100%)!important;border:0!important;box-shadow:none!important;color:#fff!important;}',
    '.topbar.sunbliss-premium-header:before{content:""!important;display:block!important;position:absolute!important;left:0!important;right:0!important;top:126px!important;height:1px!important;background:linear-gradient(90deg,transparent 0%,rgba(220,165,73,.16) 7%,rgba(220,165,73,.42) 48%,rgba(220,165,73,.16) 93%,transparent 100%)!important;z-index:5!important;}',
    '.topbar.sunbliss-premium-header:after{content:""!important;display:block!important;position:absolute!important;top:24px!important;left:57.5%!important;width:1px!important;height:80px!important;background:linear-gradient(180deg,transparent,rgba(222,169,76,.82) 15%,rgba(222,169,76,.82) 85%,transparent)!important;z-index:5!important;}',
    '.sunbliss-header-top{position:absolute!important;inset:0!important;display:block!important;z-index:10!important;}',
    '.sunbliss-reference-brand,.sunbliss-original-brand-logo,.sunbliss-brand-logo{display:none!important;}',
    '.sunbliss-brand-identity{position:absolute!important;left:28px!important;top:21px!important;width:51%!important;height:90px!important;display:flex!important;align-items:center!important;overflow:visible!important;max-width:none!important;}',
    '.sunbliss-brand-identity>.sunbliss-brand-mark,.sunbliss-brand-identity>.sunbliss-brand-copy{display:none!important;}',
    '.sunbliss-combined-brand-lockup{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:contain!important;object-position:left center!important;border:0!important;background:transparent!important;filter:drop-shadow(0 6px 18px rgba(0,0,0,.18))!important;}',
    '.sunbliss-header-tools{position:absolute!important;right:158px!important;top:35px!important;display:flex!important;align-items:center!important;gap:0!important;padding:0!important;z-index:12!important;}',
    '.sunbliss-sync-pill{height:48px!important;min-width:155px!important;padding:0 17px!important;gap:10px!important;border:1px solid rgba(227,195,136,.20)!important;border-radius:17px!important;background:rgba(6,20,33,.66)!important;color:#f6f2e9!important;font:500 13px/1 Inter,system-ui,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;-webkit-backdrop-filter:blur(12px)!important;backdrop-filter:blur(12px)!important;}',
    '.sunbliss-sync-pill svg{width:20px!important;height:20px!important;stroke:#d8a146!important;stroke-width:2!important;}',
    '.sunbliss-bell{display:none!important;}',
    '.sunbliss-hero-signout{position:absolute!important;right:28px!important;top:35px!important;bottom:auto!important;height:48px!important;min-width:118px!important;padding:0 17px!important;gap:9px!important;border:1px solid #c99134!important;border-radius:14px!important;background:rgba(7,22,35,.58)!important;color:#fff!important;font:600 13px/1 Inter,system-ui,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;z-index:14!important;}',
    '.sunbliss-hero-signout svg{width:20px!important;height:20px!important;stroke:#d89e3b!important;stroke-width:2!important;}',
    '.sunbliss-hero-copy{position:absolute!important;left:30px!important;top:166px!important;z-index:12!important;width:52%!important;max-width:none!important;margin:0!important;}',
    '.sunbliss-welcome{margin:0 0 10px!important;color:#fff!important;font:400 19px/1.15 Inter,system-ui,sans-serif!important;letter-spacing:-.015em!important;}',
    '.sunbliss-name-line{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:14px!important;}',
    '.sunbliss-name-line h1{margin:0!important;color:#fff!important;font:650 44px/1.02 Inter,system-ui,sans-serif!important;letter-spacing:-.045em!important;white-space:nowrap!important;text-shadow:none!important;}',
    '.sunbliss-role-pill{min-height:37px!important;padding:0 16px!important;border:1px solid #d29a38!important;border-radius:999px!important;background:rgba(7,22,35,.48)!important;color:#e5ae4d!important;font:650 12px/1 Inter,system-ui,sans-serif!important;white-space:nowrap!important;}',
    '.sunbliss-project-line{position:relative!important;box-sizing:border-box!important;width:300px!important;height:66px!important;margin:28px 0 0!important;padding:0 42px 0 58px!important;display:flex!important;align-items:center!important;gap:12px!important;border:1px solid rgba(220,170,82,.42)!important;border-radius:18px!important;background:rgba(6,20,33,.38)!important;color:#fff!important;font:650 17px/1 Inter,system-ui,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;}',
    '.sunbliss-project-line svg{position:absolute!important;left:19px!important;width:25px!important;height:25px!important;stroke:#dfa742!important;stroke-width:1.85!important;}',
    '.sunbliss-project-line:before{content:"";position:absolute;left:50px;top:15px;width:1px;height:35px;background:rgba(215,160,66,.58);}',
    '.sunbliss-project-line .sunbliss-project-chevron{position:absolute;right:18px;top:50%;transform:translateY(-52%);color:#e0a23c;font:400 34px/1 Arial,sans-serif;}',
    '.sunbliss-hero-art,.sunbliss-hero-line{display:none!important;}',
    '.sunbliss-hero-shade{position:absolute!important;inset:0!important;z-index:-3!important;background:linear-gradient(90deg,rgba(5,20,33,.98) 0%,rgba(5,20,33,.94) 40%,rgba(5,20,33,.47) 64%,rgba(5,20,33,.05) 100%)!important;}',
    '.sunbliss-hero-shade:after{display:none!important;}',
    '.sunbliss-reference-skyline{position:absolute;right:-14px;bottom:6px;width:63%;height:78%;z-index:-1;pointer-events:none;opacity:.98;}',
    '.sunbliss-reference-skyline svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 8px rgba(214,155,55,.09));}',
    '.sunbliss-reference-curves{position:absolute;left:-10px;bottom:-3px;width:47%;height:118px;z-index:-2;pointer-events:none;opacity:.27;}',
    '.sunbliss-reference-curves svg{display:block;width:100%;height:100%;}',
    '.sunbliss-reference-curves path{fill:none;stroke:#d09a3c;stroke-width:1.2;}',
    '.sunbliss-hero-curve{display:none!important;}',
    'main{border-radius:0!important;}',
    '@media(max-width:720px){',
      '.topbar.sunbliss-premium-header{height:306px!important;min-height:306px!important;padding:0!important;}',
      '.topbar.sunbliss-premium-header:before{top:82px!important;}',
      '.topbar.sunbliss-premium-header:after{top:15px!important;left:auto!important;right:177px!important;height:50px!important;opacity:.72!important;}',
      '.sunbliss-brand-identity{left:12px!important;top:10px!important;width:calc(100% - 196px)!important;height:62px!important;}',
      '.sunbliss-combined-brand-lockup{object-fit:contain!important;object-position:left center!important;}',
      '.sunbliss-header-tools{right:104px!important;top:19px!important;}',
      '.sunbliss-sync-pill{height:36px!important;min-width:82px!important;padding:0 8px!important;gap:6px!important;border-radius:12px!important;font-size:9.5px!important;}',
      '.sunbliss-sync-pill svg{width:15px!important;height:15px!important;}',
      '.sunbliss-hero-signout{right:10px!important;top:19px!important;height:36px!important;min-width:86px!important;padding:0 10px!important;gap:6px!important;border-radius:11px!important;font-size:10px!important;}',
      '.sunbliss-hero-signout svg{width:16px!important;height:16px!important;}',
      '.sunbliss-hero-copy{left:16px!important;top:111px!important;width:61%!important;}',
      '.sunbliss-welcome{margin-bottom:6px!important;font-size:13px!important;}',
      '.sunbliss-name-line{gap:7px!important;}',
      '.sunbliss-name-line h1{font-size:28px!important;letter-spacing:-.04em!important;}',
      '.sunbliss-role-pill{min-height:27px!important;padding:0 9px!important;font-size:8.5px!important;}',
      '.sunbliss-project-line{width:min(240px,88vw)!important;height:54px!important;margin-top:20px!important;padding-left:48px!important;padding-right:34px!important;border-radius:15px!important;font-size:13px!important;}',
      '.sunbliss-project-line svg{left:16px!important;width:21px!important;height:21px!important;}',
      '.sunbliss-project-line:before{left:41px;top:12px;height:29px;}',
      '.sunbliss-project-line .sunbliss-project-chevron{right:13px;font-size:29px;}',
      '.sunbliss-reference-skyline{right:-42px!important;bottom:0!important;width:70%!important;height:72%!important;opacity:.96!important;}',
      '.sunbliss-reference-curves{left:-32px!important;bottom:-5px!important;width:64%!important;height:92px!important;opacity:.22!important;}',
      'main{border-radius:0!important;}',
    '}',
    '@media(max-width:385px){',
      '.topbar.sunbliss-premium-header{height:294px!important;min-height:294px!important;}',
      '.topbar.sunbliss-premium-header:after{right:165px!important;}',
      '.sunbliss-brand-identity{width:calc(100% - 184px)!important;height:58px!important;}',
      '.sunbliss-header-tools{right:98px!important;}',
      '.sunbliss-sync-pill{min-width:78px!important;padding:0 7px!important;font-size:9px!important;}',
      '.sunbliss-hero-signout{min-width:82px!important;padding:0 8px!important;font-size:9.4px!important;}',
      '.sunbliss-hero-copy{top:107px!important;width:64%!important;}',
      '.sunbliss-name-line h1{font-size:26px!important;}',
      '.sunbliss-role-pill{font-size:8px!important;}',
      '.sunbliss-project-line{width:min(228px,88vw)!important;font-size:12.5px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function ensureCombinedBrand(){
    var header=document.querySelector('.topbar.sunbliss-premium-header');
    var top=header&&header.querySelector('.sunbliss-header-top');
    if(!header||!top)return;

    var identity=top.querySelector('.sunbliss-brand-identity');
    if(!identity){
      identity=document.createElement('div');
      identity.className='sunbliss-brand-identity';
      top.insertBefore(identity,top.firstChild);
    }
    var image=identity.querySelector('.sunbliss-combined-brand-lockup');
    if(!image){
      image=document.createElement('img');
      image.className='sunbliss-combined-brand-lockup';
      image.alt='Purvanchal Real Estate Developers LLC';
      identity.insertBefore(image,identity.firstChild);
    }
    if(image.getAttribute('src')!==ASSET)image.setAttribute('src',ASSET);
    identity.setAttribute('role','img');
    identity.setAttribute('aria-label','Purvanchal Real Estate Developers LLC — Known for quality and commitment');

    top.querySelectorAll('.sunbliss-bell').forEach(function(el){el.remove();});

    if(!header.querySelector('.sunbliss-reference-skyline')){
      header.insertAdjacentHTML('beforeend',skylineMarkup());
    }
    if(!header.querySelector('.sunbliss-reference-curves')){
      header.insertAdjacentHTML('beforeend',curvesMarkup());
    }

    var project=header.querySelector('.sunbliss-project-line');
    if(project&&!project.querySelector('.sunbliss-project-chevron')){
      var chevron=document.createElement('span');
      chevron.className='sunbliss-project-chevron';
      chevron.textContent='›';
      project.appendChild(chevron);
    }
  }

  function schedule(){
    window.requestAnimationFrame(function(){
      ensureCombinedBrand();
      window.requestAnimationFrame(ensureCombinedBrand);
    });
  }

  if(typeof window.render==='function'&&!window.__sunblissCombinedBrandHeaderRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      schedule();
      return result;
    };
    window.__sunblissCombinedBrandHeaderRenderWrapped=true;
  }

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    var observer=new MutationObserver(function(){schedule();});
    observer.observe(app,{childList:true,subtree:true});
  }

  ensureCombinedBrand();
  schedule();
  window.setTimeout(ensureCombinedBrand,50);
})();
