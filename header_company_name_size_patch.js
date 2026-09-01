(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;

  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .topbar.sunbliss-professional-header{min-height:280px!important;padding-bottom:16px!important;}
    .sb-pro-project-sep{display:none!important;}
    .sb-pro-signout{height:36px!important;padding:0 11px!important;gap:6px!important;border-radius:10px!important;font-size:11px!important;}
    .sb-pro-signout svg{width:15px!important;height:15px!important;}
    .sb-pro-brand{width:max-content!important;max-width:72%!important;}
    .sb-pro-brand-name{display:block!important;font-size:50px!important;white-space:nowrap!important;}
    .sb-pro-brand-sub{display:block!important;width:max-content!important;font-size:14px!important;letter-spacing:0;white-space:nowrap!important;text-align:left!important;text-align-last:auto!important;}
    @media(max-width:720px){
      .topbar.sunbliss-professional-header{min-height:208px!important;padding-bottom:10px!important;}
      .sb-pro-signout{height:30px!important;padding:0 8px!important;gap:5px!important;border-radius:9px!important;font-size:9.2px!important;}
      .sb-pro-signout svg{width:13px!important;height:13px!important;}
      .sb-pro-brand{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;width:auto!important;max-width:calc(100% - 74px)!important;}
      .sb-pro-brand-logo-frame{display:grid!important;width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;max-width:52px!important;max-height:52px!important;aspect-ratio:1 / 1!important;flex:0 0 52px!important;border-radius:50%!important;overflow:hidden!important;place-items:center!important;line-height:0!important;}
      .sb-pro-brand-logo{display:block!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:48px!important;max-height:48px!important;aspect-ratio:auto!important;object-fit:contain!important;object-position:50% 50%!important;align-self:center!important;justify-self:center!important;flex:none!important;margin:auto!important;transform:none!important;vertical-align:middle!important;}
      .sb-pro-brand-copy{display:flex!important;min-width:0!important;max-width:calc(100% - 61px)!important;flex-direction:column!important;justify-content:center!important;}
      .sb-pro-brand-name{font-size:20px!important;letter-spacing:.035em!important;}
      .sb-pro-brand-sub{font-size:6.5px!important;letter-spacing:.12em!important;}
    }
    @media(max-width:390px){
      .topbar.sunbliss-professional-header{min-height:204px!important;padding-bottom:8px!important;}
      .sb-pro-signout{padding:0 7px!important;font-size:8.8px!important;}
      .sb-pro-brand{gap:7px!important;width:auto!important;max-width:calc(100% - 69px)!important;}
      .sb-pro-brand-logo-frame{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;max-width:48px!important;max-height:48px!important;flex-basis:48px!important;}
      .sb-pro-brand-logo{max-width:44px!important;max-height:44px!important;}
      .sb-pro-brand-copy{max-width:calc(100% - 55px)!important;}
      .sb-pro-brand-name{font-size:18px!important;}
      .sb-pro-brand-sub{font-size:6px!important;letter-spacing:.1em!important;}
    }
  `;
  document.head.appendChild(style);

  function fitSubtitle(){
    var name=document.querySelector('.sb-pro-brand-name');
    var sub=document.querySelector('.sb-pro-brand-sub');
    if(!name||!sub)return;

    var target=name.getBoundingClientRect().width;
    if(!target)return;

    sub.style.letterSpacing='0px';
    var natural=sub.getBoundingClientRect().width;
    if(!natural)return;

    if(natural>=target){
      sub.style.letterSpacing='0px';
      return;
    }

    var low=0;
    var high=24;
    var i;
    for(i=0;i<18;i++){
      var mid=(low+high)/2;
      sub.style.letterSpacing=mid+'px';
      var width=sub.getBoundingClientRect().width;
      if(width<target) low=mid;
      else high=mid;
    }

    var best=(low+high)/2;
    sub.style.letterSpacing=best.toFixed(3)+'px';

    var finalWidth=sub.getBoundingClientRect().width;
    var delta=target-finalWidth;
    if(Math.abs(delta)>0.15){
      var chars=(sub.textContent||'').length;
      if(chars>0){
        best+=delta/chars;
        sub.style.letterSpacing=Math.max(0,best).toFixed(3)+'px';
      }
    }
  }

  var queued=false;
  function scheduleFit(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){
      queued=false;
      fitSubtitle();
    });
  }

  scheduleFit();
  setTimeout(scheduleFit,60);
  setTimeout(scheduleFit,250);
  setTimeout(scheduleFit,700);
  window.addEventListener('resize',scheduleFit,{passive:true});

  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(scheduleFit).catch(function(){});
  }

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(scheduleFit).observe(app,{childList:true,subtree:true});
  }
})();
