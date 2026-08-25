(function(){
  'use strict';

  if (window.__sunblissBrandIdentitySplitInstalled) return;
  window.__sunblissBrandIdentitySplitInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBrandIdentitySplitStyles';
  style.textContent = [
    '.sunbliss-header-top{align-items:center!important;}',
    '.sunbliss-brand-identity{display:flex;align-items:center;min-width:0;max-width:360px;flex:1 1 auto;gap:11px;}',
    '.sunbliss-brand-mark{position:relative;display:flex;align-items:center;justify-content:center;flex:none;min-width:0;}',
    '.sunbliss-original-brand-logo{width:58px!important;max-height:66px!important;filter:drop-shadow(0 7px 18px rgba(0,0,0,.20))!important;}',
    '.sunbliss-brand-copy{min-width:0;display:flex;flex-direction:column;justify-content:center;padding-left:12px;border-left:1px solid rgba(222,174,91,.32);text-shadow:0 2px 12px rgba(0,0,0,.16);}',
    '.sunbliss-brand-primary{margin:0;color:#e7b85e;font:800 19px/.96 Inter,system-ui,sans-serif;letter-spacing:.055em;white-space:nowrap;}',
    '.sunbliss-brand-legal{margin:5px 0 0;color:rgba(255,247,229,.92);font:750 9.2px/1.08 Inter,system-ui,sans-serif;letter-spacing:.035em;white-space:nowrap;}',
    '.sunbliss-brand-tagline{margin:5px 0 0;color:rgba(203,173,225,.82);font:650 6.7px/1.1 Inter,system-ui,sans-serif;letter-spacing:.20em;white-space:nowrap;text-transform:uppercase;}',
    '.sunbliss-header-tools{flex:none!important;}',
    '@media(max-width:720px){',
      '.sunbliss-header-top{gap:7px!important;}',
      '.sunbliss-brand-identity{max-width:calc(100% - 137px);gap:7px;}',
      '.sunbliss-original-brand-logo{width:42px!important;max-height:48px!important;}',
      '.sunbliss-brand-copy{padding-left:8px;}',
      '.sunbliss-brand-primary{font-size:13.3px;letter-spacing:.04em;}',
      '.sunbliss-brand-legal{margin-top:3px;font-size:6.35px;letter-spacing:.02em;}',
      '.sunbliss-brand-tagline{margin-top:3px;font-size:5.25px;letter-spacing:.12em;}',
    '}',
    '@media(max-width:385px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 132px);gap:6px;}',
      '.sunbliss-original-brand-logo{width:39px!important;max-height:45px!important;}',
      '.sunbliss-brand-copy{padding-left:7px;}',
      '.sunbliss-brand-primary{font-size:12.1px;}',
      '.sunbliss-brand-legal{font-size:5.8px;}',
      '.sunbliss-brand-tagline{font-size:4.85px;letter-spacing:.09em;}',
    '}',
    '@media(max-width:340px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 125px);}',
      '.sunbliss-original-brand-logo{width:36px!important;max-height:42px!important;}',
      '.sunbliss-brand-copy{padding-left:6px;}',
      '.sunbliss-brand-primary{font-size:10.8px;}',
      '.sunbliss-brand-legal{font-size:5.15px;}',
      '.sunbliss-brand-tagline{font-size:4.35px;letter-spacing:.065em;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function ensureBrandIdentity(){
    var top = document.querySelector('.sunbliss-header-top');
    if (!top) return;

    var logo = top.querySelector('.sunbliss-original-brand-logo');
    if (!logo) return;

    var identity = top.querySelector('.sunbliss-brand-identity');
    var mark;
    var copy;

    if (!identity){
      identity = document.createElement('div');
      identity.className = 'sunbliss-brand-identity';
      identity.setAttribute('role','img');
      identity.setAttribute('aria-label','Purvanchal Real Estate Developers LLC — Known for Quality and Commitment');

      mark = document.createElement('div');
      mark.className = 'sunbliss-brand-mark';

      copy = document.createElement('div');
      copy.className = 'sunbliss-brand-copy';
      copy.innerHTML =
        '<p class="sunbliss-brand-primary">PURVANCHAL</p>' +
        '<p class="sunbliss-brand-legal">REAL ESTATE DEVELOPERS LLC</p>' +
        '<p class="sunbliss-brand-tagline">KNOWN FOR QUALITY AND COMMITMENT</p>';

      identity.appendChild(mark);
      identity.appendChild(copy);
      top.insertBefore(identity, top.firstChild);
    } else {
      mark = identity.querySelector('.sunbliss-brand-mark');
      if (!mark){
        mark = document.createElement('div');
        mark.className = 'sunbliss-brand-mark';
        identity.insertBefore(mark, identity.firstChild);
      }
    }

    if (logo.parentNode !== mark) mark.appendChild(logo);
    logo.alt = '';
    logo.setAttribute('aria-hidden','true');
  }

  function schedule(){
    window.requestAnimationFrame(function(){
      ensureBrandIdentity();
      window.requestAnimationFrame(ensureBrandIdentity);
    });
  }

  if (typeof window.render === 'function' && !window.__sunblissBrandIdentitySplitRenderWrapped){
    var previousRender = window.render;
    window.render = function(){
      var result = previousRender.apply(this,arguments);
      schedule();
      return result;
    };
    window.__sunblissBrandIdentitySplitRenderWrapped = true;
  }

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){ schedule(); });
    observer.observe(app,{childList:true,subtree:true});
  }

  window.addEventListener('resize',schedule,{passive:true});
  ensureBrandIdentity();
  schedule();
  window.setTimeout(ensureBrandIdentity,50);
})();
