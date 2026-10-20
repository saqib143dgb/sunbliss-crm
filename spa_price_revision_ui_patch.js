/* Read-only SPA revision staging preview. Disabled until isolated QA is approved. */
(function(){
'use strict';
if(window.__sunblissSpaRevisionPreviewInstalled)return;
window.__sunblissSpaRevisionPreviewInstalled=true;
if(window.__sunblissEnablePriceRevisionStaging!==true)return;
var MODEL=window.SunblissPriceRevision,opened=false;
if(!MODEL)return;
function str(v){return v==null?'':String(v);}
function esc(v){return str(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function money(v){return 'AED '+(Number(v)||0).toLocaleString('en-AE',{minimumFractionDigits:0,maximumFractionDigits:2});}
function customer(){
 if(!window.state||state.view!=='detail'||!Array.isArray(state.dues))return null;
 return state.dues.find(function(c){return c&&(str(c.unit)+'::'+str(c.sno))===str(state.selectedUnit);})||null;
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
 '#spaPricePreview .spr-footer{flex:none;display:flex;gap:8px;justify-content:center;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--paper-line,#ddd5c9);background:var(--paper,#f6f1e4)}',
 '@media(max-width:560px){#spaPricePreview .spr-grid{grid-template-columns:1fr 1fr}#spaPricePreview .spr-value{font-size:14px}#spaPricePreview h2{font-size:18px}}'
 ].join('');document.head.appendChild(s);
}
function close(){
 var p=document.getElementById('spaPricePreview');if(p)p.remove();
 opened=false;
}
function card(label,value){return '<div class="spr-card"><div class="spr-label">'+esc(label)+'</div><div class="spr-value">'+esc(money(value))+'</div></div>';}
function render(x,c,doc){
 var rows=x.stages.map(function(r){return '<tr><td>'+esc(r.label)+'</td><td>'+esc(money(r.gross))+
 '</td><td>'+esc(money(r.existingIssuedCredit))+'</td><td>'+esc(money(r.approvedNewCredit))+
 '</td><td>'+esc(money(r.customerCashObligation))+'</td><td>'+esc(money(r.expectedCashOutstanding))+'</td></tr>';}).join('');
 var panel=document.getElementById('spaPricePreview');if(!panel)return;
 panel.querySelector('.spr-scroll').innerHTML='<div class="spr-shell">'+
 '<div class="spr-grid">'+card('Latest signed SPA',x.spaPrice)+card('Approved commercial price',x.commercialPrice)+
 card('Additional credit approved',x.additionalApprovedCredit)+card('Additional credit pending issuance',x.pendingNewCredit)+
 card('Net property cash obligation',x.totalCashObligation)+card('Expected remaining cash',x.expectedCashOutstanding)+
 card('Additional DLD payable',doc.additionalCashDue)+card('Accounting-unsettled property balance',x.accountingOutstanding)+'</div>'+
 '<section class="spr-card"><h3 class="spr-section">Installment Reconciliation</h3>'+
 '<div class="spr-table"><table><thead><tr><th>Installment</th><th>SPA Gross</th><th>Existing CN</th><th>Approved New CN</th><th>Cash Obligation</th><th>Cash Remaining</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
 '<section class="spr-card"><h3 class="spr-section">DLD & Administrative Fees</h3>'+
 '<div class="spr-grid">'+card('DLD on revised SPA',doc.dldAmount)+card('Admin fees',doc.adminFees)+card('Recorded DLD cash',doc.cashPaid)+card('Existing DLD credit note',doc.existingIssuedCredit)+'</div></section>'+
 '<div class="spr-warning">Read-only staging preview. Approved but unissued credits affect expected collections, not issued-credit or settled-accounting totals. Signed SPA and approval documents require verification before production activation.</div></div>';
}
async function load(c){
 var panel=document.getElementById('spaPricePreview');
 try{
  if(!window.sb)throw Error('CRM connection unavailable');
  var q=await Promise.all([
   sb.from('spa_price_revisions').select('*').eq('unit_id',Number(c.sno)).eq('is_current',true).limit(1),
   sb.from('payment_schedule').select('id,unit_id,stage_name,paid_amount,due_amount').eq('unit_id',Number(c.sno)),
   sb.from('credit_notes').select('id,payment_schedule_id,amount').eq('unit_id',Number(c.sno))
  ]);
  for(var i=0;i<q.length;i++)if(q[i].error)throw q[i].error;
  var rev=(q[0].data||[])[0];if(!rev)throw Error('No signed price-revision record exists for this unit.');
  var aq=await sb.from('spa_credit_allocations').select('*').eq('revision_id',rev.id);
  if(aq.error)throw aq.error;
  var allocations=(aq.data||[]).filter(function(a){return a.status!=='cancelled';});
  if(!allocations.length)throw Error('Approved installment-credit allocations are not configured.');
  var allSchedules=q[1].data||[],credits=q[2].data||[];
  var linked=new Set(allocations.filter(function(a){return a.credit_note_id!=null;}).map(function(a){return Number(a.credit_note_id);}));
  var stages=allocations.map(function(a){
   var schedule=allSchedules.find(function(s){return Number(s.id)===Number(a.payment_schedule_id);});
   if(!schedule)throw Error('Orphaned installment allocation '+a.id);
   return {id:schedule.id,label:schedule.stage_name,grossAmount:Number(a.spa_gross_amount),
    cashPaid:Number(schedule.paid_amount)||0,
    existingIssuedCredit:credits.filter(function(n){return Number(n.payment_schedule_id)===Number(schedule.id)&&!linked.has(Number(n.id));})
      .reduce(function(n,r){return n+Number(r.amount||0);},0),
    approvedNewCredit:Number(a.approved_amount),newIssuedCredit:a.status==='issued'?Number(a.approved_amount):0};
  }).sort(function(a,b){
   function rank(s){var n=s.label.toLowerCase();if(n.indexOf('down')>=0)return 0;if(n.indexOf('final')>=0||n.indexOf('handover')>=0)return 99;var m=n.match(/(\d+)(st|nd|rd|th)/);return m?Number(m[1]):90;}
   return rank(a)-rank(b);
  });
  var model=MODEL.summarize({spaPrice:Number(rev.spa_price),commercialPrice:Number(rev.commercial_price_snapshot),stages:stages});
  var dldSchedule=allSchedules.find(function(s){return /dld|admin fees/i.test(str(s.stage_name));});
  var dldCredit=dldSchedule?credits.filter(function(n){return Number(n.payment_schedule_id)===Number(dldSchedule.id);}).reduce(function(n,r){return n+Number(r.amount||0);},0):0;
  var dld=MODEL.dld({spaPrice:Number(rev.spa_price),ratePercent:Number(rev.dld_rate_percent),adminFees:Number(rev.dld_admin_fees),cashPaid:dldSchedule?Number(dldSchedule.paid_amount)||0:0,existingIssuedCredit:dldCredit});
  render(model,c,dld);
 }catch(e){if(panel)panel.querySelector('.spr-scroll').innerHTML='<div class="spr-shell"><div class="spr-card">Preview unavailable: '+esc(e&&e.message||e)+'</div></div>';}
}
function open(){
 if(opened)return;var c=customer();if(!c)return;opened=true;style();
 var p=document.createElement('div');p.id='spaPricePreview';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');
 p.innerHTML='<div class="spr-head"><button type="button" id="sprBack" aria-label="Back to customer">‹ Back</button><div><h2>Price Revision & Settlement</h2><div class="spr-context">Unit '+esc(c.unit)+' · '+esc(c.name)+'</div></div></div><div class="spr-scroll"><div class="spr-card">Loading approved price revision…</div></div><div class="spr-footer"><button type="button" id="sprClose">Close</button></div>';
 document.body.appendChild(p);
 p.querySelector('#sprBack').onclick=close;p.querySelector('#sprClose').onclick=close;
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