(function(){
'use strict';
if(window.__sunblissRecordPaymentReliabilityInstalled)return;
window.__sunblissRecordPaymentReliabilityInstalled=true;
window.__sunblissRecordPaymentFixV4=true;

var cache={customer:null,rows:[],credits:{},loading:false,saving:false,lastResult:null};
var refreshJob=null,refreshVersion=0,refreshRecords={};
var panelSession=0;
var viewportCleanup=null;
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
function remaining(row){var due=Number(row&&row.due_amount)||0,cash=Number(row&&row.paid_amount)||0,credit=Number(cache.credits[String(row&&row.id)])||0;return Math.round((due-cash-credit)*100)/100}

function resetState(){
  cache.customer=null;cache.rows=[];cache.credits={};cache.loading=false;cache.saving=false;cache.lastResult=null;
  if(window.state){state.paymentFormOpen=false;state.paymentFormSaving=false;state.paymentFormError=null}
}
function closePanel(){
  if(cache.saving)return false;
  panelSession++;
  if(viewportCleanup){viewportCleanup();viewportCleanup=null;}
  document.body.classList.remove('record-payment-open');
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
  var panel=document.getElementById('recordPaymentReliablePanel'),e=panel&&panel.querySelector('#recordPaymentReliableError');
  if(e){e.textContent=msg;e.style.display='block';window.setTimeout(function(){try{e.scrollIntoView({block:'center',behavior:'smooth'})}catch(_err){}},0)}
  cache.saving=false;setBusy(false);
  if(window.state)state.paymentFormSaving=false;
  var b=panel&&panel.querySelector('#pfSave');if(b){b.disabled=false;b.textContent='Save payment'}
}
function clearError(){var panel=document.getElementById('recordPaymentReliablePanel'),e=panel&&panel.querySelector('#recordPaymentReliableError');if(e){e.textContent='';e.style.display='none'}}

function ensureStyles(){
  if(document.getElementById('recordPaymentReliableStyles'))return;
  var style=document.createElement('style');style.id='recordPaymentReliableStyles';
  style.textContent=`
body.record-payment-open{overflow:hidden!important;overscroll-behavior:none}
body.record-payment-open>.tabs,body.record-payment-open>#sunblissPersistentBack,body.record-payment-open>#sunblissDockSearchPanel{display:none!important}
#recordPaymentReliablePanel{position:fixed;top:var(--payment-top,0px);left:0;right:0;z-index:12600;display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:var(--payment-height,100dvh);width:100%;max-width:none;margin:0!important;padding:0!important;border:0;border-radius:0;background:var(--paper,#F6F1E4);box-shadow:none;overflow:hidden;box-sizing:border-box;color:var(--ink);}
#recordPaymentReliablePanel *{box-sizing:border-box}
#recordPaymentReliablePanel .record-payment-head{padding:calc(18px + env(safe-area-inset-top)) 18px 14px;border-bottom:1px solid var(--paper-line);background:var(--paper)}
#recordPaymentReliablePanel .record-payment-head h2{margin:0 0 5px;font:650 23px/1.2 Fraunces,Georgia,serif}
#recordPaymentReliablePanel .record-payment-summary{margin:0;color:var(--muted);font:500 12px/1.45 Inter,system-ui,sans-serif}
#recordPaymentReliablePanel .record-payment-body{min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:18px;scroll-padding:18px}
#recordPaymentReliablePanel .record-payment-content{max-width:680px;margin:0 auto}
#recordPaymentReliablePanel #recordPaymentReliableForm{margin:0;padding:0}
#recordPaymentReliablePanel .brand-field{display:block;margin:0 0 15px;min-width:0;font:600 12px/1.4 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel input,#recordPaymentReliablePanel select{display:block;width:100%!important;min-width:0!important;max-width:100%!important;min-height:46px;margin-top:6px;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;font:500 16px/1.3 Inter,system-ui,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box}
#recordPaymentReliablePanel input:focus-visible,#recordPaymentReliablePanel select:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px}
#recordPaymentReliablePanel input[type=date]{-webkit-appearance:none;appearance:none}
#recordPaymentReliablePanel input[type=date]::-webkit-date-and-time-value{min-height:20px;text-align:left}
#recordPaymentReliablePanel .credit-note-toggle{margin:0;padding:7px 0;min-height:36px}
#recordPaymentReliablePanel #pfCreditFields{margin-top:12px;padding:14px;border:1px solid var(--paper-line);border-radius:10px}
#recordPaymentReliablePanel #pfCreditFields:not([hidden]){display:block!important}
#recordPaymentReliablePanel .credit-note-fields-title{margin:0 0 4px;font:650 13px/1.35 Inter,system-ui,sans-serif;color:var(--ink)}
#recordPaymentReliablePanel .credit-note-fields-help{margin:0 0 14px;font:500 11px/1.45 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel .record-payment-footer{padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--paper-line);background:var(--paper)}
#recordPaymentReliablePanel .record-payment-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:680px;margin:0 auto}
#recordPaymentReliablePanel .record-payment-actions:has(>button:only-child){grid-template-columns:1fr}
#recordPaymentReliablePanel .record-payment-actions button{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin:0!important;border-radius:10px;font:600 14px/1.2 Inter,system-ui,sans-serif;touch-action:manipulation}
#recordPaymentReliablePanel button:disabled{opacity:.65;cursor:default}
#recordPaymentReliablePanel .record-payment-success{margin:0;padding:22px 18px;border:1px solid rgba(44,112,75,.28);border-radius:12px;background:rgba(44,112,75,.08);text-align:center}
#recordPaymentReliablePanel .record-payment-success-title{margin:0 0 8px;font:650 21px/1.3 Fraunces,Georgia,serif}
#recordPaymentReliablePanel .record-payment-success-copy{margin:0;font:500 13px/1.6 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel .record-payment-success-ref{margin:12px 0 0;font:500 12px/1.4 IBM Plex Mono,monospace}
#recordPaymentReliablePanel .payment-confirmation{grid-column:1/-1;margin:0;padding:0;border:0;min-width:0}
#recordPaymentReliablePanel .payment-confirmation legend{margin:0 0 6px;padding:0;font:650 12.5px/1.4 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel .payment-confirmation-help{margin:0 0 10px;font:500 11px/1.45 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel .payment-confirmation-options{display:grid;grid-template-columns:1fr;gap:8px}
#recordPaymentReliablePanel .payment-confirmation-card{position:relative;display:block;margin:0;padding:12px 13px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);cursor:pointer}
#recordPaymentReliablePanel .payment-confirmation-card input{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;min-height:0!important;margin:0!important}
#recordPaymentReliablePanel .payment-confirmation-card:has(input:checked){border-color:var(--gold-deep);box-shadow:0 0 0 1px var(--gold-deep);background:rgba(162,124,53,.06)}
#recordPaymentReliablePanel .payment-confirmation-title{display:block;font:650 13px/1.35 Inter,system-ui,sans-serif;color:var(--ink)}
#recordPaymentReliablePanel .payment-confirmation-copy{display:block;margin-top:3px;font:500 10.8px/1.4 Inter,system-ui,sans-serif;color:var(--muted)}
#recordPaymentReliablePanel .payment-next-action{margin:10px 0 0;padding:9px 10px;border-radius:8px;background:var(--paper);font:600 11.5px/1.4 Inter,system-ui,sans-serif;color:var(--ink)}
#recordPaymentReliablePanel .record-payment-empty{font:400 14px/1.5 Inter,system-ui,sans-serif;color:var(--muted)}
.record-payment-refresh-status{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font:500 12px/1.45 Inter,system-ui,sans-serif;color:var(--ink)}
.record-payment-refresh-status button{flex:none;margin:0;min-height:36px;padding:7px 10px;border:1px solid var(--paper-line);border-radius:7px;background:var(--paper);color:var(--ink);font:600 12px Inter,sans-serif}
@media(min-width:720px) and (max-width:1023px){#recordPaymentReliablePanel .record-payment-head{padding-left:max(24px,calc((100vw - 680px)/2));padding-right:max(24px,calc((100vw - 680px)/2))}}
@media(min-width:1024px){
  #recordPaymentReliablePanel .record-payment-head{padding:28px max(36px,calc((100vw - 1120px)/2)) 20px}
  #recordPaymentReliablePanel .record-payment-head h2{font-size:30px;line-height:1.15;margin-bottom:6px}
  #recordPaymentReliablePanel .record-payment-summary{font-size:13px}
  #recordPaymentReliablePanel .record-payment-body{padding:30px 36px 36px}
  #recordPaymentReliablePanel .record-payment-content{max-width:1120px}
  #recordPaymentReliablePanel #recordPaymentReliableForm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;row-gap:18px;align-items:start}
  #recordPaymentReliablePanel #recordPaymentReliableForm>.brand-field{margin:0}
  #recordPaymentReliablePanel #recordPaymentReliableForm>.brand-field:first-child{grid-column:1/-1}
  #recordPaymentReliablePanel .payment-confirmation-options{grid-template-columns:repeat(3,minmax(0,1fr))}
  #recordPaymentReliablePanel .brand-field{font-size:12.5px}
  #recordPaymentReliablePanel input,#recordPaymentReliablePanel select{min-height:48px;padding:12px 13px}
  #recordPaymentReliablePanel .credit-note-toggle{grid-column:1/-1;justify-self:start;margin:0;padding:4px 0;min-height:30px}
  #recordPaymentReliablePanel #pfCreditFields{grid-column:1/-1;margin:0;padding:20px}
  #recordPaymentReliablePanel #pfCreditFields:not([hidden]){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px;row-gap:16px;align-items:start}
  #recordPaymentReliablePanel #pfCreditFields>.credit-note-fields-title,#recordPaymentReliablePanel #pfCreditFields>.credit-note-fields-help{grid-column:1/-1}
  #recordPaymentReliablePanel #pfCreditFields>.credit-note-fields-title{margin:0 0 -8px;font-size:13px}
  #recordPaymentReliablePanel #pfCreditFields>.credit-note-fields-help{margin:0 0 2px;font-size:11px}
  #recordPaymentReliablePanel #pfCreditFields>.brand-field{margin:0}
  #recordPaymentReliablePanel .record-payment-footer{padding:16px max(36px,calc((100vw - 1120px)/2))}
  #recordPaymentReliablePanel .record-payment-actions{display:flex;justify-content:flex-end;gap:12px;max-width:1120px}
  #recordPaymentReliablePanel .record-payment-actions:has(>button:only-child){display:flex}
  #recordPaymentReliablePanel .record-payment-actions button{width:auto!important;min-width:190px;min-height:46px;padding-left:24px;padding-right:24px}
  #recordPaymentReliablePanel .record-payment-success{max-width:760px;margin:40px auto;padding:34px}
}
`;
  document.head.appendChild(style);
}
function renderPanel(body,actions){
  var panel=document.getElementById('recordPaymentReliablePanel');if(!panel)return;
  var c=cache.customer||{};
  panel.innerHTML='<header class="record-payment-head"><h2 id="recordPaymentTitle">Record payment</h2><p class="record-payment-summary">'+safe(c.unit)+' · '+safe(c.name)+'</p></header><div class="record-payment-body"><div class="record-payment-content"><p class="brand-error" id="recordPaymentReliableError" role="alert" style="display:none"></p>'+body+'</div></div><footer class="record-payment-footer"><div class="record-payment-actions">'+actions+'</div></footer>';
  var cancel=panel.querySelector('#pfCancel');if(cancel)cancel.onclick=closePanel;
}
function syncViewport(panel){
  function fit(){if(!panel.isConnected)return;var v=window.visualViewport;panel.style.setProperty('--payment-height',(v?v.height:window.innerHeight)+'px');panel.style.setProperty('--payment-top',(v?v.offsetTop:0)+'px');}
  var viewport=window.visualViewport;fit();
  if(viewport){viewport.addEventListener('resize',fit);viewport.addEventListener('scroll',fit);}
  window.addEventListener('resize',fit);
  viewportCleanup=function(){if(viewport){viewport.removeEventListener('resize',fit);viewport.removeEventListener('scroll',fit);}window.removeEventListener('resize',fit);};
}
function setBusy(busy){
  var panel=document.getElementById('recordPaymentReliablePanel');if(!panel)return;
  panel.setAttribute('aria-busy',busy?'true':'false');
  panel.querySelectorAll('input,select,button').forEach(function(el){el.disabled=busy;});
}
function optionLabel(r){var rem=Math.max(0,remaining(r)),stage=text(r.stage_name).trim();if(isDld(r))stage='DLD + Admin Fees';return stage+' · '+(rem<=1?'Fully settled':money(rem))}

function selectedScheduleRow(){
  var panel=document.getElementById('recordPaymentReliablePanel'),select=panel&&panel.querySelector('#pfStage'),sid=Number(select&&select.value)||0;
  return cache.rows.find(function(r){return Number(r.id)===sid})||null;
}
function closeCreditFields(){
  var panel=document.getElementById('recordPaymentReliablePanel'),toggle=panel&&panel.querySelector('#pfCreditToggle'),box=panel&&panel.querySelector('#pfCreditFields');
  if(!toggle||!box)return;
  box.setAttribute('hidden','');box.hidden=true;box.style.setProperty('display','none','important');
  toggle.setAttribute('aria-expanded','false');toggle.textContent='+ Add credit note (optional)';
}
function syncCreditAvailability(){
  var panel=document.getElementById('recordPaymentReliablePanel'),toggle=panel&&panel.querySelector('#pfCreditToggle'),box=panel&&panel.querySelector('#pfCreditFields');
  if(!toggle||!box)return;
  toggle.hidden=false;
  toggle.style.display='';
  toggle.disabled=false;
  toggle.setAttribute('aria-disabled','false');
  if(box.hidden||box.hasAttribute('hidden')||window.getComputedStyle(box).display==='none'){
    toggle.textContent='+ Add credit note (optional)';
    toggle.setAttribute('aria-expanded','false');
  }
}
function toggleCreditFields(){
  var panel=document.getElementById('recordPaymentReliablePanel'),toggle=panel&&panel.querySelector('#pfCreditToggle'),box=panel&&panel.querySelector('#pfCreditFields');if(!toggle||!box||toggle.hidden)return;
  var opening=box.hasAttribute('hidden')||box.hidden||window.getComputedStyle(box).display==='none';
  if(opening){box.removeAttribute('hidden');box.hidden=false;box.style.removeProperty('display');toggle.setAttribute('aria-expanded','true');toggle.textContent='− Remove credit note';var amount=panel.querySelector('#pfCreditAmount');if(amount)window.setTimeout(function(){try{amount.focus()}catch(_e){}},0)}
  else{closeCreditFields()}
}

function renderForm(){
  var p=document.getElementById('recordPaymentReliablePanel');if(!p)return;
  var c=cache.customer,rows=cache.rows,openRows=rows.filter(function(r){return remaining(r)>1}),selected=(openRows[0]||rows[0]||{}).id||'';
  var options=rows.map(function(r){return'<option value="'+safe(r.id)+'"'+(Number(r.id)===Number(selected)?' selected':'')+'>'+safe(optionLabel(r))+'</option>'}).join('');
  var body;
  if(rows.length){
    body='<form id="recordPaymentReliableForm" novalidate>'+ 
      '<label class="brand-field">Installment<select id="pfStage">'+options+'</select></label>'+ 
      '<label class="brand-field">Amount paid (AED)<input type="number" id="pfAmount" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 50000" /></label>'+ 
      '<label class="brand-field">Payment date<input type="date" id="pfDate" value="'+today()+'" /></label>'+ 
      '<label class="brand-field">Reference (optional)<input type="text" id="pfRef" placeholder="e.g. cheque or transfer no." /></label>'+ 
      '<label class="brand-field">Remarks (optional)<input type="text" id="pfRemarks" placeholder="e.g. paid via bank transfer" /></label>'+ 
      '<fieldset class="payment-confirmation"><legend>Payment Confirmation</legend><p class="payment-confirmation-help">Choose who has confirmed the payment. The CRM will create only the correct next action.</p><div class="payment-confirmation-options">'+
      '<label class="payment-confirmation-card"><input type="radio" name="pfConfirmation" value="confirmed_by_accounts"><span class="payment-confirmation-title">Confirmed by Accounts</span><span class="payment-confirmation-copy">Receipt can be issued.</span></label>'+
      '<label class="payment-confirmation-card"><input type="radio" name="pfConfirmation" value="confirmed_by_customer"><span class="payment-confirmation-title">Confirmed by Customer</span><span class="payment-confirmation-copy">Accounts verification is still required.</span></label>'+
      '<label class="payment-confirmation-card"><input type="radio" name="pfConfirmation" value="cheque_pending_clearance"><span class="payment-confirmation-title">Cheque Pending Clearance</span><span class="payment-confirmation-copy">Receipt stays locked until clearance.</span></label>'+
      '</div><div class="payment-next-action" id="pfNextAction">Next action: Select a confirmation status</div></fieldset>'+
      '<button class="credit-note-toggle" type="button" id="pfCreditToggle" aria-expanded="false">+ Add credit note (optional)</button>'+ 
      '<div id="pfCreditFields" hidden style="display:none"><p class="credit-note-fields-title">Credit note</p><p class="credit-note-fields-help">Paperwork adjustment only. It settles this installment without being counted as cash received.</p>'+ 
      '<label class="brand-field">Credit note amount (AED)<input type="number" id="pfCreditAmount" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 25000" /></label>'+ 
      '<label class="brand-field">Issue date<input type="date" id="pfCreditDate" value="'+today()+'" /></label>'+ 
      '<label class="brand-field">Reason<input type="text" id="pfCreditReason" placeholder="Reason for credit note" /></label>'+ 
      '<label class="brand-field">Reference number (optional)<input type="text" id="pfCreditRef" placeholder="e.g. CN-2026-014" /></label></div>'+ 
      '</form>';
  }else{
    body='<div class="record-payment-empty">No payment schedule is available for this unit. Review the installment ledger before recording a payment.</div>';
  }
  renderPanel(body,(rows.length?'<button class="btn btn-gold" type="submit" form="recordPaymentReliableForm" id="pfSave">Save payment</button>':'')+'<button class="btn-paper" type="button" id="pfCancel">'+(rows.length?'Cancel':'Close')+'</button>');
  var form=p.querySelector('#recordPaymentReliableForm');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();e.stopPropagation();savePayment()},true);
  var save=p.querySelector('#pfSave');
  if(save)save.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();savePayment()},true);

  // Bind the credit-note control directly to the rendered form.
  // This avoids desktop capture-phase handlers swallowing the delegated click.
  var creditToggle=p.querySelector('#pfCreditToggle');
  if(creditToggle){
    creditToggle.onclick=function(e){e.preventDefault();e.stopPropagation();toggleCreditFields();};
  }
  var stageSelect=p.querySelector('#pfStage');
  if(stageSelect)stageSelect.addEventListener('change',syncCreditAvailability);
  p.querySelectorAll('input[name="pfConfirmation"]').forEach(function(input){input.addEventListener('change',syncConfirmationPreview);});
  syncConfirmationPreview();
  syncCreditAvailability();
}

