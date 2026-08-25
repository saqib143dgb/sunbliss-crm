(function(){
  'use strict';

  if (window.__sunblissBrandIdentitySplitInstalled) return;
  window.__sunblissBrandIdentitySplitInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBrandIdentitySplitStyles';
  style.textContent = [
    '.sunbliss-header-top{align-items:center!important;}',
    '.sunbliss-brand-identity{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;min-width:0;max-width:390px;flex:1 1 auto;gap:13px;}',
    '.sunbliss-brand-mark{position:relative;display:flex;align-items:center;justify-content:center;flex:none;min-width:0;}',
    '.sunbliss-original-brand-logo{width:70px!important;max-height:80px!important;filter:drop-shadow(0 8px 20px rgba(0,0,0,.22))!important;}',
    '.sunbliss-brand-copy{min-width:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding-left:0!important;border-left:0!important;text-shadow:0 2px 12px rgba(0,0,0,.16);}',
    '.sunbliss-brand-primary{margin:0;color:#e8b65c;font:800 20px/.96 Inter,system-ui,sans-serif;letter-spacing:.045em;white-space:nowrap;}',
    '.sunbliss-brand-legal{margin:5px 0 0;color:#e6b25a;font:750 9.4px/1.05 Inter,system-ui,sans-serif;letter-spacing:.025em;white-space:nowrap;}',
    '.sunbliss-brand-tagline{margin:6px 0 0;color:rgba(176,128,205,.92);font:600 6.25px/1 Inter,system-ui,sans-serif;letter-spacing:.24em;white-space:nowrap;text-transform:uppercase;}',
    '.sunbliss-header-tools{flex:none!important;}',
    '@media(max-width:720px){',
      '.sunbliss-header-top{gap:7px!important;}',
      '.sunbliss-brand-identity{max-width:calc(100% - 137px);gap:8px;}',
      '.sunbliss-original-brand-logo{width:52px!important;max-height:60px!important;}',
      '.sunbliss-brand-copy{padding-left:0!important;}',
      '.sunbliss-brand-primary{font-size:13.2px;letter-spacing:.035em;}',
      '.sunbliss-brand-legal{margin-top:3px;font-size:6.25px;letter-spacing:.012em;}',
      '.sunbliss-brand-tagline{margin-top:3.5px;font-size:4.75px;letter-spacing:.17em;}',
    '}',
    '@media(max-width:385px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 132px);gap:7px;}',
      '.sunbliss-original-brand-logo{width:49px!important;max-height:57px!important;}',
      '.sunbliss-brand-primary{font-size:11.9px;}',
      '.sunbliss-brand-legal{font-size:5.55px;}',
      '.sunbliss-brand-tagline{font-size:4.25px;letter-spacing:.135em;}',
    '}',
    '@media(max-width:340px){',
      '.sunbliss-brand-identity{max-width:calc(100% - 125px);gap:6px;}',
      '.sunbliss-original-brand-logo{width:46px!important;max-height:54px!important;}',
      '.sunbliss-brand-primary{font-size:10.7px;}',
      '.sunbliss-brand-legal{font-size:5px;}',
      '.sunbliss-brand-tagline{font-size:3.9px;letter-spacing:.105em;}',
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
