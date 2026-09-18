(function(){
'use strict';
if(window.__sunblissPaymentPlanProgressCleanUiInstalled)return;
window.__sunblissPaymentPlanProgressCleanUiInstalled=true;

var uiState=window.__sunblissPaymentPlanProgressCleanUiState||{
  condition:'below',
  value:'',
  value2:'',
  moreOpen:false
};
window.__sunblissPaymentPlanProgressCleanUiState=uiState;
if(!/^(below|exact|above|between)$/.test(String(uiState.condition||'')))uiState.condition='below';

function text(v){return v==null?'':String(v);}
function num(v){var n=Number(v);return isFinite(n)?n:null;}
function pctValue(v){var n=num(v);return n!==null&&n>=0&&n<=100?n:null;}
function filterState(){
  var s=window.__sunblissConstructionCompletionFilterState;
  if(!s){
    s={plan:'all',status:'all',deadlineMode:'all',month:''};
    window.__sunblissConstructionCompletionFilterState=s;
  }
  if(!s.plan)s.plan='all';
  if(!s.status)s.status='all';
  if(!s.deadlineMode)s.deadlineMode='all';
  return s;
}
function paidFilterActive(){
  var a=pctValue(uiState.value);
  if(uiState.condition==='between')return a!==null&&pctValue(uiState.value2)!==null;
  return a!==null;
}
function paidMatches(_customer,entry){
  if(!paidFilterActive())return true;
  var p=entry&&num(entry.paidPct);
  if(p===null)return false;
  var a=pctValue(uiState.value);
  if(uiState.condition==='exact')return Math.abs(p-a)<=0.05;
  if(uiState.condition==='above')return p>a;
  if(uiState.condition==='between'){
    var b=pctValue(uiState.value2),lo=Math.min(a,b),hi=Math.max(a,b);
    return p>=lo&&p<=hi;
  }
  return p<a;
}
window.__sunblissPaymentPlanProgressExternalFilterActive=paidFilterActive;
window.__sunblissPaymentPlanProgressExternalMatches=paidMatches;

function planLabel(v){var n=Number(v);return n?String(n)+'/'+String(100-n):'All';}
function fmtPct(v){var n=pctValue(v);if(n===null)return '';return Math.abs(n-Math.round(n))<0.0001?String(Math.round(n)):String(Math.round(n*10)/10);}
function paidLabel(){
  if(!paidFilterActive())return '';
  var a=fmtPct(uiState.value);
  if(uiState.condition==='exact')return 'Paid = '+a+'%';
  if(uiState.condition==='above')return 'Paid > '+a+'%';
  if(uiState.condition==='between')return 'Paid '+a+'–'+fmtPct(uiState.value2)+'%';
  return 'Paid < '+a+'%';
}
function monthValue(offset){
  var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+(offset||0));
  var m=d.getMonth()+1;return d.getFullYear()+'-'+(m<10?'0'+m:m);
}
function monthLabel(v){
  if(!/^\d{4}-\d{2}$/.test(text(v)))return text(v);
  var p=text(v).split('-'),d=new Date(Number(p[0]),Number(p[1])-1,1);
  return d.toLocaleDateString(undefined,{month:'short',year:'numeric'});
}
function duePreset(){
  var s=filterState();
  if(s.deadlineMode!=='month')return 'any';
  if(s.month===monthValue(0))return 'this';
  if(s.month===monthValue(1))return 'next';
  return 'custom';
}
function baseFilterCount(){
  if(!window.state||!state.filters)return 0;
  var f=state.filters,n=0;
  if(f.payment&&f.payment!=='all')n++;
  ['spa','oqood','furniture','unitType','dld'].forEach(function(k){if(f[k])n++;});
  return n;
}
function primaryCount(){
  var s=filterState(),n=0;
  if(s.plan!=='all')n++;
  if(paidFilterActive())n++;
  if(s.status!=='all')n++;
  return n;
}
function moreCount(){
  var s=filterState();
  return baseFilterCount()+(s.deadlineMode==='month'?1:0);
}
function totalFilterCount(){return primaryCount()+moreCount();}

function chip(label,attr,value,pressed){
  return '<button type="button" class="chip sb-clean-chip" '+attr+'="'+value+'" aria-pressed="'+(pressed?'true':'false')+'">'+label+'</button>';
}
function setButtonText(button,label){
  if(!button)return;
  var changed=false;
  Array.prototype.forEach.call(button.childNodes,function(node){
    if(node.nodeType===3&&text(node.nodeValue).trim()){node.nodeValue=label;changed=true;}
  });
  if(!changed)button.appendChild(document.createTextNode(label));
  button.setAttribute('aria-label',label);
  button.setAttribute('title',label);
}
function installStyles(){
  if(document.getElementById('sbPaymentPlanProgressCleanFilterStyle'))return;
  var style=document.createElement('style');
  style.id='sbPaymentPlanProgressCleanFilterStyle';
  style.textContent=[
    '.sb-progress-main{margin:0!important;padding:2px 0 0!important;border-top:0!important;}',
    '.sb-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 4px;}',
    '.sb-progress-title{margin:0;font:700 13px/1.2 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);}',
    '.sb-progress-clear{appearance:none;border:0;background:transparent;color:var(--gold-deep);font:700 12px/1.2 Inter,sans-serif;padding:8px 0;cursor:pointer;}',
    '.sb-progress-clear:disabled{opacity:.35;cursor:default;}',
    '.sb-progress-section{margin-top:15px;}',
    '.sb-progress-section .filter-group-label{margin:0 0 8px!important;}',
    '.sb-progress-main .chips{display:flex;gap:8px;flex-wrap:wrap;}',
    '.sb-progress-main .chip{min-height:40px;padding:0 14px;border-radius:999px;font-size:14px;line-height:1.1;}',
    '.sb-paid-row{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:8px;align-items:center;}',
    '.sb-paid-row.sb-between{grid-template-columns:minmax(0,1fr) 88px 88px;}',
    '.sb-paid-select,.sb-paid-input,.sb-due-month{box-sizing:border-box;width:100%;height:42px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper-dim);color:var(--ink);font:600 16px/1 Inter,sans-serif;outline:none;}',
    '.sb-paid-select{padding:0 34px 0 12px;}',
    '.sb-paid-input{padding:0 30px 0 12px;text-align:right;}',
    '.sb-paid-input-wrap{position:relative;min-width:0;}',
    '.sb-paid-input-wrap span{position:absolute;right:11px;top:50%;transform:translateY(-50%);font:600 13px/1 Inter,sans-serif;color:var(--muted);pointer-events:none;}',
    '.sb-paid-between-mark{display:none;}',
    '.sb-prehandover-info{margin-top:11px;font:500 11px/1.45 Inter,sans-serif;color:var(--muted);}',
    '.sb-prehandover-info summary{cursor:pointer;color:var(--muted);font-weight:600;}',
    '.sb-prehandover-info p{margin:7px 0 0;}',
    '.sb-more-wrap{margin-top:16px;padding-top:12px;border-top:1px solid var(--paper-line);}',
    '.sb-more-toggle{width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--paper-line);border-radius:12px;background:rgba(255,255,255,.28);color:var(--ink);font:700 13px/1.2 Inter,sans-serif;padding:0 13px;cursor:pointer;}',
    '.sb-more-toggle-right{display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600;}',
    '.sb-more-count{display:inline-flex;min-width:20px;height:20px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;background:var(--ink);color:var(--paper);font-size:10px;}',
    '.sb-more-content{padding:2px 0 0;}',
    '.sb-more-content[hidden]{display:none!important;}',
    '.sb-more-content>.filter-group{margin-top:16px;}',
    '.sb-more-content .filter-group-label{margin-bottom:8px!important;}',
    '.sb-due-row{display:flex;gap:8px;flex-wrap:wrap;}',
    '.sb-due-month{margin-top:9px;max-width:190px;padding:0 11px;}',
    '.sb-filter-action{display:flex;align-items:center;gap:9px;margin-top:16px;}',
    '.sb-view-results{width:100%;min-height:46px;border:0;border-radius:13px;background:var(--ink);color:var(--paper);font:700 14px/1.2 Inter,sans-serif;padding:0 16px;cursor:pointer;}',
    '.sb-view-results:disabled{opacity:.5;cursor:default;}',
    '.sb-clean-active-pill{white-space:nowrap;}',
    '.sb-old-clear-hidden{display:none!important;}',
    '@media(max-width:700px){.filter-panel{padding-bottom:96px!important}.sb-progress-main .chip{min-height:38px;padding:0 13px;font-size:13px}.sb-paid-row{grid-template-columns:minmax(0,1fr) 104px}.sb-paid-row.sb-between{grid-template-columns:minmax(0,1fr) 82px 82px}.sb-more-content .chips{gap:8px}.sb-more-content .chip{min-height:38px;padding:0 13px}.sb-filter-action{position:relative;z-index:1}}'
  ].join('');
  document.head.appendChild(style);
}

function resetAll(){
  var s=filterState();
  s.plan='all';s.status='all';s.deadlineMode='all';
  uiState.condition='below';uiState.value='';uiState.value2='';uiState.moreOpen=false;
  if(window.state){
    state.filters={payment:'all',spa:null,oqood:null,furniture:null,unitType:null,dld:null};
    state.filtersExpanded=true;
  }
  window.renderList();
}
function removePrimary(kind){
  var s=filterState();
  if(kind==='plan')s.plan='all';
  else if(kind==='paid'){uiState.value='';uiState.value2='';}
  else if(kind==='status')s.status='all';
  else if(kind==='due')s.deadlineMode='all';
  window.renderList();
}
function activePill(label,kind){
  var btn=document.createElement('button');
  btn.type='button';btn.className='active-pill sb-clean-active-pill';btn.setAttribute('data-sb-clean-remove',kind);
  btn.innerHTML=label+'<span class="x">&times;</span>';
  btn.addEventListener('click',function(){removePrimary(kind);});
  return btn;
}
function renderActivePills(controls){
  controls.querySelectorAll('.sb-construction-completion-active-pill,.sb-clean-active-pill').forEach(function(n){n.remove();});
  if(window.state&&state.filtersExpanded)return;
  var s=filterState(),items=[];
  if(s.plan!=='all')items.push([planLabel(Number(s.plan)),'plan']);
  if(paidFilterActive())items.push([paidLabel(),'paid']);
  if(s.status==='completed')items.push(['Pre-Handover Completed','status']);
  else if(s.status==='pending')items.push(['Pre-Handover Pending','status']);
  if(s.deadlineMode==='month')items.push(['Due '+monthLabel(s.month),'due']);
  if(!items.length)return;
  var toggle=controls.querySelector('#btnToggleFilters'),wrap=controls.querySelector('.active-pills');
  if(!wrap){wrap=document.createElement('div');wrap.className='active-pills';toggle.parentNode.insertBefore(wrap,toggle);}
  items.forEach(function(item){wrap.appendChild(activePill(item[0],item[1]));});
}
function updateBadge(controls){
  var toggle=controls.querySelector('#btnToggleFilters'),left=toggle&&toggle.querySelector('.filter-toggle-left');
  if(!left)return;
  var count=totalFilterCount(),badge=left.querySelector('.filter-badge');
  if(count>0){
    if(!badge){badge=document.createElement('span');badge.className='filter-badge';left.appendChild(document.createTextNode(' '));left.appendChild(badge);}
    badge.textContent=String(count);
  }else if(badge)badge.remove();
}
function currentResultCount(controls){
  var el=controls.querySelector('.result-count'),m=el&&text(el.textContent).match(/^(\d+)\s+of\s+(\d+)/i);
  return m?Number(m[1]):(window.state&&Array.isArray(state.dues)?state.dues.length:0);
}
function makePrimaryGroup(){
  var s=filterState(),group=document.createElement('div');
  group.className='filter-group sb-progress-main';
  var condition=uiState.condition,between=condition==='between';
  group.innerHTML=
    '<div class="sb-progress-head"><p class="sb-progress-title">Payment Plan Progress</p><button type="button" class="sb-progress-clear" id="sbProgressClear">Clear all</button></div>'+
    '<div class="sb-progress-section"><p class="filter-group-label">Payment Plan</p><div class="chips">'+
      chip('All','data-sb-clean-plan','all',s.plan==='all')+
      chip('30/70','data-sb-clean-plan','30',s.plan==='30')+
      chip('40/60','data-sb-clean-plan','40',s.plan==='40')+
      chip('50/50','data-sb-clean-plan','50',s.plan==='50')+
    '</div></div>'+
    '<div class="sb-progress-section"><p class="filter-group-label">Paid %</p><div class="sb-paid-row'+(between?' sb-between':'')+'">'+
      '<select class="sb-paid-select" id="sbPaidCondition" aria-label="Paid percentage condition">'+
        '<option value="below"'+(condition==='below'?' selected':'')+'>Below (&lt;)</option>'+
        '<option value="exact"'+(condition==='exact'?' selected':'')+'>Exactly (=)</option>'+
        '<option value="above"'+(condition==='above'?' selected':'')+'>Above (&gt;)</option>'+
        '<option value="between"'+(condition==='between'?' selected':'')+'>Between</option>'+
      '</select>'+
      '<div class="sb-paid-input-wrap"><input class="sb-paid-input" id="sbPaidValue" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="22" value="'+text(uiState.value)+'" aria-label="Paid percentage"><span>%</span></div>'+
      (between?'<div class="sb-paid-input-wrap"><input class="sb-paid-input" id="sbPaidValue2" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="40" value="'+text(uiState.value2)+'" aria-label="Paid percentage upper value"><span>%</span></div>':'')+
    '</div></div>'+
    '<div class="sb-progress-section"><p class="filter-group-label">Pre-Handover</p><div class="chips">'+
      chip('All','data-sb-clean-status','all',s.status==='all')+
      chip('Completed','data-sb-clean-status','completed',s.status==='completed')+
      chip('Pending','data-sb-clean-status','pending',s.status==='pending')+
    '</div></div>'+
    '<details class="sb-prehandover-info"><summary>What does Pre-Handover mean?</summary><p>Completed means every property installment due before the final/handover installment is settled within the AED 1,000 tolerance. DLD/Admin fees and penalties are excluded.</p></details>';
  return group;
}
function makeDueGroup(){
  var s=filterState(),preset=duePreset(),group=document.createElement('div');
  group.className='filter-group sb-clean-due-group';
  group.innerHTML='<p class="filter-group-label">Due Period</p><div class="sb-due-row">'+
    chip('Any','data-sb-clean-due','any',preset==='any')+
    chip('This Month','data-sb-clean-due','this',preset==='this')+
    chip('Next Month','data-sb-clean-due','next',preset==='next')+
    chip('Custom','data-sb-clean-due','custom',preset==='custom')+
    '</div>'+
    (preset==='custom'?'<input class="sb-due-month" id="sbCleanDueMonth" type="month" value="'+text(s.month||monthValue(0))+'" aria-label="Due month">':'');
  return group;
}
function wirePrimary(group){
  var s=filterState(),clear=group.querySelector('#sbProgressClear');
  if(clear){clear.disabled=totalFilterCount()===0;clear.addEventListener('click',resetAll);}
  group.querySelectorAll('[data-sb-clean-plan]').forEach(function(btn){btn.addEventListener('click',function(){s.plan=btn.getAttribute('data-sb-clean-plan')||'all';window.renderList();});});
  group.querySelectorAll('[data-sb-clean-status]').forEach(function(btn){btn.addEventListener('click',function(){s.status=btn.getAttribute('data-sb-clean-status')||'all';window.renderList();});});
  var condition=group.querySelector('#sbPaidCondition');
  if(condition)condition.addEventListener('change',function(){uiState.condition=condition.value;window.renderList();});
  function bindValue(id,key){
    var input=group.querySelector(id);if(!input)return;
    input.addEventListener('input',function(){uiState[key]=input.value;});
    input.addEventListener('change',function(){uiState[key]=input.value;window.renderList();});
    input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();uiState[key]=input.value;input.blur();window.renderList();}});
  }
  bindValue('#sbPaidValue','value');bindValue('#sbPaidValue2','value2');
}
function wireDue(group){
  var s=filterState();
  group.querySelectorAll('[data-sb-clean-due]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var v=btn.getAttribute('data-sb-clean-due');
      if(v==='any')s.deadlineMode='all';
      else if(v==='this'){s.deadlineMode='month';s.month=monthValue(0);}
      else if(v==='next'){s.deadlineMode='month';s.month=monthValue(1);}
      else{s.deadlineMode='month';if(!/^\d{4}-\d{2}$/.test(text(s.month)))s.month=monthValue(0);}
      window.renderList();
    });
  });
  var month=group.querySelector('#sbCleanDueMonth');
  if(month)month.addEventListener('change',function(){if(/^\d{4}-\d{2}$/.test(month.value)){s.deadlineMode='month';s.month=month.value;window.renderList();}});
}
function makeMore(panel,primary){
  var wrapper=document.createElement('div');wrapper.className='sb-more-wrap';
  var count=moreCount();
  wrapper.innerHTML='<button type="button" class="sb-more-toggle" id="sbMoreFilters" aria-expanded="'+(uiState.moreOpen?'true':'false')+'"><span>More Filters</span><span class="sb-more-toggle-right">'+(count?'<span class="sb-more-count">'+count+'</span>':'')+'<span>'+(uiState.moreOpen?'Hide':'Show')+'</span></span></button><div class="sb-more-content" id="sbMoreFiltersContent"'+(uiState.moreOpen?'':' hidden')+'></div>';
  var content=wrapper.querySelector('#sbMoreFiltersContent');
  Array.prototype.slice.call(panel.children).forEach(function(node){
    if(node===primary||node===wrapper)return;
    if(node.classList&&node.classList.contains('sb-construction-completion-group')){node.remove();return;}
    if(node.classList&&node.classList.contains('filter-group'))content.appendChild(node);
  });
  var due=makeDueGroup();content.appendChild(due);wireDue(due);
  var oldClear=panel.querySelector('#btnClearFilters');if(oldClear)oldClear.classList.add('sb-old-clear-hidden');
  wrapper.querySelector('#sbMoreFilters').addEventListener('click',function(){
    uiState.moreOpen=!uiState.moreOpen;
    var body=wrapper.querySelector('#sbMoreFiltersContent'),btn=wrapper.querySelector('#sbMoreFilters');
    body.hidden=!uiState.moreOpen;btn.setAttribute('aria-expanded',uiState.moreOpen?'true':'false');
    var right=btn.querySelector('.sb-more-toggle-right');if(right)right.lastElementChild.textContent=uiState.moreOpen?'Hide':'Show';
  });
  return wrapper;
}
function enhance(){
  installStyles();
  if(!window.state||state.view!=='list')return;
  var controls=document.querySelector('.controls');if(!controls)return;
  var panel=controls.querySelector('.filter-panel');
  controls.querySelectorAll('.sb-construction-completion-active-pill').forEach(function(n){n.remove();});
  if(panel){
    var oldCustom=panel.querySelector('.sb-construction-completion-group');if(oldCustom)oldCustom.remove();
    var primary=makePrimaryGroup();
    panel.insertBefore(primary,panel.firstChild);
    wirePrimary(primary);
    var more=makeMore(panel,primary);panel.insertBefore(more,primary.nextSibling);
    var count=currentResultCount(controls),action=document.createElement('div');action.className='sb-filter-action';
    action.innerHTML='<button type="button" class="sb-view-results" id="sbViewResults"'+(count===0?' disabled':'')+'>'+(count===0?'No Customers Found':'View '+count+' Customer'+(count===1?'':'s'))+'</button>';
    panel.appendChild(action);
    var view=action.querySelector('#sbViewResults');if(view&&!view.disabled)view.addEventListener('click',function(){state.filtersExpanded=false;window.renderList();setTimeout(function(){var list=document.querySelector('.list');if(list&&list.scrollIntoView)list.scrollIntoView({block:'start',behavior:'smooth'});},20);});
  }
  var result=controls.querySelector('.result-count');
  if(result)result.textContent=result.textContent.replace(/\bunits\b/gi,'customers');
  var exportBtn=document.getElementById('btnExportList');if(exportBtn)setButtonText(exportBtn,'Export Results');
  renderActivePills(controls);updateBadge(controls);
}
var previousRender=window.renderList;
if(typeof previousRender==='function'){
  window.renderList=function(){var out=previousRender.apply(this,arguments);enhance();return out;};
}
setTimeout(enhance,0);
})();