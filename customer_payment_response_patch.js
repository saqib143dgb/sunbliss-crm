(function(){
'use strict';
if(window.__sunblissCustomerPaymentResponseInstalled)return;
window.__sunblissCustomerPaymentResponseInstalled=true;

function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function money(v){var n=Number(v)||0;return typeof window.fmtAED==='function'?window.fmtAED(n):'AED '+n.toLocaleString('en-AE',{maximumFractionDigits:2})}
function currentCustomer(){if(!window.state||state.view!=='detail'||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function closeMenu(){var m=document.getElementById('customerActionMenu'),b=document.getElementById('customerActionMenuButton');if(m)m.style.display='none';if(b)b.setAttribute('aria-expanded','false')}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function removePanel(){var p=document.getElementById('customerPaymentResponsePanel');if(p)p.remove();document.body.classList.remove('customer-response-open')}

function ensureStyle(){
 if(document.getElementById('customerPaymentResponseStyles'))return;
 var s=document.createElement('style');s.id='customerPaymentResponseStyles';s.textContent=[
 'body.customer-response-open{overflow:hidden!important;overscroll-behavior:none}',
 'body.customer-response-open>.tabs,body.customer-response-open>#sunblissPersistentBack,body.customer-response-open>#sunblissDockSearchPanel{display:none!important}',
 '#customerPaymentResponsePanel{position:fixed;inset:0;z-index:12620;display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:100%;height:100dvh;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:var(--paper,#F6F1E4);box-shadow:none!important;overflow:hidden!important;color:var(--ink)}',
 '#customerPaymentResponsePanel *{box-sizing:border-box}',
 '#customerPaymentResponsePanel .cpr-head{padding:calc(18px + env(safe-area-inset-top)) 18px 14px;border-bottom:1px solid var(--paper-line);background:var(--paper)}',
 '#customerPaymentResponsePanel .cpr-head h2{margin:0 0 5px;font:650 23px/1.2 Fraunces,Georgia,serif;color:var(--ink)}',
 '#customerPaymentResponsePanel .cpr-summary{margin:0;color:var(--muted);font:500 12px/1.45 Inter,sans-serif}',
 '#customerPaymentResponsePanel .cpr-body{min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:18px;scroll-padding:18px}',
 '#customerPaymentResponsePanel .cpr-content{max-width:720px;margin:0 auto}',
 '#customerPaymentResponsePanel .cpr-help{margin:0 0 14px;font:500 11.5px/1.5 Inter,sans-serif;color:var(--muted)}',
 '#customerPaymentResponsePanel .cpr-box{margin:10px 0 14px;padding:12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim)}',
 '#customerPaymentResponsePanel .cpr-part{padding:10px 0 0;border-top:1px solid var(--paper-line)}',
 '#customerPaymentResponsePanel .cpr-part:first-child{padding-top:0;border-top:0}',
 '#customerPaymentResponsePanel .cpr-part-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
 '#customerPaymentResponsePanel .brand-field{display:block;margin:0 0 15px;font:600 12px/1.4 Inter,sans-serif;color:var(--muted)}',
 '#customerPaymentResponsePanel input,#customerPaymentResponsePanel select,#customerPaymentResponsePanel textarea{display:block;width:100%!important;min-width:0!important;max-width:100%!important;margin-top:6px;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);font:500 16px/1.3 Inter,sans-serif}',
 '#customerPaymentResponsePanel textarea{min-height:92px;resize:vertical}',
 '#customerPaymentResponsePanel .cpr-foot{padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--paper-line);background:var(--paper)}',
 '#customerPaymentResponsePanel .cpr-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:720px;margin:0 auto}',
 '#customerPaymentResponsePanel .cpr-actions button{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin:0!important;border-radius:10px}',
 '@media(max-width:560px){#customerPaymentResponsePanel .cpr-part-grid{grid-template-columns:1fr}}',
 '@media(min-width:1024px){#customerPaymentResponsePanel .cpr-head{padding:28px max(36px,calc((100vw - 920px)/2)) 20px}#customerPaymentResponsePanel .cpr-head h2{font-size:30px}#customerPaymentResponsePanel .cpr-body{padding:28px 36px 36px}#customerPaymentResponsePanel .cpr-content{max-width:920px}#customerPaymentResponsePanel .cpr-foot{padding:16px max(36px,calc((100vw - 920px)/2))}#customerPaymentResponsePanel .cpr-actions{display:flex;justify-content:flex-end;max-width:920px}#customerPaymentResponsePanel .cpr-actions button{width:auto!important;min-width:190px}}'
 ].join('');
 document.head.appendChild(s);
}

async function loadOutstanding(unitId){
 var q=await Promise.all([
  sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,status').eq('unit_id',unitId).order('due_date',{ascending:true}).order('id',{ascending:true}),
  sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',unitId)
 ]);
 q.forEach(function(r){if(r.error)throw r.error});
 var credits={};(q[1].data||[]).forEach(function(n){var k=String(n.payment_schedule_id);credits[k]=Math.round(((credits[k]||0)+(Number(n.amount)||0))*100)/100});
 return (q[0].data||[]).map(function(r){var remaining=Math.round(Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-(credits[String(r.id)]||0))*100)/100;return{row:r,remaining:remaining}}).filter(function(x){return x.remaining>0.01&&!/\bbooking\b/i.test(text(x.row.stage_name))});
}

function partRow(n){
 return '<div class="cpr-part" data-part="'+n+'"><div class="cpr-part-grid"><label class="brand-field">Part '+n+' amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" class="cprAmount"></label><label class="brand-field">Commitment date<input type="date" class="cprDate"></label></div>'+(n>2?'<button type="button" class="btn-paper cprRemove" style="width:100%;justify-content:center">Remove part</button>':'')+'</div>';
}
function parts(){
 var host=document.getElementById('cprParts');if(!host)return[];
 return Array.from(host.querySelectorAll('.cpr-part')).map(function(row){return{amount:Number(row.querySelector('.cprAmount').value||0),date:text(row.querySelector('.cprDate').value).trim()}});
}
function bindRemove(root){(root||document).querySelectorAll('.cprRemove').forEach(function(b){b.onclick=function(){var r=b.closest('.cpr-part');if(r)r.remove()}})}
function syncOutcome(){
 var out=document.getElementById('cprOutcome'),date=document.getElementById('cprNextDateWrap'),partial=document.getElementById('cprPartialWrap');
 if(!out)return;var v=out.value;
 if(date){date.style.display=(v==='will_pay_later'||v==='no_response')?'block':'none';var l=date.querySelector('.cpr-date-label');if(l)l.textContent=v==='will_pay_later'?'Promised payment date':'Next follow-up date'}
 if(partial)partial.style.display=v==='partial_payment_commitment'?'block':'none';
}

async function openPanel(){
 closeMenu();removePanel();ensureStyle();
 var c=currentCustomer();if(!c)return;
 var p=document.createElement('div');p.id='customerPaymentResponsePanel';p.className='customer-response-panel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-labelledby','cprTitle');
 document.body.appendChild(p);document.body.classList.add('customer-response-open');
 function shell(body,actions){p.innerHTML='<header class="cpr-head"><h2 id="cprTitle">Record Customer Response</h2><p class="cpr-summary">'+safe(c.unit)+' · '+safe(c.name)+'</p></header><div class="cpr-body"><div class="cpr-content">'+body+'</div></div><footer class="cpr-foot"><div class="cpr-actions">'+actions+'</div></footer>';var close=p.querySelector('#cprClose');if(close)close.onclick=removePanel}
 shell('<p class="cpr-help">Loading outstanding installments…</p>','<button class="btn-paper" type="button" id="cprClose">Cancel</button>');
 try{
  var rows=await loadOutstanding(Number(c.sno));
  if(!rows.length){shell('<p class="cpr-help">There is no outstanding installment for this customer.</p>','<button class="btn-paper" type="button" id="cprClose">Close</button>');return}
  var choices='<option value="">Select installment</option>'+rows.map(function(x){var due=text(x.row.revised_due_date||x.row.due_date);return'<option value="'+x.row.id+'">'+safe(x.row.stage_name)+' · '+safe(money(x.remaining))+' outstanding'+(due?' · due '+safe(due):'')+'</option>'}).join('');
  shell(
   '<p class="cpr-help">Use this whenever the customer responds after a Demand Letter, reminder, call or email. Select the exact installment the response relates to. The contractual installment and due date are not changed.</p>'+
   '<p class="brand-error" id="cprError" style="display:none"></p>'+
   '<label class="brand-field">Related installment<select id="cprSchedule">'+choices+'</select></label>'+
   '<label class="brand-field">Customer response<select id="cprOutcome"><option value="">Select response</option><option value="payment_reported">Payment Reported</option><option value="will_pay_later">Will Pay Later</option><option value="partial_payment_commitment">Partial Payment Commitment</option><option value="payment_issue">Payment Issue / Dispute</option><option value="no_response">No Response</option></select></label>'+
   '<label class="brand-field" id="cprNextDateWrap" style="display:none"><span class="cpr-date-label">Next date</span><input type="date" id="cprNextDate" value="'+safe(addDays(3))+'"></label>'+
   '<div id="cprPartialWrap" class="cpr-box" style="display:none"><p style="margin:0 0 4px;font:650 12px Inter,sans-serif">Partial Payment Commitment</p><p class="cpr-help">Add two or more amounts and the special dates the customer committed to pay. The original installment stays unchanged.</p><div id="cprParts">'+partRow(1)+partRow(2)+'</div><button type="button" class="btn-paper" id="cprAddPart" style="width:100%;justify-content:center;margin-top:10px">+ Add another part</button></div>'+
   '<label class="brand-field">Note (optional)<textarea id="cprNote" rows="3" placeholder="Short customer commitment or response"></textarea></label>'+
   '<p class="cpr-help"><strong>Official due-date change:</strong> use Payment Extension instead of Will Pay Later.</p>',
   '<button class="btn btn-gold" type="button" id="cprSave">Save Response</button><button class="btn-paper" type="button" id="cprClose">Cancel</button>'
  );
  document.getElementById('cprOutcome').onchange=syncOutcome;syncOutcome();
  document.getElementById('cprAddPart').onclick=function(){var h=document.getElementById('cprParts'),n=h.querySelectorAll('.cpr-part').length+1;h.insertAdjacentHTML('beforeend',partRow(n));bindRemove(h)};
  bindRemove(p);
  document.getElementById('cprSave').onclick=function(){saveResponse(c)};
 }catch(e){shell('<p class="brand-error" style="display:block">'+safe(e&&e.message?e.message:'Could not load payment details.')+'</p>','<button class="btn-paper" type="button" id="cprClose">Close</button>')}
}

async function saveResponse(c){
 var save=document.getElementById('cprSave'),err=document.getElementById('cprError'),scheduleId=Number(document.getElementById('cprSchedule').value)||0,outcome=text(document.getElementById('cprOutcome').value),note=text(document.getElementById('cprNote').value).trim(),nextDate=text(document.getElementById('cprNextDate').value).trim(),payloadParts=null;
 function fail(m){if(err){err.textContent=m;err.style.display='block'}if(save){save.disabled=false;save.textContent='Save Response'}}
 if(!scheduleId)return fail('Select the related installment.');
 if(!outcome)return fail('Select the customer response.');
 if((outcome==='will_pay_later'||outcome==='no_response')&&!nextDate)return fail('Select the next date.');
 if(outcome==='partial_payment_commitment'){
  payloadParts=parts();if(payloadParts.length<2)return fail('Add at least two payment parts.');
  for(var i=0;i<payloadParts.length;i++){if(!isFinite(payloadParts[i].amount)||payloadParts[i].amount<=0)return fail('Enter the amount for Part '+(i+1)+'.');if(!payloadParts[i].date)return fail('Select the commitment date for Part '+(i+1)+'.')}
 }
 if(err)err.style.display='none';save.disabled=true;save.textContent='Saving…';
 try{
  var r=await sb.rpc('crm_record_customer_payment_response',{p_unit_id:Number(c.sno),p_schedule_id:scheduleId,p_outcome:outcome,p_note:note||null,p_next_date:(outcome==='will_pay_later'||outcome==='no_response')?nextDate:null,p_parts:payloadParts});
  if(r.error)throw r.error;var data=r.data||{},taskId=Number(data.task_id)||null;
  removePanel();
  if(typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();
  if(outcome==='payment_reported'&&typeof window.__sunblissOpenRecordPayment==='function'){
   window.__sunblissOpenRecordPayment({scheduleId:scheduleId,sourceTaskId:taskId});
  }else if(typeof window.renderMain==='function')window.renderMain();
 }catch(e){fail(e&&e.message?e.message:'Could not save the customer response.')}
}

function ensureMenuItem(){
 if(!window.state||state.view!=='detail'||state.userRole!=='crm_officer')return;
 var menu=document.getElementById('customerActionMenu');if(!menu||document.getElementById('actionRecordCustomerPaymentResponse'))return;
 var b=document.createElement('button');b.type='button';b.id='actionRecordCustomerPaymentResponse';b.textContent='Record Customer Response';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
 var payment=document.getElementById('actionRecordPayment');if(payment&&payment.parentNode===menu)payment.insertAdjacentElement('afterend',b);else menu.appendChild(b);
 b.onclick=function(e){e.preventDefault();e.stopPropagation();openPanel()};
}
function install(){
 ensureStyle();
 if(!window.state||!window.sb){setTimeout(install,80);return}
 var rd=window.renderDetail;if(typeof rd==='function')window.renderDetail=function(){var x=rd.apply(this,arguments);setTimeout(ensureMenuItem,0);return x};
 new MutationObserver(function(){ensureMenuItem()}).observe(document.body,{childList:true,subtree:true});
 ensureMenuItem();
}
install();
})();