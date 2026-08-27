(function(){
  'use strict';
  if(window.__sunblissFreshReferenceHeaderInstalled)return;
  window.__sunblissFreshReferenceHeaderInstalled=true;

  var LEGACY_STYLE_IDS=[
    'sunblissHeaderCompactStyle','sunblissHeaderSpacingStyle','sunblissPremiumHeroHeaderStyles',
    'sunblissPremiumHeroRefineStyles','sunblissHeaderImageEdgeFixStyles','sunblissHeaderCurveRemoveStyles',
    'sunblissOriginalBrandLogoStyles','sunblissHeader30PctAlignStyles','sunblissBrandIdentitySplitStyles',
    'sunblissReferencePMarkHeaderStyles','sunblissCombinedBrandHeaderStyles'
  ];

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function roleLabel(v){
    var s=String(v||'').trim().toLowerCase();
    if(s==='crm_officer')return 'CRM Officer';
    if(s==='manager')return 'Manager';
    return s.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();})||'CRM Officer';
  }
  function syncTime(v){
    var d=v?new Date(v):new Date();
    if(isNaN(d.getTime()))d=new Date();
    return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }
  function removeLegacyStyles(){
    LEGACY_STYLE_IDS.forEach(function(id){var n=document.getElementById(id);if(n)n.remove();});
  }

  function ensureStyles(){
    removeLegacyStyles();
    if(document.getElementById('sunblissFreshReferenceHeaderStyles'))return;
    var s=document.createElement('style');
    s.id='sunblissFreshReferenceHeaderStyles';
    s.textContent=`
      .topbar.sunbliss-fresh-reference-header{
        position:relative!important;
        width:100%!important;
        height:min(63.9vw,620px)!important;
        min-height:245px!important;
        max-height:620px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        border-radius:0!important;
        color:#fff!important;
        text-align:left!important;
        background:
          radial-gradient(ellipse at 70% 78%,rgba(205,148,48,.075),transparent 35%),
          radial-gradient(ellipse at 21% 17%,rgba(61,91,117,.08),transparent 29%),
          linear-gradient(115deg,#031523 0%,#031422 43%,#00111d 100%)!important;
        box-shadow:none!important;
        isolation:isolate!important;
      }
      .topbar.sunbliss-fresh-reference-header::before,
      .topbar.sunbliss-fresh-reference-header::after{display:none!important;content:none!important;}

      .sb-ref-brand{
        position:absolute;left:6.1%;top:7.3%;width:46.8%;height:20.3%;
        display:flex;align-items:center;z-index:4;pointer-events:none;
      }
      .sb-ref-brand img{display:block;width:100%;height:100%;object-fit:contain;object-position:left center;filter:none!important;}

      .sb-ref-vline{position:absolute;left:56.4%;top:8.8%;width:1px;height:16.7%;background:linear-gradient(180deg,#e1ad4e,#c98a2d);opacity:.95;z-index:3;}
      .sb-ref-hline{position:absolute;left:0;right:0;top:31%;height:1px;background:linear-gradient(90deg,rgba(186,123,35,.42),rgba(218,161,65,.34),rgba(186,123,35,.14));z-index:3;}

      .sb-ref-tools{position:absolute;right:5.7%;top:13.45%;display:flex;align-items:center;gap:1.9vw;z-index:7;}
      .sb-ref-sync,.sb-ref-signout{
        height:clamp(31px,5.15vw,80px);box-sizing:border-box;display:flex;align-items:center;justify-content:center;
        border-radius:clamp(12px,2.7vw,36px);font-family:Inter,system-ui,-apple-system,sans-serif;white-space:nowrap;
        -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
      }
      .sb-ref-sync{
        min-width:clamp(116px,19.2vw,295px);padding:0 clamp(10px,1.55vw,24px);gap:clamp(7px,.8vw,13px);
        border:1px solid rgba(126,150,169,.22);background:rgba(3,19,31,.44);color:#f6f3ee;
        font-size:clamp(9px,1.42vw,22px);font-weight:430;letter-spacing:-.015em;
      }
      .sb-ref-sync svg{width:clamp(17px,2.35vw,36px);height:clamp(17px,2.35vw,36px);fill:none;stroke:#d89a36;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;}
      .sb-ref-signout{
        min-width:clamp(96px,13.8vw,212px);padding:0 clamp(10px,1.45vw,22px);gap:clamp(7px,.9vw,14px);
        border:1.35px solid #cf9435;background:rgba(3,19,31,.35);color:#f9f6f1;
        font-size:clamp(10px,1.42vw,22px);font-weight:430;cursor:pointer;touch-action:manipulation;
      }
      .sb-ref-signout svg{width:clamp(19px,2.45vw,38px);height:clamp(19px,2.45vw,38px);fill:none;stroke:#dc9c36;stroke-width:2.05;stroke-linecap:round;stroke-linejoin:round;flex:none;}
      .sb-ref-signout:active{transform:scale(.985);}
      .sb-ref-signout:focus-visible{outline:2px solid #e7b054;outline-offset:3px;}

      .sb-ref-welcome{position:absolute;left:6.15%;top:40.2%;z-index:5;color:#f5f3f0;font:400 clamp(13px,2.3vw,35px)/1.12 Inter,system-ui,sans-serif;letter-spacing:-.025em;}
      .sb-ref-name-row{position:absolute;left:6.15%;top:47.6%;z-index:5;display:flex;align-items:center;gap:clamp(12px,2vw,31px);max-width:57%;}
      .sb-ref-name{margin:0;color:#fff;font:650 clamp(27px,5.15vw,79px)/1 Inter,system-ui,sans-serif;letter-spacing:-.045em;text-shadow:0 3px 18px rgba(0,0,0,.16);white-space:nowrap;}
      .sb-ref-role{display:flex;align-items:center;justify-content:center;height:clamp(28px,4.55vw,70px);padding:0 clamp(10px,1.8vw,28px);box-sizing:border-box;border:1.5px solid #cb8d2f;border-radius:999px;background:rgba(1,16,27,.42);color:#e2a543;font:650 clamp(9px,1.52vw,23px)/1 Inter,system-ui,sans-serif;white-space:nowrap;}

      .sb-ref-project{
        position:absolute;left:5.75%;top:61.1%;z-index:6;width:38.2%;height:13.05%;box-sizing:border-box;
        display:flex;align-items:center;border:1px solid rgba(193,125,37,.48);border-radius:clamp(17px,2.65vw,41px);background:rgba(1,17,28,.42);
        color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.01);
      }
      .sb-ref-project-icon{width:20.7%;height:100%;display:flex;align-items:center;justify-content:center;flex:none;position:relative;}
      .sb-ref-project-icon::after{content:'';position:absolute;right:0;top:24%;bottom:24%;width:1px;background:#c78b32;opacity:.78;}
      .sb-ref-project-icon svg{width:42%;height:42%;fill:none;stroke:#e6a63c;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
      .sb-ref-project-name{padding-left:4.6%;font:650 clamp(11px,2.05vw,31px)/1.1 Inter,system-ui,sans-serif;letter-spacing:-.025em;white-space:nowrap;}
      .sb-ref-project-arrow{margin-left:auto;margin-right:5.4%;font:300 clamp(22px,3.4vw,52px)/1 Inter,system-ui,sans-serif;color:#e19c32;transform:translateY(-1px);}

      .sb-ref-skyline{position:absolute;right:-.2%;bottom:0;width:59.5%;height:76%;z-index:2;pointer-events:none;opacity:.98;}
      .sb-ref-skyline svg{display:block;width:100%;height:100%;overflow:visible;}
      .sb-ref-skyline .city{fill:none;stroke:url(#sbRefGold);stroke-width:1.28;stroke-linecap:round;stroke-linejoin:round;opacity:.87;}
      .sb-ref-skyline .burj{fill:none;stroke:url(#sbRefGoldStrong);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:1;filter:url(#sbRefGlow);}
      .sb-ref-skyline .lights{fill:#e1a33e;opacity:.76;filter:url(#sbRefGlow);}
      .sb-ref-skyline .waterline{stroke:#d89a35;stroke-width:1;opacity:.58;}

      .sb-ref-curves{position:absolute;left:-6%;bottom:-4%;width:59%;height:33%;z-index:1;opacity:.28;pointer-events:none;}
      .sb-ref-curves i{position:absolute;left:0;bottom:0;width:100%;height:100%;border:1px solid rgba(183,116,31,.42);border-color:rgba(183,116,31,.42) transparent transparent transparent;border-radius:50%;transform:rotate(13deg);}
      .sb-ref-curves i:nth-child(2){transform:translate(0,13%) rotate(11deg);opacity:.78}.sb-ref-curves i:nth-child(3){transform:translate(0,26%) rotate(9deg);opacity:.55}.sb-ref-curves i:nth-child(4){transform:translate(0,39%) rotate(7deg);opacity:.36}

      @media(max-width:720px){
        .topbar.sunbliss-fresh-reference-header{height:63.9vw!important;min-height:244px!important;max-height:460px!important;}
        .sb-ref-tools{right:3.7%;gap:6px;}
        .sb-ref-brand{left:4.7%;width:49.5%;}
        .sb-ref-vline{left:56.5%;}
        .sb-ref-welcome,.sb-ref-name-row{left:5.2%;}
        .sb-ref-name-row{max-width:66%;gap:7px;}
        .sb-ref-project{left:4.8%;width:44%;}
        .sb-ref-skyline{right:-7%;width:67%;height:75%;}
      }
      @media(max-width:390px){
        .sb-ref-sync{min-width:108px;padding:0 8px;gap:5px;}
        .sb-ref-signout{min-width:88px;padding:0 8px;gap:5px;}
        .sb-ref-name-row{gap:6px;}
        .sb-ref-role{padding:0 8px;}
        .sb-ref-project{width:46.5%;}
      }
    `;
    document.head.appendChild(s);
  }

  function syncIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.2 8.1A7 7 0 0 1 18.3 6L20 8"/><path d="M17.8 15.9A7 7 0 0 1 5.7 18L4 16"/></svg>';}
  function signoutIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>';}
  function projectIcon(){return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 42V18l13-7v31M21 42V7l18 10v25M4 42h40"/><path d="M13 23h4M13 30h4M26 18h4M26 25h4M34 21h3M34 28h3"/></svg>';}

  function skyline(){
    return '<div class="sb-ref-skyline" aria-hidden="true"><svg viewBox="0 0 920 600" preserveAspectRatio="xMidYMax meet">'+
      '<defs><linearGradient id="sbRefGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9d6926"/><stop offset=".5" stop-color="#e0ad52"/><stop offset="1" stop-color="#b67a2b"/></linearGradient><linearGradient id="sbRefGoldStrong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c56b"/><stop offset=".45" stop-color="#daa14a"/><stop offset="1" stop-color="#a76b24"/></linearGradient><filter id="sbRefGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+
      '<g class="city">'+
      '<path d="M10 564H910" class="waterline"/>'+
      '<path d="M35 564V489h22v-38h20v113M45 489l21-28 11 28M46 510h23M46 531h23M46 551h23"/>'+
      '<path d="M92 564V510h19v-86h30v140M102 510l24-39 15 39M103 529h29M103 550h29"/>'+
      '<path d="M151 564V472h26v-31h18v123M160 491h26M160 513h26M160 535h26"/>'+
      '<path d="M205 564V505h20v-117h34v176M216 505l26-57 17 57M217 526h31M217 548h31"/>'+
      '<path d="M272 564V480h24v-52h25v136M282 497h28M282 520h28M282 543h28"/>'+
      '<path d="M334 564V515h21v-135h38v184M345 515l29-65 19 65M346 537h35"/>'+
      '<path d="M408 564V470h28v-57h23v151M418 492h31M418 516h31M418 540h31"/>'+
      '<path d="M475 564V504h22v-104h35v164M486 504l28-50 18 50M487 526h33M487 548h33"/>'+
      '<path d="M548 564V487h24v-43h25v120M558 506h29M558 529h29M558 550h29"/>'+
      '<path d="M704 564V516h18v-131h37v179M715 516l26-63 18 63M716 538h31"/>'+
      '<path d="M771 564V487h23v-70h30v147M781 506h33M781 530h33M781 551h33"/>'+
      '<path d="M837 564V513h18v-95h27v146M846 513l22-42 14 42M847 535h28M847 553h28"/>'+
      '</g>'+
      '<g class="burj"><path d="M603 564V493h20v-69h18v-83h14v-91h10v-83h8V97h6V44h4V8h4v36h5v53h6v70h8v83h10v91h14v83h18v69h20v71"/><path d="M623 493h125M641 424h89M655 341h61M665 250h41M673 167h25M679 97h13"/><path d="M640 564v-42h91v42M652 522v-45h67v45M664 477v-49h43v49M675 428v-52h21v52"/><path d="M685 8V0"/></g>'+
      '<g class="lights"><circle cx="414" cy="535" r="2.2"/><circle cx="512" cy="515" r="1.6"/><circle cx="739" cy="536" r="2"/><circle cx="807" cy="526" r="1.7"/><circle cx="865" cy="542" r="1.5"/><circle cx="351" cy="510" r="1.4"/></g>'+
      '</svg></div>';
  }

  function markup(){
    var st=window.state||{};
    var name=String(st.userName||'Saqib Azmi').trim()||'Saqib Azmi';
    var role=roleLabel(st.userRole||'crm_officer');
    var synced=syncTime(st.syncedAt);
    return '<div class="sb-ref-brand"><img src="assets/purvanchal-full-lockup.webp" alt="Purvanchal Real Estate Developers LLC — Known for quality and commitment"></div>'+
      '<div class="sb-ref-vline" aria-hidden="true"></div><div class="sb-ref-hline" aria-hidden="true"></div>'+
      '<div class="sb-ref-tools"><div class="sb-ref-sync">'+syncIcon()+'<span>Synced '+esc(synced)+'</span></div><button type="button" class="sb-ref-signout" id="btnSignOut">'+signoutIcon()+'<span>Sign out</span></button></div>'+
      '<div class="sb-ref-welcome">Welcome back,</div><div class="sb-ref-name-row"><h1 class="sb-ref-name">'+esc(name)+'</h1><span class="sb-ref-role">'+esc(role)+'</span></div>'+
      '<div class="sb-ref-project"> <span class="sb-ref-project-icon">'+projectIcon()+'</span><span class="sb-ref-project-name">Sunbliss Residences</span><span class="sb-ref-project-arrow">›</span></div>'+
      skyline()+'<div class="sb-ref-curves" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  }

  function bindSignout(header){
    var b=header.querySelector('#btnSignOut');
    if(!b||b.dataset.bound==='1')return;
    b.dataset.bound='1';
    b.addEventListener('click',async function(){
      b.disabled=true;
      try{if(window.sb&&sb.auth)await sb.auth.signOut();}finally{location.reload();}
    });
  }

  function apply(){
    ensureStyles();
    var header=document.querySelector('.topbar');
    if(!header)return;
    var st=window.state||{};
    var sig=[st.userName||'',st.userRole||'',st.syncedAt||''].join('|');
    if(header.classList.contains('sunbliss-fresh-reference-header')&&header.dataset.refSig===sig){bindSignout(header);return;}
    header.className='topbar sunbliss-fresh-reference-header';
    header.dataset.refSig=sig;
    header.innerHTML=markup();
    bindSignout(header);
  }
  function schedule(){requestAnimationFrame(function(){apply();requestAnimationFrame(apply);});}

  if(typeof window.render==='function'&&!window.__sunblissFreshReferenceRenderWrapped){
    var prev=window.render;
    window.render=function(){var r=prev.apply(this,arguments);schedule();return r;};
    window.__sunblissFreshReferenceRenderWrapped=true;
  }
  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    var queued=false;
    new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply();});}).observe(app,{childList:true,subtree:true});
  }
  apply();schedule();setTimeout(apply,60);
})();
