(function(){
'use strict';
if(window.__sunblissPaymentMilestoneFilterV2Installed)return;
window.__sunblissPaymentMilestoneFilterV2Installed=true;

var filterState=window.__sunblissPaymentMilestoneFilterState||{target:null,month:'2026-12',position:'all'};
window.__sunblissPaymentMilestoneFilterState=filterState;

var milestoneIndex=null;
var milestoneIndexPromise=null;
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
function isVoidedTransaction(t){return /(bounce|bounced|refund|refunded|revers|void|deleted|uncleared\s*pdc|credit\s*note|carry\s*forward)/i.test([t&&t.payment_type,t&&t.payment_reference,t&&t.remarks].join(' '));}
function isOtherCash(t){return /(dld|admin|registration|penalt|late\s*fee|late\s*charge|other\s*fee)/i.test(text(t&&t.payment_type));}
function active(){return filterState.target==='40'||filterState.target==='50'||filterState.target==='both';}
function targetList(){if(filterState.target==='40')return [40];if(filterState.target==='50')return [50];if(filterState.target==='both')return [40,50];return [];}
function targetLabel(){if(filterState.target==='40')return '40%';if(filterState.target==='50')return '50%';if(filterState.target==='both')return '40% or 50%';return '';}
function monthLabel(value){var m=/^(\d{4})-(\d{2})$/.exec(text(value));if(!m)return text(value)||'Selected month';var d=new Date(Number(m[1]),Number(m[2])-1,1);return d.toLocaleDateString(undefined,{month:'short',year:'numeric'});}
function positionMatches(paidPct,target){if(filterState.position==='below')return paidPct+0.0001<target;if(filterState.position==='reached')return paidPct+0.0001>=target;return true;}

function makeScheduleMeta(rows,unitNo,customerId){
  rows=rows.slice().sort(function(a,b){var ad=effectiveDateText(a)||'9999-12-31',bd=effectiveDateText(b)||'9999-12-31';return ad.localeCompare(bd)||num(a&&a.id)-num(b&&b.id);});
  var totalScheduled=round2(rows.reduce(function(sum,row){return sum+num(row.due_amount);},0));
  var cumulative=0,milestones={40:null,50:null},maxId=0;
  rows.forEach(function(row){
    maxId=Math.max(maxId,num(row.id));
    cumulative=round2(cumulative+num(row.due_amount));
    [40,50].forEach(function(target){
      if(milestones[target]||totalScheduled<=0)return;
      if(cumulative+0.01>=totalScheduled*(target/100)){
        var due=effectiveDateText(row);
        if(due)milestones[target]={target:target,dueDate:due,cumulativeDue:cumulative,scheduleId:row.id};
      }
    });
  });
  return {unitNo:unitNo,customerId:customerId,totalScheduled:totalScheduled,milestones:milestones,maxId:maxId};
}

async function loadMilestoneIndex(force){
  if(!window.sb)throw new Error('CRM data connection is not ready. Please refresh and try again.');
  if(milestoneIndex&&!force)return milestoneIndex;
  if(milestoneIndexPromise)return milestoneIndexPromise;
  milestoneIndexPromise=(async function(){
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
      scheduleByPair[key]=meta;
      var fk=fallbackKey(unitNo,customerNameById[text(customerId)]||'');
      if(fk!=='|'&&fk.indexOf('|')!==fk.length-1)scheduleByFallback[fk]=meta;
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

    milestoneIndex={
      unitNoById:unitNoById,
      scheduleByPair:scheduleByPair,
      scheduleByFallback:scheduleByFallback,
      scheduleByUnit:scheduleByUnit,
      saleByPair:saleByPair,
      saleByFallback:saleByFallback,
      saleByUnit:saleByUnit,
      cashByPair:cashByPair,
      cashByUnit:cashByUnit,
      unassignedCashByUnit:unassignedCashByUnit,
      loadedAt:Date.now()
    };
    return milestoneIndex;
  })().finally(function(){milestoneIndexPromise=null;});
  return milestoneIndexPromise;
}

function resolveSchedule(customer){
  if(!milestoneIndex||!customer)return null;
  var unitId=unitIdOf(customer),customerId=customerIdOf(customer),unitNo=text(customer.unit),name=text(customer.name);
  var hit=null;
  if(unitId!==null&&customerId!==null)hit=milestoneIndex.scheduleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=milestoneIndex.scheduleByFallback[fallbackKey(unitNo,name)];
  if(!hit)hit=milestoneIndex.scheduleByUnit[norm(unitNo)];
  return hit||null;
}
function resolveSale(customer,schedule){
  var unitId=unitIdOf(customer)||(schedule&&Object.keys(milestoneIndex.unitNoById).find(function(id){return norm(milestoneIndex.unitNoById[id])===norm(customer.unit);}))||null;
  var customerId=customerIdOf(customer),unitNo=text(customer.unit),name=text(customer.name),hit=null;
  if(unitId!==null&&customerId!==null)hit=milestoneIndex.saleByPair[pairKey(unitId,customerId)];
  if(!hit)hit=milestoneIndex.saleByFallback[fallbackKey(unitNo,name)];
  if(!hit)hit=milestoneIndex.saleByUnit[norm(unitNo)];
  return hit||{unitId:unitId,customerId:customerId,commercialPrice:0};
}
function customerMeta(customer){
  var schedule=resolveSchedule(customer);if(!schedule)return null;
  var sale=resolveSale(customer,schedule),unitId=unitIdOf(customer)||sale.unitId,customerId=customerIdOf(customer)||sale.customerId;
  var price=sale.commercialPrice>0?sale.commercialPrice:(num(customer.total)>0?num(customer.total):schedule.totalScheduled);
  var cash=0;
  if(unitId!==null&&customerId!==null){var pk=pairKey(unitId,customerId);if(Object.prototype.hasOwnProperty.call(milestoneIndex.cashByPair,pk))cash=milestoneIndex.cashByPair[pk]+num(milestoneIndex.unassignedCashByUnit[text(unitId)]);else cash=num(milestoneIndex.cashByUnit[text(unitId)]);}
  else if(unitId!==null)cash=num(milestoneIndex.cashByUnit[text(unitId)]);
  var paidPct=price>0?cash/price*100:0;
  return {schedule:schedule,price:round2(price),cash:round2(cash),paidPct:paidPct};
}
function matchingEntries(customer){
  var cm=customerMeta(customer);if(!cm||!active())return [];
  return targetList().map(function(target){
    var milestone=cm.schedule.milestones[target];
    if(!milestone||milestone.dueDate.slice(0,7)!==filterState.month)return null;
    if(!positionMatches(cm.paidPct,target))return null;
    return {target:target,dueDate:milestone.dueDate,price:cm.price,cash:cm.cash,paidPct:cm.paidPct,required:round2(cm.price*target/100),shortfall:round2(Math.max(0,cm.price*target/100-cm.cash)),status:cm.paidPct+0.0001>=target?'Target Reached':'Below Target'};
  }).filter(Boolean);
}
function matchesCustomer(customer){return matchingEntries(customer).length>0;}

function installStyles(){
  if(document.getElementById('sbPaymentMilestoneFilterStyleV2'))return;
  var style=document.createElement('style');style.id='sbPaymentMilestoneFilterStyleV2';style.textContent=[
    '.sb-milestone-filter-group{border-top:1px solid var(--paper-line);padding-top:13px;margin-top:2px;}',
    '.sb-milestone-month-wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 12px;}',
    '.sb-milestone-month-label{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);}',
    '.sb-milestone-month{min-width:142px;max-width:175px;height:38px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper);color:var(--ink);font:600 12px Inter,sans-serif;padding:0 9px;outline:none;}',
    '.sb-milestone-month:focus{border-color:var(--gold-deep);box-shadow:0 0 0 2px rgba(143,106,30,.10);}',
    '.sb-milestone-sub-label{margin-top:11px!important;}',
    '.sb-milestone-hint{margin:9px 0 0;font-size:10.5px;line-height:1.45;color:var(--muted);}',
    '.sb-milestone-loading{color:var(--gold-deep);font-weight:600;}',
    '@media(max-width:420px){.sb-milestone-month-wrap{align-items:flex-start;flex-direction:column;gap:6px}.sb-milestone-month{width:100%;max-width:none}}'
  ].join('');document.head.appendChild(style);
}
function chip(label,attr,value,pressed){return '<button type="button" class="chip" '+attr+'="'+value+'" aria-pressed="'+(pressed?'true':'false')+'">'+label+'</button>';}
function ensureActivePill(controls,toggle){
  var existing=controls.querySelector('.sb-milestone-active-pill');
  if(!active()){if(existing)existing.remove();var empty=controls.querySelector('.active-pills');if(empty&&!empty.querySelector('.active-pill'))empty.remove();return;}
  var wrap=controls.querySelector('.active-pills');if(!wrap){wrap=document.createElement('div');wrap.className='active-pills';toggle.parentNode.insertBefore(wrap,toggle);}
  if(!existing){existing=document.createElement('button');existing.type='button';existing.className='active-pill sb-milestone-active-pill';wrap.appendChild(existing);}
  existing.innerHTML='Milestone '+targetLabel()+' · '+monthLabel(filterState.month)+'<span class="x">&times;</span>';
  existing.onclick=function(){filterState.target=null;filterState.position='all';window.renderList();};
}
function enhanceFilterUI(isLoading,originalTotal){
  var controls=document.querySelector('.controls');if(!controls)return;var toggle=controls.querySelector('#btnToggleFilters');if(!toggle)return;
  ensureActivePill(controls,toggle);
  var toggleLeft=toggle.querySelector('.filter-toggle-left');
  if(active()&&toggleLeft){var badge=toggleLeft.querySelector('.filter-badge');if(badge)badge.textContent=String((parseInt(badge.textContent,10)||0)+1);else{badge=document.createElement('span');badge.className='filter-badge';badge.textContent='1';toggleLeft.appendChild(document.createTextNode(' '));toggleLeft.appendChild(badge);}}
  var panel=controls.querySelector('.filter-panel');
  if(panel&&!panel.querySelector('.sb-milestone-filter-group')){
    var group=document.createElement('div');group.className='filter-group sb-milestone-filter-group';
    group.innerHTML='<p class="filter-group-label">Payment Milestone</p><div class="chips">'+chip('40%','data-sb-milestone-target','40',filterState.target==='40')+chip('50%','data-sb-milestone-target','50',filterState.target==='50')+chip('40% or 50%','data-sb-milestone-target','both',filterState.target==='both')+'</div><div class="sb-milestone-month-wrap"><span class="sb-milestone-month-label">Due month</span><input class="sb-milestone-month" id="sbMilestoneMonth" type="month" value="'+filterState.month+'" aria-label="Payment milestone due month"></div><p class="filter-group-label sb-milestone-sub-label">Payment Position</p><div class="chips">'+chip('All','data-sb-milestone-position','all',filterState.position==='all')+chip('Below Target','data-sb-milestone-position','below',filterState.position==='below')+chip('Target Reached','data-sb-milestone-position','reached',filterState.position==='reached')+'</div><p class="sb-milestone-hint'+(isLoading?' sb-milestone-loading':'')+'">'+(isLoading?'Loading milestone schedule…':'Export Units will export this filtered milestone list.')+'</p>';
    var clear=panel.querySelector('#btnClearFilters');panel.insertBefore(group,clear||null);
    group.querySelectorAll('[data-sb-milestone-target]').forEach(function(btn){btn.addEventListener('click',function(){var value=btn.getAttribute('data-sb-milestone-target');filterState.target=filterState.target===value?null:value;if(filterState.target)loadMilestoneIndex(true).catch(function(){});window.renderList();});});
    group.querySelectorAll('[data-sb-milestone-position]').forEach(function(btn){btn.addEventListener('click',function(){filterState.position=btn.getAttribute('data-sb-milestone-position')||'all';window.renderList();});});
    var monthInput=group.querySelector('#sbMilestoneMonth');if(monthInput)monthInput.addEventListener('change',function(){if(/^\d{4}-\d{2}$/.test(monthInput.value))filterState.month=monthInput.value;window.renderList();});
  }
  var clearAll=panel&&panel.querySelector('#btnClearFilters');if(clearAll&&!clearAll.__sbMilestoneCapture){clearAll.__sbMilestoneCapture=true;clearAll.addEventListener('click',function(){filterState.target=null;filterState.position='all';},true);}
  if(panel&&active()&&!clearAll&&!panel.querySelector('#btnClearMilestoneOnlyFilters')){var clearOnly=document.createElement('button');clearOnly.className='btn-clear-filters';clearOnly.id='btnClearMilestoneOnlyFilters';clearOnly.textContent='Clear all filters';clearOnly.addEventListener('click',function(){filterState.target=null;filterState.position='all';if(window.state)state.filtersExpanded=false;window.renderList();});panel.appendChild(clearOnly);}
  if(active()&&typeof originalTotal==='number'){var result=controls.querySelector('.result-count');if(result)result.textContent=result.textContent.replace(/^(\d+) of \d+ units/,function(_m,count){return count+' of '+originalTotal+' units';});}
}
function wrappedRenderList(){
  if(typeof previousRenderList!=='function')return;var originalTotal=window.state&&Array.isArray(state.dues)?state.dues.length:0;
  if(!active()){var plain=previousRenderList.apply(this,arguments);enhanceFilterUI(false,originalTotal);return plain;}
  if(!milestoneIndex){var loading=previousRenderList.apply(this,arguments);enhanceFilterUI(true,originalTotal);loadMilestoneIndex(false).then(function(){if(active()&&typeof window.renderList==='function')window.renderList();}).catch(function(err){console.warn('Milestone filter load failed',err);});return loading;}
  var all=state.dues,subset=all.filter(matchesCustomer),out;state.dues=subset;try{out=previousRenderList.apply(this,arguments);}finally{state.dues=all;}enhanceFilterUI(false,originalTotal);return out;
}
window.renderList=wrappedRenderList;

async function exportMilestones(rows){
  if(!window.ExcelJS)throw new Error('Spreadsheet library did not load — check your connection and try again.');
  await loadMilestoneIndex(true);
  var exportRows=[];
  (rows||[]).forEach(function(item){
    var c=item&&item.c?item.c:item;if(!c)return;var entries=matchingEntries(c);if(!entries.length)return;
    entries.sort(function(a,b){return a.target-b.target;});
    var highest=entries[entries.length-1],targets=entries.map(function(e){return e.target+'%';});
    exportRows.push({c:c,entries:entries,highest:highest,targetText:targets.join(' & ')});
  });
  if(!exportRows.length)throw new Error('No milestone clients match the selected filters.');
  exportRows.sort(function(a,b){return a.highest.dueDate.localeCompare(b.highest.dueDate)||norm(a.c.unit).localeCompare(norm(b.c.unit),undefined,{numeric:true});});

  var wb=new ExcelJS.Workbook();wb.creator=(window.state&&state.branding&&state.branding.name)||'Sunbliss Residences';wb.created=new Date();
  var ws=wb.addWorksheet('Payment Milestones',{views:[{state:'frozen',ySplit:1}]});
  ws.columns=[
    {header:'Unit',key:'unit',width:12},{header:'Client',key:'client',width:30},{header:'Actual Property Price (AED)',key:'price',width:25},{header:'Milestone(s)',key:'milestone',width:18},{header:'40% Due Date',key:'due40',width:17},{header:'50% Due Date',key:'due50',width:17},{header:'Property Cash Received (AED)',key:'cash',width:27},{header:'Paid % So Far',key:'paidPct',width:17},{header:'Required by Month (AED)',key:'required',width:25},{header:'Shortfall by Month (AED)',key:'shortfall',width:25},{header:'Position',key:'position',width:18}
  ];
  ws.autoFilter={from:{row:1,column:1},to:{row:1,column:11}};
  var header=ws.getRow(1);header.height=22;header.eachCell(function(cell){cell.font={bold:true,color:{argb:'FFEDE6D6'},size:11};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}};cell.alignment={vertical:'middle'};cell.border={bottom:{style:'medium',color:{argb:'FF16232F'}}};});
  exportRows.forEach(function(item){
    var e40=item.entries.find(function(e){return e.target===40;}),e50=item.entries.find(function(e){return e.target===50;}),h=item.highest,c=item.c;
    var row=ws.addRow({unit:c.unit||'',client:nice(c.name),price:h.price,milestone:item.targetText,due40:e40?(dateValue(e40.dueDate)||e40.dueDate):'',due50:e50?(dateValue(e50.dueDate)||e50.dueDate):'',cash:h.cash,paidPct:h.price>0?h.cash/h.price:0,required:h.required,shortfall:h.shortfall,position:h.status});
    ['due40','due50'].forEach(function(key){if(row.getCell(key).value instanceof Date)row.getCell(key).numFmt='dd mmm yyyy';});
    ['price','cash','required','shortfall'].forEach(function(key){row.getCell(key).numFmt='#,##0.00';});row.getCell('paidPct').numFmt='0.0%';row.getCell('shortfall').font={bold:true,color:{argb:h.shortfall>0.01?'FFAE3B2B':'FF3F7A57'}};row.getCell('position').font={bold:true,color:{argb:h.status==='Target Reached'?'FF3F7A57':'FF9C5A12'}};row.eachCell(function(cell){cell.border={bottom:{style:'thin',color:{argb:'FFDCD2B6'}}};});
  });
  var buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Sunbliss-Payment-Milestones-'+filterState.month+'.xlsx';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url);},30000);
}
window.exportFilteredList=async function(rows){if(active())return exportMilestones(rows);if(typeof previousExport==='function')return previousExport.apply(this,arguments);throw new Error('Export function is not available.');};

installStyles();loadMilestoneIndex(false).catch(function(){});setTimeout(function(){if(typeof window.renderList==='function'&&window.state&&state.view==='list')window.renderList();},0);
})();
