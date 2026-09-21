(function(){
'use strict';
if(window.__sunblissConstructionCompletionFilterInstalled)return;
window.__sunblissConstructionCompletionFilterInstalled=true;

var FILTER_TOLERANCE=7000;
var stateFilter=window.__sunblissConstructionCompletionFilterState||{
  plan:'all',
  status:'all',
  deadlineMode:'all',
  dueMode:'by',
  month:'2026-12'
};
window.__sunblissConstructionCompletionFilterState=stateFilter;
if(!stateFilter.plan)stateFilter.plan='all';
if(!stateFilter.status)stateFilter.status='all';
if(!stateFilter.deadlineMode)stateFilter.deadlineMode='all';
if(!/^(by|in)$/.test(String(stateFilter.dueMode||'')))stateFilter.dueMode='by';
if(!/^\d{4}-\d{2}$/.test(String(stateFilter.month||'')))stateFilter.month='2026-12';

var oldMilestoneState=window.__sunblissPaymentMilestoneFilterState;
if(oldMilestoneState){oldMilestoneState.target=null;oldMilestoneState.position='all';}

var reportIndex=null;
var reportIndexPromise=null;
var previousRenderList=window.renderList;
var previousExport=window.exportFilteredList;

function text(v){return v==null?'':String(v);}
function norm(v){return text(v).trim().toUpperCase().replace(/\s+/g,' ');}
function num(v){var n=Number(v);return isFinite(n)?n:0;}
function round2(v){return Math.round(num(v)*100)/100;}
function nice(v){return typeof window.titleCase==='function'?window.titleCase(text(v)):text(v);}
function pairKey(unitId,customerId){return text(unitId)+'|'+text(customerId);}
function fallbackKey(unitNo,customerName){return norm(unitNo)+'|'+norm(customerName);}
function customerIdOf(c){return c&&(c.customerId||c.dbCustomerId||c.customer_id)||null;}
function unitIdOf(c){return c&&(c.unitId||c.dbUnitId||c.unit_id)||null;}
function effectiveDateText(row){var value=text(row&&(row.revised_due_date||row.due_date)).trim();return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';}
function effectiveAmount(row){var revised=row&&row.revised_due_amount;return revised!==null&&revised!==undefined&&text(revised)!==''?num(revised):num(row&&row.due_amount);}
function dateValue(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(text(value)))return null;var d=new Date(value+'T00:00:00');return isNaN(d.getTime())?null:d;}
function isPropertySchedule(row){
  var label=text(row&&row.stage_name);
  if(/\bdld\b|admin\s*fees?|registration\s*fees?|penalt|late\s*(fee|charge)/i.test(label))return false;
  return effectiveAmount(row)>0;
}
function isFinalStage(row){return /\bfinal\b|handover|offer\s+of\s+possession|possession/i.test(text(row&&row.stage_name));}
function planTarget(pct){
  var options=[30,40,50];
  for(var i=0;i<options.length;i++)if(Math.abs(num(pct)-options[i])<=1)return options[i];
  return null;
}
function planLabel(target){return target?String(target)+'/'+String(100-target):'Other';}
function rowRemaining(row,creditBySchedule){
  return round2(Math.max(0,effectiveAmount(row)-num(row&&row.paid_amount)-num(creditBySchedule&&creditBySchedule[text(row&&row.id)])));
}
function latestDated(rows){
  var dated=(rows||[]).map(function(r){return {row:r,date:effectiveDateText(r)};}).filter(function(x){return !!x.date;});
  dated.sort(function(a,b){return b.date.localeCompare(a.date)||num(b.row&&b.row.id)-num(a.row&&a.row.id);});
  return dated.length?dated[0]:null;
}
function externalFilterActive(){try{return typeof window.__sunblissPaymentPlanProgressExternalFilterActive==='function'&&!!window.__sunblissPaymentPlanProgressExternalFilterActive();}catch(_e){return false;}}
function externalMatches(customer,entry){try{return typeof window.__sunblissPaymentPlanProgressExternalMatches!=='function'||window.__sunblissPaymentPlanProgressExternalMatches(customer,entry)!==false;}catch(_e){return true;}}
function filterActive(){return stateFilter.plan!=='all'||stateFilter.status!=='all'||stateFilter.deadlineMode==='month'||externalFilterActive();}
function planMatches(meta){return stateFilter.plan==='all'||Number(stateFilter.plan)===meta.planTarget;}
function statusMatches(meta){
  if(!meta)return false;
  var balance=Math.max(0,num(meta.constructionBalance));
  if(stateFilter.status==='completed')return balance<=FILTER_TOLERANCE;
  if(stateFilter.status==='pending')return balance>FILTER_TOLERANCE;
  return true;
}
function deadlineMatches(meta){
  if(stateFilter.deadlineMode!=='month')return true;
  var due=text(meta&&meta.lastConstructionDue);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(due))return false;
  if(stateFilter.dueMode==='in')return due.slice(0,7)===stateFilter.month;
  return due.slice(0,7)<=stateFilter.month;
}
function monthLabel(value){var m=/^(\d{4})-(\d{2})$/.exec(text(value));if(!m)return text(value);var d=new Date(Number(m[1]),Number(m[2])-1,1);return d.toLocaleDateString(undefined,{month:'short',year:'numeric'});}
function statusLabel(code){if(code==='completed')return 'Pre-Handover Completed — Final Remaining';if(code==='pending')return 'Pre-Handover Pending';if(code==='fully_paid')return 'Fully Settled';return 'Review Required';}

async function readAll(table,columns){
  var rows=[],offset=0;
  for(;;){var r=await window.sb.from(table).select(columns).order('id',{ascending:true}).range(offset,offset+999);if(r.error)throw r.error;rows=rows.concat(r.data||[]);if((r.data||[]).length<1000)return rows;offset+=1000;}
}
async function loadReportIndex(force){
  if(!window.sb)throw new Error('CRM connection is not ready. Refresh and try again.');
  if(reportIndex&&!force)return reportIndex;
  if(reportIndexPromise)return reportIndexPromise;
  reportIndexPromise=(async function(){
    var specs=[['units','id,unit_no,total_price,status,customer_id'],['customers','id,customer_name'],['payment_schedule','id,unit_id,customer_id,stage_name,due_amount,revised_due_amount,due_date,revised_due_date,paid_amount,status'],['sales','id,unit_id,customer_id,booking_date,commercial_sale_price,commercial_non_cash_settlement'],['payment_transactions','id,unit_id,customer_id,payment_schedule_id,payment_date,amount,payment_type'],['credit_notes','id,unit_id,customer_id,payment_schedule_id,issue_date,amount'],['payment_extensions','id,unit_id,customer_id,payment_schedule_id,extended_due_date,approved_on,status']];
    var values=await Promise.all(specs.map(function(x){return readAll(x[0],x[1]);}));
    var data={};['units','customers','schedule','sales','transactions','credits','extensions'].forEach(function(k,i){data[k]=values[i];});
    var asOf=window.SunblissPaymentReport.reportDate(),entries=window.SunblissPaymentReport.build(data,asOf),byPair={},byUnit={};
    entries.forEach(function(e){byPair[pairKey(e.unitId,e.customerId)]=e;byUnit[norm(e.unitNo)]=e;});
    reportIndex={entries:entries,byPair:byPair,byUnit:byUnit,asOf:asOf};return reportIndex;
  })().finally(function(){reportIndexPromise=null;});return reportIndexPromise;
}
function customerEntry(customer){
  if(!reportIndex||!customer)return null;
  var unitId=unitIdOf(customer),customerId=customerIdOf(customer);
  var e=unitId!=null&&customerId!=null?reportIndex.byPair[pairKey(unitId,customerId)]:reportIndex.byUnit[norm(customer.unit)];
  return e?Object.assign({},e,{customer:customer}):null;
}
function matchesCustomer(customer){var e=customerEntry(customer);return !!(e&&planMatches(e.schedule)&&statusMatches(e.schedule)&&deadlineMatches(e.schedule)&&externalMatches(customer,e));}

function installStyles(){
  if(document.getElementById('sbConstructionCompletionFilterStyle'))return;
  var style=document.createElement('style');style.id='sbConstructionCompletionFilterStyle';style.textContent=[
    '.sb-plan-deadline-group{display:none!important;}',
    '.sb-construction-completion-group{border-top:1px solid var(--paper-line);padding-top:13px;margin-top:2px;}',
    '.sb-construction-completion-group .filter-group-label{margin-top:0;}',
    '.sb-construction-status-label{margin-top:12px!important;}',
    '.sb-construction-deadline-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;}',
    '.sb-construction-month{height:38px;min-width:145px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper);color:var(--ink);font:600 12px Inter,sans-serif;padding:0 9px;outline:none;}',
    '.sb-construction-month:disabled{opacity:.45;}',
    '.sb-construction-hint{margin:10px 0 0;font-size:10.5px;line-height:1.45;color:var(--muted);}',
    '.sb-construction-loading{color:var(--gold-deep);font-weight:600;}'
  ].join('');document.head.appendChild(style);
}
function chip(label,attr,value,pressed){return '<button type="button" class="chip" '+attr+'="'+value+'" aria-pressed="'+(pressed?'true':'false')+'">'+label+'</button>';}
function filterSummary(){
  var parts=[];
  if(stateFilter.plan!=='all')parts.push(planLabel(Number(stateFilter.plan)));
  if(stateFilter.status==='completed')parts.push('Pre-Handover Completed');
  if(stateFilter.status==='pending')parts.push('Pre-Handover Pending');
  if(stateFilter.deadlineMode==='month')parts.push((stateFilter.dueMode==='in'?'Pre-Handover due in ':'Pre-Handover due by ')+monthLabel(stateFilter.month));
  return parts.join(' · ');
}
function ensureActivePill(controls,toggle){
  var existing=controls.querySelector('.sb-construction-completion-active-pill');
  if(!filterActive()){if(existing)existing.remove();return;}
  var wrap=controls.querySelector('.active-pills');if(!wrap){wrap=document.createElement('div');wrap.className='active-pills';toggle.parentNode.insertBefore(wrap,toggle);}
  if(!existing){existing=document.createElement('button');existing.type='button';existing.className='active-pill sb-construction-completion-active-pill';wrap.appendChild(existing);}
  existing.innerHTML=filterSummary()+'<span class="x">&times;</span>';
  existing.onclick=function(){stateFilter.plan='all';stateFilter.status='all';stateFilter.deadlineMode='all';window.renderList();};
}
function relabelExport(){
  var button=document.getElementById('btnExportList');if(!button)return;
  var label='Export payment report';
  if(stateFilter.status==='completed')label='Export Pre-Handover Completed';
  else if(stateFilter.status==='pending')label='Export Pre-Handover Pending';
  var changed=false;Array.prototype.forEach.call(button.childNodes,function(node){if(node.nodeType===3&&String(node.nodeValue||'').trim()){node.nodeValue=label;changed=true;}});
  if(!changed)button.appendChild(document.createTextNode(label));
  button.setAttribute('aria-label',label);button.setAttribute('title',label);
}
function enhanceFilterUI(isLoading,originalTotal){
  var controls=document.querySelector('.controls');if(!controls)return;var toggle=controls.querySelector('#btnToggleFilters');if(!toggle)return;
  ensureActivePill(controls,toggle);
  if(filterActive()){var left=toggle.querySelector('.filter-toggle-left'),badge=left&&left.querySelector('.filter-badge');if(badge)badge.textContent=String((parseInt(badge.textContent,10)||0)+1);}
  var panel=controls.querySelector('.filter-panel');if(!panel){relabelExport();return;}
  var oldGroup=panel.querySelector('.sb-plan-deadline-group');if(oldGroup)oldGroup.style.display='none';
  if(!panel.querySelector('.sb-construction-completion-group')){
    var group=document.createElement('div');group.className='filter-group sb-construction-completion-group';
    group.innerHTML=
      '<p class="filter-group-label">Payment Plan</p><div class="chips">'+
      chip('All Plans','data-sb-construction-plan','all',stateFilter.plan==='all')+
      chip('30/70','data-sb-construction-plan','30',stateFilter.plan==='30')+
      chip('40/60','data-sb-construction-plan','40',stateFilter.plan==='40')+
      chip('50/50','data-sb-construction-plan','50',stateFilter.plan==='50')+
      '</div>'+
      '<p class="filter-group-label sb-construction-status-label">Pre-Handover Status</p><div class="chips">'+
      chip('All','data-sb-construction-status','all',stateFilter.status==='all')+
      chip('Pre-Handover Completed','data-sb-construction-status','completed',stateFilter.status==='completed')+
      chip('Pre-Handover Pending','data-sb-construction-status','pending',stateFilter.status==='pending')+
      '</div>'+
      '<p class="filter-group-label sb-construction-status-label">Pre-Handover Due Period</p><div class="sb-construction-deadline-row"><div class="chips">'+
      chip('Any Date','data-sb-construction-deadline','all',stateFilter.deadlineMode==='all')+
      chip('Specific Month','data-sb-construction-deadline','month',stateFilter.deadlineMode==='month')+
      '</div><input id="sbConstructionCompletionMonth" class="sb-construction-month" type="month" value="'+stateFilter.month+'" '+(stateFilter.deadlineMode==='month'?'':'disabled')+' aria-label="Pre-handover due month"></div>'+
      '<p class="sb-construction-hint'+(isLoading?' sb-construction-loading':'')+'">'+(isLoading?'Loading payment plan progress…':'Pre-Handover Completed means the remaining pre-handover balance is AED 7,000 or less. Pending means it is above AED 7,000. This tolerance affects filtering/reporting only; the customer balance and payment data remain unchanged. DLD/Admin fees and penalties are excluded.')+'</p>';
    var clear=panel.querySelector('#btnClearFilters');panel.insertBefore(group,clear||null);
    group.querySelectorAll('[data-sb-construction-plan]').forEach(function(btn){btn.addEventListener('click',function(){stateFilter.plan=btn.getAttribute('data-sb-construction-plan')||'all';loadReportIndex(false).catch(function(){});window.renderList();});});
    group.querySelectorAll('[data-sb-construction-status]').forEach(function(btn){btn.addEventListener('click',function(){stateFilter.status=btn.getAttribute('data-sb-construction-status')||'all';loadReportIndex(false).catch(function(){});window.renderList();});});
    group.querySelectorAll('[data-sb-construction-deadline]').forEach(function(btn){btn.addEventListener('click',function(){stateFilter.deadlineMode=btn.getAttribute('data-sb-construction-deadline')||'all';window.renderList();});});
    var month=group.querySelector('#sbConstructionCompletionMonth');if(month)month.addEventListener('change',function(){if(/^\d{4}-\d{2}$/.test(month.value))stateFilter.month=month.value;stateFilter.deadlineMode='month';window.renderList();});
  }
  var clearAll=panel.querySelector('#btnClearFilters');
  if(clearAll&&!clearAll.__sbConstructionCompletionCapture){clearAll.__sbConstructionCompletionCapture=true;clearAll.addEventListener('click',function(){stateFilter.plan='all';stateFilter.status='all';stateFilter.deadlineMode='all';},true);}
  if(filterActive()&&typeof originalTotal==='number'){var result=controls.querySelector('.result-count');if(result)result.textContent=result.textContent.replace(/^(\d+) of \d+ units/,function(_m,count){return count+' of '+originalTotal+' units';});}
  relabelExport();
}

function wrappedRenderList(){
  if(typeof previousRenderList!=='function')return;
  var originalTotal=window.state&&Array.isArray(state.dues)?state.dues.length:0;
  if(!filterActive()){var plain=previousRenderList.apply(this,arguments);enhanceFilterUI(false,originalTotal);return plain;}
  if(!reportIndex){var saved=state.dues;state.dues=[];var loading;try{loading=previousRenderList.apply(this,arguments);}finally{state.dues=saved;}enhanceFilterUI(true,originalTotal);loadReportIndex(false).then(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();}).catch(function(err){console.warn('Payment plan progress filter load failed',err);var hint=document.querySelector('.sb-construction-hint');if(hint)hint.textContent='Unable to load payment report. Refresh to retry.';});return loading;}
  var all=state.dues,subset=all.filter(matchesCustomer),out;state.dues=subset;try{out=previousRenderList.apply(this,arguments);}finally{state.dues=all;}enhanceFilterUI(false,originalTotal);return out;
}
wrappedRenderList.__sunblissConstructionCompletionWrapped=true;
window.renderList=wrappedRenderList;

