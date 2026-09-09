(function(){
'use strict';
if(window.__sunblissPaymentScheduleSourceTruthInstalled)return;
window.__sunblissPaymentScheduleSourceTruthInstalled=true;

var TOLERANCE=1000;
var truthByUnit={};
var refreshPromise=null;
var labelObserver=null;
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).trim().toLowerCase()}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}
function dateValue(v){if(!v)return null;var d=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?null:d}
function cleanStageLabel(v){return text(v).replace(/\bDLD\s*(?:\+|&|and)\s*Admin\s*Fees?\s*\(SPA\)/gi,'DLD + Admin Fees')}
function cleanStageObject(s){if(!s)return;['label','name','stageName','stage_name'].forEach(function(k){if(typeof s[k]==='string')s[k]=cleanStageLabel(s[k])})}
function codeFromName(v){var s=norm(v);if(/dld|admin\s*fees?/.test(s))return'DLD';if(/down\s*payment/.test(s))return'DOWN';if(/1st|first/.test(s))return'1ST';if(/2nd|second/.test(s))return'2ND';if(/3rd|third/.test(s))return'3RD';if(/4th|fourth/.test(s))return'4TH';if(/5th|fifth/.test(s))return'5TH';if(/6th|sixth/.test(s))return'6TH';if(/7th|seventh/.test(s))return'7TH';if(/final|handover/.test(s))return'FIN';return''}
function effectiveDate(row){return dateValue(row&& (row.revised_due_date||row.due_date))}
function compareRows(a,b){var da=effectiveDate(a),db=effectiveDate(b),ta=da?da.getTime():Infinity,tb=db?db.getTime():Infinity;return ta-tb||num(a&&a.id)-num(b&&b.id)}
function cleanDomNode(root){
 if(!root)return;
 if(root.nodeType===3){var nv=cleanStageLabel(root.nodeValue);if(nv!==root.nodeValue)root.nodeValue=nv;return}
 if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
 if(root.nodeType===1){
  ['title','aria-label','placeholder'].forEach(function(a){if(root.hasAttribute&&root.hasAttribute(a)){var old=root.getAttribute(a),next=cleanStageLabel(old);if(next!==old)root.setAttribute(a,next)}});
  if((root.tagName==='INPUT'||root.tagName==='TEXTAREA')&&typeof root.value==='string'){var v=cleanStageLabel(root.value);if(v!==root.value)root.value=v}
 }
 if(typeof document.createTreeWalker==='function'){
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;
  while((n=walker.nextNode())){var t=cleanStageLabel(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t}
 }
 if(root.querySelectorAll)root.querySelectorAll('input,textarea,[title],[aria-label],[placeholder]').forEach(function(el){
  ['title','aria-label','placeholder'].forEach(function(a){if(el.hasAttribute&&el.hasAttribute(a)){var old=el.getAttribute(a),next=cleanStageLabel(old);if(next!==old)el.setAttribute(a,next)}});
  if((el.tagName==='INPUT'||el.tagName==='TEXTAREA')&&typeof el.value==='string'){var v=cleanStageLabel(el.value);if(v!==el.value)el.value=v}
 })
}
function normalizeDom(){if(document.body)cleanDomNode(document.body)}
function installLabelObserver(){
 if(labelObserver||!window.MutationObserver||!document.body)return;
 normalizeDom();
 labelObserver=new MutationObserver(function(records){records.forEach(function(r){if(r.type==='characterData')cleanDomNode(r.target);Array.prototype.forEach.call(r.addedNodes||[],cleanDomNode)})});
 labelObserver.observe(document.body,{subtree:true,childList:true,characterData:true})
}

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
 (q[1].data||[]).forEach(function(row){row.stage_name=cleanStageLabel(row.stage_name);var k=String(row.unit_id);if(!rowsByUnit[k])rowsByUnit[k]=[];rowsByUnit[k].push(row)});
 var nextTruth={};
 Object.keys(rowsByUnit).forEach(function(unitId){
  var unitNo=unitNoById[unitId];if(!unitNo)return;
  var rows=rowsByUnit[unitId].slice().sort(compareRows);
  var stages={};
  rows.forEach(function(row){
   var credit=creditBySchedule[String(row.id)]||0,due=num(row.due_amount),cash=num(row.paid_amount),remaining=round2(due-cash-credit),paid=norm(row.status)==='paid'||remaining<=TOLERANCE;
   stages[codeFromName(row.stage_name)]={id:row.id,status:paid?'Paid':row.status,due:due,cash:cash,credit:credit,settled:round2(cash+credit),remaining:paid?0:remaining,dueDate:effectiveDate(row),paidDate:dateValue(row.paid_date),label:cleanStageLabel(row.stage_name).trim()};
  });
  var open=rows.filter(function(row){
   if(num(row.due_amount)<=0||/\bbooking\b/i.test(text(row.stage_name)))return false;
   var remaining=round2(num(row.due_amount)-num(row.paid_amount)-(creditBySchedule[String(row.id)]||0));
   return norm(row.status)!=='paid'&&remaining>TOLERANCE;
  }).sort(compareRows);
  var next=open[0]||null;
  nextTruth[norm(unitNo)]={unitId:Number(unitId),stages:stages,next:next?{label:cleanStageLabel(next.stage_name).trim(),amount:round2(num(next.due_amount)-num(next.paid_amount)-(creditBySchedule[String(next.id)]||0)),date:effectiveDate(next),scheduleId:next.id}:null};
 });
 truthByUnit=nextTruth;
 return true;
}

