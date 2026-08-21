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

  function input(id,label,value,type){
    return '<label class="brand-field">' + esc(label) + '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(value || '') + '" /></label>';
  }

  function dateValue(d){
    if (!d) return '';
    if (typeof dateToISO === 'function') return dateToISO(d);
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
    editBtn.parentNode.insertBefore(panel, editBtn.nextSibling);
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
      await enrichTransactions();
      goToDetail(unit,sno,from);
    }catch(e){
      err.textContent = e && e.message ? e.message : 'Could not save customer details.';
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
    button.disabled = true;
    button.textContent = 'Deleting…';
    try{
      var r = await sb.rpc('crm_delete_payment_transaction',{p_transaction_id:t.id});
      if (r.error) throw r.error;
      var result = r.data || {};
      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      await loadFromSupabase();
      await enrichTransactions();
      goToDetail(unit,sno,from);
      if (result.schedule_updated === false){
        alert('Transaction deleted. The installment row could not be matched automatically, so please review that customer’s installment ledger.');
      }
    }catch(e){
      alert(e && e.message ? e.message : 'Could not delete that transaction.');
      button.disabled = false;
      button.textContent = 'Delete';
    }
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
      var t = txs[index];
      if (!t || row.querySelector('.tx-delete-btn')) return;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'tx-delete-btn';
      del.textContent = 'Delete';
      del.setAttribute('aria-label','Delete transaction');
      del.style.cssText = 'flex:none;border:1px solid rgba(174,59,43,.35);background:rgba(174,59,43,.08);color:var(--rust);padding:6px 9px;border-radius:8px;font-size:11px;font-weight:600;';
      del.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        deleteTransaction(c,t,del);
      };
      row.appendChild(del);
    });
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function' || typeof window.loadFromSupabase !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissEditDeleteInstalled) return;
    window.__sunblissEditDeleteInstalled = true;

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
