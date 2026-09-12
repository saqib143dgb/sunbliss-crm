(function(){
  'use strict';
  if(document.getElementById('sunblissDldTrackerHeadingStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissDldTrackerHeadingStyle';
  style.textContent=[
    '@media(max-width:1023px){',
      '/* DLD tracker: approved boxed heading, while preserving all existing text sizes. */',
      '.overview>.section-label:has(+ div[style*="grid-template-columns:1fr 1fr"]){',
        'display:flex!important;',
        'align-items:center!important;',
        'min-height:44px!important;',
        'margin:10px 0 8px!important;',
        'padding:0 14px!important;',
        'border:1px solid var(--paper-line)!important;',
        'border-radius:14px!important;',
        'background:var(--paper)!important;',
        'box-shadow:0 2px 8px rgba(15,26,38,.025)!important;',
        'color:var(--muted)!important;',
      '}',
      '.overview>.section-label:has(+ div[style*="grid-template-columns:1fr 1fr"])+div{',
        'border-radius:14px!important;',
        'margin-bottom:8px!important;',
        'box-shadow:0 2px 8px rgba(15,26,38,.02)!important;',
      '}',
      '.overview>.section-label:has(+ div[style*="grid-template-columns:1fr 1fr"])+div+.pipeline{',
        'display:grid!important;',
        'grid-template-columns:repeat(2,minmax(0,1fr))!important;',
        'gap:8px!important;',
        'margin:0 0 10px!important;',
      '}',
      '.overview>.section-label:has(+ div[style*="grid-template-columns:1fr 1fr"])+div+.pipeline .pill-stat{',
        'min-width:0!important;',
        'border-radius:14px!important;',
      '}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
