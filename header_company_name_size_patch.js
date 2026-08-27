(function(){
  'use strict';
  if(document.getElementById('sunblissHeaderCompanyNameSizeStyles')) return;
  var style=document.createElement('style');
  style.id='sunblissHeaderCompanyNameSizeStyles';
  style.textContent=`
    .sb-pro-brand{max-width:66%!important;}
    .sb-pro-brand-name{font-size:33px!important;}
    .sb-pro-brand-sub{font-size:9.3px!important;letter-spacing:.25em!important;}
    @media(max-width:720px){
      .sb-pro-brand{max-width:65%!important;}
      .sb-pro-brand-name{font-size:22px!important;}
      .sb-pro-brand-sub{font-size:7.2px!important;letter-spacing:.16em!important;}
    }
    @media(max-width:390px){
      .sb-pro-brand{max-width:63%!important;}
      .sb-pro-brand-name{font-size:20px!important;}
      .sb-pro-brand-sub{font-size:6.7px!important;letter-spacing:.14em!important;}
    }
  `;
  document.head.appendChild(style);
})();
