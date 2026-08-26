(function(){
  'use strict';

  if (window.__sunblissCarryForwardInstalled) return;
  window.__sunblissCarryForwardInstalled = true;

  function text(v){ return v == null ? '' : String(v); }
  function number(v){
    if (v == null || text(v).trim() === '') return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function round2(v){ return Math.round((Number(v)||0)*100)/100; }
  function safe(v){
    if (typeof window.esc === 'function') return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function money(v){
    if (typeof window.fmtAED === 'function') return window.fmtAED(Number(v)||0);
    return 'AED '+(Number(v)||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function signedMoney(v){
    var n=round2(v);
    if (Math.abs(n)<0.01) return 'AED 0';
    return (n>0?'+ ':'- ')+money(Math.abs(n));
  }
  function dateLabel(v){
    if (!v) return '—';
    var d=v instanceof Date?v:new Date(text(v).length===10?text(v)+'T00:00:00':v);
    if (isNaN(d.getTime())) return text(v);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function selectedCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){
      return c && (text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit);
    }) || null;
  }
  function allCustomers(){
    var rows=[];
    [state&&state.dues,state&&state.cancelled].forEach(function(list){
      if (Array.isArray(list)) list.forEach(function(c){ if(c) rows.push(c); });
    });
    return rows;
  }
  function stageDbName(stage){
    if (window.STAGE_CODE_TO_NAME && stage && window.STAGE_CODE_TO_NAME[stage.code]) return window.STAGE_CODE_TO_NAME[stage.code];
    return stage && stage.label ? stage.label : '';
  }
  function unitId(c){ return Number(c && (c.unitId || c.sno)) || null; }

  function ensureStyles(){
    if (document.getElementById('sunblissCarryForwardStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissCarryForwardStyles';
    style.textContent=[
      '.carry-forward-card{border:1px solid var(--paper-line);border-left:4px solid var(--slate);border-radius:12px;padding:13px 14px;margin:-4px 0 16px;background:var(--paper-dim)}',
      '.carry-forward-card[data-tone="positive"]{border-left-color:var(--sage);background:rgba(63,122,87,.07)}',
      '.carry-forward-card[data-tone="negative"]{border-left-color:var(--rust);background:rgba(174,59,43,.07)}',
      '.carry-forward-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}',
      '.carry-forward-title{font-family:IBM Plex Mono,monospace;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600}',
      '.carry-forward-status{font-size:10px;font-weight:700;border:1px solid currentColor;border-radius:999px;padding:3px 8px;white-space:nowrap;color:var(--slate)}',
      '.carry-forward-card[data-tone="positive"] .carry-forward-status,.carry-forward-card[data-tone="positive"] .carry-forward-value{color:var(--sage)}',
      '.carry-forward-card[data-tone="negative"] .carry-forward-status,.carry-forward-card[data-tone="negative"] .carry-forward-value{color:var(--rust)}',
      '.carry-forward-value{font:700 19px/1.2 IBM Plex Mono,monospace;color:var(--ink);margin:0}',
      '.carry-forward-note{font-size:11.5px;line-height:1.45;color:var(--muted);margin:5px 0 0}',
      '.carry-forward-history-toggle{border:0;background:transparent;color:var(--gold-deep);font:650 11px/1.3 Inter,sans-serif;padding:8px 0 0;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;cursor:pointer}',
      '.carry-forward-history{margin-top:10px;border-top:1px solid var(--paper-line);padding-top:4px}',
      '.carry-forward-history-row{display:grid;grid-template-columns:74px minmax(0,1fr) auto;gap:9px;align-items:start;padding:8px 0;border-bottom:1px solid var(--paper-line)}',
      '.carry-forward-history-row:last-child{border-bottom:0}',
      '.carry-forward-history-date{font:500 9.5px/1.35 IBM Plex Mono,monospace;color:var(--muted)}',
      '.carry-forward-history-main{font-size:10.8px;line-height:1.4;color:var(--ink)}',
      '.carry-forward-history-main small{display:block;color:var(--muted);margin-top:2px}',
      '.carry-forward-history-amount{font:700 10.8px/1.3 IBM Plex Mono,monospace;white-space:nowrap}',
      '.carry-forward-history-amount.pos{color:var(--sage)}.carry-forward-history-amount.neg{color:var(--rust)}',
      '.carry-forward-stage-row span:first-child{font-weight:650;color:var(--slate)!important}',
      '.carry-forward-stage-row.positive span:first-child,.carry-forward-stage-row.positive span:last-child{color:var(--sage)!important}',
      '.carry-forward-stage-row.negative span:first-child,.carry-forward-stage-row.negative span:last-child{color:var(--rust)!important}',
      '.carry-forward-editor-note{padding:9px 10px;margin:0 0 12px;border:1px solid rgba(69,86,107,.24);border-radius:9px;background:rgba(69,86,107,.06);font-size:10.8px;line-height:1.45;color:var(--muted)}',
      '.ps-carry-summary{display:flex;align-items:center;justify-content:space-between;gap:10mm;margin:-1.2mm 0 3.6mm;padding:2.2mm 3mm;border:1px solid #d9dde2;border-radius:1.6mm;background:#f7f8f9;font:700 2.35mm/1.2 Arial,Inter,sans-serif;color:#26313e}',
      '.ps-carry-summary[data-tone="positive"] strong{color:#25885e}.ps-carry-summary[data-tone="negative"] strong{color:#b64b4f}',
      '@media(max-width:430px){.carry-forward-history-row{grid-template-columns:62px minmax(0,1fr);}.carry-forward-history-amount{grid-column:2}.carry-forward-head{align-items:flex-start}}',
      '@media print{#printArea .ps-carry-summary{display:flex!important;margin:-1.2mm 0 3.6mm!important;padding:2.2mm 3mm!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  async function enrichCarryForward(){
    if (!window.sb || !window.state) return;

    var result=await Promise.all([
      sb.from('carry_forward_events')
        .select('id,customer_id,unit_id,payment_schedule_id,payment_transaction_id,event_date,amount,reason,created_at')
        .order('event_date',{ascending:true}).order('id',{ascending:true}),
      sb.from('carry_forward_allocations')
        .select('id,positive_event_id,negative_event_id,amount,allocation_date,created_at')
        .order('allocation_date',{ascending:true}).order('id',{ascending:true}),
      sb.from('payment_transactions')
        .select('id,customer_id,unit_id,payment_schedule_id,payment_date,amount,payment_type,payment_reference,remarks,created_at')
        .order('payment_date',{ascending:true}).order('id',{ascending:true})
    ]);
    result.forEach(function(r){ if (r.error) throw r.error; });

    var events=(result[0].data||[]).map(function(e){
      return {
        id:e.id,customerId:e.customer_id,unitId:e.unit_id,scheduleId:e.payment_schedule_id,
        transactionId:e.payment_transaction_id,eventDate:e.event_date,amount:round2(e.amount),
        reason:e.reason||'Payment variance',createdAt:e.created_at||''
      };
    });
    var allocations=(result[1].data||[]).map(function(a){
      return {
        id:a.id,positiveEventId:a.positive_event_id,negativeEventId:a.negative_event_id,
        amount:round2(a.amount),allocationDate:a.allocation_date,createdAt:a.created_at||''
      };
    });
    var transactions=(result[2].data||[]).map(function(t){
      return {
        id:t.id,customerId:t.customer_id,unitId:t.unit_id,scheduleId:t.payment_schedule_id,
        paymentDate:t.payment_date,amount:round2(t.amount),paymentType:t.payment_type||'',
        reference:t.payment_reference||'',remarks:t.remarks||'',createdAt:t.created_at||''
      };
    });

    state.carryForwardEvents=events;
    state.carryForwardAllocations=allocations;
    state.actualPaymentTransactions=transactions;

    var byUnitEvents={},byUnitTx={},byScheduleEvents={},eventById={},allocatedToNegative={},allocatedFromPositive={};
    events.forEach(function(e){
      eventById[text(e.id)]=e;
      (byUnitEvents[text(e.unitId)]||(byUnitEvents[text(e.unitId)]=[])).push(e);
      (byScheduleEvents[text(e.scheduleId)]||(byScheduleEvents[text(e.scheduleId)]=[])).push(e);
    });
    transactions.forEach(function(t){
      (byUnitTx[text(t.unitId)]||(byUnitTx[text(t.unitId)]=[])).push(t);
    });
    allocations.forEach(function(a){
      allocatedFromPositive[text(a.positiveEventId)]=(allocatedFromPositive[text(a.positiveEventId)]||0)+a.amount;
      allocatedToNegative[text(a.negativeEventId)]=(allocatedToNegative[text(a.negativeEventId)]||0)+a.amount;
    });

    allCustomers().forEach(function(c){
      var uid=unitId(c);
      if (!uid) return;
      var unitEvents=byUnitEvents[text(uid)]||[];
      var unitTx=byUnitTx[text(uid)]||[];
      var actualCash=round2(unitTx.reduce(function(sum,t){ return sum+(Number(t.amount)||0); },0));
      var creditTotal=round2(Number(c.creditNoteTotal)||0);
      var carry=round2(unitEvents.reduce(function(sum,e){ return sum+(Number(e.amount)||0); },0));

      c.actualCollected=actualCash;
      c.cashReceived=actualCash;
      c.received=actualCash;
      c.settledReceived=round2(actualCash+creditTotal);
      c.carryForward=carry;
      c.carryForwardEvents=unitEvents.slice();
      c.actualTransactions=unitTx.slice();

      if (number(c.total)!==null){
        c.outstanding=round2(c.settledReceived-Number(c.total));
      }

      (c.stages||[]).forEach(function(stage){
        var sid=text(stage.id||stage.scheduleId);
        var stageEvents=byScheduleEvents[sid]||[];
        var carryApplied=0;
        stageEvents.forEach(function(e){
          if (Number(e.amount)<0) carryApplied += Number(allocatedToNegative[text(e.id)])||0;
        });
        carryApplied=round2(carryApplied);
        var cash=stage.cashPaid!==undefined?Number(stage.cashPaid)||0:Number(stage.paid)||0;
        var credit=Number(stage.creditNoteTotal)||0;
        var grossPosition=round2(stageEvents.reduce(function(sum,e){ return sum+(Number(e.amount)||0); },0));
        stage.cashPaid=round2(cash);
        stage.carryApplied=carryApplied;
        stage.carryPosition=grossPosition;
        stage.settledAmount=round2(stage.cashPaid+credit+carryApplied);
        stage.paid=stage.settledAmount;
        stage.outAmt=stage.due===null||stage.due===undefined?null:round2((Number(stage.due)||0)-stage.settledAmount);
      });

      recomputeNextDue(c);
    });

    state.carryForwardEventById=eventById;
    state.carryForwardAllocatedToNegative=allocatedToNegative;
    state.carryForwardAllocatedFromPositive=allocatedFromPositive;
  }

  function recomputeNextDue(c){
    var next=null;
    (c.stages||[]).forEach(function(stage){
      if (stage.due===null || stage.due===undefined) return;
      var remaining=round2((Number(stage.due)||0)-(Number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid)||0));
      if (remaining<=1) return;
      if (!next){ next={stage:stage,remaining:remaining}; return; }
      var a=stage.dueDate?new Date(stage.dueDate).getTime():Infinity;
      var b=next.stage.dueDate?new Date(next.stage.dueDate).getTime():Infinity;
      if (a<b) next={stage:stage,remaining:remaining};
    });
    c.upStage=next?next.stage.label:'';
    c.upAmt=next?next.remaining:null;
    c.upDate=next?next.stage.dueDate:null;
  }

  function carryTone(value){
    var n=round2(value);
    return n>0?'positive':n<0?'negative':'zero';
  }
  function carryStatus(value){
    var n=round2(value);
    return n>0?'Customer credit':n<0?'Amount to recover':'Clear';
  }
  function carryNote(value){
    var n=round2(value);
    if (n>0) return 'Customer has paid extra. This credit remains available until it is genuinely applied against a later shortage or otherwise adjusted.';
    if (n<0) return 'This shortage remains outstanding until later cash or another valid settlement offsets it. Scheduled installment amounts are unchanged.';
    return 'No unsettled carry-forward adjustment is currently outstanding.';
  }
  function allocationAmountForEvent(e){
    if (!window.state) return 0;
    if (Number(e.amount)>0) return round2((state.carryForwardAllocatedFromPositive||{})[text(e.id)]||0);
    return round2((state.carryForwardAllocatedToNegative||{})[text(e.id)]||0);
  }
  function stageLabelFor(c,scheduleId){
    var stage=(c.stages||[]).find(function(s){ return text(s.id||s.scheduleId)===text(scheduleId); });
    return stage ? stage.label : 'Installment';
  }

  function renderCarryCard(c){
    var detail=document.querySelector('.detail');
    if (!detail || !c) return;
    var action=document.getElementById('actionRequiredCard');
    var anchor=action || detail.querySelector('.badges') || detail.querySelector('.d-type');
    if (!anchor) return;

    var old=document.getElementById('carryForwardCard');
    if (old) old.remove();

    var value=round2(c.carryForward||0);
    var events=(c.carryForwardEvents||[]).slice().sort(function(a,b){
      return text(b.eventDate).localeCompare(text(a.eventDate)) || Number(b.id||0)-Number(a.id||0);
    });
    var card=document.createElement('section');
    card.id='carryForwardCard';
    card.className='carry-forward-card';
    card.setAttribute('data-tone',carryTone(value));
    var history='';
    if (events.length){
      history='<button type="button" class="carry-forward-history-toggle" id="carryForwardHistoryToggle" aria-expanded="'+(state.carryHistoryOpen?'true':'false')+'">'+(state.carryHistoryOpen?'Hide':'View')+' carry-forward history</button>';
      if (state.carryHistoryOpen){
        history+='<div class="carry-forward-history">';
        events.forEach(function(e){
          var allocated=allocationAmountForEvent(e);
          history+='<div class="carry-forward-history-row">'+
            '<span class="carry-forward-history-date">'+safe(dateLabel(e.eventDate))+'</span>'+
            '<span class="carry-forward-history-main">'+safe(stageLabelFor(c,e.scheduleId))+
              '<small>'+safe(e.reason)+(allocated>0?' · '+safe(money(allocated))+' allocated':'')+'</small></span>'+
            '<span class="carry-forward-history-amount '+(e.amount>0?'pos':'neg')+'">'+safe(signedMoney(e.amount))+'</span>'+
          '</div>';
        });
        history+='</div>';
      }
    }
    card.innerHTML=
      '<div class="carry-forward-head"><span class="carry-forward-title">Carry Forward</span><span class="carry-forward-status">'+safe(carryStatus(value))+'</span></div>'+
      '<p class="carry-forward-value">'+safe(signedMoney(value))+'</p>'+
      '<p class="carry-forward-note">'+safe(carryNote(value))+'</p>'+
      history;
    anchor.insertAdjacentElement('afterend',card);

    var toggle=document.getElementById('carryForwardHistoryToggle');
    if (toggle) toggle.addEventListener('click',function(){
      state.carryHistoryOpen=!state.carryHistoryOpen;
      renderCarryCard(c);
    });
  }

  function decorateMoneySummary(c){
    var grid=document.querySelector('.detail .money-grid');
    if (!grid || !c) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.money-label'),function(label){
      if (text(label.textContent).trim().toLowerCase()==='received') label.textContent='Cash received';
    });
    var cells=grid.querySelectorAll('.money-cell');
    if (cells[1]){
      var value=cells[1].querySelector('.money-value');
      if (value) value.textContent=money(c.actualCollected||0);
    }
    if (cells[2]){
      var value2=cells[2].querySelector('.money-value');
      if (value2) value2.textContent=money(c.outstanding||0);
    }
    var total=Number(c.total)||0,settled=Number(c.settledReceived)||0;
    if (total>0){
      var pct=Math.max(0,Math.min(100,Math.round(settled/total*1000)/10));
      var progress=document.querySelector('.detail .cust-progress');
      if (progress){
        var fill=progress.querySelector('.bar-fill'); if (fill) fill.style.width=pct+'%';
        var caps=progress.querySelectorAll('.bar-caption span');
        if (caps[0]) caps[0].innerHTML='<b>'+pct+'%</b> '+((Number(c.creditNoteTotal)||0)>0?'settled':'paid');
        if (caps[1]) caps[1].innerHTML='<b>'+round2(100-pct)+'%</b> remaining';
      }
    }
  }

  function decorateStageCards(c){
    if (!c || !Array.isArray(c.stages)) return;
    document.querySelectorAll('.detail .ledger-scroll .stage-card').forEach(function(card,index){
      var s=c.stages[index];
      if (!s) return;
      var rows=Array.prototype.slice.call(card.querySelectorAll('.stage-row'));
      var paid=rows.find(function(row){
        var first=row.querySelector('span:first-child');
        var label=first?text(first.textContent).trim().toLowerCase():'';
        return label==='paid'||label==='cash';
      });
      if (paid){
        var spans=paid.querySelectorAll('span');
        if (spans[0]) spans[0].textContent='Cash';
        if (spans[1]) spans[1].textContent=money(s.cashPaid||0);
      }

      var existing=card.querySelector('.carry-forward-stage-row');
      if (existing) existing.remove();
      if (Number(s.carryApplied)>0){
        var row=document.createElement('div');
        row.className='stage-row carry-forward-stage-row positive';
        row.innerHTML='<span>Carry applied</span><span>'+safe(money(s.carryApplied))+'</span>';
        var creditRow=card.querySelector('.credit-note-stage-row');
        if (creditRow) creditRow.insertAdjacentElement('afterend',row);
        else if (paid) paid.insertAdjacentElement('afterend',row);
        else card.appendChild(row);
      }
    });
  }

  function decoratePaymentDetail(c){
    var dialog=document.getElementById('paymentDetailDialog');
    if (!dialog || !c) return;
    dialog.querySelectorAll('.payment-detail-row').forEach(function(row){
      var title=row.querySelector('.payment-detail-row-title');
      var s=(c.stages||[]).find(function(stage){ return title && text(stage.label)===text(title.textContent).trim(); });
      if (!s) return;
      var meta=row.querySelector('.payment-detail-row-meta');
      if (!meta) return;
      Array.prototype.forEach.call(meta.querySelectorAll('span'),function(span){
        if (/^(Paid|Cash):/i.test(text(span.textContent))) span.textContent='Cash: '+money(s.cashPaid||0);
      });
      var old=row.querySelector('.carry-payment-detail-meta'); if (old) old.remove();
      if (Number(s.carryApplied)>0){
        var item=document.createElement('span');
        item.className='carry-payment-detail-meta';
        item.textContent='Carry applied: '+money(s.carryApplied);
        meta.appendChild(item);
      }
    });
  }

  function protectInstallmentEditor(){
    var dialog=document.getElementById('installmentEditDialog');
    if (!dialog || dialog.dataset.carryProtected==='1') return;
    var paid=document.getElementById('iePaidAmount'), paidDate=document.getElementById('iePaidDate');
    if (!paid) return;
    dialog.dataset.carryProtected='1';
    paid.readOnly=true;
    paid.setAttribute('aria-readonly','true');
    if (paidDate){ paidDate.disabled=true; paidDate.setAttribute('aria-disabled','true'); }
    var useTx=document.getElementById('ieUseTx'); if (useTx) useTx.style.display='none';
    var grid=dialog.querySelector('.installment-edit-grid');
    if (grid){
      var note=document.createElement('div');
      note.className='carry-forward-editor-note';
      note.style.gridColumn='1 / -1';
      note.textContent='Cash paid is transaction-controlled. Use Record payment, or edit/delete the payment transaction, so carry-forward and totals stay reconciled. Due amount and due date remain editable.';
      grid.insertAdjacentElement('afterend',note);
    }
    var label=paid.closest('label'); if (label){
      var first=label.childNodes[0];
      if (first && first.nodeType===3) first.nodeValue='Cash paid (transaction history)';
    }
  }

  async function saveProtectedInstallment(){
    var c=selectedCustomer();
    var dialog=document.getElementById('installmentEditDialog');
    if (!c || !dialog) return;
    var title=dialog.querySelector('h3');
    var stage=(c.stages||[]).find(function(s){ return title && text(s.label)===text(title.textContent).trim(); });
    if (!stage) return;
    var dueEl=document.getElementById('ieDueAmount'),dateEl=document.getElementById('ieDueDate'),
        paidEl=document.getElementById('iePaidAmount'),paidDateEl=document.getElementById('iePaidDate'),
        remarksEl=document.getElementById('ieRemarks'),err=document.getElementById('ieError'),save=document.getElementById('ieSave');
    var due=number(dueEl&&dueEl.value),paid=number(paidEl&&paidEl.value);
    if (due===null || due<0){
      if (err){err.textContent='Enter a valid due amount.';err.style.display='block';}
      return;
    }
    if (save){save.disabled=true;save.textContent='Saving…';}
    if (err) err.style.display='none';
    var key=state.selectedUnit,from=state.detailFrom||'list';
    try{
      var rpc=await sb.rpc('crm_save_installment',{
        p_schedule_id:stage.id||stage.scheduleId||null,
        p_unit_id:c.sno,
        p_stage_name:stageDbName(stage),
        p_due_amount:due,
        p_due_date:dateEl&&dateEl.value?dateEl.value:null,
        p_paid_amount:paid===null?0:paid,
        p_paid_date:paidDateEl&&paidDateEl.value?paidDateEl.value:null,
        p_remarks:remarksEl&&text(remarksEl.value).trim()?text(remarksEl.value).trim():null
      });
      if (rpc.error) throw rpc.error;
      var overlay=document.getElementById('installmentEditOverlay'); if (overlay) overlay.remove();
      await loadFromSupabase();
      state.selectedUnit=key;state.detailFrom=from;state.view='detail';
      if (typeof window.renderMain==='function') window.renderMain(); else if (typeof window.renderDetail==='function') window.renderDetail();
    }catch(ex){
      if (err){err.textContent=ex&&ex.message?ex.message:'Could not save that installment.';err.style.display='block';}
      if (save){save.disabled=false;save.textContent='Save installment';}
    }
  }

  function decorateStatement(c){
    var root=document.querySelector('#printArea .professional-payment-statement');
    if (!root || !c) return;
    var rows=root.querySelectorAll('.ps-installments tbody tr');
    (c.stages||[]).forEach(function(s,index){
      var row=rows[index]; if (!row) return;
      var cells=row.querySelectorAll('td'); if (cells.length<5) return;
      var parts=['Cash '+money(s.cashPaid||0)];
      if (Number(s.creditNoteTotal)>0) parts.push('CN '+money(s.creditNoteTotal));
      if (Number(s.carryApplied)>0) parts.push('Carry '+money(s.carryApplied));
      cells[3].textContent=parts.length===1?money(s.cashPaid||0):parts.join(' / ');
      cells[4].textContent=(Number(s.cashPaid)||0)>0?dateLabel(s.paidDate):'-';
    });

    var old=root.querySelector('.ps-carry-summary'); if (old) old.remove();
    var summary=root.querySelector('.ps-summary');
    if (summary){
      var cf=document.createElement('div');
      cf.className='ps-carry-summary';
      cf.setAttribute('data-tone',carryTone(c.carryForward||0));
      cf.innerHTML='<span>Carry Forward</span><strong>'+safe(signedMoney(c.carryForward||0))+'</strong>';
      summary.insertAdjacentElement('afterend',cf);
    }
  }

  function decorate(){
    if (!window.state || state.view!=='detail') return;
    var c=selectedCustomer();
    if (!c) return;
    ensureStyles();
    renderCarryCard(c);
    decorateMoneySummary(c);
    decorateStageCards(c);
    decoratePaymentDetail(c);
    protectInstallmentEditor();
  }

  function install(){
    if (!window.state || !window.sb || typeof window.loadFromSupabase!=='function' || typeof window.renderDetail!=='function'){
      setTimeout(install,50);
      return;
    }
    ensureStyles();

    var baseLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){
      var out=await baseLoad.apply(this,arguments);
      try{
        await enrichCarryForward();
        if (typeof window.renderMain==='function' && state.view && state.view!=='empty') window.renderMain();
      }catch(ex){
        console.warn('Could not load carry-forward ledger',ex);
      }
      return out;
    };

    var baseDetail=window.renderDetail;
    window.renderDetail=function(){
      var out=baseDetail.apply(this,arguments);
      decorate();
      return out;
    };

    document.addEventListener('click',function(ev){
      var save=ev.target&&ev.target.closest?ev.target.closest('#ieSave'):null;
      var dialog=document.getElementById('installmentEditDialog');
      if (!save || !dialog || dialog.dataset.carryProtected!=='1') return;
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      saveProtectedInstallment();
    },true);

    document.addEventListener('click',function(ev){
      var btn=ev.target&&ev.target.closest?ev.target.closest('#btnPrintStatement'):null;
      if (!btn) return;
      var c=selectedCustomer();
      if (!c) return;
      setTimeout(function(){ decorateStatement(c); },0);
    });

    new MutationObserver(function(){
      if (!window.state) return;
      if (state.view==='detail') decorate();
      protectInstallmentEditor();
      decoratePaymentDetail(selectedCustomer());
    }).observe(document.body,{childList:true,subtree:true});

    window.__sunblissCarryForwardApi={
      enrich:enrichCarryForward,
      selectedCustomer:selectedCustomer,
      signedMoney:signedMoney,
      money:money
    };

    enrichCarryForward().then(function(){
      if (state.view && state.view!=='empty' && typeof window.renderMain==='function') window.renderMain();
    }).catch(function(ex){
      console.warn('Could not initialize carry-forward ledger',ex);
    });
  }

  install();
})();