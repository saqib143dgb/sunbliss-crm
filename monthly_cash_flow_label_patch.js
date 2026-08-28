(function(){
'use strict';
if(window.__sunblissMonthlyCashFlowLabelInstalled)return;
window.__sunblissMonthlyCashFlowLabelInstalled=true;

var legacy='Built from your transaction log, so it may miss payments recorded only in Payment Dues before logging began.';
function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function refresh(){
  var nodes=document.querySelectorAll('.section-label,.stat-sub,p,div,span');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i];
    var t=norm(el.textContent);
    if(t==='Cash Flow by Month') el.textContent='Monthly Cash Flow';
    if(t===legacy && !el.querySelector('*')) el.remove();
  }
}
function install(){
  var root=document.getElementById('app')||document.body;
  new MutationObserver(function(){requestAnimationFrame(refresh);}).observe(root,{childList:true,subtree:true,characterData:true});
  requestAnimationFrame(refresh);
}
install();
})();
