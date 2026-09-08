(function(){
'use strict';
if(window.__sunblissRecordPaymentReliabilityInstalled)return;
window.__sunblissRecordPaymentReliabilityInstalled=true;
window.__sunblissRecordPaymentFixV4=true;

var cache={customer:null,rows:[],credits:{},loading:false,saving:false,lastResult:null};
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function money(v){return typeof window.fmtAED==='function'?window.fmtAED(Number(v)||0):'AED '+(Number(v)||0).toLocaleString('en-AE',{maximumFractionDigits:2})}
function today(){var d=new Date(),m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0')}
function currentCustomer(){
  if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
  var key=text(state.selectedUnit);
  var exact=state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===key});
  if(exact)return exact;
  var unitNo=key.split('::')[0];
  return state.dues.find(function(c){return c&&text(c.unit)===unitNo})||null;
}
function unitId(c){return Number(c&&(c.dbUnitId!=null?c.dbUnitId:(c.unitId!=null?c.unitId:c.sno)))||0}
function isDld(row){return /\bdld\b|admin\s*fees?/i.test(text(row&&row.stage_name))}
function remaining(row){var due=Number(row&&row.due_amount)||0,cash=Number(row&&row.paid_amount)||0,credit=isDld(row)?0:(Number(cache.credits[String(row&&row.id)])||0);return Math.round((due-cash-credit)*100)/100}

function resetState(){
  cache.customer=null;cache.rows=[];cache.credits={};cache.loading=false;cache.saving=false;cache.lastResult=null;
  if(window.state){state.paymentFormOpen=false;state.paymentFormSaving=false;state.paymentFormError=null}
}
function closePanel(){
  var p=document.getElementById('recordPaymentReliablePanel');if(p)p.remove();
  resetState();
}
function errorText(err){
  if(!err)return'Could not save that payment.';
  var parts=[];
  if(err.message)parts.push(String(err.message));
  if(err.details&&String(err.details)!==String(err.message))parts.push(String(err.details));
  if(err.hint)parts.push(String(err.hint));
  if(err.code)parts.push('Code: '+String(err.code));
  return parts.filter(Boolean).join(' · ')||'Could not save that payment.';
}
function setError(msg){
  var e=document.getElementById('recordPaymentReliableError');
  if(e){e.textContent=msg;e.style.display='block';window.setTimeout(function(){try{e.scrollIntoView({block:'center',behavior:'smooth'})}catch(_err){}},0)}
  cache.saving=false;
  if(window.state)state.paymentFormSaving=false;
  var b=document.getElementById('pfSave');if(b){b.disabled=false;b.textContent='Save payment'}
}
function clearError(){var e=document.getElementById('recordPaymentReliableError');if(e){e.textContent='';e.style.display='none'}}

function ensureStyles(){
  if(document.getElementById('recordPaymentReliableStyles'))return;
  var s=document.createElement('style');s.id='recordPaymentReliableStyles';s.textContent=[
    '#recordPaymentReliablePanel{margin:0!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}',
    '#recordPaymentReliablePanel #recordPaymentReliableForm{display:block;margin:0;padding:0;max-width:100%;box-sizing:border-box}',
    '#recordPaymentReliablePanel .record-payment-summary{margin:-4px 0 14px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);font-size:11.5px;line-height:1.45;color:var(--muted);max-width:100%;box-sizing:border-box}',
    '#recordPaymentReliablePanel .brand-field{display:block;min-width:0!important;max-width:100%!important;overflow:visible!important}',
    '#recordPaymentReliablePanel select,#recordPaymentReliablePanel input{display:block;width:100%!important;max-width:100%!important;min-width:0!important;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.25 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box!important}',
    '#recordPaymentReliablePanel input[type=date]{width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;-webkit-appearance:none!important;appearance:none!important}',
    '#recordPaymentReliablePanel input[type=date]::-webkit-date-and-time-value{min-width:0!important;text-align:center!important}',
    '#recordPaymentReliablePanel select{overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;padding-right:34px!important;font-size:15px!important}',
    '#recordPaymentReliablePanel .record-payment-stage-note{margin:-4px 0 12px;font-size:10.8px;line-height:1.45;color:var(--muted)}',
    '#recordPaymentReliablePanel .record-payment-empty{padding:14px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);font-size:12px;line-height:1.5;color:var(--muted);margin-bottom:14px}',
    '#recordPaymentReliablePanel .credit-note-toggle{margin-top:2px}',
    '#recordPaymentReliablePanel #pfCreditFields{max-width:100%;box-sizing:border-box}',
    '#recordPaymentReliablePanel #pfCreditFields:not([hidden]){display:block!important}',
    '#recordPaymentReliablePanel .brand-editor-actions{margin-top:16px;pointer-events:auto!important}',
    '#recordPaymentReliablePanel.crm-full-page-inline .brand-editor-actions{position:sticky!important;bottom:0!important;z-index:40!important;margin:18px -16px 0!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;background:var(--paper,#F6F1E4)!important;border-top:1px solid var(--paper-line,#DCD2B6)!important;box-shadow:0 -8px 20px rgba(15,26,38,.08)!important;pointer-events:auto!important}',
    '#recordPaymentReliablePanel #pfSave{position:relative!important;z-index:41!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(0,0,0,0)}',
    '#recordPaymentReliablePanel .record-payment-success{margin:8px 0 14px;padding:18px 14px;border:1px solid rgba(44,112,75,.28);border-radius:12px;background:rgba(44,112,75,.08);text-align:center}',
    '#recordPaymentReliablePanel .record-payment-success-title{margin:0 0 6px;font:700 18px/1.3 Fraunces,serif;color:var(--ink)}',
    '#recordPaymentReliablePanel .record-payment-success-copy{margin:0;font:500 12px/1.55 Inter,sans-serif;color:var(--muted)}',
    '#recordPaymentReliablePanel .record-payment-success-ref{margin:10px 0 0;font:600 11px/1.4 IBM Plex Mono,monospace;color:var(--ink)}',
    '@media(max-width:520px){#recordPaymentReliablePanel .brand-editor-actions{flex-direction:column!important}#recordPaymentReliablePanel .brand-editor-actions button{width:100%!important;min-height:48px!important}}'
  ].join('');
  document.head.appendChild(s);
}
function optionLabel(r){var rem=Math.max(0,remaining(r)),stage=text(r.stage_name).trim();if(isDld(r))stage='DLD + Admin Fees';return stage+' · '+(rem<=1?'Fully settled':money(rem))}

function toggleCreditFields(){
  var toggle=document.getElementById('pfCreditToggle'),box=document.getElementById('pfCreditFields');if(!toggle||!box)return;
  var opening=box.hasAttribute('hidden')||box.hidden||window.getComputedStyle(box).display==='none';
  if(opening){box.removeAttribute('hidden');box.hidden=false;box.style.setProperty('display','block','important');toggle.setAttribute('aria-expanded','true');toggle.textContent='− Remove credit note'}
  else{box.setAttribute('hidden','');box.hidden=true;box.style.setProperty('display','none','important');toggle.setAttribute('aria-expanded','false');toggle.textContent='+ Add credit note (optional)'}
}

function renderForm(){
  var p=document.getElementById('recordPaymentReliablePanel');if(!p)return;
  var c=cache.customer,rows=cache.rows,openRows=rows.filter(function(r){return remaining(r)>1}),selected=(openRows[0]||rows[0]||{}).id||'';
  var options=rows.map(function(r){return'<option value="'+safe(r.id)+'"'+(Number(r.id)===Number(selected)?' selected':'')+'>'+safe(optionLabel(r))+'</option>'}).join('');
  var body;
  if(rows.length){
    body='<form id="recordPaymentReliableForm" novalidate>'+ 
      '<label class="brand-field">Installment<select id="pfStage">'+options+'</select></label>'+ 
      '<p class="record-payment-stage-note">Select the exact payment schedule. Payment is saved first; the customer page refresh happens only after confirmation.</p>'+ 
      '<label class="brand-field">Amount paid (AED)<input type="number" id="pfAmount" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 50000" /></label>'+ 
      '<label class="brand-field">Payment date<input type="date" id="pfDate" value="'+today()+'" /></label>'+ 
      '<label class="brand-field">Reference (optional)<input type="text" id="pfRef" placeholder="e.g. cheque or transfer no." /></label>'+ 
      '<label class="brand-field">Remarks (optional)<input type="text" id="pfRemarks" placeholder="e.g. paid via bank transfer" /></label>'+ 
      '<button class="credit-note-toggle" type="button" id="pfCreditToggle" aria-expanded="false">+ Add credit note (optional)</button>'+ 
      '<div id="pfCreditFields" hidden style="display:none"><p class="credit-note-fields-title">Credit note</p><p class="credit-note-fields-help">Paperwork adjustment only. It settles this installment without being counted as cash received.</p>'+ 
      '<label class="brand-field">Credit note amount (AED)<input type="number" id="pfCreditAmount" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 25000" /></label>'+ 
      '<label class="brand-field">Issue date<input type="date" id="pfCreditDate" value="'+today()+'" /></label>'+ 
      '<label class="brand-field">Reason<input type="text" id="pfCreditReason" placeholder="Reason for credit note" /></label>'+ 
      '<label class="brand-field">Reference number (optional)<input type="text" id="pfCreditRef" placeholder="e.g. CN-2026-014" /></label></div>'+ 
      '<div class="brand-editor-actions"><button class="btn btn-gold" type="submit" id="pfSave" style="justify-content:center">Save payment</button><button class="btn-paper" type="button" id="pfCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div>'+ 
      '</form>';
  }else{
    body='<div class="record-payment-empty">No payment schedule is available for this unit. Review the installment ledger before recording a payment.</div><div class="brand-editor-actions"><button class="btn-paper" type="button" id="pfCancel" style="justify-content:center;margin-bottom:0">Close</button></div>';
  }
  p.innerHTML='<p class="section-label" style="margin-top:0">Record Payment</p><p class="record-payment-summary">Unit '+safe(c&&c.unit||'')+' · '+safe(c&&c.name||'')+'</p><p class="brand-error" id="recordPaymentReliableError" style="display:none"></p>'+body;
  var cancel=document.getElementById('pfCancel');if(cancel)cancel.onclick=closePanel;
  var form=document.getElementById('recordPaymentReliableForm');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();e.stopPropagation();savePayment()},true);
  var save=document.getElementById('pfSave');
  if(save)save.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();savePayment()},true);
  var amount=document.getElementById('pfAmount');if(amount)setTimeout(function(){try{amount.focus()}catch(_e){}},0);
}

