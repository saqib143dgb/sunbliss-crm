(function(){
  'use strict';

  if (window.__sunblissBottomNavInstalled) return;
  window.__sunblissBottomNavInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissBottomNavStyle';
  style.textContent = [
    '#app{padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;}',
    '.tabs{position:fixed!important;left:50%!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;width:min(600px,calc(100vw - 20px))!important;z-index:1200!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;margin:0!important;padding:7px!important;background:rgba(246,241,228,.84)!important;border:1px solid rgba(255,255,255,.72)!important;border-radius:999px!important;box-shadow:0 10px 30px rgba(15,26,38,.24),inset 0 1px 0 rgba(255,255,255,.72)!important;-webkit-backdrop-filter:blur(20px) saturate(1.18);backdrop-filter:blur(20px) saturate(1.18);}',
    '.tabs[data-dock-mode="crm"]{grid-template-columns:repeat(5,minmax(0,1fr))!important;}',
    '.tabs .tab{position:relative!important;min-width:0!important;min-height:58px!important;padding:6px 5px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:var(--ink-2)!important;font-family:Inter,system-ui,sans-serif!important;font-size:10px!important;font-weight:600!important;line-height:1!important;letter-spacing:0!important;text-transform:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;transition:background .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease!important;}',
    '.tabs .tab[data-view="overview"]{order:1}.tabs .tab[data-view="insights"]{order:2}.tabs .dock-add{order:3}.tabs .dock-search{order:4}.tabs .tab[data-view="list"]{order:5}',
    '.tabs .tab::before{content:"";display:block;width:25px;height:25px;flex:none;background:currentColor;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-size:contain;mask-position:center;mask-repeat:no-repeat;mask-size:contain;}',
    '.tabs .tab[data-view="overview"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M12%203%202.5%2011h2v10h6v-6h3v6h6V11h2z%22/%3E%3C/svg%3E");}',
    '.tabs .tab[data-view="insights"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M3%2021h18v-2H5V3H3v18zm4-4h3V9H7v8zm5%200h3V5h-3v12zm5%200h3v-6h-3v6z%22/%3E%3C/svg%3E");}',
    '.tabs .tab[data-view="list"]::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%203h16v18h-6v-5h-4v5H4V3zm3%203v2h2V6H7zm4%200v2h2V6h-2zm4%200v2h2V6h-2zM7%2010v2h2v-2H7zm4%200v2h2v-2h-2zm4%200v2h2v-2h-2z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M4%203h16v18h-6v-5h-4v5H4V3zm3%203v2h2V6H7zm4%200v2h2V6h-2zm4%200v2h2V6h-2zM7%2010v2h2v-2H7zm4%200v2h2v-2h-2zm4%200v2h2v-2h-2z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-search::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M10.8%203a7.8%207.8%200%201%200%204.86%2013.9L21%2022l1-1-5.1-5.34A7.8%207.8%200%200%200%2010.8%203zm0%202a5.8%205.8%200%201%201%200%2011.6%205.8%205.8%200%200%201%200-11.6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M10.8%203a7.8%207.8%200%201%200%204.86%2013.9L21%2022l1-1-5.1-5.34A7.8%207.8%200%200%200%2010.8%203zm0%202a5.8%205.8%200%201%201%200%2011.6%205.8%205.8%200%200%201%200-11.6z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-add{background:var(--gold)!important;color:var(--ink-2)!important;box-shadow:0 5px 14px rgba(143,106,30,.24)!important;}',
    '.tabs .dock-add::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M11%205h2v6h6v2h-6v6h-2v-6H5v-2h6z%22/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M11%205h2v6h6v2h-6v6h-2v-6H5v-2h6z%22/%3E%3C/svg%3E");}',
    '.tabs .dock-add:hover{background:#d6a63e!important;}',
    '.tabs .tab:hover{background:rgba(15,26,38,.055)!important;}',
    '.tabs .tab:active{transform:scale(.98)!important;}',
    '.tabs .tab[aria-pressed="true"]{background:rgba(15,26,38,.105)!important;color:var(--ink-2)!important;box-shadow:inset 0 0 0 1px rgba(15,26,38,.055),0 3px 12px rgba(15,26,38,.08)!important;}',
    '.tabs .tab[aria-pressed="true"]::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:var(--gold);top:9px;left:calc(50% + 13px);box-shadow:0 0 0 2px rgba(246,241,228,.92);}',
    '.tabs .tab:focus-visible{outline:2px solid var(--gold-deep)!important;outline-offset:2px!important;}',
    '@media(max-width:420px){#app{padding-bottom:calc(106px + env(safe-area-inset-bottom))!important}.tabs{width:calc(100vw - 16px)!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;padding:6px!important;gap:2px!important}.tabs .tab{min-height:56px!important;font-size:9.25px!important;padding-left:3px!important;padding-right:3px!important}.tabs .tab::before{width:23px;height:23px}.tabs .dock-add{font-size:9px!important}}'
  ].join('');
  document.head.appendChild(style);

  function isCrmOfficer(){
    if (window.state && window.state.userRole) return window.state.userRole === 'crm_officer';
    if (document.getElementById('btnAddCustomer')) window.__sunblissCanAddCustomer = true;
    return window.__sunblissCanAddCustomer === true;
  }

  function openUnits(){
    var input = document.getElementById('searchInput');
    if (input) return true;
    var listTab = document.querySelector('.tabs .tab[data-view="list"]');
    if (!listTab) return false;
    listTab.click();
    return true;
  }

  function focusUnitsSearch(){
    openUnits();
    var input = document.getElementById('searchInput');
    if (input){
      input.focus();
      if (typeof input.select === 'function') input.select();
      if (typeof input.scrollIntoView === 'function') input.scrollIntoView({block:'center',behavior:'smooth'});
      return;
    }
    window.setTimeout(function(){
      var delayed = document.getElementById('searchInput');
      if (delayed){ delayed.focus(); if (typeof delayed.select === 'function') delayed.select(); }
    },30);
  }

  function openAddCustomer(){
    if (!isCrmOfficer()) return;
    openUnits();
    var add = document.getElementById('btnAddCustomer');
    if (add){ add.click(); return; }
    window.setTimeout(function(){
      var delayed = document.getElementById('btnAddCustomer');
      if (delayed) delayed.click();
    },30);
  }

  function makeAction(className,label,ariaLabel,handler){
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab dock-action ' + className;
    button.textContent = label;
    button.setAttribute('aria-label',ariaLabel);
    button.setAttribute('title',ariaLabel);
    button.addEventListener('click',handler);
    return button;
  }

  function decorateDock(tabs){
    if (!tabs) return;
    var crm = isCrmOfficer();
    tabs.setAttribute('data-dock-mode',crm ? 'crm' : 'standard');

    var search = tabs.querySelector('.dock-search');
    if (!search){
      search = makeAction('dock-search','Search','Search units or customers',focusUnitsSearch);
      tabs.appendChild(search);
    }

    var add = tabs.querySelector('.dock-add');
    if (crm && !add){
      add = makeAction('dock-add','Add','Add new customer',openAddCustomer);
      tabs.appendChild(add);
    } else if (!crm && add){
      add.remove();
    }
  }

  function decorateAll(){
    document.querySelectorAll('.tabs').forEach(decorateDock);
  }

  decorateAll();

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      observer.disconnect();
      try { decorateAll(); }
      finally { observer.observe(app,{childList:true,subtree:true}); }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
})();
