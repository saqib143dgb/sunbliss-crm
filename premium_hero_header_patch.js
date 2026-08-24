(function(){
  'use strict';

  if (window.__sunblissPremiumHeroHeaderInstalled) return;
  window.__sunblissPremiumHeroHeaderInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function roleLabel(value){
    var role=text(value).trim().toLowerCase();
    if (role==='crm_officer') return 'CRM Officer';
    if (role==='manager') return 'Manager';
    return role.replace(/_/g,' ').replace(/\b\w/g,function(ch){ return ch.toUpperCase(); });
  }
  function syncTime(value){
    if (!value) return '';
    var date=new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }
  function syncIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.1A7 7 0 0 1 18.4 6L20 8"/><path d="M17.9 15.9A7 7 0 0 1 5.6 18L4 16"/></svg>';
  }
  function bellIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
  }
  function projectIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l6-3v16"/><path d="M10 21V3l8 4v14"/><path d="M2 21h20"/><path d="M7 11h1M7 15h1M13 9h1M13 13h1M16 10h1M16 14h1"/></svg>';
  }
  function signoutIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>';
  }
  function chartMark(){
    return '<span class="sunbliss-curve-bars"><i></i><i></i><i></i></span>';
  }

  function ensureStyles(){
    if (document.getElementById('sunblissPremiumHeroHeaderStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissPremiumHeroHeaderStyles';
    style.textContent=[
      '.topbar.sunbliss-premium-header{position:relative!important;isolation:isolate!important;overflow:hidden!important;min-height:382px!important;box-sizing:border-box!important;padding:24px 28px 76px!important;border:0!important;color:#f8f3e8!important;text-align:left!important;background:radial-gradient(520px 270px at 72% 34%,rgba(201,152,61,.11),transparent 68%),linear-gradient(122deg,#0a1620 0%,#0c1a25 57%,#101e28 100%)!important;box-shadow:none!important;}',
      '.topbar.sunbliss-premium-header::after{display:none!important;}',
      '.sunbliss-hero-art{position:absolute;z-index:-3;right:-2%;bottom:34px;width:52%;height:79%;background-repeat:no-repeat;background-size:cover;background-position:center 48%;opacity:.64;filter:saturate(.72) brightness(.70) contrast(1.09);border-radius:20px 0 0 0;}',
      '.sunbliss-hero-shade{position:absolute;z-index:-2;inset:0;background:linear-gradient(90deg,#0a1620 0%,rgba(10,22,32,.98) 28%,rgba(10,22,32,.78) 48%,rgba(10,22,32,.17) 79%,rgba(10,22,32,.08) 100%),linear-gradient(0deg,#0a1620 0%,rgba(10,22,32,.03) 40%,rgba(10,22,32,.22) 100%);pointer-events:none;}',
      '.sunbliss-hero-line{position:absolute;z-index:-1;right:11%;top:112px;width:290px;height:1px;background:linear-gradient(90deg,transparent,rgba(208,159,67,.48),transparent);transform:rotate(-37deg);transform-origin:center;opacity:.75;pointer-events:none;}',
      '.sunbliss-header-top{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;}',
      '.sunbliss-brand-logo{display:block;width:164px;height:auto;max-height:150px;object-fit:contain;object-position:left top;filter:drop-shadow(0 8px 20px rgba(0,0,0,.18));}',
      '.sunbliss-header-tools{display:flex;align-items:center;gap:9px;padding-top:3px;}',
      '.sunbliss-sync-pill{height:43px;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:0 14px;border:1px solid rgba(246,231,196,.21);border-radius:14px;background:rgba(8,18,27,.44);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 9px 26px rgba(0,0,0,.12);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:rgba(255,250,240,.92);font:600 12.5px/1 Inter,system-ui,sans-serif;white-space:nowrap;}',
      '.sunbliss-sync-pill svg{width:17px;height:17px;fill:none;stroke:#d4a24f;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
      '.sunbliss-bell{position:relative;width:43px;height:43px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border:1px solid rgba(246,231,196,.21);border-radius:14px;background:rgba(8,18,27,.44);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 9px 26px rgba(0,0,0,.12);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:#f8f3e8;}',
      '.sunbliss-bell svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}',
      '.sunbliss-bell-dot{position:absolute;right:6px;top:6px;width:8px;height:8px;border:1.5px solid #13212b;border-radius:50%;background:linear-gradient(135deg,#f0c068,#c98d31);box-shadow:0 0 10px rgba(214,161,73,.35);}',
      '.sunbliss-hero-copy{position:relative;z-index:2;max-width:56%;margin-top:33px;}',
      '.sunbliss-welcome{margin:0 0 7px;color:rgba(248,243,232,.90);font:500 16px/1.25 Inter,system-ui,sans-serif;letter-spacing:-.01em;}',
      '.sunbliss-name-line{display:flex;align-items:center;flex-wrap:wrap;gap:11px 14px;}',
      '.sunbliss-name-line h1{margin:0;color:#fffaf1;font:650 41px/1.02 Inter,system-ui,sans-serif;letter-spacing:-.045em;text-shadow:0 5px 20px rgba(0,0,0,.16);}',
      '.sunbliss-role-pill{display:inline-flex;align-items:center;min-height:34px;box-sizing:border-box;padding:0 14px;border:1px solid rgba(219,164,71,.77);border-radius:999px;background:rgba(10,22,32,.36);color:#e7b760;font:650 12px/1 Inter,system-ui,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.015);white-space:nowrap;}',
      '.sunbliss-project-line{display:flex;align-items:center;gap:9px;margin-top:18px;color:rgba(255,250,241,.94);font:550 17px/1.25 Inter,system-ui,sans-serif;}',
      '.sunbliss-project-line svg{width:20px;height:20px;fill:none;stroke:#dfad58;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;}',
      '.sunbliss-hero-signout{position:absolute;z-index:3;right:28px;bottom:72px;height:44px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 17px;border:1px solid rgba(219,164,71,.72);border-radius:14px;background:rgba(8,18,27,.50);color:#fffaf1;font:650 13px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.025);-webkit-backdrop-filter:blur(15px);backdrop-filter:blur(15px);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:background .15s ease,border-color .15s ease,transform .12s ease;}',
      '.sunbliss-hero-signout:hover{background:rgba(16,31,42,.70);border-color:rgba(232,182,91,.92);}',
      '.sunbliss-hero-signout:active{transform:scale(.985);}',
      '.sunbliss-hero-signout:focus-visible{outline:2px solid #e1ae54;outline-offset:3px;}',
      '.sunbliss-hero-signout svg{width:18px;height:18px;fill:none;stroke:#e3b058;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
      '.sunbliss-hero-curve{position:absolute;z-index:4;left:0;right:0;bottom:-1px;height:43px;background:var(--paper,#f7f3eb);border-radius:38px 38px 0 0;box-shadow:0 -1px 0 rgba(230,216,187,.18);pointer-events:none;}',
      '.sunbliss-curve-medallion{position:absolute;left:50%;top:-27px;width:56px;height:56px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border:2px solid rgba(218,164,71,.76);border-radius:50%;background:linear-gradient(145deg,#fffaf0,#eee2cd);box-shadow:0 5px 17px rgba(12,24,34,.18),inset 0 1px 0 rgba(255,255,255,.9);transform:translateX(-50%);}',
      '.sunbliss-curve-bars{height:23px;display:flex;align-items:flex-end;gap:3px;}',
      '.sunbliss-curve-bars i{display:block;width:5px;border-radius:2px 2px 0 0;background:linear-gradient(180deg,#e5b45c,#bd7f26);box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}',
      '.sunbliss-curve-bars i:nth-child(1){height:12px}.sunbliss-curve-bars i:nth-child(2){height:22px}.sunbliss-curve-bars i:nth-child(3){height:16px}',
      '@media(max-width:720px){.topbar.sunbliss-premium-header{min-height:352px!important;padding:14px 14px 64px!important}.sunbliss-brand-logo{width:108px;max-height:116px}.sunbliss-header-tools{gap:6px;padding-top:0}.sunbliss-sync-pill{height:38px;padding:0 10px;border-radius:12px;font-size:10.5px;gap:6px}.sunbliss-sync-pill svg{width:15px;height:15px}.sunbliss-bell{width:38px;height:38px;border-radius:12px}.sunbliss-bell svg{width:18px;height:18px}.sunbliss-bell-dot{right:5px;top:5px;width:7px;height:7px}.sunbliss-hero-art{right:-24%;bottom:33px;width:82%;height:67%;opacity:.53;background-position:center 55%;border-radius:16px 0 0 0}.sunbliss-hero-shade{background:linear-gradient(90deg,#0a1620 0%,rgba(10,22,32,.97) 36%,rgba(10,22,32,.68) 61%,rgba(10,22,32,.12) 100%),linear-gradient(0deg,#0a1620 0%,rgba(10,22,32,.03) 42%,rgba(10,22,32,.22) 100%)}.sunbliss-hero-line{right:-3%;top:131px;width:205px;opacity:.55}.sunbliss-hero-copy{max-width:78%;margin-top:27px}.sunbliss-welcome{margin-bottom:5px;font-size:13px}.sunbliss-name-line{gap:8px 9px}.sunbliss-name-line h1{font-size:30px;letter-spacing:-.04em}.sunbliss-role-pill{min-height:28px;padding:0 10px;font-size:9.5px}.sunbliss-project-line{gap:7px;margin-top:13px;font-size:14px}.sunbliss-project-line svg{width:17px;height:17px}.sunbliss-hero-signout{right:14px;bottom:50px;height:38px;gap:7px;padding:0 13px;border-radius:12px;font-size:11.5px}.sunbliss-hero-signout svg{width:16px;height:16px}.sunbliss-hero-curve{height:32px;border-radius:28px 28px 0 0}.sunbliss-curve-medallion{top:-23px;width:48px;height:48px}.sunbliss-curve-bars{height:20px}.sunbliss-curve-bars i{width:4px}.sunbliss-curve-bars i:nth-child(1){height:10px}.sunbliss-curve-bars i:nth-child(2){height:19px}.sunbliss-curve-bars i:nth-child(3){height:14px}}',
      '@media(max-width:385px){.sunbliss-brand-logo{width:96px}.sunbliss-sync-pill{padding:0 8px;font-size:9.7px}.sunbliss-hero-copy{max-width:82%;margin-top:24px}.sunbliss-name-line h1{font-size:27px}.sunbliss-project-line{font-size:13px}}',
      '@media(prefers-reduced-motion:reduce){.sunbliss-hero-signout{transition:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function applyHeader(){
    ensureStyles();
    var header=document.querySelector('.topbar');
    if (!header || !window.state) return;

    var name=text(state.userName).trim() || 'CRM User';
    var role=roleLabel(state.userRole);
    var synced=syncTime(state.syncedAt);
    var logoData=window.__sunblissHeroLogo || '';
    var buildingData=window.__sunblissHeroBuilding || '';
    var signature=[name,role,synced,logoData.length,buildingData.length].join('|');
    if (header.getAttribute('data-premium-signature')===signature) return;

    header.className='topbar sunbliss-premium-header';
    header.setAttribute('data-premium-signature',signature);
    header.innerHTML=
      '<div class="sunbliss-hero-art"'+(buildingData?' style="background-image:url(data:image/webp;base64,'+buildingData+')"':'')+'></div>'+
      '<div class="sunbliss-hero-shade"></div><div class="sunbliss-hero-line" aria-hidden="true"></div>'+
      '<div class="sunbliss-header-top">'+
        (logoData?'<img class="sunbliss-brand-logo" src="data:image/webp;base64,'+logoData+'" alt="Purvanchal Real Estate Developers LLC" />':'<div></div>')+
        '<div class="sunbliss-header-tools">'+
          '<div class="sunbliss-sync-pill" aria-label="CRM data synced '+safe(synced||'recently')+'">'+syncIcon()+'<span>Synced'+(synced?' '+safe(synced):'')+'</span></div>'+
          '<div class="sunbliss-bell" aria-hidden="true">'+bellIcon()+'<span class="sunbliss-bell-dot"></span></div>'+
        '</div>'+
      '</div>'+
      '<div class="sunbliss-hero-copy">'+
        '<p class="sunbliss-welcome">Welcome back,</p>'+
        '<div class="sunbliss-name-line"><h1>'+safe(name)+'</h1>'+(role?'<span class="sunbliss-role-pill">'+safe(role)+'</span>':'')+'</div>'+
        '<div class="sunbliss-project-line">'+projectIcon()+'<span>Sunbliss Residences</span></div>'+
      '</div>'+
      '<button type="button" id="btnSignOut" class="sunbliss-hero-signout">'+signoutIcon()+'<span>Sign out</span></button>'+
      '<div class="sunbliss-hero-curve" aria-hidden="true"><span class="sunbliss-curve-medallion">'+chartMark()+'</span></div>';

    var signout=header.querySelector('#btnSignOut');
    if (signout && window.sb && sb.auth){
      signout.addEventListener('click',async function(){
        signout.disabled=true;
        try{ await sb.auth.signOut(); } finally { location.reload(); }
      });
    }
  }

  if (typeof window.render==='function' && !window.__sunblissPremiumHeroRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      applyHeader();
      return result;
    };
    window.__sunblissPremiumHeroRenderWrapped=true;
  }

  window.addEventListener('pageshow',applyHeader);
  applyHeader();
})();