(function(){
'use strict';
if(window.__customerHistoryInstalled)return;window.__customerHistoryInstalled=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=v=>String(v||'').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
const date=v=>v?new Date(v).toLocaleString('en-GB',{timeZone:'Asia/Dubai',dateStyle:'medium',...(String(v).includes('T')?{timeStyle:'short'}:{})}):'';
const categories={extensions:'Extensions',modifications:'Modifications',payments:'Payments',credits:'Credit Notes',spa:'SPA & Oqood',tasks:'Tasks & Follow-ups',notes:'Notes'};
function current(){return (window.state?.dues||[]).find(c=>c.unit+'::'+c.sno===state.selectedUnit)}
function allowed(){return ['manager','crm_officer'].includes(window.state?.userRole)}
function close(){document.getElementById('customerHistoryPanel')?.remove();document.body.classList.remove('customer-history-open')}
function row(title,status,time,lines){return '<article class="ch-record"><strong>'+esc(title)+'</strong><p class="ch-meta">'+esc([label(status),date(time)].filter(Boolean).join(' · '))+'</p>'+lines.filter(Boolean).map(l=>'<p>'+esc(l)+'</p>').join('')+'</article>'}
async function rows(table,field,id){let all=[];for(let start=0;;start+=500){const r=await sb.from(table).select('*').eq(field,id).order('id',{ascending:false}).range(start,start+499);if(r.error)throw r.error;all.push(...(r.data||[]));if((r.data||[]).length<500)return all}}
async function rpc(name,args){const r=await sb.rpc(name,args);if(r.error)throw r.error;return r.data}
async function content(type,c){
 if(type==='extensions'){
  const [extensions,requests]=await Promise.all([rows('payment_extensions','unit_id',c.sno),rows('payment_extension_requests','unit_id',c.sno)]);
  let html=extensions.map(e=>row('Payment extension',e.status,e.cancelled_at||e.updated_at||e.created_at,['Original due: '+date(e.original_due_date),'Extended until: '+date(e.extended_due_date),e.approved_by&&'Approved by: '+e.approved_by,e.reason,e.cancellation_reason&&'Removal reason: '+e.cancellation_reason])).join('');
  for(const r of requests){const events=await rows('payment_extension_request_events','request_id',r.id);html+='<details class="ch-record"><summary>Request #'+esc(r.id)+' · '+esc(label(r.status))+'</summary>'+row('Extension request',r.status,r.created_at,['Requested until: '+date(r.requested_until),r.approved_until&&'Approved until: '+date(r.approved_until),r.reason])+events.map(e=>row(label(e.event_type),'',e.created_at,[e.notes])).join('')+'</details>'}return html;
 }
 if(type==='modifications'){
  const list=await rpc('crm_get_modification_requests',{p_unit_id:Number(c.sno)})||[];
  return list.map(r=>'<details class="ch-record" data-mod-id="'+Number(r.id)+'"><summary>'+esc(r.request_no||'MR-'+r.id)+' · '+esc(r.title)+' · '+esc(label(r.status))+'</summary><div class="ch-mod-events">Open to load history.</div></details>').join('');
 }
 if(type==='payments')return (await rows('payment_transactions','unit_id',c.sno)).map(r=>row(r.payment_type||'Payment',r.status,r.payment_date,['AED '+Number(r.amount||0).toLocaleString('en-AE'),r.remarks])).join('');
 if(type==='credits')return (await rows('credit_notes','unit_id',c.sno)).map(r=>row(r.credit_note_no||'Credit note #'+r.id,r.status,r.created_at,['AED '+Number(r.amount||0).toLocaleString('en-AE'),r.reason||r.note])).join('');
 if(type==='notes')return (await rows('sales_note_history','unit_id',c.sno)).map(r=>row(label(r.note_type||'Note'),'',r.edited_at,[r.new_note||'Note removed',r.old_note&&'Previous: '+r.old_note])).join('');
 return (await rows('scheduled_actions','unit_id',c.sno)).filter(t=>type==='spa'?t.spa_sale_id:!t.spa_sale_id&&!t.extension_request_id&&!t.modification_request_id&&t.auto_kind!=='extension_active').map(t=>row(t.action_label,t.status,t.completed_at||t.cancelled_at||t.updated_at||t.created_at,[t.due_date&&'Due: '+date(t.due_date),t.completion_note||t.note,t.spa_data?.reference&&'Reference: '+t.spa_data.reference])).join('');
}
async function open(){
 const c=current();if(!allowed()||!c)return;close();const menu=document.getElementById('customerActionMenu');if(menu)menu.style.display='none';document.getElementById('customerActionMenuButton')?.setAttribute('aria-expanded','false');
 document.body.classList.add('customer-history-open');const p=document.createElement('section');p.id='customerHistoryPanel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','Customer History');
 p.innerHTML='<div class="ch-shell"><header><div><h2>History</h2><p>'+esc(c.unit)+' · '+esc(c.name)+'</p></div><button type="button" class="btn-paper" id="chBack">Back</button></header><label for="chCategory">History type</label><select id="chCategory">'+Object.entries(categories).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select><div id="chRecords" aria-live="polite"></div></div>';document.body.appendChild(p);
 p.querySelector('#chBack').onclick=close;let version=0;
 async function draw(){const n=++version,host=p.querySelector('#chRecords');host.textContent='Loading history…';try{const html=await content(p.querySelector('select').value,c);if(!p.isConnected||n!==version)return;host.innerHTML=html||'<p>No records in this section.</p>';host.querySelectorAll('[data-mod-id]').forEach(d=>d.addEventListener('toggle',async()=>{if(!d.open||d.dataset.loaded)return;d.dataset.loaded='1';const target=d.querySelector('.ch-mod-events');target.textContent='Loading…';try{const data=await rpc('crm_get_modification_request',{p_request_id:Number(d.dataset.modId)});target.innerHTML=(data.events||[]).map(e=>row(label(e.event_type),'',e.created_at,[e.note])).join('')||'No earlier events.'}catch(e){delete d.dataset.loaded;target.textContent='Could not load events. Close and reopen to retry.'}}))}catch(e){if(n===version&&p.isConnected){host.innerHTML='<p role="alert">Could not load history. Please try again.</p><button class="btn-paper" type="button">Retry</button>';host.querySelector('button').onclick=draw}}}
 p.querySelector('select').onchange=draw;await draw();
}
function menu(){if(!allowed()||state.view!=='detail')return;const m=document.getElementById('customerActionMenu');if(!m||m.querySelector('#actionCustomerHistory'))return;const b=document.createElement('button');b.type='button';b.id='actionCustomerHistory';b.textContent='History';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink);cursor:pointer';b.onclick=e=>{e.preventDefault();e.stopPropagation();open()};m.appendChild(b)}
const s=document.createElement('style');s.textContent='body.customer-history-open{overflow:hidden!important}#customerHistoryPanel{position:fixed;inset:0;z-index:12400;overflow:auto;background:var(--paper,#f8f5ed);padding:24px 16px calc(30px + env(safe-area-inset-bottom));box-sizing:border-box}.ch-shell{max-width:860px;margin:auto}.ch-shell header{display:flex;justify-content:space-between;align-items:start;gap:12px}.ch-shell h2{margin:0}.ch-shell p{overflow-wrap:anywhere;white-space:pre-wrap}.ch-shell select{width:100%;padding:12px;margin:8px 0 18px;font:inherit;background:var(--paper);color:var(--ink);border:1px solid var(--paper-line);border-radius:9px}.ch-record{border:1px solid var(--paper-line);border-radius:10px;padding:14px;margin:0 0 12px;font-size:13px}.ch-record p{margin:6px 0}.ch-meta{color:var(--muted);font-size:12px}.ch-record summary{cursor:pointer;overflow-wrap:anywhere}.ch-shell button{min-height:44px}';document.head.appendChild(s);
new MutationObserver(menu).observe(document.body,{subtree:true,childList:true});menu();window.__sunblissOpenCustomerHistory=open;
})();
