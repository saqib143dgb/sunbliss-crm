(function(){
'use strict';
if(window.__sunblissPaymentTolerance1000Installed)return;
window.__sunblissPaymentTolerance1000Installed=true;

var TOLERANCE=1000;
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}
function text(v){return v==null?'':String(v)}
function settled(stage){return num(stage&&stage.settledAmount!==undefined?stage.settledAmount:stage&&stage.paid)}
function remaining(stage){
  if(!stage||stage.due===null||stage.due===undefined)return null;
  if(text(stage.status).trim().toLowerCase()==='paid')return 0;
  return round2(num(stage.due)-settled(stage));
}
function allCustomers(){var out=[];if(!window.state)return out;[state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c)})});return out}
function applyCustomer(c){
  if(!c)return;
  if(c.outstanding!==null&&c.outstanding!==undefined){
    var overall=num(c.outstanding);
    if(overall<0&&Math.abs(overall)<=TOLERANCE){if(c.rawOutstanding===undefined)c.rawOutstanding=overall;c.outstanding=0}
  }
  var next=null;
  (c.stages||[]).forEach(function(stage){
    var rem=remaining(stage);
    if(rem===null)return;
    stage.toleranceCarry=rem>0&&rem<=TOLERANCE?rem:0;
    if(rem<=TOLERANCE){stage.outAmt=0;if(rem>0)stage.status='Paid';return}
    if(!next){next={stage:stage,remaining:rem};return}
    var a=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
    var b=next.stage.dueDate?new Date(next.stage.dueDate).getTime():Infinity;
    if(a<b)next={stage:stage,remaining:rem};
  });
  c.upStage=next?next.stage.label:'';
  c.upAmt=next?next.remaining:null;
  c.upDate=next?next.stage.dueDate:null;
}
function applyAll(){allCustomers().forEach(applyCustomer)}
function adjustPortfolio(){
  if(typeof window.portfolioStats!=='function'||window.portfolioStats.__sunblissTolerance1000)return;
  var base=window.portfolioStats;
  var wrapped=function(){
    applyAll();
    var k=base.apply(this,arguments)||{};
    var today=new Date();today.setHours(0,0,0,0);
    var overdueAmount=0,overdueUnits=0;
    (state.dues||[]).forEach(function(c){var has=false;(c.stages||[]).forEach(function(s){var rem=remaining(s),d=s&&s.dueDate?new Date(s.dueDate):null;if(rem!==null&&rem>TOLERANCE&&d&&!isNaN(d.getTime())&&d.getTime()<today.getTime()){overdueAmount+=rem;has=true}});if(has)overdueUnits++});
    k.overdueAmount=round2(overdueAmount);k.overdueUnits=overdueUnits;
    if(Array.isArray(k.topAtRisk))k.topAtRisk=k.topAtRisk.filter(function(c){return num(c&&c.outstanding)<-TOLERANCE});
    return k;
  };
  wrapped.__sunblissTolerance1000=true;
  window.portfolioStats=wrapped;
}
function patchRenderedEditors(){
  var c=null;if(window.state&&state.selectedUnit&&Array.isArray(state.dues))c=state.dues.find(function(x){return x&&(text(x.unit)+'::'+text(x.sno))===text(state.selectedUnit)})||null;
  if(!c)return;
  var byId={};(c.stages||[]).forEach(function(s){if(s&&s.id!=null)byId[String(s.id)]=s});
  var select=document.getElementById('pfStage');
  if(select){
    var firstOpen=null;
    Array.prototype.forEach.call(select.options,function(opt){var s=byId[String(opt.value)],rem=remaining(s);if(rem!==null&&rem<=TOLERANCE){var parts=text(opt.textContent).split(' · ');opt.textContent=parts[0]+' · Fully settled'}else if(firstOpen===null)firstOpen=opt.value});
    var selectedStage=byId[String(select.value)],selectedRem=remaining(selectedStage);if(selectedRem!==null&&selectedRem<=TOLERANCE&&firstOpen!==null)select.value=firstOpen;
  }
  var detailRows=document.querySelectorAll('#paymentDetailDialog .payment-detail-row');
  detailRows.forEach(function(row,index){var s=(c.stages||[])[index],rem=remaining(s);if(rem===null||rem>TOLERANCE)return;var spans=row.querySelectorAll('.payment-detail-row-meta span');spans.forEach(function(span){if(/^Status:/i.test(text(span.textContent)))span.textContent='Status: Paid'})});
}
function wrapRender(name){var base=window[name];if(typeof base!=='function'||base.__sunblissTolerance1000)return;var wrapped=function(){applyAll();var out=base.apply(this,arguments);patchRenderedEditors();return out};wrapped.__sunblissTolerance1000=true;window[name]=wrapped}
function install(){
  if(!window.state){setTimeout(install,50);return}
  applyAll();adjustPortfolio();['renderMain','renderOverview','renderDetail','renderInsights','renderList'].forEach(wrapRender);
  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__sunblissTolerance1000){var base=window.loadFromSupabase;var wrapped=async function(){var out=await base.apply(this,arguments);applyAll();adjustPortfolio();return out};wrapped.__sunblissTolerance1000=true;window.loadFromSupabase=wrapped}
  var Observer=window.__sunblissNativeMutationObserver||window.MutationObserver;if(typeof Observer==='function'){var obs=new Observer(function(){applyAll();patchRenderedEditors()});obs.observe(document.documentElement,{childList:true,subtree:true})}
  window.addEventListener('pageshow',function(){applyAll();patchRenderedEditors()});
  window.__sunblissPaymentTolerance={amount:TOLERANCE,apply:applyAll};
}
install();
})();
