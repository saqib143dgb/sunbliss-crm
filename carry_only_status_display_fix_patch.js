(function(){
'use strict';
if(window.__sunblissCarryOnlyStatusDisplayFixInstalled)return;
window.__sunblissCarryOnlyStatusDisplayFixInstalled=true;

var TOLERANCE=1000;
var observer=null;
var scheduled=false;

function text(v){return v==null?'':String(v)}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}

function selectedCustomer(){
  if(!window.state||state.view!=='detail'||!state.selectedUnit||!Array.isArray(state.dues))return null;
  return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null;
}

function directSettled(stage){
  if(!stage)return 0;
  var cash=stage.cashPaid!==undefined&&stage.cashPaid!==null?num(stage.cashPaid):num(stage.paid);
  var credit=num(stage.creditNoteTotal);
  return round2(cash+credit);
}

function directStatus(stage){
  if(!stage||stage.due===null||stage.due===undefined)return 'na';
  var due=Math.max(0,num(stage.due));
  var direct=directSettled(stage);
  if(due>0&&direct>=due-TOLERANCE)return 'paid';
  if(direct>0.01)return 'partial';
  var d=stage.dueDate?new Date(stage.dueDate):null;
  if(d&&!isNaN(d.getTime())){
    var today=new Date();today.setHours(0,0,0,0);d.setHours(0,0,0,0);
    return d.getTime()<today.getTime()?'overdue':'upcoming';
  }
  return 'pending';
}

function labelFor(status){
  return {paid:'Paid',partial:'Partial',overdue:'Overdue',upcoming:'Upcoming',pending:'Pending',na:'N/A'}[status]||'Pending';
}

function apply(){
  scheduled=false;
  var c=selectedCustomer();if(!c||!Array.isArray(c.stages))return;
  var cards=document.querySelectorAll('.detail .ledger-scroll .stage-card');
  cards.forEach(function(card,index){
    var stage=c.stages[index];if(!stage)return;
    var status=directStatus(stage);
    var direct=directSettled(stage);

    if(direct<=0.01&&text(stage.status).trim().toLowerCase()==='partial')stage.status='Outstanding';

    var stamp=card.querySelector('.stamp');
    if(stamp){
      ['paid','partial','overdue','upcoming','pending','na'].forEach(function(k){stamp.classList.remove('is-'+k)});
      stamp.classList.add('is-'+status);
      var label=labelFor(status);
      if(text(stamp.textContent).trim()!==label)stamp.textContent=label;
    }

    var rows=Array.prototype.slice.call(card.querySelectorAll('.stage-row'));
    var cashRow=rows.find(function(row){
      var first=row.querySelector('span:first-child');
      var lbl=first?text(first.textContent).trim().toLowerCase():'';
      return lbl==='paid'||lbl==='cash';
    });
    if(cashRow){
      var spans=cashRow.querySelectorAll('span');
      if(spans[0])spans[0].textContent='Cash';
      var cash=stage.cashPaid!==undefined&&stage.cashPaid!==null?num(stage.cashPaid):Math.max(0,direct-num(stage.creditNoteTotal));
      if(spans[1]&&typeof window.fmtAED==='function')spans[1].textContent=window.fmtAED(cash);
    }
  });
}

function scheduleApply(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(function(){
    apply();
    setTimeout(apply,40);
  });
}

function wrapRender(name){
  var base=window[name];
  if(typeof base!=='function'||base.__carryOnlyStatusDisplayFix)return;
  var wrapped=function(){
    var out=base.apply(this,arguments);
    scheduleApply();
    return out;
  };
  wrapped.__carryOnlyStatusDisplayFix=true;
  window[name]=wrapped;
}

function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,60);return}
  wrapRender('renderDetail');
  wrapRender('renderMain');
  if(!observer&&document.body&&window.MutationObserver){
    observer=new MutationObserver(function(){
      if(window.state&&state.view==='detail')scheduleApply();
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  scheduleApply();
  window.addEventListener('pageshow',scheduleApply);
  window.__sunblissApplyCarryOnlyStatusDisplayFix=scheduleApply;
}

install();
})();