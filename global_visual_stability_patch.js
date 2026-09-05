(function(){
  'use strict';
  if(window.__sunblissGlobalVisualStabilityInstalled)return;
  window.__sunblissGlobalVisualStabilityInstalled=true;

  function installStyle(){
    if(document.getElementById('globalVisualStabilityStyles'))return;
    var style=document.createElement('style');
    style.id='globalVisualStabilityStyles';
    style.textContent=[
      '#app,#app *{animation:none!important;transition:none!important}',
      '#app{contain:layout style;}',
      '#main,.overview,.detail,.units,.insights{opacity:1!important;transform:none!important}',
      '.stage-card,.scheduled-task-card,.scheduled-overview-row,.notice,.card,.detail section{backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '@media(prefers-reduced-motion:no-preference){html{scroll-behavior:auto!important}}',

      /* Desktop customer record: one consistent content grid instead of mobile rows stretched across the workspace. */
      '@media(min-width:1024px){',
      'body.sunbliss-ref-desktop .detail{width:100%!important;max-width:1240px!important;margin:0 auto!important;padding:24px 32px 112px!important;box-sizing:border-box!important;}',
      'body.sunbliss-ref-desktop .detail .d-name{font-size:25px!important;line-height:1.12!important;}',
      'body.sunbliss-ref-desktop .detail .section-label{margin-top:26px!important;margin-bottom:10px!important;}',

      /* Contact, unit detail and Sale & Compliance rows share the same desktop columns. */
      'body.sunbliss-ref-desktop .detail .field-row,body.sunbliss-ref-desktop .detail .field-address{display:grid!important;grid-template-columns:205px minmax(0,1fr)!important;column-gap:26px!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 2px!important;margin:0!important;border-bottom:1px solid var(--paper-line)!important;font-size:12.5px!important;}',
      'body.sunbliss-ref-desktop .detail .field-label{display:block!important;margin:0!important;color:var(--muted)!important;line-height:1.35!important;}',
      'body.sunbliss-ref-desktop .detail .field-value{display:block!important;min-width:0!important;max-width:100%!important;justify-self:start!important;text-align:left!important;line-height:1.45!important;word-break:break-word!important;}',
      'body.sunbliss-ref-desktop .detail .field-address .field-label{margin:0!important;}',
      'body.sunbliss-ref-desktop .detail .field-address .field-value{font-family:Inter,system-ui,sans-serif!important;font-size:12.5px!important;}',
      'body.sunbliss-ref-desktop .detail .mask-btn{justify-self:start!important;text-align:left!important;}',

      /* Keep action pills aligned to the same record edge. */
      'body.sunbliss-ref-desktop .detail .reminder-actions{display:flex!important;align-items:center!important;gap:9px!important;margin:12px 0 20px!important;}',
      'body.sunbliss-ref-desktop .detail .reminder-actions .btn-paper{margin:0!important;}',

      /* Financial summary now uses the complete desktop content width with equal cards. */
      'body.sunbliss-ref-desktop .detail .money-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%!important;max-width:none!important;margin:18px 0 14px!important;border-radius:13px!important;}',
      'body.sunbliss-ref-desktop .detail .money-cell{min-width:0!important;min-height:92px!important;padding:17px 16px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}',
      'body.sunbliss-ref-desktop .detail .money-label{margin:0 0 8px!important;}',
      'body.sunbliss-ref-desktop .detail .money-value{font-size:18px!important;line-height:1.15!important;margin:0!important;white-space:nowrap!important;}',
      'body.sunbliss-ref-desktop .detail .cust-progress{width:100%!important;margin:4px 0 24px!important;}',
      'body.sunbliss-ref-desktop .detail .cust-progress .bar{width:100%!important;}',
      'body.sunbliss-ref-desktop .detail .bar-caption{margin-top:8px!important;}',

      /* Desktop installment ledger: cards use the available grid instead of a mobile horizontal scroller. */
      'body.sunbliss-ref-desktop .detail .ledger-scroll{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;overflow:visible!important;scroll-snap-type:none!important;padding:4px 0 14px!important;}',
      'body.sunbliss-ref-desktop .detail .stage-card{width:auto!important;min-width:0!important;flex:none!important;scroll-snap-align:none!important;}',

      /* Transaction rows follow a stable date / description / amount desktop grid. */
      'body.sunbliss-ref-desktop .detail .tx-list{width:100%!important;border:1px solid var(--paper-line)!important;border-radius:12px!important;overflow:hidden!important;}',
      'body.sunbliss-ref-desktop .detail .tx-row{display:grid!important;grid-template-columns:112px minmax(0,1fr) auto!important;align-items:center!important;gap:18px!important;padding:12px 14px!important;border-bottom:1px solid var(--paper-line)!important;}',
      'body.sunbliss-ref-desktop .detail .tx-row:last-child{border-bottom:0!important;}',
      'body.sunbliss-ref-desktop .detail .tx-date{width:auto!important;}',
      'body.sunbliss-ref-desktop .detail .tx-amt{text-align:right!important;white-space:nowrap!important;}',

      /* The persistent Back control is centered inside the workspace, not the full browser including the sidebar. */
      'body.sunbliss-ref-desktop #sunblissPersistentBack{left:calc(50% + 108px)!important;width:min(600px,calc(100vw - 280px))!important;bottom:14px!important;}',
      '}',
      '@media(min-width:1440px){body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important;}}',
      '@media(min-width:1800px){body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important;}}',
      '@media(min-width:1024px) and (max-width:1180px){body.sunbliss-ref-desktop .detail{padding-left:24px!important;padding-right:24px!important;}body.sunbliss-ref-desktop .detail .field-row,body.sunbliss-ref-desktop .detail .field-address{grid-template-columns:175px minmax(0,1fr)!important;column-gap:20px!important;}body.sunbliss-ref-desktop .detail .ledger-scroll{grid-template-columns:repeat(3,minmax(0,1fr))!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  installStyle();
  window.addEventListener('pageshow',installStyle);
})();
