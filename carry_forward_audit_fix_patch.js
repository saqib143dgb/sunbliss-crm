(function(){
  'use strict';
  if(window.__sunblissCarryForwardAuditFixInstalled)return;
  window.__sunblissCarryForwardAuditFixInstalled=true;

  function text(v){return v==null?'':String(v)}
  function round2(v){return Math.round((Number(v)||0)*100)/100}
  function unitId(c){return Number(c&&(c.unitId||c.sno))||null}
  function customers(){
    var out=[];
    if(window.state){
      [state.dues,state.cancelled].forEach(function(list){if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c)})});
    }
    return out;
  }
  function recomputeNextDue(c){
    var next=null;
    (c.stages||[]).forEach(function(stage){
      if(stage.due===null||stage.due===undefined)return;
      var settled=Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0;
      var remaining=round2((Number(stage.due)||0)-settled);
      if(remaining<=1)return;
      if(!next){next={stage:stage,remaining:remaining};return}
      var a=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
      var b=next.stage.dueDate?new Date(next.stage.dueDate).getTime():Infinity;
      if(a<b)next={stage:stage,remaining:remaining};
    });
    c.upStage=next?next.stage.label:'';
    c.upAmt=next?next.remaining:null;
    c.upDate=next?next.stage.dueDate:null;
  }

  async function applyActiveAllocations(){
    if(!window.sb||!window.state||!state.carryForwardEventById)return;
    var result=await sb.from('carry_forward_allocations')
      .select('id,positive_event_id,negative_event_id,amount,allocation_date,created_at,reversed_at')
      .is('reversed_at',null)
      .order('allocation_date',{ascending:true})
      .order('id',{ascending:true});
    if(result.error)throw result.error;

    var active=(result.data||[]).map(function(a){return{
      id:a.id,positiveEventId:a.positive_event_id,negativeEventId:a.negative_event_id,
      amount:round2(a.amount),allocationDate:a.allocation_date,createdAt:a.created_at||'',reversedAt:a.reversed_at||null
    }});
    var eventById=state.carryForwardEventById||{};
    var fromPositive={},toNegativeAll={},toNegativeSettlement={};

    active.forEach(function(a){
      var pe=eventById[text(a.positiveEventId)],ne=eventById[text(a.negativeEventId)];
      fromPositive[text(a.positiveEventId)]=(fromPositive[text(a.positiveEventId)]||0)+a.amount;
      toNegativeAll[text(a.negativeEventId)]=(toNegativeAll[text(a.negativeEventId)]||0)+a.amount;
      if(pe&&ne&&text(pe.scheduleId)!==text(ne.scheduleId)){
        toNegativeSettlement[text(a.negativeEventId)]=(toNegativeSettlement[text(a.negativeEventId)]||0)+a.amount;
      }
    });

    state.carryForwardAllocations=active;
    state.carryForwardAllocatedFromPositive=fromPositive;
    state.carryForwardAllocatedToNegative=toNegativeSettlement;
    state.carryForwardAllocatedToNegativeAll=toNegativeAll;

    customers().forEach(function(c){
      if(!unitId(c))return;
      (c.stages||[]).forEach(function(stage){
        var carryApplied=0;
        (c.carryForwardEvents||[]).forEach(function(e){
          if(text(e.scheduleId)===text(stage.id||stage.scheduleId)&&Number(e.amount)<0){
            carryApplied+=Number(toNegativeSettlement[text(e.id)])||0;
          }
        });
        carryApplied=round2(carryApplied);
        stage.carryApplied=carryApplied;
        var cash=stage.cashPaid!==undefined?Number(stage.cashPaid)||0:Number(stage.paid)||0;
        var credit=Number(stage.creditNoteTotal)||0;
        stage.cashPaid=round2(cash);
        stage.settledAmount=round2(stage.cashPaid+credit+carryApplied);
        stage.paid=stage.settledAmount;
        stage.outAmt=stage.due===null||stage.due===undefined?null:round2((Number(stage.due)||0)-stage.settledAmount);
      });
      recomputeNextDue(c);
    });
  }

  function install(){
    if(!window.state||!window.sb||!window.__sunblissCarryForwardApi||typeof window.loadFromSupabase!=='function'){
      setTimeout(install,60);return;
    }

    var baseLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var out=await baseLoad.apply(this,arguments);
      try{
        await applyActiveAllocations();
        if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain();
      }catch(ex){console.warn('Could not refresh active carry allocations',ex)}
      return out;
    };

    applyActiveAllocations().then(function(){
      if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain();
    }).catch(function(ex){console.warn('Could not initialize active carry allocations',ex)});

    window.__sunblissCarryForwardAuditFix={refresh:applyActiveAllocations};
  }

  install();
})();