async function loadRows(c,session){
  var uid=unitId(c);if(!uid)throw new Error('This unit is not linked to its database record. Refresh the CRM and try again.');
  var q=await Promise.all([
    sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status').eq('unit_id',uid).order('due_date',{ascending:true}).order('id',{ascending:true}),
    sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',uid)
  ]);
  q.forEach(function(r){if(r.error)throw r.error});
  if(session!==panelSession)return;
  cache.rows=(q[0].data||[]).filter(function(r){return Number(r.due_amount)>0&&!/\bbooking\b/i.test(text(r.stage_name))});
  cache.credits={};
  (q[1].data||[]).forEach(function(n){if(n.payment_schedule_id!=null){var k=String(n.payment_schedule_id);cache.credits[k]=Math.round(((cache.credits[k]||0)+(Number(n.amount)||0))*100)/100}});
}

async function openPanel(){
  if(!window.state||state.userRole!=='crm_officer'||!window.sb||cache.saving)return;
  closePanel();ensureStyles();
  var c=currentCustomer();if(!c){window.alert('Could not identify the selected customer. Refresh the CRM and try again.');return;}
  var session=panelSession;
  cache.customer=c;cache.loading=true;state.paymentFormOpen=false;
  var panel=document.createElement('div');panel.id='recordPaymentReliablePanel';panel.className='brand-editor record-payment-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','recordPaymentTitle');
  document.body.appendChild(panel);document.body.classList.add('record-payment-open');syncViewport(panel);
  renderPanel('<p class="record-payment-empty" role="status">Loading installments…</p>','<button class="btn-paper" type="button" id="pfCancel">Cancel</button>');
  try{await loadRows(c,session);if(session!==panelSession||!panel.isConnected)return;cache.loading=false;renderForm();}
  catch(e){if(session!==panelSession||!panel.isConnected)return;cache.loading=false;renderPanel('<p class="brand-error" role="alert">'+safe(errorText(e))+'</p>','<button class="btn-paper" type="button" id="pfCancel">Close</button>');}
}
function val(id){var panel=document.getElementById('recordPaymentReliablePanel'),e=panel&&panel.querySelector('[id="'+id+'"]');return e?text(e.value).trim():''}
function selectedConfirmation(){var panel=document.getElementById('recordPaymentReliablePanel'),e=panel&&panel.querySelector('input[name="pfConfirmation"]:checked');return e?text(e.value).trim():''}
function syncConfirmationPreview(){var panel=document.getElementById('recordPaymentReliablePanel'),host=panel&&panel.querySelector('#pfNextAction');if(!host)return;var mode=selectedConfirmation(),label=mode==='confirmed_by_accounts'?'Send Payment Receipt':mode==='confirmed_by_customer'?'Confirm Payment with Accounts':mode==='cheque_pending_clearance'?'Confirm Cheque Clearance':'Select a confirmation status';host.textContent='Next action: '+label}

