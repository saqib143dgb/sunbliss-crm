(function(){
'use strict';
if(window.__sunblissRenderReadiness)return;window.__sunblissRenderReadiness=true;
var generation=0,depth=0,token=0,pending=0,changedAt=0,timer=null,started=0,route='',error=null,preparedGeneration=0;
var root=document.documentElement;
var style=document.createElement('style');style.textContent=`
html.sbx-loading:not(.sbx-booting) #sbxLoader{background:rgba(246,241,228,.96)}
html.sbx-loading:not(.sbx-booting) #app #main{opacity:0!important;transform:none!important;filter:none!important;transition:none!important}
html.sbx-motion #app #main{transform:none!important;filter:none!important;transition:opacity .12s ease!important;will-change:auto!important}
.crm-readiness-error{padding:14px;margin:12px 0;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper);font:500 13px/1.5 Inter,sans-serif}.crm-readiness-error button{margin-left:10px}
`;document.head.appendChild(style);
function signature(){return window.state?[state.view,state.selectedUnit,state.insightsMode,state.listMode].join('|'):''}
function motion(){return window.__sunblissMotion}
function begin(force){
 var sig=signature();if(!force&&!started&&sig===route)return 0;if(!started||sig!==route){generation++;started=Date.now();route=sig;pending=0;error=null;token=motion()?motion().begin('Loading CRM'):0;}
 window.__sunblissViewPreparing=true;changedAt=Date.now();schedule();return generation;
}
function schedule(){clearTimeout(timer);timer=setTimeout(check,40)}
function check(){
 if(!started)return;
 if(signature()!==route){prepare(begin());return;}
 if(Date.now()-started>25000){error=error||Error('This view is taking longer than expected. Please retry.');pending=0;finish();return;}
 if(pending||loadingEditor()){schedule();return;}
 var gen=generation;requestAnimationFrame(function(){requestAnimationFrame(function(){if(gen!==generation)return;if(!pending)finish();else schedule()})});
}
function finish(){
 if(!started)return;var err=error;started=0;window.__sunblissViewPreparing=false;clearTimeout(timer);
 if(motion())motion().finish(token);
 if(err){var main=document.getElementById('main');if(main&&!main.querySelector('.crm-readiness-error')){var box=document.createElement('div');box.className='crm-readiness-error';box.setAttribute('role','alert');box.textContent='Some details could not load. ';var b=document.createElement('button');b.className='btn-paper';b.textContent='Retry';b.onclick=function(){box.remove();route='';if(window.__sunblissCustomerWorkspace&&state.selectedUnit)window.__sunblissCustomerWorkspace.invalidate(Number(state.selectedUnit.split('::')[1]));window.renderMain()};box.appendChild(b);main.prepend(box);}}
}
function watch(p,gen){pending++;Promise.resolve(p).catch(function(e){if(gen===generation)error=e}).finally(function(){if(gen!==generation)return;pending=Math.max(0,pending-1);changedAt=Date.now();schedule()})}
function prepare(gen){
 if(!window.state||!gen||preparedGeneration===gen)return;preparedGeneration=gen;
 if(state.view==='detail'){
  if(window.__sunblissCustomerWorkspace)watch(window.__sunblissCustomerWorkspace.prepare(false),gen);
  if(window.__sunblissEnsureEffectiveAction)watch(window.__sunblissEnsureEffectiveAction(),gen);
 }
 if(state.view==='overview'&&window.__sunblissEnsureFinancialReady)watch(window.__sunblissEnsureFinancialReady(),gen);
 if(state.view==='overview'&&window.__sunblissEnsureScheduledActions)watch(window.__sunblissEnsureScheduledActions(),gen);
}
function wrap(name){var base=window[name];if(typeof base!=='function'||base.__crmReadiness)return;var wrapped=function(){var outer=depth===0,gen;if(outer)gen=begin();depth++;try{return base.apply(this,arguments)}finally{depth--;if(outer){if(signature()!==route)gen=begin();if(gen){prepare(gen);changedAt=Date.now();schedule()}else if(state.view==='detail'&&window.__sunblissCustomerWorkspace){window.__sunblissCustomerWorkspace.prepare(false).catch(function(e){console.warn('Customer details refresh failed',e)})}}}};wrapped.__crmReadiness=true;window[name]=wrapped}
['render','renderMain','renderDetail','renderOverview','renderList','renderInsights'].forEach(wrap);
// User actions retain loading feedback; opening/closing the three-dot menu is local.
window.__sunblissBeginRenderInteraction=function(){return begin(true)};
function loadingEditor(){return Array.from(document.querySelectorAll('.brand-editor,.crm-full-page-inline,[role="dialog"],#scheduledActionPanel,#paymentExtensionPanel')).some(function(p){if(!p.isConnected||p.hidden)return false;return p.classList.contains('crm-action-awaiting-ready')||p.getAttribute('aria-busy')==='true'||/^(loading|preparing|opening)\b/i.test((p.querySelector('.stat-sub,.record-payment-empty')?.textContent||'').trim())||Array.from(p.querySelectorAll('button:disabled')).some(function(b){return /saving|recording|creating|updating/i.test(b.textContent)})})}

window.addEventListener('pagehide',function(){generation++;pending=0;started=0;route='';window.__sunblissViewPreparing=false;clearTimeout(timer)});
})();
