(function(){
  'use strict';
  if(window.__sunblissScheduledActionsOverviewStyleInstalled)return;
  window.__sunblissScheduledActionsOverviewStyleInstalled=true;

  function ensureStyles(){
    if(document.getElementById('scheduledActionsOverviewDistinctStyles'))return;
    var s=document.createElement('style');
    s.id='scheduledActionsOverviewDistinctStyles';
    s.textContent=[
      '#scheduledActionsOverview{position:relative!important;margin:28px 0 8px!important;padding:0 13px 13px!important;border:1px solid var(--paper-line)!important;border-radius:16px!important;background:var(--paper,#F6F1E4)!important;box-shadow:0 8px 24px rgba(15,26,38,.055)!important;overflow:hidden!important}',
      '#scheduledActionsOverview:before{content:"";display:block;height:4px;margin:0 -13px;background:var(--gold-deep,#A27C35)}',
      '#scheduledActionsOverview .scheduled-overview-head{margin:0 -13px 12px!important;padding:14px 13px 13px!important;background:var(--paper-dim,#EEE7D8)!important;border-bottom:1px solid var(--paper-line)!important;align-items:center!important}',
      '#scheduledActionsOverview .scheduled-overview-head .section-label{font-family:Inter,Arial,sans-serif!important;font-size:14px!important;line-height:1.25!important;font-weight:750!important;letter-spacing:.01em!important;text-transform:none!important;color:var(--ink)!important}',
      '#scheduledActionsOverview .scheduled-overview-head .section-label:after{content:none!important;display:none!important}',
      '#scheduledActionsOverview .scheduled-overview-select{min-width:134px!important;max-width:164px!important;padding:8px 34px 8px 12px!important;border:1px solid rgba(162,124,53,.68)!important;border-radius:999px!important;-webkit-appearance:none!important;appearance:none!important;cursor:pointer!important;background-color:var(--paper,#F6F1E4)!important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22%3E%3Cpath d=%22M1 1.5 6 6.5 11 1.5%22 fill=%22none%22 stroke=%22%23A27C35%22 stroke-width=%221.6%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 12px center!important;background-size:12px 8px!important;box-shadow:0 2px 7px rgba(15,26,38,.07),inset 0 1px 0 rgba(255,255,255,.5)!important;font-size:10.5px!important}',
      '#scheduledActionsOverview .scheduled-overview-list{border-top:0!important;display:grid!important;gap:8px!important}',
      '#scheduledActionsOverview .scheduled-overview-row{position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;padding:11px 11px 11px 13px!important;border:1px solid var(--paper-line)!important;border-radius:11px!important;background:var(--paper-dim,#EEE7D8)!important}',
      '#scheduledActionsOverview .scheduled-overview-row:before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--slate,#586679)}',
      '#scheduledActionsOverview .scheduled-overview-unit{font-size:9px!important;color:var(--gold-deep,#A27C35)!important}',
      '#scheduledActionsOverview .scheduled-overview-title{font-size:12.5px!important;font-weight:700!important;margin-top:3px!important}',
      '#scheduledActionsOverview .scheduled-overview-meta{margin-top:5px!important;font-size:10.3px!important;line-height:1.45!important}',
      '#scheduledActionsOverview .scheduled-overview-done{min-height:38px!important;padding:8px 10px!important;border-radius:9px!important;background:var(--paper,#F6F1E4)!important}',
      '#scheduledActionsOverview .scheduled-empty{margin:0!important;padding:18px 12px!important;border:1px dashed var(--paper-line)!important;border-radius:11px!important;background:var(--paper-dim,#EEE7D8)!important;text-align:center!important;font-size:11.5px!important}',
      '@media(max-width:520px){#scheduledActionsOverview{margin-top:24px!important;padding-left:10px!important;padding-right:10px!important}#scheduledActionsOverview:before{margin-left:-10px!important;margin-right:-10px!important}#scheduledActionsOverview .scheduled-overview-head{margin-left:-10px!important;margin-right:-10px!important;padding-left:10px!important;padding-right:10px!important;gap:8px!important}#scheduledActionsOverview .scheduled-overview-head .section-label{font-size:13.5px!important}#scheduledActionsOverview .scheduled-overview-select{min-width:126px!important;max-width:145px!important}#scheduledActionsOverview .scheduled-overview-row{grid-template-columns:1fr!important;padding:11px 10px 10px 12px!important}#scheduledActionsOverview .scheduled-overview-done{width:100%!important}}'
    ].join('');
    document.head.appendChild(s);
  }

  ensureStyles();
})();

