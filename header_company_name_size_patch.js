(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;
  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .sb-pro-brand{max-width:72%!important;}
    .sb-pro-brand-name{font-size:50px!important;}
    .sb-pro-brand-sub{font-size:14px!important;letter-spacing:.20em!important;}
    @media(max-width:720px){
      .sb-pro-brand{max-width:69%!important;}
      .sb-pro-brand-name{font-size:33px!important;}
      .sb-pro-brand-sub{font-size:10.8px!important;letter-spacing:.12em!important;}
    }
    @media(max-width:390px){
      .sb-pro-brand{max-width:67%!important;}
      .sb-pro-brand-name{font-size:30px!important;}
      .sb-pro-brand-sub{font-size:10px!important;letter-spacing:.10em!important;}
    }
  `;
  document.head.appendChild(style);
})();