async function loadRows(c){
  var uid=unitId(c);if(!uid)throw new Error('This unit is not linked to its database record. Refresh the CRM and try again.');
  var q=await Promise.all([
    sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status').eq('unit_id',uid).order('due_date',{ascending:true}).order('id',{ascending:true}),
    sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',uid)
  ]);
  q.forEach(function(r){if(r.error)throw r.error});
  cache.rows=(q[0].data||[]).filter(function(r){return Number(r.due_amount)>0&&!/\bbooking\b/i.test(text(r.stage_name))});
  cache.credits={};
  (q[1].data||[]).forEach(function(n){if(n.payment_schedule_id!=null){var k=String(n.payment_schedule_id);cache.credits[k]=Math.round(((cache.credits[k]||0)+(Number(n.amount)||0))*100)/100}});
}

async function openPanel(){
  if(!window.state||state.userRole!=='crm_officer'||!window.sb)return;
  closePanel();ensureStyles();
  var c=currentCustomer();if(!c){window.alert('Could not identify the selected customer. Refresh the CRM and try again.');return}
  cache.customer=c;cache.loading=true;state.paymentFormOpen=true;
  var p=document.createElement('div');p.id='recordPaymentReliablePanel';p.className='brand-editor record-payment-panel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');
  p.innerHTML='<p class="section-label" style="margin-top:0">Record Payment</p><p class="record-payment-summary">Unit '+safe(c.unit||'')+' · '+safe(c.name||'')+'</p><p class="stat-sub">Loading payment schedule…</p>';
  document.body.appendChild(p);
  try{await loadRows(c);cache.loading=false;renderForm()}
  catch(e){cache.loading=false;p.innerHTML='<p class="section-label" style="margin-top:0">Record Payment</p><p class="record-payment-summary">Unit '+safe(c.unit||'')+' · '+safe(c.name||'')+'</p><p class="brand-error">'+safe(errorText(e))+'</p><div class="brand-editor-actions"><button class="btn-paper" type="button" id="pfCancel" style="justify-content:center;margin-bottom:0">Close</button></div>';var close=document.getElementById('pfCancel');if(close)close.onclick=closePanel}
}
function val(id){var e=document.getElementById(id);return e?text(e.value).trim():''}

