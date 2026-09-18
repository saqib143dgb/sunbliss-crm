(function(){
'use strict';
if(window.__sunblissConstructionCompletionFilterInstalled)return;
window.__sunblissConstructionCompletionFilterInstalled=true;

var TOLERANCE=1000;
var stateFilter=window.__sunblissConstructionCompletionFilterState||{
  plan:'all',
  status:'all',
  deadlineMode:'all',
  month:'2026-12'
};
window.__sunblissConstructionCompletionFilterState=stateFilter;
if(!stateFilter.plan)stateFilter.plan='all';
if(!stateFilter.status)stateFilter.status='all';
if(!stateFilter.deadlineMode)stateFilter.deadlineMode='all';
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
function dateValue(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(text(value)))return null;var d=new Date(value+'T00:00:00');return isNaN(d.getTime())?null:d;}
function isPropertySchedule(row){
  var label=text(row&&row.stage_name);
  if(/\bdld\b|admin\s*fees?|registration\s*fees?|penalt|late\s*(fee|charge)/i.test(label))return false;
  return num(row&&row.due_amount)>0;
}
function isFinalStage(row){return /\bfinal\b|handover|offer\s+of\s+possession|possession/i.test(text(row&&row.stage_name));}
function isVoidedTransaction(t){return /(bounce|bounced|refund|refunded|revers|void|deleted|uncleared\s*pdc|credit\s*note|carry\s*forward)/i.test([t&&t.payment_type,t&&t.payment_reference,t&&t.remarks].join(' '));}
function isOtherCash(t){return /(dld|admin|registration|penalt|late\s*fee|late\s*charge|other\s*fee)/i.test(text(t&&t.payment_type));}
function planTarget(pct){
  var options=[30,40,50];
  for(var i=0;i<options.length;i++)if(Math.abs(num(pct)-options[i])<=1)return options[i];
  return null;
}
function planLabel(target){return target?String(target)+'/'+String(100-target):'Other';}
function rowRemaining(row,creditBySchedule){
  return round2(Math.max(0,num(row&&row.due_amount)-num(row&&row.paid_amount)-num(creditBySchedule&&creditBySchedule[text(row&&row.id)])));
}
function latestDated(rows){
  var dated=(rows||[]).map(function(r){return {row:r,date:effectiveDateText(r)};}).filter(function(x){return !!x.date;});
  dated.sort(function(a,b){return b.date.localeCompare(a.date)||num(b.row&&b.row.id)-num(a.row&&a.row.id);});
  return dated.length?dated[0]:null;
}
function filterActive(){return stateFilter.plan!=='all'||stateFilter.status!=='all'||stateFilter.deadlineMode==='month';}
function planMatches(meta){return stateFilter.plan==='all'||Number(stateFilter.plan)===meta.planTarget;}
function statusMatches(meta){
  if(stateFilter.status==='completed')return meta.completionCode==='completed';
  if(stateFilter.status==='pending')return meta.completionCode==='pending';
  return true;
}
function deadlineMatches(meta){return stateFilter.deadlineMode!=='month'||(meta.deadline&&meta.deadline.slice(0,7)===stateFilter.month);}
function monthLabel(value){var m=/^(\d{4})-(\d{2})$/.exec(text(value));if(!m)return text(value);var d=new Date(Number(m[1]),Number(m[2])-1,1);return d.toLocaleDateString(undefined,{month:'short',year:'numeric'});}
function statusLabel(code){if(code==='completed')return 'Completed — Final Remaining';if(code==='pending')return 'Construction Not Completed';if(code==='fully_paid')return 'Final Already Paid';return 'Review';}

function makeScheduleMeta(rows,unitNo,customerId,creditBySchedule){
  rows=(rows||[]).filter(isPropertySchedule);
  if(!rows.length)return null;
  var finalRows=rows.filter(isFinalStage),constructionRows=rows.filter(function(r){return !isFinalStage(r);});
  if(!finalRows.length||!constructionRows.length)return null;
  var totalScheduled=round2(rows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var constructionAmount=round2(constructionRows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var finalAmount=round2(finalRows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  if(totalScheduled<=0||constructionAmount<=0||finalAmount<=0)return null;
  var constructionPct=constructionAmount/totalScheduled*100,target=planTarget(constructionPct);
  if(!target)return null;

  var constructionSettled=0,constructionBalance=0,constructionOpenCount=0;
  constructionRows.forEach(function(row){
    var due=num(row.due_amount),remaining=rowRemaining(row,creditBySchedule),settled=Math.max(0,due-remaining);
    constructionSettled+=settled;constructionBalance+=remaining;if(remaining>TOLERANCE)constructionOpenCount++;
  });
  var finalSettled=0,finalBalance=0,finalOpenCount=0;
  finalRows.forEach(function(row){
    var due=num(row.due_amount),remaining=rowRemaining(row,creditBySchedule),settled=Math.max(0,due-remaining);
    finalSettled+=settled;finalBalance+=remaining;if(remaining>TOLERANCE)finalOpenCount++;
  });
  constructionSettled=round2(constructionSettled);constructionBalance=round2(constructionBalance);
  finalSettled=round2(finalSettled);finalBalance=round2(finalBalance);
  var completionCode=constructionOpenCount>0?'pending':(finalOpenCount>0?'completed':'fully_paid');
  var lastConstruction=latestDated(constructionRows),finalDated=latestDated(finalRows);
  var deadline=finalDated?finalDated.date:(lastConstruction?lastConstruction.date:'');
  var maxId=rows.reduce(function(m,row){return Math.max(m,num(row&&row.id));},0);
  return {
    unitNo:unitNo,customerId:customerId,totalScheduled:totalScheduled,
    constructionAmount:constructionAmount,finalAmount:finalAmount,
    constructionPct:constructionPct,planTarget:target,planLabel:planLabel(target),
    constructionSettled:constructionSettled,constructionBalance:constructionBalance,constructionOpenCount:constructionOpenCount,
    finalSettled:finalSettled,finalBalance:finalBalance,finalOpenCount:finalOpenCount,
    completionCode:completionCode,completionLabel:statusLabel(completionCode),
    deadline:deadline,finalDue:finalDated?finalDated.date:'',lastConstructionDue:lastConstruction?lastConstruction.date:'',
    maxId:maxId
  };
}

async function loadReportIndex(force){
  if(!window.sb)throw new Error('CRM data connection is not ready. Please refresh and try again.');
  if(reportIndex&&!force)return reportIndex;
  if(reportIndexPromise)return reportIndexPromise;
  reportIndexPromise=(async function(){
    var results=await Promise.all([
      sb.from('units').select('id,unit_no'),
      sb.from('customers').select('id,customer_name'),
      sb.from('payment_schedule').select('id,unit_id,customer_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,status').order('id',{ascending:true}),
      sb.from('sales').select('id,unit_id,customer_id,booking_date,commercial_sale_price,commercial_non_cash_settlement').order('booking_date',{ascending:true}).order('id',{ascending:true}),
      sb.from('payment_transactions').select('unit_id,customer_id,amount,payment_type,payment_reference,remarks'),
      sb.from('credit_notes').select('payment_schedule_id,amount')
    ]);
    results.forEach(function(r){if(r.error)throw r.error;});

    var unitNoById={},customerNameById={},creditBySchedule={};
    (results[0].data||[]).forEach(function(u){unitNoById[text(u.id)]=text(u.unit_no).trim();});
    (results[1].data||[]).forEach(function(c){customerNameById[text(c.id)]=text(c.customer_name).trim();});
    (results[5].data||[]).forEach(function(c){var k=text(c.payment_schedule_id);if(k)creditBySchedule[k]=round2((creditBySchedule[k]||0)+num(c.amount));});

    var rowsByPair={},scheduleByPair={},scheduleByFallback={},scheduleByUnit={};
    (results[2].data||[]).forEach(function(row){if(!isPropertySchedule(row))return;var k=pairKey(row.unit_id,row.customer_id);if(!rowsByPair[k])rowsByPair[k]=[];rowsByPair[k].push(row);});
    Object.keys(rowsByPair).forEach(function(k){
      var rows=rowsByPair[k],sample=rows[0]||{},unitNo=unitNoById[text(sample.unit_id)]||'',customerId=sample.customer_id;
      if(!unitNo)return;
      var meta=makeScheduleMeta(rows,unitNo,customerId,creditBySchedule);if(!meta)return;
      scheduleByPair[k]=meta;
      var customerName=customerNameById[text(customerId)]||'',fk=fallbackKey(unitNo,customerName);
      if(unitNo&&customerName)scheduleByFallback[fk]=meta;
      var uk=norm(unitNo),existing=scheduleByUnit[uk];if(!existing||meta.maxId>existing.maxId)scheduleByUnit[uk]=meta;
    });

    var saleByPair={},saleByFallback={},saleByUnit={};
    (results[3].data||[]).forEach(function(s){
      var unitNo=unitNoById[text(s.unit_id)]||'',customerName=customerNameById[text(s.customer_id)]||'';
      var entry={id:num(s.id),unitId:s.unit_id,customerId:s.customer_id,bookingDate:text(s.booking_date),commercialPrice:round2(s.commercial_sale_price),nonCashSettlement:round2(s.commercial_non_cash_settlement)};
      var pk=pairKey(s.unit_id,s.customer_id),current=saleByPair[pk];
      if(!current||(entry.bookingDate&&(!current.bookingDate||entry.bookingDate<current.bookingDate))||(entry.bookingDate===current.bookingDate&&entry.id<current.id))saleByPair[pk]=entry;
      var fk=fallbackKey(unitNo,customerName),fallback=saleByFallback[fk];
      if(unitNo&&customerName&&(!fallback||(entry.bookingDate&&(!fallback.bookingDate||entry.bookingDate<fallback.bookingDate))||(entry.bookingDate===fallback.bookingDate&&entry.id<fallback.id)))saleByFallback[fk]=entry;
      var uk=norm(unitNo),unitCurrent=saleByUnit[uk];
      if(unitNo&&(!unitCurrent||(entry.bookingDate&&(!unitCurrent.bookingDate||entry.bookingDate>unitCurrent.bookingDate))||(entry.bookingDate===unitCurrent.bookingDate&&entry.id>unitCurrent.id)))saleByUnit[uk]=entry;
    });

    var cashByPair={},cashByUnit={},unassignedCashByUnit={};
    (results[4].data||[]).forEach(function(t){
      if(isVoidedTransaction(t)||isOtherCash(t))return;
      var amount=round2(t&&t.amount);if(amount<=0)return;
      var uk=text(t.unit_id);cashByUnit[uk]=round2((cashByUnit[uk]||0)+amount);
      if(t.customer_id!==null&&t.customer_id!==undefined){var pk=pairKey(t.unit_id,t.customer_id);cashByPair[pk]=round2((cashByPair[pk]||0)+amount);}else unassignedCashByUnit[uk]=round2((unassignedCashByUnit[uk]||0)+amount);
    });

    reportIndex={unitNoById:unitNoById,scheduleByPair:scheduleByPair,scheduleByFallback:scheduleByFallback,scheduleByUnit:scheduleByUnit,saleByPair:saleByPair,saleByFallback:saleByFallback,saleByUnit:saleByUnit,cashByPair:cashByPair,cashByUnit:cashByUnit,unassignedCashByUnit:unassignedCashByUnit};
    return reportIndex;
  })().finally(function(){reportIndexPromise=null;});
  return reportIndexPromise;
}

function resolveSchedule(customer){
  if(!reportIndex||!customer)return null;
  var unitId=unitIdOf(customer),customerId=customerIdOf(customer),hit=null;
  if(unitId!==null&&customerId!==null)hit=reportIndex.scheduleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=reportIndex.scheduleByFallback[fallbackKey(customer.unit,customer.name)];
  if(!hit)hit=reportIndex.scheduleByUnit[norm(customer.unit)];
  return hit||null;
}
function resolveSale(customer){
  var unitId=unitIdOf(customer),customerId=customerIdOf(customer),hit=null;
  if(unitId!==null&&customerId!==null)hit=reportIndex.saleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=reportIndex.saleByFallback[fallbackKey(customer.unit,customer.name)];
  if(!hit)hit=reportIndex.saleByUnit[norm(customer.unit)];
  return hit||{unitId:unitId,customerId:customerId,commercialPrice:0,nonCashSettlement:0};
}
function customerEntry(customer){
  var schedule=resolveSchedule(customer);if(!schedule)return null;
  var sale=resolveSale(customer),unitId=unitIdOf(customer)||sale.unitId,customerId=customerIdOf(customer)||sale.customerId;
  var price=sale.commercialPrice>0?sale.commercialPrice:(num(customer.total)>0?num(customer.total):schedule.totalScheduled);
  var cash=0;
  if(unitId!==null&&customerId!==null){var pk=pairKey(unitId,customerId);cash=Object.prototype.hasOwnProperty.call(reportIndex.cashByPair,pk)?num(reportIndex.cashByPair[pk])+num(reportIndex.unassignedCashByUnit[text(unitId)]):num(reportIndex.cashByUnit[text(unitId)]);}else if(unitId!==null)cash=num(reportIndex.cashByUnit[text(unitId)]);
  var entry={customer:customer,schedule:schedule,price:round2(price),cash:round2(cash),paidPct:price>0?cash/price*100:0,nonCashSettlement:round2(sale.nonCashSettlement)};
  return entry;
}
function matchesCustomer(customer){var e=customerEntry(customer);return !!(e&&planMatches(e.schedule)&&statusMatches(e.schedule)&&deadlineMatches(e.schedule));}

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
  if(stateFilter.status==='completed')parts.push('Construction Completed');
  if(stateFilter.status==='pending')parts.push('Construction Pending');
  if(stateFilter.deadlineMode==='month')parts.push(monthLabel(stateFilter.month));
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
  var label='Export Units';
  if(stateFilter.status==='completed')label='Export Completed Construction';
  else if(stateFilter.status==='pending')label='Export Pending Construction';
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
      '<p class="filter-group-label sb-construction-status-label">During Construction Payment</p><div class="chips">'+
      chip('All','data-sb-construction-status','all',stateFilter.status==='all')+
      chip('Completed — Final Remaining','data-sb-construction-status','completed',stateFilter.status==='completed')+
      chip('Not Completed','data-sb-construction-status','pending',stateFilter.status==='pending')+
      '</div>'+
      '<p class="filter-group-label sb-construction-status-label">Construction Deadline</p><div class="sb-construction-deadline-row"><div class="chips">'+
      chip('Any Date','data-sb-construction-deadline','all',stateFilter.deadlineMode==='all')+
      chip('Specific Month','data-sb-construction-deadline','month',stateFilter.deadlineMode==='month')+
      '</div><input id="sbConstructionCompletionMonth" class="sb-construction-month" type="month" value="'+stateFilter.month+'" '+(stateFilter.deadlineMode==='month'?'':'disabled')+' aria-label="Construction deadline month"></div>'+
      '<p class="sb-construction-hint'+(isLoading?' sb-construction-loading':'')+'">'+(isLoading?'Loading payment-plan status…':'Completed means every property installment before the final installment is settled within the AED 1,000 tolerance; DLD/Admin fees and penalties are excluded.')+'</p>';
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
  if(!reportIndex){var loading=previousRenderList.apply(this,arguments);enhanceFilterUI(true,originalTotal);loadReportIndex(false).then(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();}).catch(function(err){console.warn('Construction completion filter load failed',err);});return loading;}
  var all=state.dues,subset=all.filter(matchesCustomer),out;state.dues=subset;try{out=previousRenderList.apply(this,arguments);}finally{state.dues=all;}enhanceFilterUI(false,originalTotal);return out;
}
wrappedRenderList.__sunblissConstructionCompletionWrapped=true;
window.renderList=wrappedRenderList;

async function exportConstructionStatus(rows){
  if(!window.ExcelJS)throw new Error('Spreadsheet library did not load — check your connection and try again.');
  await loadReportIndex(true);
  var exportRows=[];(rows||[]).forEach(function(item){var c=item&&item.c?item.c:item;if(!c)return;var e=customerEntry(c);if(e&&planMatches(e.schedule)&&statusMatches(e.schedule)&&deadlineMatches(e.schedule))exportRows.push(e);});
  if(!exportRows.length)throw new Error('No customers match the selected construction-payment filters.');
  exportRows.sort(function(a,b){var ap=a.schedule.planTarget,bp=b.schedule.planTarget;if(ap!==bp)return ap-bp;return norm(a.customer.unit).localeCompare(norm(b.customer.unit),undefined,{numeric:true});});

  var wb=new ExcelJS.Workbook();wb.creator=(window.state&&state.branding&&state.branding.name)||'Sunbliss Residences';wb.created=new Date();
  var ws=wb.addWorksheet('Construction Payment Status',{views:[{state:'frozen',ySplit:1}]});
  ws.columns=[
    {header:'Unit',key:'unit',width:12},{header:'Customer',key:'customer',width:32},{header:'Payment Plan',key:'plan',width:14},{header:'Construction Status',key:'status',width:30},
    {header:'Property Price (AED)',key:'price',width:23},{header:'Property Cash Received (AED)',key:'cash',width:27},{header:'Paid % So Far',key:'paidPct',width:16},
    {header:'Required Before Final (AED)',key:'constructionDue',width:27},{header:'Construction Settled (AED)',key:'constructionSettled',width:26},{header:'Construction Balance (AED)',key:'constructionBalance',width:26},
    {header:'Final Installment (AED)',key:'finalDueAmount',width:23},{header:'Final Balance (AED)',key:'finalBalance',width:22},{header:'Last Construction Due',key:'lastConstructionDue',width:22},{header:'Final Due',key:'finalDue',width:19}
  ];
  ws.autoFilter={from:{row:1,column:1},to:{row:1,column:14}};
  var header=ws.getRow(1);header.height=22;header.eachCell(function(cell){cell.font={bold:true,color:{argb:'FFEDE6D6'},size:11};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}};cell.alignment={vertical:'middle',wrapText:true};cell.border={bottom:{style:'medium',color:{argb:'FF16232F'}}};});
  exportRows.forEach(function(e){
    var s=e.schedule,c=e.customer,row=ws.addRow({unit:c.unit||'',customer:nice(c.name),plan:s.planLabel,status:s.completionLabel,price:e.price,cash:e.cash,paidPct:e.price>0?e.cash/e.price:0,constructionDue:s.constructionAmount,constructionSettled:s.constructionSettled,constructionBalance:s.constructionBalance,finalDueAmount:s.finalAmount,finalBalance:s.finalBalance,lastConstructionDue:s.lastConstructionDue?(dateValue(s.lastConstructionDue)||s.lastConstructionDue):'',finalDue:s.finalDue?(dateValue(s.finalDue)||s.finalDue):''});
    ['price','cash','constructionDue','constructionSettled','constructionBalance','finalDueAmount','finalBalance'].forEach(function(key){row.getCell(key).numFmt='#,##0.00';});row.getCell('paidPct').numFmt='0.0%';
    ['lastConstructionDue','finalDue'].forEach(function(key){if(row.getCell(key).value instanceof Date)row.getCell(key).numFmt='dd mmm yyyy';});
    row.getCell('status').font={bold:true,color:{argb:s.completionCode==='completed'?'FF3F7A57':(s.completionCode==='pending'?'FFAE3B2B':'FF736C5C')}};
    row.getCell('constructionBalance').font={bold:true,color:{argb:s.completionCode==='pending'?'FFAE3B2B':'FF3F7A57'}};
    row.eachCell(function(cell){cell.border={bottom:{style:'thin',color:{argb:'FFDCD2B6'}}};});
  });
  var buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  var suffix=stateFilter.status==='completed'?'Completed':(stateFilter.status==='pending'?'Pending':'All');
  a.href=url;a.download='Sunbliss-Construction-Payment-'+suffix+'-'+new Date().toISOString().slice(0,10)+'.xlsx';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},30000);
}

window.exportFilteredList=async function(rows){if(filterActive())return exportConstructionStatus(rows);if(typeof previousExport==='function')return previousExport.apply(this,arguments);throw new Error('Export function is not available.');};
window.__sunblissRefreshConstructionCompletionReport=function(){reportIndex=null;return loadReportIndex(true).then(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();return true;});};

installStyles();
loadReportIndex(false).catch(function(){});
setTimeout(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();},0);
})();
