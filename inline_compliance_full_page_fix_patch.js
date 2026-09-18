(function(){
  'use strict';
  if(window.__sunblissInlineComplianceFullPageFixInstalled)return;
  window.__sunblissInlineComplianceFullPageFixInstalled=true;

  function installStyles(){
    if(document.getElementById('sunblissInlineComplianceFullPageFixStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissInlineComplianceFullPageFixStyles';
    style.textContent=[
      'body.sunbliss-inline-compliance-full-page{overflow:hidden!important;overscroll-behavior:none!important}',
      '@media(max-width:1023px){',
        'body.sunbliss-inline-compliance-full-page #app,body.sunbliss-inline-compliance-full-page main#main,body.sunbliss-inline-compliance-full-page .detail{contain:none!important;transform:none!important;filter:none!important;perspective:none!important;will-change:auto!important}',
        'body.sunbliss-inline-compliance-full-page>.tabs,body.sunbliss-inline-compliance-full-page>#sunblissDockSearchPanel{display:none!important}',
        'body.sunbliss-inline-compliance-full-page #inlineComplianceEditor{position:fixed!important;top:14px!important;right:14px!important;bottom:14px!important;left:14px!important;inset:14px!important;z-index:12350!important;width:auto!important;max-width:none!important;height:auto!important;max-height:none!important;margin:0!important;border:1px solid var(--paper-line,#DCD2B6)!important;border-radius:14px!important;box-shadow:none!important;background:var(--paper,#F6F1E4)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important}',
        'body.sunbliss-inline-compliance-full-page #inlineComplianceEditor .brand-editor-actions{margin-top:auto!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  var queued=false;
  function refresh(){
    queued=false;
    installStyles();
    if(!document.body)return;
    document.body.classList.toggle('sunbliss-inline-compliance-full-page',!!document.getElementById('inlineComplianceEditor'));
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(refresh);
  }
  function relevant(node){
    if(!node||node.nodeType!==1)return false;
    if(node.id==='inlineComplianceEditor')return true;
    return !!(node.querySelector&&node.querySelector('#inlineComplianceEditor'));
  }

  installStyles();
  refresh();

  if(window.MutationObserver){
    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type!=='childList')continue;
        for(var j=0;j<m.addedNodes.length;j++)if(relevant(m.addedNodes[j])){schedule();return;}
        for(var k=0;k<m.removedNodes.length;k++)if(relevant(m.removedNodes[k])){schedule();return;}
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  document.addEventListener('click',function(){setTimeout(schedule,0);},true);
  window.addEventListener('pageshow',schedule);
})();
