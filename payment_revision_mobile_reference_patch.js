(function(){
  'use strict';
  if(window.__sunblissRevisionMobileReferenceInstalled)return;
  window.__sunblissRevisionMobileReferenceInstalled=true;
  // Presentation only. All revision selection, approval and save logic stays in
  // payment_plan_revision_ui_patch.js.
  var style=document.createElement('style');
  style.id='sunblissRevisionMobileReferenceStyles';
  style.textContent=[
    '.rpp-back,.rpp-mobile-title,.rpp-mobile-context{display:none}',
    '@media(max-width:1023px){',
      'body.rpp-open{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.rpp-open #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
      'body.rpp-open>.tabs,body.rpp-open #sunblissPersistentBackDock,body.rpp-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
      '#paymentPlanRevisionPanel.rpp-panel{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30050!important;display:block!important;width:100%!important;max-width:100%!important;min-height:0!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;margin:0!important;padding:0!important;box-sizing:border-box!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;overflow:hidden!important;overscroll-behavior:contain!important}',
      '#paymentPlanRevisionPanel .rpp-shell{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:0!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;box-sizing:border-box!important;background:var(--paper,#faf7ef)!important;overflow:hidden!important}',
      '#paymentPlanRevisionPanel .rpp-head{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;gap:15px!important;flex:0 0 auto!important;min-width:0!important;margin:0 0 22px!important;padding:0!important;border:0!important;background:transparent!important}',
      '#paymentPlanRevisionPanel .rpp-head .rpp-back{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:none!important;width:30px!important;height:42px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:var(--ink,#102333)!important;cursor:pointer!important}',
      '#paymentPlanRevisionPanel .rpp-heading{flex:1 1 auto!important;min-width:0!important;padding:4px 0 0!important}',
      '#paymentPlanRevisionPanel .rpp-kicker,#paymentPlanRevisionPanel .rpp-unit-title,#paymentPlanRevisionPanel .rpp-head #rppClose{display:none!important}',
      '#paymentPlanRevisionPanel .rpp-mobile-title{display:inline!important}',
      '#paymentPlanRevisionPanel .rpp-mobile-context{display:inline!important}',
      '#paymentPlanRevisionPanel .rpp-title{margin:0 0 5px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:24px!important;line-height:1.25!important;font-weight:700!important;letter-spacing:-.025em!important;color:var(--ink,#102333)!important}',
      '#paymentPlanRevisionPanel .rpp-sub{margin:0!important;max-width:100%!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;line-height:1.4!important;font-weight:400!important;color:var(--muted,#66635c)!important;overflow-wrap:anywhere!important}',
      '#paymentPlanRevisionPanel .rpp-scroll{display:block!important;flex:1 1 auto!important;min-height:0!important;max-height:100%!important;width:100%!important;margin:0!important;padding:18px 15px 21px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-bottom:0!important;border-radius:14px 14px 0 0!important;background:transparent!important;box-sizing:border-box!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;scroll-padding-bottom:28px!important}',
      '#paymentPlanRevisionPanel .rpp-scroll>.rpp-warning{margin:0 0 13px!important;padding:11px 12px!important;border-radius:10px!important;box-shadow:none!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;line-height:1.5!important;font-weight:400!important}',
      '#paymentPlanRevisionPanel .rpp-mode{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0 0 12px!important}',
      '#paymentPlanRevisionPanel .rpp-mode button{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;width:100%!important;min-height:42px!important;padding:9px 8px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:10px!important;background:var(--paper,#faf7ef)!important;color:var(--ink,#102333)!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:12px!important;font-weight:600!important;line-height:1.3!important;white-space:normal!important;box-shadow:none!important}',
      '#paymentPlanRevisionPanel .rpp-mode button.active{background:var(--ink,#102333)!important;border-color:var(--ink,#102333)!important;color:var(--paper,#faf7ef)!important}',
      '#paymentPlanRevisionPanel .rpp-section{margin:13px 0 0!important}',
      '#paymentPlanRevisionPanel .rpp-section-title{margin:0 0 8px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;font-weight:600!important;letter-spacing:normal!important;text-transform:none!important;color:var(--muted,#66635c)!important}',
      '#paymentPlanRevisionPanel .rpp-list{display:grid!important;gap:8px!important}',
      '#paymentPlanRevisionPanel .rpp-card{min-width:0!important;margin:0!important;padding:11px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:11px!important;background:var(--paper-dim,#efe9d9)!important;box-shadow:none!important}',
      '#paymentPlanRevisionPanel .rpp-card.selected{border-color:var(--gold,#c6972e)!important;box-shadow:0 0 0 1px rgba(198,151,46,.16) inset!important}',
      '#paymentPlanRevisionPanel .rpp-card-head{display:flex!important;align-items:flex-start!important;gap:9px!important}',
      '#paymentPlanRevisionPanel .rpp-card-head>div{flex:1 1 auto!important;min-width:0!important}',
      '#paymentPlanRevisionPanel .rpp-select{flex:none!important;width:18px!important;height:18px!important;margin:1px 0 0!important;accent-color:var(--gold-deep,#8f6a1e)!important}',
      '#paymentPlanRevisionPanel .rpp-stage{font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:13.5px!important;font-weight:650!important;line-height:1.3!important;color:var(--ink,#102333)!important}',
      '#paymentPlanRevisionPanel .rpp-meta,#paymentPlanRevisionPanel .rpp-current{margin:4px 0 0!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11px!important;line-height:1.4!important;font-weight:400!important;overflow-wrap:anywhere!important}',
      '#paymentPlanRevisionPanel .rpp-fields{display:grid!important;grid-template-columns:1fr!important;gap:11px!important;margin:13px 0 0!important}',
      '#paymentPlanRevisionPanel .rpp-card:not(.selected) .rpp-fields{display:none!important}',
      '#paymentPlanRevisionPanel .rpp-field{display:block!important;margin:0 0 9px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;line-height:1.4!important;font-weight:400!important;color:var(--muted,#66635c)!important}',
      '#paymentPlanRevisionPanel .rpp-field :is(input,textarea){display:block!important;width:100%!important;max-width:100%!important;min-height:46px!important;margin:7px 0 0!important;padding:10px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:8px!important;background:var(--paper-dim,#efe9d9)!important;box-sizing:border-box!important;color:var(--ink,#102333)!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:16px!important;line-height:1.25!important;font-weight:500!important;box-shadow:none!important}',
      '#paymentPlanRevisionPanel .rpp-approval{margin:0!important;padding:12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:11px!important;background:transparent!important;box-shadow:none!important}',
      '#paymentPlanRevisionPanel .rpp-approval-grid{display:grid!important;grid-template-columns:1fr!important;gap:5px!important}',
      '#paymentPlanRevisionPanel .rpp-approval textarea{min-height:76px!important}',
      '#paymentPlanRevisionPanel .rpp-history{gap:8px!important}',
      '#paymentPlanRevisionPanel .rpp-actions{position:relative!important;bottom:auto!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;justify-content:stretch!important;gap:10px!important;flex:0 0 auto!important;width:auto!important;margin:0 -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line,#ded7c8)!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;z-index:5!important}',
      '#paymentPlanRevisionPanel .rpp-actions>button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;min-height:48px!important;margin:0!important;padding:10px 8px!important;border-radius:999px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:14px!important;line-height:1.3!important;font-weight:600!important;white-space:nowrap!important;box-shadow:none!important}',
      '#paymentPlanRevisionPanel .rpp-actions #rppSave{background:var(--gold,#c6972e)!important;border:1px solid var(--gold,#c6972e)!important;color:var(--ink,#102333)!important}',
      '#paymentPlanRevisionPanel .rpp-actions #rppCancel{background:var(--paper-dim,#efe9d9)!important;border:1px solid var(--paper-line,#ded7c8)!important;color:var(--ink,#102333)!important}',
    '}',
    '@media(prefers-reduced-motion:reduce){#paymentPlanRevisionPanel{animation:none!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(style);
})();