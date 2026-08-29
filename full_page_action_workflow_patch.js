(function(){
  'use strict';
  if (window.__sunblissFullPageActionWorkflowInstalled) return;
  window.__sunblissFullPageActionWorkflowInstalled = true;

  var inlineSelectors = [
    '#customerEditPanel','#unitEditPanel','#saleComplianceEditPanel','#unitCancellationPanel','#transactionEditPanel','#creditNoteEditPanel','#inlineComplianceEditor','#customerNotesManagementPanel','.record-payment-panel'
  ];
  var overlaySelectors = ['#auditLogOverlay','#installmentEditOverlay','#installmentDeleteOverlay','#paymentDetailOverlay','#cancelledUnitEditModal'];
  var dialogSelectors = ['#auditLogDialog','#installmentEditDialog','#installmentDeleteDialog','#paymentDetailDialog','.cancelled-edit-card'];
  var watchedSelector=inlineSelectors.concat(overlaySelectors,dialogSelectors).join(',');

  function ensureStyles(){
    if (document.getElementById('sunblissFullPageActionWorkflowStyles')) return;
    var style=document.createElement('style');style.id='sunblissFullPageActionWorkflowStyles';style.textContent=[
      '@keyframes crmActionPageReveal{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
      'body.crm-full-page-action-open{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.crm-full-page-action-open .detail-top-actions-sticky{visibility:hidden!important;pointer-events:none!important}',
      '.crm-action-awaiting-ready{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:none!important;animation:none!important}',
      '.crm-action-page-ready{animation:crmActionPageReveal .14s ease-out both}',
      '.crm-full-page-inline{position:fixed!important;inset:0!important;z-index:12000!important;width:100%!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#F6F1E4)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:110px!important}',
      '.crm-full-page-inline>.section-label:first-child{position:sticky!important;top:calc(-18px - env(safe-area-inset-top))!important;z-index:8!important;margin:calc(-18px - env(safe-area-inset-top)) -16px 12px!important;padding:calc(17px + env(safe-area-inset-top)) 16px 13px!important;background:var(--paper,#F6F1E4)!important;border-bottom:1px solid var(--paper-line,#DCD2B6)!important;font-size:11px!important}',
      '.crm-full-page-inline .brand-editor-actions{position:sticky!important;bottom:calc(-26px - env(safe-area-inset-bottom))!important;z-index:9!important;margin:18px -16px calc(-26px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#F6F1E4)!important;border-top:1px solid var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important}',
      '.crm-full-page-inline .brand-editor-actions .btn,.crm-full-page-inline .brand-editor-actions .btn-paper{min-height:46px!important;margin:0!important}',
      '#customerNotesManagementPanel.crm-full-page-inline{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}',
      '#customerNotesManagementPanel.crm-full-page-inline .notes-management-actions{margin-top:14px!important}',
      '#customerNotesManagementPanel.crm-full-page-inline .notes-subpanel{margin-top:14px!important}',
      '#customerNotesManagementPanel.crm-full-page-inline .notes-editor-actions{position:sticky!important;bottom:calc(-92px - env(safe-area-inset-bottom))!important;z-index:10!important;margin:16px -28px -11px!important;padding:12px 12px calc(12px + env(safe-area-inset-bottom));background:var(--paper);border-top:1px solid var(--paper-line);box-shadow:0 -8px 20px rgba(15,26,38,.08)}',
      '#customerNotesManagementPanel.crm-full-page-inline .notes-editor-actions button{min-height:46px!important;margin:0!important}',
      '#customerNotesManagementPanel.crm-full-page-inline>button.btn-paper:last-child{position:sticky!important;bottom:calc(-92px - env(safe-area-inset-bottom))!important;z-index:9!important;width:calc(100% + 32px)!important;min-height:48px!important;margin:18px -16px calc(-92px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;border-radius:0!important;background:var(--paper,#F6F1E4)!important;border-width:1px 0 0!important;border-color:var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important}',
      '#customerNotesManagementPanel.crm-full-page-inline #notesEditorSection:not([hidden])~button.btn-paper:last-child{display:none!important}',
      '.crm-full-page-overlay{position:fixed!important;inset:0!important;z-index:12100!important;width:100%!important;height:100dvh!important;max-height:none!important;padding:0!important;margin:0!important;display:block!important;background:var(--paper,#F6F1E4)!important;overflow:hidden!important;overscroll-behavior:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
      '.crm-full-page-dialog{width:100%!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#F6F1E4)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:110px!important}',
      '#auditLogOverlay.crm-full-page-overlay #auditLogDialog{padding:0!important}',
      '#auditLogOverlay.crm-full-page-overlay .audit-log-head{top:0!important;padding:calc(16px + env(safe-area-inset-top)) 16px 13px!important;background:var(--paper,#F6F1E4)!important}',
      '#auditLogOverlay.crm-full-page-overlay .audit-log-body{padding:14px 16px calc(24px + env(safe-area-inset-bottom))!important}',
      '#installmentEditDialog.crm-full-page-dialog h3,#installmentDeleteDialog.crm-full-page-dialog h3,#paymentDetailDialog.crm-full-page-dialog h3{margin-top:0!important}',
      '#installmentEditDialog.crm-full-page-dialog .installment-edit-actions,#installmentDeleteDialog.crm-full-page-dialog .installment-delete-actions,#paymentDetailDialog.crm-full-page-dialog .payment-detail-actions,.cancelled-edit-card.crm-full-page-dialog .cancelled-edit-footer{position:sticky!important;bottom:calc(-26px - env(safe-area-inset-bottom))!important;z-index:9!important;margin:18px -16px calc(-26px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#F6F1E4)!important;border-top:1px solid var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important}',
      '#installmentEditDialog.crm-full-page-dialog .installment-edit-actions button,#installmentDeleteDialog.crm-full-page-dialog .installment-delete-actions button,#paymentDetailDialog.crm-full-page-dialog .payment-detail-actions button,.cancelled-edit-card.crm-full-page-dialog .cancelled-edit-footer button{min-height:46px!important;margin:0!important}',
      '#cancelledUnitEditModal.crm-full-page-overlay{display:block!important}',
      '#cancelledUnitEditModal.crm-full-page-overlay .cancelled-edit-card{border-radius:0!important}',
      '#cancelledUnitEditModal.crm-full-page-overlay .cancelled-edit-head{position:sticky!important;top:calc(-18px - env(safe-area-inset-top))!important;z-index:8!important;margin:calc(-18px - env(safe-area-inset-top)) -16px 14px!important;padding:calc(16px + env(safe-area-inset-top)) 16px 13px!important;background:var(--paper,#F6F1E4)!important;border-bottom:1px solid var(--paper-line,#DCD2B6)!important}',
      '@media(prefers-reduced-motion:reduce){.crm-action-page-ready{animation:none!important}}',
      '@media(max-width:520px){.crm-full-page-inline,.crm-full-page-dialog{padding-left:14px!important;padding-right:14px!important}.crm-full-page-inline>.section-label:first-child{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important}.crm-full-page-inline .brand-editor-actions,#installmentEditDialog.crm-full-page-dialog .installment-edit-actions,#installmentDeleteDialog.crm-full-page-dialog .installment-delete-actions,#paymentDetailDialog.crm-full-page-dialog .payment-detail-actions,.cancelled-edit-card.crm-full-page-dialog .cancelled-edit-footer{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important}.crm-full-page-inline .brand-editor-actions,.installment-edit-actions,.installment-delete-actions,.payment-detail-actions,.cancelled-edit-footer{flex-direction:column!important}.crm-full-page-inline .brand-editor-actions button,.installment-edit-actions button,.installment-delete-actions button,.payment-detail-actions button,.cancelled-edit-footer button{width:100%!important}#customerNotesManagementPanel.crm-full-page-inline>button.btn-paper:last-child{width:calc(100% + 28px)!important;margin-left:-14px!important;margin-right:-14px!important}#customerNotesManagementPanel.crm-full-page-inline .notes-editor-actions{grid-template-columns:1fr!important;margin-left:-26px!important;margin-right:-26px!important}}'
    ].join('');document.head.appendChild(style);
  }

  function normalizedText(node){return node?String(node.textContent||'').replace(/\s+/g,' ').trim().toLowerCase():'';}
  function isInitialInlineLoading(panel){if(!panel)return false;var text=normalizedText(panel);if(text.indexOf('loading ')===-1&&text.indexOf('loading…')===-1&&text.indexOf('loading...')===-1)return false;var interactive=panel.querySelector('input,select,textarea,button');return !interactive&&panel.children.length<=4;}
  function isOverlayLoading(overlay){if(!overlay)return false;if(overlay.id==='installmentEditOverlay'){var sub=overlay.querySelector('.installment-edit-sub');return !!(sub&&normalizedText(sub).indexOf('loading installment')===0);}if(overlay.id==='auditLogOverlay'){var body=overlay.querySelector('#auditLogBody');return !!(body&&normalizedText(body).indexOf('loading audit')===0);}return false;}
  function setReadyState(node,waiting){if(!node)return;if(waiting){if(!node.classList.contains('crm-action-awaiting-ready'))node.classList.add('crm-action-awaiting-ready');node.classList.remove('crm-action-page-ready');return;}var wasWaiting=node.classList.contains('crm-action-awaiting-ready');node.classList.remove('crm-action-awaiting-ready');if(wasWaiting&&!node.classList.contains('crm-action-page-ready')){node.classList.add('crm-action-page-ready');window.setTimeout(function(){if(node&&node.classList)node.classList.remove('crm-action-page-ready');},180);}}
  function markInlinePanels(){inlineSelectors.forEach(function(selector){document.querySelectorAll(selector).forEach(function(panel){panel.classList.add('crm-full-page-inline');if(!panel.hasAttribute('role'))panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');setReadyState(panel,isInitialInlineLoading(panel));});});}
  function markOverlays(){overlaySelectors.forEach(function(selector){document.querySelectorAll(selector).forEach(function(overlay){overlay.classList.add('crm-full-page-overlay');setReadyState(overlay,isOverlayLoading(overlay));});});dialogSelectors.forEach(function(selector){document.querySelectorAll(selector).forEach(function(dialog){dialog.classList.add('crm-full-page-dialog');});});}
  function hasOpenActionPage(){var selectors=inlineSelectors.concat(overlaySelectors);for(var i=0;i<selectors.length;i++){var nodes=document.querySelectorAll(selectors[i]);for(var j=0;j<nodes.length;j++){var node=nodes[j];if(!node.isConnected)continue;if(window.getComputedStyle(node).display!=='none')return true;}}return false;}
  function refresh(){ensureStyles();markInlinePanels();markOverlays();document.body.classList.toggle('crm-full-page-action-open',hasOpenActionPage());}

  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;refresh();});}
  function containsWatched(node){return !!(node&&node.nodeType===1&&((node.matches&&node.matches(watchedSelector))||(node.querySelector&&node.querySelector(watchedSelector))));}
  function relevantMutations(mutations){
    for(var i=0;i<mutations.length;i++){
      var m=mutations[i];
      if(m.type!=='childList')continue;
      if(m.target&&m.target.nodeType===1&&m.target.closest&&m.target.closest(watchedSelector))return true;
      for(var j=0;j<m.addedNodes.length;j++)if(containsWatched(m.addedNodes[j]))return true;
      for(var k=0;k<m.removedNodes.length;k++)if(containsWatched(m.removedNodes[k]))return true;
    }
    return false;
  }

  ensureStyles();refresh();
  /* Important: observe structure only. This patch itself changes classes on watched
     panels, so observing class/style/hidden attributes created a feedback loop. */
  new MutationObserver(function(mutations){if(relevantMutations(mutations))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',function(){setTimeout(schedule,0);},true);
  window.addEventListener('pageshow',schedule);window.addEventListener('popstate',schedule);
})();