function applyCustomer(c){
 if(!c)return;
 (c.stages||[]).forEach(cleanStageObject);
 c.upStage=cleanStageLabel(c.upStage);
 var t=truthByUnit[norm(c.unit)];if(!t)return;
 c.dbUnitId=t.unitId;
 var stageMap={};(c.stages||[]).forEach(function(s){if(s&&s.code)stageMap[s.code]=s});
 Object.keys(t.stages||{}).forEach(function(code){var src=t.stages[code],dst=stageMap[code];if(!dst)return;dst.id=src.id;dst.scheduleId=src.id;dst.status=src.status;dst.due=src.due;dst.cashPaid=src.cash;dst.creditNoteTotal=src.credit;dst.settledAmount=src.settled;dst.paid=src.settled;dst.outAmt=src.remaining;dst.dueDate=src.dueDate;dst.paidDate=src.paidDate;dst.label=cleanStageLabel(dst.label||src.label)});
 c.upStage=t.next?cleanStageLabel(t.next.label):'';
 c.upAmt=t.next?t.next.amount:null;
 c.upDate=t.next?t.next.date:null;
}
function applyAll(){if(!window.state)return;[state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(applyCustomer)})}
function rerender(){if(!window.state||state.view==='empty')return;if(typeof window.renderMain==='function')window.renderMain();else if(typeof window.render==='function')window.render();setTimeout(normalizeDom,0)}
async function refresh(shouldRender){if(refreshPromise)return refreshPromise;refreshPromise=(async function(){try{await fetchTruth();applyAll();if(shouldRender)rerender();else setTimeout(normalizeDom,0);return true}catch(e){console.warn('Payment schedule source truth refresh failed',e);return false}finally{refreshPromise=null}})();return refreshPromise}
function wrapRenderList(){var base=window.renderList;if(typeof base!=='function'||base.__paymentScheduleSourceTruth)return;var wrapped=function(){applyAll();var out=base.apply(this,arguments);setTimeout(normalizeDom,0);return out};wrapped.__paymentScheduleSourceTruth=true;window.renderList=wrapped}
function wrapLoad(){var base=window.loadFromSupabase;if(typeof base!=='function'||base.__paymentScheduleSourceTruth)return;var wrapped=async function(){var out=await base.apply(this,arguments);await refresh(false);rerender();return out};wrapped.__paymentScheduleSourceTruth=true;window.loadFromSupabase=wrapped}
function install(){if(!window.state||typeof window.loadFromSupabase!=='function'){setTimeout(install,50);return}wrapRenderList();wrapLoad();installLabelObserver();refresh(true);window.addEventListener('pageshow',function(){installLabelObserver();refresh(true);setTimeout(normalizeDom,0)});window.__sunblissRefreshPaymentScheduleSourceTruth=function(){return refresh(true)}}
install();
})();