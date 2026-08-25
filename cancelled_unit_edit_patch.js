(function(){
  'use strict';

  if (window.__sunblissCancelledUnitEditInstalled) return;
  window.__sunblissCancelledUnitEditInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissCancelledUnitEditStyles';
  style.textContent = [
    '.cancelled-edit-actions{display:flex;gap:8px;flex-wrap:wrap;margin:-2px 0 14px;}',
    '.cancelled-edit-actions .btn-paper,.cancelled-edit-actions .btn{margin:0!important;}',
    '.cancelled-edit-outcome{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;border:1px solid rgba(198,151,46,.35);background:rgba(198,151,46,.08);font:600 10.5px/1.2 Inter,sans-serif;color:var(--gold-deep);}',
    '.cancelled-edit-adjusted{margin:0 0 16px;padding:10px 12px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);font-size:11.5px;line-height:1.5;color:var(--muted);}',
    '.cancelled-edit-adjusted b{color:var(--ink);font-weight:650;}',
    '.cancelled-edit-modal{position:fixed;inset:0;z-index:10040;display:flex;align-items:flex-end;justify-content:center;background:rgba(9,18,26,.66);backdrop-filter:blur(4px);padding:16px;}',
    '.cancelled-edit-card{width:min(620px,100%);max-height:91vh;overflow:auto;background:var(--paper);color:var(--ink);border:1px solid rgba(198,151,46,.35);border-radius:18px 18px 14px 14px;box-shadow:0 24px 70px rgba(0,0,0,.38);padding:18px;}',
    '.cancelled-edit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}',
    '.cancelled-edit-kicker{margin:0 0 4px;font:600 9.5px/1.2 "IBM Plex Mono",monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--rust);}',
    '.cancelled-edit-title{margin:0;font:650 21px/1.12 Fraunces,serif;color:var(--ink);}',
    '.cancelled-edit-sub{margin:4px 0 0;font-size:11.5px;color:var(--muted);}',
    '.cancelled-edit-close{flex:none;width:34px;height:34px;border:1px solid var(--paper-line);border-radius:999px;background:var(--paper-dim);color:var(--ink);font-size:20px;line-height:1;}',
    '.cancelled-edit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;}',
    '.cancelled-edit-card .brand-field{margin-bottom:12px;}',
    '.cancelled-edit-card input,.cancelled-edit-card select,.cancelled-edit-card textarea{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:9px;font:500 16px/1.25 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}',
    '.cancelled-edit-card textarea{min-height:78px;resize:vertical;}',
    '.cancelled-edit-settlement{margin:2px 0 13px;padding:12px;border:1px solid rgba(198,151,46,.28);border-radius:12px;background:rgba(198,151,46,.06);}',
    '.cancelled-edit-settlement-title{margin:0 0 9px;font:600 9.5px/1.2 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-deep);}',
    '.cancelled-edit-money-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}',
    '.cancelled-edit-money-grid .brand-field{margin:0;}',
    '.cancelled-edit-help{margin:9px 0 0;font-size:10.8px;line-height:1.45;color:var(--muted);}',
    '.cancelled-edit-error{display:none;margin:0 0 12px;padding:10px 11px;border-radius:9px;background:rgba(174,59,43,.09);border:1px solid rgba(174,59,43,.25);color:var(--rust);font-size:12px;line-height:1.45;}',
    '.cancelled-edit-history{margin:16px 0 2px;padding-top:13px;border-top:1px solid var(--paper-line);}',
    '.cancelled-edit-history-title{margin:0 0 8px;font:600 9.5px/1.2 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}',
    '.cancelled-edit-history-row{padding:8px 0;border-top:1px solid rgba(220,210,182,.65);font-size:11px;line-height:1.45;color:var(--muted);}',
    '.cancelled-edit-history-row:first-of-type{border-top:0;}',
    '.cancelled-edit-history-row b{display:block;color:var(--ink);font-weight:650;}',
    '.cancelled-edit-footer{display:flex;gap:9px;margin-top:16px;position:sticky;bottom:-18px;background:var(--paper);padding:12px 0 2px;border-top:1px solid var(--paper-line);}',
    '.cancelled-edit-footer button{flex:1;justify-content:center;margin:0!important;}',
    '@media(max-width:520px){.cancelled-edit-modal{padding:0;align-items:flex-end}.cancelled-edit-card{border-radius:18px 18px 0 0;padding:16px 14px;max-height:94vh}.cancelled-edit-grid{grid-template-columns:1fr}.cancelled-edit-money-grid{grid-template-columns:1fr}.cancelled-edit-footer{bottom:-16px}.cancelled-edit-actions{flex-direction:column}.cancelled-edit-actions button{width:100%;justify-content:center}}'
  ].join('');
  document.head.appendChild(style);

  function text(v){ return v === null || v === undefined ? '' : String(v); }
  function esc(v){
    if (typeof window.esc === 'function') return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; });
  }
  function num(v){
    if (v === null || v === undefined || v === '') return 0;
    var n = Number(v);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  function nullableNum(v){
    if (v === null || v === undefined || text(v).trim() === '') return null;
    var n = Number(v);
    return isFinite(n) ? Math.round(n * 100) / 100 : null;
  }
  function money(v){
    var n = num(v);
    if (typeof window.fmtAED === 'function') return window.fmtAED(n);
    return 'AED ' + n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function dateInput(v){
    if (!v) return '';
    var s = text(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    var d = new Date(v);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,10);
  }
  function dateLabel(v){
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d.getTime())) return text(v);
    return d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function option(value,current,label){
    return '<option value="'+esc(value)+'"'+(text(value).toLowerCase()===text(current).toLowerCase()?' selected':'')+'>'+esc(label||value)+'</option>';
  }
  function field(id,label,value,type,extra){
    return '<label class="brand-field">'+esc(label)+'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value)+'"'+(extra||'')+'></label>';
  }
  function cache(){ return window.__sunblissCancelledUnitArchive || null; }
  function currentRecord(){
    var c = cache();
    if (!c || !window.state || !state.__cancelledArchiveDetailId) return null;
    return c.byId && c.byId[String(state.__cancelledArchiveDetailId)] || null;
  }
  function isCrmOfficer(){
    return !window.state || !state.userRole || state.userRole === 'crm_officer';
  }
  function outcome(record){
    var v = text(record && record.cancel && record.cancel.settlement_type).trim();
    return v || 'Forfeited';
  }
  function retained(record){ return num(record && record.cancel && record.cancel.retained_amount); }

  function updateInitialCancellationCopy(){
    var note = document.querySelector('#unitCancellationPanel .sunbliss-forfeit-rule-note');
    if (note){
      note.textContent = 'New cancellations start as 100% forfeited with no refund. If management later approves a refund, customer retention or a split settlement, edit the cancelled unit from Insights.';
    }
  }

  function ensureFinance(record,page){
    var finance = page.querySelector('.cancelled-archive-finance');
    if (!finance) return;
    var labels = finance.querySelectorAll('.cancelled-archive-finance-label');
    var hasRetained = false;
    Array.prototype.forEach.call(labels,function(label){
      if (text(label.textContent).trim().toLowerCase() === 'retained for customer') hasRetained = true;
    });
    if (!hasRetained){
      var cell = document.createElement('div');
      cell.className = 'cancelled-edit-retained-cell';
      cell.innerHTML = '<p class="cancelled-archive-finance-label">Retained for customer</p><p class="cancelled-archive-finance-value good">'+esc(money(retained(record)))+'</p>';
      finance.appendChild(cell);
    }else{
      Array.prototype.forEach.call(finance.children,function(cell){
        var label = cell.querySelector('.cancelled-archive-finance-label');
        if (label && text(label.textContent).trim().toLowerCase() === 'retained for customer'){
          var val = cell.querySelector('.cancelled-archive-finance-value');
          if (val) val.textContent = money(retained(record));
        }
      });
    }
  }

  function decorateDetail(){
    updateInitialCancellationCopy();
    if (!window.state || !state.__cancelledArchiveDetailOpen) return;
    var record = currentRecord();
    var page = document.querySelector('.cancelled-archive-page');
    if (!record || !page) return;

    record.retainedAmount = retained(record);
    ensureFinance(record,page);

    var badges = page.querySelector('.cancelled-archive-badges');
    if (badges && !badges.querySelector('.cancelled-edit-outcome')){
      var badge = document.createElement('span');
      badge.className = 'cancelled-edit-outcome';
      badge.textContent = outcome(record);
      badges.appendChild(badge);
    }else if (badges){
      var existingBadge = badges.querySelector('.cancelled-edit-outcome');
      if (existingBadge) existingBadge.textContent = outcome(record);
    }

    if (!page.querySelector('.cancelled-edit-actions')){
      var actions = document.createElement('div');
      actions.className = 'cancelled-edit-actions';
      if (isCrmOfficer()){
        actions.innerHTML = '<button type="button" class="btn btn-gold" id="cancelledEditRecord">Edit cancelled unit</button>';
        var anchor = page.querySelector('.cancelled-archive-finance') || page.querySelector('.cancelled-archive-explain');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(actions,anchor);
        else page.appendChild(actions);
        var edit = document.getElementById('cancelledEditRecord');
        if (edit) edit.addEventListener('click',function(){ openEditor(record); });
      }
    }

    var adjusted = page.querySelector('.cancelled-edit-adjusted');
    if (record.cancel && record.cancel.last_adjusted_at){
      if (!adjusted){
        adjusted = document.createElement('div');
        adjusted.className = 'cancelled-edit-adjusted';
        var explain = page.querySelector('.cancelled-archive-explain');
        if (explain && explain.parentNode) explain.parentNode.insertBefore(adjusted,explain.nextSibling);
        else page.appendChild(adjusted);
      }
      adjusted.innerHTML = '<b>Last adjusted '+esc(dateLabel(record.cancel.last_adjusted_at))+'</b>' + (record.cancel.last_adjustment_reason ? '<br>'+esc(record.cancel.last_adjustment_reason) : '');
    }
  }

  function settlementInputs(record){
    var paid = num(record.amountPaid !== undefined ? record.amountPaid : record.cancel.amount_paid);
    var forfeited = num(record.forfeitedAmount !== undefined ? record.forfeitedAmount : record.cancel.forfeited_amount);
    var refund = num(record.refundAmount !== undefined ? record.refundAmount : record.cancel.refund_amount);
    var kept = retained(record);
    return '<div class="cancelled-edit-settlement">' +
      '<p class="cancelled-edit-settlement-title">Settlement outcome</p>' +
      '<label class="brand-field">Outcome<select id="cueOutcome">' +
        option('Forfeited',outcome(record)) + option('Refunded',outcome(record)) + option('Customer Retained',outcome(record)) + option('Split',outcome(record),'Split settlement') +
      '</select></label>' +
      '<div class="cancelled-edit-money-grid">' +
        field('cueForfeited','Forfeited (AED)',forfeited.toFixed(2),'number',' min="0" step="0.01" inputmode="decimal"') +
        field('cueRefunded','Refunded (AED)',refund.toFixed(2),'number',' min="0" step="0.01" inputmode="decimal"') +
        field('cueRetained','Customer retained (AED)',kept.toFixed(2),'number',' min="0" step="0.01" inputmode="decimal"') +
      '</div>' +
      '<p class="cancelled-edit-help" id="cueSettlementHelp">The three settlement amounts must equal the amount paid. Full outcomes are filled automatically; choose Split to enter a combination.</p>' +
    '</div>';
  }

  async function loadHistory(id){
    var host = document.getElementById('cueHistoryRows');
    if (!host) return;
    host.innerHTML = '<div class="cancelled-edit-history-row">Loading adjustment history…</div>';
    try{
      var result = await sb.from('cancelled_unit_adjustments').select('id,changed_at,change_reason,old_values,new_values').eq('cancelled_unit_id',id).order('changed_at',{ascending:false}).limit(12);
      if (result.error) throw result.error;
      var rows = result.data || [];
      if (!rows.length){ host.innerHTML = '<div class="cancelled-edit-history-row">No previous adjustments yet.</div>'; return; }
      host.innerHTML = rows.map(function(row){
        var oldSet = row.old_values && row.old_values.settlement_type;
        var newSet = row.new_values && row.new_values.settlement_type;
        var summary = oldSet || newSet ? '<br>'+esc(oldSet || '—')+' → '+esc(newSet || '—') : '';
        return '<div class="cancelled-edit-history-row"><b>'+esc(dateLabel(row.changed_at))+'</b>'+esc(row.change_reason || 'Adjustment')+summary+'</div>';
      }).join('');
    }catch(err){
      host.innerHTML = '<div class="cancelled-edit-history-row">History could not be loaded.</div>';
    }
  }

  function openEditor(record){
    closeEditor();
    var cancel = record.cancel || {};
    var customerName = record.customer && record.customer.customer_name ? record.customer.customer_name : 'Customer';
    var modal = document.createElement('div');
    modal.className = 'cancelled-edit-modal';
    modal.id = 'cancelledUnitEditModal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML = '<div class="cancelled-edit-card">' +
      '<div class="cancelled-edit-head"><div><p class="cancelled-edit-kicker">Editable cancellation archive</p><h2 class="cancelled-edit-title">'+esc(record.unitNo || 'Cancelled unit')+'</h2><p class="cancelled-edit-sub">'+esc(customerName)+' · every save is kept in adjustment history</p></div><button type="button" class="cancelled-edit-close" id="cueClose" aria-label="Close">×</button></div>' +
      '<div class="cancelled-edit-error" id="cueError"></div>' +
      '<div class="cancelled-edit-grid">' +
        field('cueDate','Cancellation date',dateInput(cancel.cancellation_date),'date') +
        field('cueSaleValue','Cancelled sale value (AED)',cancel.cancelled_sale_value === null || cancel.cancelled_sale_value === undefined ? '' : cancel.cancelled_sale_value,'number',' min="0" step="0.01" inputmode="decimal" placeholder="Enter value if legacy record says Not recorded"') +
        field('cueAmountPaid','Amount paid at cancellation (AED)',record.amountPaid !== undefined ? record.amountPaid : cancel.amount_paid,'number',' min="0" step="0.01" inputmode="decimal"') +
        field('cueType','Cancellation category',cancel.cancellation_type || '') +
      '</div>' +
      '<label class="brand-field">Cancellation reason<textarea id="cueReason">'+esc(cancel.cancellation_reason || '')+'</textarea></label>' +
      settlementInputs(record) +
      '<label class="brand-field">Remarks<textarea id="cueRemarks">'+esc(cancel.remarks || '')+'</textarea></label>' +
      '<label class="brand-field">Reason for this change <span style="color:var(--rust)">*</span><textarea id="cueChangeReason" placeholder="e.g. Management approved refund after customer appeal"></textarea></label>' +
      '<div class="cancelled-edit-history"><p class="cancelled-edit-history-title">Adjustment history</p><div id="cueHistoryRows"></div></div>' +
      '<div class="cancelled-edit-footer"><button type="button" class="btn-paper" id="cueCancel">Cancel</button><button type="button" class="btn btn-gold" id="cueSave">Save adjustment</button></div>' +
    '</div>';
    document.body.appendChild(modal);

    document.getElementById('cueClose').onclick = closeEditor;
    document.getElementById('cueCancel').onclick = closeEditor;
    modal.addEventListener('click',function(ev){ if (ev.target === modal) closeEditor(); });
    document.getElementById('cueOutcome').addEventListener('change',syncSettlementFields);
    document.getElementById('cueAmountPaid').addEventListener('input',function(){ if (document.getElementById('cueOutcome').value !== 'Split') syncSettlementFields(); });
    document.getElementById('cueSave').addEventListener('click',function(){ saveEditor(record); });
    syncSettlementFields();
    loadHistory(record.id);
    window.setTimeout(function(){ var input = document.getElementById('cueSaleValue'); if (input && !input.value) input.focus(); },30);
  }

  function closeEditor(){
    var modal = document.getElementById('cancelledUnitEditModal');
    if (modal) modal.remove();
  }

  function value(id){ var el = document.getElementById(id); return el ? text(el.value).trim() : ''; }
  function fieldNumber(id,label,allowBlank){
    var raw = value(id);
    if (allowBlank && raw === '') return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) throw new Error(label+' must be a valid non-negative number.');
    return Math.round(n * 100) / 100;
  }

  function syncSettlementFields(){
    var outcomeEl = document.getElementById('cueOutcome');
    if (!outcomeEl) return;
    var paid = Math.max(0,num(value('cueAmountPaid')));
    var forfeited = document.getElementById('cueForfeited');
    var refunded = document.getElementById('cueRefunded');
    var retainedEl = document.getElementById('cueRetained');
    var split = outcomeEl.value === 'Split';
    [forfeited,refunded,retainedEl].forEach(function(el){ if (el) el.disabled = !split; });
    if (!split){
      if (forfeited) forfeited.value = (outcomeEl.value === 'Forfeited' ? paid : 0).toFixed(2);
      if (refunded) refunded.value = (outcomeEl.value === 'Refunded' ? paid : 0).toFixed(2);
      if (retainedEl) retainedEl.value = (outcomeEl.value === 'Customer Retained' ? paid : 0).toFixed(2);
    }
    var help = document.getElementById('cueSettlementHelp');
    if (help){
      help.textContent = split ? 'Split settlement: refunded + forfeited + customer retained must equal '+money(paid)+'.' : outcomeEl.value+' will apply the full '+money(paid)+' automatically.';
    }
  }

  function showError(message){
    var el = document.getElementById('cueError');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.scrollIntoView({block:'nearest'});
  }

  async function saveEditor(record){
    var save = document.getElementById('cueSave');
    try{
      var paid = fieldNumber('cueAmountPaid','Amount paid',false);
      var saleValue = fieldNumber('cueSaleValue','Cancelled sale value',true);
      var outcomeValue = value('cueOutcome');
      var forfeited = fieldNumber('cueForfeited','Forfeited amount',false);
      var refunded = fieldNumber('cueRefunded','Refunded amount',false);
      var retainedValue = fieldNumber('cueRetained','Customer retained amount',false);
      var changeReason = value('cueChangeReason');
      if (changeReason.length < 3) throw new Error('Enter a short reason for this adjustment.');
      if (outcomeValue === 'Split' && Math.abs((forfeited + refunded + retainedValue) - paid) > 0.01){
        throw new Error('For a split settlement, refunded + forfeited + customer retained must equal '+money(paid)+'.');
      }

      save.disabled = true;
      save.textContent = 'Saving…';
      var err = document.getElementById('cueError');
      if (err) err.style.display = 'none';

      var result = await sb.rpc('crm_edit_cancelled_unit',{
        p_cancelled_unit_id:Number(record.id),
        p_cancellation_date:value('cueDate') || null,
        p_cancellation_type:value('cueType') || null,
        p_cancellation_reason:value('cueReason') || null,
        p_amount_paid:paid,
        p_settlement_type:outcomeValue,
        p_refund_amount:refunded,
        p_forfeited_amount:forfeited,
        p_retained_amount:retainedValue,
        p_cancelled_sale_value:saleValue,
        p_remarks:value('cueRemarks') || null,
        p_change_reason:changeReason
      });
      if (result.error) throw result.error;
      var newRow = result.data && result.data.record ? result.data.record : null;
      if (!newRow) throw new Error('The adjustment saved, but the updated record was not returned.');

      record.cancel = newRow;
      record.amountPaid = num(newRow.amount_paid);
      record.refundAmount = num(newRow.refund_amount);
      record.forfeitedAmount = num(newRow.forfeited_amount);
      record.retainedAmount = num(newRow.retained_amount);
      record.originalSaleValue = nullableNum(newRow.cancelled_sale_value);
      if (record.originalSaleValue === null){
        record.lostAmount = null;
      }else if (!record.resaleSale){
        record.lostAmount = record.originalSaleValue;
      }else if (record.resaleValue !== null && record.resaleValue !== undefined){
        record.lostAmount = Math.max(0,record.originalSaleValue-num(record.resaleValue));
      }else{
        record.lostAmount = null;
      }
      record.netUnrecovered = record.lostAmount === null ? null : Math.max(0,record.lostAmount-record.forfeitedAmount);

      var c = cache();
      if (c){ c.version = Number(c.version||0)+1; }
      if (window.state && Array.isArray(state.cancelled)){
        state.cancelled.forEach(function(item){
          if (!item) return;
          if (String(item.cancelArchiveId) === String(record.id) || String(item.sno) === String(record.cancel.unit_id)){
            item.cancelMeta = newRow;
            item.total = record.originalSaleValue;
            item.received = record.amountPaid;
            item.lostAmount = record.lostAmount;
            item.forfeitedAmount = record.forfeitedAmount;
            item.refundAmount = record.refundAmount;
            item.retainedAmount = record.retainedAmount;
          }
        });
      }

      closeEditor();
      reopenDetail(record.id);
    }catch(ex){
      showError(ex && ex.message ? ex.message : 'Could not save the cancellation adjustment.');
      if (save){ save.disabled = false; save.textContent = 'Save adjustment'; }
    }
  }

  function reopenDetail(id){
    if (window.state){
      state.__cancelledArchiveDetailOpen = false;
      state.__cancelledArchiveDetailId = null;
      state.view = 'insights';
    }
    if (typeof window.renderInsights === 'function') window.renderInsights();
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(function(){
        var row = document.querySelector('.cancelled-archive-row[data-cancel-id="'+String(id)+'"]');
        if (row) row.click();
      });
    });
  }

  function scan(){
    updateInitialCancellationCopy();
    decorateDetail();
  }

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){ window.requestAnimationFrame(scan); });
    observer.observe(app,{childList:true,subtree:true});
  }
  document.addEventListener('keydown',function(ev){ if (ev.key === 'Escape') closeEditor(); });
  window.addEventListener('pageshow',scan);
  scan();
})();
