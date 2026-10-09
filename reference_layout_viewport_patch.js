(function(){
'use strict';
if(window.__crmReferenceLayout)return;window.__crmReferenceLayout=true;
var style=document.createElement('style');style.id='crmReferenceLayout';
style.textContent=`
/* Important declarations in this layer take precedence over the legacy patch
   styles, including inline font shorthands. Document iframes stay independent. */
@layer crmReference {
 :root{--paper:#faf7ef!important;--paper-dim:#efe9d9!important;--paper-line:#ded7c8!important;--muted:#66635c!important;--ink:#102333!important;--gold-deep:#8d5c18!important;--rust:#b62f2c!important}
 #main :is(.sb-v2-card,.stat-cell,.sbx-section-frame,#customerFinancialSummary){box-shadow:none!important}

 body,body :is(h1,h2,h3,h4,p,div,span,label,button,input,select,textarea,a,summary,strong,b,small,th,td,dt,dd){font-family:CRMInter,Inter,Arial,sans-serif!important}
 *,*::before,*::after{box-sizing:border-box}
 #app,#main,.detail,.overview,.units,.insights{min-width:0!important}
 .detail,.overview,.units,.insights{max-width:100%!important}
 .field-val,.field-value,.field-address,.customer-name,.d-name>span:first-child{min-width:0!important;overflow-wrap:anywhere!important}
 .detail{position:relative!important;isolation:isolate!important}
 .detail .detail-top-actions-sticky{position:static!important;display:block!important;width:100%!important;margin:0 0 10px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
 #btnGenerateDocument{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:16px!important;width:100%!important;min-height:58px!important;margin:0!important;padding:14px 22px!important;border:1px solid var(--paper-line)!important;border-radius:9px!important;background:var(--paper-dim)!important;color:var(--ink)!important;box-shadow:none!important;text-transform:uppercase!important;letter-spacing:.055em!important;font-size:15px!important;font-weight:700!important;line-height:1.3!important}
 #btnGenerateDocument svg{width:24px;height:28px;flex:none}
 #inlineComplianceStrip{width:100%!important;margin:0 0 12px!important;border:1px solid var(--paper-line)!important;border-radius:9px!important;background:transparent!important;overflow:hidden!important}
 .inline-compliance-chip{min-height:58px!important;padding:12px!important;gap:12px!important;font-size:15px!important}
 .inline-compliance-chip-label{font-size:14px!important;letter-spacing:0!important;font-weight:650!important;color:var(--muted)!important}
 .inline-compliance-chip-status{font-weight:650!important}
 .inline-compliance-chip-arrow{font-size:24px!important;margin-left:3px!important;color:var(--gold-deep)!important;opacity:.5!important}
 .crm-identity-outline{position:absolute;left:var(--identity-left);top:var(--identity-top);width:var(--identity-width);height:var(--identity-height);border:1px solid var(--paper-line);border-radius:9px;pointer-events:none;z-index:-1}
 .detail .d-name{margin:0!important;padding:20px 18px 0!important;font-size:24px!important;font-weight:700!important;line-height:1.25!important;letter-spacing:-.02em!important;color:var(--ink)!important;gap:14px!important}
 #customerActionMenuButton{width:44px!important;height:44px!important;flex:none!important;border:1px solid var(--paper-line)!important;border-radius:9px!important;font-size:25px!important;background:transparent!important;box-shadow:none!important}
 #customerActionMenu{max-width:calc(100vw - 48px)!important;max-height:calc(var(--crm-vh,100dvh) - 100px)!important;overflow:auto!important}
 #unitMetaInline{gap:0!important;flex-wrap:wrap!important;margin:14px 18px 20px!important;font-size:14px!important;line-height:1.45!important}
 #unitMetaInline>span:not(.unit-meta-sep){min-width:0;overflow-wrap:anywhere}
 #unitMetaInline .unit-meta-number{font-weight:700!important}
 #unitMetaInline .unit-meta-sep{display:block!important;width:1px!important;height:22px!important;background:var(--paper-line)!important;color:transparent!important;font-size:0!important;margin:0 18px!important;opacity:1!important}
 #actionRequiredCard{margin:0 14px 32px!important;width:calc(100% - 28px)!important;border-radius:10px!important;border-left-width:7px!important;background:color-mix(in srgb,var(--paper) 94%,var(--rust) 6%)!important;box-shadow:none!important}
 #actionRequiredCard .action-required-head{padding:18px 20px 6px!important;gap:10px!important}
 #actionRequiredCard .action-required-title{font-size:14px!important;letter-spacing:.055em!important;font-weight:700!important;white-space:normal!important}
 #actionRequiredCard[data-tone=danger] .action-required-title{color:var(--rust)!important}
 #actionRequiredCard .action-required-status-wrap{min-height:38px!important;padding:7px 12px!important;border-radius:7px!important;border:1px solid color-mix(in srgb,currentColor 20%,transparent)!important;background:color-mix(in srgb,currentColor 5%,transparent)!important;gap:9px!important}
 #actionRequiredCard .action-required-status{font-size:14px!important;font-weight:650!important}
 #actionRequiredCard .action-required-message{padding:18px 20px 24px!important;font-size:15px!important;line-height:1.45!important;font-weight:650!important;letter-spacing:-.015em!important;overflow-wrap:anywhere!important}
 #actionRequiredCard .action-required-meta{padding:0 20px 20px!important;gap:10px!important}
 #actionRequiredCard .action-required-meta-block{gap:12px!important;padding:10px 12px!important;min-height:52px!important;border-radius:9px!important}
 #actionRequiredCard .action-required-meta-label{font-size:14px!important;white-space:normal!important}
 #actionRequiredCard .action-required-meta-value{font-size:14px!important;font-weight:650!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
 #actionRequiredCard .action-required-meta-block:before{height:26px!important}
 #actionRequiredCard[data-tone=good]{background:color-mix(in srgb,var(--paper) 95%,var(--sage) 5%)!important}
 /* Fixed layers use the visual viewport, including the on-screen keyboard. */
 body>[id$="Overlay"],body>.cancelled-edit-modal,.crm-full-page-overlay{
  top:var(--crm-vtop,0px)!important;bottom:auto!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;width:100%!important;max-width:100%!important;min-height:0!important;box-sizing:border-box!important;overscroll-behavior:contain!important
 }
 body>[id$="Overlay"]:not(.crm-full-page-overlay),body>.cancelled-edit-modal{align-items:center!important;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))!important;overflow:hidden!important;z-index:20060!important}
 body>[id$="Overlay"]:not(.crm-full-page-overlay)>[role=dialog],body>[id$="Overlay"]:not(.crm-full-page-overlay)>[id$="Dialog"],body>.cancelled-edit-modal>.cancelled-edit-card{min-height:0!important;max-height:100%!important;max-width:100%!important;overflow:auto!important;overscroll-behavior:contain!important;margin:auto!important}
 #managerVisitDialog{display:flex!important;flex-direction:column!important;overflow:hidden!important}
 .manager-visit-head{flex:none!important;position:relative!important;min-width:0!important}
 .manager-visit-head>div{min-width:0!important}
 .manager-visit-title{font-size:20px!important;line-height:1.25!important;font-weight:700!important}
 .manager-visit-close{width:40px!important;height:40px!important}
 .manager-visit-body{min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
 .manager-visit-card-top{flex-wrap:wrap!important}
 .manager-visit-status{max-width:100%!important;white-space:normal!important}
 .crm-full-page-inline,.crm-full-page-dialog,#scheduledActionPanel,#customerPaymentResponsePanel,.rpp-panel,#modificationRequestPanel{
  top:var(--crm-vtop,0px)!important;bottom:auto!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;min-height:0!important;max-width:100%!important;box-sizing:border-box!important
 }
 .crm-full-page-overlay>.crm-full-page-dialog{top:0!important;height:100%!important;max-height:100%!important}
 #crmDocumentDialog{top:calc(var(--crm-vtop,0px) + 12px)!important;bottom:auto!important;max-height:calc(var(--crm-vh,100dvh) - 24px)!important;margin:0 auto!important;width:calc(100% - 24px)!important;box-sizing:border-box!important}
 #crmDocumentDialog[open]{display:flex!important;flex-direction:column!important;overflow:hidden!important}
 #crmDocumentDialog iframe{flex:1!important;min-height:0!important;height:auto!important}
 #crmDocumentDialog .document-dialog-bar{flex:none!important}
 #crmDocumentDialog .document-options{min-height:0!important;overflow:auto!important}
 #crmDocumentDialog.document-workspace{height:calc(var(--crm-vh,100dvh) - 24px)!important}
 .document-options{max-height:calc(var(--crm-vh,100dvh) - 88px)!important}
 .document-dialog-bar{height:auto!important;min-height:64px!important;flex-wrap:wrap!important;padding:12px!important}
 .document-dialog-title{font-size:18px!important;white-space:normal!important}
 .brand-editor input,.brand-editor select,.brand-editor textarea{max-width:100%!important;min-width:0!important}
 .ledger-scroll{max-width:100%!important;overflow-x:auto!important}
 @media(max-width:719px){
  .detail{padding-left:12px!important;padding-right:12px!important}
  #btnGenerateDocument{min-height:50px!important;padding:12px 16px!important;font-size:13px!important;gap:13px!important}
  #btnGenerateDocument svg{width:20px;height:24px}
  .inline-compliance-chip{min-height:48px!important;font-size:12px!important;gap:8px!important}
  .inline-compliance-chip-label{font-size:11px!important}
  .detail .d-name{padding:16px 12px 0!important;font-size:18px!important}
  #unitMetaInline{margin:12px 12px 20px!important;font-size:12px!important;row-gap:8px!important}
  #unitMetaInline .unit-meta-sep{margin:0 10px!important;height:18px!important}
  #actionRequiredCard{margin-left:9px!important;margin-right:9px!important;width:calc(100% - 18px)!important;border-left-width:5px!important}
  #actionRequiredCard .action-required-head{padding:14px 12px 5px!important}
  #actionRequiredCard .action-required-title{font-size:11px!important}
  #actionRequiredCard .action-required-status-wrap{padding:6px 9px!important;min-height:32px!important;gap:6px!important}
  #actionRequiredCard .action-required-status{font-size:12px!important}
  #actionRequiredCard .action-required-status-icon svg{width:17px!important;height:17px!important}
  #actionRequiredCard .action-required-message{padding:16px 12px 22px!important;font-size:13px!important}
  #actionRequiredCard .action-required-meta{padding:0 12px 16px!important;gap:7px!important}
  #actionRequiredCard .action-required-meta-block{gap:7px!important;padding:8px!important;min-height:44px!important}
  #actionRequiredCard .action-required-meta-label{font-size:11px!important}
  #actionRequiredCard .action-required-meta-value{font-size:12px!important}
 }
}
`;
document.head.appendChild(style);
function viewport(){var v=window.visualViewport;if(v&&v.scale>1.05)return;var root=document.documentElement;root.style.setProperty('--crm-vh',(v?v.height:window.innerHeight)+'px');root.style.setProperty('--crm-vtop',(v?v.offsetTop:0)+'px')}
viewport();window.addEventListener('resize',viewport,{passive:true});if(window.visualViewport){visualViewport.addEventListener('resize',viewport,{passive:true});visualViewport.addEventListener('scroll',viewport,{passive:true})}
function decorate(){
 var detail=document.querySelector('.detail');if(!detail)return;
 var button=detail.querySelector('#btnGenerateDocument');if(button&&!button.querySelector('svg'))button.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M5 2h10l6 6v17H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M15 2v7h6M8 14h8M8 19h8"/></svg>');
 var name=detail.querySelector('.d-name'),card=detail.querySelector('#actionRequiredCard');if(!name||!card)return;
 var outline=detail.querySelector('.crm-identity-outline');if(!outline){outline=document.createElement('div');outline.className='crm-identity-outline';outline.setAttribute('aria-hidden','true');detail.appendChild(outline)}
 var d=detail.getBoundingClientRect(),n=name.getBoundingClientRect(),c=card.getBoundingClientRect();
 var values={'--identity-left':n.left-d.left,'--identity-top':n.top-d.top,'--identity-width':n.width,'--identity-height':c.bottom-n.top+20};
 Object.keys(values).forEach(function(k){var value=Math.round(values[k]*100)/100+'px';if(outline.style.getPropertyValue(k)!==value)outline.style.setProperty(k,value)});
}
var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decorate()})}
['render','renderMain','renderDetail'].forEach(function(name){var base=window[name];if(typeof base!=='function')return;window[name]=function(){var out=base.apply(this,arguments);queue();return out}});
// Observe layout changes, not each animation frame or counter text mutation.
var observed=null,resize=window.ResizeObserver?new ResizeObserver(queue):null;
var observer=new MutationObserver(function(ms){if(!ms.some(function(m){return Array.from(m.addedNodes).some(function(n){return n.nodeType===1&&(n.matches('.detail,#actionRequiredCard,#btnGenerateDocument,#unitMetaInline')||n.querySelector('.detail,#actionRequiredCard,#btnGenerateDocument'))})}))return;var detail=document.querySelector('.detail');if(resize&&detail!==observed){resize.disconnect();if(detail)resize.observe(detail);observed=detail}queue()});
observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',queue,{passive:true});if(document.fonts)document.fonts.ready.then(queue);queue();
})();
