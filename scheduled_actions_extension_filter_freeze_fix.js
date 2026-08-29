(function(){
'use strict';
if(window.__sunblissScheduledExtensionFilterFreezeFix)return;
window.__sunblissScheduledExtensionFilterFreezeFix=true;

var extensionViewActive=false;
var renderQueued=false;

function renderExtensionView(){
  renderQueued=false;
  if(!extensionViewActive)return;
  var select=document.getElementById('scheduledOverviewFilter');
  if(!select)return;
  select.value='extensions';
  if(window.PaymentExtensionsCore&&typeof window.PaymentExtensionsCore.render==='function'){
    window.PaymentExtensionsCore.render();
  }
}

function queueRender(){
  if(renderQueued)return;
  renderQueued=true;
  window.requestAnimationFrame(function(){
    window.requestAnimationFrame(renderExtensionView);
  });
}

/*
  The original Scheduled Actions filter owns an onchange handler that only knows
  Today/Tomorrow/Overdue/Upcoming/Completed. When the extension patch adds the
  Extensions option, allowing that original handler to run first makes it render
  every pending task, while the extension renderer immediately replaces the same
  list. On iOS this competing redraw can cascade through the existing observers
  and make the page appear frozen.

  Intercept only the Extensions selection before the legacy handler sees it and
  hand that view to PaymentExtensionsCore as the single renderer. Other filter
  values continue through the original Scheduled Actions code unchanged.
*/
document.addEventListener('change',function(event){
  var target=event&&event.target;
  if(!target||target.id!=='scheduledOverviewFilter')return;
  if(target.value==='extensions'){
    extensionViewActive=true;
    event.stopImmediatePropagation();
    queueRender();
    return;
  }
  extensionViewActive=false;
},true);

/* If the Overview is legitimately rebuilt while Extensions is still selected,
   restore the extension-only view once, without continuously redrawing it. */
var app=document.getElementById('app');
if(app&&window.MutationObserver){
  var observer=new MutationObserver(function(mutations){
    if(!extensionViewActive)return;
    var replaced=false;
    for(var i=0;i<mutations.length;i++){
      if(mutations[i].addedNodes&&mutations[i].addedNodes.length){replaced=true;break;}
    }
    if(replaced)queueRender();
  });
  observer.observe(app,{childList:true,subtree:true});
}

window.addEventListener('pageshow',function(){
  extensionViewActive=false;
});
})();