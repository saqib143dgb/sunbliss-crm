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
function num(v){if(v==null||String(v).trim()==='')return null;var n=Number(v);return isFinite(n)?n:null;}
function pctValue(v){var n=num(v);return n!==null&&n>=0&&n<=100?n:null;}
function filterState(){
  var s=window.__sunblissConstructionCompletionFilterState;
  if(!s){
    s={plan:'all',status:'all',deadlineMode:'all',dueMode:'by',month:''};
    window.__sunblissConstructionCompletionFilterState=s;
  }
  if(!s.plan)s.plan='all';
  if(!s.status)s.status='all';
  if(!s.deadlineMode)s.deadlineMode='all';
  if(!/^(by|in)$/.test(String(s.dueMode||'')))s.dueMode='by';
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
  if(s.status!=='all')n++;
  return n;
}
function moreCount(){
  var s=filterState();
  return baseFilterCount()+(paidFilterActive()?1:0)+(s.deadlineMode==='month'?1:0);
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
    '#main .controls #btnToggleFilters.filter-toggle{box-sizing:border-box;min-height:46px;padding:0 14px;border-radius:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;background:var(--paper);}',
    '#main .controls #btnToggleFilters .filter-toggle-left{display:flex;align-items:center;gap:10px;min-width:0;font:700 15px/1 Inter,sans-serif;color:var(--ink);}',
    '#main .controls #btnToggleFilters[aria-expanded="true"] .filter-badge{display:none!important;}',
    '.sb-filter-icon{width:20px;height:20px;display:inline-flex;flex:none;color:var(--ink);}',
    '.sb-filter-icon svg,.sb-more-icon svg{width:100%;height:100%;display:block;}',
    '.sb-toggle-clear{margin-left:auto;color:var(--gold-deep);font:700 12.5px/1 Inter,sans-serif;white-space:nowrap;cursor:pointer;padding:10px 2px;}',
    '.sb-toggle-clear[aria-disabled="true"]{opacity:.38;cursor:default;}',
    '#main .controls .filter-panel{box-sizing:border-box;margin:0!important;padding:18px 16px 16px!important;border-radius:14px!important;min-height:0!important;height:auto!important;background:var(--paper-dim);}',
    '.sb-progress-main{margin:0!important;padding:0!important;border-top:0!important;}',
    '.sb-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0;}',
    '.sb-progress-title{margin:0;font:700 14px/1.25 Inter,sans-serif;letter-spacing:.055em;text-transform:uppercase;color:var(--ink);}',
    '.sb-progress-section{margin-top:14px;}',
    '.sb-progress-main .filter-group-label{margin:0 0 7px!important;font:600 12.5px/1.2 Inter,sans-serif!important;letter-spacing:0!important;text-transform:none!important;color:var(--muted)!important;}',
    '.sb-progress-main .chips{display:flex;gap:8px;flex-wrap:nowrap;}',
    '.sb-progress-main .chip{box-sizing:border-box;min-height:38px;padding:0 13px;border-radius:999px;font:600 13px/1 Inter,sans-serif;white-space:nowrap;}',
    '.sb-plan-section .chips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));}',
    '.sb-plan-section .chip{width:100%;padding-left:7px;padding-right:7px;}',
    '.sb-prehandover-section .chips{display:grid;grid-template-columns:.84fr 1.22fr 1fr;max-width:420px;}',
    '.sb-prehandover-section .chip{width:100%;}',
    '.sb-paid-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;}',
    '.sb-paid-row.sb-between{grid-template-columns:minmax(0,1fr) minmax(0,.72fr) minmax(0,.72fr);}',
    '.sb-paid-select,.sb-paid-input,.sb-due-month{box-sizing:border-box;width:100%;height:42px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper);color:var(--ink);font:600 15px/1 Inter,sans-serif;outline:none;}',
    '.sb-paid-select{-webkit-appearance:none;appearance:none;padding:0 42px 0 14px;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2315232f%27 stroke-width=%272.2%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m7 10 5 5 5-5%27/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;background-size:18px 18px;}',
    '.sb-paid-input{padding:0 34px 0 14px;text-align:left;}',
    '.sb-paid-input-wrap{position:relative;min-width:0;}',
    '.sb-paid-input-wrap span{position:absolute;right:14px;top:50%;transform:translateY(-50%);font:600 14px/1 Inter,sans-serif;color:var(--muted);pointer-events:none;}',
    '.sb-prehandover-info{margin:8px 0 0;font:600 11.5px/1.35 Inter,sans-serif;color:var(--muted);}',
    '.sb-prehandover-info summary{display:inline-block;cursor:pointer;color:var(--muted);text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;list-style:none;}',
    '.sb-prehandover-info summary::-webkit-details-marker{display:none;}',
    '.sb-prehandover-info summary::marker{display:none;content:"";}',
    '.sb-prehandover-info p{margin:7px 0 0;font-weight:500;max-width:560px;}',
    '.sb-more-wrap{margin-top:13px;padding-top:12px;border-top:1px solid var(--paper-line);}',
    '.sb-more-toggle{box-sizing:border-box;width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper);color:var(--ink);font:700 13.5px/1.2 Inter,sans-serif;padding:0 13px;cursor:pointer;}',
    '.sb-more-toggle-left{display:flex;align-items:center;gap:10px;min-width:0;}',
    '.sb-more-icon{width:20px;height:20px;display:inline-flex;flex:none;color:var(--ink);}',
    '.sb-more-toggle-right{display:flex;align-items:center;gap:8px;color:var(--ink);}',
    '.sb-more-chevron{width:18px;height:18px;transition:transform .16s ease;}',
    '.sb-more-toggle[aria-expanded="true"] .sb-more-chevron{transform:rotate(90deg);}',
    '.sb-more-content{padding:2px 0 0;}',
    '.sb-more-content[hidden]{display:none!important;}',
    '.sb-more-content>.filter-group{margin-top:15px;}',
    '.sb-more-content .filter-group-label{margin-bottom:7px!important;}',
    '.sb-more-content .chips{gap:8px;}',
    '.sb-due-row{display:flex;gap:8px;flex-wrap:wrap;}',
    '.sb-due-month{margin-top:9px;max-width:190px;padding:0 11px;}',
    '.sb-due-mode-label{margin-top:11px!important;}',
    '.sb-due-help{margin:8px 0 0;font:500 10.5px/1.45 Inter,sans-serif;color:var(--muted);}',
    '.sb-clean-active-pill{white-space:nowrap;}',
    '.sb-old-clear-hidden{display:none!important;}',
    '.result-count.sb-filter-summary{box-sizing:border-box;min-height:50px;margin:10px 0 0!important;padding:0 14px!important;border:1px solid var(--paper-line);border-radius:12px;background:var(--paper);display:flex!important;align-items:center;justify-content:space-between;gap:12px;color:var(--ink)!important;font-family:Inter,sans-serif!important;letter-spacing:0!important;}',
    '.sb-filter-summary-left{display:flex;align-items:center;gap:10px;min-width:0;font:700 13px/1.2 Inter,sans-serif;}',
    '.sb-filter-summary-icon{width:19px;height:19px;display:inline-flex;flex:none;color:var(--ink);}',
    '.sb-filter-summary-icon svg{width:100%;height:100%;display:block;}',
    '.sb-filter-summary-total{flex:none;font:600 12px/1.2 Inter,sans-serif;color:var(--muted);white-space:nowrap;}',
    '#main .controls #btnExportList{box-sizing:border-box;min-height:48px!important;margin-top:10px!important;border-radius:12px!important;font:700 13.5px/1 Inter,sans-serif!important;}',
    '@media(max-width:700px){#main .controls{padding-left:18px;padding-right:18px}#main .controls .filter-panel{padding:17px 16px 15px!important}.sb-progress-title{font-size:13.5px}.sb-progress-section{margin-top:13px}.sb-progress-main .chip{min-height:37px;font-size:12.5px}.sb-paid-select,.sb-paid-input{height:40px;font-size:15px}.sb-more-toggle{min-height:43px}.sb-more-content .chip{min-height:37px;padding:0 12px}.result-count.sb-filter-summary{min-height:48px;padding:0 13px!important}#main .controls #btnExportList{min-height:47px!important}}'
  ].join('');
  document.head.appendChild(style);
}
function resetAll(){
  var s=filterState();
  s.plan='all';s.status='all';s.deadlineMode='all';s.dueMode='by';
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
  if(s.deadlineMode==='month')items.push([(s.dueMode==='in'?'Pre-Handover due in ':'Pre-Handover due by ')+monthLabel(s.month),'due']);
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
function makePrimaryGroup(){
  var s=filterState(),group=document.createElement('div');
  group.className='filter-group sb-progress-main';
  var condition=uiState.condition,between=condition==='between';
  group.innerHTML=
    '<div class="sb-progress-head"><p class="sb-progress-title">Payment Plan Progress</p></div>'+
    '<div class="sb-progress-section sb-plan-section"><p class="filter-group-label">Payment Plan</p><div class="chips">'+
      chip('All','data-sb-clean-plan','all',s.plan==='all')+
      chip('30/70','data-sb-clean-plan','30',s.plan==='30')+
      chip('40/60','data-sb-clean-plan','40',s.plan==='40')+
      chip('50/50','data-sb-clean-plan','50',s.plan==='50')+
    '</div></div>'+
    '<div class="filter-group sb-paid-group"><p class="filter-group-label">Paid %</p><div class="sb-paid-row'+(between?' sb-between':'')+'">'+
      '<select class="sb-paid-select" id="sbPaidCondition" aria-label="Paid percentage condition">'+
        '<option value="below"'+(condition==='below'?' selected':'')+'>Below</option>'+
        '<option value="exact"'+(condition==='exact'?' selected':'')+'>Exactly</option>'+
        '<option value="above"'+(condition==='above'?' selected':'')+'>Above</option>'+
        '<option value="between"'+(condition==='between'?' selected':'')+'>Between</option>'+
      '</select>'+
      '<div class="sb-paid-input-wrap"><input class="sb-paid-input" id="sbPaidValue" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="" value="'+text(uiState.value)+'" aria-label="Paid percentage"><span>%</span></div>'+
      (between?'<div class="sb-paid-input-wrap"><input class="sb-paid-input" id="sbPaidValue2" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="" value="'+text(uiState.value2)+'" aria-label="Paid percentage upper value"><span>%</span></div>':'')+
    '</div></div>'+
    '<div class="sb-progress-section sb-prehandover-section"><p class="filter-group-label">Pre-Handover</p><div class="chips">'+
      chip('All','data-sb-clean-status','all',s.status==='all')+
      chip('Completed','data-sb-clean-status','completed',s.status==='completed')+
      chip('Pending','data-sb-clean-status','pending',s.status==='pending')+
    '</div></div>'+
    '<details class="sb-prehandover-info"><summary>What is Pre-Handover?</summary><p>Pending means an unpaid property installment above AED 0.01 after approved credits and excess payments. It includes upcoming payments; overdue amounts are shown separately in the report. DLD/Admin fees and penalties are excluded.</p></details>';
  return group;
}
function makeDueGroup(){
  var s=filterState(),preset=duePreset(),group=document.createElement('div'),active=s.deadlineMode==='month';
  group.className='filter-group sb-clean-due-group';
  group.innerHTML='<p class="filter-group-label">Pre-Handover Due Period</p><div class="sb-due-row">'+
    chip('Any','data-sb-clean-due','any',preset==='any')+
    chip('Custom','data-sb-clean-due','custom',preset==='custom')+
    '</div>'+
    (preset==='custom'?'<input class="sb-due-month" id="sbCleanDueMonth" type="month" value="'+text(s.month||monthValue(0))+'" aria-label="Pre-handover due month">':'')+
    (active?'<p class="filter-group-label sb-due-mode-label">Date Rule</p><div class="chips sb-due-mode-row">'+
      chip('Due By Month','data-sb-clean-due-mode','by',s.dueMode==='by')+
      chip('Due In Month','data-sb-clean-due-mode','in',s.dueMode==='in')+
    '</div><p class="sb-due-help">Uses only the last pre-handover installment date. Final/handover installment dates are excluded.</p>':'');
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
      else{
        s.deadlineMode='month';
        if(!/^(by|in)$/.test(String(s.dueMode||'')))s.dueMode='by';
        if(!/^\d{4}-\d{2}$/.test(text(s.month)))s.month=monthValue(0);
      }
      window.renderList();
    });
  });
  group.querySelectorAll('[data-sb-clean-due-mode]').forEach(function(btn){
    btn.addEventListener('click',function(){
      s.dueMode=btn.getAttribute('data-sb-clean-due-mode')==='in'?'in':'by';
      s.deadlineMode='month';
      window.renderList();
    });
  });
  var month=group.querySelector('#sbCleanDueMonth');
  if(month)month.addEventListener('change',function(){if(/^\d{4}-\d{2}$/.test(month.value)){s.deadlineMode='month';s.month=month.value;window.renderList();}});
}
function makeMore(panel,primary){
  var wrapper=document.createElement('div');wrapper.className='sb-more-wrap';
  var sliders='<span class="sb-more-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6"/></svg></span>';
  var arrow='<svg class="sb-more-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  wrapper.innerHTML='<button type="button" class="sb-more-toggle" id="sbMoreFilters" aria-expanded="'+(uiState.moreOpen?'true':'false')+'"><span class="sb-more-toggle-left">'+sliders+'<span>More Filters</span></span><span class="sb-more-toggle-right">'+arrow+'</span></button><div class="sb-more-content" id="sbMoreFiltersContent"'+(uiState.moreOpen?'':' hidden')+'></div>';
  var content=wrapper.querySelector('#sbMoreFiltersContent');
  var paid=primary.querySelector('.sb-paid-group');if(paid)content.appendChild(paid);
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
  });
  return wrapper;
}
function filterIconMarkup(){
  return '<span class="sb-filter-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"/></svg></span>';
}
function summaryIconMarkup(){
  return '<span class="sb-filter-summary-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20v-1.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5V20h-12Zm12.7 0v-1.3c0-1.7-.6-3.3-1.7-4.5.6-.2 1.3-.3 2-.3 3.1 0 5.5 2.1 5.5 4.8V20h-5.8Z"/></svg></span>';
}
function enhanceFilterToggle(controls){
  var toggle=controls.querySelector('#btnToggleFilters');if(!toggle)return;
  var left=toggle.querySelector('.filter-toggle-left');
  if(left&&!left.querySelector('.sb-filter-icon'))left.insertAdjacentHTML('afterbegin',filterIconMarkup());
  var clear=toggle.querySelector('.sb-toggle-clear');
  if(state.filtersExpanded){
    if(!clear){
      clear=document.createElement('span');
      clear.className='sb-toggle-clear';
      clear.setAttribute('role','button');
      clear.setAttribute('tabindex','0');
      clear.textContent='Clear';
      var chevron=toggle.lastElementChild;
      if(chevron&&chevron!==left)toggle.insertBefore(clear,chevron);else toggle.appendChild(clear);
      var runClear=function(e){
        if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
        if(totalFilterCount()>0)resetAll();
      };
      clear.addEventListener('click',runClear);
      clear.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){runClear(e);}});
    }
    clear.setAttribute('aria-disabled',totalFilterCount()>0?'false':'true');
  }else if(clear){
    clear.remove();
  }
}
function enhanceResultSummary(controls){
  var result=controls.querySelector('.result-count');if(!result)return;
  if(totalFilterCount()>0){
    var raw=text(result.textContent),match=raw.match(/^\s*(\d+)/);
    var filtered=match?Number(match[1]):0;
    var total=window.state&&Array.isArray(state.dues)?state.dues.length:0;
    result.classList.add('sb-filter-summary');
    result.innerHTML=summaryIconMarkup()+'<span class="sb-filter-summary-left"><span>'+filtered+' filtered customer'+(filtered===1?'':'s')+'</span></span><span class="sb-filter-summary-total">'+total+' total</span>';
  }else{
    result.classList.remove('sb-filter-summary');
    result.textContent=result.textContent.replace(/\bunits\b/gi,'customers');
  }
}
function enhance(){
  installStyles();
  if(!window.state||state.view!=='list')return;
  var controls=document.querySelector('.controls');if(!controls)return;
  enhanceFilterToggle(controls);
  var panel=controls.querySelector('.filter-panel');
  controls.querySelectorAll('.sb-construction-completion-active-pill').forEach(function(n){n.remove();});
  if(panel){
    var oldCustom=panel.querySelector('.sb-construction-completion-group');if(oldCustom)oldCustom.remove();
    var primary=makePrimaryGroup();
    panel.insertBefore(primary,panel.firstChild);
    wirePrimary(primary);
    var more=makeMore(panel,primary);panel.insertBefore(more,primary.nextSibling);
  }
  controls.querySelectorAll('.chip[data-group="dld"]').forEach(function(btn){
    var value=btn.getAttribute('data-value');
    if(value==='notstarted'){btn.remove();return;}
    if(value==='partial'){
      btn.setAttribute('data-value','outstanding');btn.textContent='Unpaid';
      btn.setAttribute('aria-pressed',state.filters.dld==='outstanding'?'true':'false');
    }
  });
  controls.querySelectorAll('[data-remove-group="dld"]').forEach(function(pill){
    if(state.filters.dld==='outstanding')pill.innerHTML='DLD Unpaid<span class="x">&times;</span>';
  });
  enhanceResultSummary(controls);
  var exportBtn=document.getElementById('btnExportList');if(exportBtn)setButtonText(exportBtn,'Export payment report');
  renderActivePills(controls);updateBadge(controls);
}
var previousRender=window.renderList;
if(typeof previousRender==='function'){
  window.renderList=function(){if(window.state&&state.filters&&(state.filters.dld==='partial'||state.filters.dld==='notstarted'))state.filters.dld='outstanding';var out=previousRender.apply(this,arguments);enhance();return out;};
}
setTimeout(enhance,0);
})();