(function(){
  'use strict';
  if(window.__sunblissCustomerEditorMobileReferenceInstalled)return;
  window.__sunblissCustomerEditorMobileReferenceInstalled=true;

  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }
  var style=document.createElement('style');
  style.id='sunblissCustomerEditorMobileReferenceStyles';
  style.textContent=[
    '@media(max-width:1023px){',
    'body.crm-customer-editor-open{overflow:hidden!important;overscroll-behavior:none!important}',
    'body.crm-customer-editor-open #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
    'body.crm-customer-editor-open>.tabs,body.crm-customer-editor-open #sunblissPersistentBackDock,body.crm-customer-editor-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
    'body.crm-customer-editor-open>#customerEditPanel{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30020!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;min-height:0!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scroll-padding-bottom:150px!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.section-label,body.crm-customer-editor-open>#customerEditPanel>.stat-sub{display:none!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.crm-customer-editor-head{display:flex!important;align-items:center;gap:15px;flex-shrink:0;margin:0 0 22px;color:var(--ink,#102333)}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-back{display:inline-flex;align-items:center;justify-content:center;flex:none;width:30px;height:42px;padding:0;border:0;background:transparent;color:var(--ink,#102333);cursor:pointer}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-title{margin:0!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-weight:700!important;font-size:24px!important;line-height:1.25!important;letter-spacing:-.025em!important;color:var(--ink,#102333)!important}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card{width:100%;min-width:0;flex-shrink:0;margin:0;padding:18px 15px 21px;border:1px solid var(--paper-line,#ded7c8);border-radius:14px;background:transparent;box-shadow:none;box-sizing:border-box}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card .brand-field{display:block!important;min-width:0!important;margin:0 0 18px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:1.4!important;color:var(--ink,#102333)!important}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card .brand-field:last-child{margin-bottom:0!important}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card .brand-field input{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;margin:7px 0 0!important;padding:10px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:8px!important;background:var(--paper-dim,#efe9d9)!important;color:var(--ink,#102333)!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:1.25!important;letter-spacing:normal!important;box-shadow:none!important;box-sizing:border-box!important}',
    'body.crm-customer-editor-open>#customerEditPanel .crm-customer-editor-card .brand-field input:focus-visible{outline:2px solid var(--gold,#c6972e)!important;outline-offset:2px!important}',
    'body.crm-customer-editor-open>#customerEditPanel #customerEditError{flex-shrink:0;font-size:13px!important;line-height:1.4!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.crm-customer-editor-actions{position:sticky!important;z-index:9!important;bottom:calc(-14px - env(safe-area-inset-bottom))!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:10px!important;flex-shrink:0!important;width:auto!important;min-height:0!important;margin:auto -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line,#ded7c8)!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.crm-customer-editor-actions>button{flex:1 1 0%!important;min-width:0!important;width:auto!important;min-height:48px!important;height:auto!important;margin:0!important;padding:10px 9px!important;border-radius:999px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:15px!important;font-weight:600!important;line-height:1.3!important;white-space:nowrap!important;justify-content:center!important;box-shadow:none!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.crm-customer-editor-actions>#ceSave{background:var(--gold,#c6972e)!important;color:var(--ink,#102333)!important;border:1px solid var(--gold,#c6972e)!important}',
    'body.crm-customer-editor-open>#customerEditPanel>.crm-customer-editor-actions>#ceCancel{background:var(--paper-dim,#efe9d9)!important;color:var(--ink,#102333)!important;border:1px solid var(--paper-line,#ded7c8)!important}',
    '}',
    '@media(min-width:1024px){#customerEditPanel .crm-customer-editor-head{display:none!important}}',
    '@media(prefers-reduced-motion:reduce){#customerEditPanel{animation:none!important;transition:none!important}}'
  ].join('');
  document.head.appendChild(style);

  var queued=false;
  function decorate(panel){
    if(panel.getAttribute('data-crm-customer-mobile')==='1')return;
    var actions=panel.querySelector('.brand-editor-actions');
    if(!actions)return;
    var labels=Array.prototype.slice.call(panel.children).filter(function(el){return el.matches&&el.matches('label.brand-field');});
    if(!labels.length)return;
    var head=document.createElement('div');
    head.className='crm-customer-editor-head';
    head.innerHTML='<button type="button" class="crm-customer-editor-back" aria-label="Back to customer"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="crm-customer-editor-title">Edit Customer</h2>';
    var title=panel.querySelector('.section-label');
    if(title)panel.insertBefore(head,title);
    else panel.insertBefore(head,panel.firstChild);
    var back=head.querySelector('button');
    if(back)back.addEventListener('click',function(){panel.remove();});
    var card=document.createElement('div');
    card.className='crm-customer-editor-card';
    labels.forEach(function(label){card.appendChild(label);});
    panel.insertBefore(card,actions);
    actions.classList.add('crm-customer-editor-actions');
    panel.setAttribute('data-crm-customer-mobile','1');
  }
  function restore(panel){
    if(panel.getAttribute('data-crm-customer-mobile')!=='1')return;
    var card=panel.querySelector('.crm-customer-editor-card');
    var actions=panel.querySelector('.crm-customer-editor-actions');
    if(card&&actions){
      while(card.firstChild)panel.insertBefore(card.firstChild,actions);
      card.remove();
    }
    var head=panel.querySelector('.crm-customer-editor-head');
    if(head)head.remove();
    if(actions)actions.classList.remove('crm-customer-editor-actions');
    panel.removeAttribute('data-crm-customer-mobile');
  }
  function refresh(){
    queued=false;
    if(!document.body)return;
    var panel=document.getElementById('customerEditPanel');
    var isMobile=mobile();
    if(panel){
      var owner=panel.getAttribute('data-crm-customer-unit');
      var unit=window.state&&window.state.selectedUnit;
      var view=window.state&&window.state.view;
      if((owner&&unit&&owner!==String(unit))||(view&&view!=='detail')){
        panel.remove();panel=null;
      }else if(unit&&!owner){
        panel.setAttribute('data-crm-customer-unit',String(unit));
      }
    }
    if(panel&&isMobile){
      decorate(panel);
      if(panel.parentNode!==document.body)document.body.appendChild(panel);
    }else if(panel){
      if(panel.parentNode===document.body){
        var action=document.getElementById('btnEditCustomer');
        if(action&&action.parentNode)action.insertAdjacentElement('afterend',panel);
      }
      restore(panel);
    }
    document.body.classList.toggle('crm-customer-editor-open',!!panel&&isMobile);
  }
  function schedule(){if(queued)return;queued=true;window.requestAnimationFrame(refresh);}
  function relevant(node){return !!(node&&node.nodeType===1&&(node.id==='customerEditPanel'||(node.querySelector&&node.querySelector('#customerEditPanel'))));}
  if(window.MutationObserver){
    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type!=='childList')continue;
        for(var j=0;j<m.addedNodes.length;j++)if(relevant(m.addedNodes[j])){schedule();return;}
        for(var k=0;k<m.removedNodes.length;k++)if(relevant(m.removedNodes[k])){schedule();return;}
      }
    }).observe(document.documentElement,{subtree:true,childList:true});
  }
  document.addEventListener('click',function(){setTimeout(schedule,0);},true);
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  refresh();
})();