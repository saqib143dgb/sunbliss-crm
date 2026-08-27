(function(){
  'use strict';

  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }

  function normalize(value){
    return String(value || '').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function isStagePayment(row, stageId, baseLabel){
    if (row && row.payment_schedule_id != null && stageId != null && String(row.payment_schedule_id) === String(stageId)) return true;
    var type = normalize(row && row.payment_type);
    var base = normalize(baseLabel);
    return type === base ||
      type.indexOf(base + ' partial-') === 0 ||
      type === base + ' remaining';
  }

  function paymentLabel(baseLabel, due, amount, priorStagePayments, priorStageAmount){
    var totalAfter = Number(priorStageAmount || 0) + Number(amount || 0);
    if (totalAfter >= Number(due || 0) - 1) return baseLabel + ' Remaining';
    return baseLabel + ' Partial-' + (Number(priorStagePayments || 0) + 1);
  }

  async function priorStagePaymentSummary(unitId, stageId, baseLabel){
    var query = await sb.from('payment_transactions')
      .select('id,payment_schedule_id,payment_type,amount,created_at')
      .eq('unit_id',unitId)
      .order('created_at',{ascending:true})
      .order('id',{ascending:true});
    if (query.error) throw query.error;
    var rows = (query.data || []).filter(function(row){
      return isStagePayment(row,stageId,baseLabel);
    });
    return {
      count:rows.length,
      amount:rows.reduce(function(sum,row){ return sum + Number(row.amount || 0); },0)
    };
  }

  async function saveSequencedPayment(c){
    var stageEl = document.getElementById('pfStage');
    var amountEl = document.getElementById('pfAmount');
    var dateEl = document.getElementById('pfDate');
    var refEl = document.getElementById('pfRef');
    var remarksEl = document.getElementById('pfRemarks');

    var stageCode = stageEl ? stageEl.value : null;
    var amount = amountEl ? parseFloat(amountEl.value) : NaN;
    var paymentDate = dateEl ? dateEl.value : '';
    var reference = refEl ? refEl.value.trim() : '';
    var remarks = remarksEl ? remarksEl.value.trim() : '';

    state.paymentFormStage = stageCode;

    if (!stageCode){
      state.paymentFormError = 'Select an installment.';
      renderDetail();
      return;
    }
    if (!amount || amount <= 0){
      state.paymentFormError = 'Enter a valid amount.';
      renderDetail();
      return;
    }
    if (!paymentDate){
      state.paymentFormError = 'Select a payment date.';
      renderDetail();
      return;
    }

    var stage = c.stages.filter(function(row){ return row.code === stageCode; })[0];
    if (!stage || !stage.id){
      state.paymentFormError = 'That installment has no schedule row to update.';
      renderDetail();
      return;
    }

    state.paymentFormSaving = true;
    state.paymentFormError = null;
    renderDetail();

    try{
      var paidBefore = Number(stage.paid || 0);
      var due = Number(stage.due || 0);
      var paidAfter = paidBefore + amount;
      var priorStage = await priorStagePaymentSummary(c.sno,stage.id,stage.label);
      var transactionLabel = paymentLabel(stage.label,due,amount,priorStage.count,priorStage.amount);
      var scheduleStatus = paidAfter >= due - 1 ? 'Paid' : 'Partial';

      var scheduleUpdate = await sb.from('payment_schedule').update({
        paid_amount:paidAfter,
        paid_date:paymentDate,
        status:scheduleStatus
      }).eq('id',stage.id);
      if (scheduleUpdate.error) throw scheduleUpdate.error;

      var transactionInsert = await sb.from('payment_transactions').insert({
        customer_id:c.customerId,
        unit_id:c.sno,
        payment_schedule_id:stage.id,
        payment_date:paymentDate,
        payment_type:transactionLabel,
        amount:amount,
        payment_reference:reference || null,
        remarks:remarks || null
      });
      if (transactionInsert.error) throw transactionInsert.error;

      state.paymentFormOpen = false;
      state.paymentFormSaving = false;
      state.paymentFormStage = null;
      await loadFromSupabase();
      render();
    }catch(err){
      state.paymentFormSaving = false;
      state.paymentFormError = err && err.message ? err.message : 'Could not save that payment.';
      renderDetail();
    }
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissSequencedPaymentLabelsInstalled) return;
    window.__sunblissSequencedPaymentLabelsInstalled = true;

    document.addEventListener('click',function(ev){
      var target = ev.target && ev.target.closest ? ev.target.closest('#pfSave') : null;
      if (!target) return;

      // Credit-note-capable forms are handled by the newer credit note save path.
      // Do not stop that handler when the credit note section is open.
      var creditPanel = document.getElementById('pfCreditFields');
      if (creditPanel && !creditPanel.hidden) return;

      var c = currentCustomer();
      if (!c) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      saveSequencedPayment(c);
    },true);
  }

  install();
})();
