(function(){
'use strict';
var mode=window.__crmTestMode;if(!mode)return;
var bar=null,busy=false,scheduled=false;
function authorized(){return window.state&&['crm_officer','manager'].includes(state.userRole);}
function styles(){if(document.getElementById('crmTestModeStyles'))return;var s=document.createElement('style');s.id='crmTestModeStyles';s.textContent=`
#crmTestModeBar{position:sticky;top:0;z-index:12000;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 20px;background:#f5f0e4;border-bottom:1px solid #d9d0bb;color:#172a36;font:13px/1.4 Inter,system-ui,sans-serif;box-sizing:border-box}
#crmTestModeBar[hidden],#crmTestModeBar button[hidden]{display:none!important}#crmTestModeBar[data-test="true"]{background:#fff1ca;border-bottom:2px solid #b68a2d}
#crmTestModeBar .mode-copy{min-width:0}#crmTestModeBar strong{display:block;font-size:13px;letter-spacing:.04em}#crmTestModeBar small{display:block;font-size:12px;color:#645a45}
#crmTestModeBar .mode-actions{display:flex;gap:7px;flex-wrap:wrap;flex-shrink:0}#crmTestModeBar button{padding:7px 13px;min-height:36px;border:1px solid #b3a584;border-radius:999px;background:#fffaf0;color:#172a36;font:600 12px Inter,system-ui,sans-serif;cursor:pointer}
#crmTestModeBar button:focus-visible{outline:3px solid #9a751f;outline-offset:2px}#crmTestModeBar button:disabled{opacity:.6;cursor:wait}#crmTestModeBar #crmExitTest{background:#172a36;border-color:#172a36;color:#fff}
#crmTestModeError{color:#a32c25!important;max-width:560px;overflow-wrap:anywhere}
@media(max-width:600px){#crmTestModeBar{padding:8px 12px;gap:7px;flex-wrap:wrap}#crmTestModeBar[data-test="true"] .mode-actions{width:100%;display:grid;grid-template-columns:1fr 1fr 1fr}#crmTestModeBar button{padding:7px 10px;min-height:38px}#crmTestModeBar small{font-size:11px}}
@media print{#crmTestModeBar{display:none!important}html[data-crm-mode="test"] body:after{content:'TEST ONLY — NOT VALID';position:fixed;top:40%;left:8%;font-size:36px;font-weight:bold;color:#a97921;opacity:.25;transform:rotate(-25deg);z-index:99999;pointer-events:none}}
`;document.head.appendChild(s);}
function error(message){var el=document.getElementById('crmTestModeError');if(el)el.textContent=message||'';}
async function prepare(reset){
 if(busy)return;busy=true;error('');bar.querySelectorAll('button').forEach(function(b){b.disabled=true;});
 try{var r=await sb.schema('crm_test').rpc('prepare_test_workspace',{p_reset:!!reset});if(r.error)throw r.error;
 mode.switchTo(true);
 }catch(e){error(e.message||'Test Mode could not open. Please try again.');busy=false;bar.querySelectorAll('button').forEach(function(b){b.disabled=false;});}
}
function demo(){var c=(state.dues||[]).find(function(x){return x.unit==='TEST-001';});if(!c){error('Demo customer is unavailable. Reset Test Mode to restore it.');return;}state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom=state.view;state.view='detail';render();window.scrollTo({top:0,behavior:'auto'});}
function mount(){
 styles();if(!bar){bar=document.createElement('aside');bar.id='crmTestModeBar';bar.setAttribute('aria-label','CRM workspace');bar.dataset.test=String(mode.active);document.body.prepend(bar);
 bar.innerHTML=mode.active?'<div class="mode-copy"><strong>TEST MODE · Practice only</strong><small>Shared demo workspace. Live records are separate.</small><small id="crmTestModeError" role="status"></small></div><div class="mode-actions"><button id="crmOpenDemo" type="button">Open Demo</button><button id="crmResetTest" type="button">Reset Demo</button><button id="crmExitTest" type="button">Exit Test Mode</button></div>':'<div class="mode-copy"><strong>Live CRM</strong><small id="crmTestModeError" role="status"></small></div><div class="mode-actions"><button id="crmEnterTest" type="button">Open Test Mode</button></div>';
 if(mode.active){document.getElementById('crmOpenDemo').onclick=demo;document.getElementById('crmResetTest').onclick=function(){if(confirm('Reset Test Mode for everyone? This clears all demo bookings, payments, tasks and history, then restores TEST-001. Live records are not changed.'))prepare(true);};document.getElementById('crmExitTest').onclick=function(){mode.switchTo(false);};}
 else document.getElementById('crmEnterTest').onclick=function(){prepare(false);};
 }
 bar.hidden=!mode.active&&!authorized();
 if(mode.active){document.getElementById('crmOpenDemo').hidden=!authorized();document.getElementById('crmResetTest').hidden=!authorized()||state.userRole!=='crm_officer';}
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;mount();});}
mount();var observer=new MutationObserver(function(records){if(records.some(function(r){return !bar||!bar.contains(r.target);}))queue();});observer.observe(document.body,{childList:true,subtree:true});
})();
