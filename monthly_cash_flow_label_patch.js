(function(){
'use strict';
if(window.__sunblissMonthlyCashFlowLabelInstalled)return;
window.__sunblissMonthlyCashFlowLabelInstalled=true;

var legacy='Built from your transaction log, so it may miss payments recorded only in Payment Dues before logging began.';
function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}

function installStyle(){
  var existing=document.getElementById('sunblissInsightsCompactLayoutStyles');
  if(existing){
    /* Keep this layout rule last in the cascade because later desktop patches also style generic .pipeline/.stat-cell blocks. */
    document.head.appendChild(existing);
    return;
  }
  var style=document.createElement('style');
  style.id='sunblissInsightsCompactLayoutStyles';
  style.textContent=[
    /* DLD-only layout helpers. No theme, color, font, border, radius or shadow values are changed here. */
    '.sb-dld-summary-layout{width:100%!important;max-width:none!important;align-items:stretch!important;justify-content:stretch!important;}',
    '.sb-dld-summary-layout>.stat-cell{min-width:0!important;max-width:none!important;box-sizing:border-box!important;}',
    '.sb-dld-status-layout{width:100%!important;max-width:none!important;align-items:stretch!important;}',
    '.sb-dld-status-layout>.pill-stat{min-width:0!important;max-width:none!important;box-sizing:border-box!important;}',
    '.sb-dld-status-layout>.pill-stat>.pill-stat-num{visibility:visible!important;opacity:1!important;overflow:visible!important;}',
    '.sb-dld-status-layout>.pill-stat>.pill-stat-lbl{visibility:visible!important;opacity:1!important;}'
  ].join('');
  document.head.appendChild(style);
}

function setImportant(el,prop,value){
  if(el&&el.style)el.style.setProperty(prop,value,'important');
}
function clearImportant(el,prop){
  if(el&&el.style)el.style.removeProperty(prop);
}
function desktopDevice(){
  var sw=0,sh=0;
  try{sw=Number(window.screen&&screen.width)||0;sh=Number(window.screen&&screen.height)||0;}catch(_e){}
  var largeScreen=Math.max(sw,sh)>=900;
  var mobileUA=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent||'');
  return largeScreen&&!mobileUA;
}

function applySummaryLayout(summary,isDesktop){
  if(!summary)return;
  summary.classList.add('sb-dld-summary-layout');
  summary.setAttribute('data-sb-dld-layout','summary');

  setImportant(summary,'display','grid');
  setImportant(summary,'grid-template-columns',isDesktop?'repeat(2,minmax(0,1fr))':'repeat(auto-fit,minmax(220px,1fr))');
  setImportant(summary,'width','100%');
  setImportant(summary,'max-width','none');
  setImportant(summary,'height','auto');
  setImportant(summary,'min-height','0');

  Array.prototype.forEach.call(summary.children,function(cell){
    setImportant(cell,'display','flex');
    setImportant(cell,'flex-direction','column');
    setImportant(cell,'justify-content','center');
    setImportant(cell,'min-width','0');
    setImportant(cell,'width','100%');
    setImportant(cell,'max-width','none');
    if(isDesktop){
      setImportant(cell,'height','104px');
      setImportant(cell,'min-height','104px');
    }else{
      clearImportant(cell,'height');
      clearImportant(cell,'min-height');
    }
  });
}

function applyStatusLayout(status,isDesktop){
  if(!status)return;
  status.classList.add('sb-dld-status-layout');
  status.setAttribute('data-sb-dld-layout','status');

  setImportant(status,'display','grid');
  setImportant(status,'grid-template-columns',isDesktop?'repeat(3,minmax(0,1fr))':'repeat(auto-fit,minmax(180px,1fr))');
  setImportant(status,'width','100%');
  setImportant(status,'max-width','none');
  setImportant(status,'height','auto');
  setImportant(status,'min-height','0');

  Array.prototype.forEach.call(status.children,function(card){
    setImportant(card,'display','flex');
    setImportant(card,'flex-direction','column');
    setImportant(card,'justify-content','center');
    setImportant(card,'min-width','0');
    setImportant(card,'width','100%');
    setImportant(card,'max-width','none');
    if(isDesktop){
      setImportant(card,'height','76px');
      setImportant(card,'min-height','76px');
    }else{
      clearImportant(card,'height');
      clearImportant(card,'min-height');
    }
  });
}

function organizeDldTracker(overview){
  if(!overview)return;
  var isDesktop=desktopDevice();

  var paid=document.getElementById('btnDldPaid');
  if(paid&&paid.parentElement&&overview.contains(paid))applySummaryLayout(paid.parentElement,isDesktop);

  var fullyPaid=document.getElementById('btnDldFullyPaid');
  if(fullyPaid&&fullyPaid.parentElement&&overview.contains(fullyPaid))applyStatusLayout(fullyPaid.parentElement,isDesktop);
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
function install(){
  installStyle();
  wrap('renderOverview');
  wrap('renderMain');
  wrap('renderInsights');
  window.addEventListener('pageshow',queue);
  window.addEventListener('resize',queue,{passive:true});
  queue();
  setTimeout(queue,120);
  setTimeout(queue,450);
  setTimeout(queue,900);
}
install();
})();
