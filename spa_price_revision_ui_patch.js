/* Live SPA credit overview with per-stage, user-confirmed atomic issuance. */
(function(){
'use strict';
if(window.__sunblissSpaRevisionPreviewInstalled)return;
window.__sunblissSpaRevisionPreviewInstalled=true;
var MODEL=window.SunblissPriceRevision,opened=false,issuing=false,latestReadiness=[];
if(!MODEL)return;
function str(v){return v==null?'':String(v);}
function esc(v){return str(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function money(v){return 'AED '+(Number(v)||0).toLocaleString('en-AE',{minimumFractionDigits:0,maximumFractionDigits:2});}
function customer(){
 if(!window.state||state.view!=='detail'||!Array.isArray(state.dues))return null;
 return state.dues.find(function(c){return c&&str(c.unit).trim().toUpperCase()==='B2-703'&&(str(c.unit)+'::'+str(c.sno))===str(state.selectedUnit);})||null;
}
function style(){
 if(document.getElementById('spaPricePreviewStyle'))return;
 var s=document.createElement('style');s.id='spaPricePreviewStyle';
 s.textContent=[
 '#spaPricePreview{position:fixed;inset:0;z-index:32000;background:var(--paper,#f6f1e4);color:var(--ink,#142436);font-family:CRMInter,Inter,Arial,sans-serif;display:flex;flex-direction:column}',
 '#spaPricePreview *{box-sizing:border-box}',
 '#spaPricePreview .spr-head{flex:none;padding:calc(15px + env(safe-area-inset-top)) 16px 14px;border-bottom:1px solid var(--paper-line,#ddd5c9);display:flex;align-items:center;gap:12px}',
 '#spaPricePreview h2{margin:0;font:700 22px/1.25 CRMInter,Inter,Arial,sans-serif}',
 '#spaPricePreview .spr-context{font-size:11px;color:var(--muted,#627080);margin-top:4px}',
 '#spaPricePreview button{font:600 12px CRMInter,Inter,sans-serif;border:1px solid var(--paper-line,#ddd5c9);background:var(--paper-dim,#eee8dc);color:var(--ink,#142436);border-radius:999px;padding:10px 16px;cursor:pointer}',
 '#spaPricePreview .spr-scroll{flex:1;overflow:auto;min-height:0;padding:16px}',
 '#spaPricePreview .spr-shell{max-width:770px;margin:0 auto;display:grid;gap:14px}',
 '#spaPricePreview .spr-card{background:var(--paper,#f6f1e4);border:1px solid var(--paper-line,#ddd5c9);border-radius:12px;padding:14px}',
 '#spaPricePreview .spr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
 '#spaPricePreview .spr-label{font-size:11px;color:var(--muted,#627080)}',
 '#spaPricePreview .spr-value{font-size:17px;font-weight:700;overflow-wrap:anywhere;margin-top:5px}',
 '#spaPricePreview .spr-section{font-size:14px;font-weight:700;margin:0 0 12px}',
 '#spaPricePreview table{width:100%;border-collapse:collapse;font-size:11px;min-width:550px}',
 '#spaPricePreview th,#spaPricePreview td{padding:10px 7px;text-align:right;border-bottom:1px solid var(--paper-line,#ddd5c9);white-space:nowrap}',
 '#spaPricePreview th:first-child,#spaPricePreview td:first-child{text-align:left}',
 '#spaPricePreview .spr-table{overflow-x:auto}',
 '#spaPricePreview .spr-warning{font-size:11px;line-height:1.5;color:var(--muted,#627080)}',
 '#spaPricePreview .spr-issuance summary{font:700 13px/1.4 CRMInter,Inter,Arial,sans-serif;cursor:pointer;list-style:none}',
 '#spaPricePreview .spr-issuance summary::-webkit-details-marker{display:none}',
 '#spaPricePreview .spr-issuance-row{display:grid;grid-template-columns:minmax(0,1.4fr) 110px minmax(0,1fr);gap:10px;padding:10px 0;border-bottom:1px solid var(--paper-line,#ddd5c9);align-items:center;font:500 11px/1.35 CRMInter,Inter,Arial,sans-serif}',
 '#spaPricePreview .spr-issuance-row:last-child{border-bottom:0}',
 '#spaPricePreview .spr-issuance-row strong{text-align:right;font-weight:650}',
 '#spaPricePreview .spr-issuance-row .spr-issue-btn{padding:6px 10px;font-size:11px;white-space:nowrap;grid-column:3}',
 '#spaPricePreview .spr-issue-btn:disabled{opacity:.5;cursor:wait}',
 '@media(max-width:540px){#spaPricePreview .spr-issuance-row{grid-template-columns:minmax(0,1fr) 100px}.spr-issuance-row span:last-child{grid-column:1/-1;color:var(--muted,#627080)}}',
 '#spaPricePreview .spr-footer{flex:none;display:flex;gap:8px;justify-content:center;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--paper-line,#ddd5c9);background:var(--paper,#f6f1e4)}',
 '@media(max-width:560px){#spaPricePreview .spr-grid{grid-template-columns:1fr 1fr}#spaPricePreview .spr-value{font-size:14px}#spaPricePreview h2{font-size:18px}}'
 ].join('');document.head.appendChild(s);
}
function close(){
 var p=document.getElementById('spaPricePreview');if(p)p.remove();
 opened=false;
}
function card(label,value){return '<div class="spr-card"><div class="spr-label">'+esc(label)+'</div><div class="spr-value">'+esc(money(value))+'</div></div>';}
function exportReconciliation(x,doc,pendingAccounts,clearance){
 var table=[['Stage','SPA Gross AED','Existing Issued Credit AED','Additional Approved Credit AED',
   'Additional Issued Credit AED','Customer Cash Payable AED','Cash Recorded AED',
   'Remaining after Recorded Cash AED','Accounting Outstanding AED']];
 x.stages.forEach(function(r){table.push([r.label,r.gross,r.existingIssuedCredit,
   r.approvedNewCredit,r.newIssuedCredit,r.customerCashObligation,r.cashPaid,
   r.expectedCashOutstanding,r.accountingOutstanding]);});
 table.push(['TOTAL',x.spaPrice,x.existingIssuedCredit,x.additionalApprovedCredit,
   x.additionalIssuedCredit,x.totalCashObligation,x.cashPaid,x.expectedCashOutstanding,
   x.accountingOutstanding]);
 table.push([]);
 table.push(['Status','Approved additional credits awaiting issuance AED',x.pendingNewCredit]);
 table.push(['Status','Second installment Accounts cleared',clearance?'Yes':'No']);
 table.push(['Status','Recorded property cash awaiting Accounts clearance AED',pendingAccounts]);
 table.push(['DLD','Additional cash payable AED',doc.additionalCashDue]);
 table.push(['Important','Approved but unissued credits are not completed settlements.']);
 function cell(v){var t=str(v);if(/^[=+@-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}
 var csv='\uFEFF'+table.map(function(row){return row.map(cell).join(',');}).join('\r\n');
 var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
 var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
 a.download='B2-703-SPA-Settlement-Reconciliation.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
function creditReadinessDetails(items){
 items=Array.isArray(items)?items:[];latestReadiness=items;
 var issued=items.filter(function(item){return item.state==='issued'}).length;
 var officer=window.state&&state.userRole==='crm_officer';
 var stages=items.map(function(item){
   var status=item.state==='issued'?'Issued':
     item.state==='awaiting_accounts'?'Awaiting Accounts':
     item.state==='awaiting_stage_payment'?'Awaiting Stage Payment':
     item.state==='ledger_preparation'?'Ledger Review':'Ready for Individual Issuance';
   var action=officer&&item.canIssue?
     '<button type="button" class="spr-issue-btn" data-allocation="'+Number(item.allocationId)+'" aria-label="Issue '+esc(item.stage)+' credit note">Issue Credit Note</button>':'';
   return '<div class="spr-issuance-row"><span>'+esc(item.stage)+'</span><strong>'+esc(money(item.approvedAmount))+
      '</strong><span>'+esc(status)+'</span>'+action+'</div>';
 }).join('');
 return '<details class="spr-card spr-issuance"><summary>Supplementary Credit Notes · '+issued+' of '+items.length+' issued</summary>'+
  '<div class="spr-warning" style="margin:9px 0">Each supplementary note is issued individually, only after Accounts confirms the relevant payment. Issuance adjusts the SPA installment and posts the matching credit together, preserving the customer cash obligation. A Send Credit Note task is created for each issued note; no email is sent automatically.</div>'+
  stages+'</details>';
}
async function issueApprovedCredit(allocationId){
 if(issuing||!window.sb||!window.state||state.userRole!=='crm_officer')return;
 var match=latestReadiness.find(function(item){return Number(item.allocationId)===Number(allocationId)});
 if(!match||!match.canIssue)return;
 var question='Issue the '+money(match.approvedAmount)+' approved supplementary credit for '+match.stage+'?\n\nThis will reconcile its SPA gross amount, issue an actual credit note and create a Send Credit Note task. Nothing will be emailed automatically.';
 if(!window.confirm(question))return;
 issuing=true;
 var panel=document.getElementById('spaPricePreview'),button=panel&&panel.querySelector('.spr-issue-btn[data-allocation="'+Number(allocationId)+'"]');
 if(button){button.disabled=true;button.textContent='Issuing…'}
 try{
   var response=await sb.rpc('crm_issue_b2703_spa_credit',{p_allocation_id:Number(allocationId)});
   if(response.error)throw response.error;
   var result=response.data||{};
   if(!result.credit_note_id)throw Error('The server did not confirm credit note creation');
   window.alert('Credit note #'+result.credit_note_id+' issued for '+match.stage+'. The Send Credit Note task has been created.');
   var c=customer();if(c)await load(c);
   if(window.__sunblissRefreshPaymentScheduleSourceTruth)window.__sunblissRefreshPaymentScheduleSourceTruth({render:false});
 }catch(err){
   window.alert('Credit note was not issued: '+String(err&&err.message||err));
   if(button){button.disabled=false;button.textContent='Issue Credit Note'}
 }finally{issuing=false}
}
function render(x,c,doc,clearance,pendingAccounts,issuanceReadiness){
 var rows=x.stages.map(function(r){return '<tr><td>'+esc(r.label)+'</td><td>'+esc(money(r.gross))+
 '</td><td>'+esc(money(r.existingIssuedCredit))+'</td><td>'+esc(money(r.approvedNewCredit))+
 '</td><td>'+esc(money(r.customerCashObligation))+'</td><td>'+esc(money(r.expectedCashOutstanding))+'</td></tr>';}).join('');
 var panel=document.getElementById('spaPricePreview');if(!panel)return;
 var exportBtn=panel.querySelector('#sprExport');if(exportBtn){exportBtn.disabled=false;exportBtn.onclick=function(){exportReconciliation(x,doc,pendingAccounts,clearance)}}
 panel.querySelector('.spr-scroll').innerHTML='<div class="spr-shell">'+
 '<section class="spr-card"><div class="spr-section">Credit-note issuance status</div><div class="spr-warning"><strong>'+esc(money(x.pendingNewCredit))+'</strong> in supplementary credits is Approved — Pending Issuance. Issued credit notes: '+esc(money(x.additionalIssuedCredit))+'. Nothing is marked sent automatically.</div><div style="margin-top:10px;font-size:12px;font-weight:650">2nd installment: '+(clearance?'Accounts confirmed.':'Payment recorded; awaiting Accounts clearance.')+'</div><div class="spr-warning">Down Payment and 1st-installment supplementary notes must not be issued until the 2nd installment is confirmed by Accounts.</div></section>'+
 creditReadinessDetails(issuanceReadiness)+
 '<div class="spr-grid">'+card('Latest signed SPA',x.spaPrice)+card('Approved commercial price',x.commercialPrice)+
 card('Additional credit approved',x.additionalApprovedCredit)+card('Additional credit pending issuance',x.pendingNewCredit)+
 card('Net property cash obligation',x.totalCashObligation)+card('Remaining after recorded cash',x.expectedCashOutstanding)+
 card('Additional DLD payable',doc.additionalCashDue)+card('Accounting-unsettled property balance',x.accountingOutstanding)+'</div>'+
 '<section class="spr-card"><h3 class="spr-section">Installment Reconciliation</h3>'+
 '<div class="spr-table"><table><thead><tr><th>Installment</th><th>SPA Gross</th><th>Existing CN</th><th>Approved New CN</th><th>Cash Obligation</th><th>Cash Remaining</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
 '<section class="spr-card"><h3 class="spr-section">DLD & Administrative Fees</h3>'+
 '<div class="spr-grid">'+card('DLD on revised SPA',doc.dldAmount)+card('Admin fees',doc.adminFees)+card('Recorded DLD cash',doc.cashPaid)+card('Existing DLD credit note',doc.existingIssuedCredit)+'</div></section>'+
 '<div class="spr-warning">Approved but unissued supplementary credits are not posted to the ledger. Any future issuance will be individually confirmed and recorded without changing existing payments or dates.</div></div>';
}
async function load(c){
 var panel=document.getElementById('spaPricePreview');
 try{
   if(!window.sb||!window.SunblissSpaReconciliation)throw Error('CRM financial data connection is unavailable');
   const record=await window.SunblissSpaReconciliation.loadForUnit(sb,Number(c.sno));
   if(!record)throw Error('Signed SPA reconciliation not found for this unit.');
   if(panel&&panel.isConnected)render(record.model,c,record.dld,record.contingentCreditsClearanceConfirmed,record.pendingAccounts,record.issuanceReadiness);
 }catch(error){
   if(panel&&panel.isConnected)panel.querySelector('.spr-scroll').innerHTML=
    '<div class="spr-shell"><div class="spr-card">Reconciliation unavailable: '+esc(error&&error.message||error)+'</div></div>';
 }
}
function open(){
 if(opened)return;var c=customer();if(!c)return;opened=true;style();
 var p=document.createElement('div');p.id='spaPricePreview';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');
 p.innerHTML='<div class="spr-head"><button type="button" id="sprBack" aria-label="Back to customer">‹ Back</button><div><h2>Price Revision & Settlement</h2><div class="spr-context">Unit '+esc(c.unit)+' · '+esc(c.name)+'</div></div></div><div class="spr-scroll"><div class="spr-card">Loading approved price revision…</div></div><div class="spr-footer"><button type="button" id="sprExport" disabled>Export Reconciliation</button><button type="button" id="sprClose">Close</button></div>';
 document.body.appendChild(p);
 p.querySelector('#sprBack').onclick=close;p.querySelector('#sprClose').onclick=close;
 p.querySelector('.spr-scroll').addEventListener('click',function(ev){
  var button=ev.target.closest&&ev.target.closest('.spr-issue-btn');
  if(!button||!p.contains(button))return;
  ev.preventDefault();issueApprovedCredit(Number(button.getAttribute('data-allocation')));
 });
 load(c);
}
function ensureMenu(){
 if(!customer())return;
 var menu=document.getElementById('customerActionMenu');
 if(!menu||document.getElementById('actionSpaPriceRevision'))return;
 var b=document.createElement('button');b.type='button';b.id='actionSpaPriceRevision';
 b.textContent='Price Revision & Settlement';
 b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 CRMInter,Inter,sans-serif;color:var(--ink);cursor:pointer';
 menu.appendChild(b);b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open();});
}
if(window.MutationObserver&&document.body)new MutationObserver(ensureMenu).observe(document.body,{childList:true,subtree:true});
ensureMenu();
})();