(function(){
  'use strict';

  if (window.__sunblissOriginalBrandLogoInstalled) return;
  window.__sunblissOriginalBrandLogoInstalled = true;

  function normalizeLogoData(value){
    var data=String(value||'').trim();
    if(!data) return '';
    if(/^data:image\//i.test(data)) return data;
    return 'data:image/webp;base64,'+data;
  }

  function restoreOriginalLogo(){
    var top=document.querySelector('.sunbliss-header-top');
    if(!top) return;

    var recreated=top.querySelector('.sunbliss-reference-brand');
    if(recreated) recreated.remove();

    var logo=top.querySelector('.sunbliss-original-brand-logo');
    var logoData=normalizeLogoData(window.__sunblissHeroLogo || '');
    if(!logoData) return;

    if(!logo){
      logo=document.createElement('img');
      logo.className='sunbliss-original-brand-logo';
      logo.alt='Purvanchal Real Estate Developers LLC';
      top.insertBefore(logo,top.firstChild);
    }
    if(logo.getAttribute('src')!==logoData) logo.setAttribute('src',logoData);
  }

  var style=document.createElement('style');
  style.id='sunblissOriginalBrandLogoStyles';
  style.textContent=`
    .sunbliss-reference-brand,
    .sunbliss-brand-logo{
      display:none!important;
    }
    .sunbliss-original-brand-logo{
      display:block!important;
      width:78px!important;
      height:auto!important;
      max-height:90px!important;
      object-fit:contain!important;
      object-position:left top!important;
      flex:none!important;
      filter:drop-shadow(0 6px 16px rgba(0,0,0,.16));
    }
    @media(max-width:720px){
      .sunbliss-original-brand-logo{
        width:60px!important;
        max-height:70px!important;
      }
    }
    @media(max-width:385px){
      .sunbliss-original-brand-logo{
        width:56px!important;
        max-height:66px!important;
      }
    }
  `;
  document.head.appendChild(style);

  if(typeof window.render==='function'&&!window.__sunblissOriginalBrandLogoRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      restoreOriginalLogo();
      return result;
    };
    window.__sunblissOriginalBrandLogoRenderWrapped=true;
  }

  restoreOriginalLogo();
  setTimeout(restoreOriginalLogo,0);
})();
