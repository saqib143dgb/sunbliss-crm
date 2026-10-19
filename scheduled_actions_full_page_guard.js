(function(){
  'use strict';
  if(window.__sunblissScheduledActionFullPageGuardInstalled)return;
  window.__sunblissScheduledActionFullPageGuardInstalled=true;

  var style=document.createElement('style');
  style.id='scheduledActionFullPageGuardStyles';
  style.textContent=[
    'body.scheduled-action-open{overflow:hidden!important;overscroll-behavior:none!important}',
    'body.scheduled-action-open .detail-top-actions-sticky{visibility:hidden!important;pointer-events:none!important}',
    'body:not(.crm-scheduled-ui-open) #scheduledActionPanel{position:fixed!important;inset:0!important;z-index:12200!important;width:100%!important;max-width:none!important;height:100dvh!important;max-height:none!important;margin:0!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:var(--paper,#F6F1E4)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important;scroll-padding-bottom:110px!important}',
    'body:not(.crm-scheduled-ui-open) #scheduledActionPanel>.section-label:first-child{position:sticky!important;top:calc(-18px - env(safe-area-inset-top))!important;z-index:8!important;margin:calc(-18px - env(safe-area-inset-top)) -16px 12px!important;padding:calc(17px + env(safe-area-inset-top)) 16px 13px!important;background:var(--paper,#F6F1E4)!important;border-bottom:1px solid var(--paper-line,#DCD2B6)!important}',
    'body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-editor-actions{position:sticky!important;bottom:calc(-26px - env(safe-area-inset-bottom))!important;z-index:9!important;margin:18px -16px calc(-26px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#F6F1E4)!important;border-top:1px solid var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important}',
    '#scheduledActionPanel .task-test-indicator{display:block;margin-top:8px;padding:7px 12px;border:1px solid #b68a2d;border-radius:8px;background:#fff1ca;color:#172a36;font:600 12px/1.4 Inter,system-ui,sans-serif;letter-spacing:0;text-transform:none}',
    'body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-editor-actions .btn,body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-editor-actions .btn-paper{min-height:46px!important;margin:0!important}',
    '@media(max-width:520px){body:not(.crm-scheduled-ui-open) #scheduledActionPanel{padding-left:14px!important;padding-right:14px!important}body:not(.crm-scheduled-ui-open) #scheduledActionPanel>.section-label:first-child{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important}body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-editor-actions{margin-left:-14px!important;margin-right:-14px!important;padding-left:14px!important;padding-right:14px!important;flex-direction:column!important}body:not(.crm-scheduled-ui-open) #scheduledActionPanel .brand-editor-actions button{width:100%!important}}'
  ].join('');
  document.head.appendChild(style);

  var queued=false;
  function refresh(){
    queued=false;var panel=document.getElementById('scheduledActionPanel');
    document.body.classList.toggle('scheduled-action-open',!!panel);
    if(panel&&window.__crmTestMode&&window.__crmTestMode.active){
      var heading=panel.querySelector(':scope > .section-label');
      if(heading&&!heading.querySelector('.task-test-indicator')){var indicator=document.createElement('span');indicator.className='task-test-indicator';indicator.textContent='TEST MODE · Practice only';heading.appendChild(indicator);}
    }
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(refresh);}
  function relevant(node){
    if(!node||node.nodeType!==1)return false;
    if(node.id==='scheduledActionPanel')return true;
    return !!(node.querySelector&&node.querySelector('#scheduledActionPanel'));
  }
  if(window.MutationObserver)new MutationObserver(function(mutations){
    for(var i=0;i<mutations.length;i++){
      for(var j=0;j<mutations[i].addedNodes.length;j++)if(relevant(mutations[i].addedNodes[j])){queue();return;}
      for(var k=0;k<mutations[i].removedNodes.length;k++)if(relevant(mutations[i].removedNodes[k])){queue();return;}
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();