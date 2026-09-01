(function(){
  'use strict';

  if (window.__sunblissReferencePMarkHeaderInstalled) return;
  window.__sunblissReferencePMarkHeaderInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissReferencePMarkHeaderStyles';
  style.textContent = [
    '.sunbliss-header-top{align-items:center!important;}',
    '.sunbliss-brand-identity{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;min-width:0!important;max-width:420px!important;flex:1 1 auto!important;}',
    '.sunbliss-brand-mark{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-width:0!important;}',
    '.sunbliss-original-brand-logo{display:none!important;}',
    '.sunbliss-reference-p-logo{display:block!important;width:78px!important;height:78px!important;max-width:none!important;max-height:none!important;object-fit:contain!important;object-position:center!important;flex:0 0 auto!important;filter:drop-shadow(0 8px 20px rgba(0,0,0,.22))!important;}',
    '.sunbliss-brand-copy{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;min-width:0!important;padding:0!important;border:0!important;text-shadow:0 2px 12px rgba(0,0,0,.16)!important;}',
    '.sunbliss-brand-primary{margin:0!important;color:#e8b65c!important;font:800 20px/.98 Inter,system-ui,sans-serif!important;letter-spacing:.035em!important;white-space:nowrap!important;}',
    '.sunbliss-brand-legal{margin:5px 0 0!important;color:#e6b25a!important;font:750 9.6px/1.05 Inter,system-ui,sans-serif!important;letter-spacing:.018em!important;white-space:nowrap!important;}',
    '.sunbliss-brand-tagline{display:none!important;}',
    '.sunbliss-header-tools{flex:none!important;}',
    '@media(max-width:720px){',
      '.sunbliss-header-top{gap:7px!important;}',
      '.sunbliss-brand-identity{max-width:calc(100% - 137px)!important;gap:8px!important;}',
      '.sunbliss-reference-p-logo{width:58px!important;height:58px!important;}',
      '.sunbliss-brand-primary{font-size:13.5px!important;letter-spacing:.025em!important;}',
      '.sunbliss-brand-legal{margin-top:3px!important;font-size:6.35px!important;letter-spacing:.008em!important;}',
    '}',
    '@media(max-width:385px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 132px)!important;gap:7px!important;}',
      '.sunbliss-reference-p-logo{width:53px!important;height:53px!important;}',
      '.sunbliss-brand-primary{font-size:12px!important;}',
      '.sunbliss-brand-legal{font-size:5.65px!important;}',
    '}',
    '@media(max-width:340px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 125px)!important;gap:6px!important;}',
      '.sunbliss-reference-p-logo{width:48px!important;height:48px!important;}',
      '.sunbliss-brand-primary{font-size:10.7px!important;}',
      '.sunbliss-brand-legal{font-size:5px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function ensureReferenceLockup(){
    var top = document.querySelector('.sunbliss-header-top');
    if (!top) return;

    var identity = top.querySelector('.sunbliss-brand-identity');
    if (!identity){
      identity = document.createElement('div');
      identity.className = 'sunbliss-brand-identity';
      top.insertBefore(identity, top.firstChild);
    }

    var mark = identity.querySelector('.sunbliss-brand-mark');
    if (!mark){
      mark = document.createElement('div');
      mark.className = 'sunbliss-brand-mark';
      identity.insertBefore(mark, identity.firstChild);
    }

    var logo = mark.querySelector('.sunbliss-reference-p-logo');
    if (!logo){
      logo = document.createElement('img');
      logo.className = 'sunbliss-reference-p-logo';
      logo.alt = 'Purvanchal Dubai logo';
      mark.insertBefore(logo, mark.firstChild);
    }
    if (logo.getAttribute('src') !== 'assets/purvanchal-p-dubai.png'){
      logo.setAttribute('src','assets/purvanchal-p-dubai.png');
    }

    var copy = identity.querySelector('.sunbliss-brand-copy');
    if (!copy){
      copy = document.createElement('div');
      copy.className = 'sunbliss-brand-copy';
      identity.appendChild(copy);
    }
    if (copy.getAttribute('data-reference-company-copy') !== '1'){
      copy.innerHTML =
        '<p class="sunbliss-brand-primary">PURVANCHAL</p>' +
        '<p class="sunbliss-brand-legal">REAL ESTATE DEVELOPERS LLC</p>';
      copy.setAttribute('data-reference-company-copy','1');
    }

    identity.setAttribute('role','img');
    identity.setAttribute('aria-label','Purvanchal Real Estate Developers LLC');
  }

  function schedule(){
    window.requestAnimationFrame(function(){
      ensureReferenceLockup();
      window.requestAnimationFrame(ensureReferenceLockup);
    });
  }

  if (typeof window.render === 'function' && !window.__sunblissReferencePMarkHeaderRenderWrapped){
    var previousRender = window.render;
    window.render = function(){
      var result = previousRender.apply(this,arguments);
      schedule();
      return result;
    };
    window.__sunblissReferencePMarkHeaderRenderWrapped = true;
  }

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){ schedule(); });
    observer.observe(app,{childList:true,subtree:true});
  }

  window.addEventListener('resize',schedule,{passive:true});
  ensureReferenceLockup();
  schedule();
  window.setTimeout(ensureReferenceLockup,50);
})();
