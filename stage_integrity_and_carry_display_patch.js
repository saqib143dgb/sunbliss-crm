(function(){
'use strict';
if(window.__sunblissStageIntegrityInstalled)return;
window.__sunblissStageIntegrityInstalled=true;

var cachedScheduleRows=[];
var refreshPromise=null;

function text(v){return v==null?'':String(v)}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}
function jsDate(v){if(!v)return null;var d=v instanceof Date?v:new Date(text(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?null:d}
function baseCodeFromName(name){
  var s=text(name).toLowerCase().replace(/instalment/g,'installment');
  if(s.indexOf('down')!==-1)return 'DP';
  if(s.indexOf('dld')!==-1||s.indexOf('admin fee')!==-1)return 'DLD';
  if(/\b1st\b|\bfirst\b/.test(s))return '1ST';
  if(/\b2nd\b|\bsecond\b/.test(s))return '2ND';
  if(/\b3rd\b|\bthird\b/.test(s))return '3RD';
  if(/\b4th\b|\bfourth\b/.test(s))return '4TH';
  if(/\b5th\b|\bfifth\b/.test(s))return '5TH';
  if(/\b6th\b|\bsixth\b/.test(s))return '6TH';
  if(/\b7th\b|\bseventh\b/.test(s))return '7TH';
  if(s.indexOf('final')!==-1||s.indexOf('handover')!==-1)return 'FIN';
  return null;
}
function stageBaseCode(stage){
  if(!stage)return null;
  if(stage.baseCode)return text(stage.baseCode).toUpperCase();
  var code=text(stage.code).toUpperCase();
  if(['DP','DLD','1ST','2ND','3RD','4TH','5TH','6TH','7TH','FIN'].indexOf(code)>=0)return code;
  return baseCodeFromName(stage.label||stage.stage_name);
}
function canonicalName(code){
  var map={DP:'Down Payment','1ST':'1st Installment',DLD:'DLD + Admin Fees (SPA)','2ND':'2nd Installment','3RD':'3rd Installment','4TH':'4th Installment','5TH':'5th Installment','6TH':'6th Installment','7TH':'7th Installment',FIN:'Final Installment (Handover)'};
  return map[code]||code;
}
function isCanonicalRow(row){
  var code=baseCodeFromName(row&&row.stage_name);
  if(!code)return false;
  return text(row.stage_name).trim().toLowerCase()===canonicalName(code).toLowerCase();
}
function splitStage(row,code){
  var due=row.due_amount==null?null:num(row.due_amount),paid=num(row.paid_amount);
  return {
    code:'SPLIT_'+code+'_'+row.id,
    baseCode:code,
    label:row.stage_name||canonicalName(code),
    id:row.id,
    scheduleId:row.id,
    due:due,
    dueDate:jsDate(row.due_date),
    paid:paid,
    cashPaid:paid,
    paidDate:jsDate(row.paid_date),
    outAmt:due==null?null:round2(due-paid),
    status:row.status||'',
    remarks:row.remarks||'',
    splitInstallment:true,
    extraInstallment:true
  };
}
function stageRank(stage){
  var fixed={DP:0,'1ST':10,DLD:15,'2ND':20,'3RD':30,'4TH':40,'5TH':50,'6TH':60,'7TH':70,FIN:10000};
  var code=stageBaseCode(stage);
  if(code&&fixed[code]!==undefined)return fixed[code];
  var m=text(stage&&stage.label).match(/^(\d+)(?:st|nd|rd|th)\s+Installment\b/i);
  if(m)return parseInt(m[1],10)*10;
  return 9000;
}
function allCustomers(){
  var out=[];
  if(!window.state)return out;
  [state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c)})});
  return out;
}
function unitId(c){return Number(c&&(c.unitId||c.dbUnitId||c.sno))||null}
function normalizeCustomerStages(c,rows){
  if(!c||!Array.isArray(c.stages)||!Array.isArray(rows))return;
  var byCode={};
  rows.forEach(function(row){var code=baseCodeFromName(row.stage_name);if(code)(byCode[code]=byCode[code]||[]).push(row)});

  var stages=c.stages.slice();
  Object.keys(byCode).forEach(function(code){
    var group=byCode[code].slice().sort(function(a,b){return text(a.due_date).localeCompare(text(b.due_date))||Number(a.id)-Number(b.id)});
    var split=group.length>1||group.some(function(row){return !isCanonicalRow(row)});
    if(split){
      stages=stages.filter(function(stage){return stageBaseCode(stage)!==code});
      group.forEach(function(row){stages.push(splitStage(row,code))});
    }else{
      var row=group[0];
      var matches=stages.filter(function(stage){return stageBaseCode(stage)===code});
      var primary=matches.find(function(stage){return !stage.extraInstallment})||matches[0];
      stages=stages.filter(function(stage){
        if(stage===primary)return true;
        if(stageBaseCode(stage)!==code)return true;
        return Number(stage.id||stage.scheduleId)!==Number(row.id);
      });
      if(primary){
        primary.id=row.id;primary.scheduleId=row.id;
        primary.status=row.status||primary.status||'';
        primary.remarks=row.remarks||primary.remarks||'';
      }
    }
  });

  c.stages=stages.sort(function(a,b){
    var d=stageRank(a)-stageRank(b);if(d)return d;
    var ad=a&&a.dueDate?new Date(a.dueDate).getTime():Number.MAX_SAFE_INTEGER;
    var bd=b&&b.dueDate?new Date(b.dueDate).getTime():Number.MAX_SAFE_INTEGER;
    return ad-bd;
  });
}
function normalizeAll(){
  if(!cachedScheduleRows.length)return;
  var byUnit={};
  cachedScheduleRows.forEach(function(row){(byUnit[text(row.unit_id)]=byUnit[text(row.unit_id)]||[]).push(row)});
  allCustomers().forEach(function(c){var uid=unitId(c);if(uid)normalizeCustomerStages(c,byUnit[text(uid)]||[])});
}
async function fetchScheduleRows(){
  if(!window.sb)return [];
  var r=await sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,paid_amount,paid_date,status,remarks');
  if(r.error)throw r.error;
  cachedScheduleRows=r.data||[];
  normalizeAll();
  return cachedScheduleRows;
}