function renderCurrentDetail(key,from){
  if(!window.state)return;
  state.selectedUnit=key;state.detailFrom=from||'list';state.view='detail';
  try{if(typeof window.renderMain==='function')window.renderMain();else if(typeof window.renderDetail==='function')window.renderDetail()}catch(e){console.error('[Sunbliss] detail render failed',e)}
}
function refreshAfterConfirmedSave(key,from){
  if(typeof window.loadFromSupabase!=='function')return Promise.resolve();
  return Promise.resolve(window.loadFromSupabase()).then(function(){renderCurrentDetail(key,from)}).catch(function(e){console.error('[Sunbliss] post-payment refresh failed',e)});
}
function returnToCustomer(key,from){
  closePanel();
  renderCurrentDetail(key,from);
  window.setTimeout(function(){refreshAfterConfirmedSave(key,from)},0);
}
function showSuccess(result,row,cash,credit,key,from){
  cache.saving=false;cache.lastResult=result||{};
  if(window.state){state.paymentFormSaving=false;state.paymentFormError=null}
  var p=document.getElementById('recordPaymentReliablePanel');if(!p)return;
  var txId=result&&result.transaction_id,cnId=result&&result.credit_note_id;
  var summary=[];
  if(cash>0)summary.push(money(cash)+' cash');
  if(credit>0)summary.push(money(credit)+' credit note');
  var refs=[];if(txId)refs.push('Transaction #'+txId);if(cnId)refs.push('Credit note #'+cnId);
  p.innerHTML='<p class="section-label" style="margin-top:0">Payment recorded</p>'+ 
    '<p class="record-payment-summary">Unit '+safe(cache.customer&&cache.customer.unit||'')+' · '+safe(cache.customer&&cache.customer.name||'')+'</p>'+ 
    '<div class="record-payment-success"><p class="record-payment-success-title">Payment recorded successfully</p>'+ 
    '<p class="record-payment-success-copy">'+safe(row&&row.stage_name||'Payment')+(summary.length?' · '+safe(summary.join(' + ')):'')+'</p>'+ 
    (refs.length?'<p class="record-payment-success-ref">'+safe(refs.join(' · '))+'</p>':'')+'</div>'+ 
    '<div class="brand-editor-actions"><button class="btn btn-gold" type="button" id="pfReturn" style="justify-content:center">Return to customer</button></div>';
  var back=document.getElementById('pfReturn');if(back)back.onclick=function(){returnToCustomer(key,from)};
}

