(function(){
  'use strict';

  if (window.__sunblissGlobalDetailNavigationStabilityInstalled) return;
  window.__sunblissGlobalDetailNavigationStabilityInstalled = true;

  var repairing = false;
  var rendering = false;
  var verifyScheduled = false;

  function text(value){ return value == null ? '' : String(value); }
  function norm(value){ return text(value).trim().toLowerCase().replace(/\s+/g,' '); }

  function closeSearch(){
    window.__sunblissDockSearchOpen = false;
    var panel = document.getElementById('sunblissDockSearchPanel');
    if (panel) panel.classList.remove('is-open');
    var input = document.getElementById('dockPersistentSearchInput');
    if (input && typeof input.blur === 'function') input.blur();
    document.querySelectorAll('.tabs .dock-search').forEach(function(button){button.setAttribute('aria-expanded','false');});
    var people = document.getElementById('sunblissPeopleSearchResults');
    if (people) people.classList.remove('is-visible');
  }

  function currentMain(){
    var main = document.getElementById('main');
    if (main && window.mainEl !== main) window.mainEl = main;
    return main;
  }

  function snapshotNavigation(){
    if (!window.state) return null;
    return {view:state.view,selectedUnit:state.selectedUnit,detailFrom:state.detailFrom,search:state.search};
  }
  function restoreNavigation(snapshot){
    if (!snapshot || !window.state) return;
    state.view=snapshot.view;
    state.selectedUnit=snapshot.selectedUnit;
    state.detailFrom=snapshot.detailFrom;
    state.search=snapshot.search;
  }

  function repairShell(){
    var existing=currentMain();
    if (existing) return existing;
    if (repairing || !window.state || !state.userRole || typeof window.render !== 'function') return null;
    repairing=true;
    var nav=snapshotNavigation();
    try{window.render();restoreNavigation(nav);}catch(err){console.error('Could not repair CRM shell before detail navigation',err);}finally{repairing=false;}
    return currentMain();
  }

  function activeCustomers(){return window.state && Array.isArray(state.dues) ? state.dues.filter(Boolean) : [];}
  function rowCustomerName(source){
    if (!source || !source.querySelector) return '';
    var el=source.querySelector('.row-name,.tx-towards,.monthly-sale-customer,.customer-name');
    return el ? norm(el.textContent) : '';
  }
  function resolveCustomer(unit,sno,source){
    var rows=activeCustomers();
    if (!rows.length) return null;
    var unitKey=norm(unit), idKey=text(sno).trim();
    var exact=rows.filter(function(c){return text(c.sno).trim()===idKey && norm(c.unit)===unitKey;});
    if (exact.length===1) return exact[0];
    var byId=idKey ? rows.filter(function(c){ return text(c.sno).trim()===idKey; }) : [];
    if (byId.length===1) return byId[0];
    var byUnit=unitKey ? rows.filter(function(c){ return norm(c.unit)===unitKey; }) : [];
    if (byUnit.length===1) return byUnit[0];
    if (byUnit.length>1){
      var visibleName=rowCustomerName(source);
      if (visibleName){
        var byName=byUnit.filter(function(c){ return norm(c.name)===visibleName; });
        if (byName.length===1) return byName[0];
      }
    }
    return null;
  }

  function inferFrom(source,explicit){
    var value=text(explicit || (source && source.getAttribute && source.getAttribute('data-from')) || '').trim();
    if (value) return value;
    if (!window.state) return 'list';
    if (state.view==='list') return 'list';
    if (state.view==='overview') return 'overview';
    if (state.view==='insights') return 'insights';
    return state.detailFrom || 'list';
  }
  function customerKey(customer){return text(customer.unit)+'::'+text(customer.sno);}
  function selectedCustomerIsValid(){
    if (!window.state || state.view!=='detail' || !state.selectedUnit) return false;
    var key=text(state.selectedUnit);
    return activeCustomers().some(function(c){ return customerKey(c)===key; });
  }

  function renderCurrentDetail(){
    var main=currentMain() || repairShell();
    if (!main) return false;
    window.mainEl=main;
    closeSearch();
    if (rendering) return !!document.querySelector('#main .detail');
    rendering=true;
    try{
      if (typeof window.renderMain==='function') window.renderMain();
      else if (typeof window.renderDetail==='function') window.renderDetail();
    }finally{rendering=false;}
    return !!document.querySelector('#main .detail');
  }

  function openCustomer(customer,from){
    if (!customer || !window.state) return false;
    closeSearch();
    var main=currentMain() || repairShell();
    if (!main) return false;
    state.selectedUnit=customerKey(customer);
    state.detailFrom=from || 'list';
    state.revealedFields={};
    state.view='detail';
    window.mainEl=main;
    renderCurrentDetail();
    if (!document.querySelector('#main .detail') || !selectedCustomerIsValid()){
      var repaired=repairShell();
      if (repaired){
        window.mainEl=repaired;
        state.selectedUnit=customerKey(customer);
        state.detailFrom=from || 'list';
        state.view='detail';
        renderCurrentDetail();
      }
    }
    if (typeof window.scrollTo==='function') window.scrollTo(0,0);
    return !!document.querySelector('#main .detail');
  }

  function canonicalGoToDetail(unit,sno,from,source){
    var customer=resolveCustomer(unit,sno,source);
    if (!customer) return false;
    return openCustomer(customer,inferFrom(source,from));
  }

  function wrapRender(name,closeBefore){
    var original=window[name];
    if (typeof original!=='function' || original.__sunblissGlobalStableRender) return;
    function stableRenderer(){
      if (closeBefore) closeSearch();
      var main=currentMain() || repairShell();
      if (!main) return;
      window.mainEl=main;
      return original.apply(this,arguments);
    }
    stableRenderer.__sunblissGlobalStableRender=true;
    stableRenderer.__sunblissOriginal=original;
    window[name]=stableRenderer;
  }
  function wrapGoToDetail(){
    var original=window.goToDetail;
    if (typeof original!=='function' || original.__sunblissGlobalStableDetailNav) return;
    function stableGoToDetail(unit,sno,from){
      if (canonicalGoToDetail(unit,sno,from,null)) return;
      closeSearch();
      var main=currentMain() || repairShell();
      if (!main) return;
      window.mainEl=main;
      return original.apply(this,arguments);
    }
    stableGoToDetail.__sunblissGlobalStableDetailNav=true;
    stableGoToDetail.__sunblissOriginal=original;
    window.goToDetail=stableGoToDetail;
  }

  function navigationTarget(event){
    if (!event.target || !event.target.closest) return null;
    /* Extension rows own their navigation completely. Never let this global
       interceptor participate in the same tap. */
    if (event.target.closest('[data-ext-unit],#paymentExtensionPanel,.ext-panel')) return null;
    var target=event.target.closest('[data-unit][data-sno]');
    if (!target) return null;
    if (target.closest('#sunblissCancelledArchivePage,[data-cancelled-id],.cancelled-archive-page')) return null;
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled')==='true') return null;
    return target;
  }

  document.addEventListener('click',function(event){
    if (event.defaultPrevented) return;
    var target=navigationTarget(event);
    if (!target) return;
    var customer=resolveCustomer(target.getAttribute('data-unit'),target.getAttribute('data-sno'),target);
    if (!customer) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openCustomer(customer,inferFrom(target,target.getAttribute('data-from')));
  },true);

  function verifyDetailState(){
    verifyScheduled=false;
    if (!window.state || state.view!=='detail' || !state.selectedUnit) return;
    if (!selectedCustomerIsValid()) return;
    var main=currentMain();
    var detail=main && main.querySelector('.detail');
    if (main && detail) return;
    renderCurrentDetail();
  }
  function scheduleVerify(){
    if (verifyScheduled) return;
    verifyScheduled=true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(verifyDetailState);
    else setTimeout(verifyDetailState,0);
  }
  function shellNeedsVerification(){
    if(!window.state||state.view!=='detail'||!state.selectedUnit)return false;
    var main=currentMain();
    return !main||!main.querySelector('.detail');
  }

  wrapRender('renderMain',false);
  wrapRender('renderDetail',true);
  wrapGoToDetail();

  if(window.MutationObserver)new MutationObserver(function(){if(shellNeedsVerification())scheduleVerify();}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',scheduleVerify);
  window.addEventListener('popstate',scheduleVerify);

  window.__sunblissOpenCustomerDetail=function(unit,sno,from){return canonicalGoToDetail(unit,sno,from,null);};
  window.__sunblissResolveCustomerDetailTarget=resolveCustomer;
  scheduleVerify();
})();