function stablePortfolioStats(){
  var totalSales=0,totalReceived=0,totalOutstanding=0;
  var spaCounts={signed:0,drafted:0,none:0};
  var oqoodCounts={completed:0,pending:0,other:0,none:0};
  var furnitureCounts={furnished:0,unfurnished:0};
  var mixMap={},stageMap={};
  var today=new Date();today.setHours(0,0,0,0);
  var overdueAmount=0,overdueUnits=0;
  var dues=window.state&&Array.isArray(state.dues)?state.dues:[];

  dues.forEach(function(c){
    totalSales+=num(c.total);totalReceived+=num(c.received);totalOutstanding+=num(c.outstanding);
    var spa=text(c.spa).toLowerCase();if(spa==='signed')spaCounts.signed++;else if(spa==='drafted')spaCounts.drafted++;else spaCounts.none++;
    var oq=text(c.oqood).toLowerCase();if(oq==='completed')oqoodCounts.completed++;else if(oq==='pending')oqoodCounts.pending++;else if(oq)oqoodCounts.other++;else oqoodCounts.none++;
    if(text(c.furniture).toLowerCase()==='signed')furnitureCounts.furnished++;else furnitureCounts.unfurnished++;
    var mixKey=typeof window.unitTypeKey==='function'?unitTypeKey(c):text(c.type||'Other');
    if(!mixMap[mixKey])mixMap[mixKey]={label:mixKey,count:0,value:0};
    mixMap[mixKey].count++;mixMap[mixKey].value+=num(c.total);

    var hasOverdue=false;
    (c.stages||[]).forEach(function(stage){
      if(!stage||stage.due===null||stage.due===undefined)return;
      var due=num(stage.due),received=num(stage.settledAmount!==undefined?stage.settledAmount:stage.paid);
      var label=text(stage.label||canonicalName(stageBaseCode(stage))||'Installment');
      var key=label.toLowerCase();
      if(!stageMap[key])stageMap[key]={label:label,count:0,due:0,received:0,rank:stageRank(stage)};
      stageMap[key].count++;stageMap[key].due+=due;stageMap[key].received+=received;
      var remaining=round2(due-received),dd=stage.dueDate?new Date(stage.dueDate):null;
      if(remaining>1&&dd&&!isNaN(dd.getTime())&&dd.getTime()<today.getTime()){
        overdueAmount+=remaining;hasOverdue=true;
      }
    });
    if(hasOverdue)overdueUnits++;
  });

  var mix=Object.keys(mixMap).map(function(k){return mixMap[k]}).sort(function(a,b){return text(a.label).localeCompare(text(b.label),undefined,{numeric:true})});
  var stageBreakdown=Object.keys(stageMap).map(function(k){var s=stageMap[k];return{label:s.label,count:s.count,due:s.due,received:s.received,balance:s.received-s.due,rank:s.rank}})
    .sort(function(a,b){return a.rank-b.rank||text(a.label).localeCompare(text(b.label),undefined,{numeric:true})})
    .map(function(s){delete s.rank;return s});

  var withOutstanding=dues.slice().sort(function(a,b){return num(a.outstanding)-num(b.outstanding)});
  var topAtRisk=withOutstanding.filter(function(c){return c.outstanding!==null&&c.outstanding!==undefined&&num(c.outstanding)<-1}).slice(0,8);
  var activity=[];
  if(typeof window.matchTransactions==='function')dues.forEach(function(c){(matchTransactions(c)||[]).forEach(function(t){activity.push({date:t.date,name:c.name,unit:c.unit,sno:c.sno,towards:t.towards,amount:t.amount})})});
  activity.sort(function(a,b){if(!a.date&&!b.date)return 0;if(!a.date)return 1;if(!b.date)return-1;return b.date-a.date});
  var collectedPct=totalSales>0?Math.round((totalReceived/totalSales)*1000)/10:0;
  var outstandingPct=totalSales>0?Math.round((Math.abs(totalOutstanding)/totalSales)*1000)/10:0;
  return {units:dues.length,totalSales:totalSales,totalReceived:totalReceived,totalOutstanding:totalOutstanding,collectedPct:collectedPct,outstandingPct:outstandingPct,spaCounts:spaCounts,oqoodCounts:oqoodCounts,furnitureCounts:furnitureCounts,mix:mix,stageBreakdown:stageBreakdown,topAtRisk:topAtRisk,recentActivity:activity.slice(0,10),overdueAmount:overdueAmount,overdueUnits:overdueUnits};
}

