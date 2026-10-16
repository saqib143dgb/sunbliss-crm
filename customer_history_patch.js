(function(){
'use strict';
if(window.__customerHistoryInstalled)return;
window.__customerHistoryInstalled=true;
var categories={all:'All activities',letters:'Letters & receipts',payments:'Payments',contracts:'Booking & SPA',requests:'Requests & approvals',updates:'Other updates'};
var openVersion=0;
function text(v){return String(v===null||v===undefined?'':v).trim();}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function money(v){var n=Number(v);return isFinite(n)?'AED '+n.toLocaleString('en-AE',{minimumFractionDigits:2,maximumFractionDigits:2}):'Amount not recorded';}
function day(v){var t=text(v);if(!t)return '';var d=new Date(t.length===10?t+'T12:00:00Z':t);if(isNaN(d.getTime()))return '';return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Dubai'});}
function clock(v){var t=text(v);if(!t||t.length===10)return '';var d=new Date(t);return isNaN(d.getTime())?'':d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dubai'});}
function label(v){return text(v).replace(/[_-]/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
function current(){return (window.state&&state.dues||[]).find(function(c){return c.unit+'::'+c.sno===state.selectedUnit;});}
function allowed(){return !!(window.state&&['manager','crm_officer'].includes(state.userRole));}
function close(){openVersion++;var p=document.getElementById('customerHistoryPanel');if(p)p.remove();document.body.classList.remove('customer-history-open');}
function makeEvent(source,id,dateValue,title,summary,detail,kind,meta){
 return {key:source+':'+id,time:text(dateValue),title:title,summary:text(summary),details:(detail||[]).filter(Boolean),kind:kind||'updates',meta:meta||'',source:source};
}
function eventDate(e){return day(e.time)||'Date not recorded';}
function sortKey(e){return e.time?(Date.parse(e.time.length===10?e.time+'T12:00:00Z':e.time)||Number.MAX_SAFE_INTEGER):Number.MAX_SAFE_INTEGER;}
function add(list,source,id,when,title,summary,details,kind,meta){
 list.push(makeEvent(source,id,when,title,summary,details,kind,meta));
}
async function read(table,field,value){
 var r=await sb.from(table).select('*').eq(field,value).limit(1200);
 if(r.error)throw new Error(table+': '+r.error.message);
 return r.data||[];
}
async function readIds(table,field,ids){
 if(!ids.length)return [];
 var results=[];
 for(var i=0;i<ids.length;i+=50){
  var r=await sb.from(table).select('*').in(field,ids.slice(i,i+50)).limit(1200);
  if(r.error)throw new Error(table+': '+r.error.message);
  results.push.apply(results,r.data||[]);
 }
 return results;
}
function stageById(rows){var m={};rows.forEach(function(r){m[r.id]=r.stage_name;});return m;}
function stageName(map,id){return id&&map[id]?map[id]:'';}
function taskTitle(t){
 var name=text(t.action_label),low=name.toLowerCase();
 if(/send.*welcome letter|welcome letter.*send/.test(low))return 'Welcome Letter Sent';
 if(/send.*demand letter|demand letter.*send/.test(low))return 'Demand Letter Sent'+(name.includes('—')?' — '+name.split('—').slice(1).join('—').trim():'');
 if(/send.*gentle reminder|gentle reminder.*send/.test(low))return 'Gentle Reminder Sent';
 if(/send.*payment receipt|payment receipt.*send/.test(low))return 'Payment Receipt Sent';
 if(/send.*(email|letter)|email.*sent/.test(low))return 'Email / Letter Sent';
 if(/send.*soa|statement of account/.test(low))return 'Statement of Account Sent';
 if(/call customer/.test(low))return 'Customer Called';
 if(/management (re-?)?approval/.test(low))return 'Management Approval Reviewed';
 if(/confirm with customer/.test(low))return 'Customer Confirmation Recorded';
 if(/confirm with accounts/.test(low))return 'Accounts Confirmation Follow-up';
 if(/payment commitment/.test(low))return 'Payment Commitment Follow-up';
 if(/spa/.test(low))return 'SPA Follow-up Completed';
 if(/oqood|dld/.test(low))return 'Registration Follow-up Completed';
 return name?name.replace(/^send /i,'Sent ')+' — Completed':'Task Completed';
}
function taskKind(t){
 var s=text(t.action_label).toLowerCase();
 return /demand|letter|receipt|reminder|soa|email/.test(s)?'letters':/payment|collection|cheque/.test(s)?'payments':/spa|oqood|dld/.test(s)?'contracts':'requests';
}
function docName(s){var n=text(s).toLowerCase();return n==='welcome'?'Welcome Letter':n==='receipt'?'Payment Receipt':n==='soa'?'Statement of Account':n==='spa'?'SPA':label(s||'Document');}
async function collect(c){
 var unit=Number(c.sno),customerId=Number(c.customerId||c.customer_id||c.info&&c.info.customerId||0);
 var names=['sales','payment_transactions','scheduled_actions','credit_notes','crm_documents','payment_extension_requests','payment_extensions','modification_requests','cancelled_units','payment_schedule_revision_history','sales_note_history','carry_forward_events','spa_generation_records','payment_transaction_edit_log','payment_transaction_deletion_log','crm_history_manual_events','payment_schedule'];
 var settled=await Promise.all(names.map(function(t){return read(t,'unit_id',unit).then(function(rows){return {table:t,rows:rows};}).catch(function(err){return {table:t,error:err.message,rows:[]};});}));
 var data={},errors=[];settled.forEach(function(r){data[r.table]=r.rows;if(r.error)errors.push(r.error);});
 var extensionEvents=[],modEvents=[],revisionRequests=data.payment_extension_requests||[],modRequests=data.modification_requests||[];
 var extra=await Promise.all([
  readIds('payment_extension_request_events','request_id',revisionRequests.map(function(r){return r.id;})),
  readIds('modification_request_events','request_id',modRequests.map(function(r){return r.id;}))
 ].map(function(p){return p.catch(function(e){errors.push(e.message);return [];});}));
 extensionEvents=extra[0];modEvents=extra[1];
 var events=[],stage=stageById(data.payment_schedule||[]);
 (data.sales||[]).forEach(function(s){
  if(s.booking_date||s.created_at)add(events,'booking',s.id,s.booking_date||s.created_at,'Booking Confirmed','Booking recorded'+(s.booking_amount!=null?' · '+money(s.booking_amount):''),[
   'Booking date: '+(day(s.booking_date)||'Not recorded'),
   'Booking amount: '+money(s.booking_amount),
   'Original sale reference: '+s.id
  ],'contracts');
  if(text(s.spa_status).toLowerCase()==='signed')add(events,'sale-spa',s.id,s.spa_date||'', 'SPA Signed','SPA marked signed in CRM',[
   'SPA signing date: '+(day(s.spa_date)||'Not recorded'), 'Only details recorded in CRM are shown; document revisions require their own evidence.'
  ],'contracts');
  if(text(s.oqood_status).toLowerCase()==='completed')add(events,'sale-oqood',s.id,s.oqood_date||'', 'Oqood Registration Completed','Registration marked completed in CRM',[
   'Registration date: '+(day(s.oqood_date)||'Not recorded'),'Verify against official registration documents.'
  ],'contracts');
 });
 var receipts={};
 (data.payment_transactions||[]).forEach(function(t){
  var inst=stageName(stage,t.payment_schedule_id);
  var desc=money(t.amount)+(inst?' · '+inst:'');
  add(events,'payment',t.id,t.payment_date||t.created_at,'Payment Recorded',desc,[
   'Amount: '+money(t.amount),inst?'Installment: '+inst:'',t.payment_type?'Method: '+t.payment_type:'',
   t.payment_reference?'Reference: '+t.payment_reference:'',t.remarks?'Remarks: '+t.remarks:'',
   t.accounts_confirmation_status?'Accounts status: '+label(t.accounts_confirmation_status):'Accounts confirmation not recorded'
  ],'payments');
  if(t.accounts_confirmed_at)add(events,'payment-confirmed',t.id,t.accounts_confirmed_at,'Payment Confirmed by Accounts',desc,[
   t.accounts_confirmation_note?'Confirmation note: '+t.accounts_confirmation_note:'',
   t.payment_reference?'Payment reference: '+t.payment_reference:''
  ],'payments');
  if(t.receipt_sent_at){
   receipts[t.id]=true;
   add(events,'receipt-sent',t.id,t.receipt_sent_at,'Payment Receipt Sent',desc,[
    'Sending recorded in CRM: '+day(t.receipt_sent_at)+' '+clock(t.receipt_sent_at),
    t.receipt_send_note?'Sending note: '+t.receipt_send_note:'',
    t.payment_reference?'Payment reference: '+t.payment_reference:''
   ],'letters');
  }
 });
 (data.scheduled_actions||[]).forEach(function(t){
  var status=text(t.status).toLowerCase();
  if(status!=='completed'&&!t.completed_at)return;
  var title=taskTitle(t),low=text(t.action_label).toLowerCase();
  if(t.transaction_id&&receipts[t.transaction_id]&&/receipt/.test(low))return;
  var isSend=/^(send|email)/i.test(text(t.action_label))||/sent/i.test(text(t.action_label));
  var dateValue=t.completed_at||t.updated_at||t.created_at;
  add(events,'task',t.id,dateValue,title,isSend?'Sending marked complete in CRM':(text(t.completion_note)||'Task completed'),[
   'Original task: '+(t.action_label||'Task'),t.completion_note?'Completion details: '+t.completion_note:'',
   t.note?'Task note: '+t.note:'',
   'Task outcome: '+label(status), 'Completed: '+(day(t.completed_at)||day(t.updated_at)||'Date unavailable'),
   t.due_date?'Original task due date: '+day(t.due_date):''
  ],taskKind(t),isSend?'Recorded as sent in CRM':'');
 });
 (data.crm_documents||[]).forEach(function(d){
  var doc=docName(d.document_type);
  add(events,'document',d.id,d.created_at,doc+' Generated',
    text(d.file_name)||'Document recorded in CRM',[
     'Document type: '+doc,d.file_name?'File: '+d.file_name:'',
     'Document status: '+(label(d.status)||'Recorded'), 'Generation is not proof of sending.'
    ],doc==='Payment Receipt'?'letters':'contracts');
 });
 (data.spa_generation_records||[]).forEach(function(r){
  add(events,'spa-generated',r.id,r.generated_at||r.created_at,'SPA Generated',
   'SPA document prepared in CRM', ['Generation status: '+(label(r.status)||'Recorded')],'contracts');
 });
 (data.credit_notes||[]).forEach(function(n){
  add(events,'credit',n.id,n.issue_date||n.created_at,'Credit Note Recorded',money(n.amount)+
   (stageName(stage,n.payment_schedule_id)?' · '+stageName(stage,n.payment_schedule_id):''),[
    n.reason?'Reason: '+n.reason:'',n.reference_number?'Reference: '+n.reference_number:'',
    'Credit adjustments are separate from cash received.'
   ],'payments');
 });
 (data.carry_forward_events||[]).forEach(function(n){
  add(events,'carry',n.id,n.event_date||n.created_at,'Carry Forward '+(Number(n.amount)>=0?'Recorded':'Adjusted'),
    money(Math.abs(Number(n.amount)||0)),[n.reason?'Reason: '+n.reason:'', 'Carry forward is not a new cash payment.'],'payments');
 });
 (data.payment_extensions||[]).forEach(function(e){
  var state=text(e.status).toLowerCase();
  add(events,'extension',e.id,e.created_at||e.approved_on,'Payment Extension '+(state==='cancelled'?'Cancelled':'Recorded'),
   stageName(stage,e.payment_schedule_id)||'Installment extension',[
    'Original due: '+(day(e.original_due_date)||'Not recorded'),
    'Extended until: '+(day(e.extended_due_date)||'Not recorded'),
    e.reason?'Reason: '+e.reason:'',e.approved_by?'Approved by: '+e.approved_by:'',
    'Current recorded status: '+label(e.status)
   ],'requests');
 });
 revisionRequests.forEach(function(r){
  add(events,'extension-request',r.id,r.requested_at||r.created_at,'Payment Extension Requested',
   'Requested until '+(day(r.requested_until)||'date not recorded'),[
    r.reason?'Reason: '+r.reason:'',
    r.original_due_date?'Original deadline: '+day(r.original_due_date):'',
    'Request status: '+label(r.status)
   ],'requests');
 });
 extensionEvents.forEach(function(e){
  var kind=text(e.event_type).toLowerCase();
  if(/request_received|request_created/.test(kind))return;
  add(events,'extension-action',e.id,e.created_at,'Extension — '+label(e.event_type),
   text(e.notes)||'Extension case updated',[
    e.notes?'Details: '+e.notes:'',e.request_id?'Extension request reference: '+e.request_id:''
   ],'requests');
 });
 modRequests.forEach(function(r){
  add(events,'modification',r.id,r.request_date||r.created_at,'Modification Requested',
   r.title||'Customer modification request',[
    r.details?'Details: '+r.details:'', 'Status: '+label(r.status),r.request_no?'Reference: '+r.request_no:''
   ],'requests');
 });
 modEvents.forEach(function(e){
  if(text(e.event_type).toLowerCase()==='request_received')return;
  add(events,'modification-event',e.id,e.created_at,'Modification — '+label(e.event_type),
   text(e.note)||'Modification case updated',[
    e.note?'Details: '+e.note:'',e.to_status?'Result: '+label(e.to_status):''
   ],'requests');
 });
 (data.payment_schedule_revision_history||[]).forEach(function(r){
  add(events,'plan-revision',r.id,r.created_at||r.approved_on,'Payment Plan Revised',
   (r.stage_name||'Installment')+' · '+money(r.previous_revised_due_amount==null?r.contractual_due_amount:r.previous_revised_due_amount)+' → '+money(r.new_revised_due_amount==null?r.contractual_due_amount:r.new_revised_due_amount),[
    'Previous due date: '+(day(r.previous_revised_due_date||r.contractual_due_date)||'Not recorded'),
    'Revised due date: '+(day(r.new_revised_due_date||r.contractual_due_date)||'Not recorded'),
    r.reason?'Reason: '+r.reason:'',r.approved_by?'Approved by: '+r.approved_by:''
   ],'contracts');
 });
 (data.cancelled_units||[]).forEach(function(r){
  add(events,'cancellation',r.id,r.cancellation_date||r.created_at,'Unit Cancellation Recorded',
   r.cancellation_reason||'Unit cancelled',[
    'Cancellation reason: '+(r.cancellation_reason||'Not recorded'),
    r.settlement_type?'Settlement: '+r.settlement_type:'',
    'Refund: '+money(r.refund_amount),'Forfeited: '+money(r.forfeited_amount),
    r.remarks?'Remarks: '+r.remarks:''
   ],'contracts');
 });
 (data.sales_note_history||[]).forEach(function(r){
  add(events,'note',r.id,r.edited_at,'Customer Note Updated',
   text(r.new_note)||'Note revised or removed',[
    r.old_note?'Before: '+r.old_note:'',r.new_note?'After: '+r.new_note:'',
    r.note_type?'Note type: '+label(r.note_type):''
   ],'updates');
 });
 (data.payment_transaction_edit_log||[]).forEach(function(r){
  add(events,'payment-edit',r.id,r.edited_at,'Payment Details Corrected',
   money(r.old_amount)+' → '+money(r.new_amount),[
    'Original amount: '+money(r.old_amount),'Corrected amount: '+money(r.new_amount),
    'Old reference: '+(r.old_payment_reference||'—'),'New reference: '+(r.new_payment_reference||'—')
   ],'payments');
 });
 (data.payment_transaction_deletion_log||[]).forEach(function(r){
  add(events,'payment-deletion',r.id,r.deleted_at,'Payment Record Removed',
   money(r.amount)+' · previous transaction preserved in audit',[
    'Original payment date: '+(day(r.payment_date)||'Not recorded'),
    r.payment_reference?'Reference: '+r.payment_reference:'',
    'Historical deletion recorded; this is not a new receipt.'
   ],'payments');
 });
 (data.crm_history_manual_events||[]).forEach(function(r){
  add(events,'manual',r.id,r.event_date,r.title,r.details,[
   'Manually recorded: '+(day(r.created_at)||'Date unavailable')+' '+clock(r.created_at),
   r.outcome?'Result: '+label(r.outcome):'',r.evidence_reference?'Evidence: '+r.evidence_reference:'',
   r.source?'Source: '+label(r.source):''
  ],/payment|credit/.test(r.category)?'payments':/spa|booking|dld|handover/.test(r.category)?'contracts':'updates','Manual entry');
 });
 var unique={},sorted=events.filter(function(e){if(unique[e.key])return false;unique[e.key]=true;return true;});
 sorted.sort(function(a,b){return sortKey(a)-sortKey(b)||a.key.localeCompare(b.key);});
 return {events:sorted,errors:errors,customerId:customerId};
}
function styles(){
 if(document.getElementById('simpleConnectedCustomerHistoryStyles'))return;
 var style=document.createElement('style');style.id='simpleConnectedCustomerHistoryStyles';style.textContent=[
  'body.customer-history-open{overflow:hidden!important}',
  '#customerHistoryPanel{position:fixed;inset:0;z-index:12400;overflow:auto;overscroll-behavior:contain;background:var(--paper,#F6F1E4);padding:0 16px calc(32px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:Inter,Arial,sans-serif;color:var(--ink,#172332)}',
  '#customerHistoryPanel *{box-sizing:border-box}',
  '#customerHistoryPanel .ch-shell{max-width:960px;margin:auto}',
  '#customerHistoryPanel .ch-head{position:sticky;top:0;z-index:2;background:var(--paper,#F6F1E4);display:flex;justify-content:space-between;align-items:center;gap:12px;padding:22px 0 16px;border-bottom:1px solid var(--paper-line,#D7CDBD)}',
  '#customerHistoryPanel .ch-head h2{margin:0;font:600 27px/1.2 Fraunces,Georgia,serif;color:var(--ink)}',
  '#customerHistoryPanel .ch-sub{font-size:12px;line-height:1.5;color:var(--muted);margin:5px 0 0}',
  '#customerHistoryPanel .ch-toolbar{display:flex;gap:8px;align-items:center;margin:16px 0 18px}',
  '#customerHistoryPanel .ch-toolbar select,#customerHistoryPanel .ch-toolbar input{min-width:0;flex:1 1 0;min-height:40px;border:1px solid var(--paper-line,#D7CDBD);border-radius:10px;background:var(--paper-bright,#FFFCF6);padding:8px 10px;font:500 12px Inter,Arial,sans-serif;color:var(--ink)}',
  '#customerHistoryPanel .ch-toolbar input{flex:2 1 160px}',
  '#customerHistoryPanel .ch-button{min-height:40px;white-space:nowrap;padding:9px 14px;border:1px solid var(--paper-line,#D7CDBD);border-radius:10px;background:var(--paper-bright,#FFFCF6);color:var(--ink);font:600 12px Inter,Arial,sans-serif;cursor:pointer}',
  '#customerHistoryPanel .ch-primary{background:var(--ink,#172332);border-color:var(--ink,#172332);color:var(--paper,#F6F1E4)}',
  '#customerHistoryPanel .ch-caption{font:600 10px/1.4 "IBM Plex Mono",monospace;letter-spacing:.04em;color:var(--muted);margin:0 0 12px}',
  '#customerHistoryPanel .ch-timeline{margin:0 0 32px 12px;padding:0 0 0 26px;border-left:2px solid var(--paper-line,#D7CDBD)}',
  '#customerHistoryPanel .ch-event{position:relative;margin:0 0 11px;padding:0;min-width:0}',
  '#customerHistoryPanel .ch-event:before{content:"";position:absolute;left:-35px;top:17px;width:14px;height:14px;border:2px solid var(--paper,#F6F1E4);border-radius:50%;background:var(--gold-deep,#A27C35);box-shadow:0 0 0 1px var(--paper-line,#D7CDBD)}',
  '#customerHistoryPanel .ch-event details{border:1px solid var(--paper-line,#D7CDBD);background:var(--paper-bright,#FFFCF6);border-radius:11px;overflow:hidden}',
  '#customerHistoryPanel .ch-event summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px;padding:12px 14px;align-items:center}',
  '#customerHistoryPanel .ch-event summary::-webkit-details-marker{display:none}',
  '#customerHistoryPanel .ch-event-title{font:650 13px/1.4 Inter,Arial,sans-serif;color:var(--ink);overflow-wrap:anywhere}',
  '#customerHistoryPanel .ch-event-date{font:500 10.5px/1.5 Inter,Arial,sans-serif;color:var(--muted);margin:0 0 2px}',
  '#customerHistoryPanel .ch-summary{margin:3px 0 0;font:500 11.5px/1.45 Inter,Arial,sans-serif;color:var(--muted);overflow-wrap:anywhere}',
  '#customerHistoryPanel .ch-arrow{flex:none;font-size:14px;color:var(--muted);transform:rotate(0deg)}',
  '#customerHistoryPanel details[open] .ch-arrow{transform:rotate(180deg)}',
  '#customerHistoryPanel .ch-details{padding:12px 14px 14px;border-top:1px solid var(--paper-line,#D7CDBD);display:grid;gap:7px}',
  '#customerHistoryPanel .ch-details p{margin:0;font:500 11.5px/1.5 Inter,Arial,sans-serif;color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere}',
  '#customerHistoryPanel .ch-result{font-size:10px;color:var(--muted);margin:0}',
  '#customerHistoryPanel .ch-empty{padding:32px 14px;text-align:center;color:var(--muted);font-size:13px}',
  '#customerHistoryPanel .ch-warn{padding:11px 12px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-bright,#FFFCF6);color:var(--muted);font-size:11.5px;margin-bottom:13px}',
  '#customerHistoryPanel .ch-form{border:1px solid var(--paper-line);border-radius:12px;padding:16px;background:var(--paper-bright,#FFFCF6);margin:16px 0}',
  '#customerHistoryPanel .ch-form label{display:block;font:600 11px/1.3 Inter,Arial,sans-serif;margin:10px 0 5px}',
  '#customerHistoryPanel .ch-form input,#customerHistoryPanel .ch-form textarea,#customerHistoryPanel .ch-form select{display:block;width:100%;min-height:42px;padding:10px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper,#F6F1E4);color:var(--ink);font:500 12px Inter,Arial,sans-serif}',
  '#customerHistoryPanel .ch-form textarea{min-height:92px;resize:vertical}',
  '#customerHistoryPanel .ch-form-actions{display:flex;gap:9px;margin-top:14px}',
  '@media(max-width:600px){#customerHistoryPanel{padding:0 12px calc(30px + env(safe-area-inset-bottom))}#customerHistoryPanel .ch-head{padding:14px 0 12px}#customerHistoryPanel .ch-head h2{font-size:23px}#customerHistoryPanel .ch-toolbar{flex-wrap:wrap}#customerHistoryPanel .ch-toolbar input{flex:1 1 100%}#customerHistoryPanel .ch-toolbar select{flex:1 1 40%}#customerHistoryPanel .ch-timeline{margin-left:9px;padding-left:21px}#customerHistoryPanel .ch-event:before{left:-29px}#customerHistoryPanel .ch-event summary{padding:11px}#customerHistoryPanel .ch-event-title{font-size:12px}#customerHistoryPanel .ch-form-actions .ch-button{flex:1}}'
 ].join('');document.head.appendChild(style);
}
function eventHtml(e){
 return '<article class="ch-event" data-category="'+esc(e.kind)+'"><details><summary><span><span class="ch-event-date">'+esc(eventDate(e))+(clock(e.time)?' · '+esc(clock(e.time)):'')+'</span><span class="ch-event-title" style="display:block">'+esc(e.title)+'</span>'+(e.summary?'<span class="ch-summary" style="display:block">'+esc(e.summary)+'</span>':'')+'</span><span class="ch-arrow" aria-hidden="true">⌄</span></summary><div class="ch-details">'+e.details.map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'<p class="ch-result">Source: '+esc(e.source==='task'?'Completed CRM task':e.source==='manual'?'Manual entry':'CRM '+label(e.source))+(e.meta?' · '+esc(e.meta):'')+'</p></div></details></article>';
}
function filter(panel,events){
 var term=text(panel.querySelector('#chSearch').value).toLowerCase(),kind=panel.querySelector('#chCategory').value;
 var filtered=events.filter(function(e){return(kind==='all'||e.kind===kind)&&(!term||(e.title+' '+e.summary+' '+e.details.join(' ')).toLowerCase().includes(term));});
 var host=panel.querySelector('#chRecords');host.innerHTML=filtered.length?filtered.map(eventHtml).join(''):'<p class="ch-empty">No matching activities recorded.</p>';
 panel.querySelector('#chCount').textContent=filtered.length+' activities · Booking to current';
}
function manualForm(panel,c,refresh){
 var host=panel.querySelector('#chFormArea');
 if(host.innerHTML){host.innerHTML='';return;}
 host.innerHTML='<form class="ch-form" id="chManualForm"><strong>Add Missing Activity</strong><p class="ch-sub">For phone calls, meetings or past events not captured automatically.</p>'+
  '<label for="chManualTitle">What happened? *</label><input id="chManualTitle" maxlength="160" placeholder="e.g. Customer called about 1st installment" required>'+
  '<label for="chManualDate">Actual activity date *</label><input id="chManualDate" type="date" required>'+
  '<label for="chManualCategory">Category</label><select id="chManualCategory"><option value="communication">Communication</option><option value="payment">Payment discussion</option><option value="spa">SPA / Booking</option><option value="extension">Extension</option><option value="credit">Credit Note</option><option value="dld">DLD / Oqood</option><option value="handover">Handover</option><option value="other">Other</option></select>'+
  '<label for="chManualDetails">What happened and what was the result? *</label><textarea id="chManualDetails" maxlength="5000" placeholder="Short factual explanation" required></textarea>'+
  '<label for="chManualEvidence">Document or email reference (optional)</label><input id="chManualEvidence" maxlength="400" placeholder="Reference only — no automatic email sending">'+
  '<p id="chManualError" class="ch-sub" role="alert"></p>'+
  '<div class="ch-form-actions"><button class="ch-button ch-primary" type="submit" id="chManualSave">Save Activity</button><button type="button" class="ch-button" id="chManualCancel">Cancel</button></div></form>';
 host.querySelector('#chManualCancel').onclick=function(){host.innerHTML='';};
 host.querySelector('#chManualForm').onsubmit=async function(ev){
  ev.preventDefault();
  var save=host.querySelector('#chManualSave'),err=host.querySelector('#chManualError');
  var title=text(host.querySelector('#chManualTitle').value),when=text(host.querySelector('#chManualDate').value),details=text(host.querySelector('#chManualDetails').value);
  if(title.length<3||!when||details.length<3){err.textContent='Please enter the activity, date and explanation.';return;}
  if(window.__crmTestMode&&window.__crmTestMode.active){err.textContent='Use live customer mode to record historical activities. Demo records are not stored here.';return;}
  save.disabled=true;save.textContent='Saving…';err.textContent='';
  try{
   var customerId=Number(c.customerId||c.customer_id||c.info&&c.info.customerId||0);
   if(!customerId){var lookup=await sb.from('units').select('customer_id').eq('id',Number(c.sno)).single();if(lookup.error)throw lookup.error;customerId=Number(lookup.data.customer_id);}
   if(!customerId)throw new Error('Customer ID could not be verified.');
   var user=await sb.auth.getUser();if(user.error||!user.data||!user.data.user)throw new Error('Login verification required.');
   var result=await sb.from('crm_history_manual_events').insert({
    customer_id:customerId,unit_id:Number(c.sno),event_date:when,
    title:title,details:details,category:host.querySelector('#chManualCategory').value,
    evidence_reference:text(host.querySelector('#chManualEvidence').value)||null,
    recorded_by:user.data.user.id,source:'manual'
   }).select('id').single();
   if(result.error)throw result.error;
   host.innerHTML='';await refresh();
  }catch(e){err.textContent='Could not save activity: '+(e.message||'Please try again.');}
  finally{if(save.isConnected){save.disabled=false;save.textContent='Save Activity';}}
 };
 host.querySelector('#chManualTitle').focus();
}
async function open(){
 var c=current();if(!allowed()||!c)return;
 close();styles();var version=++openVersion;
 var menu=document.getElementById('customerActionMenu');if(menu)menu.style.display='none';
 var mb=document.getElementById('customerActionMenuButton');if(mb)mb.setAttribute('aria-expanded','false');
 document.body.classList.add('customer-history-open');
 var panel=document.createElement('section');panel.id='customerHistoryPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Customer History');
 panel.innerHTML='<div class="ch-shell"><div class="ch-head"><div><h2>Customer History</h2><p class="ch-sub">'+esc(c.name)+' · '+esc(c.unit)+' · '+esc(c.info&&c.info.project||'Sunbliss Residences')+'</p></div><button type="button" class="ch-button" id="chBack">Back</button></div>'+
  '<div class="ch-toolbar"><input type="search" id="chSearch" placeholder="Search activities" aria-label="Search customer history"><select id="chCategory" aria-label="Filter activity">'+Object.keys(categories).map(function(k){return '<option value="'+k+'">'+esc(categories[k])+'</option>';}).join('')+'</select><button type="button" class="ch-button" id="chAdd">+ Add</button></div>'+
  '<div id="chFormArea"></div><p id="chCount" class="ch-caption">Loading history…</p><div id="chNotice"></div><div class="ch-timeline" id="chRecords" aria-live="polite"><p class="ch-empty">Loading activities…</p></div></div>';
 document.body.appendChild(panel);panel.querySelector('#chBack').onclick=close;
 var all=[];
 async function refresh(){
  var host=panel.querySelector('#chRecords');host.innerHTML='<p class="ch-empty">Loading activities…</p>';
  try{
   var result=await collect(c);if(!panel.isConnected||version!==openVersion)return;
   all=result.events;
   panel.querySelector('#chNotice').innerHTML=result.errors.length?'<p class="ch-warn">Some history sources could not be loaded. The timeline may be incomplete. Please retry or contact your CRM administrator.</p>':'';
   filter(panel,all);
  }catch(e){if(!panel.isConnected||version!==openVersion)return;host.innerHTML='<p class="ch-warn">Could not load customer history. Please reopen and try again.</p>';}
 }
 panel.querySelector('#chSearch').oninput=function(){filter(panel,all);};
 panel.querySelector('#chCategory').onchange=function(){filter(panel,all);};
 panel.querySelector('#chAdd').onclick=function(){manualForm(panel,c,refresh);};
 await refresh();
}
function menu(){
 if(!allowed()||state.view!=='detail')return;
 var m=document.getElementById('customerActionMenu');if(!m)return;
 if(m.querySelector('#actionCustomerHistory'))return;
 var b=document.createElement('button');b.type='button';b.id='actionCustomerHistory';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink);cursor:pointer';
 b.textContent='Customer History';b.onclick=function(e){e.preventDefault();e.stopPropagation();open();};m.appendChild(b);
}
new MutationObserver(menu).observe(document.body,{childList:true,subtree:true});menu();
window.__sunblissOpenCustomerHistory=open;
})();