(function(){
  'use strict';

  var style = document.getElementById('sunblissHeaderSpacingStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'sunblissHeaderSpacingStyle';
    document.head.appendChild(style);
  }

  style.textContent = `
    .topbar{
      padding-top:24px!important;
      padding-bottom:18px!important;
    }

    .topbar .brand-row{
      margin-bottom:12px!important;
    }

    .topbar .brand-row>div{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      width:100%;
      gap:10px!important;
    }

    .topbar .eyebrow,
    .topbar .title{
      margin:0 auto!important;
    }

    @media (max-width:480px){
      .topbar{
        padding-top:20px!important;
        padding-bottom:15px!important;
      }

      .topbar .brand-row{
        margin-bottom:10px!important;
      }

      .topbar .brand-row>div{
        gap:8px!important;
      }
    }
  `;
})();
