(function(){
  'use strict';
  if(window.__sunblissCombinedBrandHeaderInstalled)return;
  window.__sunblissCombinedBrandHeaderInstalled=true;

  var ASSET='assets/purvanchal-full-lockup.webp';

  var style=document.createElement('style');
  style.id='sunblissCombinedBrandHeaderStyles';
  style.textContent=[
    '.sunbliss-header-top{align-items:center!important;gap:12px!important;}',
    '.sunbliss-reference-brand,.sunbliss-original-brand-logo,.sunbliss-brand-logo{display:none!important;}',
    '.sunbliss-brand-identity{display:flex!important;align-items:center!important;justify-content:flex-start!important;flex:1 1 auto!important;min-width:0!important;max-width:none!important;height:116px!important;overflow:hidden!important;}',
    '.sunbliss-brand-identity>.sunbliss-brand-mark,.sunbliss-brand-identity>.sunbliss-brand-copy{display:none!important;}',
    '.sunbliss-combined-brand-lockup{display:block!important;width:100%!important;max-width:470px!important;height:116px!important;object-fit:cover!important;object-position:center center!important;border:0!important;border-radius:0!important;background:transparent!important;filter:none!important;flex:none!important;}',
    '.sunbliss-header-tools{flex:none!important;}',
    '@media(max-width:720px){',
      '.sunbliss-header-top{gap:7px!important;}',
      '.sunbliss-brand-identity{max-width:calc(100% - 132px)!important;height:70px!important;}',
      '.sunbliss-combined-brand-lockup{max-width:100%!important;height:70px!important;}',
    '}',
    '@media(max-width:385px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 126px)!important;height:64px!important;}',
      '.sunbliss-combined-brand-lockup{height:64px!important;}',
    '}',
    '@media(max-width:340px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 118px)!important;height:58px!important;}',
      '.sunbliss-combined-brand-lockup{height:58px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function ensureCombinedBrand(){
    var top=document.querySelector('.sunbliss-header-top');
    if(!top)return;

    var identity=top.querySelector('.sunbliss-brand-identity');
    if(!identity){
      identity=document.createElement('div');
      identity.className='sunbliss-brand-identity';
      top.insertBefore(identity,top.firstChild);
    }

    var image=identity.querySelector('.sunbliss-combined-brand-lockup');
    if(!image){
      image=document.createElement('img');
      image.className='sunbliss-combined-brand-lockup';
      image.alt='Purvanchal Real Estate Developers LLC';
      identity.insertBefore(image,identity.firstChild);
    }
    if(image.getAttribute('src')!==ASSET)image.setAttribute('src',ASSET);

    identity.setAttribute('role','img');
    identity.setAttribute('aria-label','Purvanchal Real Estate Developers LLC — Known for quality and commitment');
  }

  function schedule(){
    window.requestAnimationFrame(function(){
      ensureCombinedBrand();
      window.requestAnimationFrame(ensureCombinedBrand);
    });
  }

  if(typeof window.render==='function'&&!window.__sunblissCombinedBrandHeaderRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      schedule();
      return result;
    };
    window.__sunblissCombinedBrandHeaderRenderWrapped=true;
  }

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    var observer=new MutationObserver(function(){schedule();});
    observer.observe(app,{childList:true,subtree:true});
  }

  ensureCombinedBrand();
  schedule();
  window.setTimeout(ensureCombinedBrand,50);
})();
