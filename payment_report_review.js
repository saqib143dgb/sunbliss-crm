(function(){
'use strict';
const escape=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('en-AE',{minimumFractionDigits:2,maximumFractionDigits:2});
function displayed(){const ids=new Set(Array.from(document.querySelectorAll('.list .row-btn[data-sno]')).map(n=>String(n.dataset.sno)));return (window.state?.dues||[]).filter(c=>ids.has(String(c.sno)));}
async function open(){
  const api=window.__sunblissPaymentReportApi,selected=displayed();
  try{
    await api.refresh();const entries=api.entries(selected);if(!entries.length)throw new Error('No matching units to review.');
    document.getElementById('sbPaymentReportReview')?.remove();
    const d=document.createElement('dialog');d.id='sbPaymentReportReview';d.style.cssText='box-sizing:border-box;width:min(1100px,96vw);max-width:96vw;max-height:92dvh;border:1px solid #c9bc9a;border-radius:14px;padding:20px;background:var(--paper,#fff);color:var(--ink,#16232f);overflow:auto;';
    d.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px"><h2 style="margin:0">Payment report</h2><button type="button" data-close aria-label="Close payment report">Close</button></div><p>As of '+escape(entries[0].asOf)+' (Dubai). Property payments only.</p><p>'+entries.length+' units · Cash received AED '+money(entries.reduce((n,e)=>n+e.cash,0))+' · Total balance AED '+money(entries.reduce((n,e)=>n+e.balance,0))+'</p><label for="sbReportAccount">Review a unit</label> <select id="sbReportAccount" style="font-size:16px;max-width:100%;padding:8px">'+entries.map((e,i)=>'<option value="'+i+'">'+escape(e.unitNo+' — '+e.customerName)+'</option>').join('')+'</select><div data-account></div><p>Approved adjustments shown here do not create receipts or change the signed payment schedule.</p><button type="button" data-download>Download Excel report</button>';
    document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());
    function render(){const e=entries[Number(d.querySelector('select').value)],s=e.schedule;
      const items=[['Agreed price',e.price],['Cash received',e.cash],['Approved price discount',e.approvedDiscount],['Additional non-cash settlement',e.nonCashSettlement],['Pre-handover balance',s.constructionBalance],['Overdue pre-handover',e.overdue],['Upcoming pre-handover',e.upcoming],['Undated pre-handover',e.undated],['Final balance',s.finalBalance],['Total balance',e.balance],['Customer credit',e.customerCredit],['Reconciliation difference',e.reconciliation]];
      d.querySelector('[data-account]').innerHTML='<h3>'+escape(s.completionLabel)+'</h3><p>'+escape(e.notes.join(' ')||'Agreed price, receipts and balance reconcile.')+'</p><dl style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:16px 0">'+items.map(([k,v])=>'<dt>'+k+'</dt><dd style="margin:0;text-align:right">'+money(v)+'</dd>').join('')+'</dl><div style="overflow:auto"><table style="width:100%;min-width:560px;text-align:left;border-collapse:collapse"><thead><tr><th>Installment</th><th>Collection due</th><th>Balance (AED)</th><th>Status</th></tr></thead><tbody>'+e.rows.filter(r=>r.remaining>0.01).map(r=>'<tr><td style="padding:8px">'+escape(r.stage)+'</td><td>'+escape(r.collectionDate||'Undated')+'</td><td>'+money(r.remaining)+'</td><td>'+r.status+'</td></tr>').join('')+'</tbody></table></div>';
    }
    d.querySelector('select').onchange=render;d.querySelector('[data-download]').onclick=async function(){this.disabled=true;try{await api.export(selected);}catch(e){alert(e.message);}finally{this.disabled=false;}};render();d.showModal();
  }catch(e){alert('Payment report: '+e.message);}
}
function button(){const b=document.getElementById('btnExportList');if(!b||document.getElementById('sbReviewPaymentReport'))return;const n=document.createElement('button');n.id='sbReviewPaymentReport';n.type='button';n.className=b.className;n.textContent='Review payment report';n.onclick=open;b.parentNode.insertBefore(n,b);}
const previous=window.renderList;window.renderList=function(){const result=previous.apply(this,arguments);button();return result;};button();
})();
