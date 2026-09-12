(function(){
  'use strict';
  if(document.getElementById('sunblissDldTrackerHeadingStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissDldTrackerHeadingStyle';
  style.textContent=[
    '@media(max-width:1023px){',
      '/* DLD tracker: approved boxed heading. Text size intentionally inherited unchanged. */',
      '.section-label.sunbliss-dld-heading{',
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
    '}'
  ].join('');
  document.head.appendChild(style);

  function normalize(text){
    return String(text||'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  function applyHeading(){
    if(window.innerWidth>1023)return;
    var labels=document.querySelectorAll('.section-label');
    for(var i=0;i<labels.length;i++){
      var el=labels[i];
      if(normalize(el.textContent)==='DLD & REGISTRATION FEE TRACKER'){
        el.classList.add('sunbliss-dld-heading');
      }
    }
  }

  applyHeading();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyHeading,{once:true});
  }
  var root=document.getElementById('app')||document.documentElement;
  if(window.MutationObserver){
    new MutationObserver(applyHeading).observe(root,{childList:true,subtree:true,characterData:true});
  }
  window.addEventListener('resize',applyHeading,{passive:true});
})();
