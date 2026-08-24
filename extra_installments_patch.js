(function(){
  'use strict';

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function normalize(value){ return text(value).replace(/\s+/g,' ').trim().toLowerCase(); }
  function jsDate(value){
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var d = new Date(String(value) + (String(value).length === 10 ? 'T00:00:00' : ''));
    return isNaN(d.getTime()) ? null : d;
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }
  function ordinal(n){
    var mod100 = n % 100;
    var suffix = 'th';
    if (mod100 < 11 || mod100 > 13){
      if (n % 10 === 1) suffix = 'st';
      else if (n % 10 === 2) suffix = 'nd';
      else if (n % 10 === 3) suffix = 'rd';
    }
    return n + suffix;
  }
  function installmentNumber(label){
    var match = text(label).trim().match(/^(\d+)(?:st|nd|rd|th)\s+Installment$/i);
    return match ? parseInt(match[1],10) : null;
  }
  function fixedStageNames(){
    var names = {};
    function add(value){ if (value) names[normalize(value)] = true; }
    if (typeof window.STAGES !== 'undefined' && Array.isArray(window.STAGES)){
      window.STAGES.forEach(function(stage){ add(stage.label); });
    }
    if (typeof window.STAGE_CODE_TO_NAME !== 'undefined' && window.STAGE_CODE_TO_NAME){
      Object.keys(window.STAGE_CODE_TO_NAME).forEach(function(code){ add(window.STAGE_CODE_TO_NAME[code]); });
    }
    add('DLD + Admin Fees');
    add('DLD + Admin Fees (SPA)');
    add('Final (Handover)');
    add('Final Installment (Handover)');
    return names;
  }
  function isFixedStageName(name){ return !!fixedStageNames()[normalize(name)]; }
  function extraStageFromRow(row){
    return {
      code:'EXTRA_' + row.id,
      label:row.stage_name || 'Additional Installment',
      id:row.id,
      due:row.due_amount === null || row.due_amount === undefined ? null : Number(row.due_amount),
      dueDate:jsDate(row.due_date),
      paid:row.paid_amount === null || row.paid_amount === undefined ? 0 : Number(row.paid_amount),
      paidDate:jsDate(row.paid_date),
      outAmt:(Number(row.due_amount) || 0) - (Number(row.paid_amount) || 0),
      extraInstallment:true,
      remarks:row.remarks || ''
    };
  }
  function stageRank(stage){
    var fixed = {DP:0,'1ST':10,DLD:15,'2ND':20,'3RD':30,'4TH':40,'5TH':50,'6TH':60,'7TH':70,FIN:10000};
    if (Object.prototype.hasOwnProperty.call(fixed,stage.code)) return fixed[stage.code];
    var number = installmentNumber(stage.label);
    if (number !== null) return number * 10;
    if (stage.extraInstallment) return 9000;
    return 9500;
  }
  function recalcCustomer(c){
    if (!c || !Array.isArray(c.stages)) return;
    c.stages.sort(function(a,b){
      var diff = stageRank(a) - stageRank(b);
      if (diff) return diff;
      var ad = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      var bd = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });

    var scheduleDue = 0;
    var schedulePaid = 0;
    c.stages.forEach(function(stage){
      scheduleDue += Number(stage.due || 0);
      schedulePaid += Number(stage.paid || 0);
      stage.outAmt = stage.due === null || stage.due === undefined ? null : Number(stage.due || 0) - Number(stage.paid || 0);
    });
    c.received = schedulePaid;
    c.outstanding = schedulePaid - scheduleDue;

    var next = c.stages.find(function(stage){
      return stage.due !== null && stage.due !== undefined && Number(stage.due || 0) - Number(stage.paid || 0) > 1;
    });
    c.upStage = next ? next.label : '';
    c.upAmt = next ? Number(next.due || 0) - Number(next.paid || 0) : null;
    c.upDate = next ? next.dueDate : null;

    if (next && next.code === '1ST'){
      var dld = c.stages.find(function(stage){ return stage.code === 'DLD'; });
      if (dld && dld.due !== null && dld.due !== undefined){
        var dldRemaining = Number(dld.due || 0) - Number(dld.paid || 0);
        if (dldRemaining > 1){
          c.upStage += ' + DLD';
          c.upAmt += dldRemaining;
        }
      }
    }
  }

  var enrichInFlight = null;
  function enrichExtraInstallments(){
    if (enrichInFlight) return enrichInFlight;
    enrichInFlight = (async function(){
      var result = await sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,paid_amount,paid_date,status,remarks');
      if (result.error) throw result.error;
      var byUnit = {};
      (result.data || []).forEach(function(row){
        if (isFixedStageName(row.stage_name)) return;
        var key = String(row.unit_id);
        (byUnit[key] = byUnit[key] || []).push(row);
      });

      [state.dues,state.cancelled].forEach(function(list){
        if (!Array.isArray(list)) return;
        list.forEach(function(c){
          c.stages = (c.stages || []).filter(function(stage){ return !stage.extraInstallment; });
          (byUnit[String(c.sno)] || []).forEach(function(row){ c.stages.push(extraStageFromRow(row)); });
          recalcCustomer(c);
        });
      });
      return true;
    })();
    return enrichInFlight.then(function(value){ enrichInFlight = null; return value; },function(err){ enrichInFlight = null; throw err; });
  }

  function nextInstallmentNumber(c){
    var max = 7;
    (c.stages || []).forEach(function(stage){
      var number = installmentNumber(stage.label);
      if (number !== null && number > max) max = number;
    });
    return max + 1;
  }
  function valueOf(id){
    var el = document.getElementById(id);
    return el ? text(el.value).trim() : '';
  }
  function ensureStyles(){
    if (document.getElementById('extraInstallmentStyles')) return;
    var style = document.createElement('style');
    style.id = 'extraInstallmentStyles';
    style.textContent =
      '.extra-installment-tools{margin:10px 0 18px;}' +
      '#btnAddInstallment{display:flex;width:100%;min-height:44px;justify-content:center;align-items:center;gap:7px;margin:0!important;border-style:dashed!important;font-weight:700;}' +
      '#extraInstallmentPanel{margin:10px 0 18px;border:1px solid rgba(198,151,46,.32);box-shadow:none;}' +
      '#extraInstallmentPanel .extra-installment-name{font-family:Fraunces,serif;font-size:17px;font-weight:650;color:var(--ink);margin:0 0 4px;}' +
      '#extraInstallmentPanel .extra-installment-help{font-size:11.5px;line-height:1.45;color:var(--muted);margin:0 0 12px;}' +
      '@media(max-width:480px){#extraInstallmentPanel .brand-editor-actions{flex-direction:column}#extraInstallmentPanel .brand-editor-actions button{width:100%}}';
    document.head.appendChild(style);
  }
  function addIcon(){
    if (typeof window.plusIcon === 'function') return window.plusIcon();
    return '<span aria-hidden="true">+</span>';
  }
  function renderExtraInstallmentUI(){
    if (!window.state || state.view !== 'detail' || state.userRole !== 'crm_officer') return;
    var c = currentCustomer();
    var ledger = document.querySelector('.detail .ledger-scroll');
    if (!c || !ledger || !ledger.parentNode) return;
    ensureStyles();

    var old = document.getElementById('extraInstallmentTools');
    if (old) old.remove();
    var tools = document.createElement('div');
    tools.id = 'extraInstallmentTools';
    tools.className = 'extra-installment-tools';
    ledger.parentNode.insertBefore(tools,ledger.nextSibling);

    if (!state.extraInstallmentFormOpen){
      tools.innerHTML = '<button class="btn-paper" id="btnAddInstallment">' + addIcon() + 'Add installment</button>';
      document.getElementById('btnAddInstallment').onclick = function(){
        state.extraInstallmentFormOpen = true;
        state.extraInstallmentError = null;
        renderDetail();
      };
      return;
    }

    var number = nextInstallmentNumber(c);
    var label = ordinal(number) + ' Installment';
    tools.innerHTML =
      '<div class="brand-editor" id="extraInstallmentPanel">' +
        (state.extraInstallmentError ? '<p class="brand-error">' + safe(state.extraInstallmentError) + '</p>' : '') +
        '<p class="extra-installment-name">' + safe(label) + '</p>' +
        '<p class="extra-installment-help">Add another payment stage for this customer. It will appear in the installment ledger, Record Payment selector, overdue tracking and Action Required summary.</p>' +
        '<label class="brand-field">Installment amount (AED)<input type="number" id="eiAmount" min="0.01" step="0.01" placeholder="e.g. 50000" /></label>' +
        '<label class="brand-field">Due date<input type="date" id="eiDueDate" /></label>' +
        '<label class="brand-field">Remarks (optional)<input type="text" id="eiRemarks" placeholder="e.g. additional payment plan stage" /></label>' +
        '<div class="brand-editor-actions">' +
          '<button class="btn btn-gold" id="eiSave" style="justify-content:center"' + (state.extraInstallmentSaving ? ' disabled' : '') + '>' + (state.extraInstallmentSaving ? 'Saving…' : 'Add ' + safe(label)) + '</button>' +
          '<button class="btn-paper" id="eiCancel" style="justify-content:center;margin-bottom:0"' + (state.extraInstallmentSaving ? ' disabled' : '') + '>Cancel</button>' +
        '</div>' +
      '</div>';
    document.getElementById('eiCancel').onclick = function(){
      state.extraInstallmentFormOpen = false;
      state.extraInstallmentError = null;
      renderDetail();
    };
    document.getElementById('eiSave').onclick = function(){ saveExtraInstallment(c); };
  }

  async function saveExtraInstallment(c){
    var amount = Number(valueOf('eiAmount'));
    var dueDate = valueOf('eiDueDate');
    var remarks = valueOf('eiRemarks');
    var detailKey = state.selectedUnit;
    var detailFrom = state.detailFrom;
    if (!isFinite(amount) || amount <= 0){
      state.extraInstallmentError = 'Enter a valid installment amount.';
      renderDetail();
      return;
    }
    if (!dueDate){
      state.extraInstallmentError = 'Select the installment due date.';
      renderDetail();
      return;
    }

    state.extraInstallmentSaving = true;
    state.extraInstallmentError = null;
    renderDetail();
    try{
      await enrichExtraInstallments();
      c = currentCustomer() || c;
      var number = nextInstallmentNumber(c);
      var label = ordinal(number) + ' Installment';
      var existing = await sb.from('payment_schedule').select('id').eq('unit_id',c.sno).eq('stage_name',label).limit(1);
      if (existing.error) throw existing.error;
      if (existing.data && existing.data.length) throw new Error(label + ' already exists. Refresh and try again.');

      var inserted = await sb.from('payment_schedule').insert({
        customer_id:c.customerId,
        unit_id:c.sno,
        stage_name:label,
        due_amount:Math.round(amount * 100) / 100,
        due_date:dueDate,
        paid_amount:0,
        paid_date:null,
        status:'Outstanding',
        remarks:remarks || null
      });
      if (inserted.error) throw inserted.error;

      state.extraInstallmentFormOpen = false;
      state.extraInstallmentSaving = false;
      state.extraInstallmentError = null;
      await loadFromSupabase();
      state.selectedUnit = detailKey;
      state.detailFrom = detailFrom;
      state.view = 'detail';
      if (typeof window.renderMain === 'function') window.renderMain();
      else renderDetail();
    }catch(err){
      state.extraInstallmentSaving = false;
      state.extraInstallmentError = err && err.message ? err.message : 'Could not add that installment.';
      state.selectedUnit = detailKey;
      state.detailFrom = detailFrom;
      state.view = 'detail';
      renderDetail();
    }
  }

  function install(){
    if (!window.state || !window.sb || typeof window.loadFromSupabase !== 'function' || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissExtraInstallmentsInstalled) return;
    window.__sunblissExtraInstallmentsInstalled = true;

    var originalLoad = window.loadFromSupabase;
    window.loadFromSupabase = async function(){
      var result = await originalLoad.apply(this,arguments);
      await enrichExtraInstallments();
      return result;
    };

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var result = originalRenderDetail.apply(this,arguments);
      renderExtraInstallmentUI();
      return result;
    };

    (function initialEnrich(attempt){
      if (Array.isArray(state.dues) && state.dues.length){
        enrichExtraInstallments().then(function(){
          if (state.view === 'detail') renderDetail();
          else if (typeof window.renderMain === 'function') window.renderMain();
        }).catch(function(err){ console.warn('Could not load extra installments',err); });
        return;
      }
      if (attempt < 60) setTimeout(function(){ initialEnrich(attempt + 1); },100);
    })(0);
  }

  install();
})();