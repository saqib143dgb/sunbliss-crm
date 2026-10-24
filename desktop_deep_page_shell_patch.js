(function(){
'use strict';
if(window.__sunblissDesktopDeepPageShellInstalled)return;
window.__sunblissDesktopDeepPageShellInstalled=true;

function isDesktop(){return window.matchMedia?window.matchMedia('(min-width:1024px)').matches:window.innerWidth>=1024}
function sync(){
  if(!document.body)return;
  var deep=isDesktop()&&(
    (window.state&&state.view==='detail')||
    document.body.classList.contains('sunbliss-back-dock-mode')
  );
  document.body.classList.toggle('sunbliss-desktop-deep-page',!!deep);
}
function ensureStyle(){
  if(document.getElementById('sunblissDesktopDeepPageShellStyles'))return;
  var s=document.createElement('style');
  s.id='sunblissDesktopDeepPageShellStyles';
  s.textContent=`
@media(min-width:1024px){
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #sbRefSidebar{
    display:none!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #app{
    padding-left:0!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page main#main{
    width:100%!important;
    max-width:none!important;
    margin-left:0!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page .topbar.sunbliss-professional-header{
    width:100%!important;
    max-width:none!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #customerFinancialSummary .money-label{
    font-size:clamp(10px,1vw,15px)!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #customerFinancialSummary .money-value{
    font-size:clamp(25px,2.8vw,40px)!important;
    line-height:1.14!important;
  }
  body.sunbliss-ref-desktop.sunbliss-desktop-deep-page #customerFinancialSummary .bar-caption{
    font-size:clamp(12px,1.25vw,18px)!important;
  }

/* Desktop form-workspace system. Customer details, booking journeys, PDF
   generators, reporting and other information-dense pages stay full-width.
   These are the existing source-owned editors, not cloned replacement forms. */
@media(min-width:1024px){
  :root{
    --crm-form-workspace-width:880px;
    --crm-form-workspace-radius:16px;
    --crm-form-workspace-overlay:rgba(15,26,38,.52);
    --crm-form-workspace-padding:24px;
  }
  /* A body::before click-shield could render ABOVE editors inside the main
     stacking context. The dialog itself supplies the dimmed backdrop without
     placing a pointer-intercepting layer over Save/Cancel. */
  body:has(:is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#inlineComplianceEditor,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel,#transactionEditPanel,#unitCancellationPanel)) #app{
    contain:none!important;
  }
  /* Small/edit forms share the same centered surface as Record Payment.
     Scroll only when the form exceeds the available viewport. */
  #customerEditPanel,
  #unitEditPanel,
  #saleComplianceEditPanel,
  #inlineComplianceEditor,
  #customerNotesManagementPanel,
  #creditNoteEditPanel,
  #transactionEditPanel,
  #unitCancellationPanel,
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel{
    position:fixed!important;
    inset:auto!important;
    top:50%!important;
    left:50%!important;
    right:auto!important;
    bottom:auto!important;
    transform:translate(-50%,-50%)!important;
    z-index:30040!important;
    box-sizing:border-box!important;
    width:min(var(--crm-form-workspace-width),calc(100vw - 48px))!important;
    max-width:calc(100vw - 48px)!important;
    min-width:0!important;
    height:auto!important;
    min-height:0!important;
    max-height:min(90dvh,850px)!important;
    margin:0!important;
    padding:var(--crm-form-workspace-padding)!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior:contain!important;
    scrollbar-gutter:stable!important;
    background:var(--paper,#F6F1E4)!important;
    border:1px solid var(--paper-line,#DCD2B6)!important;
    border-radius:var(--crm-form-workspace-radius)!important;
    box-shadow:0 0 0 100vmax var(--crm-form-workspace-overlay),0 22px 68px rgba(15,26,38,.22)!important;
  }
  /* Existing Transaction Edit and Cancel Unit workflow inputs are retained. */
  :is(#transactionEditPanel,#unitCancellationPanel){
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    gap:0!important;
  }
  :is(#transactionEditPanel,#unitCancellationPanel)>.brand-editor-actions{
    display:flex!important;
    flex-direction:row!important;
    justify-content:flex-end!important;
    gap:10px!important;
    position:sticky!important;
    bottom:-24px!important;
    margin:16px -24px -24px!important;
    padding:13px 24px 18px!important;
    background:var(--paper,#F6F1E4)!important;
    border-top:1px solid var(--paper-line,#DCD2B6)!important;
    box-shadow:none!important;
  }
  :is(#transactionEditPanel,#unitCancellationPanel)>.brand-editor-actions>button{
    min-width:140px!important;flex:0 1 auto!important;min-height:43px!important;margin:0!important;border-radius:9px!important;
  }
  :is(#transactionEditPanel,#unitCancellationPanel) .brand-field{margin:0 0 13px!important}
  :is(#transactionEditPanel,#unitCancellationPanel) .brand-field :is(input,select,textarea){max-width:100%!important;min-width:0!important;min-height:43px!important;font-size:14px!important}
  /* Both desktop and mobile use the same original inputs and callbacks. */
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#inlineComplianceEditor,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel) .section-label:first-child{
    font:700 23px/1.25 CRMInter,Inter,system-ui,sans-serif!important;
    letter-spacing:-.02em!important;
    text-transform:none!important;
    color:var(--ink,#16232F)!important;
  }
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#inlineComplianceEditor,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel) .stat-sub{
    font:400 12px/1.5 CRMInter,Inter,system-ui,sans-serif!important;
    color:var(--muted,#736C5C)!important;
  }
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#inlineComplianceEditor,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel) .brand-field{
    min-width:0!important;
    font:500 12px/1.4 CRMInter,Inter,system-ui,sans-serif!important;
    color:var(--muted,#736C5C)!important;
  }
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel) .brand-field :is(input,select,textarea){
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    min-height:43px!important;
    margin-top:6px!important;
    padding:9px 11px!important;
    border:1px solid var(--paper-line,#DCD2B6)!important;
    border-radius:9px!important;
    background:var(--paper-dim,#EBE3CE)!important;
    color:var(--ink,#16232F)!important;
    font:500 14px/1.35 CRMInter,Inter,system-ui,sans-serif!important;
  }
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#customerNotesManagementPanel,#creditNoteEditPanel,#scheduledActionPanel) .brand-field textarea{
    min-height:84px!important;
    resize:vertical;
  }
  /* Aligned field grid in Edit Customer and Edit Unit (without field changes). */
  #customerEditPanel{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    column-gap:16px!important;
    row-gap:12px!important;
    align-content:start!important;
  }
  #customerEditPanel>.section-label,
  #customerEditPanel>.stat-sub,
  #customerEditPanel>.brand-error,
  #customerEditPanel>.brand-editor-actions,
  #customerEditPanel>.crm-customer-editor-head{
    grid-column:1/-1!important;
  }
  #customerEditPanel>.brand-field{margin:0!important}
  #unitEditPanel .unit-editor-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px 16px!important}
  #unitEditPanel .unit-editor-grid>.brand-field{margin:0!important}
  #saleComplianceEditPanel>.brand-field{margin-bottom:12px!important}
  /* Avoid duplicating the mobile-only editorial header on desktop. */
  #customerEditPanel>.crm-customer-editor-head,
  #unitEditPanel>.crm-unit-editor-head,
  #saleComplianceEditPanel>.crm-sale-head{display:none!important}
  /* Sticky footer stays inside a long compact form, never at the screen bottom. */
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#creditNoteEditPanel,#scheduledActionPanel)>.brand-editor-actions{
    display:flex!important;
    align-items:center!important;
    justify-content:flex-end!important;
    gap:10px!important;
    position:sticky!important;
    bottom:calc(-1 * var(--crm-form-workspace-padding))!important;
    z-index:3!important;
    margin:16px calc(-1 * var(--crm-form-workspace-padding)) calc(-1 * var(--crm-form-workspace-padding))!important;
    padding:13px var(--crm-form-workspace-padding) 18px!important;
    background:var(--paper,#F6F1E4)!important;
    border-top:1px solid var(--paper-line,#DCD2B6)!important;
    box-shadow:none!important;
  }
  :is(#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#creditNoteEditPanel,#scheduledActionPanel)>.brand-editor-actions>button{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    flex:0 1 auto!important;
    min-width:140px!important;
    width:auto!important;
    min-height:43px!important;
    margin:0!important;
    border-radius:9px!important;
    font:600 13px/1.25 CRMInter,Inter,system-ui,sans-serif!important;
  }
  /* The Scheduled Actions full-page guard is retained for iPhone only. */
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel>.section-label:first-child{
    position:sticky!important;
    top:calc(-1 * var(--crm-form-workspace-padding))!important;
    z-index:4!important;
    margin:calc(-1 * var(--crm-form-workspace-padding)) calc(-1 * var(--crm-form-workspace-padding)) 15px!important;
    padding:19px var(--crm-form-workspace-padding) 13px!important;
    background:var(--paper,#F6F1E4)!important;
    border-bottom:1px solid var(--paper-line,#DCD2B6)!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel>.brand-editor-actions{
    position:sticky!important;
    bottom:calc(-1 * var(--crm-form-workspace-padding))!important;
    margin:16px calc(-1 * var(--crm-form-workspace-padding)) calc(-1 * var(--crm-form-workspace-padding))!important;
    padding:13px var(--crm-form-workspace-padding) 18px!important;
    box-shadow:none!important;
  }

  /* Task outcome windows follow the Record Payment proportions. Simple
     tasks are narrower; grouped installments and management approval retain
     an 880px workspace without creating a whole new page. */
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel[data-mode="complete"]:not(:has(#saGroupedPaymentList,#saExtensionApprovalFields,#saCommitmentParts)){
    width:min(660px,calc(100vw - 48px))!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel[data-mode="edit"],
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel[data-mode="new"]{
    width:min(760px,calc(100vw - 48px))!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .scheduled-form-summary{
    margin:0 0 13px!important;
    padding:10px 12px!important;
    font:500 12px/1.5 CRMInter,Inter,system-ui,sans-serif!important;
    color:var(--muted,#736C5C)!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .sa-receipt-summary{
    background:transparent!important;
    border:0!important;
    padding:0!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-field{
    display:block!important;
    margin:0 0 13px!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-field :is(input,select,textarea){
    min-height:43px!important;
    margin-top:6px!important;
    font:500 14px/1.35 CRMInter,Inter,system-ui,sans-serif!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-field input[type="checkbox"]{
    display:inline-block!important;
    width:18px!important;
    min-width:18px!important;
    height:18px!important;
    min-height:18px!important;
    padding:0!important;
    margin:0!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .scheduled-outcome-help{
    font:400 12px/1.55 CRMInter,Inter,system-ui,sans-serif!important;
  }
  html body:not(.crm-scheduled-ui-open) #scheduledActionPanel .sa-grouped-payment-list{
    max-height:min(34dvh,300px)!important;
    overflow-y:auto!important;
  }
  /* Response form: original header, scroll area, footer are kept. */
  #customerPaymentResponsePanel{
    display:grid!important;
    grid-template-columns:min(var(--crm-form-workspace-width),calc(100vw - 48px))!important;
    grid-template-rows:auto minmax(0,auto) auto!important;
    justify-content:center!important;
    align-content:center!important;
    gap:0!important;
    height:100dvh!important;
    padding:20px!important;
    background:var(--crm-form-workspace-overlay)!important;
  }
  #customerPaymentResponsePanel .cpr-head,
  #customerPaymentResponsePanel .cpr-body,
  #customerPaymentResponsePanel .cpr-foot{width:100%!important;max-width:none!important;box-sizing:border-box!important}
  #customerPaymentResponsePanel .cpr-head{
    padding:20px 26px 12px!important;
    border:1px solid var(--paper-line)!important;
    border-bottom:0!important;
    border-radius:16px 16px 0 0!important;
    background:var(--paper)!important;
  }
  #customerPaymentResponsePanel .cpr-head h2{font:700 23px/1.25 CRMInter,Inter,system-ui,sans-serif!important}
  #customerPaymentResponsePanel .cpr-body{
    min-height:0!important;
    max-height:calc(90dvh - 176px)!important;
    overflow-y:auto!important;
    padding:12px 26px 16px!important;
    border-left:1px solid var(--paper-line)!important;
    border-right:1px solid var(--paper-line)!important;
    background:var(--paper)!important;
  }
  #customerPaymentResponsePanel .cpr-content{width:100%!important;max-width:none!important}
  #customerPaymentResponsePanel .cpr-foot{
    padding:12px 26px 18px!important;
    border:1px solid var(--paper-line)!important;
    border-top:0!important;
    border-radius:0 0 16px 16px!important;
    background:var(--paper)!important;
  }
  #customerPaymentResponsePanel .cpr-actions{max-width:none!important;justify-content:flex-end!important;gap:10px!important}
  #customerPaymentResponsePanel .cpr-actions button{min-width:145px!important;min-height:43px!important;font-size:13px!important}
  /* Modification Requests: compact history/new-request workspace. */
  #modificationRequestPanel{
    display:grid!important;
    grid-template-columns:min(920px,calc(100vw - 48px))!important;
    grid-template-rows:auto minmax(0,auto) auto!important;
    justify-content:center!important;
    align-content:center!important;
    gap:0!important;
    height:100dvh!important;
    padding:20px!important;
    background:var(--crm-form-workspace-overlay)!important;
  }
  #modificationRequestPanel .mr-head,
  #modificationRequestPanel .mr-body,
  #modificationRequestPanel .mr-foot{width:100%!important;box-sizing:border-box!important}
  #modificationRequestPanel .mr-head{
    padding:18px 26px 12px!important;
    margin:0!important;
    border:1px solid var(--paper-line)!important;
    border-bottom:0!important;
    border-radius:16px 16px 0 0!important;
    background:var(--paper)!important;
  }
  #modificationRequestPanel .mr-title{font:700 23px/1.25 CRMInter,Inter,system-ui,sans-serif!important}
  #modificationRequestPanel .mr-body{
    min-height:0!important;
    max-height:calc(90dvh - 165px)!important;
    overflow-y:auto!important;
    padding:12px 26px 14px!important;
    border-left:1px solid var(--paper-line)!important;
    border-right:1px solid var(--paper-line)!important;
    background:var(--paper)!important;
  }
  #modificationRequestPanel .mr-content{width:100%!important;max-width:none!important}
  #modificationRequestPanel .mr-foot{
    padding:12px 26px 18px!important;
    margin:0!important;
    border:1px solid var(--paper-line)!important;
    border-top:0!important;
    border-radius:0 0 16px 16px!important;
    background:var(--paper)!important;
  }
  #modificationRequestPanel .mr-form-actions button{min-height:43px!important}
  /* Revised payment plan and extension require longer scroll areas. Keep the
     existing workflow and history, but confine them to an intentional card. */
  #paymentPlanRevisionPanel,
  #paymentExtensionPanel{
    position:fixed!important;
    inset:0!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    width:100%!important;
    height:100dvh!important;
    max-height:100dvh!important;
    overflow-y:auto!important;
    padding:20px!important;
    background:var(--crm-form-workspace-overlay)!important;
  }
  #paymentPlanRevisionPanel>.rpp-shell,
  #paymentExtensionPanel>.ext-shell{
    display:block!important;
    box-sizing:border-box!important;
    flex:0 1 auto!important;
    width:min(var(--crm-form-workspace-width),calc(100vw - 48px))!important;
    max-width:100%!important;
    max-height:min(90dvh,850px)!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior:contain!important;
    margin:0!important;
    padding:22px 26px!important;
    border:1px solid var(--paper-line)!important;
    border-radius:var(--crm-form-workspace-radius)!important;
    background:var(--paper,#F6F1E4)!important;
    box-shadow:0 22px 68px rgba(15,26,38,.22)!important;
  }
  #paymentPlanRevisionPanel .rpp-title,
  #paymentExtensionPanel .ext-title{font:700 23px/1.25 CRMInter,Inter,system-ui,sans-serif!important}
  #paymentPlanRevisionPanel .rpp-head,
  #paymentExtensionPanel .ext-head{position:sticky!important;top:-22px!important;z-index:4!important;margin:-22px -26px 15px!important;padding:19px 26px 13px!important;background:var(--paper)!important;border-bottom:1px solid var(--paper-line)!important}
  #paymentPlanRevisionPanel .rpp-actions{bottom:-22px!important;margin:16px -26px -22px!important;padding:13px 26px 19px!important;box-shadow:none!important}
  #paymentExtensionPanel .ext-form-actions{bottom:-22px!important;margin:15px -14px -14px!important;padding:12px 14px!important;box-shadow:none!important}
  /* Source-owned overlays share the same bounded desktop workspace. */
  .crm-full-page-overlay{
    display:flex!important;align-items:center!important;justify-content:center!important;
    padding:24px!important;background:var(--crm-form-workspace-overlay)!important;
    z-index:30100!important;overflow:hidden!important;
  }
  .crm-full-page-overlay>.crm-full-page-dialog{
    width:min(880px,100%)!important;max-width:100%!important;height:auto!important;
    min-height:0!important;max-height:calc(100dvh - 48px)!important;
    margin:0!important;padding:24px!important;border-radius:16px!important;
    overflow:auto!important;overscroll-behavior:contain!important;box-sizing:border-box!important;
  }
  #paymentDetailDialog h3{font:700 23px/1.25 CRMInter,Inter,system-ui,sans-serif!important}
  #paymentDetailDialog .payment-detail-actions{position:sticky;bottom:-24px;background:var(--paper);padding:12px 0;margin-bottom:0}
  /* Existing centered Installment and Payment Details dialogs remain source-owned.
     Do not force wider view pages or document/PDF generators into small dialogs. */
}
}
`;
  document.head.appendChild(s);
}
function queue(){requestAnimationFrame(sync)}

ensureStyle();
sync();

var bodyObserver=new MutationObserver(function(mutations){
  for(var i=0;i<mutations.length;i++){
    var m=mutations[i];
    if(m.type==='attributes'||m.addedNodes.length||m.removedNodes.length){queue();break}
  }
});
bodyObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

['render','renderMain','renderOverview','renderInsights','renderList','renderDetail'].forEach(function(name){
  var original=window[name];
  if(typeof original!=='function'||original.__sunblissDeepShellWrapped)return;
  var wrapped=function(){
    var out=original.apply(this,arguments);
    queue();
    return out;
  };
  wrapped.__sunblissDeepShellWrapped=true;
  wrapped.__sunblissOriginal=original;
  window[name]=wrapped;
});

document.addEventListener('sunbliss:navigation-restored',queue);
window.addEventListener('resize',queue,{passive:true});
window.addEventListener('pageshow',queue,{passive:true});
})();