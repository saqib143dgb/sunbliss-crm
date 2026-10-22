(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function preview(task,value,panel,pendingPaymentSteps){
 const promiseDates=['will_pay_later','partial_payment_commitment'].includes(value)?
   Array.from(panel.querySelectorAll('.saCommitmentDate')).map(function(x){return x.value;}).filter(Boolean).sort():[];
 const date=promiseDates[0]||panel.querySelector('#saNextDate,#spaDate')?.value;
 const when=date?' · '+new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
 if(task.workflow_kind==='spa'){
  const step=task.spa_step;
  const map={appointment:'Customer visiting for SPA signing'+when+'.',customer_signed:'Get developer signature. The SPA is complete only after both parties sign.',developer_signed:'Send fully signed SPA to the customer, and register Oqood.',registered:'Check whether the Initial Contract of Sale is issued.',issued:'Send Initial Contract of Sale.',pending:'Check contract issuance again'+when+'.',clarification:'Resolve the customer’s SPA question.',change:'Management approval for the requested SPA change.',escalate:'Management review.',refused:'Management review of the refusal to sign.',remote:'Send SPA for digital signing.',approved:'Share the approved decision with the customer.',conditional:'Share the conditions with the customer.',rejected:'Share the rejection with the customer.',prepared:'Review the revised SPA.',checked:'Send SPA invitation.',revise:'Prepare the corrected SPA.',later:'Follow up'+when+'.',no_show:'Follow up after the missed appointment'+when+'.',no_reply:'Continue the signing follow-up. After two reminders, call the customer.',accepted:step==='decision'?'Prepare the approved SPA changes.':'Arrange SPA signing.'};
  if(value==='sent')return ({invite:'Send SPA Signing Reminder in 3 days if no response.',reminder:'Continue signing follow-up; after two reminders, call the customer.',remote:'Follow up on digital signing in 3 days.',clarify:'Follow up on the customer’s response.',decision:'Confirm the customer’s response to the decision.',email:'Close this email task. Oqood continues separately.',contract:'Close this task. The Initial Contract of Sale has been sent.'})[step]||'Save the sent record and continue the signing workflow.';
  return map[value]||'Choose an outcome to see the next step.';
 }
 if(task.auto_kind==='demand_letter'){
  if(value==='customer_confirmed_payment')return 'Cancel the Demand Letter and create Confirm Payment with Accounts. No money is recorded as received.';
  if(value==='sent')return 'Close this Demand Letter as sent. Only select this if it was actually delivered to the customer.';
 }
 if(task.workflow_kind==='accounts_confirmation'&&!task.transaction_id&&String(task.auto_key||'').startsWith('customer_reported_before_demand_letter|')){
  if(value==='confirmed')return 'Open Record Payment and save the actual Accounts-confirmed transaction. The receipt task follows the recorded payment.';
  if(value==='not_received')return 'Create a customer payment follow-up. No installment is marked paid.';
  if(value==='amount_mismatch')return 'Review the payment amount with the customer and Accounts before recording it.';
 }
 const map={payment_reported:'Open Record Payment. Choose Accounts confirmed, customer reported, or cheque pending. This task stays open until payment is saved.',record_payment:'Open Record Payment. This task stays open until the payment is saved.',will_pay_later:'Follow up on the promised payment'+when+'. The installment balance and contractual date stay unchanged.',partial_payment_commitment:'Create a follow-up for every promised part on its date. No payment is recorded.',extension_request:'Management Approval → Confirm with Customer. Activate the extension only after acceptance.',payment_issue:'Resolve Payment Query'+when+'. The balance stays unchanged.',query_resolved:'Resume payment follow-up'+when+'. Resolving a query does not mark the installment paid.',no_response:'Follow up with the customer'+when+'.',cancel_task:'Cancel this task and preserve its reason in History. The balance stays unchanged.',recheck_accounts:'Confirm the existing payment with Accounts. Do not record the same payment again.',confirmed:'Send Payment Receipt after Accounts confirmation.',cleared:'Send Payment Receipt after cheque clearance.',still_pending:'Check cheque clearance again'+when+'.',not_received:'Follow up with the customer and verify the payment details.',amount_mismatch:'Review the recorded amount before sending a receipt.',returned:'Review the returned cheque before continuing collection.',approved:'Confirm the approved date with the customer. No extension is active yet.',approved_with_changes:'Confirm the revised date and conditions with the customer.',rejected:'Communicate the rejection and record the customer’s response.',clarification:'Obtain clarification, then return to Management.',accepted:'Activate the approved extension and follow up on its deadline.',rerequest:'Management re-approval → Reconfirm with Customer.',declined:'Record disagreement and continue collection.',withdrawn:'Withdraw the request and continue collection.',acknowledged:'Record acknowledgement and continue collection.'};
 if(String(task.auto_key||'').startsWith('booking_welcome|')){
  if((pendingPaymentSteps||[]).includes('accounts_confirmation'))return 'Record Welcome Letter sent. Confirm payment with Accounts, then send the payment receipt.';
  if((pendingPaymentSteps||[]).includes('cheque_clearance'))return 'Record Welcome Letter sent. Confirm cheque clearance, then send the payment receipt.';
  if((pendingPaymentSteps||[]).includes('payment_receipt'))return 'Record Welcome Letter sent. Continue with the Payment Receipt task.';
  return 'Record Welcome Letter sent. Send a payment receipt once Accounts confirms the payment.';
 }
 if(value==='sent'||task.workflow_kind==='payment_receipt')return 'Record receipt sent. The CRM checks SPA eligibility and creates an invitation only when the required payments and receipts are complete.';
 return map[value]||'Choose an outcome to see the next step.';
}
window.__sunblissEnhanceTaskOutcome=function(panel,config){
 // Receipt completion is a single verified action; no generic next step.
 if(config.task&&config.task.workflow_kind==='payment_receipt')return;
 if(panel.dataset.outcomeEnhanced)return;panel.dataset.outcomeEnhanced='true';
 const select=panel.querySelector('#'+config.selectId),save=panel.querySelector('#'+config.saveId);
 if(!select&&!String(config.task.auto_key||'').startsWith('booking_welcome|'))return;
 const box=document.createElement('div');box.className='task-next-preview';box.setAttribute('aria-live','polite');
 const actions=panel.querySelector('.brand-editor-actions'),scroll=panel.querySelector('.crm-scheduled-scroll');if(scroll)scroll.appendChild(box);else actions?.before(box);
 panel.addEventListener('outcome-options-changed',update);
 function update(){const value=select?.value||'';box.innerHTML='<strong>Next step</strong><p>'+esc(preview(config.task,value,panel,config.pendingPaymentSteps))+'</p>';box.hidden=!!(select?.tagName==='SELECT'&&!value);if(save&&select?.tagName==='SELECT'&&save.textContent!=='Saving…')save.disabled=!value;if(save&&(value==='payment_reported'||(config.task.workflow_kind==='accounts_confirmation'&&!config.task.transaction_id&&value==='confirmed'&&String(config.task.auto_key||'').startsWith('customer_reported_before_demand_letter|'))))save.textContent='Continue to payment';else if(save&&config.selectId==='saOutcome'&&value&&save.textContent!=='Saving…')save.textContent='Save Outcome';}
 panel.addEventListener('change',update);panel.addEventListener('input',update);update();
};
const style=document.createElement('style');style.textContent=`
.task-next-preview[hidden]{display:none!important}.task-next-preview{padding:12px;margin:12px 0;border:1px solid var(--paper-line);border-radius:10px;background:rgba(79,115,92,.07);font:500 13px/1.5 Inter,sans-serif}.task-next-preview strong{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--sage,#4c715c)}.task-next-preview p{margin:7px 0 0}#scheduledActionPanel .sa-commitment-part{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-bottom:1px solid var(--paper-line);padding:10px 0}#scheduledActionPanel .sa-commitment-part button{grid-column:1/-1}#scheduledActionPanel .task-prior-note{margin:10px 0 16px;font-size:13px;line-height:1.5}#scheduledActionPanel .task-prior-note summary{cursor:pointer;color:var(--muted);font-weight:600}#scheduledActionPanel .task-prior-note p{white-space:pre-wrap;overflow-wrap:anywhere}#scheduledActionPanel #saCompletionNote{min-height:80px!important;height:90px!important}#scheduledActionPanel button:disabled{opacity:.55;cursor:wait}@media(min-width:900px){#scheduledActionPanel[data-outcome-enhanced="true"]{padding-left:max(30px,calc((100vw - 920px)/2))!important;padding-right:max(30px,calc((100vw - 920px)/2))!important}}@media(max-width:420px){.task-next-preview{font-size:12px}}`;
document.head.appendChild(style);
})();
