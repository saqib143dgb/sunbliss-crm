(function(){
  'use strict';
  if(window.__sunblissProfessionalHeaderTextV2Installed)return;
  window.__sunblissProfessionalHeaderTextV2Installed=true;

  function text(v){return v===null||v===undefined?'':String(v);}
  function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function roleLabel(v){
    var s=text(v).trim().toLowerCase();
    if(s==='crm_officer')return 'CRM Officer';
    if(s==='manager')return 'Manager';
    return s.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();})||'CRM Officer';
  }
  function syncTime(v){
    if(!v)return 'Just now';
    var d=new Date(v);
    if(isNaN(d.getTime()))return 'Just now';
    return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }
  function syncIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8.5 12.2l2.3 2.3 4.8-5"/></svg>';}
  function signoutIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>';}
  function projectIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l6-3v16"/><path d="M10 21V3l8 4v14"/><path d="M2 21h20"/><path d="M7 11h1M7 15h1M13 9h1M13 13h1M16 10h1M16 14h1"/></svg>';}

  function ensureStyles(){
    [
      'sunblissProfessionalHeaderStyles','sunblissFreshReferenceHeaderStyles','sunblissFreshReferenceMobileMatchStyles',
      'sunblissHeaderCompactStyle','sunblissHeaderSpacingStyle','sunblissPremiumHeroHeaderStyles',
      'sunblissPremiumHeroRefineStyles','sunblissHeaderImageEdgeFixStyles','sunblissHeaderCurveRemoveStyles',
      'sunblissOriginalBrandLogoStyles','sunblissHeader30PctAlignStyles','sunblissBrandIdentitySplitStyles',
      'sunblissReferencePMarkHeaderStyles','sunblissCombinedBrandHeaderStyles'
    ].forEach(function(id){var n=document.getElementById(id);if(n)n.remove();});
    if(document.getElementById('sunblissProfessionalHeaderTextV2Styles'))return;

    var style=document.createElement('style');
    style.id='sunblissProfessionalHeaderTextV2Styles';
    style.textContent=`
      .topbar.sunbliss-professional-header{
        position:relative!important;overflow:hidden!important;min-height:292px!important;box-sizing:border-box!important;
        padding:22px 28px 28px!important;border:0!important;border-radius:0!important;color:#f8f4ea!important;text-align:left!important;
        background:radial-gradient(430px 220px at 88% 18%,rgba(198,151,46,.11),transparent 68%),linear-gradient(118deg,#071520 0%,#0a1a26 54%,#0d202d 100%)!important;box-shadow:none!important;
      }
      .topbar.sunbliss-professional-header::before{content:''!important;display:block!important;position:absolute;right:-80px;bottom:-125px;width:330px;height:330px;border:1px solid rgba(198,151,46,.12);border-radius:50%;box-shadow:0 0 0 46px rgba(198,151,46,.035),0 0 0 92px rgba(198,151,46,.018);pointer-events:none;}
      .topbar.sunbliss-professional-header::after{content:''!important;display:block!important;position:absolute;left:28px;right:28px;top:126px;height:1px;background:linear-gradient(90deg,rgba(198,151,46,.55),rgba(198,151,46,.15),transparent 84%);pointer-events:none;}
      .sb-pro-top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:80px;}
      .sb-pro-brand{display:flex;flex-direction:column;justify-content:center;min-width:0;max-width:62%;}
      .sb-pro-brand-name{margin:0;color:#e0aa4e;font:500 29px/1 Georgia,'Times New Roman',serif;letter-spacing:.055em;white-space:nowrap;text-shadow:0 1px 10px rgba(198,151,46,.08);}
      .sb-pro-brand-sub{margin-top:5px;color:rgba(228,180,92,.9);font:600 8.5px/1.25 Inter,system-ui,sans-serif;letter-spacing:.28em;white-space:nowrap;}
      .sb-pro-actions{display:flex;align-items:center;gap:10px;flex:none;}
      .sb-pro-signout{height:40px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid rgba(214,162,70,.68);border-radius:12px;background:rgba(255,255,255,.018);color:#fffaf0;font:600 12px/1 Inter,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
      .sb-pro-signout svg{width:17px;height:17px;fill:none;stroke:#dfaa4f;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
      .sb-pro-main{position:relative;z-index:2;margin-top:34px;}
      .sb-pro-copy{min-width:0;width:100%;}.sb-pro-welcome{margin:0 0 6px;color:rgba(248,244,234,.68);font:500 13px/1.3 Inter,system-ui,sans-serif;letter-spacing:.01em;}
      .sb-pro-name-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}.sb-pro-name{margin:0;color:#fff;font:650 34px/1.04 Inter,system-ui,sans-serif;letter-spacing:-.035em;text-shadow:0 2px 12px rgba(0,0,0,.14);}
      .sb-pro-role{display:inline-flex;align-items:center;min-height:31px;padding:0 12px;border:1px solid rgba(214,162,70,.76);border-radius:999px;background:rgba(198,151,46,.045);color:#e2b157;font:650 10.5px/1 Inter,system-ui,sans-serif;white-space:nowrap;}
      .sb-pro-project-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;min-width:0;}
      .sb-pro-project{display:flex;align-items:center;gap:9px;min-width:0;color:#f5f0e6;font:600 14px/1.2 Inter,system-ui,sans-serif;}
      .sb-pro-project-icon{width:31px;height:31px;display:flex;align-items:center;justify-content:center;flex:none;border:1px solid rgba(214,162,70,.32);border-radius:9px;background:rgba(198,151,46,.045);}
      .sb-pro-project-icon svg{width:17px;height:17px;fill:none;stroke:#d7a44d;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}.sb-pro-project-sep{width:24px;height:1px;background:linear-gradient(90deg,#c6972e,transparent);opacity:.75;flex:none;}
      .sb-pro-sync{height:32px;display:flex;align-items:center;gap:7px;padding:0 11px;flex:none;border:1px solid rgba(237,230,214,.14);border-radius:10px;background:rgba(255,255,255,.022);color:rgba(248,244,234,.64);font:500 10.5px/1 Inter,system-ui,sans-serif;white-space:nowrap;}
      .sb-pro-sync svg{width:14px;height:14px;fill:none;stroke:#d6a246;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
      @media(max-width:720px){
        .topbar.sunbliss-professional-header{min-height:220px!important;padding:14px 16px 20px!important;}.topbar.sunbliss-professional-header::after{left:16px;right:16px;top:82px;}.topbar.sunbliss-professional-header::before{width:220px;height:220px;right:-85px;bottom:-112px;box-shadow:0 0 0 32px rgba(198,151,46,.03),0 0 0 64px rgba(198,151,46,.015);}
        .sb-pro-top{min-height:54px;gap:12px;}.sb-pro-brand{max-width:62%;}.sb-pro-brand-name{font-size:20px;letter-spacing:.045em;}.sb-pro-brand-sub{margin-top:4px;font-size:6.5px;letter-spacing:.18em;}.sb-pro-signout{height:34px;padding:0 10px;gap:6px;border-radius:10px;font-size:10px;}.sb-pro-signout svg{width:15px;height:15px;}
        .sb-pro-main{margin-top:24px;}.sb-pro-welcome{margin-bottom:4px;font-size:11px;}.sb-pro-name-row{gap:8px;flex-wrap:nowrap;}.sb-pro-name{font-size:25px;white-space:nowrap;}.sb-pro-role{min-height:26px;padding:0 9px;font-size:8.5px;}
        .sb-pro-project-row{margin-top:12px;gap:10px;}.sb-pro-project{gap:7px;font-size:12px;}.sb-pro-project-icon{width:27px;height:27px;border-radius:8px;}.sb-pro-project-icon svg{width:15px;height:15px;}.sb-pro-project-sep{width:12px;}.sb-pro-sync{height:28px;padding:0 8px;gap:5px;border-radius:9px;font-size:8.8px;}.sb-pro-sync svg{width:12px;height:12px;}
      }
      @media(max-width:390px){.topbar.sunbliss-professional-header{min-height:216px!important;padding-left:13px!important;padding-right:13px!important;}.topbar.sunbliss-professional-header::after{left:13px;right:13px;}.sb-pro-brand{max-width:60%;}.sb-pro-brand-name{font-size:18px;}.sb-pro-brand-sub{font-size:6px;letter-spacing:.15em;}.sb-pro-signout{padding:0 8px;font-size:9.4px;}.sb-pro-name{font-size:23px;}.sb-pro-role{padding:0 8px;font-size:8px;}.sb-pro-project{font-size:11.3px;}.sb-pro-sync{padding:0 7px;font-size:8.2px;}}
    `;
    document.head.appendChild(style);
  }

  function markup(){
    var st=window.state||{};
    var name=text(st.userName).trim()||'CRM User';
    var role=roleLabel(st.userRole);
    var synced=syncTime(st.syncedAt);
    return '<div class="sb-pro-top">'+
        '<div class="sb-pro-brand" aria-label="Purvanchal Real Estate Developers LLC"><div class="sb-pro-brand-name">PURVANCHAL</div><div class="sb-pro-brand-sub">REAL ESTATE DEVELOPERS LLC</div></div>'+
        '<div class="sb-pro-actions"><button type="button" class="sb-pro-signout" id="btnSignOut">'+signoutIcon()+'<span>Sign out</span></button></div>'+
      '</div>'+
    '<div class="sb-pro-main"><div class="sb-pro-copy">'+
        '<p class="sb-pro-welcome">Welcome back</p>'+
        '<div class="sb-pro-name-row"><h1 class="sb-pro-name">'+esc(name)+'</h1><span class="sb-pro-role">'+esc(role)+'</span></div>'+
        '<div class="sb-pro-project-row">'+
          '<div class="sb-pro-project"><span class="sb-pro-project-icon">'+projectIcon()+'</span><span>Sunbliss Residences</span><span class="sb-pro-project-sep" aria-hidden="true"></span></div>'+
          '<div class="sb-pro-sync">'+syncIcon()+'<span>Synced '+esc(synced)+'</span></div>'+
        '</div>'+
      '</div></div>';
  }

  function bindSignout(header){var b=header.querySelector('#btnSignOut');if(!b||b.dataset.bound==='1')return;b.dataset.bound='1';b.addEventListener('click',async function(){b.disabled=true;try{if(window.sb&&sb.auth)await sb.auth.signOut();}finally{location.reload();}});}
  function apply(){
    ensureStyles();
    var header=document.querySelector('.topbar');
    if(!header)return;
    header.querySelectorAll('img').forEach(function(img){img.remove();});
    var st=window.state||{};
    var sig=[st.userName||'',st.userRole||'',st.syncedAt||''].join('|');
    if(header.classList.contains('sunbliss-professional-header')&&header.dataset.textV2Sig===sig){bindSignout(header);return;}
    header.className='topbar sunbliss-professional-header';
    header.dataset.textV2Sig=sig;
    header.innerHTML=markup();
    bindSignout(header);
  }
  function schedule(){requestAnimationFrame(function(){apply();requestAnimationFrame(apply);});}
  if(typeof window.render==='function'&&!window.__sunblissProfessionalHeaderTextV2RenderWrapped){var prev=window.render;window.render=function(){var r=prev.apply(this,arguments);schedule();return r;};window.__sunblissProfessionalHeaderTextV2RenderWrapped=true;}
  var app=document.getElementById('app');if(app&&window.MutationObserver){var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply();});}).observe(app,{childList:true,subtree:true});}
  apply();schedule();setTimeout(apply,60);
})();