function renderCurrentDetail(key,from){
  if(!window.state)return;
  state.selectedUnit=key;state.detailFrom=from||'list';state.view='detail';
  try{if(typeof window.renderMain==='function')window.renderMain();else if(typeof window.renderDetail==='function')window.renderDetail()}catch(e){console.error('[Sunbliss] detail render failed',e)}
}
function mountRefreshStatus(){
  var current=window.state&&state.view==='detail'&&refreshRecords[state.selectedUnit],detail=document.querySelector('#main .detail');
  if(!current||!detail)return;
  var note=detail.querySelector('.record-payment-refresh-status');
  if(!note){note=document.createElement('div');note.className='record-payment-refresh-status';note.setAttribute('role','status');var anchor=detail.querySelector('#btnOpenPaymentForm');if(anchor)anchor.before(note);else detail.prepend(note);}
  var copy=current.status==='ready'?'Payment saved. Customer details updated.':current.status==='error'?'Payment saved. Customer details could not refresh.':current.status==='slow'?'Payment saved. Updating customer details is taking longer than expected.':'Payment saved. Updating balances and history…';
  if(note.dataset.status===current.status)return;
  note.dataset.status=current.status;note.innerHTML='<span>'+safe(copy)+'</span>'+(current.status==='error'?'<button type="button">Retry refresh</button>':'');
  var retry=note.querySelector('button');if(retry)retry.onclick=function(){startCustomerRefresh(state.selectedUnit);};
}
function refreshVisibleCustomer(){
  if(!window.state||state.view!=='detail'||!refreshRecords[state.selectedUnit])return;
  if(document.querySelector('[aria-modal="true"],.rpp-panel,#scheduledActionPanel,#paymentExtensionPanel')){mountRefreshStatus();return;}
  var key=state.selectedUnit,y=window.scrollY||0;
  renderCurrentDetail(key,state.detailFrom);mountRefreshStatus();
  window.scrollTo({top:y,behavior:'instant'});
  requestAnimationFrame(function(){if(state.view==='detail'&&state.selectedUnit===key)window.scrollTo({top:y,behavior:'instant'});});
}
function startCustomerRefresh(key){
  refreshRecords[key]={status:'loading'};refreshVersion++;mountRefreshStatus();
  if(refreshJob)return refreshJob;
  var slowTimer=setTimeout(function(){Object.keys(refreshRecords).forEach(function(k){if(refreshRecords[k].status==='loading')refreshRecords[k].status='slow';});mountRefreshStatus();},15000);
  refreshJob=Promise.resolve().then(async function(){
    var version;
    do{
      version=refreshVersion;
      if(typeof window.loadFromSupabase!=='function')throw Error('Customer refresh is unavailable.');
      await window.loadFromSupabase({preserveView:true,render:false});
      if(typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();
    }while(version!==refreshVersion);
    Object.keys(refreshRecords).forEach(function(k){refreshRecords[k].status='ready';});
    refreshVisibleCustomer();
  }).catch(function(err){
    console.warn('[Sunbliss] payment saved; customer refresh failed',err);
    Object.keys(refreshRecords).forEach(function(k){if(refreshRecords[k].status!=='ready')refreshRecords[k].status='error';});
    mountRefreshStatus();
  }).finally(function(){clearTimeout(slowTimer);refreshJob=null;});
  return refreshJob;
}
function returnToCustomer(key,from){
  closePanel();
  var record=refreshRecords[key];
  if(!window.state||state.selectedUnit!==key||state.view!=='detail'||!document.querySelector('#main .detail')||record&&record.status==='ready'){
    var y=window.scrollY||0;renderCurrentDetail(key,from);window.scrollTo({top:y,behavior:'instant'});
  }
  mountRefreshStatus();
}
function showSuccess(result,row,cash,credit,key,from,confirmation,workflowWarning){
  cache.saving=false;cache.lastResult=result||{};
  if(window.state){state.paymentFormSaving=false;state.paymentFormError=null}
  var p=document.getElementById('recordPaymentReliablePanel');if(!p)return;
  var txId=result&&result.transaction_id,cnId=result&&result.credit_note_id;
  var summary=[];
  if(cash>0)summary.push(money(cash)+' cash');
  if(credit>0)summary.push(money(credit)+' credit note');
  var refs=[];if(txId)refs.push('Transaction #'+txId);if(cnId)refs.push('Credit note #'+cnId);
  var workflowCopy='';
  if(txId){
    if(confirmation==='confirmed_by_accounts')workflowCopy='<strong>Accounts Confirmed.</strong><br><strong>Send Payment Receipt</strong> has been created as the next action.';
    else if(confirmation==='cheque_pending_clearance')workflowCopy='<strong>Cheque Pending Clearance.</strong><br><strong>Confirm Cheque Clearance</strong> has been created as the next action.';
    else workflowCopy='<strong>Customer Confirmed · Accounts Pending.</strong><br><strong>Confirm Payment with Accounts</strong> has been created as the next action.';
  }
  if(workflowWarning)workflowCopy+='<br><span style="color:var(--rust)">Workflow setup needs attention: '+safe(workflowWarning)+'</span>';
  setBusy(false);
  renderPanel('<div class="record-payment-success" role="status"><p class="record-payment-success-title">Payment recorded</p><p class="record-payment-success-copy">'+safe(row&&row.stage_name||'Payment')+(summary.length?'<br>'+safe(summary.join(' + ')):'')+'</p>'+(workflowCopy?'<p class="record-payment-success-copy" style="margin-top:10px">'+workflowCopy+'</p>':'')+(refs.length?'<p class="record-payment-success-ref">'+safe(refs.join(' · '))+'</p>':'')+'</div>','<button class="btn btn-gold" type="button" id="pfReturn">Return to customer</button>');
  startCustomerRefresh(key);
  var back=p.querySelector('#pfReturn');if(back)back.onclick=function(){returnToCustomer(key,from)};
}

async function savePayment(){
  if(cache.saving||cache.lastResult)return;
  clearError();
  var sid=Number(val('pfStage'))||0,row=cache.rows.find(function(r){return Number(r.id)===sid})||null,
      cash=val('pfAmount')===''?0:Number(val('pfAmount')),date=val('pfDate'),ref=val('pfRef'),remarks=val('pfRemarks'),confirmation=selectedConfirmation(),
      panel=document.getElementById('recordPaymentReliablePanel'),box=panel&&panel.querySelector('#pfCreditFields'),creditOpen=!!(box&&!box.hidden&&window.getComputedStyle(box).display!=='none'),
      credit=creditOpen&&val('pfCreditAmount')!==''?Number(val('pfCreditAmount')):0,creditDate=creditOpen?val('pfCreditDate'):'',
      creditReason=creditOpen?val('pfCreditReason'):'',creditRef=creditOpen?val('pfCreditRef'):'';
  if(!row){setError('Select an installment.');return}
  if(!isFinite(cash)||cash<0){setError('Enter a valid cash payment amount.');return}
  if(!isFinite(credit)||credit<0){setError('Enter a valid credit note amount.');return}
  if(cash<=0&&credit<=0){setError('Enter a cash payment, a credit note, or both.');return}
  if(cash>0&&!date){setError('Select a payment date.');return}
  if(cash>0&&!confirmation){setError('Select how the payment was confirmed.');return}
  if(credit>0&&!creditDate){setError('Select the credit note issue date.');return}
  if(credit>0&&!creditReason){setError('Enter the credit note reason.');return}

  var btn=panel&&panel.querySelector('#pfSave'),key=state.selectedUnit,from=state.detailFrom||'list';
  cache.saving=true;state.paymentFormSaving=true;
  if(document.activeElement&&panel&&panel.contains(document.activeElement))document.activeElement.blur();
  setBusy(true);
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
    var result=r.data||{},workflowWarning='';
    cache.lastResult=result;
    if(cash>0&&result.transaction_id){
      var wf=await sb.rpc('crm_set_payment_confirmation_mode',{p_transaction_id:result.transaction_id,p_mode:confirmation,p_note:remarks||null});
      if(wf.error)workflowWarning=errorText(wf.error);
    }
    showSuccess(result,row,cash,credit,key,from,confirmation,workflowWarning);
  }catch(e){
    window.__sunblissLastPaymentError={message:e&&e.message||'',details:e&&e.details||'',hint:e&&e.hint||'',code:e&&e.code||'',scheduleId:row&&row.id||null,unitId:unitId(cache.customer)};
    setError(errorText(e));
  }
}

function targetFromEvent(e){if(!e||!e.target||!e.target.closest)return null;return e.target.closest('#btnOpenPaymentForm,#actionRecordPayment')}
document.addEventListener('click',function(e){var target=targetFromEvent(e);if(!target)return;if(!window.state||state.userRole!=='crm_officer')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPanel()},true);
window.addEventListener('popstate',closePanel);
window.addEventListener('pageshow',function(event){if(event.persisted&&!cache.saving)closePanel();});
var baseDetail=window.renderDetail;if(typeof baseDetail==='function')window.renderDetail=function(){var result=baseDetail.apply(this,arguments);mountRefreshStatus();return result;};
window.__sunblissOpenRecordPayment=openPanel;
window.__sunblissRecordPaymentSave=savePayment;
ensureStyles();
})();
