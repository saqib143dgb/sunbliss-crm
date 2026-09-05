(function(){
'use strict';
if(window.__sunblissMonthlyCashFlowLabelInstalled)return;
window.__sunblissMonthlyCashFlowLabelInstalled=true;

var legacy='Built from your transaction log, so it may miss payments recorded only in Payment Dues before logging began.';
function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}

function installStyle(){
  if(document.getElementById('sunblissInsightsCompactLayoutStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissInsightsCompactLayoutStyles';
  style.textContent=[
    /* Only reorganize the DLD tracker. Keep the existing colors, borders, typography and card language untouched. */
    '.sb-dld-summary-layout{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;width:100%!important;max-width:none!important;align-items:stretch!important;justify-content:stretch!important;height:auto!important;min-height:0!important;}',
    '.sb-dld-summary-layout>.stat-cell{display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;width:100%!important;max-width:none!important;height:auto!important;box-sizing:border-box!important;}',
    '.sb-dld-status-layout{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important;width:100%!important;max-width:none!important;align-items:stretch!important;gap:9px!important;height:auto!important;min-height:0!important;}',
    '.sb-dld-status-layout>.pill-stat{display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;}',
    '.sb-dld-status-layout>.pill-stat>.pill-stat-num{display:flex!important;align-items:center!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;overflow:visible!important;}',
    '.sb-dld-status-layout>.pill-stat>.pill-stat-lbl{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;}',

    '@media(min-width:1024px){',
      /* This deliberately matches the desktop Insights selector specificity so the generic direct-child rule cannot force these grids back to display:block. */
      'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.sb-dld-summary-layout{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;max-width:none!important;height:auto!important;min-height:0!important;}',
      'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.sb-dld-summary-layout>.stat-cell{display:flex!important;min-width:0!important;width:100%!important;max-width:none!important;height:auto!important;min-height:104px!important;padding:15px 14px!important;}',
      'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.sb-dld-status-layout{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important;max-width:none!important;gap:9px!important;margin:2px 0 18px!important;height:auto!important;min-height:0!important;}',
      'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.sb-dld-status-layout>.pill-stat{display:flex!important;min-width:0!important;width:100%!important;max-width:none!important;height:76px!important;min-height:76px!important;padding:11px 12px!important;}',
      'body.sunbliss-ref-desktop.sunbliss-desktop-insights main#main .overview>.sb-dld-status-layout>.pill-stat>.pill-stat-num{display:flex!important;visibility:visible!important;opacity:1!important;overflow:visible!important;}',
    '}',

    '@media(max-width:720px){',
      '.sb-dld-summary-layout{grid-template-columns:1fr!important;}',
      '.sb-dld-status-layout{grid-template-columns:1fr!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);
}

function organizeDldTracker(overview){
  if(!overview)return;

  var paid=document.getElementById('btnDldPaid');
  if(paid&&paid.parentElement&&overview.contains(paid)){
    var summary=paid.parentElement;
    summary.classList.add('sb-dld-summary-layout');
    summary.setAttribute('data-sb-dld-layout','summary');
  }

  var fullyPaid=document.getElementById('btnDldFullyPaid');
  if(fullyPaid&&fullyPaid.parentElement&&overview.contains(fullyPaid)){
    var status=fullyPaid.parentElement;
    status.classList.add('sb-dld-status-layout');
    status.setAttribute('data-sb-dld-layout','status');
  }
}

function refresh(){
  installStyle();
  var overview=document.querySelector('.overview');
  if(!overview)return;
  var nodes=overview.querySelectorAll('.section-label,.stat-sub,p,div,span');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i],t=norm(el.textContent),lower=t.toLowerCase();
    if(lower==='cash flow by month')el.textContent='MONTHLY CASH FLOW';
    if(t===legacy&&!el.querySelector('*'))el.remove();
  }
  organizeDldTracker(overview);
}
var queued=false;
function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refresh();});}
function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissCashFlowLabelWrapped)return;function wrapped(){var out=original.apply(this,arguments);queue();return out;}wrapped.__sunblissCashFlowLabelWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped;}
function install(){installStyle();wrap('renderOverview');wrap('renderMain');wrap('renderInsights');window.addEventListener('pageshow',queue);window.addEventListener('resize',queue,{passive:true});queue();setTimeout(queue,120);}
install();
})();
