(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;

  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .topbar.sunbliss-professional-header{min-height:280px!important;padding-bottom:16px!important;}
    .sb-pro-project-sep{display:none!important;}
    .sb-pro-brand{width:max-content!important;max-width:72%!important;}
    .sb-pro-brand-name{display:block!important;font-size:50px!important;white-space:nowrap!important;}
    .sb-pro-brand-sub{display:block!important;width:max-content!important;font-size:14px!important;letter-spacing:0;white-space:nowrap!important;text-align:left!important;text-align-last:auto!important;}
    @media(max-width:720px){
      .topbar.sunbliss-professional-header{min-height:208px!important;padding-bottom:10px!important;}
      .sb-pro-brand{width:max-content!important;max-width:69%!important;}
      .sb-pro-brand-name{font-size:33px!important;}
      .sb-pro-brand-sub{font-size:10.8px!important;}
    }
    @media(max-width:390px){
      .topbar.sunbliss-professional-header{min-height:204px!important;padding-bottom:8px!important;}
      .sb-pro-brand{width:max-content!important;max-width:67%!important;}
      .sb-pro-brand-name{font-size:30px!important;}
      .sb-pro-brand-sub{font-size:10px!important;}
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
