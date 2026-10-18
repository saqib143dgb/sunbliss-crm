(function(){
  'use strict';
  if(window.__sunblissInlineComplianceFullPageFixInstalled)return;
  window.__sunblissInlineComplianceFullPageFixInstalled=true;

  function installStyles(){
    if(document.getElementById('sunblissInlineComplianceFullPageFixStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissInlineComplianceFullPageFixStyles';
    style.textContent=[
      '@media(max-width:1023px){',
        'body.sunbliss-inline-compliance-full-page{overflow:hidden!important;overscroll-behavior:none!important}',
        'body.sunbliss-inline-compliance-full-page #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
        'body.sunbliss-inline-compliance-full-page>.tabs,body.sunbliss-inline-compliance-full-page #sunblissPersistentBackDock,body.sunbliss-inline-compliance-full-page #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
        /* The editor is portaled directly to body: it must not inherit the
           customer detail isolation/transform stacking context. */
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30000!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;min-height:0!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#faf7ef)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:140px!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.section-label:first-child{position:sticky!important;top:calc(-14px - env(safe-area-inset-top))!important;z-index:2!important;margin:calc(-14px - env(safe-area-inset-top)) -16px 15px!important;padding:calc(16px + env(safe-area-inset-top)) 16px 12px!important;background:var(--paper,#faf7ef)!important;border-bottom:1px solid var(--paper-line,#dcd2b6)!important;font-size:16px!important;font-weight:700!important;text-transform:none!important;letter-spacing:0!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.brand-field{display:block!important;flex-shrink:0!important;margin-bottom:15px!important;min-height:0!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.brand-field :is(input,select){display:block!important;min-height:46px!important;width:100%!important;font-size:16px!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.brand-editor-actions{position:sticky!important;bottom:calc(-14px - env(safe-area-inset-bottom))!important;z-index:3!important;display:flex!important;flex-direction:column!important;gap:8px!important;flex-shrink:0!important;margin:auto -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#faf7ef)!important;border-top:1px solid var(--paper-line,#dcd2b6)!important;box-shadow:0 -6px 16px rgba(15,26,38,.06)!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.brand-editor-actions button{width:100%!important;min-height:46px!important;margin:0!important;justify-content:center!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  var queued=false;
  function mobile(){
    return window.matchMedia ? window.matchMedia('(max-width:1023px)').matches : window.innerWidth<=1023;
  }
  function refresh(){
    queued=false;
    installStyles();
    if(!document.body)return;
    var panel=document.getElementById('inlineComplianceEditor');
    var strip=document.getElementById('inlineComplianceStrip');
    var view=window.state&&window.state.view;
    var key=window.state&&window.state.selectedUnit;
    if(panel){
      var owner=panel.getAttribute('data-crm-compliance-unit');
      if(!strip || (view&&view!=='detail') || (owner&&key&&owner!==String(key))){
        panel.remove();
        panel=null;
      }else if(key&&!owner){
        panel.setAttribute('data-crm-compliance-unit',String(key));
      }
    }
    var isMobile=mobile();
    if(panel&&isMobile&&panel.parentNode!==document.body){
      document.body.appendChild(panel);
    }else if(panel&&!isMobile&&panel.parentNode===document.body&&strip&&strip.parentNode){
      strip.insertAdjacentElement('afterend',panel);
    }
    document.body.classList.toggle('sunbliss-inline-compliance-full-page',!!panel&&isMobile);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(refresh);
  }
  function relevant(node){
    if(!node||node.nodeType!==1)return false;
    if(node.id==='inlineComplianceEditor'||node.id==='inlineComplianceStrip')return true;
    return !!(node.querySelector&&node.querySelector('#inlineComplianceEditor,#inlineComplianceStrip'));
  }

  installStyles();
  refresh();
  if(window.MutationObserver){
    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        for(var j=0;j<m.addedNodes.length;j++)if(relevant(m.addedNodes[j])){schedule();return;}
        for(var k=0;k<m.removedNodes.length;k++)if(relevant(m.removedNodes[k])){schedule();return;}
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
  document.addEventListener('click',function(){setTimeout(schedule,0);},true);
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
})();