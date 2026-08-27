(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;

  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .sb-pro-brand{width:max-content!important;max-width:72%!important;}
    .sb-pro-brand-name{display:block!important;font-size:50px!important;white-space:nowrap!important;}
    .sb-pro-brand-sub{display:block!important;width:auto!important;font-size:14px!important;letter-spacing:0;white-space:nowrap!important;text-align:left!important;text-align-last:auto!important;}
    @media(max-width:720px){
      .sb-pro-brand{width:max-content!important;max-width:69%!important;}
      .sb-pro-brand-name{font-size:33px!important;}
      .sb-pro-brand-sub{font-size:10.8px!important;}
    }
    @media(max-width:390px){
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

    sub.style.letterSpacing='0px';
    var target=name.getBoundingClientRect().width;
    var natural=sub.getBoundingClientRect().width;
    var chars=(sub.textContent||'').length;
    if(!target||!natural||chars<2)return;

    var spacing=Math.max(0,(target-natural)/(chars-1));
    sub.style.letterSpacing=spacing.toFixed(2)+'px';
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
  window.addEventListener('resize',scheduleFit,{passive:true});

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(scheduleFit).observe(app,{childList:true,subtree:true});
  }
})();
