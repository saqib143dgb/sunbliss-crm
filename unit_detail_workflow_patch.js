(function(){
  'use strict';

  function text(v){ return v === null || v === undefined ? '' : String(v); }
  function safe(v){
    return typeof esc === 'function' ? esc(text(v)) : text(v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }
  function valueOf(id){
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }
  function numberValue(id,label){
    var raw = valueOf(id);
    var n = raw === '' ? 0 : Number(raw);
    if (!isFinite(n) || n < 0) throw new Error(label + ' must be a valid non-negative amount.');
    return Math.round(n * 100) / 100;
  }
  function todayISO(){
    var d = new Date();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function formatMoney(n){
    return typeof fmtAED === 'function' ? fmtAED(Number(n)||0) : 'AED ' + (Number(n)||0).toLocaleString('en-US',{maximumFractionDigits:2});
  }

  var style = document.createElement('style');
  style.id = 'unitDetailWorkflowStyles';
  style.textContent =
    '.detail-top-actions-sticky{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:120;padding:7px 8px;margin:-4px -8px 12px;background:color-mix(in srgb,var(--paper) 94%,transparent);border:1px solid rgba(22,35,47,.10);border-radius:12px;box-shadow:0 8px 22px rgba(15,26,38,.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}' +
    '.detail-top-actions-sticky #btnBack{min-height:40px;padding:8px 10px!important;margin:0!important;font-weight:650;color:var(--ink);}' +
    '.detail-top-actions-sticky #btnPrintStatement{min-height:40px;padding:8px 12px!important;}' +
    '.detail #btnOpenPaymentForm{display:flex!important;width:100%!important;max-width:none!important;min-height:48px!important;justify-content:center!important;margin:4px 0 12px!important;border-radius:12px!important;background:var(--gold)!important;border-color:var(--gold)!important;color:var(--ink-2)!important;font-weight:750!important;font-size:13.5px!important;box-shadow:0 5px 14px rgba(143,106,30,.18);}' +
    '.detail #btnOpenPaymentForm:hover{background:#d6a63e!important;}' +
    '.detail #btnOpenPaymentForm:focus-visible{outline:3px solid rgba(143,106,30,.35)!important;outline-offset:2px!important;}' +
    '.record-payment-panel{margin:4px 0 12px!important;border:1px solid rgba(198,151,46,.38)!important;box-shadow:none!important;}' +
    '#actionCancelUnit{border-top:1px solid rgba(174,59,43,.18)!important;margin-top:5px!important;padding-top:11px!important;color:var(--rust)!important;}' +
    '#unitCancellationPanel{border:1px solid rgba(174,59,43,.28);box-shadow:0 8px 20px rgba(15,26,38,.08);}' +
    '#unitCancellationPanel .cancel-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:10px;overflow:hidden;margin:8px 0 14px;}' +
    '#unitCancellationPanel .cancel-summary>div{background:var(--paper);padding:10px 11px;}' +
    '#unitCancellationPanel .cancel-summary-label{font-family:IBM Plex Mono,monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 4px;}' +
    '#unitCancellationPanel .cancel-summary-value{font-family:Fraunces,serif;font-size:14px;font-weight:600;margin:0;color:var(--ink);}' +
    '#unitCancellationPanel textarea,#unitCancellationPanel select{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font-family:Inter,sans-serif;font-size:16px;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}' +
    '#unitCancellationPanel .cancel-danger{background:var(--rust)!important;border-color:var(--rust)!important;color:#fff!important;}' +
    '@media(max-width:480px){.detail-top-actions-sticky{margin-left:-10px;margin-right:-10px;border-radius:10px}.detail-top-actions-sticky #btnPrintStatement{padding-left:10px!important;padding-right:10px!important}#unitCancellationPanel .brand-editor-actions{flex-direction:column}#unitCancellationPanel .brand-editor-actions button{width:100%}}';
  document.head.appendChild(style);

  function closeCustomerMenu(){
    var menu = document.getElementById('customerActionMenu');
    var button = document.getElementById('customerActionMenuButton');
    if (menu) menu.style.display = 'none';
    if (button) button.setAttribute('aria-expanded','false');
  }

  function insertAfterBadges(panel){
    var detail = document.querySelector('.detail');
    if (!detail) return;
    var badges = detail.querySelector('.badges');
    if (badges && badges.parentNode) badges.parentNode.insertBefore(panel,badges.nextSibling);
    else detail.insertBefore(panel,detail.firstChild);
  }

  function settlementFields(paid){
    var settlement = valueOf('cuSettlement');
    var refund = document.getElementById('cuRefundAmount');
    var forfeit = document.getElementById('cuForfeitedAmount');
    if (!refund || !forfeit) return;
    if (settlement === 'Refunded'){
      refund.disabled = false; forfeit.disabled = true;
      if (!refund.dataset.touched) refund.value = paid.toFixed(2);
      forfeit.value = '0.00';
    }else if (settlement === 'Forfeited'){
      refund.disabled = true; forfeit.disabled = false;
      refund.value = '0.00';
      if (!forfeit.dataset.touched) forfeit.value = paid.toFixed(2);
    }else if (settlement === 'Split'){
      refund.disabled = false; forfeit.disabled = false;
    }else{
      refund.disabled = true; forfeit.disabled = true;
      refund.value = '0.00'; forfeit.value = '0.00';
    }
  }

  function showCancellationPanel(c){
    var existing = document.getElementById('unitCancellationPanel');
    if (existing){ existing.remove(); return; }

    ['customerEditPanel','saleComplianceEditPanel','transactionEditPanel'].forEach(function(id){
      var p = document.getElementById(id); if (p) p.remove();
    });

    var paid = Math.max(0, Number(c.received) || 0);
    var panel = document.createElement('div');
    panel.id = 'unitCancellationPanel';
    panel.className = 'brand-editor';
    panel.style.marginBottom = '16px';
    panel.innerHTML =
      '<p class="section-label" style="margin-top:0;color:var(--rust)">Cancel unit</p>' +
      '<p class="stat-sub" style="margin:-5px 0 10px">This removes the unit from the active portfolio but keeps its customer, payment schedule and transaction history for audit.</p>' +
      '<div class="cancel-summary">' +
        '<div><p class="cancel-summary-label">Unit</p><p class="cancel-summary-value">' + safe(c.unit || '—') + '</p></div>' +
        '<div><p class="cancel-summary-label">Paid to date</p><p class="cancel-summary-value">' + safe(formatMoney(paid)) + '</p></div>' +
      '</div>' +
      '<p class="brand-error" id="unitCancellationError" style="display:none"></p>' +
      '<label class="brand-field">Cancellation date<input type="date" id="cuDate" value="' + todayISO() + '" /></label>' +
      '<label class="brand-field">Reason category<select id="cuType">' +
        '<option value="Customer withdrawal">Customer no longer wants to continue</option>' +
        '<option value="Defaulter">Defaulter / non-payment</option>' +
        '<option value="Other">Other</option>' +
      '</select></label>' +
      '<label class="brand-field">Detailed reason<textarea id="cuReason" rows="3" placeholder="Explain why the customer is cancelling or why the unit is being cancelled." required></textarea></label>' +
      '<label class="brand-field">Treatment of money paid<select id="cuSettlement">' +
        '<option value="Refunded">Refunded</option>' +
        '<option value="Forfeited">Forfeited</option>' +
        '<option value="Split">Part refunded / part forfeited</option>' +
        '<option value="No settlement">No refund or forfeiture recorded yet</option>' +
      '</select></label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<label class="brand-field">Refunded amount (AED)<input type="number" id="cuRefundAmount" min="0" step="0.01" value="' + paid.toFixed(2) + '" /></label>' +
        '<label class="brand-field">Forfeited amount (AED)<input type="number" id="cuForfeitedAmount" min="0" step="0.01" value="0.00" /></label>' +
      '</div>' +
      '<label class="brand-field">Remarks / follow-up notes<textarea id="cuRemarks" rows="3" placeholder="Optional internal notes, refund reference, notice history, etc."></textarea></label>' +
      '<div class="brand-editor-actions">' +
        '<button class="btn btn-gold cancel-danger" id="cuConfirm" style="justify-content:center">Cancel unit</button>' +
        '<button class="btn-paper" id="cuKeep" style="justify-content:center;margin-bottom:0">Keep unit active</button>' +
      '</div>';
    insertAfterBadges(panel);

    var settlement = document.getElementById('cuSettlement');
    var refund = document.getElementById('cuRefundAmount');
    var forfeit = document.getElementById('cuForfeitedAmount');
    settlement.onchange = function(){ settlementFields(paid); };
    refund.oninput = function(){ refund.dataset.touched = '1'; };
    forfeit.oninput = function(){ forfeit.dataset.touched = '1'; };
    settlementFields(paid);
    document.getElementById('cuKeep').onclick = function(){ panel.remove(); };
    document.getElementById('cuConfirm').onclick = function(){ saveCancellation(c,panel,paid); };
    setTimeout(function(){ var reason = document.getElementById('cuReason'); if (reason) reason.focus(); },0);
  }

  async function saveCancellation(c,panel,paid){
    var err = document.getElementById('unitCancellationError');
    var save = document.getElementById('cuConfirm');
    try{
      var date = valueOf('cuDate');
      var type = valueOf('cuType');
      var reason = valueOf('cuReason');
      var settlement = valueOf('cuSettlement');
      var refund = numberValue('cuRefundAmount','Refunded amount');
      var forfeited = numberValue('cuForfeitedAmount','Forfeited amount');
      var remarks = valueOf('cuRemarks');

      if (!date) throw new Error('Select a cancellation date.');
      if (!reason || reason.length < 5) throw new Error('Enter a clear cancellation reason.');
      if (refund + forfeited > paid + 0.01) throw new Error('Refunded plus forfeited amount cannot exceed the amount paid to date.');
      if (settlement === 'Refunded' && forfeited > 0) throw new Error('A refunded cancellation cannot also include a forfeited amount. Choose the split option instead.');
      if (settlement === 'Forfeited' && refund > 0) throw new Error('A forfeited cancellation cannot also include a refund. Choose the split option instead.');
      if (settlement === 'No settlement' && (refund > 0 || forfeited > 0)) throw new Error('No settlement should have zero refunded and forfeited amounts.');

      var summary = 'Cancel unit ' + (c.unit || '') + '?\n\n' +
        'Customer: ' + (c.name || '') + '\n' +
        'Paid to date: ' + formatMoney(paid) + '\n' +
        'Refunded: ' + formatMoney(refund) + '\n' +
        'Forfeited: ' + formatMoney(forfeited) + '\n\n' +
        'Reason: ' + reason;
      if (!window.confirm(summary)) return;

      save.disabled = true;
      save.textContent = 'Cancelling…';
      if (err) err.style.display = 'none';

      var result = await sb.rpc('crm_cancel_unit',{
        p_unit_id:Number(c.sno),
        p_cancellation_date:date,
        p_cancellation_type:type,
        p_cancellation_reason:reason,
        p_settlement_type:settlement,
        p_refund_amount:refund,
        p_forfeited_amount:forfeited,
        p_remarks:remarks || null
      });
      if (result.error) throw result.error;

      await loadFromSupabase();
      state.selectedUnit = null;
      state.detailFrom = 'list';
      state.view = 'list';
      renderMain();
      window.scrollTo(0,0);
      var data = result.data || {};
      window.alert('Unit ' + (c.unit || '') + ' cancelled. Paid: ' + formatMoney(data.amount_paid !== undefined ? data.amount_paid : paid) + ', refunded: ' + formatMoney(data.refund_amount !== undefined ? data.refund_amount : refund) + ', forfeited: ' + formatMoney(data.forfeited_amount !== undefined ? data.forfeited_amount : forfeited) + '.');
    }catch(e){
      if (err){
        err.textContent = e && e.message ? e.message : 'Could not cancel this unit.';
        err.style.display = 'block';
      }else{
        window.alert(e && e.message ? e.message : 'Could not cancel this unit.');
      }
      if (save){ save.disabled = false; save.textContent = 'Cancel unit'; }
    }
  }

  async function enrichCancelledUnits(){
    if (!window.state || !Array.isArray(state.cancelled) || !state.cancelled.length) return;
    try{
      var q = await sb.from('cancelled_units').select('unit_id,amount_paid,cancellation_type,cancellation_reason,settlement_type,refund_amount,forfeited_amount,remarks,cancellation_date');
      if (q.error) throw q.error;
      var byUnit = {};
      (q.data || []).forEach(function(row){ byUnit[String(row.unit_id)] = row; });
      state.cancelled.forEach(function(c){
        var row = byUnit[String(c.sno)];
        if (!row) return;
        if (row.amount_paid !== null && row.amount_paid !== undefined) c.received = Number(row.amount_paid) || 0;
        c.cancelMeta = row;
      });
    }catch(e){
      console.warn('Could not enrich cancelled-unit details',e);
    }
  }

  function enhanceDetail(){
    if (!window.state || state.view !== 'detail') return;
    var c = currentCustomer();
    var back = document.getElementById('btnBack');
    if (back && back.parentElement){
      back.parentElement.classList.add('detail-top-actions-sticky');
      back.setAttribute('aria-label',back.textContent.trim() || 'Back');
      back.title = 'Back';
    }

    var recordItem = document.getElementById('actionRecordPayment');
    if (recordItem) recordItem.remove();

    var paymentButton = document.getElementById('btnOpenPaymentForm');
    if (paymentButton){
      paymentButton.setAttribute('aria-label','Record payment for this unit');
      paymentButton.title = 'Record payment';
    }
    var paymentStage = document.getElementById('pfStage');
    if (paymentStage){
      var paymentPanel = paymentStage.closest('.brand-editor');
      if (paymentPanel) paymentPanel.classList.add('record-payment-panel');
    }

    if (state.userRole === 'crm_officer' && c){
      var menu = document.getElementById('customerActionMenu');
      if (menu && !document.getElementById('actionCancelUnit')){
        var cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.id = 'actionCancelUnit';
        cancel.textContent = 'Cancel unit';
        cancel.style.cssText = 'display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;cursor:pointer;';
        cancel.onclick = function(ev){
          ev.preventDefault(); ev.stopPropagation();
          closeCustomerMenu();
          showCancellationPanel(c);
        };
        menu.appendChild(cancel);
      }
    }
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function' || typeof window.loadFromSupabase !== 'function' || !window.__sunblissCustomerActionMenuInstalled){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissUnitDetailWorkflowInstalled) return;
    window.__sunblissUnitDetailWorkflowInstalled = true;

    var originalLoad = window.loadFromSupabase;
    window.loadFromSupabase = async function(){
      var out = await originalLoad.apply(this,arguments);
      await enrichCancelledUnits();
      return out;
    };

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      enhanceDetail();
      return out;
    };

    if (state.view === 'detail') enhanceDetail();
    enrichCancelledUnits();
  }

  install();
})();