async function savePayment(){
  if(cache.saving)return;
  clearError();
  var sid=Number(val('pfStage'))||0,row=cache.rows.find(function(r){return Number(r.id)===sid})||null,
      cash=val('pfAmount')===''?0:Number(val('pfAmount')),date=val('pfDate'),ref=val('pfRef'),remarks=val('pfRemarks'),
      box=document.getElementById('pfCreditFields'),creditOpen=!!(box&&!box.hidden&&window.getComputedStyle(box).display!=='none'),
      credit=creditOpen&&val('pfCreditAmount')!==''?Number(val('pfCreditAmount')):0,creditDate=creditOpen?val('pfCreditDate'):'',
      creditReason=creditOpen?val('pfCreditReason'):'',creditRef=creditOpen?val('pfCreditRef'):'';
  if(!row){setError('Select an installment.');return}
  if(!isFinite(cash)||cash<0){setError('Enter a valid cash payment amount.');return}
  if(!isFinite(credit)||credit<0){setError('Enter a valid credit note amount.');return}
  if(cash<=0&&credit<=0){setError('Enter a cash payment, a credit note, or both.');return}
  if(cash>0&&!date){setError('Select a payment date.');return}
  if(credit>0&&!creditDate){setError('Select the credit note issue date.');return}
  if(credit>0&&!creditReason){setError('Enter the credit note reason.');return}
  if(isDld(row)&&credit>0){setError('DLD + Admin Fees must be settled in cash. Credit notes cannot be applied to this stage.');return}

  var btn=document.getElementById('pfSave'),key=state.selectedUnit,from=state.detailFrom||'list';
  cache.saving=true;state.paymentFormSaving=true;
  if(btn){btn.disabled=true;btn.textContent='Recording…'}
  try{
    var r=await sb.rpc('crm_record_payment_with_credit_note',{
      p_schedule_id:row.id,
      p_cash_amount:Math.round(cash*100)/100,
      p_payment_date:cash>0?date:null,
      p_payment_reference:ref||null,
      p_remarks:remarks||null,
      p_credit_amount:Math.round(credit*100)/100,
      p_credit_issue_date:credit>0?creditDate:null,
      p_credit_reason:credit>0?creditReason:null,
      p_credit_reference:credit>0?(creditRef||null):null
    });
    if(r.error)throw r.error;
    showSuccess(r.data||{},row,cash,credit,key,from);
  }catch(e){
    window.__sunblissLastPaymentError={message:e&&e.message||'',details:e&&e.details||'',hint:e&&e.hint||'',code:e&&e.code||'',scheduleId:row&&row.id||null,unitId:unitId(cache.customer)};
    setError(errorText(e));
  }
}

function targetFromEvent(e){if(!e||!e.target||!e.target.closest)return null;return e.target.closest('#btnOpenPaymentForm,#actionRecordPayment')}
document.addEventListener('click',function(e){var target=targetFromEvent(e);if(!target)return;if(!window.state||state.userRole!=='crm_officer')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPanel()},true);
document.addEventListener('click',function(e){var toggle=e&&e.target&&e.target.closest?e.target.closest('#recordPaymentReliablePanel #pfCreditToggle'):null;if(!toggle)return;e.preventDefault();e.stopPropagation();toggleCreditFields()},true);
window.addEventListener('popstate',closePanel);
window.addEventListener('pageshow',function(){if(document.getElementById('recordPaymentReliablePanel'))closePanel()});
window.__sunblissOpenRecordPayment=openPanel;
window.__sunblissRecordPaymentSave=savePayment;
ensureStyles();
})();
