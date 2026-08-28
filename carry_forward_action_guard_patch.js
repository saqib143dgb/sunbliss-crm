(function(){
'use strict';
if(window.__sunblissCarryForwardActionGuardInstalled)return;
window.__sunblissCarryForwardActionGuardInstalled=true;
function round2(v){return Math.round((Number(v)||0)*100)/100}
function text(v){return v==null?'':String(v)}
function allCustomers(){var out=[];if(!window.state)return out;[state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c)})});return out}
function paymentActivity(stage){var cash=Number(stage&&stage.cashPaid!==undefined?stage.cashPaid:stage&&stage.paid)||0;var credit=Number(stage&&stage.creditNoteTotal)||0;return cash>0.01||credit>0.01||!!(stage&&stage.paidDate)}
function apply(c){
  if(!c||!Array.isArray(c.stages))return;
  var carry=round2(c.carryForward||0);
  c.stages.forEach(function(stage){stage.carryForwardManaged=false});
  if(carry< -0.01&&Math.abs(carry)<=5000){
    var shortage=Math.abs(carry);
    var best=null;
    c.stages.forEach(function(stage){
      if(stage.due===null||stage.due===undefined||!paymentActivity(stage))return;
      var settled=Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0;
      var remaining=round2((Number(stage.due)||0)-settled);
      if(remaining<=0.01)return;
      var diff=Math.abs(remaining-shortage);
      if(diff<=0.01&&(!best||diff<best.diff))best={stage:stage,diff:diff};
    });
    if(best)best.stage.carryForwardManaged=true;
  }
  var next=null;
  c.stages.forEach(function(stage){
    if(stage.due===null||stage.due===undefined||stage.carryForwardManaged===true)return;
    var settled=Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0;
    var remaining=round2((Number(stage.due)||0)-settled);
    if(remaining<=1)return;
    var stamp=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
    if(!next||stamp<next.stamp)next={stage:stage,remaining:remaining,stamp:stamp};
  });
  c.upStage=next?text(next.stage.label):'';
  c.upAmt=next?next.remaining:null;
  c.upDate=next?next.stage.dueDate:null;
}
function applyAll(){allCustomers().forEach(apply)}
function wrap(name){var base=window[name];if(typeof base!=='function'||base.__carryForwardActionGuard)return;var wrapped=function(){applyAll();return base.apply(this,arguments)};wrapped.__carryForwardActionGuard=true;window[name]=wrapped}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'||typeof window.renderMain!=='function'){setTimeout(install,60);return}
  wrap('renderDetail');wrap('renderMain');wrap('renderOverview');wrap('renderList');wrap('renderInsights');
  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__carryForwardActionGuard){
    var baseLoad=window.loadFromSupabase;
    var wrappedLoad=async function(){var out=await baseLoad.apply(this,arguments);applyAll();return out};
    wrappedLoad.__carryForwardActionGuard=true;window.loadFromSupabase=wrappedLoad;
  }
  applyAll();
  if(state.view==='detail')window.renderDetail();
}
install();
})();
