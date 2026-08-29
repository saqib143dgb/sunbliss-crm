(function(){
'use strict';
if(window.__sunblissMonthlyCashFlowLabelInstalled)return;
window.__sunblissMonthlyCashFlowLabelInstalled=true;

var legacy='Built from your transaction log, so it may miss payments recorded only in Payment Dues before logging began.';
function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function refresh(){
  var overview=document.querySelector('.overview');
  if(!overview)return;
  var nodes=overview.querySelectorAll('.section-label,.stat-sub,p,div,span');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i],t=norm(el.textContent),lower=t.toLowerCase();
    if(lower==='cash flow by month')el.textContent='MONTHLY CASH FLOW';
    if(t===legacy&&!el.querySelector('*'))el.remove();
  }
}
var queued=false;
function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refresh();});}
function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissCashFlowLabelWrapped)return;function wrapped(){var out=original.apply(this,arguments);queue();return out;}wrapped.__sunblissCashFlowLabelWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped;}
function install(){wrap('renderOverview');wrap('renderMain');window.addEventListener('pageshow',queue);queue();}
install();
})();
