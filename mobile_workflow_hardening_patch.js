(function(){
  'use strict';
  if(window.__sunblissMobileWorkflowHardeningInstalled)return;
  window.__sunblissMobileWorkflowHardeningInstalled=true;

  /*
   * A single, late-loaded mobile action-page layer. Legacy panels stay in their
   * original DOM locations, so existing listeners, saves and Test Mode are
   * unchanged. Only viewport presentation and field visibility are normalized.
   */
  var selectors=[
    '#customerEditPanel','#unitEditPanel','#saleComplianceEditPanel',
    '#inlineComplianceEditor','#customerNotesManagementPanel',
    '#unitCancellationPanel','#transactionEditPanel','#creditNoteEditPanel',
    '#scheduledActionPanel','#paymentPlanRevisionPanel','#extraInstallmentPanel',
    '#installmentEditOverlay','#paymentDetailOverlay','#auditLogOverlay'
  ];
  var selector=selectors.join(',');
  var busy=false;
  var style=document.createElement('style');
  style.id='sunblissMobileWorkflowHardeningStyles';
  style.textContent=[
    '@media(max-width:1023px){',
      'body.crm-mobile-editor-open{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.crm-mobile-editor-open #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
      'body.crm-mobile-editor-open #app,body.crm-mobile-editor-open #main,body.crm-mobile-editor-open #main .detail{contain:none!important;isolation:auto!important;transform:none!important;filter:none!important;perspective:none!important;will-change:auto!important}',
      'body.crm-mobile-editor-open>.tabs,body.crm-mobile-editor-open #sunblissPersistentBackDock,body.crm-mobile-editor-open #sunblissPersistentBack,body.crm-mobile-editor-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay){position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;display:flex!important;flex-direction:column!important;gap:0!important;width:100%!important;max-width:100%!important;min-height:0!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;box-sizing:border-box!important;margin:0!important;padding:calc(12px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;z-index:32000!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scroll-padding-bottom:170px!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay)>*{flex-shrink:0}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay)>.section-label:first-child{position:sticky!important;top:calc(-12px - env(safe-area-inset-top))!important;z-index:5!important;margin:calc(-12px - env(safe-area-inset-top)) -16px 12px!important;padding:calc(15px + env(safe-area-inset-top)) 16px 12px!important;border-bottom:1px solid var(--paper-line)!important;background:var(--paper,#faf7ef)!important;color:var(--ink)!important;font-size:15px!important;line-height:1.35!important;font-weight:700!important;letter-spacing:.02em!important;text-transform:none!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-editor-actions{position:sticky!important;bottom:calc(-18px - env(safe-area-inset-bottom))!important;z-index:6!important;display:flex!important;flex-direction:column!important;gap:8px!important;flex-shrink:0!important;margin:18px -16px calc(-18px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line)!important;background:var(--paper,#faf7ef)!important;box-shadow:0 -7px 16px rgba(16,35,51,.05)!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-editor-actions>button{width:100%!important;min-height:46px!important;flex:none!important;justify-content:center!important;margin:0!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-field{margin-top:0!important;margin-bottom:13px!important;min-width:0!important;font-size:13px!important;line-height:1.4!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-field input,body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-field select{min-height:46px!important;font-size:16px!important;max-width:100%!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor:not(.crm-full-page-overlay) .brand-field textarea{font-size:16px!important;min-height:94px!important}',
      'body.crm-mobile-editor-open #inlineComplianceEditor.crm-mobile-editor{inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-shell{width:100%!important;max-width:700px!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-card:not(.selected) .rpp-fields{display:none!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-card{padding:11px 13px!important;margin:0!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-warning{margin:8px 0 12px!important;padding:10px 12px!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-head:has(~.rpp-actions) #rppClose{display:none!important}',
      'body.crm-mobile-editor-open #paymentPlanRevisionPanel.crm-mobile-editor .rpp-actions{z-index:7!important;bottom:calc(-18px - env(safe-area-inset-bottom))!important}',
      'body.crm-mobile-editor-open #extraInstallmentPanel.crm-mobile-editor .extra-installment-name{font-family:CRMInter,Inter,sans-serif!important;font-size:16px!important}',
      'body.crm-mobile-editor-open #unitEditPanel.crm-mobile-editor .unit-editor-grid{grid-template-columns:1fr!important}',
      'body.crm-mobile-editor-open #customerNotesManagementPanel.crm-mobile-editor>.btn-paper:last-child{position:sticky!important;bottom:calc(-18px - env(safe-area-inset-bottom))!important;width:calc(100% + 32px)!important;margin:16px -16px calc(-18px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;border:1px solid var(--paper-line)!important;border-radius:0!important;background:var(--paper,#faf7ef)!important}',
      'body.crm-mobile-editor-open .crm-mobile-editor .stat-sub,body.crm-mobile-editor-open .crm-mobile-editor .scheduled-form-summary{font-size:12px!important;line-height:1.45!important}',
    '}',
    '#customerEditPanel .crm-sensitive-field:not(.crm-reveal-value){-webkit-text-security:disc!important}',
    '#customerEditPanel .crm-sensitive-toggle{display:inline-flex!important;align-items:center;justify-content:center;min-height:33px;margin:5px 0 0;padding:5px 12px;border:1px solid var(--paper-line,#ded7c8);border-radius:8px;background:transparent;color:var(--ink,#102333);font:600 12px Inter,Arial,sans-serif;cursor:pointer}',
    '@media(prefers-reduced-motion:reduce){.crm-mobile-editor{animation:none!important;transition:none!important}}'
  ].join('');
  document.head.appendChild(style);

  function maskSensitiveFields(panel){
    [['cePassport','passport number'],['ceEid','Emirates ID']].forEach(function(item){
      var input=panel.querySelector('#'+item[0]);
      if(!input||input.dataset.crmSensitiveReady)return;
      input.dataset.crmSensitiveReady='1';
      input.classList.add('crm-sensitive-field');
      input.setAttribute('autocomplete','off');
      var toggle=document.createElement('button');
      toggle.type='button';toggle.className='crm-sensitive-toggle';
      toggle.textContent='Show';toggle.setAttribute('aria-label','Show '+item[1]);toggle.setAttribute('aria-pressed','false');
      toggle.addEventListener('click',function(event){
        event.preventDefault();event.stopPropagation();
        var showing=input.classList.toggle('crm-reveal-value');
        toggle.textContent=showing?'Hide':'Show';
        toggle.setAttribute('aria-label',(showing?'Hide ':'Show ')+item[1]);
        toggle.setAttribute('aria-pressed',showing?'true':'false');
      });
      input.insertAdjacentElement('afterend',toggle);
    });
  }

  function isVisible(panel){
    if(!panel.isConnected||panel.hidden||panel.getAttribute('aria-hidden')==='true')return false;
    if(panel.style.display==='none')return false;
    return window.getComputedStyle(panel).display!=='none';
  }
  function refresh(){
    busy=false;
    var panels=document.querySelectorAll(selector);
    var active=false;
    var mobile=window.innerWidth<=1023;
    panels.forEach(function(panel){
      if(panel.id==='customerEditPanel')maskSensitiveFields(panel);
      panel.classList.add('crm-mobile-editor');
      if(!panel.hasAttribute('role'))panel.setAttribute('role','dialog');
      if(!panel.hasAttribute('aria-modal'))panel.setAttribute('aria-modal','true');
      if(mobile&&isVisible(panel))active=true;
    });
    document.body.classList.toggle('crm-mobile-editor-open',active);
  }
  function queue(){
    if(busy)return;busy=true;
    window.requestAnimationFrame(refresh);
  }
  if(window.MutationObserver)new MutationObserver(function(mutations){
    for(var i=0;i<mutations.length;i++){
      var m=mutations[i];
      if(m.type!=='childList')continue;
      if(m.target&&m.target.nodeType===1&&m.target.closest&&m.target.closest(selector)){queue();return;}
      for(var j=0;j<m.addedNodes.length;j++){
        var e=m.addedNodes[j];
        if(e.nodeType===1 && ((e.matches&&e.matches(selector))||(e.querySelector&&e.querySelector(selector)))){queue();return;}
      }
      for(var k=0;k<m.removedNodes.length;k++){
        var d=m.removedNodes[k];
        if(d.nodeType===1 && ((d.matches&&d.matches(selector))||(d.querySelector&&d.querySelector(selector)))){queue();return;}
      }
    }
  }).observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',queue,true);
  window.addEventListener('resize',queue,{passive:true});
  window.addEventListener('pageshow',queue);
  queue();
})();