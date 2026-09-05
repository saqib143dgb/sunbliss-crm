(function(){
  'use strict';
  if(window.__sunblissGlobalVisualStabilityInstalled)return;
  window.__sunblissGlobalVisualStabilityInstalled=true;

  function installStyle(){
    if(document.getElementById('globalVisualStabilityStyles'))return;
    var style=document.createElement('style');
    style.id='globalVisualStabilityStyles';
    style.textContent=[
      '#app,#app *{animation:none!important;transition:none!important}',
      '#app{contain:layout style;}',
      '#main,.overview,.detail,.units,.insights{opacity:1!important;transform:none!important}',
      '.stage-card,.scheduled-task-card,.scheduled-overview-row,.notice,.card,.detail section{backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '@media(prefers-reduced-motion:no-preference){html{scroll-behavior:auto!important}}',

      /* Desktop customer record: one consistent content grid instead of mobile rows stretched across the workspace. */
      '@media(min-width:1024px){',
      'body.sunbliss-ref-desktop .detail{width:100%!important;max-width:1240px!important;margin:0 auto!important;padding:24px 32px 112px!important;box-sizing:border-box!important;}',
      'body.sunbliss-ref-desktop .detail .d-name{font-size:25px!important;line-height:1.12!important;}',
      'body.sunbliss-ref-desktop .detail .section-label{margin-top:26px!important;margin-bottom:10px!important;}',

      /* Contact, unit detail and Sale & Compliance rows share the same desktop columns. */
      'body.sunbliss-ref-desktop .detail .field-row,body.sunbliss-ref-desktop .detail .field-address{display:grid!important;grid-template-columns:205px minmax(0,1fr)!important;column-gap:26px!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 2px!important;margin:0!important;border-bottom:1px solid var(--paper-line)!important;font-size:12.5px!important;}',
      'body.sunbliss-ref-desktop .detail .field-label{display:block!important;margin:0!important;color:var(--muted)!important;line-height:1.35!important;}',
      'body.sunbliss-ref-desktop .detail .field-value{display:block!important;min-width:0!important;max-width:100%!important;justify-self:start!important;text-align:left!important;line-height:1.45!important;word-break:break-word!important;}',
      'body.sunbliss-ref-desktop .detail .field-address .field-label{margin:0!important;}',
      'body.sunbliss-ref-desktop .detail .field-address .field-value{font-family:Inter,system-ui,sans-serif!important;font-size:12.5px!important;}',
      'body.sunbliss-ref-desktop .detail .mask-btn{justify-self:start!important;text-align:left!important;}',

      /* Keep action pills aligned to the same record edge. */
      'body.sunbliss-ref-desktop .detail .reminder-actions{display:flex!important;align-items:center!important;gap:9px!important;margin:12px 0 20px!important;}',
      'body.sunbliss-ref-desktop .detail .reminder-actions .btn-paper{margin:0!important;}',

      /* Financial summary now uses the complete desktop content width with equal cards. */
      'body.sunbliss-ref-desktop .detail .money-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important;max-width:none!important;margin:18px 0 14px!important;border-radius:13px!important;}',
      'body.sunbliss-ref-desktop .detail .money-cell{min-width:0!important;min-height:92px!important;padding:17px 16px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}',
      'body.sunbliss-ref-desktop .detail .money-label{margin:0 0 8px!important;}',
      'body.sunbliss-ref-desktop .detail .money-value{font-size:18px!important;line-height:1.15!important;margin:0!important;white-space:nowrap!important;}',
      'body.sunbliss-ref-desktop .detail .cust-progress{width:100%!important;margin:4px 0 24px!important;}',
      'body.sunbliss-ref-desktop .detail .cust-progress .bar{width:100%!important;}',
      'body.sunbliss-ref-desktop .detail .bar-caption{margin-top:8px!important;}',

      /* Desktop installment ledger: cards use the available grid instead of a mobile horizontal scroller. */
      'body.sunbliss-ref-desktop .detail .ledger-scroll{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;overflow:visible!important;scroll-snap-type:none!important;padding:4px 0 14px!important;}',
      'body.sunbliss-ref-desktop .detail .stage-card{width:auto!important;min-width:0!important;flex:none!important;scroll-snap-align:none!important;}',

      /* Transaction rows follow a stable date / description / amount desktop grid. */
      'body.sunbliss-ref-desktop .detail .tx-list{width:100%!important;border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important;}',
      'body.sunbliss-ref-desktop .detail .tx-row{display:grid!important;grid-template-columns:112px minmax(0,1fr) auto!important;align-items:center!important;gap:18px!important;padding:12px 14px!important;border-bottom:1px solid var(--paper-line)!important;}',
      'body.sunbliss-ref-desktop .detail .tx-row:last-child{border-bottom:0!important;}',
      'body.sunbliss-ref-desktop .detail .tx-date{width:auto!important;}',
      'body.sunbliss-ref-desktop .detail .tx-amt{text-align:right!important;white-space:nowrap!important;}',

      /* The persistent Back control is centered inside the workspace, not the full browser including the sidebar. */
      'body.sunbliss-ref-desktop #sunblissPersistentBack{left:calc(50% + 108px)!important;width:min(600px,calc(100vw - 280px))!important;bottom:14px!important;}',

      /* Desktop Insights: compact cards into fixed row counts so zooming does not keep changing the composition. */
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .overview{width:100%!important;max-width:none!important;box-sizing:border-box!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .sb-insights-inline-grid{display:grid!important;width:100%!important;align-items:stretch!important;gap:1px!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .sb-insights-inline-grid[data-sb-cols="2"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .sb-insights-inline-grid[data-sb-cols="3"]{grid-template-columns:repeat(3,minmax(0,1fr))!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .sb-insights-inline-grid>.stat-cell{min-width:0!important;width:auto!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid]{display:grid!important;width:100%!important;gap:10px!important;align-items:stretch!important;flex-wrap:nowrap!important;margin:6px 0 18px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid="3"]{grid-template-columns:repeat(3,minmax(0,1fr))!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid="2"],body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid="aging"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid]>.pill-stat{display:flex!important;flex-direction:column!important;justify-content:center!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:84px!important;margin:0!important;padding:13px 14px!important;overflow:hidden!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid] .pill-stat-num{min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .pipeline[data-sb-insights-grid] .pill-stat-lbl{white-space:normal!important;overflow-wrap:anywhere!important;}',
      'body.sunbliss-ref-desktop #main[data-sb-layout-view="insights"] .section-label{clear:both!important;}',
      '}',
      '@media(min-width:1440px){body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important;}}',
      '@media(min-width:1800px){body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important;}}',
      '@media(min-width:1024px) and (max-width:1180px){body.sunbliss-ref-desktop .detail{padding-left:24px!important;padding-right:24px!important;}body.sunbliss-ref-desktop .detail .field-row,body.sunbliss-ref-desktop .detail .field-address{grid-template-columns:175px minmax(0,1fr)!important;column-gap:20px!important;}body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(3,minmax(0,1fr))!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function normalize(value){return String(value==null?'':value).replace(/\s+/g,' ').trim().toLowerCase();}

  function previousSectionLabel(node){
    var current=node ? node.previousElementSibling : null;
    var guard=0;
    while(current&&guard++<5){
      if(current.classList&&current.classList.contains('section-label'))return normalize(current.textContent);
      current=current.previousElementSibling;
    }
    return '';
  }

  function syncInsightsLayout(){
    var main=document.getElementById('main');
    if(!main)return;
    var isInsights=!!(window.state&&state.view==='insights');
    if(!isInsights){
      main.removeAttribute('data-sb-layout-view');
      return;
    }
    main.setAttribute('data-sb-layout-view','insights');
    var overview=main.querySelector('.overview');
    if(!overview)return;

    overview.querySelectorAll('.pipeline').forEach(function(pipeline){
      var count=pipeline.children ? pipeline.children.length : 0;
      var label=previousSectionLabel(pipeline);
      var kind='';
      if(label.indexOf('overdue aging')!==-1)kind='aging';
      else if(count>=3)kind='3';
      else if(count===2)kind='2';
      if(kind)pipeline.setAttribute('data-sb-insights-grid',kind);
      else pipeline.removeAttribute('data-sb-insights-grid');
    });

    Array.prototype.forEach.call(overview.children,function(node){
      if(!node||node.tagName!=='DIV')return;
      var cells=node.querySelectorAll(':scope > .stat-cell');
      if(cells.length===2||cells.length===3){
        node.classList.add('sb-insights-inline-grid');
        node.setAttribute('data-sb-cols',String(cells.length));
      }
    });
  }

  var queued=false;
  function scheduleInsightsLayout(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;syncInsightsLayout();});
  }

  function wrap(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sbInsightsLayoutWrapped)return;
    function wrapped(){
      var result=original.apply(this,arguments);
      scheduleInsightsLayout();
      return result;
    }
    wrapped.__sbInsightsLayoutWrapped=true;
    wrapped.__sbOriginal=original;
    window[name]=wrapped;
  }

  function install(){
    installStyle();
    wrap('render');
    wrap('renderMain');
    wrap('renderInsights');
    syncInsightsLayout();
    window.addEventListener('resize',scheduleInsightsLayout,{passive:true});
    window.addEventListener('pageshow',scheduleInsightsLayout);
    setTimeout(function(){wrap('render');wrap('renderMain');wrap('renderInsights');scheduleInsightsLayout();},120);
  }

  install();
})();
