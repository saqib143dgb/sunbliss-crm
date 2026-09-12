(function(){
  'use strict';
  if(document.getElementById('sunblissDldTrackerHeadingStyle'))return;

  var style=document.createElement('style');
  style.id='sunblissDldTrackerHeadingStyle';
  style.textContent=[
    '@media(max-width:1023px){',
      '/* DLD tracker — match the approved generated reference. Typography sizes stay inherited. */',
      '.section-label.sunbliss-dld-heading{',
        'display:flex!important;',
        'align-items:center!important;',
        'min-height:34px!important;',
        'margin:10px 0 6px!important;',
        'padding:0 14px!important;',
        'border:1px solid var(--paper-line)!important;',
        'border-radius:12px!important;',
        'background:var(--paper)!important;',
        'box-shadow:0 2px 8px rgba(15,26,38,.025)!important;',
        'color:var(--muted)!important;',
      '}',
      '.sunbliss-dld-summary{',
        'overflow:hidden!important;',
        'border-radius:12px!important;',
        'margin-bottom:10px!important;',
        'box-shadow:0 2px 8px rgba(15,26,38,.02)!important;',
      '}',
      '.sunbliss-dld-summary>.stat-cell{',
        'padding:12px 14px!important;',
        'background:linear-gradient(to bottom,rgba(235,227,206,.42) 0 35px,var(--paper) 35px 100%)!important;',
      '}',
      '.sunbliss-dld-pipeline{',
        'display:grid!important;',
        'grid-template-columns:repeat(2,minmax(0,1fr))!important;',
        'gap:8px!important;',
        'margin:0 0 10px!important;',
      '}',
      '.sunbliss-dld-pipeline .pill-stat{',
        'min-width:0!important;',
        'padding:10px 12px!important;',
        'border-radius:12px!important;',
      '}',
    '}'
  ].join('');
  document.head.appendChild(style);

  function normalize(text){
    return String(text||'').replace(/\s+/g,' ').trim().toUpperCase();
  }

  function applyDesign(){
    if(window.innerWidth>1023)return;
    var labels=document.querySelectorAll('.section-label');
    for(var i=0;i<labels.length;i++){
      var heading=labels[i];
      if(normalize(heading.textContent)!=='DLD & REGISTRATION FEE TRACKER')continue;

      heading.classList.add('sunbliss-dld-heading');
      var summary=heading.nextElementSibling;
      if(summary){
        summary.classList.add('sunbliss-dld-summary');
        var pipeline=summary.nextElementSibling;
        if(pipeline && pipeline.classList.contains('pipeline')){
          pipeline.classList.add('sunbliss-dld-pipeline');
        }
      }
    }
  }

  applyDesign();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyDesign,{once:true});
  }
  var root=document.getElementById('app')||document.documentElement;
  if(window.MutationObserver){
    var queued=false;
    new MutationObserver(function(){
      if(queued)return;
      queued=true;
      requestAnimationFrame(function(){queued=false;applyDesign();});
    }).observe(root,{childList:true,subtree:true,characterData:true});
  }
  window.addEventListener('resize',applyDesign,{passive:true});
})();
