(function(){
'use strict';
if(window.__sunblissCreditNoteFullSettlementInstalled)return;
window.__sunblissCreditNoteFullSettlementInstalled=true;
var TOLERANCE=1000;
function n(v){var x=Number(v);return isFinite(x)?x:0}
function r(v){return Math.round(n(v)*100)/100}
function text(v){return v==null?'':String(v)}
function customers(){var a=[];if(window.state)[state.dues,state.cancelled].forEach(function(x){if(Array.isArray(x))x.forEach(function(c){if(c)a.push(c)})});return a}
function sid(s){return String(s&&(s.id||s.scheduleId)||'')}
function uid(c){return String(c&&(c.unitId||c.dbUnitId||c.sno)||'')}
async function syncCreditNotes(){
 if(!window.sb||!window.state)return false;
 var res=await sb.from('credit_notes').select('unit_id,payment_schedule_id,amount');
 if(res.error)throw res.error;
 var bySchedule={},byUnit={};
 (res.data||[]).forEach(function(c){
  if(c.payment_schedule_id!=null){var k=String(c.payment_schedule_id);bySchedule[k]=r((bySchedule[k]||0)+n(c.amount))}
  if(c.unit_id!=null){var u=String(c.unit_id);byUnit[u]=r((byUnit[u]||0)+n(c.amount))}
 });
 customers().forEach(function(c){
  c.creditNoteTotal=byUnit[uid(c)]||0;
  (c.stages||[]).forEach(function(s){s.creditNoteTotal=bySchedule[sid(s)]||0});
 });
 return true;
}
function apply(){
 if(!window.state)return;
 customers().forEach(function(c){
  var events=Array.isArray(c.carryForwardEvents)?c.carryForwardEvents:[];
  var effectiveCarry=0;
  (c.stages||[]).forEach(function(s){
   var due=s.due==null?null:n(s.due),cash=s.cashPaid!==undefined?n(s.cashPaid):n(s.paid),credit=n(s.creditNoteTotal),carryApplied=n(s.carryApplied);
   var settled=r(cash+credit+carryApplied);s.settledAmount=settled;s.paid=settled;
   var rem=due==null?null:r(due-settled);s.outAmt=rem!=null&&rem<=TOLERANCE?0:rem;
   if(rem!=null&&rem<=TOLERANCE)s.status='Paid';
  });
  events.forEach(function(e){
   var stage=(c.stages||[]).find(function(s){return sid(s)===String(e.scheduleId||'')});
   if(stage&&n(stage.creditNoteTotal)>0){
    var rawRemaining=r(n(stage.due)-(n(stage.cashPaid)+n(stage.creditNoteTotal)+n(stage.carryApplied)));
    if(rawRemaining<=TOLERANCE)return;
   }
   effectiveCarry+=n(e.amount);
  });
  c.carryForward=r(effectiveCarry);
  var next=null;(c.stages||[]).forEach(function(s){
   if(s.due==null)return;
   var rem=r(n(s.due)-n(s.settledAmount));
   if(text(s.status).toLowerCase()==='paid'||rem<=TOLERANCE)return;
   if(!next)next={s:s,r:rem};else{var a=s.dueDate?new Date(s.dueDate).getTime():Infinity,b=next.s.dueDate?new Date(next.s.dueDate).getTime():Infinity;if(a<b)next={s:s,r:rem}}
  });
  c.upStage=next?next.s.label:'';c.upAmt=next?next.r:null;c.upDate=next?next.s.dueDate:null;
 });
}
function renderFresh(){
 if(!window.state||!state.view||state.view==='empty')return;
 if(typeof window.renderMain==='function')window.renderMain();
}
async function refresh(){
 try{await syncCreditNotes();apply();renderFresh();return true}catch(e){console.warn('Credit note settlement refresh failed',e);apply();renderFresh();return false}
}
function install(){
 if(!window.state||typeof window.loadFromSupabase!=='function'){setTimeout(install,50);return}
 var base=window.loadFromSupabase;
 if(!base.__creditNoteSettlementWrapped){
  var w=async function(){var out=await base.apply(this,arguments);await refresh();return out};
  w.__creditNoteSettlementWrapped=true;window.loadFromSupabase=w
 }
 setTimeout(refresh,0);
 window.addEventListener('pageshow',refresh);
 window.__sunblissApplyCreditNoteSettlement=refresh;
}
install();
})();
