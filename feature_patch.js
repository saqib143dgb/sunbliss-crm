(function(){
  'use strict';

  function currentCustomer(){
    if (!window.state || !state.selectedUnit) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }

  function valueOf(id){
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function input(id,label,value,type,extra){
    return '<label class="brand-field">' + esc(label) + '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(value === null || value === undefined ? '' : String(value)) + '"' + (extra || '') + ' /></label>';
  }

  function dateValue(d){
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    if (typeof dateToISO === 'function' && d instanceof Date) return dateToISO(d);
    var x = d instanceof Date ? d : new Date(d);
    if (isNaN(x.getTime())) return '';
    var m = x.getMonth() + 1, day = x.getDate();
    return x.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  async function enrichTransactions(){
    if (!window.sb || !window.state) return;
    var results = await Promise.all([
      sb.from('payment_transactions').select('*').order('payment_date',{ascending:false}).order('id',{ascending:false}),
      sb.from('customers').select('id,customer_name'),
      sb.from('units').select('id,unit_no')
    ]);
    results.forEach(function(r){ if (r.error) throw r.error; });
    var customers = {}, units = {};
    (results[1].data || []).forEach(function(c){ customers[c.id] = c; });
    (results[2].data || []).forEach(function(u){ units[u.id] = u; });
    state.recent = (results[0].data || []).map(function(t){
      return {
        id:t.id,
        customerId:t.customer_id,
        unitId:t.unit_id,
        name:customers[t.customer_id] ? customers[t.customer_id].customer_name : '',
        unit:units[t.unit_id] ? units[t.unit_id].unit_no : '',
        date:typeof toJsDate === 'function' ? toJsDate(t.payment_date) : (t.payment_date ? new Date(t.payment_date) : null),
        towards:t.payment_type || '',
        amount:typeof toNum === 'function' ? toNum(t.amount) : Number(t.amount),
        paidBy:'',
        ref:t.payment_reference || '',
        status:'',
        remark:t.remarks || ''
      };
    });
  }

  function showCustomerEditor(c){
    var existing = document.getElementById('customerEditPanel');
    if (existing){ existing.remove(); return; }
    var info = c.info || {};
    var panel = document.createElement('div');
    panel.id = 'customerEditPanel';
    panel.className = 'brand-editor';
    panel.style.marginBottom = '16px';
    panel.innerHTML =
      '<p class="section-label" style="margin-top:0">Edit customer details</p>' +
      '<p class="stat-sub" style="margin:-5px 0 12px">Changes are saved directly to the customer record.</p>' +
      '<p class="brand-error" id="customerEditError" style="display:none"></p>' +
      input('ceName','Full name',c.name) +
      input('cePhone','Phone',info.phone) +
      input('ceEmail','Email',info.email,'email') +
      input('ceNationality','Nationality',info.nationality) +
      input('ceDesignation','Occupation',info.designation) +
      input('ceDob','Date of birth',dateValue(info.dob),'date') +
      input('cePassport','Passport no.',info.passport) +
      input('ceEid','Emirates ID',info.eid) +
      input('ceAddress','Address',info.address) +
      input('cePermanentAddress','Permanent address',info.permanentAddress) +
      input('ceCoApplicant','Co-applicant',info.coApplicant) +
      '<div class="brand-editor-actions">' +
        '<button class="btn btn-gold" id="ceSave" style="justify-content:center">Save changes</button>' +
        '<button class="btn-paper" id="ceCancel" style="justify-content:center;margin-bottom:0">Cancel</button>' +
      '</div>';
    var editBtn = document.getElementById('btnEditCustomer');
    if (editBtn && editBtn.parentNode) editBtn.parentNode.insertBefore(panel, editBtn.nextSibling);
    document.getElementById('ceCancel').onclick = function(){ panel.remove(); };
    document.getElementById('ceSave').onclick = function(){ saveCustomer(c); };
  }

  async function saveCustomer(c){
    var err = document.getElementById('customerEditError');
    var save = document.getElementById('ceSave');
    var name = valueOf('ceName');
    if (!name){
      err.textContent = 'Customer name cannot be blank.';
      err.style.display = 'block';
      return;
    }
    save.disabled = true;
    save.textContent = 'Saving…';
    err.style.display = 'none';
    try{
      var payload = {
        customer_name:name,
        phone:valueOf('cePhone') || null,
        email:valueOf('ceEmail') || null,
        nationality:valueOf('ceNationality') || null,
        designation:valueOf('ceDesignation') || null,
        date_of_birth:valueOf('ceDob') || null,
        passport_no:valueOf('cePassport') || null,
        eid_no:valueOf('ceEid') || null,
        address:valueOf('ceAddress') || null,
        permanent_address:valueOf('cePermanentAddress') || null,
        co_applicant:valueOf('ceCoApplicant') || null,
        updated_at:new Date().toISOString()
      };
      var r = await sb.from('customers').update(payload).eq('id',c.customerId);
      if (r.error) throw r.error;
      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      await loadFromSupabase();
      goToDetail(unit,sno,from);
    }catch(e){
      err.textContent = e && e.message ? e.message : 'Could not save customer details.';
      err.style.display = 'block';
      save.disabled = false;
      save.textContent = 'Save changes';
    }
  }

  function closeTransactionMenus(){
    document.querySelectorAll('.tx-actions-menu').forEach(function(menu){ menu.style.display = 'none'; });
    document.querySelectorAll('.tx-actions-btn').forEach(function(btn){ btn.setAttribute('aria-expanded','false'); });
  }

  function transactionMenuItem(label,danger){
    return '<button type="button" style="display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:' + (danger ? 'var(--rust)' : 'var(--ink)') + ';cursor:pointer;">' + esc(label) + '</button>';
  }

  async function showTransactionEditor(c,t,row){
    var existing = document.getElementById('transactionEditPanel');
    if (existing){ existing.remove(); }
    closeTransactionMenus();

    if (!t || !t.id){
      alert('This transaction cannot be edited because its database ID is unavailable. Refresh the page and try again.');
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'transactionEditPanel';
    panel.className = 'brand-editor';
    panel.style.cssText = 'margin:4px 0 14px;';
    panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit transaction</p><p class="stat-sub">Loading transaction…</p>';
    row.parentNode.insertBefore(panel,row.nextSibling);

    try{
      var results = await Promise.all([
        sb.from('payment_transactions').select('*').eq('id',t.id).single(),
        sb.from('payment_schedule').select('id,stage_name,due_amount,paid_amount').eq('customer_id',t.customerId).eq('unit_id',t.unitId).order('id')
      ]);
      results.forEach(function(r){ if (r.error) throw r.error; });
      var tx = results[0].data;
      var stages = results[1].data || [];
      if (!tx) throw new Error('Transaction not found.');
      if (!stages.length) throw new Error('No installment schedule is linked to this customer and unit.');

      var stageOptions = '';
      stages.forEach(function(stage){
        var label = stage.stage_name || '';
        var selected = label.trim().toLowerCase() === String(tx.payment_type || '').trim().toLowerCase();
        stageOptions += '<option value="' + esc(label) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
      });

      panel.innerHTML =
        '<p class="section-label" style="margin-top:0">Edit transaction</p>' +
        '<p class="stat-sub" style="margin:-5px 0 12px">Customer and unit stay fixed. Amount or installment changes automatically rebalance the installment ledger and the edit is retained in an audit log.</p>' +
        '<p class="brand-error" id="transactionEditError" style="display:none"></p>' +
        '<label class="brand-field">Installment<select id="teStage">' + stageOptions + '</select></label>' +
        input('teAmount','Amount paid (AED)',tx.amount,'number',' min="0.01" step="0.01"') +
        input('teDate','Payment date',tx.payment_date || '','date') +
        input('teRef','Reference',tx.payment_reference || '') +
        input('teRemarks','Remarks',tx.remarks || '') +
        '<div class="brand-editor-actions">' +
          '<button class="btn btn-gold" id="teSave" style="justify-content:center">Save changes</button>' +
          '<button class="btn-paper" id="teCancel" style="justify-content:center;margin-bottom:0">Cancel</button>' +
        '</div>';

      document.getElementById('teCancel').onclick = function(){ panel.remove(); };
      document.getElementById('teSave').onclick = function(){ saveTransaction(c,t,panel); };
    }catch(e){
      panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit transaction</p><p class="brand-error">' + esc(e && e.message ? e.message : 'Could not load that transaction.') + '</p><button class="btn-paper" id="teCloseError">Close</button>';
      var close = document.getElementById('teCloseError');
      if (close) close.onclick = function(){ panel.remove(); };
    }
  }

  async function saveTransaction(c,t,panel){
    var err = document.getElementById('transactionEditError');
    var save = document.getElementById('teSave');
    var stage = valueOf('teStage');
    var amount = Number(valueOf('teAmount'));
    var paymentDate = valueOf('teDate');

    if (!stage){
      err.textContent = 'Select an installment.';
      err.style.display = 'block';
      return;
    }
    if (!isFinite(amount) || amount <= 0){
      err.textContent = 'Enter a valid payment amount greater than zero.';
      err.style.display = 'block';
      return;
    }
    if (!paymentDate){
      err.textContent = 'Select a payment date.';
      err.style.display = 'block';
      return;
    }

    save.disabled = true;
    save.textContent = 'Saving…';
    err.style.display = 'none';

    try{
      var r = await sb.rpc('crm_edit_payment_transaction',{
        p_transaction_id:t.id,
        p_payment_date:paymentDate,
        p_amount:amount,
        p_payment_type:stage,
        p_payment_reference:valueOf('teRef') || null,
        p_remarks:valueOf('teRemarks') || null
      });
      if (r.error) throw r.error;
      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      if (panel) panel.remove();
      await loadFromSupabase();
      goToDetail(unit,sno,from);
    }catch(e){
      err.textContent = e && e.message ? e.message : 'Could not save that transaction.';
      err.style.display = 'block';
      save.disabled = false;
      save.textContent = 'Save changes';
    }
  }

  async function deleteTransaction(c,t,button){
    if (!t || !t.id){
      alert('This transaction cannot be deleted because its database ID is unavailable. Refresh the page and try again.');
      return;
    }
    var detail = [t.date ? fmtDate(t.date) : 'Unknown date', t.towards || 'Payment', fmtAED(t.amount)].join(' · ');
    if (!confirm('Delete this transaction?\n\n' + detail + '\n\nThis also reverses the matching installment balance. The deletion is retained in an audit log.')) return;
    closeTransactionMenus();
    button.disabled = true;
    button.textContent = 'Deleting…';
    try{
      var r = await sb.rpc('crm_delete_payment_transaction',{p_transaction_id:t.id});
      if (r.error) throw r.error;
      var result = r.data || {};
      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      var editPanel = document.getElementById('transactionEditPanel');
      if (editPanel) editPanel.remove();
      await loadFromSupabase();
      goToDetail(unit,sno,from);
      if (result.schedule_updated === false){
        alert('Transaction deleted. The installment row could not be matched automatically, so please review that customer’s installment ledger.');
      }
    }catch(e){
      alert(e && e.message ? e.message : 'Could not delete that transaction.');
      button.disabled = false;
      button.textContent = 'Delete transaction';
    }
  }

  function addTransactionActions(c,row,t){
    if (!t || row.querySelector('.tx-actions-btn')) return;

    var wrap = document.createElement('span');
    wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex:none;align-self:center;';
    wrap.innerHTML =
      '<button type="button" class="tx-actions-btn" aria-label="Transaction actions" aria-haspopup="menu" aria-expanded="false" style="width:30px;height:30px;border:1px solid rgba(0,0,0,.14);border-radius:8px;background:transparent;color:var(--muted);font-size:20px;line-height:24px;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;">&#8942;</button>' +
      '<span class="tx-actions-menu" role="menu" style="display:none;position:absolute;right:0;top:34px;z-index:80;min-width:170px;padding:6px;background:var(--paper);border:1px solid rgba(0,0,0,.13);border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.16);">' +
        transactionMenuItem('Edit transaction',false) +
        transactionMenuItem('Delete transaction',true) +
      '</span>';

    var button = wrap.querySelector('.tx-actions-btn');
    var menu = wrap.querySelector('.tx-actions-menu');
    var items = menu.querySelectorAll('button');

    button.onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      var opening = menu.style.display === 'none';
      closeTransactionMenus();
      if (opening){
        menu.style.display = 'block';
        button.setAttribute('aria-expanded','true');
      }
    };

    items[0].onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      showTransactionEditor(c,t,row);
    };

    items[1].onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      deleteTransaction(c,t,items[1]);
    };

    row.appendChild(wrap);
  }

  function augmentDetail(){
    if (!window.state || state.userRole !== 'crm_officer') return;
    var c = currentCustomer();
    if (!c) return;
    var detail = document.querySelector('.detail');
    if (!detail) return;

    if (!document.getElementById('btnEditCustomer')){
      var btn = document.createElement('button');
      btn.className = 'btn-paper';
      btn.id = 'btnEditCustomer';
      btn.style.marginBottom = '16px';
      btn.innerHTML = (typeof editIcon === 'function' ? editIcon() : '') + 'Edit customer details';
      var badges = detail.querySelector('.badges');
      if (badges) badges.parentNode.insertBefore(btn,badges.nextSibling);
      else detail.insertBefore(btn,detail.firstChild);
      btn.onclick = function(){ showCustomerEditor(c); };
    }

    var txs = typeof matchTransactions === 'function' ? matchTransactions(c) : [];
    var rows = detail.querySelectorAll('.tx-list .tx-row');
    rows.forEach(function(row,index){
      addTransactionActions(c,row,txs[index]);
    });
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function' || typeof window.loadFromSupabase !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissEditDeleteInstalled) return;
    window.__sunblissEditDeleteInstalled = true;

    document.addEventListener('click',closeTransactionMenus);

    var originalLoad = window.loadFromSupabase;
    window.loadFromSupabase = async function(){
      var out = await originalLoad.apply(this,arguments);
      await enrichTransactions();
      return out;
    };

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      augmentDetail();
      return out;
    };

    enrichTransactions().then(function(){
      if (state.view === 'detail') augmentDetail();
    }).catch(function(e){ console.error('Could not enrich transaction IDs',e); });
  }

  install();
})();
