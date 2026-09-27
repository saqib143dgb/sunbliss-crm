(function(){
'use strict';
if(window.__sunblissRenderReadiness)return;window.__sunblissRenderReadiness=true;
var generation=0,depth=0,token=0,pending=0,changedAt=0,timer=null,started=0,route='',error=null;
var root=document.documentElement;
var style=document.createElement('style');style.textContent=`
html.sbx-loading:not(.sbx-booting) #sbxLoader{background:rgba(246,241,228,.96)}
html.sbx-loading:not(.sbx-booting) #app #main{opacity:0!important;transform:none!important;filter:none!important;transition:none!important}
html.sbx-motion #app #main{transform:none!important;filter:none!important;transition:opacity .12s ease!important;will-change:auto!important}
.crm-readiness-error{padding:14px;margin:12px 0;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper);font:500 13px/1.5 Inter,sans-serif}.crm-readiness-error button{margin-left:10px}
`;document.head.appendChild(style);
function signature(){return window.state?[state.view,state.selectedUnit,state.insightsMode,state.listMode].join('|'):''}
function motion(){return window.__sunblissMotion}
function begin(){
 var sig=signature();if(!started||sig!==route){generation++;started=Date.now();route=sig;pending=0;error=null;token=motion()?motion().begin('Loading CRM'):0;}
 window.__sunblissViewPreparing=true;changedAt=Date.now();schedule();return generation;
}
function schedule(){clearTimeout(timer);timer=setTimeout(check,40)}
function loadingEditor(){
 return Array.from(document.querySelectorAll('.brand-editor,.crm-full-page-inline,[role="dialog"],#scheduledActionPanel,#paymentExtensionPanel')).some(function(p){
  if(!p.isConnected||p.hidden)return false;
  return p.classList.contains('crm-action-awaiting-ready')||p.getAttribute('aria-busy')==='true'||/^(loading|preparing|opening)\b/i.test((p.querySelector('.stat-sub,.record-payment-empty')?.textContent||'').trim())||Array.from(p.querySelectorAll('button:disabled')).some(function(b){return /saving|recording|creating|updating/i.test(b.textContent)});
 });
}
function check(){
 if(!started)return;
 if(signature()!==route){begin();return;}
 if(Date.now()-started>25000){error=error||Error('This view is taking longer than expected. Please retry.');pending=0;finish();return;}
 if(pending||loadingEditor()||Date.now()-changedAt<110){schedule();return;}
 requestAnimationFrame(function(){requestAnimationFrame(function(){if(!pending&&Date.now()-changedAt>=110)finish();else schedule()})});
}
function finish(){
 if(!started)return;var err=error;started=0;window.__sunblissViewPreparing=false;clearTimeout(timer);
 if(window.state&&state.view==='overview'&&window.__sunblissCompleteOverviewKpis)window.__sunblissCompleteOverviewKpis();
 if(motion())motion().finish(token);
 if(err){var main=document.getElementById('main');if(main&&!main.querySelector('.crm-readiness-error')){var box=document.createElement('div');box.className='crm-readiness-error';box.setAttribute('role','alert');box.textContent='Some details could not load. ';var b=document.createElement('button');b.className='btn-paper';b.textContent='Retry';b.onclick=function(){box.remove();if(window.__sunblissCustomerWorkspace&&state.selectedUnit)window.__sunblissCustomerWorkspace.invalidate(Number(state.selectedUnit.split('::')[1]));window.renderMain()};box.appendChild(b);main.prepend(box);}}
}
function watch(p,gen){pending++;Promise.resolve(p).catch(function(e){if(gen===generation)error=e}).finally(function(){if(gen!==generation)return;pending=Math.max(0,pending-1);changedAt=Date.now();schedule()})}
function prepare(gen){
 if(!window.state)return;
 if(state.view==='detail'){
  if(window.__sunblissCustomerWorkspace)watch(window.__sunblissCustomerWorkspace.prepare(false),gen);
  if(window.__sunblissEnsureEffectiveAction)watch(window.__sunblissEnsureEffectiveAction(),gen);
 }
 if(state.view==='overview'&&window.__sunblissEnsureFinancialReady)watch(window.__sunblissEnsureFinancialReady(),gen);
 if(state.view==='detail'||state.view==='overview'){
  if(window.__sunblissEnsureScheduledActions)watch(Promise.resolve(window.__sunblissEnsureAutomaticActions&&window.__sunblissEnsureAutomaticActions()).then(function(){if(gen===generation)return window.__sunblissEnsureScheduledActions()}),gen);
  var P=window.PaymentExtensionsCore;if(P)watch(P.load(false).then(function(){P.render()}),gen);
 }
}
function wrap(name){var base=window[name];if(typeof base!=='function'||base.__crmReadiness)return;var wrapped=function(){var outer=depth===0,gen;if(outer)gen=begin();depth++;try{return base.apply(this,arguments)}finally{depth--;if(outer){route=signature();prepare(gen);changedAt=Date.now();schedule()}}};wrapped.__crmReadiness=true;window[name]=wrapped}
['render','renderMain','renderDetail','renderOverview','renderList','renderInsights'].forEach(wrap);
// Editors, filters, and action buttons use the same logo; simple text entry never blocks typing.
window.__sunblissBeginRenderInteraction=begin;
document.addEventListener('change',function(e){if(e.target.matches('select')&&!e.target.closest('form,.brand-editor,[role="dialog"]'))begin()},true);
var observer=new MutationObserver(function(ms){if(!started)return;if(ms.some(function(m){return m.target.closest&&m.target.closest('#main,.brand-editor,[role="dialog"],#scheduledActionPanel,#paymentExtensionPanel')})){changedAt=Date.now();schedule()}});observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pagehide',function(){generation++;pending=0;started=0;clearTimeout(timer)});
})();
