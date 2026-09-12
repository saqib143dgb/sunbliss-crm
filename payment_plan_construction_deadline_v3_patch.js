(function(){
'use strict';
if(window.__sunblissConstructionPlanDeadlineV3Installed)return;
window.__sunblissConstructionPlanDeadlineV3Installed=true;

var filterState=window.__sunblissPaymentMilestoneFilterState||{target:null,month:'2026-12',position:'all'};
window.__sunblissPaymentMilestoneFilterState=filterState;
if(!filterState.month)filterState.month='2026-12';
if(!filterState.position)filterState.position='all';

var reportIndex=null;
var reportIndexPromise=null;
var previousExport=window.exportFilteredList;
var previousRenderList=window.renderList;

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
function active(){return filterState.target==='40'||filterState.target==='50'||filterState.target==='both';}
function targetMatches(planTarget){if(filterState.target==='both')return planTarget===40||planTarget===50;return Number(filterState.target)===planTarget;}
function targetLabel(){if(filterState.target==='40')return '40/60';if(filterState.target==='50')return '50/50';if(filterState.target==='both')return '40/60 or 50/50';return '';}
function monthLabel(value){var m=/^(\d{4})-(\d{2})$/.exec(text(value));if(!m)return text(value)||'Selected month';var d=new Date(Number(m[1]),Number(m[2])-1,1);return d.toLocaleDateString(undefined,{month:'short',year:'numeric'});}
function positionMatches(paidPct,target){if(filterState.position==='below')return paidPct+0.0001<target;if(filterState.position==='reached')return paidPct+0.0001>=target;return true;}
function classifyPlan(pct){if(Math.abs(pct-40)<=1)return 40;if(Math.abs(pct-50)<=1)return 50;return null;}
function latestDated(rows){
  var dated=(rows||[]).map(function(r){return {row:r,date:effectiveDateText(r)};}).filter(function(x){return !!x.date;});
  dated.sort(function(a,b){return b.date.localeCompare(a.date)||num(b.row&&b.row.id)-num(a.row&&a.row.id);});
  return dated.length?dated[0]:null;
}

function makeScheduleMeta(rows,unitNo,customerId){
  rows=(rows||[]).filter(isPropertySchedule);
  if(!rows.length)return null;
  var totalScheduled=round2(rows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var finalRows=rows.filter(isFinalStage);
  var constructionRows=rows.filter(function(r){return !isFinalStage(r);});
  if(totalScheduled<=0||!finalRows.length||!constructionRows.length)return null;
  var finalAmount=round2(finalRows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var constructionAmount=round2(constructionRows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var constructionPct=totalScheduled>0?constructionAmount/totalScheduled*100:0;
  var planTarget=classifyPlan(constructionPct);
  if(!planTarget)return null;
  var finalDated=latestDated(finalRows);
  var lastConstruction=latestDated(constructionRows);
  var deadline=finalDated?finalDated.date:(lastConstruction?lastConstruction.date:'');
  if(!deadline)return null;
  var maxId=rows.reduce(function(m,row){return Math.max(m,num(row&&row.id));},0);
  return {
    unitNo:unitNo,
    customerId:customerId,
    totalScheduled:totalScheduled,
    finalAmount:finalAmount,
    constructionAmount:constructionAmount,
    constructionPct:constructionPct,
    planTarget:planTarget,
    planLabel:planTarget===40?'40/60':'50/50',
    finalDue:finalDated?finalDated.date:'',
    finalStageName:finalDated?text(finalDated.row.stage_name):(finalRows[0]?text(finalRows[0].stage_name):'Final Installment'),
    lastConstructionDue:lastConstruction?lastConstruction.date:'',
    lastConstructionStage:lastConstruction?text(lastConstruction.row.stage_name):'',
    deadline:deadline,
    deadlineSource:finalDated?'Final Installment':'Last Construction Installment',
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
      sb.from('payment_schedule').select('id,unit_id,customer_id,stage_name,due_amount,due_date,revised_due_date').order('id',{ascending:true}),
      sb.from('sales').select('id,unit_id,customer_id,booking_date,commercial_sale_price').order('booking_date',{ascending:true}).order('id',{ascending:true}),
      sb.from('payment_transactions').select('unit_id,customer_id,amount,payment_type,payment_reference,remarks')
    ]);
    results.forEach(function(r){if(r.error)throw r.error;});

    var unitNoById={},customerNameById={};
    (results[0].data||[]).forEach(function(u){unitNoById[text(u.id)]=text(u.unit_no).trim();});
    (results[1].data||[]).forEach(function(c){customerNameById[text(c.id)]=text(c.customer_name).trim();});

    var scheduleRowsByPair={},scheduleByPair={},scheduleByFallback={},scheduleByUnit={};
    (results[2].data||[]).forEach(function(row){
      if(!isPropertySchedule(row))return;
      var key=pairKey(row.unit_id,row.customer_id);
      if(!scheduleRowsByPair[key])scheduleRowsByPair[key]=[];
      scheduleRowsByPair[key].push(row);
    });
    Object.keys(scheduleRowsByPair).forEach(function(key){
      var rows=scheduleRowsByPair[key],sample=rows[0]||{},unitNo=unitNoById[text(sample.unit_id)]||'',customerId=sample.customer_id;
      if(!unitNo)return;
      var meta=makeScheduleMeta(rows,unitNo,customerId);
      if(!meta)return;
      scheduleByPair[key]=meta;
      var customerName=customerNameById[text(customerId)]||'';
      var fk=fallbackKey(unitNo,customerName);
      if(unitNo&&customerName)scheduleByFallback[fk]=meta;
      var uk=norm(unitNo),existing=scheduleByUnit[uk];
      if(!existing||meta.maxId>existing.maxId)scheduleByUnit[uk]=meta;
    });

    var saleByPair={},saleByFallback={},saleByUnit={};
    (results[3].data||[]).forEach(function(s){
      var unitNo=unitNoById[text(s.unit_id)]||'',customerName=customerNameById[text(s.customer_id)]||'';
      var entry={id:num(s.id),unitId:s.unit_id,customerId:s.customer_id,bookingDate:text(s.booking_date),commercialPrice:round2(s.commercial_sale_price)};
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
      if(t.customer_id!==null&&t.customer_id!==undefined){var pk=pairKey(t.unit_id,t.customer_id);cashByPair[pk]=round2((cashByPair[pk]||0)+amount);}
      else unassignedCashByUnit[uk]=round2((unassignedCashByUnit[uk]||0)+amount);
    });

    reportIndex={unitNoById:unitNoById,scheduleByPair:scheduleByPair,scheduleByFallback:scheduleByFallback,scheduleByUnit:scheduleByUnit,saleByPair:saleByPair,saleByFallback:saleByFallback,saleByUnit:saleByUnit,cashByPair:cashByPair,cashByUnit:cashByUnit,unassignedCashByUnit:unassignedCashByUnit,loadedAt:Date.now()};
    return reportIndex;
  })().finally(function(){reportIndexPromise=null;});
  return reportIndexPromise;
}

function resolveSchedule(customer){
  if(!reportIndex||!customer)return null;
  var unitId=unitIdOf(customer),customerId=customerIdOf(customer),unitNo=text(customer.unit),name=text(customer.name),hit=null;
  if(unitId!==null&&customerId!==null)hit=reportIndex.scheduleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=reportIndex.scheduleByFallback[fallbackKey(unitNo,name)];
  if(!hit)hit=reportIndex.scheduleByUnit[norm(unitNo)];
  return hit||null;
}
function resolveSale(customer,schedule){
  var unitId=unitIdOf(customer)||(schedule&&Object.keys(reportIndex.unitNoById).find(function(id){return norm(reportIndex.unitNoById[id])===norm(customer.unit);}))||null;
  var customerId=customerIdOf(customer),unitNo=text(customer.unit),name=text(customer.name),hit=null;
  if(unitId!==null&&customerId!==null)hit=reportIndex.saleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=reportIndex.saleByFallback[fallbackKey(unitNo,name)];
  if(!hit)hit=reportIndex.saleByUnit[norm(unitNo)];
  return hit||{unitId:unitId,customerId:customerId,commercialPrice:0};
}
function customerMeta(customer){
  var schedule=resolveSchedule(customer);if(!schedule)return null;
  var sale=resolveSale(customer,schedule),unitId=unitIdOf(customer)||sale.unitId,customerId=customerIdOf(customer)||sale.customerId;
  var price=sale.commercialPrice>0?sale.commercialPrice:(num(customer.total)>0?num(customer.total):schedule.totalScheduled);
  var cash=0;
  if(unitId!==null&&customerId!==null){
    var pk=pairKey(unitId,customerId);
    if(Object.prototype.hasOwnProperty.call(reportIndex.cashByPair,pk))cash=num(reportIndex.cashByPair[pk])+num(reportIndex.unassignedCashByUnit[text(unitId)]);
    else cash=num(reportIndex.cashByUnit[text(unitId)]);
  }else if(unitId!==null)cash=num(reportIndex.cashByUnit[text(unitId)]);
  var paidPct=price>0?cash/price*100:0;
  return {schedule:schedule,price:round2(price),cash:round2(cash),paidPct:paidPct};
}
function matchingEntry(customer){
  var cm=customerMeta(customer);if(!cm||!active())return null;
  var s=cm.schedule;
  if(!targetMatches(s.planTarget))return null;
  if(!s.deadline||s.deadline.slice(0,7)!==filterState.month)return null;
  if(!positionMatches(cm.paidPct,s.planTarget))return null;
  var required=round2(cm.price*s.planTarget/100);
  return {
    target:s.planTarget,
    planLabel:s.planLabel,
    constructionPct:s.constructionPct,
    deadline:s.deadline,
    deadlineSource:s.deadlineSource,
    finalDue:s.finalDue,
    finalStageName:s.finalStageName,
    lastConstructionDue:s.lastConstructionDue,
    lastConstructionStage:s.lastConstructionStage,
    price:cm.price,
    cash:cm.cash,
    paidPct:cm.paidPct,
    required:required,
    shortfall:round2(Math.max(0,required-cm.cash)),
    status:cm.paidPct+0.0001>=s.planTarget?'Construction Target Met':'Below Construction Target'
  };
}
function matchesCustomer(customer){return !!matchingEntry(customer);}

function installStyles(){
  if(document.getElementById('sbConstructionPlanDeadlineStyleV3'))return;
  var style=document.createElement('style');style.id='sbConstructionPlanDeadlineStyleV3';style.textContent=[
    '.sb-plan-deadline-group{border-top:1px solid var(--paper-line);padding-top:13px;margin-top:2px;}',
    '.sb-plan-deadline-month-wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 12px;}',
    '.sb-plan-deadline-month-label{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);}',
    '.sb-plan-deadline-month{min-width:142px;max-width:175px;height:38px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper);color:var(--ink);font:600 12px Inter,sans-serif;padding:0 9px;outline:none;}',
    '.sb-plan-deadline-month:focus{border-color:var(--gold-deep);box-shadow:0 0 0 2px rgba(143,106,30,.10);}',
    '.sb-plan-deadline-sub-label{margin-top:11px!important;}',
    '.sb-plan-deadline-hint{margin:9px 0 0;font-size:10.5px;line-height:1.45;color:var(--muted);}',
    '.sb-plan-deadline-loading{color:var(--gold-deep);font-weight:600;}',
    '@media(max-width:420px){.sb-plan-deadline-month-wrap{align-items:flex-start;flex-direction:column;gap:6px}.sb-plan-deadline-month{width:100%;max-width:none}}'
  ].join('');document.head.appendChild(style);
}
function chip(label,attr,value,pressed){return '<button type="button" class="chip" '+attr+'="'+value+'" aria-pressed="'+(pressed?'true':'false')+'">'+label+'</button>';}
function ensureActivePill(controls,toggle){
  var existing=controls.querySelector('.sb-plan-deadline-active-pill');
  if(!active()){if(existing)existing.remove();var empty=controls.querySelector('.active-pills');if(empty&&!empty.querySelector('.active-pill'))empty.remove();return;}
  var wrap=controls.querySelector('.active-pills');if(!wrap){wrap=document.createElement('div');wrap.className='active-pills';toggle.parentNode.insertBefore(wrap,toggle);}
  if(!existing){existing=document.createElement('button');existing.type='button';existing.className='active-pill sb-plan-deadline-active-pill';wrap.appendChild(existing);}
  existing.innerHTML='Plan '+targetLabel()+' · '+monthLabel(filterState.month)+'<span class="x">&times;</span>';
  existing.onclick=function(){filterState.target=null;filterState.position='all';window.renderList();};
}
function enhanceFilterUI(isLoading,originalTotal){
  var controls=document.querySelector('.controls');if(!controls)return;var toggle=controls.querySelector('#btnToggleFilters');if(!toggle)return;
  ensureActivePill(controls,toggle);
  var toggleLeft=toggle.querySelector('.filter-toggle-left');
  if(active()&&toggleLeft){var badge=toggleLeft.querySelector('.filter-badge');if(badge)badge.textContent=String((parseInt(badge.textContent,10)||0)+1);else{badge=document.createElement('span');badge.className='filter-badge';badge.textContent='1';toggleLeft.appendChild(document.createTextNode(' '));toggleLeft.appendChild(badge);}}
  var panel=controls.querySelector('.filter-panel');
  if(panel&&!panel.querySelector('.sb-plan-deadline-group')){
    var group=document.createElement('div');group.className='filter-group sb-plan-deadline-group';
    group.innerHTML=
      '<p class="filter-group-label">Payment Plan</p>'+ 
      '<div class="chips">'+
        chip('40/60','data-sb-plan-target','40',filterState.target==='40')+
        chip('50/50','data-sb-plan-target','50',filterState.target==='50')+
        chip('Both','data-sb-plan-target','both',filterState.target==='both')+
      '</div>'+ 
      '<div class="sb-plan-deadline-month-wrap"><span class="sb-plan-deadline-month-label">Construction deadline</span><input class="sb-plan-deadline-month" id="sbPlanDeadlineMonth" type="month" value="'+filterState.month+'" aria-label="Construction payment deadline month"></div>'+ 
      '<p class="filter-group-label sb-plan-deadline-sub-label">Payment Position</p>'+ 
      '<div class="chips">'+
        chip('All','data-sb-plan-position','all',filterState.position==='all')+
        chip('Below Target','data-sb-plan-position','below',filterState.position==='below')+
        chip('Target Met','data-sb-plan-position','reached',filterState.position==='reached')+
      '</div>'+ 
      '<p class="sb-plan-deadline-hint'+(isLoading?' sb-plan-deadline-loading':'')+'">'+(isLoading?'Loading payment plans…':'Includes a dated Final Installment in this month, or—when Final has no fixed date—the last dated construction installment in this month.')+'</p>';
    var clear=panel.querySelector('#btnClearFilters');panel.insertBefore(group,clear||null);
    group.querySelectorAll('[data-sb-plan-target]').forEach(function(btn){btn.addEventListener('click',function(){var value=btn.getAttribute('data-sb-plan-target');filterState.target=filterState.target===value?null:value;if(filterState.target)loadReportIndex(true).catch(function(){});window.renderList();});});
    group.querySelectorAll('[data-sb-plan-position]').forEach(function(btn){btn.addEventListener('click',function(){filterState.position=btn.getAttribute('data-sb-plan-position')||'all';window.renderList();});});
    var monthInput=group.querySelector('#sbPlanDeadlineMonth');if(monthInput)monthInput.addEventListener('change',function(){if(/^\d{4}-\d{2}$/.test(monthInput.value))filterState.month=monthInput.value;window.renderList();});
  }
  var clearAll=panel&&panel.querySelector('#btnClearFilters');
  if(clearAll&&!clearAll.__sbPlanDeadlineCapture){clearAll.__sbPlanDeadlineCapture=true;clearAll.addEventListener('click',function(){filterState.target=null;filterState.position='all';},true);}
  if(panel&&active()&&!clearAll&&!panel.querySelector('#btnClearPlanDeadlineFilters')){
    var clearOnly=document.createElement('button');clearOnly.className='btn-clear-filters';clearOnly.id='btnClearPlanDeadlineFilters';clearOnly.textContent='Clear all filters';
    clearOnly.addEventListener('click',function(){filterState.target=null;filterState.position='all';if(window.state)state.filtersExpanded=false;window.renderList();});panel.appendChild(clearOnly);
  }
  if(active()&&typeof originalTotal==='number'){
    var result=controls.querySelector('.result-count');if(result)result.textContent=result.textContent.replace(/^(\d+) of \d+ units/,function(_m,count){return count+' of '+originalTotal+' units';});
  }
}

function wrappedRenderList(){
  if(typeof previousRenderList!=='function')return;
  var originalTotal=window.state&&Array.isArray(state.dues)?state.dues.length:0;
  if(!active()){var plain=previousRenderList.apply(this,arguments);enhanceFilterUI(false,originalTotal);return plain;}
  if(!reportIndex){var loading=previousRenderList.apply(this,arguments);enhanceFilterUI(true,originalTotal);loadReportIndex(false).then(function(){if(active()&&typeof window.renderList==='function')window.renderList();}).catch(function(err){console.warn('Construction payment plan report load failed',err);});return loading;}
  var all=state.dues,subset=all.filter(matchesCustomer),out;
  state.dues=subset;
  try{out=previousRenderList.apply(this,arguments);}finally{state.dues=all;}
  enhanceFilterUI(false,originalTotal);
  return out;
}
wrappedRenderList.__sunblissConstructionPlanDeadlineWrapped=true;
window.renderList=wrappedRenderList;

async function exportConstructionPlan(rows){
  if(!window.ExcelJS)throw new Error('Spreadsheet library did not load — check your connection and try again.');
  await loadReportIndex(true);
  var exportRows=[];
  (rows||[]).forEach(function(item){var c=item&&item.c?item.c:item;if(!c)return;var e=matchingEntry(c);if(e)exportRows.push({c:c,e:e});});
  if(!exportRows.length)throw new Error('No clients match the selected payment plan and construction deadline.');
  exportRows.sort(function(a,b){return a.e.deadline.localeCompare(b.e.deadline)||norm(a.c.unit).localeCompare(norm(b.c.unit),undefined,{numeric:true});});

  var wb=new ExcelJS.Workbook();wb.creator=(window.state&&state.branding&&state.branding.name)||'Sunbliss Residences';wb.created=new Date();
  var ws=wb.addWorksheet('Construction Payment Plans',{views:[{state:'frozen',ySplit:1}]});
  ws.columns=[
    {header:'Unit',key:'unit',width:12},
    {header:'Client',key:'client',width:32},
    {header:'Payment Plan',key:'plan',width:16},
    {header:'Construction Payment %',key:'constructionPct',width:23},
    {header:'Construction Deadline',key:'deadline',width:22},
    {header:'Deadline Basis',key:'basis',width:28},
    {header:'Last Construction Installment',key:'lastConstruction',width:28},
    {header:'Final Installment Due',key:'finalDue',width:27},
    {header:'Actual Property Price (AED)',key:'price',width:25},
    {header:'Property Cash Received (AED)',key:'cash',width:27},
    {header:'Paid % So Far',key:'paidPct',width:17},
    {header:'Required Before Final (AED)',key:'required',width:26},
    {header:'Shortfall to Construction Target (AED)',key:'shortfall',width:32},
    {header:'Position',key:'position',width:26}
  ];
  ws.autoFilter={from:{row:1,column:1},to:{row:1,column:14}};
  var header=ws.getRow(1);header.height=22;header.eachCell(function(cell){cell.font={bold:true,color:{argb:'FFEDE6D6'},size:11};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}};cell.alignment={vertical:'middle',wrapText:true};cell.border={bottom:{style:'medium',color:{argb:'FF16232F'}}};});
  exportRows.forEach(function(rowData){
    var c=rowData.c,e=rowData.e;
    var row=ws.addRow({
      unit:c.unit||'',client:nice(c.name),plan:e.planLabel,constructionPct:e.constructionPct/100,
      deadline:dateValue(e.deadline)||e.deadline,basis:e.deadlineSource,
      lastConstruction:dateValue(e.lastConstructionDue)||e.lastConstructionDue||'',
      finalDue:e.finalDue?(dateValue(e.finalDue)||e.finalDue):'Offer of Possession / Not dated',
      price:e.price,cash:e.cash,paidPct:e.price>0?e.cash/e.price:0,required:e.required,shortfall:e.shortfall,position:e.status
    });
    ['deadline','lastConstruction'].forEach(function(key){if(row.getCell(key).value instanceof Date)row.getCell(key).numFmt='dd mmm yyyy';});
    if(row.getCell('finalDue').value instanceof Date)row.getCell('finalDue').numFmt='dd mmm yyyy';
    ['price','cash','required','shortfall'].forEach(function(key){row.getCell(key).numFmt='#,##0.00';});
    row.getCell('constructionPct').numFmt='0%';row.getCell('paidPct').numFmt='0.0%';
    row.getCell('shortfall').font={bold:true,color:{argb:e.shortfall>0.01?'FFAE3B2B':'FF3F7A57'}};
    row.getCell('position').font={bold:true,color:{argb:e.status==='Construction Target Met'?'FF3F7A57':'FF9C5A12'}};
    row.eachCell(function(cell){cell.border={bottom:{style:'thin',color:{argb:'FFDCD2B6'}}};});
  });
  var buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Sunbliss-Construction-Payment-Plans-'+filterState.month+'.xlsx';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},30000);
}

window.exportFilteredList=async function(rows){if(active())return exportConstructionPlan(rows);if(typeof previousExport==='function')return previousExport.apply(this,arguments);throw new Error('Export function is not available.');};
window.__sunblissRefreshConstructionPlanReport=function(){reportIndex=null;return loadReportIndex(true).then(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();return true;});};

installStyles();
loadReportIndex(false).catch(function(){});
setTimeout(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();},0);
})();
