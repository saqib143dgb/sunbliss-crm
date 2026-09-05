(function(){
'use strict';
if(window.__sunblissCreditNoteFullSettlementInstalled)return;
window.__sunblissCreditNoteFullSettlementInstalled=true;
var TOLERANCE=1000;
function n(v){var x=Number(v);return isFinite(x)?x:0}
function r(v){return Math.round(n(v)*100)/100}
function customers(){var a=[];if(window.state)[state.dues,state.cancelled].forEach(function(x){if(Array.isArray(x))x.forEach(function(c){if(c)a.push(c)})});return a}
function uid(c){return Number(c&&(c.unitId||c.dbUnitId||c.sno))||null}
function sid(s){return String(s&&(s.id||s.scheduleId)||'')}
function apply(){
 if(!window.state)return;
 customers().forEach(function(c){
  var events=Array.isArray(c.carryForwardEvents)?c.carryForwardEvents:[];
  var effectiveCarry=0;
  (c.stages||[]).forEach(function(s){
   var due=s.due==null?null:n(s.due),cash=s.cashPaid!==undefined?n(s.cashPaid):n(s.paid),credit=n(s.creditNoteTotal),carryApplied=n(s.carryApplied);
   var settled=r(cash+credit+carryApplied);s.settledAmount=settled;s.paid=settled;
   var rem=due==null?null:r(due-settled);s.outAmt=rem!=null&&rem<=TOLERANCE?0:rem;
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
  var next=null;(c.stages||[]).forEach(function(s){if(s.due==null)return;var rem=r(n(s.due)-n(s.settledAmount));if(rem<=TOLERANCE)return;if(!next)next={s:s,r:rem};else{var a=s.dueDate?new Date(s.dueDate).getTime():Infinity,b=next.s.dueDate?new Date(next.s.dueDate).getTime():Infinity;if(a<b)next={s:s,r:rem}}});
  c.upStage=next?next.s.label:'';c.upAmt=next?next.r:null;c.upDate=next?next.s.dueDate:null;
 });
}
function install(){if(!window.state||typeof window.loadFromSupabase!=='function'){setTimeout(install,50);return}var base=window.loadFromSupabase;if(!base.__creditNoteSettlementWrapped){var w=async function(){var out=await base.apply(this,arguments);apply();if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain();return out};w.__creditNoteSettlementWrapped=true;window.loadFromSupabase=w}setTimeout(function(){apply();if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain()},0);window.__sunblissApplyCreditNoteSettlement=apply}
install();
})();