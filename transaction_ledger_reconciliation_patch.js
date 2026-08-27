(function(){
  'use strict';

  if(window.__sunblissTransactionLedgerReconciliationInstalled)return;
  window.__sunblissTransactionLedgerReconciliationInstalled=true;

  var fetchedTransactions=null;
  var fetchPromise=null;

  function text(v){return v==null?'':String(v);}
  function round2(v){return Math.round((Number(v)||0)*100)/100;}
  function unitId(c){return Number(c&&(c.unitId||c.dbUnitId))||null;}
  function allCustomers(){
    var out=[];
    if(!window.state)return out;
    [state.dues,state.cancelled].forEach(function(list){
      if(Array.isArray(list))list.forEach(function(c){if(c)out.push(c);});
    });
    return out;
  }
  function txValue(t,key,rawKey){
    if(t&&t[key]!==undefined)return t[key];
    return t?t[rawKey]:undefined;
  }
  function normalizedTransactions(){
    var rows=(window.state&&Array.isArray(state.actualPaymentTransactions))?state.actualPaymentTransactions:fetchedTransactions;
    if(!Array.isArray(rows))return [];
    return rows.map(function(t){
      return {
        id:txValue(t,'id','id'),
        unitId:Number(txValue(t,'unitId','unit_id'))||null,
        scheduleId:Number(txValue(t,'scheduleId','payment_schedule_id'))||null,
        paymentDate:text(txValue(t,'paymentDate','payment_date')),
        amount:round2(txValue(t,'amount','amount')),
        paymentType:text(txValue(t,'paymentType','payment_type'))
      };
    }).filter(function(t){return t.unitId&&Math.abs(t.amount)>0.005;});
  }
  function ensureTransactions(){
    if(window.state&&Array.isArray(state.actualPaymentTransactions))return Promise.resolve(state.actualPaymentTransactions);
    if(fetchedTransactions)return Promise.resolve(fetchedTransactions);
    if(fetchPromise)return fetchPromise;
    if(!window.sb)return Promise.resolve([]);
    fetchPromise=sb.from('payment_transactions')
      .select('id,unit_id,payment_schedule_id,payment_date,amount,payment_type')
      .order('payment_date',{ascending:true}).order('id',{ascending:true})
      .then(function(r){
        fetchPromise=null;
        if(r.error)throw r.error;
        fetchedTransactions=r.data||[];
        return fetchedTransactions;
      }).catch(function(err){
        fetchPromise=null;
        console.warn('[Sunbliss] transaction ledger reconciliation could not load transactions',err);
        return [];
      });
    return fetchPromise;
  }
  function transactionCodes(label){
    var s=text(label).toLowerCase().replace(/instalment/g,'installment');
    if(!s||/booking\s*amount/.test(s))return [];
    var hits=[];
    function add(code,re){var m=re.exec(s);if(m)hits.push({code:code,index:m.index});}
    add('DP',/\bdown\s*payment\b/);
    add('DLD',/\bdld\b|\badmin(?:\s*fee|\s*fees)?\b/);
    add('1ST',/\b1st\b|\bfirst\b|\b1\s+installment\b|\binstallment\s*1\b/);
    add('2ND',/\b2nd\b|\bsecond\b|\b2\s+installment\b|\binstallment\s*2\b/);
    add('3RD',/\b3rd\b|\bthird\b|\b3\s+installment\b|\binstallment\s*3\b/);
    add('4TH',/\b4th\b|\bfourth\b|\b4\s+installment\b|\binstallment\s*4\b/);
    add('5TH',/\b5th\b|\bfifth\b|\b5\s+installment\b|\binstallment\s*5\b/);
    add('6TH',/\b6th\b|\bsixth\b|\b6\s+installment\b|\binstallment\s*6\b/);
    add('7TH',/\b7th\b|\bseventh\b|\b7\s+installment\b|\binstallment\s*7\b/);
    add('FIN',/\bfinal\b|\bhandover\b/);
    hits.sort(function(a,b){return a.index-b.index;});
    var seen={};
    return hits.filter(function(h){if(seen[h.code])return false;seen[h.code]=true;return true;}).map(function(h){return h.code;});
  }
  function isDldStage(stage){
    if(!stage)return false;
    if(text(stage.code).toUpperCase()==='DLD')return true;
    return /\bdld\b|admin\s*fees?/i.test(text(stage.label||stage.stage_name));
  }
  function stageDateValue(v){
    if(!v)return '';
    if(v instanceof Date&&!isNaN(v.getTime()))return v.toISOString().slice(0,10);
    return text(v).slice(0,10);
  }
  function latestDate(a,b){return !a?b:(!b?a:(text(a)>=text(b)?a:b));}
  function setPaidDate(stage,value){
    if(!value){stage.paidDate=null;return;}
    var d=new Date(text(value).slice(0,10)+'T00:00:00');
    stage.paidDate=isNaN(d.getTime())?value:d;
  }
  function recomputeNextDue(c){
    var next=null;
    (c.stages||[]).forEach(function(stage){
      if(stage.due===null||stage.due===undefined)return;
      var remaining=round2((Number(stage.due)||0)-(Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0));
      if(remaining<=1)return;
      var stamp=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
      if(!next||stamp<next.stamp)next={stage:stage,remaining:remaining,stamp:stamp};
    });
    c.upStage=next?next.stage.label:'';
    c.upAmt=next?next.remaining:null;
    c.upDate=next?next.stage.dueDate:null;
  }
  function reconcileCustomer(c,unitTransactions){
    if(!c||!Array.isArray(c.stages)||!unitTransactions.length)return false;
    var stages=c.stages;
    var byId={},byCode={};
    stages.forEach(function(stage){
      var sid=Number(stage.id||stage.scheduleId)||null;
      if(sid)byId[text(sid)]=stage;
      if(stage.code)byCode[text(stage.code)]=stage;
      if(stage.__scheduleRecordedCash===undefined){
        stage.__scheduleRecordedCash=round2(stage.cashPaid!==undefined?stage.cashPaid:stage.paid);
        stage.__scheduleRecordedPaidDate=stageDateValue(stage.paidDate);
      }
      stage.__txCash=0;
      stage.__txLatestDate='';
      stage.__txIds=[];
    });
    function add(stage,amount,date,id){
      if(!stage||Math.abs(amount)<0.005)return;
      stage.__txCash=round2((stage.__txCash||0)+amount);
      stage.__txLatestDate=latestDate(stage.__txLatestDate,date);
      if(id!==undefined&&id!==null)stage.__txIds.push(id);
    }

    var deferred=[];
    unitTransactions.slice().sort(function(a,b){return text(a.paymentDate).localeCompare(text(b.paymentDate))||Number(a.id||0)-Number(b.id||0);}).forEach(function(tx){
      if(tx.scheduleId&&byId[text(tx.scheduleId)]){
        add(byId[text(tx.scheduleId)],tx.amount,tx.paymentDate,tx.id);
        return;
      }
      var codes=transactionCodes(tx.paymentType).filter(function(code){return !!byCode[code];});
      if(!codes.length)return;
      if(codes.length===1){add(byCode[codes[0]],tx.amount,tx.paymentDate,tx.id);return;}
      deferred.push({tx:tx,codes:codes});
    });

    deferred.forEach(function(item){
      var remaining=round2(item.tx.amount);
      var candidates=item.codes.map(function(code){return byCode[code];}).filter(Boolean);
      if(!candidates.length)return;
      candidates.forEach(function(stage,index){
        if(Math.abs(remaining)<0.005)return;
        var last=index===candidates.length-1;
        var rawTarget=Math.max(0,round2((Number(stage.__scheduleRecordedCash)||0)-(Number(stage.__txCash)||0)));
        var dueTarget=Math.max(0,round2((Number(stage.due)||0)-(Number(stage.__txCash)||0)));
        var target=rawTarget>0?rawTarget:dueTarget;
        var take=last?remaining:Math.min(Math.max(remaining,0),target);
        if(remaining<0)take=last?remaining:Math.max(remaining,-target);
        add(stage,take,item.tx.paymentDate,item.tx.id);
        remaining=round2(remaining-take);
      });
      if(Math.abs(remaining)>0.005)add(candidates[candidates.length-1],remaining,item.tx.paymentDate,item.tx.id);
    });

    stages.forEach(function(stage){
      var cash=round2(stage.__txCash||0);
      var credit=round2(stage.creditNoteTotal||0);
      var carryApplied=round2(stage.carryApplied||0);
      stage.cashPaid=cash;
      stage.transactionCash=cash;
      stage.transactionCount=(stage.__txIds||[]).length;
      stage.settledAmount=round2(cash+credit+carryApplied);
      stage.paid=stage.settledAmount;
      stage.outAmt=stage.due===null||stage.due===undefined?null:round2((Number(stage.due)||0)-stage.settledAmount);
      setPaidDate(stage,stage.__txLatestDate||'');
    });

    var grossCash=round2(unitTransactions.reduce(function(sum,t){return sum+(Number(t.amount)||0);},0));
    var saleCredit=0,feeCredit=0,feeDue=0,feeSettled=0,dldAdminCash=0;
    stages.forEach(function(stage){
      var credit=round2(stage.creditNoteTotal||0);
      if(isDldStage(stage)){
        dldAdminCash=round2(dldAdminCash+(Number(stage.cashPaid)||0));
        feeDue=round2(feeDue+(Number(stage.due)||0));
        feeCredit=round2(feeCredit+credit);
        feeSettled=round2(feeSettled+(Number(stage.settledAmount)||0));
      }else{
        saleCredit=round2(saleCredit+credit);
      }
    });
    var saleCash=round2(grossCash-dldAdminCash);

    c.grossCashReceived=grossCash;
    c.dldAdminDue=feeDue;
    c.dldAdminCashReceived=dldAdminCash;
    c.dldAdminCreditNoteTotal=feeCredit;
    c.dldAdminSettled=feeSettled;
    c.dldAdminOutstanding=round2(feeDue-feeSettled);
    c.allCreditNoteTotal=round2(saleCredit+feeCredit);
    c.creditNoteTotal=saleCredit;
    c.actualCollected=saleCash;
    c.cashReceived=saleCash;
    c.received=saleCash;
    c.settledReceived=round2(saleCash+saleCredit);
    if(c.total!==null&&c.total!==undefined&&isFinite(Number(c.total)))c.outstanding=round2(c.settledReceived-Number(c.total));
    c.transactionLedgerReconciled=true;
    c.dldAdminSeparated=true;
    recomputeNextDue(c);
    return true;
  }
  function reconcileAll(){
    if(!window.state)return false;
    var txs=normalizedTransactions();
    if(!txs.length)return false;
    var byUnit={};
    txs.forEach(function(t){(byUnit[text(t.unitId)]||(byUnit[text(t.unitId)]=[])).push(t);});
    var changed=false;
    allCustomers().forEach(function(c){
      var uid=unitId(c),rows=uid?(byUnit[text(uid)]||[]):[];
      if(rows.length&&reconcileCustomer(c,rows))changed=true;
    });
    return changed;
  }
  function wrapRender(name){
    var base=window[name];
    if(typeof base!=='function'||base.__transactionLedgerWrapped)return;
    var wrapped=function(){reconcileAll();return base.apply(this,arguments);};
    wrapped.__transactionLedgerWrapped=true;
    window[name]=wrapped;
  }
  function install(){
    wrapRender('renderDetail');
    wrapRender('renderOverview');
    wrapRender('renderInsights');
    wrapRender('renderList');
    if(typeof window.loadFromSupabase==='function'&&!window.loadFromSupabase.__transactionLedgerWrapped){
      var baseLoad=window.loadFromSupabase;
      var wrappedLoad=async function(){
        var out=await baseLoad.apply(this,arguments);
        await ensureTransactions();
        reconcileAll();
        return out;
      };
      wrappedLoad.__transactionLedgerWrapped=true;
      window.loadFromSupabase=wrappedLoad;
    }
    ensureTransactions().then(function(){
      var changed=reconcileAll();
      if(changed&&window.state&&state.view==='detail'&&typeof window.renderDetail==='function')window.renderDetail();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
