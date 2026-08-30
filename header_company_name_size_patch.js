(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .topbar.sunbliss-professional-header{min-height:280px!important;padding-bottom:16px!important;}
    .sb-pro-project-sep{display:none!important;}
    .sb-pro-signout{height:36px!important;padding:0 11px!important;gap:6px!important;border-radius:10px!important;font-size:11px!important;}
    .sb-pro-signout svg{width:15px!important;height:15px!important;}
    .sb-pro-brand{width:max-content!important;max-width:72%!important;}
    .sb-pro-brand-name{display:block!important;font-size:50px!important;white-space:nowrap!important;}
    .sb-pro-brand-sub{display:block!important;width:100%!important;font-size:14px!important;letter-spacing:0!important;white-space:nowrap!important;text-align:justify!important;text-align-last:justify!important;}
    @media(max-width:720px){
      .topbar.sunbliss-professional-header{min-height:208px!important;padding-bottom:10px!important;}
      .sb-pro-signout{height:30px!important;padding:0 8px!important;gap:5px!important;border-radius:9px!important;font-size:9.2px!important;}
      .sb-pro-signout svg{width:13px!important;height:13px!important;}
      .sb-pro-brand{width:max-content!important;max-width:69%!important;}
      .sb-pro-brand-name{font-size:33px!important;}
      .sb-pro-brand-sub{font-size:10.8px!important;}
    }
    @media(max-width:390px){
      .topbar.sunbliss-professional-header{min-height:204px!important;padding-bottom:8px!important;}
      .sb-pro-signout{padding:0 7px!important;font-size:8.8px!important;}
      .sb-pro-brand{width:max-content!important;max-width:67%!important;}
      .sb-pro-brand-name{font-size:30px!important;}
      .sb-pro-brand-sub{font-size:10px!important;}
    }
  `;
  document.head.appendChild(style);
})();
