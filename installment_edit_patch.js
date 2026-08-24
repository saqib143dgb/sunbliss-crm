(function(){
  'use strict';

  if (window.__sunblissInstallmentEditorInstalled) return;
  window.__sunblissInstallmentEditorInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function isoDate(value){
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    var m = d.getMonth()+1, day=d.getDate();
    return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);
  }
  function num(value){ var n=Number(value); return isFinite(n)?n:null; }
  function money(value){ return typeof window.fmtAED==='function' ? window.fmtAED(Number(value)||0) : 'AED '+(Number(value)||0).toLocaleString('en-US',{maximumFractionDigits:2}); }
  function selectedCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return c && (String(c.unit||'')+'::'+String(c.sno||''))===String(state.selectedUnit); }) || null;
  }
  function normalize(value){ return text(value).replace(/\s+/g,' ').trim().toLowerCase(); }
  function stageDbName(stage){
    if (window.STAGE_CODE_TO_NAME && window.STAGE_CODE_TO_NAME[stage.code]) return window.STAGE_CODE_TO_NAME[stage.code];
    return stage.label;
  }
  function stageMatchesTransaction(stage, paymentType){
    var type=normalize(paymentType), label=normalize(stage.label);
    if (!type) return false;
    if (stage.code==='DLD') return type.indexOf('dld')!==-1;
    if (stage.code==='FIN') return type.indexOf('final')===0;
    return type===label || type.indexOf(label+' partial-')===0 || type.indexOf(label+' remaining')===0;
  }
  function derivedStatus(due,paid){
    due=Number(due)||0; paid=Number(paid)||0;
    if (paid<=0) return 'Outstanding';
    if (due>0 && paid>=due-0.01) return 'Paid';
    return 'Partial';
  }

  function ensureStyles(){
    if (document.getElementById('sunblissInstallmentEditorStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissInstallmentEditorStyles';
    style.textContent=[
      '.stage-card{position:relative;overflow:visible}',
      '.installment-menu-btn{position:absolute;top:7px;right:7px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:23px;line-height:1;cursor:pointer;z-index:3}',
      '.installment-menu-btn:hover,.installment-menu-btn:focus-visible{background:var(--paper-dim);color:var(--ink);outline:none}',
      '.installment-menu-pop{position:absolute;top:38px;right:7px;z-index:20;min-width:146px;padding:5px;background:var(--paper);border:1px solid var(--paper-line);border-radius:10px;box-shadow:0 8px 24px rgba(15,26,38,.18)}',
      '.installment-menu-pop button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;color:var(--ink);font:600 12px/1.2 Inter,sans-serif;cursor:pointer}',
      '.installment-menu-pop button:hover,.installment-menu-pop button:focus-visible{background:var(--paper-dim);outline:none}',
      '#installmentEditOverlay{position:fixed;inset:0;z-index:2500;background:rgba(15,26,38,.62);display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));overflow:auto}',
      '#installmentEditDialog{width:min(600px,100%);max-height:min(88vh,760px);overflow:auto;background:var(--paper);border:1px solid var(--paper-line);border-radius:18px;padding:18px;box-shadow:0 24px 70px rgba(15,26,38,.38)}',
      '#installmentEditDialog h3{font-family:Fraunces,serif;font-size:21px;margin:0 0 3px}',
      '#installmentEditDialog .installment-edit-sub{font-size:12px;color:var(--muted);margin:0 0 15px}',
      '#installmentEditDialog input,#installmentEditDialog textarea{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box}',
      '#installmentEditDialog textarea{min-height:72px;resize:vertical}',
      '.installment-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.installment-edit-meta{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:10px 11px;margin:2px 0 12px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim)}',
      '.installment-edit-meta span:first-child{font-size:11px;color:var(--muted)}',
      '.installment-edit-meta strong{font:700 12px/1.3 IBM Plex Mono,monospace;text-align:right}',
      '.installment-edit-warning{padding:10px 11px;margin:0 0 12px;border:1px solid rgba(156,90,18,.30);border-radius:10px;background:rgba(156,90,18,.08);font-size:11.5px;line-height:1.5;color:var(--amber)}',
      '.installment-edit-help{font-size:11px;line-height:1.45;color:var(--muted);margin:-3px 0 12px}',
      '.installment-edit-actions{display:flex;gap:8px;margin-top:14px}',
      '.installment-edit-actions button{flex:1;justify-content:center;margin:0}',
      '@media(min-width:641px){#installmentEditOverlay{align-items:center}}',
      '@media(max-width:480px){.installment-edit-grid{grid-template-columns:1fr}.installment-edit-actions{flex-direction:column}.installment-edit-actions button{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeMenus(except){
    document.querySelectorAll('.installment-menu-pop').forEach(function(menu){ if (menu!==except) menu.remove(); });
  }

  function decorateCards(){
    ensureStyles();
    var c=selectedCustomer();
    if (!c || !Array.isArray(c.stages) || !window.state || state.userRole!=='crm_officer') return;
    var cards=document.querySelectorAll('.ledger-scroll .stage-card');
    cards.forEach(function(card,index){
      if (card.querySelector('.installment-menu-btn')) return;
      var stage=c.stages[index];
      if (!stage) return;
      var button=document.createElement('button');
      button.type='button';
      button.className='installment-menu-btn';
      button.setAttribute('aria-label','Installment options for '+text(stage.label));
      button.setAttribute('title','Installment options');
      button.innerHTML='&#8942;';
      button.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var old=card.querySelector('.installment-menu-pop');
        if (old){ old.remove(); return; }
        closeMenus();
        var menu=document.createElement('div');
        menu.className='installment-menu-pop';
        var edit=document.createElement('button');
        edit.type='button'; edit.textContent='Edit installment';
        edit.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); closeMenus(); openEditor(c,stage); });
        menu.appendChild(edit); card.appendChild(menu);
      });
      card.appendChild(button);
    });
  }

  async function loadStageRow(stage){
    if (!stage || !stage.id) return null;
    var result=await sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,paid_amount,paid_date,status,remarks').eq('id',stage.id).single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function transactionSummary(c,stage){
    var result=await sb.from('payment_transactions').select('payment_date,payment_type,amount').eq('unit_id',c.sno);
    if (result.error) throw result.error;
    var matches=(result.data||[]).filter(function(row){ return stageMatchesTransaction(stage,row.payment_type); });
    var total=matches.reduce(function(sum,row){ return sum+(Number(row.amount)||0); },0);
    matches.sort(function(a,b){ return text(a.payment_date).localeCompare(text(b.payment_date)); });
    return {total:Math.round(total*100)/100,count:matches.length,lastDate:matches.length?matches[matches.length-1].payment_date:null};
  }

  async function openEditor(c,stage){
    closeMenus();
    var existing=document.getElementById('installmentEditOverlay');
    if (existing) existing.remove();
    var overlay=document.createElement('div');
    overlay.id='installmentEditOverlay';
    overlay.innerHTML='<div id="installmentEditDialog" role="dialog" aria-modal="true"><h3>'+safe(stage.label)+'</h3><p class="installment-edit-sub">Loading installment details…</p></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click',function(ev){ if (ev.target===overlay) overlay.remove(); });
    try{
      var pair=await Promise.all([loadStageRow(stage),transactionSummary(c,stage)]);
      renderEditor(c,stage,pair[0],pair[1],overlay);
    }catch(err){
      var dialog=document.getElementById('installmentEditDialog');
      if (dialog) dialog.innerHTML='<h3>'+safe(stage.label)+'</h3><p class="brand-error">'+safe(err&&err.message?err.message:'Could not load installment details.')+'</p><button class="btn-paper" id="ieClose">Close</button>';
      var close=document.getElementById('ieClose'); if (close) close.onclick=function(){ overlay.remove(); };
    }
  }

  function renderEditor(c,stage,row,tx,overlay){
    var due=row?num(row.due_amount):num(stage.due);
    var paid=row?num(row.paid_amount):num(stage.paid);
    if (due===null) due=0;
    if (paid===null) paid=0;
    var dueDate=row?text(row.due_date):isoDate(stage.dueDate);
    var paidDate=row?text(row.paid_date):isoDate(stage.paidDate);
    var remarks=row?text(row.remarks):'';
    var status=derivedStatus(due,paid);
    var mismatch=Math.abs((tx.total||0)-paid)>0.01;
    var syncDate=(stage.code==='DLD'||stage.code==='1ST');
    var dialog=document.getElementById('installmentEditDialog');
    if (!dialog) return;
    dialog.innerHTML=
      '<h3>'+safe(stage.label)+'</h3>'+
      '<p class="installment-edit-sub">Unit '+safe(c.unit)+' · '+safe(c.name)+'</p>'+
      '<p class="brand-error" id="ieError" style="display:none"></p>'+
      '<div class="installment-edit-grid">'+
        '<label class="brand-field">Due amount (AED)<input type="number" id="ieDueAmount" min="0" step="0.01" value="'+safe(due)+'" /></label>'+
        '<label class="brand-field">Due date<input type="date" id="ieDueDate" value="'+safe(dueDate)+'" /></label>'+
        '<label class="brand-field">Paid amount (AED)<input type="number" id="iePaidAmount" min="0" step="0.01" value="'+safe(paid)+'" /></label>'+
        '<label class="brand-field">Paid date<input type="date" id="iePaidDate" value="'+safe(paidDate)+'" /></label>'+
      '</div>'+
      '<div class="installment-edit-meta"><span>Calculated schedule status</span><strong id="ieStatus">'+safe(status)+'</strong></div>'+
      '<div class="installment-edit-meta"><span>Matching transaction history</span><strong>'+safe(tx.count+' transaction'+(tx.count===1?'':'s')+' · '+money(tx.total))+'</strong></div>'+
      (mismatch?'<div class="installment-edit-warning">The installment paid amount does not match the transaction history. You can use the transaction total below, or enter the correct schedule amount manually.</div>':'')+
      '<button class="btn-paper" type="button" id="ieUseTx" style="width:100%;justify-content:center;margin-bottom:12px">Use transaction total ('+safe(money(tx.total))+')</button>'+
      (syncDate?'<p class="installment-edit-help"><b>DLD rule:</b> the DLD and 1st Installment due dates are linked. Changing either one updates the other to the same date.</p>':'')+
      '<label class="brand-field">Remarks<textarea id="ieRemarks" placeholder="Optional installment note">'+safe(remarks)+'</textarea></label>'+
      '<p class="installment-edit-help">Editing an installment changes the payment schedule only. It does not create, delete, or rewrite transaction-history entries.</p>'+
      '<div class="installment-edit-actions"><button class="btn btn-gold" type="button" id="ieSave">Save installment</button><button class="btn-paper" type="button" id="ieCancel">Cancel</button></div>';

    var dueEl=document.getElementById('ieDueAmount'), paidEl=document.getElementById('iePaidAmount'), paidDateEl=document.getElementById('iePaidDate');
    function refreshStatus(){ var el=document.getElementById('ieStatus'); if (el) el.textContent=derivedStatus(num(dueEl.value)||0,num(paidEl.value)||0); }
    dueEl.addEventListener('input',refreshStatus); paidEl.addEventListener('input',refreshStatus);
    document.getElementById('ieUseTx').addEventListener('click',function(){ paidEl.value=String(tx.total||0); paidDateEl.value=tx.total>0&&tx.lastDate?tx.lastDate:''; refreshStatus(); });
    document.getElementById('ieCancel').addEventListener('click',function(){ overlay.remove(); });
    document.getElementById('ieSave').addEventListener('click',function(){ saveEditor(c,stage,row,overlay); });
  }

  async function saveEditor(c,stage,row,overlay){
    var due=num(document.getElementById('ieDueAmount').value), paid=num(document.getElementById('iePaidAmount').value);
    var dueDate=document.getElementById('ieDueDate').value || null;
    var paidDate=document.getElementById('iePaidDate').value || null;
    var remarks=text(document.getElementById('ieRemarks').value).trim() || null;
    var err=document.getElementById('ieError'), save=document.getElementById('ieSave');
    function fail(message){ err.textContent=message; err.style.display='block'; }
    if (due===null || due<0){ fail('Enter a valid due amount.'); return; }
    if (!row && due<=0){ fail('Enter a due amount greater than zero to create this installment.'); return; }
    if (paid===null || paid<0){ fail('Enter a valid paid amount.'); return; }
    if (paid>due+0.01){ fail('Paid amount cannot be greater than the due amount.'); return; }
    if (paid>0 && !paidDate){ fail('Choose the paid date when a paid amount is entered.'); return; }
    if (paid<=0) paidDate=null;
    save.disabled=true; save.textContent='Saving…'; err.style.display='none';
    try{
      var rpc=await sb.rpc('crm_save_installment',{
        p_schedule_id:row?row.id:null,
        p_unit_id:c.sno,
        p_stage_name:stageDbName(stage),
        p_due_amount:due,
        p_due_date:dueDate,
        p_paid_amount:paid,
        p_paid_date:paidDate,
        p_remarks:remarks
      });
      if (rpc.error) throw rpc.error;
      var key=state.selectedUnit, from=state.detailFrom || 'list';
      overlay.remove();
      await loadFromSupabase();
      state.selectedUnit=key; state.detailFrom=from; state.view='detail';
      if (typeof window.renderMain==='function') window.renderMain(); else if (typeof window.renderDetail==='function') window.renderDetail();
    }catch(ex){
      fail(ex&&ex.message?ex.message:'Could not save that installment.');
      save.disabled=false; save.textContent='Save installment';
    }
  }

  function syncNewCustomerDldDates(){
    if (!window.state) return;
    var first=document.getElementById('ncDate_1ST'), dld=document.getElementById('ncDate_DLD');
    if (!first || !dld) return;
    if (first.getAttribute('data-dld-sync')==='1') return;
    first.setAttribute('data-dld-sync','1'); dld.setAttribute('data-dld-sync','1');
    function fromFirst(){ if (dld.value!==first.value) dld.value=first.value; }
    function fromDld(){ if (first.value!==dld.value) first.value=dld.value; }
    first.addEventListener('change',fromFirst); first.addEventListener('input',fromFirst);
    dld.addEventListener('change',fromDld); dld.addEventListener('input',fromDld);
    if (first.value) dld.value=first.value; else if (dld.value) first.value=dld.value;
    var holder=dld.closest?dld.closest('label.brand-field'):null;
    if (holder && !holder.querySelector('.dld-sync-note')){
      var note=document.createElement('span'); note.className='dld-sync-note'; note.style.cssText='display:block;margin-top:4px;font-size:10.5px;color:var(--muted)'; note.textContent='Same date as 1st Installment'; holder.appendChild(note);
    }
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail!=='function') { setTimeout(install,50); return; }
    ensureStyles();
    var originalRenderDetail=window.renderDetail;
    window.renderDetail=function(){ var out=originalRenderDetail.apply(this,arguments); decorateCards(); return out; };
    var observer=new MutationObserver(function(){ decorateCards(); syncNewCustomerDldDates(); });
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',function(ev){ if (!ev.target.closest || !ev.target.closest('.installment-menu-btn') && !ev.target.closest('.installment-menu-pop')) closeMenus(); });
    decorateCards(); syncNewCustomerDldDates();
  }

  install();
})();