function installPortfolioFix(){
  if(typeof window.portfolioStats==='function'){
    stablePortfolioStats.__sunblissStageSafe=true;
    window.portfolioStats=stablePortfolioStats;
  }
}
async function refreshIntegrity(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async function(){
    await fetchScheduleRows();
    normalizeAll();
    if(window.__sunblissCarryForwardApi&&typeof window.__sunblissCarryForwardApi.enrich==='function')await window.__sunblissCarryForwardApi.enrich();
    if(window.__sunblissCarryForwardAuditFix&&typeof window.__sunblissCarryForwardAuditFix.refresh==='function')await window.__sunblissCarryForwardAuditFix.refresh();
    normalizeAll();
    return true;
  })();
  return refreshPromise.then(function(v){refreshPromise=null;return v},function(e){refreshPromise=null;throw e});
}
function wrapRender(name){
  var base=window[name];
  if(typeof base!=='function'||base.__sunblissStageIntegrityWrapped)return;
  var wrapped=function(){normalizeAll();return base.apply(this,arguments)};
  wrapped.__sunblissStageIntegrityWrapped=true;
  window[name]=wrapped;
}
function install(){
  if(!window.state||!window.sb||typeof window.loadFromSupabase!=='function'){
    setTimeout(install,40);return;
  }
  installPortfolioFix();
  wrapRender('renderMain');wrapRender('renderDetail');wrapRender('renderOverview');wrapRender('renderInsights');wrapRender('renderList');
  var baseLoad=window.loadFromSupabase;
  if(!baseLoad.__sunblissStageIntegrityLoad){
    var wrappedLoad=async function(){
      var out=await baseLoad.apply(this,arguments);
      try{
        await refreshIntegrity();
        if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain();
      }catch(err){console.warn('[Sunbliss] stage integrity refresh failed',err)}
      return out;
    };
    wrappedLoad.__sunblissStageIntegrityLoad=true;
    window.loadFromSupabase=wrappedLoad;
  }
  refreshIntegrity().then(function(){if(state.view&&state.view!=='empty'&&typeof window.renderMain==='function')window.renderMain()}).catch(function(err){console.warn('[Sunbliss] stage integrity initialization failed',err)});
}
install();
})();
