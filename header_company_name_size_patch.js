(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;
  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .sb-pro-brand{width:max-content!important;max-width:72%!important;}
    .sb-pro-brand-name{display:block!important;font-size:50px!important;}
    .sb-pro-brand-sub{display:block!important;width:100%!important;font-size:14px!important;letter-spacing:.02em!important;text-align:justify!important;text-align-last:justify!important;white-space:nowrap!important;}
    @media(max-width:720px){
      .sb-pro-brand{width:max-content!important;max-width:69%!important;}
      .sb-pro-brand-name{font-size:33px!important;}
      .sb-pro-brand-sub{width:100%!important;font-size:10.8px!important;letter-spacing:.01em!important;text-align:justify!important;text-align-last:justify!important;}
    }
    @media(max-width:390px){
      .sb-pro-brand{width:max-content!important;max-width:67%!important;}
      .sb-pro-brand-name{font-size:30px!important;}
      .sb-pro-brand-sub{width:100%!important;font-size:10px!important;letter-spacing:0!important;text-align:justify!important;text-align-last:justify!important;}
    }
  `;
  document.head.appendChild(style);
})();
