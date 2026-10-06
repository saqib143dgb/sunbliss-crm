(function(){
'use strict';
if(window.__sunblissModificationRequestsInstalled)return;
window.__sunblissModificationRequestsInstalled=true;

var panelId='modificationRequestPanel';

function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function current(){if(!window.state||state.view!=='detail'||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function allowed(){return !!(window.state&&(state.userRole==='crm_officer'||state.userRole==='manager'))}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(n){var d=new Date();d.setDate(d.getDate()+(Number(n)||0));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function formatDate(v){if(!v)return'';var d=new Date(text(v).slice(0,10)+'T00:00:00');return isNaN(d)?text(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function formatTime(v){if(!v)return'';var d=new Date(v);return isNaN(d)?text(v):d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function closeMenu(){var m=document.getElementById('customerActionMenu'),b=document.getElementById('customerActionMenuButton');if(m)m.style.display='none';if(b)b.setAttribute('aria-expanded','false')}
function close(){var p=document.getElementById(panelId);if(p)p.remove();document.body.classList.remove('modification-panel-open')}
function statusLabel(v){return({under_review:'Under Review',clarification_required:'Clarification Required',approval_pending:'Approval Pending',awaiting_customer_confirmation:'Awaiting Customer Confirmation',execution:'Execution',completed:'Completed',not_feasible:'Not Feasible',rejected:'Rejected',withdrawn:'Withdrawn'})[v]||text(v).replace(/_/g,' ')}
function eventLabel(v){return({request_received:'Request Received',feasible:'Feasible',clarification_required:'Clarification Required',clarification_received:'Clarification Received',management_approval_required:'Management Approval Required',management_approved:'Management Approved',management_rejected:'Management Rejected',not_feasible:'Not Feasible',final_confirmation_sent:'Final Confirmation Sent',customer_confirmed:'Customer Confirmed',revision_requested:'Revision Requested',no_response:'No Response',withdrawn:'Withdrawn',customer_informed:'Customer Informed',completed:'Completed'})[v]||text(v).replace(/_/g,' ')}
function isClosed(r){return r&&r.step==='closed'}

function styles(){
 if(document.getElementById('modificationRequestStyles'))return;
 var s=document.createElement('style');s.id='modificationRequestStyles';s.textContent=[
  'body.modification-panel-open{overflow:hidden!important;overscroll-behavior:none}',
  'body.modification-panel-open>.tabs,body.modification-panel-open>#sunblissPersistentBack,body.modification-panel-open>#sunblissDockSearchPanel{display:none!important}',
  '#'+panelId+'{position:fixed;inset:0;z-index:12720;display:grid;grid-template-rows:auto minmax(0,1fr);height:100dvh;background:var(--paper,#F6F1E4);color:var(--ink);overflow:hidden}',
  '#'+panelId+' *{box-sizing:border-box}',
  '#'+panelId+' .mr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:calc(18px + env(safe-area-inset-top)) 18px 14px;border-bottom:1px solid var(--paper-line);background:var(--paper)}',
  '#'+panelId+' .mr-kicker{font:700 9px/1.2 IBM Plex Mono,monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-deep,#A27C35)}',
  '#'+panelId+' .mr-title{margin:3px 0 3px;font:650 23px/1.2 Fraunces,Georgia,serif;color:var(--ink)}',
  '#'+panelId+' .mr-sub{margin:0;color:var(--muted);font:500 11.5px/1.4 Inter,sans-serif}',
  '#'+panelId+' .mr-body{min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:18px 18px calc(30px + env(safe-area-inset-bottom))}',
  '#'+panelId+' .mr-content{width:min(760px,100%);margin:0 auto}',
  '#'+panelId+' .mr-topline{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}',
  '#'+panelId+' .mr-section{font:700 10px/1.2 IBM Plex Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}',
  '#'+panelId+' .mr-card{border:1px solid var(--paper-line);border-left:4px solid var(--gold-deep,#A27C35);border-radius:12px;background:var(--paper);padding:13px 14px;margin:0 0 10px}',
  '#'+panelId+' .mr-card.closed{border-left-color:var(--muted);opacity:.86}',
  '#'+panelId+' .mr-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}',
  '#'+panelId+' .mr-no{font:700 9px/1.2 IBM Plex Mono,monospace;color:var(--gold-deep,#A27C35);letter-spacing:.04em;text-transform:uppercase}',
  '#'+panelId+' .mr-card-title{font:700 14px/1.35 Inter,sans-serif;color:var(--ink);margin-top:3px}',
  '#'+panelId+' .mr-chip{display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;background:var(--paper-dim);color:var(--muted);font:700 8.5px/1.2 IBM Plex Mono,monospace;text-transform:uppercase;white-space:nowrap}',
  '#'+panelId+' .mr-meta{margin-top:7px;color:var(--muted);font:500 10.8px/1.5 Inter,sans-serif}',
  '#'+panelId+' .mr-detail{margin-top:8px;color:var(--ink);font:500 11.5px/1.5 Inter,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere}',
  '#'+panelId+' .mr-actions{display:flex;gap:8px;margin-top:11px}',
  '#'+panelId+' .mr-actions button{margin:0!important;flex:1;justify-content:center}',
  '#'+panelId+' .mr-empty{border:1px dashed var(--paper-line);border-radius:11px;padding:15px;color:var(--muted);font-size:11.5px;line-height:1.5}',
  '#'+panelId+' .mr-form{border:1px solid var(--paper-line);border-radius:12px;background:var(--paper);padding:14px}',
  '#'+panelId+' .mr-form label{display:block;margin:0 0 13px;color:var(--muted);font:600 11.5px/1.4 Inter,sans-serif}',
  '#'+panelId+' .mr-form input,#'+panelId+' .mr-form select,#'+panelId+' .mr-form textarea{display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);font:500 16px/1.3 Inter,sans-serif}',
  '#'+panelId+' .mr-form textarea{min-height:105px;resize:vertical}',
  '#'+panelId+' .mr-form-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:8px}',
  '#'+panelId+' .mr-form-actions button{min-height:47px;margin:0!important;justify-content:center}',
  '#'+panelId+' .mr-error{display:none;margin:0 0 12px;padding:9px 10px;border-radius:8px;background:rgba(174,59,43,.07);color:var(--rust,#AE3B2B);font-size:11.5px}',
  '#'+panelId+' .mr-task-summary{padding:11px 12px;border:1px solid var(--paper-line);border-radius:10px;background:var(--paper-dim);margin-bottom:14px}',
  '#'+panelId+' .mr-task-summary strong{display:block;font-size:13px;color:var(--ink)}',
  '#'+panelId+' .mr-task-summary span{display:block;margin-top:4px;font-size:11px;line-height:1.45;color:var(--muted)}',
  '#'+panelId+' .mr-history{margin-top:18px;padding-top:15px;border-top:1px solid var(--paper-line)}',
  '#'+panelId+' .mr-event{position:relative;padding:0 0 13px 16px;border-left:1px solid var(--paper-line);margin-left:4px}',
  '#'+panelId+' .mr-event:before{content:"";position:absolute;left:-4px;top:3px;width:7px;height:7px;border-radius:50%;background:var(--gold-deep,#A27C35)}',
  '#'+panelId+' .mr-event-title{font:700 10.8px/1.35 Inter,sans-serif;color:var(--ink)}',
  '#'+panelId+' .mr-event-meta{font-size:9.8px;color:var(--muted);margin-top:2px}',
  '#'+panelId+' .mr-event-note{font-size:10.8px;line-height:1.45;color:var(--muted);margin-top:3px;white-space:pre-wrap}',
  '@media(max-width:560px){#'+panelId+' .mr-head{padding-left:14px;padding-right:14px}#'+panelId+' .mr-body{padding-left:14px;padding-right:14px}#'+panelId+' .mr-topline{align-items:flex-start}#'+panelId+' .mr-actions{flex-direction:column}#'+panelId+' .mr-actions button{width:100%}}',
  '@media(min-width:1024px){#'+panelId+' .mr-head{padding-left:max(36px,calc((100vw - 960px)/2));padding-right:max(36px,calc((100vw - 960px)/2))}#'+panelId+' .mr-body{padding:26px 36px 40px}#'+panelId+' .mr-content{width:min(960px,100%)}#'+panelId+' .mr-title{font-size:29px}}'
 ].join('');
 document.head.appendChild(s);
}

async function rpc(name,args){var r=await sb.rpc(name,args||{});if(r.error)throw r.error;return r.data}
async function list(unitId){return await rpc('crm_get_modification_requests',{p_unit_id:Number(unitId)})||[]}
async function get(id){return await rpc('crm_get_modification_request',{p_request_id:Number(id)})||{}}

function createPanel(c){
 close();styles();document.body.classList.add('modification-panel-open');
 var p=document.createElement('div');p.id=panelId;
 p.innerHTML='<header class="mr-head"><div><div class="mr-kicker">Modification Workflow</div><h2 class="mr-title">Modification Requests</h2><p class="mr-sub">'+safe(c.unit)+' · '+safe(c.name)+'</p></div><button type="button" class="btn-paper" id="mrClose">Close</button></header><div class="mr-body"><div class="mr-content" id="mrContent"><div class="mr-empty">Loading modification requests…</div></div></div>';
 document.body.appendChild(p);p.querySelector('#mrClose').onclick=close;return p;
}

function requestCard(r){
 var task=r.task||null,closed=isClosed(r);
 return '<div class="mr-card'+(closed?' closed':'')+'" data-request-id="'+r.id+'"><div class="mr-card-top"><div><div class="mr-no">'+safe(r.request_no||('MR-'+r.id))+(r.revision_no?(' · Revision '+r.revision_no):'')+'</div><div class="mr-card-title">'+safe(r.title)+'</div></div><span class="mr-chip">'+safe(statusLabel(r.status))+'</span></div><div class="mr-meta">Received '+safe(formatDate(r.request_date))+' via '+safe(r.received_via)+(task?' · Next: '+safe(task.action_label)+' · '+safe(formatDate(task.due_date)):'')+'</div>'+(r.details?'<div class="mr-detail">'+safe(r.details)+'</div>':'')+(!closed&&task?'<div class="mr-actions"><button type="button" class="btn btn-gold mr-open-task" data-task-id="'+task.id+'">Open Current Action</button></div>':'')+'</div>';
}

async function drawList(c,p){
 var host=p.querySelector('#mrContent');
 try{
  var rows=await list(c.sno),active=rows.filter(function(r){return !isClosed(r)}),closed=rows.filter(isClosed);
  host.innerHTML='<div class="mr-topline"><div class="mr-section">Active Requests</div><button type="button" class="btn btn-gold" id="mrNew">+ New Request</button></div>'+
   (active.length?active.map(requestCard).join(''):'<div class="mr-empty">No active modification request for this customer.</div>')+
   (closed.length?'<div class="mr-topline" style="margin-top:20px"><div class="mr-section">History</div></div>'+closed.map(requestCard).join(''):'');
  host.querySelector('#mrNew').onclick=function(){drawNew(c,p)};
  host.querySelectorAll('.mr-open-task').forEach(function(b){b.onclick=async function(){var id=Number(b.getAttribute('data-task-id')),row=rows.find(function(x){return x.task&&Number(x.task.id)===id});if(!row)return;await openTask(row.task)}});
  host.querySelectorAll('.mr-card.closed').forEach(function(card){card.style.cursor='pointer';card.onclick=async function(e){if(e.target.closest('button'))return;await showHistory(Number(card.getAttribute('data-request-id')),c,p)}});
 }catch(e){host.innerHTML='<div class="mr-error" style="display:block">'+safe(e&&e.message?e.message:'Could not load modification requests.')+'</div>'}
}

function drawNew(c,p){
 var host=p.querySelector('#mrContent');
 host.innerHTML='<div class="mr-topline"><div class="mr-section">New Modification Request</div></div><div class="mr-form"><p class="mr-error" id="mrError"></p><label>Request title<input id="mrTitle" maxlength="160" placeholder="e.g. Partial slab in Store"></label><label>Received via<select id="mrVia"><option>Email</option><option>WhatsApp</option><option>Call</option><option>Letter</option><option>In Person</option><option>Other</option></select></label><label>Request date<input type="date" id="mrDate" value="'+safe(today())+'"></label><label>Request details<textarea id="mrDetails" placeholder="Record the customer\'s request clearly and exactly."></textarea></label><div class="mr-form-actions"><button type="button" class="btn btn-gold" id="mrSave">Save Request</button><button type="button" class="btn-paper" id="mrBack">Cancel</button></div></div>';
 host.querySelector('#mrBack').onclick=function(){drawList(c,p)};
 host.querySelector('#mrSave').onclick=async function(){
  var btn=this,er=host.querySelector('#mrError'),title=text(host.querySelector('#mrTitle').value).trim(),via=text(host.querySelector('#mrVia').value),date=text(host.querySelector('#mrDate').value),details=text(host.querySelector('#mrDetails').value).trim();
  function fail(m){er.textContent=m;er.style.display='block';btn.disabled=false;btn.textContent='Save Request'}
  if(title.length<3)return fail('Enter a short modification request title.');
  if(!date)return fail('Select the request date.');
  er.style.display='none';btn.disabled=true;btn.textContent='Saving…';
  try{
   await rpc('crm_create_modification_request',{p_unit_id:Number(c.sno),p_title:title,p_details:details||null,p_received_via:via,p_request_date:date});
   if(typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();
   await drawList(c,p);
   if(typeof window.renderMain==='function')window.renderMain();
  }catch(e){fail(e&&e.message?e.message:'Could not save the modification request.')}
 };
}

async function showHistory(id,c,p){
 var host=p.querySelector('#mrContent');
 try{
  var data=await get(id),r=data.request||{},events=data.events||[];
  host.innerHTML='<div class="mr-topline"><div class="mr-section">'+safe(r.request_no||('MR-'+r.id))+'</div><button type="button" class="btn-paper" id="mrBack">Back</button></div>'+requestCard(Object.assign({},r,{task:data.task||null}))+'<div class="mr-history"><div class="mr-section" style="margin-bottom:12px">History</div>'+events.map(function(e){return'<div class="mr-event"><div class="mr-event-title">'+safe(eventLabel(e.event_type))+'</div><div class="mr-event-meta">'+safe(formatTime(e.created_at))+'</div>'+(e.note?'<div class="mr-event-note">'+safe(e.note)+'</div>':'')+'</div>'}).join('')+'</div>';
  host.querySelector('#mrBack').onclick=function(){drawList(c,p)};
  var b=host.querySelector('.mr-open-task');if(b)b.onclick=function(){openTask(data.task)};
 }catch(e){host.innerHTML='<div class="mr-error" style="display:block">'+safe(e&&e.message?e.message:'Could not load request history.')+'</div>'}
}

function stepForm(r){
 var step=r.step;
 if(step==='review')return{
  help:'Review the request and choose the next professional action.',
  options:'<option value="">Select review outcome</option><option value="feasible">Feasible</option><option value="clarification_required">Clarification Required</option><option value="management_approval_required">Management Approval Required</option><option value="not_feasible">Not Feasible</option>',
  note:'Review note (optional)',button:'Save Outcome'
 };
 if(step==='clarification')return{
  help:'Record what happened after following up for clarification.',
  options:'<option value="">Select outcome</option><option value="clarified">Clarification Received</option><option value="no_response">No Response</option><option value="withdrawn">Customer Withdrawn</option>',
  note:'Clarification / note (optional)',button:'Save Outcome'
 };
 if(step==='management_approval')return{
  help:'Record Management\'s decision for this modification request.',
  options:'<option value="">Select decision</option><option value="approved">Approved</option><option value="rejected">Rejected</option>',
  note:'Management note / conditions (optional)',button:'Save Decision'
 };
 if(step==='send_confirmation')return{
  help:'Send the final reviewed modification confirmation to the customer, then mark it sent.',
  options:'<option value="sent">Final Confirmation Sent</option>',
  note:'Confirmation note (optional)',button:'Mark Sent',fixed:true,followup:true
 };
 if(step==='customer_confirmation')return{
  help:'Record the customer\'s response to the final modification confirmation.',
  options:'<option value="">Select customer response</option><option value="confirmed">Confirmed</option><option value="revision_requested">Revision Requested</option><option value="no_response">No Response</option><option value="withdrawn">Withdrawn</option>',
  note:'Note (optional)',button:'Save Outcome'
 };
 if(step==='inform_customer')return{
  help:'Inform the customer of the final decision, then close this request.',
  options:'<option value="informed">Customer Informed</option>',
  note:'Communication note (optional)',button:'Mark Customer Informed',fixed:true
 };
 if(step==='execution')return{
  help:'Mark the request completed only after the modification work has been completed.',
  options:'<option value="completed">Modification Completed</option>',
  note:'Completion note (optional)',button:'Mark Completed',fixed:true
 };
 return null;
}

async function openTask(task){
 if(!task||!task.modification_request_id)return;
 var c=current()||{unit:'Unit '+task.unit_id,name:'Customer',sno:task.unit_id};
 var p=createPanel(c),host=p.querySelector('#mrContent');
 try{
  var data=await get(task.modification_request_id),r=data.request||{},events=data.events||[],cfg=stepForm(r);
  if(!cfg){host.innerHTML='<div class="mr-empty">This modification request has already been closed.</div>';return}
  host.innerHTML='<div class="mr-task-summary"><strong>'+safe(r.request_no||('MR-'+r.id))+' · '+safe(r.title)+'</strong><span>Status: '+safe(statusLabel(r.status))+' · Received '+safe(formatDate(r.request_date))+' via '+safe(r.received_via)+(r.revision_no?' · Revision '+r.revision_no:'')+'</span>'+(r.details?'<span>'+safe(r.details)+'</span>':'')+'</div><div class="mr-form"><p class="mr-error" id="mrError"></p><p style="margin:0 0 13px;color:var(--muted);font-size:11.5px;line-height:1.5">'+safe(cfg.help)+'</p><label>Outcome<select id="mrOutcome">'+cfg.options+'</select></label><label id="mrNextWrap" style="display:'+(cfg.followup?'block':'none')+'"><span id="mrNextLabel">'+(cfg.followup?'Customer follow-up date':'Next follow-up date')+'</span><input type="date" id="mrNextDate" value="'+safe(addDays(3))+'"></label><label>'+safe(cfg.note)+'<textarea id="mrNote" placeholder="'+(r.step==='customer_confirmation'?'If Revision Requested, enter the revised request/details here.':'Add a short factual note if needed.')+'"></textarea></label><div class="mr-form-actions"><button type="button" class="btn btn-gold" id="mrAdvance">'+safe(cfg.button)+'</button><button type="button" class="btn-paper" id="mrTaskClose">Cancel</button></div></div><div class="mr-history"><div class="mr-section" style="margin-bottom:12px">Request History</div>'+events.slice().reverse().map(function(e){return'<div class="mr-event"><div class="mr-event-title">'+safe(eventLabel(e.event_type))+'</div><div class="mr-event-meta">'+safe(formatTime(e.created_at))+'</div>'+(e.note?'<div class="mr-event-note">'+safe(e.note)+'</div>':'')+'</div>'}).join('')+'</div>';
  host.querySelector('#mrTaskClose').onclick=close;
  var out=host.querySelector('#mrOutcome'),wrap=host.querySelector('#mrNextWrap'),lbl=host.querySelector('#mrNextLabel');
  if(cfg.fixed&&out){out.value=out.options[0].value;out.disabled=true}
  if(out&&!cfg.followup)out.onchange=function(){
    var v=this.value,need=(r.step==='review'&&v==='clarification_required')||(r.step==='clarification'&&v==='no_response')||(r.step==='customer_confirmation'&&v==='no_response');
    wrap.style.display=need?'block':'none';if(lbl)lbl.textContent=v==='clarification_required'?'Customer follow-up date':'Next follow-up date';
  };
  host.querySelector('#mrAdvance').onclick=async function(){
    var btn=this,er=host.querySelector('#mrError'),outcome=text(out.value),note=text(host.querySelector('#mrNote').value).trim(),next=wrap.style.display!=='none'?text(host.querySelector('#mrNextDate').value):null;
    function fail(m){er.textContent=m;er.style.display='block';btn.disabled=false;btn.textContent=cfg.button}
    if(!outcome)return fail('Select an outcome.');
    if(wrap.style.display!=='none'&&!next)return fail('Select the next date.');
    if(r.step==='customer_confirmation'&&outcome==='revision_requested'&&!note)return fail('Enter the revised request/details.');
    er.style.display='none';btn.disabled=true;btn.textContent='Saving…';
    try{
      await rpc('crm_advance_modification_request',{p_task_id:Number(task.id),p_outcome:outcome,p_note:note||null,p_next_date:next||null});
      close();
      if(typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();
      if(typeof window.PaymentExtensionsCore!=='undefined'&&typeof window.renderMain==='function')window.renderMain();else if(typeof window.renderMain==='function')window.renderMain();
    }catch(e){fail(e&&e.message?e.message:'Could not update the modification request.')}
  };
 }catch(e){host.innerHTML='<div class="mr-error" style="display:block">'+safe(e&&e.message?e.message:'Could not load the modification request.')+'</div>'}
}

async function open(){
 closeMenu();var c=current();if(!c)return;var p=createPanel(c);await drawList(c,p);
}

function menu(){
 if(!allowed()||!window.state||state.view!=='detail')return;
 var m=document.getElementById('customerActionMenu');if(!m||document.getElementById('actionModificationRequests'))return;
 var b=document.createElement('button');b.type='button';b.id='actionModificationRequests';b.textContent='Modification Requests';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
 var response=document.getElementById('actionRecordCustomerPaymentResponse'),schedule=document.getElementById('actionScheduleAction');
 if(response&&response.parentNode===m)response.insertAdjacentElement('afterend',b);else if(schedule&&schedule.parentNode===m)m.insertBefore(b,schedule);else m.appendChild(b);
 b.onclick=function(e){e.preventDefault();e.stopPropagation();open()};
}

window.__sunblissOpenModificationTask=openTask;
window.__sunblissOpenModificationRequests=open;

function install(){
 styles();
 if(!window.state||!window.sb){setTimeout(install,80);return}
 var rd=window.renderDetail;if(typeof rd==='function'&&!rd.__modificationMenuWrapped){window.renderDetail=function(){var o=rd.apply(this,arguments);setTimeout(menu,0);return o};window.renderDetail.__modificationMenuWrapped=true}
 new MutationObserver(function(){menu()}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',menu);
 menu();
}
install();
})();