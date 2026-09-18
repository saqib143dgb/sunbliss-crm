(function(){
'use strict';
if(window.__sunblissPaymentPlanRevisionUIInstalled)return;
window.__sunblissPaymentPlanRevisionUIInstalled=true;

var panelState={mode:'single',selected:{},data:null,customer:null,busy:false};
var TOLERANCE=1000;

function text(v){return v==null?'':String(v)}
function safe(v){return typeof window.esc==='function'?window.esc(text(v)):text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function round2(v){return Math.round(num(v)*100)/100}
function money(v){return typeof window.fmtAED==='function'?window.fmtAED(num(v)):'AED '+num(v).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})}
function iso(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function dateLabel(v){var s=iso(v);if(!s)return 'No date';var d=new Date(s+'T00:00:00');return isNaN(d.getTime())?s:d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function allowed(){return !!(window.state&&(state.userRole==='crm_officer'||state.userRole==='manager'))}
function currentCustomer(){
  if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
  return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null;
}
function closeMenu(){
  var m=document.getElementById('customerActionMenu'),b=document.getElementById('customerActionMenuButton');
  if(m)m.style.display='none';if(b)b.setAttribute('aria-expanded','false');
}
function effectiveAmount(r){return r&&r.revised_due_amount!==null&&r.revised_due_amount!==undefined&&text(r.revised_due_amount)!==''?num(r.revised_due_amount):num(r&&r.due_amount)}
function effectiveDate(r){return iso(r&&r.revised_due_date)||iso(r&&r.due_date)}
function propertyRow(r){
  var n=text(r&&r.stage_name).toLowerCase();
  if(!n||/booking|\bdld\b|admin\s*fee|registration\s*fee/.test(n))return false;
  return num(r&&r.due_amount)>0;
}
function remaining(r,credits){
  return Math.max(0,round2(effectiveAmount(r)-num(r&&r.paid_amount)-num(credits&&credits[r.id])));
}
function sortRows(a,b){
  var ad=effectiveDate(a),bd=effectiveDate(b);
  if(ad&&bd&&ad!==bd)return ad.localeCompare(bd);
  if(ad&&!bd)return -1;if(!ad&&bd)return 1;
  return num(a.id)-num(b.id);
}

function styles(){
  if(document.getElementById('paymentPlanRevisionStyles'))return;
  var s=document.createElement('style');s.id='paymentPlanRevisionStyles';
  s.textContent=[
    'body.rpp-open{overflow:hidden!important}',
    '.rpp-panel{position:fixed;inset:0;z-index:12650;height:100dvh;box-sizing:border-box;overflow:auto;-webkit-overflow-scrolling:touch;background:var(--paper,#F6F1E4);padding:calc(18px + env(safe-area-inset-top)) 16px calc(100px + env(safe-area-inset-bottom))}',
    '.rpp-shell{width:min(760px,100%);margin:auto}',
    '.rpp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}',
    '.rpp-kicker{font:700 10px IBM Plex Mono,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-deep,#8F6A1E)}',
    '.rpp-title{margin:4px 0 2px;font:700 23px/1.15 Fraunces,serif;color:var(--ink)}',
    '.rpp-sub{margin:0;font-size:11.5px;line-height:1.45;color:var(--muted)}',
    '.rpp-warning{border:1px solid rgba(198,151,46,.35);border-radius:11px;padding:10px 12px;background:rgba(198,151,46,.08);font-size:11.5px;line-height:1.45;color:var(--ink);margin-bottom:12px}',
    '.rpp-mode{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px}',
    '.rpp-mode button{min-height:42px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper);color:var(--ink);font:700 12px Inter,sans-serif}',
    '.rpp-mode button.active{background:var(--ink);color:var(--paper);border-color:var(--ink)}',
    '.rpp-section{margin-top:15px}',
    '.rpp-section-title{font:700 10.5px IBM Plex Mono,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}',
    '.rpp-list{display:grid;gap:9px}',
    '.rpp-card{border:1px solid var(--paper-line);border-radius:13px;background:var(--paper);padding:12px}',
    '.rpp-card.selected{border-color:rgba(198,151,46,.8);box-shadow:0 0 0 1px rgba(198,151,46,.18) inset}',
    '.rpp-card-head{display:flex;align-items:flex-start;gap:10px}',
    '.rpp-select{width:19px;height:19px;margin:1px 0 0;accent-color:var(--gold-deep,#8F6A1E);flex:none}',
    '.rpp-stage{font:750 13.5px/1.3 Inter,sans-serif;color:var(--ink)}',
    '.rpp-meta{font-size:10.8px;line-height:1.45;color:var(--muted);margin-top:3px}',
    '.rpp-current{margin-top:5px;font-size:10.8px;line-height:1.4;color:var(--amber,#9C5A12);font-weight:650}',
    '.rpp-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}',
    '.rpp-field{display:block;font:650 10.5px/1.3 Inter,sans-serif;color:var(--muted)}',
    '.rpp-field input,.rpp-field textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);padding:10px 11px;font:500 16px/1.2 Inter,sans-serif;outline:none}',
    '.rpp-card:not(.selected) .rpp-fields{opacity:.48;pointer-events:none}',
    '.rpp-approval{border:1px solid var(--paper-line);border-radius:13px;background:var(--paper-dim);padding:12px}',
    '.rpp-approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
    '.rpp-approval .rpp-field{margin-bottom:9px}',
    '.rpp-approval textarea{min-height:74px;resize:vertical}',
    '.rpp-error{display:none;margin:10px 0 0;padding:9px 10px;border-radius:8px;background:rgba(174,59,43,.08);color:var(--rust,#AE3B2B);font-size:11.5px}',
    '.rpp-history{display:grid;gap:8px}',
    '.rpp-history-batch{border:1px solid var(--paper-line);border-radius:11px;background:var(--paper);padding:10px 11px}',
    '.rpp-history-head{display:flex;justify-content:space-between;gap:10px;font-size:10.5px;color:var(--muted)}',
    '.rpp-history-ref{margin-top:3px;font-size:11px;color:var(--ink);font-weight:650}',
    '.rpp-history-item{margin-top:7px;padding-top:7px;border-top:1px solid var(--paper-line);font-size:10.8px;line-height:1.45;color:var(--muted)}',
    '.rpp-history-item b{color:var(--ink)}',
    '.rpp-empty{border:1px dashed var(--paper-line);border-radius:11px;padding:14px;color:var(--muted);font-size:11.5px}',
    '.rpp-actions{position:sticky;bottom:calc(-100px - env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr auto;gap:8px;margin:16px -16px -100px;padding:12px 16px calc(112px + env(safe-area-inset-bottom));background:linear-gradient(to top,var(--paper,#F6F1E4) 76%,rgba(246,241,228,.94));border-top:1px solid var(--paper-line);box-shadow:0 -8px 24px rgba(15,26,38,.08)}',
    '.rpp-actions button{margin:0!important;justify-content:center}',
    '@media(max-width:520px){.rpp-fields,.rpp-approval-grid{grid-template-columns:1fr}.rpp-actions{grid-template-columns:1fr}.rpp-head .btn-paper{min-width:auto}}'
  ].join('');
  document.head.appendChild(s);
}

function ensureMenuItem(){
  if(!allowed()||!window.state||state.view!=='detail')return;
  var menu=document.getElementById('customerActionMenu');
  if(!menu||document.getElementById('actionRevisePaymentPlan'))return;
  var b=document.createElement('button');
  b.type='button';b.id='actionRevisePaymentPlan';b.textContent='Revise Payment Plan';
  b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
  var ext=document.getElementById('actionPaymentExtension')||document.getElementById('actionEditPaymentDetail');
  if(ext&&ext.parentNode===menu)ext.insertAdjacentElement('afterend',b);else menu.appendChild(b);
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openPanel()});
}

async function loadData(c){
  var q=await Promise.all([
    sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,revised_due_amount,due_date,revised_due_date,paid_amount,paid_date,status,revision_approved_on,revision_approved_by,revision_reference,revision_reason').eq('unit_id',c.sno),
    sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',c.sno),
    sb.from('payment_schedule_revision_history').select('*').eq('unit_id',c.sno).order('created_at',{ascending:false}).limit(80)
  ]);
  q.forEach(function(r){if(r.error)throw r.error});
  var credits={};(q[1].data||[]).forEach(function(x){credits[x.payment_schedule_id]=round2((credits[x.payment_schedule_id]||0)+num(x.amount))});
  var rows=(q[0].data||[]).filter(propertyRow).filter(function(r){return remaining(r,credits)>TOLERANCE}).sort(sortRows);
  return {rows:rows,credits:credits,history:q[2].data||[]};
}

function currentRevisionText(r){
  var parts=[];
  if(r.revised_due_amount!==null&&r.revised_due_amount!==undefined&&Math.abs(num(r.revised_due_amount)-num(r.due_amount))>.004)parts.push(money(r.revised_due_amount));
  if(iso(r.revised_due_date)&&iso(r.revised_due_date)!==iso(r.due_date))parts.push(dateLabel(r.revised_due_date));
  return parts.length?'Current revision: '+parts.join(' · '):'';
}

function installmentCard(r,index){
  var selected=!!panelState.selected[r.id];
  var inputType=panelState.mode==='single'?'radio':'checkbox';
  var dueValue=iso(r.revised_due_date)||iso(r.due_date);
  var amountValue=r.revised_due_amount!==null&&r.revised_due_amount!==undefined?round2(r.revised_due_amount):round2(r.due_amount);
  var credit=panelState.data.credits[r.id]||0;
  var settled=round2(num(r.paid_amount)+credit);
  var current=currentRevisionText(r);
  return '<div class="rpp-card'+(selected?' selected':'')+'" data-rpp-card="'+r.id+'">'+
    '<div class="rpp-card-head"><input class="rpp-select" type="'+inputType+'" name="rppSelection" data-rpp-select="'+r.id+'" '+(selected?'checked':'')+'>'+
      '<div><div class="rpp-stage">'+safe(r.stage_name)+'</div>'+
      '<div class="rpp-meta">Original: '+safe(money(r.due_amount))+' · '+safe(dateLabel(r.due_date))+' · Settled '+safe(money(settled))+'</div>'+
      (current?'<div class="rpp-current">'+safe(current)+'</div>':'')+
    '</div></div>'+
    '<div class="rpp-fields">'+
      '<label class="rpp-field">Revised due date<input type="date" data-rpp-date="'+r.id+'" value="'+safe(dueValue)+'"></label>'+
      '<label class="rpp-field">Revised amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" data-rpp-amount="'+r.id+'" value="'+safe(amountValue)+'"></label>'+
    '</div>'+
  '</div>';
}

function historyHtml(){
  var rows=panelState.data&&panelState.data.history||[];
  if(!rows.length)return '<div class="rpp-empty">No previous payment-plan revisions for this customer.</div>';
  var groups={},order=[];
  rows.forEach(function(r){var k=text(r.revision_batch_id)||('row-'+r.id);if(!groups[k]){groups[k]=[];order.push(k)}groups[k].push(r)});
  return order.map(function(k){
    var items=groups[k],h=items[0],meta=dateLabel(h.approved_on)+' · '+safe(h.approved_by||'Management');
    var ref=h.approval_reference?'<div class="rpp-history-ref">'+safe(h.approval_reference)+'</div>':'';
    var reason=h.reason?'<div class="rpp-meta">'+safe(h.reason)+'</div>':'';
    return '<div class="rpp-history-batch"><div class="rpp-history-head"><span>'+meta+'</span><span>'+safe(dateLabel(text(h.created_at).slice(0,10)))+'</span></div>'+ref+reason+
      items.map(function(x){
        var oldAmount=x.previous_revised_due_amount!==null&&x.previous_revised_due_amount!==undefined?x.previous_revised_due_amount:x.contractual_due_amount;
        var newAmount=x.new_revised_due_amount!==null&&x.new_revised_due_amount!==undefined?x.new_revised_due_amount:x.contractual_due_amount;
        var oldDate=x.previous_revised_due_date||x.contractual_due_date,newDate=x.new_revised_due_date||x.contractual_due_date;
        return '<div class="rpp-history-item"><b>'+safe(x.stage_name)+'</b><br>'+safe(money(oldAmount))+' → '+safe(money(newAmount))+' · '+safe(dateLabel(oldDate))+' → '+safe(dateLabel(newDate))+'</div>';
      }).join('')+'</div>';
  }).join('');
}

function renderPanel(){
  var p=document.getElementById('paymentPlanRevisionPanel');if(!p||!panelState.data||!panelState.customer)return;
  var c=panelState.customer,rows=panelState.data.rows;
  var shell=p.querySelector('.rpp-shell');
  shell.innerHTML=
    '<div class="rpp-head"><div><div class="rpp-kicker">Payment Plan Revision</div><h2 class="rpp-title">Unit '+safe(c.unit)+'</h2><p class="rpp-sub">'+safe(c.name)+' · contractual dates and amounts remain preserved.</p></div><button type="button" class="btn-paper" id="rppClose">Close</button></div>'+
    '<div class="rpp-warning"><b>Management approval required.</b> Use this for an approved change to the payment plan. For extra time only, use Payment Extension instead. If installment amounts change, adjust the other revised installment(s) so the total property payment schedule stays unchanged.</div>'+
    '<div class="rpp-mode"><button type="button" data-rpp-mode="single" class="'+(panelState.mode==='single'?'active':'')+'">Single Installment</button><button type="button" data-rpp-mode="multiple" class="'+(panelState.mode==='multiple'?'active':'')+'">Multiple Installments</button></div>'+
    '<div class="rpp-section"><p class="rpp-section-title">Installments to revise</p><div class="rpp-list">'+(rows.length?rows.map(installmentCard).join(''):'<div class="rpp-empty">No unpaid property installment is available for revision.</div>')+'</div></div>'+
    '<div class="rpp-section"><p class="rpp-section-title">Approval details</p><div class="rpp-approval">'+
      '<div class="rpp-approval-grid"><label class="rpp-field">Approved on<input type="date" id="rppApprovedOn" value="'+today()+'"></label><label class="rpp-field">Approved by<input id="rppApprovedBy" value="Management" maxlength="120"></label></div>'+
      '<label class="rpp-field">Approval reference<input id="rppReference" maxlength="250" placeholder="e.g. CRM email dated 18-Sep-2026"></label>'+
      '<label class="rpp-field">Reason / conditions<textarea id="rppReason" placeholder="Reason for the approved revision"></textarea></label>'+
      '<div class="rpp-error" id="rppError"></div>'+
    '</div></div>'+
    '<div class="rpp-section"><p class="rpp-section-title">Revision history</p><div class="rpp-history">'+historyHtml()+'</div></div>'+
    '<div class="rpp-actions"><button type="button" class="btn btn-gold" id="rppSave" '+(!rows.length?'disabled':'')+'>Save Revision</button><button type="button" class="btn-paper" id="rppCancel">Cancel</button></div>';

  document.getElementById('rppClose').onclick=closePanel;
  document.getElementById('rppCancel').onclick=closePanel;
  shell.querySelectorAll('[data-rpp-mode]').forEach(function(b){b.onclick=function(){setMode(b.getAttribute('data-rpp-mode'))}});
  shell.querySelectorAll('[data-rpp-select]').forEach(function(inp){inp.onchange=function(){toggleSelection(Number(inp.getAttribute('data-rpp-select')),inp.checked)}});
  var save=document.getElementById('rppSave');if(save)save.onclick=saveRevision;
}

function setMode(mode){
  panelState.mode=mode==='multiple'?'multiple':'single';
  var ids=Object.keys(panelState.selected).filter(function(k){return panelState.selected[k]});
  if(panelState.mode==='single'&&ids.length>1){
    var keep=ids[0],next={};next[keep]=true;panelState.selected=next;
  }
  if(panelState.mode==='single'&&!Object.keys(panelState.selected).length&&panelState.data.rows[0])panelState.selected[panelState.data.rows[0].id]=true;
  renderPanel();
}

function toggleSelection(id,checked){
  if(panelState.mode==='single'){
    panelState.selected={};if(checked)panelState.selected[id]=true;
  }else{
    if(checked)panelState.selected[id]=true;else delete panelState.selected[id];
  }
  renderPanel();
}

function closePanel(){
  document.body.classList.remove('rpp-open');
  var p=document.getElementById('paymentPlanRevisionPanel');if(p)p.remove();
  panelState.busy=false;
}

async function openPanel(){
  closeMenu();styles();var c=currentCustomer();if(!c||!allowed())return;
  closePanel();panelState.customer=c;panelState.data=null;panelState.selected={};panelState.mode='single';
  document.body.classList.add('rpp-open');
  var p=document.createElement('div');p.id='paymentPlanRevisionPanel';p.className='rpp-panel';
  p.innerHTML='<div class="rpp-shell"><div class="rpp-head"><div><div class="rpp-kicker">Payment Plan Revision</div><h2 class="rpp-title">Unit '+safe(c.unit)+'</h2></div><button type="button" class="btn-paper" id="rppClose">Close</button></div><div class="rpp-empty">Loading payment schedule…</div></div>';
  document.body.appendChild(p);
  document.getElementById('rppClose').onclick=closePanel;
  try{
    panelState.data=await loadData(c);
    if(panelState.data.rows[0])panelState.selected[panelState.data.rows[0].id]=true;
    renderPanel();
  }catch(e){
    var sh=p.querySelector('.rpp-shell');if(sh)sh.innerHTML='<div class="rpp-head"><div><div class="rpp-kicker">Payment Plan Revision</div><h2 class="rpp-title">Unit '+safe(c.unit)+'</h2></div><button type="button" class="btn-paper" id="rppClose">Close</button></div><div class="rpp-empty">Could not load the revision workflow. '+safe(e&&e.message?e.message:'')+'</div>';
    var close=document.getElementById('rppClose');if(close)close.onclick=closePanel;
  }
}

function fieldValue(selector,id){var el=document.querySelector(selector+'="'+id+'"]');return el?text(el.value).trim():''}
function showError(msg){var e=document.getElementById('rppError');if(e){e.textContent=msg;e.style.display='block';e.scrollIntoView({behavior:'smooth',block:'center'})}}

async function saveRevision(){
  if(panelState.busy)return;
  var ids=Object.keys(panelState.selected).filter(function(k){return panelState.selected[k]});
  if(!ids.length){showError('Select at least one installment.');return}
  var approvedOn=text(document.getElementById('rppApprovedOn')&&document.getElementById('rppApprovedOn').value).trim();
  var approvedBy=text(document.getElementById('rppApprovedBy')&&document.getElementById('rppApprovedBy').value).trim();
  var reference=text(document.getElementById('rppReference')&&document.getElementById('rppReference').value).trim();
  var reason=text(document.getElementById('rppReason')&&document.getElementById('rppReason').value).trim();
  if(!approvedOn){showError('Enter the management approval date.');return}
  if(!approvedBy){showError('Enter who approved the revision.');return}
  if(!reference&&!reason){showError('Enter an approval reference or revision reason.');return}

  var revisions=[],changed=false;
  ids.forEach(function(idText){
    var id=Number(idText),row=panelState.data.rows.find(function(r){return Number(r.id)===id});
    if(!row)return;
    var dateEl=document.querySelector('[data-rpp-date="'+id+'"]'),amountEl=document.querySelector('[data-rpp-amount="'+id+'"]');
    var revisedDate=dateEl?text(dateEl.value).trim():'',amount=amountEl?text(amountEl.value).trim():'';
    if(!revisedDate&&!amount)return;
    var targetAmount=amount===''?null:Number(amount);
    if(targetAmount!==null&&(!isFinite(targetAmount)||targetAmount<=0))return;
    var currentDate=iso(row.revised_due_date)||iso(row.due_date),currentAmount=effectiveAmount(row);
    if(revisedDate!==currentDate||(targetAmount!==null&&Math.abs(targetAmount-currentAmount)>.004))changed=true;
    revisions.push({schedule_id:id,revised_due_date:revisedDate,revised_due_amount:targetAmount});
  });
  if(!revisions.length){showError('Enter a revised date or amount.');return}
  if(!changed){showError('The selected values are the same as the current payment plan.');return}

  var save=document.getElementById('rppSave'),key=state.selectedUnit,from=state.detailFrom||'list';
  panelState.busy=true;if(save){save.disabled=true;save.textContent='Saving…'}
  var err=document.getElementById('rppError');if(err)err.style.display='none';
  try{
    var result=await sb.rpc('crm_revise_payment_plan',{
      p_unit_id:panelState.customer.sno,
      p_revisions:revisions,
      p_approved_on:approvedOn,
      p_approved_by:approvedBy,
      p_approval_reference:reference||null,
      p_reason:reason||null
    });
    if(result.error)throw result.error;
    closePanel();
    if(typeof window.loadFromSupabase==='function')await window.loadFromSupabase();
    state.selectedUnit=key;state.detailFrom=from;state.view='detail';
    if(typeof window.renderMain==='function')window.renderMain();else if(typeof window.renderDetail==='function')window.renderDetail();
    if(typeof window.__sunblissRefreshPaymentScheduleSourceTruth==='function')await window.__sunblissRefreshPaymentScheduleSourceTruth();
    if(typeof window.toast==='function')window.toast('Payment plan revised');
  }catch(e){
    panelState.busy=false;if(save){save.disabled=false;save.textContent='Save Revision'}
    showError(e&&e.message?e.message:'Could not save the payment-plan revision.');
  }
}

function refresh(){styles();ensureMenuItem()}
function install(){
  if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,60);return}
  var rd=window.renderDetail;
  if(!rd.__paymentPlanRevisionUi){
    var wrapped=function(){var out=rd.apply(this,arguments);setTimeout(refresh,0);return out};
    wrapped.__paymentPlanRevisionUi=true;window.renderDetail=wrapped;
  }
  var rm=window.renderMain;
  if(typeof rm==='function'&&!rm.__paymentPlanRevisionUi){
    var wrappedMain=function(){var out=rm.apply(this,arguments);setTimeout(refresh,0);return out};
    wrappedMain.__paymentPlanRevisionUi=true;window.renderMain=wrappedMain;
  }
  if(window.MutationObserver&&document.body){
    new MutationObserver(function(){if(window.state&&state.view==='detail')ensureMenuItem()}).observe(document.body,{childList:true,subtree:true});
  }
  window.addEventListener('pageshow',refresh);
  refresh();
}
install();
})();