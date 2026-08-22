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

    .topbar .header-project-line{
      margin:0 auto!important;
      color:rgba(237,230,214,.68);
      font-size:11.5px;
      font-weight:500;
      line-height:1.25;
      letter-spacing:.075em;
      text-align:center;
      white-space:nowrap;
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

      .topbar .header-project-line{
        font-size:10.5px;
        letter-spacing:.065em;
      }
    }
  `;

  function ensureProjectLine(){
    var title = document.querySelector('.topbar .title');
    if (!title || !title.parentNode) return;

    var line = title.parentNode.querySelector('.header-project-line');
    if (!line) {
      line = document.createElement('div');
      line.className = 'header-project-line';
      title.parentNode.insertBefore(line, title.nextSibling);
    }
    line.textContent = 'Sunbliss Residences';
  }

  if (typeof window.render === 'function' && !window.__sunblissHeaderProjectLineWrapped) {
    var originalRender = window.render;
    window.render = function(){
      var result = originalRender.apply(this, arguments);
      ensureProjectLine();
      return result;
    };
    window.__sunblissHeaderProjectLineWrapped = true;
  }

  ensureProjectLine();
})();
