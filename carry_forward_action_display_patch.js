(function(){
  'use strict';

  if(window.__sunblissCarryForwardActionDisplayInstalled)return;
  window.__sunblissCarryForwardActionDisplayInstalled=true;

  function text(v){return v==null?'':String(v)}
  function round2(v){return Math.round((Number(v)||0)*100)/100}
  function amount(stage,key,fallback){
    if(stage&&stage[key]!==undefined&&stage[key]!==null)return Number(stage[key])||0;
    return Number(stage&&stage[fallback])||0;
  }
  function stageId(stage){return text(stage&&(stage.id||stage.scheduleId))}
  function allCustomers(){
    var out=[];
    if(!window.state)return out;
    [state.dues,state.cancelled].forEach(function(list){
      if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c)});
    });
    return out;
  }
  function selectedCustomer(){
    if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
    return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null;
  }
  function paymentActivity(stage){
    var cash=amount(stage,'cashPaid','paid');
    var credit=Number(stage&&stage.creditNoteTotal)||0;
    return cash>0.01||credit>0.01;
  }

  function recomputeNextDue(c){
    var next=null;
    (c.stages||[]).forEach(function(stage){
      if(stage.due===null||stage.due===undefined)return;
      var due=Number(stage.due)||0;
      var settled=Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0;
      var remaining=round2(due-settled);
      if(remaining<=1)return;

      // A shortage of AED 5,000 or less stays visible only in Carry Forward.
      // Action Required advances to the next contractual installment.
      if(stage.carryForwardManaged===true)return;

      if(!next){next={stage:stage,remaining:remaining};return}
      var a=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
      var b=next.stage.dueDate?new Date(next.stage.dueDate).getTime():Infinity;
      if(a<b)next={stage:stage,remaining:remaining};
    });
    c.upStage=next?next.stage.label:'';
    c.upAmt=next?next.remaining:null;
    c.upDate=next?next.stage.dueDate:null;
  }

  function applyCustomerRules(c){
    if(!c||!Array.isArray(c.stages))return;

    var events=Array.isArray(c.carryForwardEvents)?c.carryForwardEvents:[];
    var eventScheduleSeen={};
    var eventScheduleCarry={};
    var ledgerCarry=0;
    events.forEach(function(e){
      var eventAmount=Number(e.amount)||0;
      ledgerCarry+=eventAmount;
      if(e.scheduleId!==null&&e.scheduleId!==undefined&&text(e.scheduleId)!==''){
        var sid=text(e.scheduleId);
        eventScheduleSeen[sid]=true;
        eventScheduleCarry[sid]=round2((eventScheduleCarry[sid]||0)+eventAmount);
      }
    });

    var legacyCarry=0;
    c.stages.forEach(function(stage){
      var sid=stageId(stage);
      var hasLedgerEvent=!!eventScheduleSeen[sid];
      var ledgerVariance=round2(eventScheduleCarry[sid]||0);
      var due=stage.due===null||stage.due===undefined?null:Number(stage.due);
      var cash=amount(stage,'cashPaid','paid');
      var credit=Number(stage.creditNoteTotal)||0;
      var hasPaidDate=!!stage.paidDate;
      var legacyVariance=0;

      // Older imported schedules predate the carry-forward ledger. Only treat a
      // historical difference as carry when that installment has an actual paid
      // date. Rows that are merely partially entered with no paid date remain
      // normal installment actions and are not silently migrated into carry.
      if(!hasLedgerEvent&&due!==null&&isFinite(due)&&due>0&&hasPaidDate&&paymentActivity(stage)){
        legacyVariance=round2(cash+credit-due);
        if(Math.abs(legacyVariance)<=0.01)legacyVariance=0;
      }

      var stageVariance=hasLedgerEvent?ledgerVariance:legacyVariance;
      stage.legacyCarryPosition=legacyVariance;
      stage.carryForwardPosition=stageVariance;
      stage.carryForwardManaged=stageVariance < -0.01 && Math.abs(stageVariance) <= 5000;
      legacyCarry+=legacyVariance;
    });

    c.legacyCarryForward=round2(legacyCarry);
    c.carryForward=round2(ledgerCarry+legacyCarry);
    recomputeNextDue(c);
  }

  function applyAll(){allCustomers().forEach(applyCustomerRules)}

  function cleanCarryCard(c){
    var card=document.getElementById('carryForwardCard');
    if(!card)return;
    if(!c||Math.abs(round2(c.carryForward||0))<=0.01)card.remove();
  }

  function install(){
    if(!window.state||typeof window.renderMain!=='function'||typeof window.renderDetail!=='function'){
      setTimeout(install,50);return;
    }

    var baseMain=window.renderMain;
    if(!baseMain.__sunblissCarryForwardActionDisplay){
      var wrappedMain=function(){
        applyAll();
        var out=baseMain.apply(this,arguments);
        if(state.view==='detail')cleanCarryCard(selectedCustomer());
        return out;
      };
      wrappedMain.__sunblissCarryForwardActionDisplay=true;
      window.renderMain=wrappedMain;
    }

    var baseDetail=window.renderDetail;
    if(!baseDetail.__sunblissCarryForwardActionDisplay){
      var wrappedDetail=function(){
        var c=selectedCustomer();
        if(c)applyCustomerRules(c);
        var out=baseDetail.apply(this,arguments);
        cleanCarryCard(c||selectedCustomer());
        return out;
      };
      wrappedDetail.__sunblissCarryForwardActionDisplay=true;
      window.renderDetail=wrappedDetail;
    }

    applyAll();
    if(state.view==='detail'&&typeof window.renderMain==='function')window.renderMain();
  }

  install();
})();