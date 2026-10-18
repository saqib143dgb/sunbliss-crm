(function(){
  'use strict';
  if(window.__sunblissInlineComplianceFullPageFixInstalled)return;
  window.__sunblissInlineComplianceFullPageFixInstalled=true;

  function installStyles(){
    if(document.getElementById('sunblissInlineComplianceFullPageFixStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissInlineComplianceFullPageFixStyles';
    style.textContent=[
      '#inlineComplianceEditor .crm-compliance-editor-head{display:flex;align-items:center;gap:15px;margin:0 0 24px;color:var(--ink,#102333)}',
      '#inlineComplianceEditor .crm-compliance-back{width:30px;height:42px;display:inline-flex;align-items:center;justify-content:center;flex:none;padding:0;border:0;background:transparent;color:var(--ink,#102333);cursor:pointer}',
      '#inlineComplianceEditor .crm-compliance-editor-title{margin:0;font-family:Inter,Arial,sans-serif;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-.025em;color:var(--ink,#102333)}',
      '#inlineComplianceEditor .crm-compliance-editor-card{width:100%;min-width:0;flex-shrink:0;padding:18px 15px 21px;margin:0;background:transparent;border:1px solid var(--paper-line,#ded7c8);border-radius:14px;box-sizing:border-box;box-shadow:none}',
      '#inlineComplianceEditor .crm-compliance-editor-card .brand-field{display:block;min-width:0;margin:0 0 23px;color:var(--ink,#102333)}',
      '#inlineComplianceEditor .crm-compliance-editor-card .brand-field:last-child{margin-bottom:0}',
      '#inlineComplianceEditor .crm-compliance-field-label{display:block;margin-bottom:9px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.4;font-weight:650;color:var(--ink,#102333)}',
      '#inlineComplianceEditor .crm-compliance-optional{color:var(--muted,#66635c);font-weight:400}',
      '#inlineComplianceEditor .crm-compliance-select-wrap,#inlineComplianceEditor .crm-compliance-date-wrap{display:block;position:relative;width:100%;min-width:0}',
      '#inlineComplianceEditor .crm-compliance-select-wrap select,#inlineComplianceEditor .crm-compliance-date-wrap input{appearance:none;-webkit-appearance:none;display:block;width:100%;height:44px;min-height:44px;max-width:100%;box-sizing:border-box;margin:0;padding:8px 42px 8px 12px;border:1px solid var(--paper-line,#ded7c8);border-radius:8px;background:var(--paper-dim,#efe9d9);font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:450;line-height:1.3;color:var(--ink,#102333);box-shadow:none}',
      '#inlineComplianceEditor .crm-compliance-select-wrap>svg,#inlineComplianceEditor .crm-compliance-date-wrap>svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--ink,#102333);pointer-events:none}',
      '#inlineComplianceEditor .crm-compliance-date-wrap>svg{color:#7e817e}',
      '#inlineComplianceEditor .crm-compliance-date-placeholder{display:none;position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:400;color:var(--muted,#66635c);pointer-events:none}',
      '#inlineComplianceEditor .crm-compliance-date-empty .crm-compliance-date-placeholder{display:block}',
      '#inlineComplianceEditor .crm-compliance-date-empty input::-webkit-datetime-edit{color:transparent!important}',
      '#inlineComplianceEditor .crm-compliance-date-wrap input::-webkit-calendar-picker-indicator{position:absolute;right:0;top:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}',
      '#inlineComplianceEditor .crm-compliance-date-wrap input:focus-visible,#inlineComplianceEditor .crm-compliance-select-wrap select:focus-visible{outline:2px solid var(--gold,#c6972e);outline-offset:2px}',
      '#inlineComplianceEditor .crm-compliance-editor-actions{display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:10px!important}',
      '#inlineComplianceEditor .crm-compliance-editor-actions button{flex:1 1 0%!important;min-width:0!important;min-height:48px!important;white-space:nowrap!important;padding:10px 9px!important;font-family:Inter,Arial,sans-serif!important;font-size:15px!important;font-weight:600!important;border-radius:999px!important;box-shadow:none!important}',
      '#inlineComplianceEditor .crm-compliance-editor-actions #inlineComplianceSave{background:var(--gold,#c6972e)!important;border:1px solid var(--gold,#c6972e)!important;color:var(--ink,#102333)!important}',
      '#inlineComplianceEditor .crm-compliance-editor-actions #inlineComplianceCancel{background:var(--paper-dim,#efe9d9)!important;border:1px solid var(--paper-line,#ded7c8)!important;color:var(--ink,#102333)!important}',
      '@media(max-width:1023px){',
        'body.sunbliss-inline-compliance-full-page{overflow:hidden!important;overscroll-behavior:none!important}',
        'body.sunbliss-inline-compliance-full-page #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
        'body.sunbliss-inline-compliance-full-page>.tabs,body.sunbliss-inline-compliance-full-page #sunblissPersistentBackDock,body.sunbliss-inline-compliance-full-page #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
        /* The editor is portaled directly to body: it must not inherit the
           customer detail isolation/transform stacking context. */
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30000!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;min-height:0!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#faf7ef)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:140px!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.section-label:first-child{position:sticky!important;top:calc(-14px - env(safe-area-inset-top))!important;z-index:2!important;margin:calc(-14px - env(safe-area-inset-top)) -16px 15px!important;padding:calc(16px + env(safe-area-inset-top)) 16px 12px!important;background:var(--paper,#faf7ef)!important;border-bottom:1px solid var(--paper-line,#dcd2b6)!important;font-size:16px!important;font-weight:700!important;text-transform:none!important;letter-spacing:0!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.crm-compliance-editor-card .brand-field{display:block!important;margin-bottom:23px!important;min-height:0!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.crm-compliance-editor-card .brand-field:last-child{margin-bottom:0!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.crm-compliance-editor-actions{position:sticky!important;bottom:calc(-14px - env(safe-area-inset-bottom))!important;z-index:3!important;display:flex!important;flex-direction:row!important;gap:10px!important;flex-shrink:0!important;margin:auto -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;background:var(--paper,#faf7ef)!important;border-top:1px solid var(--paper-line,#dcd2b6)!important;box-shadow:none!important}',
        'body.sunbliss-inline-compliance-full-page>#inlineComplianceEditor>.crm-compliance-editor-actions button{width:auto!important;flex:1 1 0%!important;min-width:0!important;min-height:48px!important;margin:0!important;justify-content:center!important}',
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