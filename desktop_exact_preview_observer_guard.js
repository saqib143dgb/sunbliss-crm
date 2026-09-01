(function(){
  'use strict';
  if(!window.MutationObserver||window.__sunblissExactPreviewObserverGuard)return;
  window.__sunblissExactPreviewObserverGuard=true;
  var Native=window.MutationObserver;
  function isOwnNode(n){
    if(!n||n.nodeType!==1)return false;
    if(n.id==='sbRefOverview'||n.id==='sbRefSidebar')return true;
    return !!(n.closest&&(n.closest('#sbRefOverview')||n.closest('#sbRefSidebar')));
  }
  window.MutationObserver=function(callback){
    return new Native(function(mutations,observer){
      var relevant=mutations.filter(function(m){
        if(m.type!=='childList')return true;
        var nodes=Array.prototype.slice.call(m.addedNodes||[]).concat(Array.prototype.slice.call(m.removedNodes||[])).filter(function(n){return n.nodeType===1;});
        if(nodes.length&&nodes.every(isOwnNode))return false;
        if(isOwnNode(m.target))return false;
        return true;
      });
      if(relevant.length)callback(relevant,observer);
    });
  };
  window.MutationObserver.prototype=Native.prototype;
  setTimeout(function(){window.MutationObserver=Native;},0);
})();
