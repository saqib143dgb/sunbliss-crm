(function(){
'use strict';
if(window.__sunblissCreditNoteFullSettlementInstalled)return;
window.__sunblissCreditNoteFullSettlementInstalled=true;
var TOLERANCE=1000;
function n(v){var x=Number(v);return isFinite(x)?x:0}
function r(v){return Math.round(n(v)*100)/100}
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase()}
function customers(){var a=[];if(window.state)[state.dues,state.cancelled].forEach(function(x){if(Array.isArray(x))x.forEach(function(c){if(c)a.push(c)})});return a}
function codeFromName(v){var s=norm(v);if(/dld|admin\s*fees?/.test(s))return'DLD';if(/down\s*payment/.test(s))return'DOWN';if(/1st|first/.test(s))return'1ST';if(/2nd|second/.test(s))return'2ND';if(/3rd|third/.test(s))return'3RD';if(/4th|fourth/.test(s))return'4TH';if(/5th|fifth/.test(s))return'5TH';if(/6th|sixth/.test(s))return'6TH';if(/7th|seventh/.test(s))return'7TH';if(/final|handover/.test(s))return'FIN';return''}
function dateVal(v){if(!v)return null;var d=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?null:d}
async function syncFromDatabase(){
 if(!window.sb||!window.state)return false;
 var q=await Promise.all([
  sb.from('units').select('id,unit_no'),
  sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status'),
  sb.from('credit_notes').select('unit_id,payment_schedule_id,amount')
 ]);
 q.forEach(function(x){if(x.error)throw x.error});
 var unitIdByNo={},scheduleByUnit={},creditBySchedule={},creditByUnit={};
 (q[0].data||[]).forEach(function(u){unitIdByNo[norm(u.unit_no)]=String(u.id)});
 (q[2].data||[]).forEach(function(c){if(c.payment_schedule_id!=null){var k=String(c.payment_schedule_id);creditBySchedule[k]=r((creditBySchedule[k]||0)+n(c.amount))}if(c.unit_id!=null){var uk=String(c.unit_id);creditByUnit[uk]=r((creditByUnit[uk]||0)+n(c.amount))}});
 (q[1].data||[]).forEach(function(s){var k=String(s.unit_id);if(!scheduleByUnit[k])scheduleByUnit[k]=[];scheduleByUnit[k].push(s)});
 customers().forEach(function(c){
  var uid=unitIdByNo[norm(c.unit)]||'';c.dbUnitId=uid?Number(uid):c.dbUnitId;c.creditNoteTotal=creditByUnit[uid]||0;
  var rows=(scheduleByUnit[uid]||[]).slice();
  var stageByCode={};(c.stages||[]).forEach(function(s){stageByCode[s.code]=s});
  rows.forEach(function(row){
   var credit=creditBySchedule[String(row.id)]||0,due=n(row.due_amount),cash=n(row.paid_amount),settled=r(cash+credit),rem=r(due-settled),st=stageByCode[codeFromName(row.stage_name)];
   if(st){st.id=row.id;st.scheduleId=row.id;st.status=row.status;st.due=due;st.cashPaid=cash;st.paid=settled;st.creditNoteTotal=credit;st.settledAmount=settled;st.outAmt=(norm(row.status)==='paid'||rem<=TOLERANCE)?0:rem;st.dueDate=dateVal(row.revised_due_date||row.due_date);st.paidDate=dateVal(row.paid_date)}
  });
  var open=rows.filter(function(row){if(n(row.due_amount)<=0||/\bbooking\b/i.test(text(row.stage_name)))return false;var rem=r(n(row.due_amount)-n(row.paid_amount)-(creditBySchedule[String(row.id)]||0));return norm(row.status)!=='paid'&&rem>TOLERANCE}).sort(function(a,b){var da=dateVal(a.revised_due_date||a.due_date),db=dateVal(b.revised_due_date||b.due_date);var ta=da?da.getTime():Infinity,tb=db?db.getTime():Infinity;return ta-tb||n(a.id)-n(b.id)});
  var next=open[0]||null;
  c.upStage=next?text(next.stage_name).trim():'';
  c.upAmt=next?r(n(next.due_amount)-n(next.paid_amount)-(creditBySchedule[String(next.id)]||0)):null;
  c.upDate=next?dateVal(next.revised_due_date||next.due_date):null;
 });
 return true;
}
function renderFresh(){if(!window.state||!state.view||state.view==='empty')return;if(typeof window.renderMain==='function')window.renderMain()}
async function refresh(){try{await syncFromDatabase();renderFresh();return true}catch(e){console.warn('Database settlement refresh failed',e);return false}}
function install(){
 if(!window.state||typeof window.loadFromSupabase!=='function'){setTimeout(install,50);return}
 var base=window.loadFromSupabase;
 if(!base.__creditNoteSettlementWrapped){var w=async function(){var out=await base.apply(this,arguments);await syncFromDatabase();return out};w.__creditNoteSettlementWrapped=true;window.loadFromSupabase=w}
 setTimeout(refresh,0);
 window.addEventListener('pageshow',refresh);
 window.__sunblissApplyCreditNoteSettlement=refresh;
}
install();
})();