function currentEntries(rows){
  return (rows||[]).map(function(item){return customerEntry(item&&item.c?item.c:item);}).filter(function(e){return e&&planMatches(e.schedule)&&statusMatches(e.schedule)&&deadlineMatches(e.schedule)&&externalMatches(e.customer,e);}).sort(function(a,b){return a.bookingDate.localeCompare(b.bookingDate)||a.unitNo.localeCompare(b.unitNo,undefined,{numeric:true});});
}
function reportFilters(){
  var parts=[filterSummary()||'All plans / statuses / due dates'],filters=(window.state&&state.filters)||{};
  Object.keys(filters).forEach(function(k){if(filters[k]&&filters[k]!=='all')parts.push(k+': '+filters[k]);});
  if(window.state&&state.search)parts.push('Search: '+state.search);
  var pct=window.__sunblissPaymentPlanProgressCleanUiState;if(pct&&pct.value!==''&&pct.value!=null)parts.push('Cash received '+pct.condition+' '+pct.value+(pct.condition==='between'?' to '+pct.value2:'')+'%');
  return parts.join('; ');
}
async function exportConstructionStatus(rows){
  if(!window.ExcelJS)throw new Error('Spreadsheet library did not load. Refresh and try again.');
  await loadReportIndex(true);var entries=currentEntries(rows);
  if(!entries.length)throw new Error('No customers match the selected payment report filters.');
  var wb=window.SunblissPaymentReportExport.buildWorkbook(window.ExcelJS,entries,{date:reportIndex.asOf,filters:reportFilters()});
  var buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Sunbliss-Payment-Report-'+reportIndex.asOf+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);
}
window.exportFilteredList=exportConstructionStatus;
window.__sunblissRefreshConstructionCompletionReport=function(){reportIndex=null;return loadReportIndex(true).then(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();return true;});};
window.__sunblissPaymentReportApi={entries:currentEntries,refresh:function(){return loadReportIndex(true);},export:exportConstructionStatus,filters:reportFilters};
var previousLoad=window.loadFromSupabase;
if(typeof previousLoad==='function')window.loadFromSupabase=async function(){var result=await previousLoad.apply(this,arguments);reportIndex=null;await window.__sunblissRefreshConstructionCompletionReport();return result;};

installStyles();
loadReportIndex(false).catch(function(){});
setTimeout(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();},0);
})();
