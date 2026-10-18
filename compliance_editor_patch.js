(function(){
  'use strict';

  var saleNoteMetaCache = {};

  function normalize(value){
    return String(value || '').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function dateToIso(value){
    if (!value) return '';
    if (typeof window.dateToISO === 'function' && value instanceof Date) return window.dateToISO(value);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function selected(value, option){
    return String(value || '').toLowerCase() === String(option).toLowerCase() ? ' selected' : '';
  }

  function escapeHtml(value){
    if (typeof window.esc === 'function') return window.esc(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
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

  function complianceStageKind(name){
    var n=normalize(name).replace(/instalment/g,'installment');
    if (n.indexOf('dld')!==-1 || n.indexOf('admin fee')!==-1) return 'dld';
    if (n.indexOf('down payment')!==-1) return 'dp';
    if (/\b(1st|first)\b/.test(n) && n.indexOf('installment')!==-1) return 'first';
    return '';
  }

  function aed(value){
    var n=Math.max(0,Math.round((Number(value)||0)*100)/100);
    return typeof window.fmtAED==='function' ? window.fmtAED(n) : 'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2});
  }

  async function assertSpaReady(c){
    var result=await sb.rpc('crm_spa_payment_ready',{p_unit_id:Number(c.sno)});
    if(result.error)throw result.error;
    if(!result.data)throw new Error('Settle 20% or the down payment and first installment, plus DLD and admin fees, before marking the SPA signed.');
  }

  function numberOrNull(id,label,maximum){
    var raw = valueOf(id);
    if (!raw) return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) throw new Error(label + ' must be a valid non-negative number.');
    if (maximum !== undefined && n > maximum) throw new Error(label + ' cannot be more than ' + maximum + '.');
    return n;
  }

  function setFieldLabel(field,labelText){
    if (!field) return;
    var holder = field.closest ? field.closest('label.brand-field') : field.parentNode;
    if (!holder) return;
    for (var i=0;i<holder.childNodes.length;i++){
      var node=holder.childNodes[i];
      if (node.nodeType===3){ node.nodeValue=labelText; return; }
    }
  }

  async function getSaleNoteMeta(c,force){
    if (!c) return null;
    var key=String(c.sno);
    if (!force && saleNoteMetaCache[key]) return saleNoteMetaCache[key];
    var results=await Promise.all([
      sb.from('sales').select('id,booking_amount,partial_booking_note,remarks').eq('unit_id',c.sno).order('id',{ascending:false}).limit(1).single(),
      sb.from('payment_schedule').select('due_amount').eq('unit_id',c.sno).eq('stage_name','Down Payment').limit(1)
    ]);
    if (results[0].error) throw results[0].error;
    if (results[1].error) throw results[1].error;
    var sale=results[0].data || {};
    var dp=(results[1].data||[])[0] || null;
    var meta={
      saleId:sale.id || null,
      existingPartial:sale.partial_booking_note || '',
      dpDue:dp && dp.due_amount!=null ? Number(dp.due_amount) : 0
    };
    saleNoteMetaCache[key]=meta;
    return meta;
  }

  function partialEligible(bookingAmount,dpDue){
    return Number(bookingAmount)>0 && Number(dpDue)>0 && Number(bookingAmount)<Number(dpDue)-0.01;
  }

  function partialWrapHtml(value){
    return '<div id="scPartialBookingWrap">' +
      '<label class="brand-field">Partial Booking Note <span style="color:var(--rust);font-weight:700">*</span><textarea id="scPartialBookingNote" required placeholder="e.g. RM advised the remaining Down Payment to be completed by 01-Sep-2026." style="display:block;width:100%;min-height:78px;margin-top:5px;padding:9px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 13.5px/1.45 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;resize:vertical">' + escapeHtml(value||'') + '</textarea></label>' +
      '<p style="margin:-5px 0 12px;font-size:10.8px;line-height:1.45;color:var(--muted)">Mandatory when the original Booking Amount is below the Down Payment. Use it for the RM-advised completion follow-up only; it does not change the contractual Down Payment due date.</p>' +
      '</div>';
  }

  function syncPartialBookingField(panel,meta){
    if (!panel || !meta) return;
    var bookingRaw=valueOf('scBookingAmount');
    var booking=bookingRaw===''?0:Number(bookingRaw);
    var eligible=partialEligible(booking,meta.dpDue);
    panel.dataset.partialBookingEligible=eligible?'1':'0';
    panel.dataset.dpDue=String(meta.dpDue||0);

    var existing=document.getElementById('scPartialBookingWrap');
    if (existing && !eligible){
      var existingText=valueOf('scPartialBookingNote');
      if (existingText) panel.dataset.partialBookingDraft=existingText;
      existing.remove();
      return;
    }
    if (!eligible || existing) return;

    var remarks=document.getElementById('scRemarks');
    var remarksLabel=remarks && remarks.closest ? remarks.closest('label.brand-field') : null;
    var value=panel.dataset.partialBookingDraft || meta.existingPartial || '';
    if (remarksLabel){
      remarksLabel.insertAdjacentHTML('afterend',partialWrapHtml(value));
    }else{
      var actions=panel.querySelector('.brand-editor-actions');
      if (actions) actions.insertAdjacentHTML('beforebegin',partialWrapHtml(value));
    }
  }

  async function ensureSaleNotesFields(){
    var panel=document.getElementById('saleComplianceEditPanel');
    var c=currentCustomer();
    if (!panel || !c) return;

    var remarks=document.getElementById('scRemarks');
    if (remarks) setFieldLabel(remarks,'Special Note');

    var key=String(c.sno);
    if (panel.dataset.saleNotesUnit===key && panel.dataset.saleNotesReady==='1') return;
    if (panel.dataset.saleNotesLoading==='1') return;
    panel.dataset.saleNotesLoading='1';
    panel.dataset.saleNotesUnit=key;
    try{
      var meta=await getSaleNoteMeta(c,false);
      if (!document.getElementById('saleComplianceEditPanel') || currentCustomer()!==c) return;
      syncPartialBookingField(panel,meta);
      var booking=document.getElementById('scBookingAmount');
      if (booking && !booking.dataset.partialNoteWatch){
        booking.dataset.partialNoteWatch='1';
        booking.addEventListener('input',function(){ syncPartialBookingField(panel,meta); });
      }
      panel.dataset.saleNotesReady='1';
    }catch(err){
      console.warn('Could not load Edit Sale notes',err);
    }finally{
      panel.dataset.saleNotesLoading='0';
    }
  }

  async function saveSaleOnly(){
    var c = currentCustomer();
    var save = document.getElementById('scSave');
    var err = document.getElementById('saleComplianceError');
    if (!c || !save) return;

    try{
      var bookingAmount=numberOrNull('scBookingAmount','Booking amount');
      var meta=await getSaleNoteMeta(c,true);
      var isPartial=partialEligible(bookingAmount||0,meta ? meta.dpDue : 0);
      var partialNote=valueOf('scPartialBookingNote');
      if (!partialNote && document.getElementById('saleComplianceEditPanel')){
        partialNote=document.getElementById('saleComplianceEditPanel').dataset.partialBookingDraft || '';
      }
      if (isPartial && !partialNote){
        var partialField=document.getElementById('scPartialBookingNote');
        if (partialField){
          partialField.style.borderColor='var(--rust)';
          partialField.focus();
        }
        throw new Error('Partial Booking Note is required because the Booking Amount is less than the Down Payment amount.');
      }

      var payload = {
        booking_date:valueOf('scBookingDate') || null,
        booking_amount:bookingAmount,
        sold_by:valueOf('scSoldBy') || null,
        source:valueOf('scSource') || null,
        broker_name:valueOf('scBrokerName') || null,
        broker_company:valueOf('scBrokerCompany') || null,
        brokerage_percentage:numberOrNull('scBrokeragePct','Brokerage percentage',100),
        brokerage_amount:numberOrNull('scBrokerageAmount','Brokerage amount'),
        remarks:valueOf('scRemarks') || null,
        updated_at:new Date().toISOString()
      };
      if (isPartial) payload.partial_booking_note=partialNote;

      save.disabled = true;
      save.textContent = 'Saving…';
      if (err) err.style.display = 'none';

      var result = await sb.from('sales').update(payload).eq('unit_id',c.sno);
      if (result.error) throw result.error;
      delete saleNoteMetaCache[String(c.sno)];

      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      await loadFromSupabase();
      // UI cleanup for the full-screen mobile Sale form after the original save.
      var completedSaleEditor=document.getElementById('saleComplianceEditPanel');
      if(completedSaleEditor)completedSaleEditor.remove();
      document.body.classList.remove('crm-sale-editor-open');
      goToDetail(unit,sno,from);
    }catch(ex){
      if (err){
        err.textContent = ex && ex.message ? ex.message : 'Could not save sale details.';
        err.style.display = 'block';
      }else{
        alert(ex && ex.message ? ex.message : 'Could not save sale details.');
      }
      if (save){
        save.disabled = false;
        save.textContent = 'Save changes';
      }
    }
  }

  /* Edit Sale UI is built where the sale renderer is already maintained.
     Keep all original input nodes, values, dates and click handlers intact. */
  function ensureSaleRootStyles(){
    if(document.getElementById('crmSaleRootStyles'))return;
    var el=document.createElement('style');el.id='crmSaleRootStyles';
    el.textContent=[
      '@media(max-width:1023px){',
      'body.crm-sale-editor-open{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.crm-sale-editor-open #app>.topbar,body.crm-sale-editor-open>.tabs,body.crm-sale-editor-open #sunblissPersistentBackDock,body.crm-sale-editor-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel,body.crm-sale-editor-open>#saleComplianceEditPanel.crm-full-page-inline{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30070!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;min-height:0!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;overflow:hidden!important;box-sizing:border-box!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel>.section-label,body.crm-sale-editor-open>#saleComplianceEditPanel>.stat-sub{display:none!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel>.crm-sale-head{display:flex!important;align-items:center!important;gap:15px!important;flex:0 0 auto!important;margin:0 0 22px!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel .crm-sale-back{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:30px!important;height:42px!important;flex:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:var(--ink,#102333)!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel .crm-sale-title{margin:0!important;font:700 24px/1.25 CRMInter,Inter,Arial,sans-serif!important;letter-spacing:-.025em!important;color:var(--ink,#102333)!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel>.crm-sale-card{display:block!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;margin:0!important;padding:18px 15px 21px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-bottom:0!important;border-radius:14px 14px 0 0!important;background:transparent!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel .crm-sale-card .brand-field{display:block!important;margin:0 0 18px!important;min-width:0!important;font:400 11.5px/1.4 CRMInter,Inter,Arial,sans-serif!important;color:var(--muted,#66635c)!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel .crm-sale-card .brand-field :is(input,textarea,select){display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:46px!important;margin:7px 0 0!important;padding:10px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:8px!important;background:var(--paper-dim,#efe9d9)!important;color:var(--ink,#102333)!important;font:500 16px/1.25 CRMInter,Inter,Arial,sans-serif!important;box-sizing:border-box!important;box-shadow:none!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel>.crm-sale-actions,body.crm-sale-editor-open>#saleComplianceEditPanel.crm-full-page-inline>.crm-sale-actions{position:relative!important;bottom:auto!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:10px!important;flex:0 0 auto!important;margin:0 -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line,#ded7c8)!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;z-index:9!important}',
      'body.crm-sale-editor-open>#saleComplianceEditPanel>.crm-sale-actions>button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;min-height:48px!important;height:auto!important;margin:0!important;padding:10px 9px!important;border-radius:999px!important;font:600 15px/1.3 CRMInter,Inter,Arial,sans-serif!important;white-space:nowrap!important}',
      '}'
    ].join('\n');document.head.appendChild(el);
  }
  function saleRootLayout(panel){
    if(!panel)return;
    var mobile=window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
    if(!mobile){
      if(panel.dataset.crmSaleLayout==='1'){
        var card=panel.querySelector('.crm-sale-card'),actions=panel.querySelector('.crm-sale-actions');
        if(card&&actions){while(card.firstChild)panel.insertBefore(card.firstChild,actions);card.remove();}
        var head=panel.querySelector('.crm-sale-head');if(head)head.remove();
        if(actions)actions.classList.remove('crm-sale-actions');
        delete panel.dataset.crmSaleLayout;
        var detail=document.querySelector('.detail');
        if(detail&&panel.parentNode===document.body)detail.appendChild(panel);
      }
      document.body.classList.remove('crm-sale-editor-open');return;
    }
    var actions=panel.querySelector('.brand-editor-actions');
    if(!actions)return;
    if(panel.dataset.crmSaleLayout!=='1'){
      var head=document.createElement('div');head.className='crm-sale-head';
      head.innerHTML='<button type="button" class="crm-sale-back" aria-label="Back to customer"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="crm-sale-title">Edit Sale</h2>';
      head.querySelector('button').onclick=function(){panel.remove();document.body.classList.remove('crm-sale-editor-open');};
      panel.insertBefore(head,panel.firstChild);
      var card=document.createElement('div');card.className='crm-sale-card';
      Array.from(panel.children).forEach(function(child){
        if(child===head||child===actions||child.classList.contains('section-label')||child.classList.contains('stat-sub'))return;
        card.appendChild(child);
      });
      panel.insertBefore(card,actions);
      actions.classList.add('crm-sale-actions');
      panel.dataset.crmSaleLayout='1';
      panel.dataset.crmSaleUnit=window.state&&state.selectedUnit||'';
    }
    if(panel.parentNode!==document.body)document.body.appendChild(panel);
    document.body.classList.add('crm-sale-editor-open');
  }

  function cleanSaleEditor(){
    var panel = document.getElementById('saleComplianceEditPanel');
    if (!panel) return;

    panel.querySelectorAll('.section-label').forEach(function(label){
      var text = normalize(label.textContent);
      if (text === 'edit sale & compliance') label.textContent = 'Edit Sale';
      if (text === 'compliance') label.remove();
    });

    ['scSpaStatus','scSpaDate','scOqoodStatus','scOqoodDate','scFurnitureStatus','scDldStatus'].forEach(function(id){
      var field = document.getElementById(id);
      if (!field) return;
      var holder = field.closest ? field.closest('label.brand-field') : field.parentNode;
      if (holder) holder.remove();
    });

    var remarks = document.getElementById('scRemarks');
    if (remarks) setFieldLabel(remarks,'Special Note');
    ensureSaleNotesFields();
    ensureSaleRootStyles();
    saleRootLayout(panel);
  }

  function renameDetailActions(){
    var saleAction = document.getElementById('actionEditSaleCompliance');
    if (saleAction && saleAction.textContent !== 'Edit Sale') saleAction.textContent = 'Edit Sale';

    var complianceAction = document.getElementById('actionUpdateStatus');
    if (complianceAction && complianceAction.textContent !== 'Compliance') complianceAction.textContent = 'Compliance';

    document.querySelectorAll('.detail .section-label').forEach(function(label){
      if (normalize(label.textContent) === 'update spa & oqood status') label.textContent = 'Compliance';
    });
  }

  function installComplianceForm(){
    window.renderStatusForm = function(c){
      var values = state.statusFormValues || {
        spa: (String(c.spa||'').toLowerCase()==='signed'?'Signed':'Pending'),
        spaDate: c.info && c.info.spaDate ? dateToIso(c.info.spaDate) : '',
        oqood: (String(c.oqood||'').toLowerCase()==='completed'?'Completed':'Pending'),
        oqoodDate: c.info && c.info.oqoodDate ? dateToIso(c.info.oqoodDate) : '',
        furniture: c.furniture && String(c.furniture).toLowerCase() === 'signed' ? 'Furnished' : 'Unfurnished'
      };
      var html = '<div class="brand-editor">';
      if (state.statusFormError) html += '<p class="brand-error">' + escapeHtml(state.statusFormError) + '</p>';

      html += '<label class="brand-field">SPA status<select id="sfSpa">';
      ['Not Started','Drafted','Signed'].forEach(function(option){ html += '<option value="' + escapeHtml(option) + '"' + selected(values.spa,option) + '>' + escapeHtml(option) + '</option>'; });
      html += '</select></label>';
      html += '<label class="brand-field">SPA signed date (optional)<input type="date" id="sfSpaDate" value="' + escapeHtml(values.spaDate) + '" /></label>';

      html += '<label class="brand-field">OQOOD status<select id="sfOqood">';
      ['Not Started','Pending','Completed'].forEach(function(option){ html += '<option value="' + escapeHtml(option) + '"' + selected(values.oqood,option) + '>' + escapeHtml(option) + '</option>'; });
      html += '</select></label>';
      html += '<label class="brand-field">OQOOD completed date (optional)<input type="date" id="sfOqoodDate" value="' + escapeHtml(values.oqoodDate) + '" /></label>';

      html += '<label class="brand-field">Furnishing<select id="sfFurniture">';
      ['Unfurnished','Furnished'].forEach(function(option){ html += '<option value="' + escapeHtml(option) + '"' + selected(values.furniture,option) + '>' + escapeHtml(option) + '</option>'; });
      html += '</select></label>';

      html += '<div class="brand-editor-actions">';
      html += '<button class="btn btn-gold" id="sfSave" style="justify-content:center"' + (state.statusFormSaving ? ' disabled' : '') + '>' + (state.statusFormSaving ? 'Saving…' : 'Save compliance') + '</button>';
      html += '<button class="btn-paper" id="sfCancel" style="justify-content:center;margin-bottom:0">Cancel</button>';
      html += '</div></div>';
      return html;
    };

    window.saveStatus = async function(c){
      var spaEl = document.getElementById('sfSpa');
      var spaDateEl = document.getElementById('sfSpaDate');
      var oqoodEl = document.getElementById('sfOqood');
      var oqoodDateEl = document.getElementById('sfOqoodDate');
      var furnitureEl = document.getElementById('sfFurniture');
      if (!spaEl || !oqoodEl || !furnitureEl) return;

      var spa = spaEl.value;
      var spaDate = spaDateEl ? spaDateEl.value : '';
      var oqood = oqoodEl.value;
      var oqoodDate = oqoodDateEl ? oqoodDateEl.value : '';
      var furniture = furnitureEl.value;

      state.statusFormValues = {spa:spa,spaDate:spaDate,oqood:oqood,oqoodDate:oqoodDate,furniture:furniture};
      state.statusFormSaving = true;
      state.statusFormError = null;
      renderDetail();

      try{
        if (normalize(spa)==='signed' && normalize(c.spa)!=='signed') await assertSpaReady(c);
        var result = await sb.from('sales').update({spa_status:spa,spa_date:spaDate || null,oqood_status:oqood,oqood_date:oqoodDate || null,furniture_status:furniture,updated_at:new Date().toISOString()}).eq('unit_id',c.sno);
        if (result.error) throw result.error;

        state.statusFormOpen = false;
        state.statusFormSaving = false;
        state.statusFormValues = null;
        await loadFromSupabase();
        render();
      }catch(err){
        state.statusFormSaving = false;
        state.statusFormError = err && err.message ? err.message : 'Could not save compliance.';
        renderDetail();
      }
    };
  }

  function refresh(){
    renameDetailActions();
    var active=document.getElementById('saleComplianceEditPanel');
    if(active&&active.dataset.crmSaleUnit&&window.state&&state.selectedUnit!==active.dataset.crmSaleUnit){active.remove();active=null;}
    if(!active)document.body.classList.remove('crm-sale-editor-open');
    cleanSaleEditor();
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissComplianceEditorInstalled) return;
    window.__sunblissComplianceEditorInstalled = true;

    installComplianceForm();

    document.addEventListener('click',function(ev){
      var target = ev.target && ev.target.closest ? ev.target.closest('#scSave') : null;
      if (!target) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      saveSaleOnly();
    },true);

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      refresh();
      return out;
    };

    var observer = new MutationObserver(function(){ refresh(); });
    observer.observe(document.body,{childList:true,subtree:true});
    refresh();
  }

  install();
})();
