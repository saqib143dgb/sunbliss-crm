(function(){
  'use strict';
  if(window.__sunblissUnitEditorMobileReferenceInstalled)return;
  window.__sunblissUnitEditorMobileReferenceInstalled=true;
  // UI only: original unit field inputs, update RPC, permissions and validations
  // remain owned by unit_editor_patch.js.
  var style=document.createElement('style');
  style.id='sunblissUnitEditorMobileReferenceStyles';
  style.textContent=[
    '.crm-unit-editor-head{display:none}',
    '@media(max-width:1023px){',
      'body.crm-unit-editor-open{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.crm-unit-editor-open #app>.topbar{visibility:hidden!important;pointer-events:none!important}',
      'body.crm-unit-editor-open>.tabs,body.crm-unit-editor-open #sunblissPersistentBackDock,body.crm-unit-editor-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
      'body.crm-unit-editor-open>#unitEditPanel,body.crm-unit-editor-open>#unitEditPanel.crm-full-page-inline{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30060!important;display:flex!important;flex-direction:column!important;gap:0!important;width:100%!important;max-width:100%!important;min-height:0!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;overflow:hidden!important;box-sizing:border-box!important;overscroll-behavior:contain!important}',
      'body.crm-unit-editor-open>#unitEditPanel[data-crm-unit-mobile="1"]>.section-label,body.crm-unit-editor-open>#unitEditPanel[data-crm-unit-mobile="1"]>.stat-sub{display:none!important}',
      'body.crm-unit-editor-open>#unitEditPanel>.crm-unit-editor-head{display:flex!important;align-items:center!important;gap:15px!important;flex:0 0 auto!important;position:relative!important;z-index:2!important;margin:0 0 22px!important;color:var(--ink,#102333)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-back{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:none!important;width:30px!important;height:42px!important;padding:0!important;border:0!important;background:transparent!important;color:var(--ink,#102333)!important;cursor:pointer!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-title{margin:0!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:24px!important;font-weight:700!important;line-height:1.25!important;letter-spacing:-.025em!important;color:var(--ink,#102333)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card{display:block!important;flex:1 1 auto!important;min-height:0!important;max-height:100%!important;width:100%!important;min-width:0!important;margin:0!important;padding:18px 15px 21px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-bottom:0!important;border-radius:14px 14px 0 0!important;background:transparent!important;box-shadow:none!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;scroll-padding-bottom:28px!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .unit-editor-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field{display:block!important;min-width:0!important;margin:0 0 18px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;font-weight:400!important;line-height:1.4!important;color:var(--muted,#66635c)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field:last-child{margin-bottom:0!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field :is(input,select){display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;margin:7px 0 0!important;padding:10px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:8px!important;background:var(--paper-dim,#efe9d9)!important;color:var(--ink,#102333)!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:1.25!important;letter-spacing:normal!important;box-shadow:none!important;box-sizing:border-box!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .brand-field :is(input,select):focus-visible{outline:2px solid var(--gold,#c6972e)!important;outline-offset:2px!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .unit-editor-note{margin:0 0 16px!important;padding:10px 11px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:11.5px!important;line-height:1.5!important;font-weight:400!important;color:var(--muted,#66635c)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card .unit-editor-protected{margin:2px 0 0!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:10.5px!important;line-height:1.45!important;font-weight:400!important;color:var(--muted,#66635c)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-card #unitEditError{margin:0 0 12px!important;font-size:12px!important;line-height:1.4!important}',
      'body.crm-unit-editor-open>#unitEditPanel>.crm-unit-editor-actions,body.crm-unit-editor-open>#unitEditPanel.crm-full-page-inline>.crm-unit-editor-actions{position:relative!important;bottom:auto!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:10px!important;flex:0 0 auto!important;width:auto!important;min-height:0!important;margin:0 -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line,#ded7c8)!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;z-index:9!important}',
      'body.crm-unit-editor-open>#unitEditPanel>.crm-unit-editor-actions>button,body.crm-unit-editor-open>#unitEditPanel.crm-full-page-inline>.crm-unit-editor-actions>button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;min-height:48px!important;height:auto!important;margin:0!important;padding:10px 9px!important;border-radius:999px!important;font-family:CRMInter,Inter,Arial,sans-serif!important;font-size:15px!important;font-weight:600!important;line-height:1.3!important;white-space:nowrap!important;box-shadow:none!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-actions #euSave{background:var(--gold,#c6972e)!important;border:1px solid var(--gold,#c6972e)!important;color:var(--ink,#102333)!important}',
      'body.crm-unit-editor-open>#unitEditPanel .crm-unit-editor-actions #euCancel{background:var(--paper-dim,#efe9d9)!important;border:1px solid var(--paper-line,#ded7c8)!important;color:var(--ink,#102333)!important}',
    '}',
    '@media(prefers-reduced-motion:reduce){#unitEditPanel{animation:none!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(style);

  var queued=false;
  function mobile(){
    return window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
  }
  function decorate(panel){
    if(panel.getAttribute('data-crm-unit-mobile')==='1')return;
    var actions=panel.querySelector('.brand-editor-actions');
    var grid=panel.querySelector('.unit-editor-grid');
    if(!actions||!grid)return;
    var head=document.createElement('div');
    head.className='crm-unit-editor-head';
    head.innerHTML='<button type="button" class="crm-unit-editor-back" aria-label="Back to customer"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="crm-unit-editor-title">Edit Unit</h2>';
    var title=panel.querySelector('.section-label');
    panel.insertBefore(head,title||panel.firstChild);
    var back=head.querySelector('button');
    if(back)back.addEventListener('click',function(){panel.remove();document.body.classList.remove('crm-unit-editor-open')});
    var card=document.createElement('div');
    card.className='crm-unit-editor-card';
    Array.prototype.slice.call(panel.children).forEach(function(el){
      if(el===head||el===actions||el.classList.contains('section-label')||el.classList.contains('stat-sub'))return;
      card.appendChild(el);
    });
    panel.insertBefore(card,actions);
    actions.classList.add('crm-unit-editor-actions');
    panel.setAttribute('data-crm-unit-mobile','1');
    if(!panel.hasAttribute('role'))panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
  }
  function restore(panel){
    if(panel.getAttribute('data-crm-unit-mobile')!=='1')return;
    var card=panel.querySelector('.crm-unit-editor-card');
    var actions=panel.querySelector('.crm-unit-editor-actions');
    if(card&&actions){
      while(card.firstChild)panel.insertBefore(card.firstChild,actions);
      card.remove();
    }
    var head=panel.querySelector('.crm-unit-editor-head');
    if(head)head.remove();
    if(actions)actions.classList.remove('crm-unit-editor-actions');
    panel.removeAttribute('data-crm-unit-mobile');
  }
  function returnToDetail(panel){
    var detail=document.querySelector('.detail');
    if(!detail)return;
    var badges=detail.querySelector('.badges');
    var type=detail.querySelector('.d-type');
    var anchor=(badges&&badges.parentNode===detail?badges:type);
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling);
    else detail.insertBefore(panel,detail.firstChild);
  }
  function refresh(){
    queued=false;
    if(!document.body)return;
    var panel=document.getElementById('unitEditPanel');
    var isMobile=mobile();
    if(panel){
      var owner=panel.getAttribute('data-crm-unit-owner');
      var unit=window.state&&window.state.selectedUnit;
      var view=window.state&&window.state.view;
      if((owner&&unit&&owner!==String(unit))||(view&&view!=='detail')){
        panel.remove();panel=null;
      }else if(unit&&!owner){
        panel.setAttribute('data-crm-unit-owner',String(unit));
      }
    }
    if(panel&&isMobile){
      if(panel.parentNode!==document.body)document.body.appendChild(panel);
      decorate(panel);
    }else if(panel){
      if(panel.parentNode===document.body)returnToDetail(panel);
      restore(panel);
    }
    document.body.classList.toggle('crm-unit-editor-open',!!panel&&isMobile);
  }
  function schedule(){if(queued)return;queued=true;window.requestAnimationFrame(refresh);}
  function relevant(node){
    return !!(node&&node.nodeType===1&&(node.id==='unitEditPanel'||(node.querySelector&&node.querySelector('#unitEditPanel'))));
  }
  if(window.MutationObserver){
    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        var m=mutations[i];
        if(m.type!=='childList')continue;
        if(m.target&&m.target.nodeType===1&&m.target.closest&&m.target.closest('#unitEditPanel')){schedule();return;}
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