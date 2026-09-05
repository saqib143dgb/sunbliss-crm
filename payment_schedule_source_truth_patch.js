(function(){
'use strict';
if(window.__sunblissPaymentScheduleSourceTruthInstalled)return;
window.__sunblissPaymentScheduleSourceTruthInstalled=true;

var TOLERANCE=1000;
var truthByUnit={};
var refreshPromise=null;
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase()}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}
function dateValue(v){if(!v)return null;var d=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?null:d}
function codeFromName(v){var s=norm(v);if(/dld|admin\s*fees?/.test(s))return'DLD';if(/down\s*payment/.test(s))return'DOWN';if(/1st|first/.test(s))return'1ST';if(/2nd|second/.test(s))return'2ND';if(/3rd|third/.test(s))return'3RD';if(/4th|fourth/.test(s))return'4TH';if(/5th|fifth/.test(s))return'5TH';if(/6th|sixth/.test(s))return'6TH';if(/7th|seventh/.test(s))return'7TH';if(/final|handover/.test(s))return'FIN';return''}
function effectiveDate(row){return dateValue(row&& (row.revised_due_date||row.due_date))}
function compareRows(a,b){var da=effectiveDate(a),db=effectiveDate(b),ta=da?da.getTime():Infinity,tb=db?db.getTime():Infinity;return ta-tb||num(a&&a.id)-num(b&&b.id)}

async function fetchTruth(){
 if(!window.sb)return false;
 var q=await Promise.all([
  sb.from('units').select('id,unit_no'),
  sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status'),
  sb.from('credit_notes').select('payment_schedule_id,amount')
 ]);
 q.forEach(function(x){if(x.error)throw x.error});
 var unitNoById={},creditBySchedule={},rowsByUnit={};
 (q[0].data||[]).forEach(function(u){unitNoById[String(u.id)]=text(u.unit_no).trim()});
 (q[2].data||[]).forEach(function(c){if(c.payment_schedule_id==null)return;var k=String(c.payment_schedule_id);creditBySchedule[k]=round2((creditBySchedule[k]||0)+num(c.amount))});
 (q[1].data||[]).forEach(function(row){var k=String(row.unit_id);if(!rowsByUnit[k])rowsByUnit[k]=[];rowsByUnit[k].push(row)});
 var nextTruth={};
 Object.keys(rowsByUnit).forEach(function(unitId){
  var unitNo=unitNoById[unitId];if(!unitNo)return;
  var rows=rowsByUnit[unitId].slice().sort(compareRows);
  var stages={};
  rows.forEach(function(row){
   var credit=creditBySchedule[String(row.id)]||0,due=num(row.due_amount),cash=num(row.paid_amount),remaining=round2(due-cash-credit),paid=norm(row.status)==='paid'||remaining<=TOLERANCE;
   stages[codeFromName(row.stage_name)]={id:row.id,status:paid?'Paid':row.status,due:due,cash:cash,credit:credit,settled:round2(cash+credit),remaining:paid?0:remaining,dueDate:effectiveDate(row),paidDate:dateValue(row.paid_date),label:text(row.stage_name).trim()};
  });
  var open=rows.filter(function(row){
   if(num(row.due_amount)<=0||/\bbooking\b/i.test(text(row.stage_name)))return false;
   var remaining=round2(num(row.due_amount)-num(row.paid_amount)-(creditBySchedule[String(row.id)]||0));
   return norm(row.status)!=='paid'&&remaining>TOLERANCE;
  }).sort(compareRows);
  var next=open[0]||null;
  nextTruth[norm(unitNo)]={unitId:Number(unitId),stages:stages,next:next?{label:text(next.stage_name).trim(),amount:round2(num(next.due_amount)-num(next.paid_amount)-(creditBySchedule[String(next.id)]||0)),date:effectiveDate(next),scheduleId:next.id}:null};
 });
 truthByUnit=nextTruth;
 return true;
}

function applyCustomer(c){
 if(!c)return;
 var t=truthByUnit[norm(c.unit)];if(!t)return;
 c.dbUnitId=t.unitId;
 var stageMap={};(c.stages||[]).forEach(function(s){if(s&&s.code)stageMap[s.code]=s});
 Object.keys(t.stages||{}).forEach(function(code){var src=t.stages[code],dst=stageMap[code];if(!dst)return;dst.id=src.id;dst.scheduleId=src.id;dst.status=src.status;dst.due=src.due;dst.cashPaid=src.cash;dst.creditNoteTotal=src.credit;dst.settledAmount=src.settled;dst.paid=src.settled;dst.outAmt=src.remaining;dst.dueDate=src.dueDate;dst.paidDate=src.paidDate});
 c.upStage=t.next?t.next.label:'';
 c.upAmt=t.next?t.next.amount:null;
 c.upDate=t.next?t.next.date:null;
}
function applyAll(){if(!window.state)return;[state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(applyCustomer)})}
function rerender(){if(!window.state||state.view==='empty')return;if(typeof window.renderMain==='function')window.renderMain();else if(typeof window.render==='function')window.render()}
async function refresh(shouldRender){if(refreshPromise)return refreshPromise;refreshPromise=(async function(){try{await fetchTruth();applyAll();if(shouldRender)rerender();return true}catch(e){console.warn('Payment schedule source truth refresh failed',e);return false}finally{refreshPromise=null}})();return refreshPromise}
function wrapRenderList(){var base=window.renderList;if(typeof base!=='function'||base.__paymentScheduleSourceTruth)return;var wrapped=function(){applyAll();return base.apply(this,arguments)};wrapped.__paymentScheduleSourceTruth=true;window.renderList=wrapped}
function wrapLoad(){var base=window.loadFromSupabase;if(typeof base!=='function'||base.__paymentScheduleSourceTruth)return;var wrapped=async function(){var out=await base.apply(this,arguments);await refresh(false);rerender();return out};wrapped.__paymentScheduleSourceTruth=true;window.loadFromSupabase=wrapped}
function install(){if(!window.state||typeof window.loadFromSupabase!=='function'){setTimeout(install,50);return}wrapRenderList();wrapLoad();refresh(true);window.addEventListener('pageshow',function(){refresh(true)});window.__sunblissRefreshPaymentScheduleSourceTruth=function(){return refresh(true)}}
install();
})();
