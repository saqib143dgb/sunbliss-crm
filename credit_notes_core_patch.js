(function(){
  'use strict';
  if (window.__sunblissCreditNotesCoreInstalled) return;
  window.__sunblissCreditNotesCoreInstalled=true;

  function text(v){ return v==null?'':String(v); }
  function safe(v){
    if (typeof window.esc==='function') return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; });
  }
  function number(v){ if(v==null||text(v).trim()==='') return null; var n=Number(v); return isFinite(n)?n:null; }
  function money(v){ return typeof window.fmtAED==='function'?window.fmtAED(Number(v)||0):'AED '+(Number(v)||0).toLocaleString('en-US',{maximumFractionDigits:2}); }
  function today(){ var d=new Date(),m=d.getMonth()+1,day=d.getDate(); return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day); }
  function dateLabel(v){
    if(!v) return '—';
    var d=v instanceof Date?v:new Date(text(v).length===10?text(v)+'T00:00:00':v);
    return isNaN(d.getTime())?text(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function unitKey(v){ return text(v).trim().toUpperCase().replace(/\s+/g,''); }
  function stageCode(name){
    if(typeof window.stageCodeFromName==='function') return window.stageCodeFromName(name);
    var s=text(name).trim().toLowerCase();
    if(s.indexOf('down')!==-1) return 'DP';
    if(s.indexOf('dld')!==-1) return 'DLD';
    if(s.indexOf('1st')!==-1||s.indexOf('first')!==-1) return '1ST';
    if(s.indexOf('2nd')!==-1||s.indexOf('second')!==-1) return '2ND';
    if(s.indexOf('3rd')!==-1||s.indexOf('third')!==-1) return '3RD';
    if(s.indexOf('4th')!==-1||s.indexOf('fourth')!==-1) return '4TH';
    if(s.indexOf('5th')!==-1||s.indexOf('fifth')!==-1) return '5TH';
    if(s.indexOf('6th')!==-1||s.indexOf('sixth')!==-1) return '6TH';
    if(s.indexOf('7th')!==-1||s.indexOf('seventh')!==-1) return '7TH';
    if(s.indexOf('final')!==-1||s.indexOf('handover')!==-1) return 'FIN';
    return '';
  }
  function selectedCustomer(){
    if(!window.state||!state.selectedUnit||!Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit); })||null;
  }
  function allCustomers(){
    var rows=[];
    [state&&state.dues,state&&state.cancelled].forEach(function(list){ if(Array.isArray(list)) list.forEach(function(c){ if(c) rows.push(c); }); });
    return rows;
  }
  function ensureStyles(){
    if(document.getElementById('sunblissCreditNoteStyles')) return;
    var s=document.createElement('style'); s.id='sunblissCreditNoteStyles'; s.textContent=[
      '.credit-note-toggle{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:var(--gold-deep);padding:1px 0 10px;font:650 11.5px/1.3 Inter,sans-serif;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;cursor:pointer}',
      '.credit-note-toggle:focus-visible{outline:2px solid var(--gold-deep);outline-offset:3px;border-radius:4px}',
      '#pfCreditFields{margin:0 0 12px;padding:12px;border:1px solid rgba(198,151,46,.34);border-radius:11px;background:rgba(198,151,46,.07)}#pfCreditFields[hidden]{display:none!important}',
      '#pfCreditFields .credit-note-fields-title{font:700 12px/1.35 Inter,sans-serif;color:var(--ink);margin:0 0 3px}#pfCreditFields .credit-note-fields-help{font-size:10.8px;line-height:1.45;color:var(--muted);margin:0 0 10px}',
      '.credit-note-stage-row span:first-child{color:var(--gold-deep)!important;font-weight:650}.credit-note-stage-count{display:inline-flex;margin-top:7px;padding:3px 7px;border-radius:999px;background:rgba(198,151,46,.12);border:1px solid rgba(198,151,46,.32);color:var(--gold-deep);font:650 9.5px/1.2 IBM Plex Mono,monospace}',
      '.credit-note-customer-total{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-5px 0 15px;padding:10px 12px;border:1px solid rgba(198,151,46,.34);border-radius:11px;background:rgba(198,151,46,.07)}.credit-note-customer-total span{font-size:11px;color:var(--muted)}.credit-note-customer-total strong{font:700 13px/1.2 IBM Plex Mono,monospace;color:var(--gold-deep)}',
      '.credit-note-tx-row{background:rgba(198,151,46,.055)}.credit-note-tx-row .tx-amt{color:var(--gold-deep)}.credit-note-badge{display:inline-block;margin-right:6px;padding:2px 6px;border-radius:999px;background:rgba(198,151,46,.15);border:1px solid rgba(198,151,46,.34);color:var(--gold-deep);font:700 9px/1.2 IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.04em}',
      '.credit-note-portfolio{margin:2px 0 20px;padding:13px;border:1px solid rgba(198,151,46,.34);border-radius:13px;background:rgba(198,151,46,.055)}.credit-note-portfolio-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);border-radius:10px;overflow:hidden;margin-bottom:11px}.credit-note-portfolio-summary>div{background:var(--paper);padding:10px}.credit-note-portfolio-summary small{display:block;font:500 9px/1.25 IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:4px}.credit-note-portfolio-summary strong{font:700 13px/1.25 Fraunces,serif;color:var(--ink)}',
      '.credit-note-filter-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:11px}.credit-note-filter-grid .brand-field{margin:0}.credit-note-filter-grid input{display:block;width:100%;margin-top:5px;padding:9px 10px;border:1px solid var(--paper-line);border-radius:8px;background:var(--paper);font:500 15px/1.2 Inter,sans-serif;color:var(--ink)}',
      '.credit-note-month-row,.credit-note-portfolio-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 2px;border-top:1px solid var(--paper-line)}.credit-note-month-row:first-child,.credit-note-portfolio-row:first-child{border-top:0}.credit-note-month-row strong,.credit-note-portfolio-row strong{font:700 11.5px/1.3 IBM Plex Mono,monospace;color:var(--gold-deep);white-space:nowrap}.credit-note-portfolio-row .meta{font-size:10.5px;line-height:1.4;color:var(--muted);margin-top:2px}',
      '.credit-note-edit-meta{border-color:rgba(198,151,46,.34)!important;background:rgba(198,151,46,.07)!important}',
      '@media(max-width:520px){.credit-note-portfolio-summary{grid-template-columns:1fr}.credit-note-filter-grid{grid-template-columns:1fr 1fr}.credit-note-filter-grid button{grid-column:1/-1;width:100%;justify-content:center}.credit-note-customer-total{align-items:flex-start;flex-direction:column}}'
    ].join(''); document.head.appendChild(s);
  }
  function adjustOutstanding(c){
    var total=number(c.total),cash=number(c.cashReceived),current=number(c.outstanding),credits=Number(c.creditNoteTotal)||0;
    if(total===null||cash===null) return;
    var settled=cash+credits,positive=total-cash,negative=cash-total;
    c.outstanding=current!==null&&Math.abs(current-negative)<Math.abs(current-positive)?settled-total:total-settled;
  }
  function recomputeNextDue(c){
    var next=null;
    (c.stages||[]).forEach(function(stage){
      var due=number(stage.due),settled=number(stage.settledAmount!==undefined?stage.settledAmount:stage.paid); if(due===null) return;
      var remaining=due-(settled||0); if(remaining<=1) return;
      if(!next){ next={stage:stage,remaining:remaining}; return; }
      var a=stage.dueDate?new Date(stage.dueDate).getTime():Infinity,b=next.stage.dueDate?new Date(next.stage.dueDate).getTime():Infinity;
      if(a<b) next={stage:stage,remaining:remaining};
    });
    c.upStage=next?next.stage.label:''; c.upAmt=next?Math.round(next.remaining*100)/100:null; c.upDate=next?next.stage.dueDate:null;
  }
  async function enrichCreditNotes(){
    if(!window.sb||!window.state) return;
    var results=await Promise.all([
      sb.from('credit_notes').select('id,customer_id,unit_id,payment_schedule_id,issue_date,amount,reason,reference_number,created_at').order('issue_date',{ascending:false}).order('id',{ascending:false}),
      sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,paid_amount,paid_date'),
      sb.from('units').select('id,customer_id,unit_no')
    ]);
    results.forEach(function(r){if(r.error)throw r.error;});
    var notes=(results[0].data||[]).map(function(x){ return {id:x.id,customerId:x.customer_id,unitId:x.unit_id,scheduleId:x.payment_schedule_id,issueDate:x.issue_date||'',amount:Number(x.amount)||0,reason:x.reason||'',reference:x.reference_number||'',createdAt:x.created_at||'',stageLabel:''}; });
    var schedules=results[1].data||[],units=results[2].data||[];
    state.creditNotes=notes;
    var bySchedule={},byUnit={},scheduleByUnit={},unitByNo={};
    notes.forEach(function(n){ var sk=text(n.scheduleId),uk=text(n.unitId); (bySchedule[sk]||(bySchedule[sk]=[])).push(n); (byUnit[uk]||(byUnit[uk]=[])).push(n); });
    schedules.forEach(function(r){(scheduleByUnit[text(r.unit_id)]||(scheduleByUnit[text(r.unit_id)]=[])).push(r);});
    units.forEach(function(u){var key=unitKey(u.unit_no);if(key&&!unitByNo[key])unitByNo[key]=u;});
    [state.dues,state.cancelled].forEach(function(list){
      if(!Array.isArray(list)) return;
      list.forEach(function(c){
        var dbUnit=unitByNo[unitKey(c.unit)]||null,actualUnitId=dbUnit?dbUnit.id:c.unitId,actualCustomerId=dbUnit?dbUnit.customer_id:c.customerId;
        c.unitId=actualUnitId||null;c.customerId=actualCustomerId||null;
        var unitRows=scheduleByUnit[text(actualUnitId)]||[],unitNotes=byUnit[text(actualUnitId)]||[];
        c.cashReceived=Number(c.received)||0;c.creditNotes=unitNotes;c.creditNoteTotal=unitNotes.reduce(function(s,n){return s+(Number(n.amount)||0);},0);c.settledReceived=c.cashReceived+c.creditNoteTotal;
        (c.stages||[]).forEach(function(st){
          var sr=unitRows.find(function(r){return stageCode(r.stage_name)===st.code;})||null;
          if(sr){st.id=sr.id;st.scheduleId=sr.id;st.customerId=sr.customer_id;st.unitId=sr.unit_id;st.cashPaid=Number(sr.paid_amount)||0;if(sr.paid_date&& !st.paidDate)st.paidDate=new Date(sr.paid_date+'T00:00:00');}
          else st.cashPaid=st.cashPaid!==undefined?(Number(st.cashPaid)||0):(Number(st.paid)||0);
          var stageNotes=bySchedule[text(st.id)]||[],credit=stageNotes.reduce(function(s,n){return s+(Number(n.amount)||0);},0);
          st.creditNotes=stageNotes;st.creditNoteTotal=credit;st.settledAmount=(Number(st.cashPaid)||0)+credit;st.paid=st.settledAmount;stageNotes.forEach(function(n){n.stageLabel=st.label||'';});
        });
        adjustOutstanding(c);recomputeNextDue(c);
      });
    });
  }
  function renderPaymentForm(customer){
    var stages=(customer.stages||[]).filter(function(s){return s.due!==null;}),next=stages.filter(function(s){return (Number(s.due)||0)-(Number(s.paid)||0)>1;})[0],selected=state.paymentFormStage||(next?next.code:stages[0]?stages[0].code:''),h='<div class="brand-editor">';
    if(state.paymentFormError) h+='<p class="brand-error">'+safe(state.paymentFormError)+'</p>';
    h+='<label class="brand-field">Installment<select id="pfStage">';
    stages.forEach(function(s){
      var due=Number(s.due)||0,settled=Number(s.paid)||0,credit=Number(s.creditNoteTotal)||0,cash=s.cashPaid===undefined?settled:Number(s.cashPaid)||0,rem=due-settled,label;
      label=credit>0?s.label+' — '+money(cash)+' cash + '+money(credit)+' credit of '+money(due)+' settled'+(rem>1?' ('+money(rem)+' remaining)':' (fully paid)'):s.label+' — '+money(cash)+' of '+money(due)+' paid'+(rem>1?' ('+money(rem)+' remaining)':' (fully paid)');
      h+='<option value="'+safe(s.code)+'"'+(s.code===selected?' selected':'')+'>'+safe(label)+'</option>';
    });
    h+='</select></label><label class="brand-field">Amount paid (AED)<input type="number" id="pfAmount" min="0" step="0.01" placeholder="e.g. 50000" /></label><label class="brand-field">Payment date<input type="date" id="pfDate" value="'+today()+'" /></label><label class="brand-field">Reference (optional)<input type="text" id="pfRef" placeholder="e.g. cheque or transfer no." /></label><label class="brand-field">Remarks (optional)<input type="text" id="pfRemarks" placeholder="e.g. paid via bank transfer" /></label>';
    h+='<button class="credit-note-toggle" type="button" id="pfCreditToggle" aria-expanded="false">+ Add credit note (optional)</button><div id="pfCreditFields" hidden><p class="credit-note-fields-title">Credit note</p><p class="credit-note-fields-help">Paperwork adjustment only. It settles this installment without being counted as cash received.</p><label class="brand-field">Credit note amount (AED)<input type="number" id="pfCreditAmount" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 25000" /></label><label class="brand-field">Issue date<input type="date" id="pfCreditDate" value="'+today()+'" /></label><label class="brand-field">Reason<input type="text" id="pfCreditReason" placeholder="Reason for credit note" /></label><label class="brand-field">Reference number (optional)<input type="text" id="pfCreditRef" placeholder="e.g. CN-2026-014" /></label></div>';
    h+='<div class="brand-editor-actions"><button class="btn btn-gold" id="pfSave" style="justify-content:center"'+(state.paymentFormSaving?' disabled':'')+'>'+(state.paymentFormSaving?'Saving…':'Save payment')+'</button><button class="btn-paper" id="pfCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div></div>';
    return h;
  }
  function formError(msg){
    state.paymentFormError=msg; var stage=document.getElementById('pfStage'),panel=stage&&stage.closest?stage.closest('.brand-editor'):null; if(!panel) return;
    var err=panel.querySelector('.brand-error'); if(!err){err=document.createElement('p');err.className='brand-error';panel.insertBefore(err,panel.firstChild);} err.textContent=msg; err.style.display='block';
  }
  async function savePayment(customer){
    var sel=document.getElementById('pfStage'),code=sel?sel.value:'',cashEl=document.getElementById('pfAmount'),cash=cashEl&&cashEl.value!==''?Number(cashEl.value):0,pDate=document.getElementById('pfDate'),pRef=document.getElementById('pfRef'),remarks=document.getElementById('pfRemarks'),box=document.getElementById('pfCreditFields'),open=!!(box&&!box.hidden),cnEl=document.getElementById('pfCreditAmount'),credit=open&&cnEl&&cnEl.value!==''?Number(cnEl.value):0,cnDate=document.getElementById('pfCreditDate'),cnReason=document.getElementById('pfCreditReason'),cnRef=document.getElementById('pfCreditRef');
    var paymentDate=pDate?pDate.value:'',paymentRef=pRef?pRef.value.trim():'',remark=remarks?remarks.value.trim():'',creditDate=open&&cnDate?cnDate.value:'',creditReason=open&&cnReason?cnReason.value.trim():'',creditRef=open&&cnRef?cnRef.value.trim():'';
    state.paymentFormStage=code;
    if(!code){formError('Select an installment.');return;} if(!isFinite(cash)||cash<0){formError('Enter a valid cash payment amount.');return;} if(!isFinite(credit)||credit<0){formError('Enter a valid credit note amount.');return;} if(cash<=0&&credit<=0){formError('Enter a cash payment, a credit note, or both.');return;} if(cash>0&&!paymentDate){formError('Select a payment date.');return;} if(credit>0&&!creditDate){formError('Select the credit note issue date.');return;} if(credit>0&&!creditReason){formError('Enter the credit note reason.');return;}
    var st=(customer.stages||[]).find(function(s){return s.code===code;}); if(!st||!st.id){formError('That installment is not linked to its database schedule. Refresh and try again.');return;}
    var btn=document.getElementById('pfSave'),key=state.selectedUnit,from=state.detailFrom||'list'; if(btn){btn.disabled=true;btn.textContent='Saving…';} state.paymentFormSaving=true; state.paymentFormError=null;
    try{
      var r=await sb.rpc('crm_record_payment_with_credit_note',{p_schedule_id:st.id,p_cash_amount:Math.round(cash*100)/100,p_payment_date:cash>0?paymentDate:null,p_payment_reference:paymentRef||null,p_remarks:remark||null,p_credit_amount:Math.round(credit*100)/100,p_credit_issue_date:credit>0?creditDate:null,p_credit_reason:credit>0?creditReason:null,p_credit_reference:credit>0?(creditRef||null):null});
      if(r.error) throw r.error;
      state.paymentFormOpen=false;state.paymentFormSaving=false;state.paymentFormStage=null;state.paymentFormError=null;await loadFromSupabase();state.selectedUnit=key;state.detailFrom=from;state.view='detail';if(typeof window.renderMain==='function')window.renderMain();else renderDetail();
    }catch(e){state.paymentFormSaving=false;formError(e&&e.message?e.message:'Could not save that payment or credit note.');if(btn){btn.disabled=false;btn.textContent='Save payment';}}
  }
  function fixStageBreakdown(stats){
    if(!stats||!Array.isArray(stats.stageBreakdown)) return stats;
    stats.stageBreakdown.forEach(function(row){var cash=0,settled=0,due=0;(state.dues||[]).forEach(function(c){(c.stages||[]).forEach(function(s){if(text(s.label)!==text(row.label))return;due+=Number(s.due)||0;cash+=s.cashPaid===undefined?(Number(s.paid)||0):(Number(s.cashPaid)||0);settled+=s.settledAmount===undefined?(Number(s.paid)||0):(Number(s.settledAmount)||0);});});row.due=due;row.received=cash;row.balance=settled-due;});
    return stats;
  }
  function install(){
    if(!window.state||!window.sb||typeof window.loadFromSupabase!=='function'||typeof window.renderPaymentForm!=='function'||typeof window.savePayment!=='function'){setTimeout(install,50);return;}
    ensureStyles();
    window.__sunblissCreditNoteApi={text:text,safe:safe,number:number,money:money,today:today,dateLabel:dateLabel,selectedCustomer:selectedCustomer,allCustomers:allCustomers,enrichCreditNotes:enrichCreditNotes,ensureStyles:ensureStyles};
    var load=window.loadFromSupabase;window.loadFromSupabase=async function(){var out=await load.apply(this,arguments);try{await enrichCreditNotes();if(typeof window.renderMain==='function'&&state.view&&state.view!=='empty')window.renderMain();}catch(e){console.warn('Could not load credit notes',e);}return out;};
    if(typeof window.portfolioStats==='function'){var stats=window.portfolioStats;window.portfolioStats=function(){return fixStageBreakdown(stats.apply(this,arguments));};}
    window.renderPaymentForm=renderPaymentForm;window.savePayment=savePayment;
    enrichCreditNotes().then(function(){if(state.view&&state.view!=='empty'&&typeof window.renderMain==='function')window.renderMain();}).catch(function(e){console.warn('Could not initialize credit notes',e);});
  }
  install();
})();