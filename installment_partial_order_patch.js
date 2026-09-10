(function(){
'use strict';
if(window.__sunblissInstallmentPartialOrderInstalled)return;
window.__sunblissInstallmentPartialOrderInstalled=true;

function text(v){return v==null?'':String(v)}
function key(stage){
  var label=text(stage&&(stage.label||stage.name||stage.stageName||stage.stage_name)).replace(/instalment/ig,'installment').replace(/\s+/g,' ').trim();
  var match=label.match(/^(.*?\binstallment)\s+partial\s*[-–—]?\s*(\d+)\b/i);
  if(!match)return null;
  return{base:match[1].toLowerCase().replace(/\s+/g,' ').trim(),partial:Number(match[2])||0};
}
function normalizeStages(customer){
  if(!customer||!Array.isArray(customer.stages)||customer.stages.length<2)return;
  var decorated=customer.stages.map(function(stage,index){return{stage:stage,index:index,k:key(stage)}});
  decorated.sort(function(a,b){
    if(a.k&&b.k&&a.k.base===b.k.base&&a.k.partial!==b.k.partial)return a.k.partial-b.k.partial;
    return a.index-b.index;
  });
  var changed=decorated.some(function(x,i){return x.stage!==customer.stages[i]});
  if(changed)customer.stages.splice.apply(customer.stages,[0,customer.stages.length].concat(decorated.map(function(x){return x.stage})));
}
function current(){
  if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
  return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null;
}
function normalizeAll(){
  if(!window.state)return;
  [state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(normalizeStages)});
}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,50);return}
  normalizeAll();
  var base=window.renderDetail;
  if(!base.__installmentPartialOrder){
    var wrapped=function(){normalizeStages(current());return base.apply(this,arguments)};
    wrapped.__installmentPartialOrder=true;
    window.renderDetail=wrapped;
  }
  if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__installmentPartialOrder){
    var load=window.loadFromSupabase;
    var loadWrapped=async function(){var out=await load.apply(this,arguments);normalizeAll();return out};
    loadWrapped.__installmentPartialOrder=true;
    window.loadFromSupabase=loadWrapped;
  }
  window.addEventListener('pageshow',normalizeAll);
}
install();
})();
