(function(){
  'use strict';

  if (window.__sunblissPaymentDetailMenuInstalled) return;
  window.__sunblissPaymentDetailMenuInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function money(value){
    return typeof window.fmtAED === 'function'
      ? window.fmtAED(Number(value) || 0)
      : 'AED ' + (Number(value) || 0).toLocaleString('en-US',{maximumFractionDigits:2});
  }
  function formatDate(value){
    if (!value) return 'Date not set';
    var d = value instanceof Date ? value : new Date(String(value).length===10 ? String(value)+'T00:00:00' : value);
    if (isNaN(d.getTime())) return 'Date not set';
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){
      return c && (text(c.unit)+'::'+text(c.sno)) === text(state.selectedUnit);
    }) || null;
  }
  function derivedStatus(stage){
    var due = Number(stage && stage.due || 0);
    var paid = Number(stage && stage.paid || 0);
    if (stage && (stage.due === null || stage.due === undefined)) return 'Not set';
    if (paid <= 0) return 'Outstanding';
    if (due > 0 && paid >= due - 0.01) return 'Paid';
    return 'Partial';
  }
  function ordinal(n){
    var mod100=n%100, suffix='th';
    if (mod100<11 || mod100>13){
      if (n%10===1) suffix='st';
      else if (n%10===2) suffix='nd';
      else if (n%10===3) suffix='rd';
    }
    return n+suffix;
  }
  function installmentNumber(label){
    var match=text(label).trim().match(/^(\d+)(?:st|nd|rd|th)\s+Installment$/i);
    return match ? parseInt(match[1],10) : null;
  }
  function nextInstallmentNumber(c){
    var max=7;
    (c && c.stages || []).forEach(function(stage){
      var n=installmentNumber(stage && stage.label);
      if (n!==null && n>max) max=n;
    });
    return max+1;
  }
  function valueOf(id){
    var el=document.getElementById(id);
    return el ? text(el.value).trim() : '';
  }
  function closeActionMenu(){
    var menu=document.getElementById('customerActionMenu');
    var button=document.getElementById('customerActionMenuButton');
    if (menu) menu.style.display='none';
    if (button) button.setAttribute('aria-expanded','false');
  }

  function ensureStyles(){
    if (document.getElementById('sunblissPaymentDetailStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissPaymentDetailStyles';
    style.textContent=[
      '#extraInstallmentTools{display:none!important;}',
      '#paymentDetailOverlay{position:fixed;inset:0;z-index:2480;background:rgba(15,26,38,.62);display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));overflow:auto}',
      '#paymentDetailDialog{width:min(680px,100%);max-height:min(90vh,800px);overflow:auto;background:var(--paper);border:1px solid var(--paper-line);border-radius:18px;padding:18px;box-shadow:0 24px 70px rgba(15,26,38,.38)}',
      '#paymentDetailDialog h3{font-family:Fraunces,serif;font-size:22px;margin:0 0 3px}',
      '#paymentDetailDialog .payment-detail-sub{font-size:12px;color:var(--muted);margin:0 0 15px}',
      '.payment-detail-list{display:grid;gap:8px;margin:0 0 18px}',
      '.payment-detail-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--paper-line);border-radius:12px;background:var(--paper-dim)}',
      '.payment-detail-row-title{font:700 13px/1.3 Inter,sans-serif;color:var(--ink)}',
      '.payment-detail-row-meta{display:flex;flex-wrap:wrap;gap:5px 10px;margin-top:4px;font-size:10.8px;line-height:1.35;color:var(--muted)}',
      '.payment-detail-row .btn-paper{min-width:70px;margin:0!important;justify-content:center;white-space:nowrap}',
      '.payment-detail-add{padding:13px;border:1px solid rgba(198,151,46,.34);border-radius:13px;background:rgba(198,151,46,.07)}',
      '.payment-detail-add h4{margin:0 0 3px;font:700 14px/1.3 Inter,sans-serif;color:var(--ink)}',
      '.payment-detail-add p{margin:0 0 11px;font-size:11px;line-height:1.45;color:var(--muted)}',
      '.payment-detail-add-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.payment-detail-add input{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper);box-sizing:border-box}',
      '.payment-detail-actions{display:flex;gap:8px;margin-top:14px}',
      '.payment-detail-actions button{flex:1;justify-content:center;margin:0}',
      '@media(min-width:641px){#paymentDetailOverlay{align-items:center}}',
      '@media(max-width:520px){.payment-detail-row{grid-template-columns:1fr}.payment-detail-row .btn-paper{width:100%}.payment-detail-add-grid{grid-template-columns:1fr}.payment-detail-actions{flex-direction:column}.payment-detail-actions button{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  function makeMenuItem(){
    var button=document.createElement('button');
    button.type='button';
    button.id='actionEditPaymentDetail';
    button.textContent='Edit payment detail';
    button.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
    return button;
  }

  function ensureMenuItem(){
    ensureStyles();
    if (!window.state || state.view!=='detail' || state.userRole!=='crm_officer') return;
    var c=currentCustomer();
    var menu=document.getElementById('customerActionMenu');
    if (!c || !menu || document.getElementById('actionEditPaymentDetail')) return;
    var item=makeMenuItem();
    var record=document.getElementById('actionRecordPayment');
    if (record && record.parentNode===menu) record.insertAdjacentElement('afterend',item);
    else menu.appendChild(item);
    item.addEventListener('click',function(ev){
      ev.preventDefault(); ev.stopPropagation();
      closeActionMenu();
      openPaymentDetail();
    });
  }

  function closePaymentDetail(){
    var overlay=document.getElementById('paymentDetailOverlay');
    if (overlay) overlay.remove();
  }

  function stageRowHtml(stage,index){
    var hasSchedule=!!(stage && stage.id);
    var dueSet=stage && stage.due !== null && stage.due !== undefined;
    var dueText=dueSet ? money(stage.due) : 'Amount not set';
    var dateText=stage && stage.dueDate ? formatDate(stage.dueDate) : 'Date not set';
    var paidText=money(stage && stage.paid || 0);
    var status=derivedStatus(stage);
    return '<div class="payment-detail-row">'+
      '<div><div class="payment-detail-row-title">'+safe(stage && stage.label || 'Installment')+'</div>'+
      '<div class="payment-detail-row-meta"><span>Due: '+safe(dueText)+'</span><span>'+safe(dateText)+'</span><span>Paid: '+safe(paidText)+'</span><span>Status: '+safe(status)+'</span></div></div>'+
      '<button type="button" class="btn-paper payment-detail-edit" data-stage-index="'+index+'">'+(hasSchedule || dueSet ? 'Edit' : 'Set up')+'</button>'+
      '</div>';
  }

  function openExistingEditor(index){
    closePaymentDetail();
    var cards=document.querySelectorAll('.ledger-scroll .stage-card');
    var card=cards[index];
    if (!card){ alert('That installment is not visible. Refresh the CRM and try again.'); return; }
    var menuButton=card.querySelector('.installment-menu-btn');
    if (!menuButton){ alert('Installment editor is not available. Refresh the CRM and try again.'); return; }
    menuButton.click();
    var edit=card.querySelector('.installment-menu-pop button');
    if (edit) edit.click();
    else alert('Installment editor is not available. Refresh the CRM and try again.');
  }

  function openPaymentDetail(){
    closePaymentDetail();
    var c=currentCustomer();
    if (!c) return;
    ensureStyles();
    var stages=Array.isArray(c.stages) ? c.stages : [];
    var nextNo=nextInstallmentNumber(c);
    var nextLabel=ordinal(nextNo)+' Installment';
    var overlay=document.createElement('div');
    overlay.id='paymentDetailOverlay';
    overlay.innerHTML='<div id="paymentDetailDialog" role="dialog" aria-modal="true" aria-labelledby="paymentDetailTitle">'+
      '<h3 id="paymentDetailTitle">Edit payment detail</h3>'+
      '<p class="payment-detail-sub">Unit '+safe(c.unit)+' · '+safe(c.name)+' · edit the existing schedule or add another installment.</p>'+
      '<p class="brand-error" id="paymentDetailError" style="display:none"></p>'+
      '<div class="payment-detail-list">'+stages.map(stageRowHtml).join('')+'</div>'+
      '<div class="payment-detail-add">'+
        '<h4>Add '+safe(nextLabel)+'</h4>'+
        '<p>The new installment starts as Outstanding with AED 0 paid. You can edit payment status later from the installment editor.</p>'+
        '<div class="payment-detail-add-grid">'+
          '<label class="brand-field">Installment amount (AED)<input type="number" id="pdAddAmount" min="0.01" step="0.01" inputmode="decimal" placeholder="e.g. 50000" /></label>'+
          '<label class="brand-field">Due date<input type="date" id="pdAddDueDate" /></label>'+
        '</div>'+
        '<label class="brand-field">Remarks (optional)<input type="text" id="pdAddRemarks" placeholder="e.g. revised payment plan" /></label>'+
        '<button class="btn btn-gold" type="button" id="pdAddSave" style="width:100%;justify-content:center;margin-top:4px">Add '+safe(nextLabel)+'</button>'+
      '</div>'+
      '<div class="payment-detail-actions"><button class="btn-paper" type="button" id="pdClose">Close</button></div>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click',function(ev){ if (ev.target===overlay) closePaymentDetail(); });
    document.getElementById('pdClose').onclick=closePaymentDetail;
    document.getElementById('pdAddSave').onclick=function(){ addInstallment(c,nextLabel); };
    overlay.querySelectorAll('.payment-detail-edit').forEach(function(button){
      button.addEventListener('click',function(){
        openExistingEditor(Number(button.getAttribute('data-stage-index')));
      });
    });
  }

  async function addInstallment(c,label){
    var amount=Number(valueOf('pdAddAmount'));
    var dueDate=valueOf('pdAddDueDate');
    var remarks=valueOf('pdAddRemarks') || null;
    var err=document.getElementById('paymentDetailError');
    var save=document.getElementById('pdAddSave');
    function fail(message){ if (err){ err.textContent=message; err.style.display='block'; } }
    if (!isFinite(amount) || amount<=0){ fail('Enter a valid installment amount.'); return; }
    if (!dueDate){ fail('Select the installment due date.'); return; }
    save.disabled=true; save.textContent='Adding…'; if (err) err.style.display='none';
    var key=state.selectedUnit, from=state.detailFrom || 'list';
    try{
      var result=await sb.rpc('crm_save_installment',{
        p_schedule_id:null,
        p_unit_id:c.sno,
        p_stage_name:label,
        p_due_amount:Math.round(amount*100)/100,
        p_due_date:dueDate,
        p_paid_amount:0,
        p_paid_date:null,
        p_remarks:remarks
      });
      if (result.error) throw result.error;
      closePaymentDetail();
      await loadFromSupabase();
      state.selectedUnit=key; state.detailFrom=from; state.view='detail';
      if (typeof window.renderMain==='function') window.renderMain();
      else if (typeof window.renderDetail==='function') window.renderDetail();
      window.setTimeout(openPaymentDetail,0);
    }catch(ex){
      fail(ex&&ex.message?ex.message:'Could not add that installment.');
      save.disabled=false; save.textContent='Add '+label;
    }
  }

  function refresh(){
    ensureStyles();
    if (window.state) state.extraInstallmentFormOpen=false;
    ensureMenuItem();
  }

  if (typeof window.renderDetail==='function'){
    var originalRenderDetail=window.renderDetail;
    window.renderDetail=function(){
      var out=originalRenderDetail.apply(this,arguments);
      refresh();
      return out;
    };
  }
  window.addEventListener('pageshow',refresh);
  window.addEventListener('popstate',function(){ closePaymentDetail(); refresh(); });
  refresh();
})();