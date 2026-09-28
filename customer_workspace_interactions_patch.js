(function(){
'use strict';
if(window.__sunblissCustomerWorkspace)return;
var cache={},inflight={},expanded={},noteFields=['customer_note','remarks','partial_booking_note'];
var labels={customer_note:'Note',remarks:'Special Note',partial_booking_note:'Partial Booking Note'};
function text(v){return v==null?'':String(v)}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function key(){return window.state&&state.view==='detail'?text(state.selectedUnit):''}
function uid(){return Number(key().split('::')[1])||0}
function current(){return (state.dues||[]).find(function(c){return c.unit+'::'+c.sno===key()})}
function after(node,anchor){if(node&&anchor&&anchor.nextElementSibling!==node)anchor.after(node)}
var style=document.createElement('style');style.textContent=`
#customerFinancialSummary{width:100%;margin:14px 0 18px;min-width:0;grid-column:1/-1;container-type:inline-size;box-sizing:border-box;padding:clamp(9px,2vw,24px);border:1px solid var(--paper-line);border-radius:24px;background:var(--paper);box-shadow:0 4px 14px rgba(75,56,32,.05)}
html body #app main#main #customerFinancialSummary .money-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:clamp(6px,1.7cqi,20px)!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;overflow:visible!important}
html body #app main#main #customerFinancialSummary .money-cell{--summary-ink:var(--ink,#16232f);position:relative;isolation:isolate;overflow:hidden;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;min-width:0!important;min-height:0!important;padding:clamp(9px,3.4cqi,38px)!important;border:1px solid var(--paper-line)!important;border-radius:clamp(12px,2.6cqi,28px)!important;background:linear-gradient(135deg,#e9e9e5,#f7f5ef)!important;box-shadow:inset 0 0 0 1px rgba(22,35,47,.025)!important;color:var(--summary-ink)}
html body #app main#main #customerFinancialSummary .money-cell:nth-child(2){--summary-ink:var(--sage,#3f7a57);background:linear-gradient(135deg,#e9ede2,#f5f5e9)!important}
html body #app main#main #customerFinancialSummary .money-cell:nth-child(3){--summary-ink:var(--rust,#b44732);background:linear-gradient(135deg,#f1e3dc,#faf0e8)!important}
#customerFinancialSummary .money-cell:after{content:"";position:absolute;z-index:-1;width:90%;height:85%;right:-28%;top:-40%;border-radius:0 0 0 80%;background:currentColor;opacity:.035;transform:rotate(-22deg);pointer-events:none}
#customerFinancialSummary .summary-icon{display:grid;place-items:center;width:clamp(27px,6.6cqi,72px);height:clamp(27px,6.6cqi,72px);flex:none;box-sizing:border-box;border:1px solid var(--paper-line);border-radius:50%;background:var(--paper);color:var(--summary-ink);margin:0 0 clamp(10px,2cqi,24px)}
#customerFinancialSummary .summary-icon svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
html body #app main#main #customerFinancialSummary .money-label{margin:0 0 clamp(9px,1.7cqi,20px)!important;color:var(--muted,#746b5e)!important;font:500 clamp(8px,1.9cqi,20px)/1.3 Inter,sans-serif!important;letter-spacing:.13em!important;text-transform:uppercase;white-space:nowrap!important}
html body #app main#main #customerFinancialSummary .money-value{margin:0!important;color:var(--summary-ink)!important;font:600 clamp(15px,4.35cqi,48px)/1.18 Inter,sans-serif!important;font-variant-numeric:lining-nums tabular-nums!important;font-feature-settings:"lnum" 1,"tnum" 1!important;letter-spacing:-.025em!important;white-space:normal!important;overflow:visible!important;max-width:100%!important}
#customerFinancialSummary .summary-currency{display:block;letter-spacing:-.025em}
#customerFinancialSummary .summary-amount{display:block;white-space:nowrap}
html body #app main#main #customerFinancialSummary #creditNoteCustomerTotal{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;transform:none!important;float:none!important;clear:both!important;display:block!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important;margin:clamp(18px,3cqi,30px) 0 clamp(10px,1.8cqi,18px)!important;z-index:1!important}
html body #app main#main #customerFinancialSummary .cust-progress{margin:clamp(14px,2.8cqi,30px) 0 0!important;padding:0 clamp(4px,1.8cqi,20px)!important}
html body #app main#main #customerFinancialSummary .bar{height:clamp(12px,3cqi,34px)!important;border:2px solid var(--paper)!important;border-radius:999px!important;background:var(--paper-line)!important;overflow:hidden!important;box-shadow:0 0 0 clamp(5px,1.2cqi,12px) rgba(224,215,200,.18)!important}
html body #app main#main #customerFinancialSummary .bar-fill{height:100%!important;border-radius:999px!important;background:var(--sage,#3f7a57)!important}
html body #app main#main #customerFinancialSummary .bar-caption{display:flex!important;justify-content:space-between!important;gap:8px;margin:clamp(12px,2cqi,22px) 0 0!important;color:var(--muted)!important;font:400 clamp(10px,2.5cqi,27px)/1.3 Inter,sans-serif!important}
#customerFinancialSummary .bar-caption b{font-weight:600;color:var(--ink)}
@media(max-width:520px){#customerFinancialSummary{border-radius:18px;padding:10px}html body #app main#main #customerFinancialSummary .money-label{letter-spacing:.06em!important}}
#customerNoteTags{margin:12px 0;grid-column:1/-1;max-width:100%}#customerNoteTags>summary{cursor:pointer;display:block;width:fit-content;min-width:80px;padding:9px 14px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font:600 12px Inter,sans-serif;list-style:none}#customerNoteTags>summary::-webkit-details-marker{display:none}
.customer-tag-note{padding:12px 14px;border:1px solid var(--paper-line);border-radius:10px;margin-top:8px;background:var(--paper-dim)}.customer-tag-note p{white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0;font:500 13px/1.55 Inter,sans-serif}.customer-tag-note strong{font:600 11px Inter,sans-serif;color:var(--muted)}.note-visibility-button{display:block;margin:9px 0 0;padding:8px 10px;border:1px solid var(--paper-line);border-radius:7px;background:var(--paper);color:var(--ink);font:600 11px Inter,sans-serif;cursor:pointer}
.detail .tx-row{cursor:pointer}.detail .tx-row:focus-visible{outline:2px solid var(--gold-deep);outline-offset:2px}.detail .tx-expanded-fields{grid-column:1/-1;flex-basis:100%;width:100%;min-width:0;padding:10px 0 2px;cursor:pointer}.detail .tx-expanded-fields[hidden]{display:none!important}.detail .tx-expanded-fields dl{display:grid;grid-template-columns:125px minmax(0,1fr);gap:7px 12px;margin:0;font:400 12px/1.5 Inter,sans-serif}.detail .tx-expanded-fields dt{color:var(--muted)}.detail .tx-expanded-fields dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.detail .tx-row[aria-expanded=true] .tx-towards{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.detail .tx-row[aria-expanded=true]{flex-wrap:wrap!important}
@media(min-width:1024px){body.sunbliss-ref-desktop .overview>#scheduledActionsOverview{display:block!important;visibility:visible!important;width:100%!important;max-width:1480px;margin:24px auto!important;grid-column:1/-1}#scheduledActionsOverview .scheduled-overview-head{display:flex;justify-content:space-between}#scheduledActionsOverview .scheduled-overview-list{grid-template-columns:repeat(2,minmax(0,1fr))}#scheduledActionsOverview .scheduled-empty{grid-column:1/-1}}

#customerNoteTags{margin:10px 0 12px!important;border:1px solid #dfd2c0;border-radius:10px;background:transparent;overflow:hidden}
#customerNoteTags>summary{display:flex!important;align-items:center;gap:14px;width:100%!important;min-width:0!important;min-height:49px;padding:10px 14px!important;border:0!important;border-radius:0!important;background:transparent!important;box-sizing:border-box;color:var(--ink)}
#customerNoteTags .note-tag-title{display:flex;align-items:center;gap:9px;flex:none;padding-right:14px;border-right:1px solid #dfd2c0;min-height:25px;font:700 13px Inter,sans-serif}
#customerNoteTags svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linejoin:round;stroke-linecap:round;flex:none}
#customerNoteTags .note-tag-preview{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 12px/1.4 Inter,sans-serif}
#customerNoteTags .note-tag-arrow{width:13px;height:16px}#customerNoteTags[open] .note-tag-arrow{transform:rotate(90deg)}
#customerNoteTags .customer-tag-note{margin:0 12px 10px;background:transparent}
`;document.head.appendChild(style);
async function load(id,force){
 if(!force&&cache[id]&&Date.now()-cache[id].at<60000)return cache[id];
 if(inflight[id])return inflight[id];
 inflight[id]=(async function(){
  var rs=await Promise.all([sb.from('sales').select('id,customer_note,remarks,partial_booking_note,customer_page_hidden_notes').eq('unit_id',id).order('id',{ascending:false}).limit(1),sb.from('payment_transactions').select('id,payment_type,payment_reference,remarks').eq('unit_id',id)]);
  rs.forEach(function(r){if(r.error)throw r.error});
  return cache[id]={at:Date.now(),sale:(rs[0].data||[])[0]||{},transactions:rs[1].data||[]};
 })().finally(function(){delete inflight[id]});return inflight[id];
}
var summaryObserver=null;
function decorateFinancialSummary(summary){
 if(summaryObserver)summaryObserver.disconnect();
 var paths=['<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 10c0 4 16 4 16 0M4 15c0 4 16 4 16 0"/>','<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>','<path d="M5 3h9l5 5v13H5zM14 3v6h5M9 12h6M9 16h6"/>'];
 summary.querySelectorAll('.money-cell').forEach(function(cell,i){
  if(!cell.querySelector('.summary-icon')){var icon=document.createElement('span');icon.className='summary-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24">'+paths[i%3]+'</svg>';cell.prepend(icon)}
  var label=cell.querySelector('.money-label');if(i===1&&label&&label.textContent.trim()==='Received')label.textContent='Cash received';
  var value=cell.querySelector('.money-value');if(value&&!value.querySelector('.summary-currency')){var match=value.textContent.trim().match(/^AED\s*([\s\S]+)$/);if(match)value.innerHTML='<span class="summary-currency">AED</span> <span class="summary-amount">'+esc(match[1])+'</span>'}
 });
 summaryObserver=new MutationObserver(function(){decorateFinancialSummary(summary)});
 summaryObserver.observe(summary,{childList:true,subtree:true,characterData:true});
}
function financialLayout(){
 var detail=document.querySelector('#main .detail');if(!detail)return;
 var action=detail.querySelector('#actionRequiredCard'),money=detail.querySelector('.money-grid'),progress=detail.querySelector('.cust-progress');
 if(!action||!money)return;
 var summary=detail.querySelector('#customerFinancialSummary');if(!summary){summary=document.createElement('section');summary.id='customerFinancialSummary';summary.setAttribute('aria-label','Payment summary');}
 if(money.parentNode!==summary)summary.appendChild(money);var creditTotal=detail.querySelector('#creditNoteCustomerTotal');if(creditTotal&&creditTotal.parentNode!==summary)summary.appendChild(creditTotal);if(progress&&progress.parentNode!==summary)summary.appendChild(progress);
 var notes=detail.querySelector('#customerNoteTags');after(summary,notes||action);
 decorateFinancialSummary(summary);
}
function drawNotes(data){
 var detail=document.querySelector('#main .detail');if(!detail)return;
 var sale=data.sale,hidden=sale.customer_page_hidden_notes||[],fields=noteFields.filter(function(f){return text(sale[f]).trim()&&hidden.indexOf(f)<0}),old=detail.querySelector('#customerNoteTags');
 if(!fields.length){if(old)old.remove();return;}
 var signature=JSON.stringify([sale.id,fields.map(function(f){return [f,sale[f]]})]);
 if(old&&old.dataset.signature===signature){after(old,detail.querySelector('#actionRequiredCard'));return;}
 var card=document.createElement('details');card.id='customerNoteTags';card.dataset.signature=signature;card.open=!!(old&&old.open);
 card.innerHTML='<summary><span class="note-tag-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/></svg><strong>Note</strong></span><span class="note-tag-preview">'+esc(text(sale[fields[0]]).replace(/\s+/g,' ').trim())+'</span><svg class="note-tag-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8"/></svg></summary>'+fields.map(function(f){return '<div class="customer-tag-note"><strong>'+labels[f]+'</strong><p>'+esc(sale[f])+'</p>'+(state.userRole==='crm_officer'?'<button type="button" class="note-visibility-button" data-note-field="'+f+'">Remove from customer page</button>':'')+'</div>'}).join('');
 if(old)old.replaceWith(card);else detail.appendChild(card);
 after(card,detail.querySelector('#actionRequiredCard'));
 card.querySelectorAll('[data-note-field]').forEach(function(b){b.onclick=function(e){e.preventDefault();changeVisibility(b,Number(sale.id),uid(),b.dataset.noteField,true)}});
}
async function changeVisibility(button,saleId,unit,field,hide){
 if(!saleId||button.disabled)return;button.disabled=true;var oldLabel=button.textContent;button.textContent='Saving…';
 try{
  // Re-read the visibility list so a stale profile cannot overwrite another note's setting.
  var r=await sb.from('sales').select('customer_page_hidden_notes').eq('id',saleId).single();if(r.error)throw r.error;
  var hidden=(r.data.customer_page_hidden_notes||[]).filter(function(f){return f!==field});if(hide)hidden.push(field);
  var saved=await sb.from('sales').update({customer_page_hidden_notes:hidden}).eq('id',saleId).select('id');if(saved.error)throw saved.error;if(!saved.data||!saved.data.length)throw Error('The note visibility could not be saved.');
  if(cache[unit])cache[unit].sale.customer_page_hidden_notes=hidden;
  if(uid()===unit){if(!cache[unit])await load(unit,true);drawNotes(cache[unit]);financialLayout();}
  button.textContent=hide?'Show on customer page':'Remove from customer page';button.dataset.noteHidden=hide?'true':'false';
 }catch(e){button.textContent=oldLabel;var p=document.createElement('p');p.className='brand-error';p.setAttribute('role','alert');p.textContent=e.message||'Could not update note visibility.';button.after(p)}finally{button.disabled=false}
}
function decorateNotesEditor(panel,sale,unit){
 var blocks=panel.querySelectorAll('.notes-current');
 blocks.forEach(function(block){var title=text(block.querySelector('.notes-current-label')&&block.querySelector('.notes-current-label').textContent),field=noteFields.find(function(f){return labels[f]===title});if(!field||!text(sale[field]).trim()||block.querySelector('.note-visibility-button')||state.userRole!=='crm_officer')return;
  var b=document.createElement('button');b.type='button';b.className='note-visibility-button';b.dataset.noteHidden=(sale.customer_page_hidden_notes||[]).indexOf(field)>=0?'true':'false';b.textContent=b.dataset.noteHidden==='true'?'Show on customer page':'Remove from customer page';b.onclick=function(){changeVisibility(b,Number(sale.id),unit,field,b.dataset.noteHidden!=='true')};block.appendChild(b);
 });
}
function transactionData(row,index,data){
 var customer=current(),txs=typeof matchTransactions==='function'?matchTransactions(customer):[],t=txs[index]||{},id=Number(row.dataset.transactionId||t.id),raw=(data&&data.transactions||[]).find(function(x){return Number(x.id)===id})||{};
 var remark=text(raw.id!=null?raw.remarks:(t.remark||t.remarks)),through=text(t.paidBy||t.through||t.payment_method);if(!through){var m=remark.match(/^\s*((?:Online Payment|Bank Transfer|Cheque|Cash\/Card|Cash|Card)(?:\s*\([^)]*\))?)(?:[;,.]|$)/i);if(m)through=m[1];}
 return {title:text(t.towards||raw.payment_type||row.querySelector('.tx-towards')?.textContent||'Payment'),ref:text(raw.id!=null?raw.payment_reference:(t.ref||t.payment_reference)),through:through,remark:remark};
}
function decorateTransactions(data){
 var detail=document.querySelector('#main .detail');if(!detail)return;var cashIndex=0;
 detail.querySelectorAll('.tx-list .tx-row').forEach(function(row){
  var credit=row.classList.contains('credit-note-tx-row')||row.hasAttribute('data-credit-note-id'),index=credit?-1:cashIndex++,cn=credit?((current()&&current().creditNotes)||[]).find(function(n){return text(n.id)===row.dataset.creditNoteId})||{}:{},d=credit?{title:text(cn.stageLabel||row.querySelector('.tx-towards')?.textContent||'Credit note'),ref:text(cn.reference),through:'Credit note',remark:text(cn.reason)}:transactionData(row,index,data);
  var rowKey=key()+'|'+(credit?'credit:'+row.dataset.creditNoteId:'cash:'+(row.dataset.transactionId||index));
  var fields=row.querySelector('.tx-expanded-fields');if(!fields){fields=document.createElement('div');fields.className='tx-expanded-fields';row.appendChild(fields)}
  var html='<dl>'+[['Installment',d.title],['Reference / receipt',d.ref],['Through',d.through],['Remark',d.remark]].map(function(x){return '<dt>'+x[0]+'</dt><dd>'+esc(x[1]||'—')+'</dd>'}).join('')+'</dl>';
  if(fields.innerHTML!==html)fields.innerHTML=html;row.tabIndex=0;row.setAttribute('aria-label','Transaction details: '+d.title);row.setAttribute('aria-expanded',expanded[rowKey]?'true':'false');fields.hidden=!expanded[rowKey];
  function toggle(){expanded[rowKey]=!expanded[rowKey];fields.hidden=!expanded[rowKey];row.setAttribute('aria-expanded',expanded[rowKey]?'true':'false')}
  row.onclick=function(e){if(e.target.closest('button,a,input,select,textarea,.tx-actions-menu'))return;toggle()};row.onkeydown=function(e){if(e.target!==row||!['Enter',' '].includes(e.key))return;e.preventDefault();toggle()};
 });
}
function layout(){financialLayout();var data=cache[uid()];if(data){drawNotes(data);financialLayout();decorateTransactions(data)}}
async function prepare(force){var selected=key(),id=uid();if(!selected||!id)return;financialLayout();var data=await load(id,force);if(key()!==selected)return;drawNotes(data);financialLayout();decorateTransactions(data)}
var baseLoad=window.loadFromSupabase;if(typeof baseLoad==='function')window.loadFromSupabase=async function(){var out=await baseLoad.apply(this,arguments);cache={};return out};
window.__sunblissCustomerWorkspace={prepare:prepare,layout:layout,decorateNotesEditor:decorateNotesEditor,invalidate:function(id){delete cache[id]}};
var queued=false;new MutationObserver(function(ms){if(queued||!key()||!ms.some(function(m){return m.addedNodes.length&&Array.from(m.addedNodes).some(function(n){return n.nodeType===1&&(n.matches('.detail,#actionRequiredCard,.money-grid,.tx-row,#scheduledActionsDetail')||n.querySelector('.money-grid,.tx-row'))})}))return;queued=true;requestAnimationFrame(function(){queued=false;layout()})}).observe(document.body,{childList:true,subtree:true});
})();
