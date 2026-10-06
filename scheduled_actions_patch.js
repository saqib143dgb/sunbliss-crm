(function(){
  'use strict';
  if(window.__sunblissScheduledActionsInstalled)return;
  window.__sunblissScheduledActionsInstalled=true;

  var cache={rows:[],loaded:false,loading:null,overviewFilter:'today'};
  var ACTIONS=['Payment follow-up','Call customer','Send email','WhatsApp follow-up','Check payment receipt','Document follow-up','SPA follow-up','OQOOD follow-up','DLD follow-up','Management approval','Other'];

  function text(v){return v==null?'':String(v);}
  function safe(v){
    if(typeof window.esc==='function')return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function todayIso(offset){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+(offset||0));var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);}
  function formatDate(v){if(!v)return'';var d=new Date(text(v).slice(0,10)+'T00:00:00');if(isNaN(d.getTime()))return text(v);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
  function escapeRegExp(v){return text(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function displayNote(t){
    var note=text(t&&t.note).trim();if(!note)return'';
    if(text(t&&t.source).toLowerCase()==='manual')return note;
    var due=formatDate(t&&t.due_date);if(!due)return note;
    var d=escapeRegExp(due);
    note=note.replace(new RegExp('\\s*[·•-]?\\s*(?:payment\\s+)?due\\s+(?:on\\s+)?'+d+'\\.?','gi'),'');
    note=note.replace(new RegExp('\\s*[·•-]?\\s*due\\s+(?:on\\s+)?'+d+'\\.?','gi'),'');
    return note.replace(/\s{2,}/g,' ').replace(/\s+[·•-]\s*$/,'').trim();
  }
  function currentCustomer(){if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit);})||null;}
  function customerForUnit(unitId){if(!window.state||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return Number(c&&c.sno)===Number(unitId);})||null;}
  function canUse(){return !!(window.state&&(state.userRole==='crm_officer'||state.userRole==='manager'));}
  function closeActionMenu(){var menu=document.getElementById('customerActionMenu'),button=document.getElementById('customerActionMenuButton');if(menu)menu.style.display='none';if(button)button.setAttribute('aria-expanded','false');}

  function ensureStyles(){
    if(document.getElementById('scheduledActionsStyles'))return;
    var s=document.createElement('style');s.id='scheduledActionsStyles';s.textContent=[
      '.scheduled-actions-detail{margin:0 0 16px}',
      '.scheduled-actions-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 9px}',
      '.scheduled-actions-heading .section-label{margin:0}',
      '.scheduled-actions-count{font:600 10px/1 IBM Plex Mono,monospace;color:var(--muted)}',
      '.scheduled-task-card{border:1px solid var(--paper-line);border-left:4px solid var(--slate);border-radius:12px;padding:12px 13px;margin:0 0 9px;background:var(--paper)}',
      '.scheduled-task-card[data-priority="High"]{border-left-color:var(--rust)}',
      '.scheduled-task-card[data-priority="Low"]{border-left-color:var(--sage)}',
      '.scheduled-task-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}',
      '.scheduled-task-title{font:700 13px/1.35 Inter,sans-serif;color:var(--ink)}',
      '.scheduled-task-date{font:600 10px/1.25 IBM Plex Mono,monospace;color:var(--muted);white-space:nowrap}',
      '.scheduled-task-meta{display:flex;gap:6px 10px;flex-wrap:wrap;margin-top:5px;font-size:10.8px;color:var(--muted)}',
      '.scheduled-task-note{margin:7px 0 0;font-size:11.5px;line-height:1.45;color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere}',
      '.scheduled-task-actions{display:flex;gap:7px;margin-top:10px}',
      '.scheduled-task-actions button{flex:1;justify-content:center;margin:0!important}',
      '.scheduled-task-state{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font:700 9px/1.2 IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.04em;background:var(--paper-dim);color:var(--muted)}',
      '.scheduled-task-state.overdue{background:rgba(174,59,43,.08);color:var(--rust)}',
      '.scheduled-task-state.today{background:rgba(156,90,18,.08);color:var(--amber)}',
      '.scheduled-task-state.tomorrow{background:rgba(69,86,107,.08);color:var(--slate)}',
      '.scheduled-task-state.inprogress{background:rgba(162,124,53,.10);color:var(--gold-deep,#A27C35)}',
      '#scheduledActionsOverview{margin-top:22px;padding-top:2px}',
      '.scheduled-overview-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}',
      '.scheduled-overview-head .section-label{margin:0}',
      '.scheduled-overview-select{appearance:none;border:1px solid var(--paper-line);background:var(--paper-dim);color:var(--ink);border-radius:9px;padding:8px 29px 8px 10px;font:600 11px/1.2 Inter,sans-serif;max-width:170px}',
      '.scheduled-overview-list{border-top:1px solid var(--paper-line)}',
      '.scheduled-overview-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 2px;border-bottom:1px solid var(--paper-line)}',
      '.scheduled-overview-main{min-width:0;cursor:pointer}',
      '.scheduled-overview-unit{font:700 9.5px/1.2 IBM Plex Mono,monospace;color:var(--gold-deep);text-transform:uppercase;letter-spacing:.04em}',
      '.scheduled-overview-title{font:650 12.5px/1.35 Inter,sans-serif;color:var(--ink);margin-top:2px}',
      '.scheduled-overview-meta{font-size:10.5px;line-height:1.35;color:var(--muted);margin-top:3px}',
      '.scheduled-overview-done{min-width:72px;margin:0!important;justify-content:center}',
      '.scheduled-empty{padding:18px 2px;color:var(--muted);font-size:12px}',
      '#scheduledActionPanel .scheduled-form-summary{margin:-2px 0 14px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font-size:11.5px;line-height:1.45;color:var(--muted)}',
      '#scheduledActionPanel select,#scheduledActionPanel input,#scheduledActionPanel textarea{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.25 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box}',
      '#scheduledActionPanel textarea{min-height:100px;resize:vertical}',
      '#scheduledActionPanel .scheduled-danger{margin-top:10px;width:100%;justify-content:center;color:var(--rust)}',
      '.scheduled-next-check{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;font-size:11.5px;line-height:1.4;color:var(--muted)}',
      '.scheduled-next-check input{width:auto!important;margin:1px 0 0!important}',
      '.scheduled-outcome-help{margin:0 0 10px;font-size:11.5px;line-height:1.45;color:var(--muted)}',
      '.scheduled-outcome-current{margin:0 0 12px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font-size:11.5px;line-height:1.45;color:var(--ink)}',
      '@media(max-width:520px){.scheduled-task-actions{flex-direction:column}.scheduled-task-actions button{width:100%}.scheduled-overview-row{grid-template-columns:1fr}.scheduled-overview-done{width:100%}.scheduled-overview-head{align-items:flex-start}.scheduled-overview-select{max-width:155px}}'
    ].join('');document.head.appendChild(s);
  }

  async function loadTasks(force){
    if(!window.sb)return[];
    if(cache.loaded&&!force)return cache.rows;
    if(cache.loading&&!force)return cache.loading;
    cache.loading=(async function(){
      var r=await sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,transaction_id,workflow_kind,commitment_part_id,extension_request_id,modification_request_id,created_at,updated_at,completed_at,completion_note,cancelled_at').order('due_date',{ascending:true}).order('id',{ascending:true});
      if(r.error)throw r.error;
      cache.rows=r.data||[];cache.loaded=true;cache.loading=null;return cache.rows;
    })().catch(function(e){cache.loading=null;throw e;});
    return cache.loading;
  }

  function pendingForUnit(unitId){return cache.rows.filter(function(t){return Number(t.unit_id)===Number(unitId)&&t.status==='pending';}).sort(taskSort);}
  function taskSort(a,b){var d=text(a.due_date).localeCompare(text(b.due_date));if(d)return d;var p={High:0,Medium:1,Low:2};return (p[a.priority]||1)-(p[b.priority]||1)||Number(a.id)-Number(b.id);}
  function stageKind(r){var n=text(r&&r.stage_name).toLowerCase().replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return'';}
  function paymentStage(r){return!!stageKind(r);}
  function idsFromKey(k){var m=text(k).match(/\|schedules?:([0-9,]+)/);return m?m[1].split(',').map(Number):[];}
  function isPaymentAction(action,note){return /(payment|installment|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection)/.test((text(action)+' '+text(note)).toLowerCase());}
  function relatedPaymentRows(c){
    var core=window.PaymentExtensionsCore,cc=core&&core.cache;if(!c||!cc||!Array.isArray(cc.s))return[];
    var credit=typeof core.creditMap==='function'?core.creditMap():{},ext={};
    (cc.e||[]).forEach(function(e){if(e&&e.status==='active'&&e.payment_schedule_id!=null)ext[String(e.payment_schedule_id)]=text(e.extended_due_date).slice(0,10);});
    var rows=cc.s.filter(function(r){
      if(Number(r&&r.unit_id)!==Number(c.sno)||!paymentStage(r))return false;
      var status=text(r&&r.status).trim().toLowerCase();
      if(status==='paid'||status==='completed'||status==='settled')return false;
      var applied=stageKind(r)==='dld'?0:(Number(credit[r.id])||0);
      return Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-applied)>1;
    }).map(function(r){
      var applied=stageKind(r)==='dld'?0:(Number(credit[r.id])||0),due=ext[String(r.id)]||text(r.revised_due_date||r.due_date).slice(0,10),remaining=Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-applied);
      return{row:r,due:due,remaining:remaining,kind:stageKind(r)};
    }).sort(function(a,b){
      var ad=text(a.due),bd=text(b.due);
      if(!ad&&bd)return 1;
      if(ad&&!bd)return-1;
      return ad.localeCompare(bd)||Number(a.row.id)-Number(b.row.id);
    });
    var dp=rows.filter(function(x){return x.kind==='dp';});if(dp.length)return dp;
    var pre=rows.filter(function(x){return x.kind==='first'||x.kind==='dld';});if(pre.length)return pre;
    return rows.filter(function(x){return x.kind==='later';});
  }
  function relatedPaymentField(c,selected){
    var rows=relatedPaymentRows(c);if(!rows.length)return'';var chosen=selected==='auto'?Number(rows[0].row.id):Number(selected)||0;
    return '<label class="brand-field">Related payment<select id="saRelatedSchedule"><option value="">General customer follow-up</option>'+rows.map(function(x){var r=x.row;return'<option value="'+r.id+'"'+(Number(r.id)===chosen?' selected':'')+'>'+safe(r.stage_name)+' · '+safe(formatDate(x.due))+' · '+safe(typeof window.fmtAED==='function'?window.fmtAED(x.remaining):x.remaining)+'</option>';}).join('')+'</select></label>';
  }
  function stateForTask(t){var today=todayIso(0),tomorrow=todayIso(1),date=text(t.due_date);if(t.status==='completed')return{key:'completed',label:'Completed'};if(t.workflow_kind==='modification_request'&&/in progress/i.test(text(t.action_label)))return{key:'inprogress',label:'In Progress'};if(date<today)return{key:'overdue',label:'Overdue'};if(date===today)return{key:'today',label:'Today'};if(date===tomorrow)return{key:'tomorrow',label:'Tomorrow'};return{key:'upcoming',label:'Upcoming'};}
  function addDaysIso(n){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+(Number(n)||0));var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);}
  function taskButtonLabel(t){if(t&&t.workflow_kind)return'Open';if(t&&t.auto_kind==='overdue_follow_up')return'Open';if(t&&(t.auto_kind==='demand_letter'||t.auto_kind==='gentle_reminder'))return'Mark Sent';return'Mark Done';}
  function collectionOutcomeTask(t){return !!(t&&(t.auto_kind==='overdue_follow_up'||['promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment'].indexOf(text(t.workflow_kind))>=0));}

  function renderDetailTasks(){var old=document.getElementById('scheduledActionsDetail');if(old)old.remove();}

  function filterRows(kind){
    var today=todayIso(0),tomorrow=todayIso(1),rows=cache.rows.slice();
    if(kind==='completed')return rows.filter(function(t){return t.status==='completed';}).sort(function(a,b){return text(b.completed_at||b.updated_at).localeCompare(text(a.completed_at||a.updated_at));});
    rows=rows.filter(function(t){return t.status==='pending'&&t.auto_kind!=='extension_active';});
    if(kind==='modifications')return rows.filter(function(t){return t.workflow_kind==='modification_request';}).sort(function(a,b){return text(b.updated_at||b.created_at).localeCompare(text(a.updated_at||a.created_at))||Number(b.id)-Number(a.id);});
    rows=rows.filter(function(t){return t.workflow_kind!=='modification_request';});
    if(kind==='overdue')rows=rows.filter(function(t){return text(t.due_date)<today;});
    else if(kind==='today')rows=rows.filter(function(t){return text(t.due_date)===today;});
    else if(kind==='tomorrow')rows=rows.filter(function(t){return text(t.due_date)===tomorrow;});
    else if(kind==='upcoming')rows=rows.filter(function(t){return text(t.due_date)>today;});
    return rows.sort(taskSort);
  }

  function count(kind){return filterRows(kind).length;}
  function overviewOption(value,label){return '<option value="'+value+'"'+(cache.overviewFilter===value?' selected':'')+'>'+safe(label)+' · '+count(value)+'</option>';}
  function renderOverviewTasks(){
    if(!window.state||state.view!=='overview')return;
    var overview=document.querySelector('.overview');if(!overview)return;
    var old=document.getElementById('scheduledActionsOverview');if(old)old.remove();
    var section=document.createElement('section');section.id='scheduledActionsOverview';
    section.innerHTML='<div class="scheduled-overview-head"><p class="section-label">Scheduled Actions</p><select id="scheduledOverviewFilter" class="scheduled-overview-select" aria-label="Scheduled action filter">'+overviewOption('today','Today')+overviewOption('tomorrow','Tomorrow')+overviewOption('overdue','Overdue')+overviewOption('modifications','Modification\u00A0Request')+overviewOption('upcoming','Upcoming')+overviewOption('completed','Completed')+'</select></div><div id="scheduledOverviewList" class="scheduled-overview-list"></div>';
    var foot=overview.querySelector(':scope > .footnote');if(foot)overview.insertBefore(section,foot);else overview.appendChild(section);
    document.getElementById('scheduledOverviewFilter').onchange=function(){cache.overviewFilter=this.value;renderOverviewList();};
    renderOverviewList();
  }
  function renderOverviewList(){
    var host=document.getElementById('scheduledOverviewList');if(!host)return;
    var rows=filterRows(cache.overviewFilter);
    if(!rows.length){host.innerHTML='<div class="scheduled-empty">No '+safe(cache.overviewFilter==='completed'?'completed':'pending')+' actions in this view.</div>';return;}
    host.innerHTML=rows.map(function(t){var c=customerForUnit(t.unit_id),st=stateForTask(t),name=c?c.name:'Customer',unit=c?c.unit:'Unit '+t.unit_id;var completion=t.status==='completed'&&t.completion_note?'<div class="scheduled-overview-meta">Completed: '+safe(t.completion_note)+'</div>':'';return '<div class="scheduled-overview-row" data-task-id="'+t.id+'"><div class="scheduled-overview-main" data-open-unit="'+safe(t.unit_id)+'"><div class="scheduled-overview-unit">'+safe(unit)+' · '+safe(name)+'</div><div class="scheduled-overview-title">'+safe(t.action_label)+'</div><div class="scheduled-overview-meta"><span class="scheduled-task-state '+st.key+'">'+safe(st.label)+'</span> · '+safe(t.priority)+' · '+safe(formatDate(t.due_date))+(t.note?' · '+safe(t.note):'')+'</div>'+completion+'</div>'+(t.status==='pending'?'<button type="button" class="btn-paper scheduled-overview-done scheduled-mark-done" data-task-id="'+t.id+'">'+safe(taskButtonLabel(t))+'</button>':'')+'</div>';}).join('');
    host.querySelectorAll('[data-open-unit]').forEach(function(el){el.onclick=function(){var c=customerForUnit(Number(el.getAttribute('data-open-unit')));if(!c)return;if(typeof window.goToDetail==='function')window.goToDetail(c.unit,c.sno,'overview');else{state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain();}};});
    bindTaskButtons(host);
  }

  function taskById(id){return cache.rows.find(function(t){return Number(t.id)===Number(id);})||null;}
  function bindTaskButtons(root){
    root.querySelectorAll('.scheduled-mark-done').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();var t=taskById(btn.getAttribute('data-task-id'));if(t)openComplete(t);};});
    root.querySelectorAll('.scheduled-edit').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();var t=taskById(btn.getAttribute('data-task-id'));if(t)openForm(t);};});
  }

  function removePanel(){var p=document.getElementById('scheduledActionPanel');if(p)p.remove();}
  function actionOptions(current){return ACTIONS.map(function(a){return '<option value="'+safe(a)+'"'+(a===current?' selected':'')+'>'+safe(a)+'</option>';}).join('');}
  function openForm(task){
    removePanel();closeActionMenu();var c=task?customerForUnit(task.unit_id):currentCustomer();if(!c)return;
    var current=task?task.action_label:'Payment follow-up',isKnown=ACTIONS.indexOf(current)>=0,selectValue=isKnown?current:'Other';
    var p=document.createElement('div');p.id='scheduledActionPanel';p.className='brand-editor';p.setAttribute('data-mode',task?'edit':'new');
    p.innerHTML='<p class="section-label" style="margin-top:0">'+(task?'Edit Scheduled Action':'Schedule Action')+'</p><p class="scheduled-form-summary">Unit '+safe(c.unit)+' · '+safe(c.name)+(task?' · update or reschedule this action.':' · this action will stay in Scheduled Actions on the overview until completed or cancelled.')+'</p><p class="brand-error" id="saError" style="display:none"></p><label class="brand-field">Action<select id="saAction">'+actionOptions(selectValue)+'</select></label><label class="brand-field" id="saCustomWrap"'+(selectValue==='Other'?'':' style="display:none"')+'>Custom action<input type="text" id="saCustom" maxlength="120" value="'+safe(isKnown?'':current)+'" placeholder="What needs to be done?" /></label>'+relatedPaymentField(c,task?task.schedule_id:'auto')+'<label class="brand-field">Due date<input type="date" id="saDate" value="'+safe(task?task.due_date:'')+'" /></label><label class="brand-field">Priority<select id="saPriority"><option'+((task?task.priority:'Medium')==='High'?' selected':'')+'>High</option><option'+((task?task.priority:'Medium')==='Medium'?' selected':'')+'>Medium</option><option'+((task?task.priority:'Medium')==='Low'?' selected':'')+'>Low</option></select></label><label class="brand-field">Note (optional)<textarea id="saNote" placeholder="Short instruction or customer commitment">'+safe(task&&task.note||'')+'</textarea></label><div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saSave">'+(task?'Save Changes':'Schedule Action')+'</button><button type="button" class="btn-paper" id="saClose">Cancel</button></div>'+(task?'<button type="button" class="btn-paper scheduled-danger" id="saCancelTask">Cancel Scheduled Action</button>':'');
    document.body.appendChild(p);
    document.getElementById('saAction').onchange=function(){document.getElementById('saCustomWrap').style.display=this.value==='Other'?'block':'none';};
    document.getElementById('saClose').onclick=removePanel;
    document.getElementById('saSave').onclick=function(){saveTask(c,task);};
    if(task)document.getElementById('saCancelTask').onclick=function(){cancelTask(task);};
  }

  function val(id){var el=document.getElementById(id);return el?text(el.value).trim():'';}
  async function saveTask(c,task){
    var err=document.getElementById('saError'),save=document.getElementById('saSave');
    var action=val('saAction')==='Other'?val('saCustom'):val('saAction'),due=val('saDate'),priority=val('saPriority'),note=val('saNote')||null,related=Number(val('saRelatedSchedule'))||null;
    function fail(msg){if(err){err.textContent=msg;err.style.display='block';}}
    if(action.length<2){fail('Enter the action you need to complete.');return;}if(!due){fail('Select a due date.');return;}
    if(save){save.disabled=true;save.textContent='Saving…';}if(err)err.style.display='none';
    try{
      var payment=isPaymentAction(action,note)||!!related;
      var payload={action_label:action,due_date:due,priority:priority,note:note,source:'manual',auto_kind:null,schedule_id:related,auto_key:related&&payment?'manual_payment|unit:'+Number(c.sno)+'|schedule:'+related:null,updated_at:new Date().toISOString()};var r;
      if(task)r=await sb.from('scheduled_actions').update(payload).eq('id',task.id).select().single();
      else{
        var existing=related?cache.rows.find(function(t){if(Number(t.unit_id)!==Number(c.sno)||t.status!=='pending'||t.auto_kind==='extension_active')return false;if(Number(t.schedule_id)===related)return true;return idsFromKey(t.auto_key).indexOf(related)>=0;}):null;
        if(existing)r=await sb.from('scheduled_actions').update(payload).eq('id',existing.id).select().single();
        else{payload.unit_id=Number(c.sno);r=await sb.from('scheduled_actions').insert(payload).select().single();}
      }
      if(r.error)throw r.error;removePanel();await refreshAfterChange();
    }catch(e){fail(e&&e.message?e.message:'Could not save this scheduled action.');if(save){save.disabled=false;save.textContent=task?'Save Changes':'Schedule Action';}}
  }

  function openComplete(task){
    if(task&&task.workflow_kind==='modification_request'&&typeof window.__sunblissOpenModificationTask==='function'){window.__sunblissOpenModificationTask(task);return;}
    removePanel();var c=customerForUnit(task.unit_id),p=document.createElement('div');p.id='scheduledActionPanel';p.className='brand-editor';p.setAttribute('data-mode','complete');
    var summary=safe(task.action_label)+' · '+safe(c?('Unit '+c.unit+' · '+c.name):('Unit '+task.unit_id))+' · due '+safe(formatDate(task.due_date));
    var body='',button='Mark Done';
    if(task.workflow_kind==='accounts_confirmation'){
      body='<p class="scheduled-outcome-help">Record the result from Accounts. A receipt task is created only after Accounts confirms the payment.</p><label class="brand-field">Accounts verification<select id="saOutcome"><option value="">Select outcome</option><option value="confirmed">Confirmed</option><option value="not_received">Not Received</option><option value="amount_mismatch">Amount Mismatch</option></select></label><label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Reference, confirmation detail or issue"></textarea></label>';
      button='Save Outcome';
    }else if(task.workflow_kind==='cheque_clearance'){
      body='<p class="scheduled-outcome-help">Record the cheque clearance result. Receipt generation stays locked until the cheque is cleared.</p><label class="brand-field">Cheque status<select id="saOutcome"><option value="">Select outcome</option><option value="cleared">Cleared</option><option value="still_pending">Still Pending</option><option value="returned">Returned</option></select></label><label class="brand-field" id="saNextDateWrap" style="display:none">Next clearance check<input type="date" id="saNextDate" value="'+safe(addDaysIso(1))+'" /></label><label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Clearance reference or issue"></textarea></label>';
      button='Save Outcome';
    }else if(task.workflow_kind==='payment_receipt'){
      body='<p class="scheduled-outcome-current">Accounts confirmation is complete. Mark this task done after the payment receipt has been sent to the customer.</p><label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="e.g. sent by email or WhatsApp"></textarea></label><input type="hidden" id="saOutcome" value="sent">';
      button='Mark Done';
    }else if(task.workflow_kind==='payment_reported'){
      body='<p class="scheduled-outcome-current">The customer reported that payment has been made. Record the actual payment before closing this action.</p><input type="hidden" id="saOutcome" value="record_payment">';
      button='Record Payment';
    }else if(task.workflow_kind==='extension_approval'){
      body='<p class="scheduled-outcome-help">Review the customer\'s payment extension request and record Management\'s decision. The contractual due date changes only if the request is approved.</p><div class="scheduled-outcome-current" id="saExtensionRequestSummary">Loading extension request…</div><label class="brand-field">Management decision<select id="saOutcome"><option value="">Select decision</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><div id="saExtensionApprovalFields" style="display:none"><label class="brand-field">Approved until<input type="date" id="saApprovedUntil" /></label><label class="brand-field">Approved by<input type="text" id="saApprovedBy" maxlength="120" value="Management" /></label><label class="brand-field">Approval reference (optional)<input type="text" id="saApprovalRef" maxlength="250" placeholder="e.g. email / management confirmation" /></label><label class="brand-field">Late-charge treatment<select id="saPenalty"><option value="not_specified">Not specified in approval</option><option value="original_due_date">Charges continue from original due date</option><option value="extended_due_date">Charges start after extended deadline</option><option value="waived_until_extension">Waived if paid by extended deadline</option><option value="no_late_charges">No late charges under approval</option></select></label></div><label class="brand-field">Decision note (optional)<textarea id="saCompletionNote" placeholder="Management decision, conditions or rejection reason"></textarea></label>';
      button='Save Decision';
    }else if(collectionOutcomeTask(task)){
      var txReview=!!task.transaction_id&&(task.workflow_kind==='payment_review'||task.workflow_kind==='payment_follow_up');
      var partialOption=!txReview&&task.workflow_kind!=='partial_payment_commitment'?'<option value="partial_payment_commitment">Partial Payment Commitment</option>':'';
      body='<p class="scheduled-outcome-help">Choose the customer/payment outcome. The CRM will keep only the next required action active.</p><label class="brand-field">Outcome<select id="saOutcome"><option value="">Select outcome</option>'+(txReview?'<option value="recheck_accounts">Recheck with Accounts</option>':'<option value="resolved">Resolved</option>')+'<option value="payment_reported">Payment Reported</option><option value="will_pay_later">Will Pay Later</option>'+partialOption+'<option value="payment_issue">Payment Issue / Dispute</option><option value="no_response">No Response</option></select></label><label class="brand-field" id="saNextDateWrap" style="display:none">Next follow-up date<input type="date" id="saNextDate" value="'+safe(addDaysIso(3))+'" /></label><div id="saPartialCommitmentWrap" style="display:none;margin:12px 0;padding:12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim)"><p style="margin:0 0 8px;font:650 12px/1.4 Inter,sans-serif;color:var(--ink)">Partial Payment Commitment</p><p style="margin:0 0 10px;font-size:11px;line-height:1.45;color:var(--muted)">Keep the original installment unchanged. Add the amounts and dates the customer committed to pay.</p><div id="saCommitmentParts"><div class="sa-commitment-part" data-part="1"><label class="brand-field">Part 1 amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" class="saCommitmentAmount" /></label><label class="brand-field">Commitment date<input type="date" class="saCommitmentDate" /></label></div><div class="sa-commitment-part" data-part="2"><label class="brand-field">Part 2 amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" class="saCommitmentAmount" /></label><label class="brand-field">Commitment date<input type="date" class="saCommitmentDate" /></label></div></div><button type="button" class="btn-paper" id="saAddCommitmentPart" style="width:100%;justify-content:center">+ Add another part</button></div><label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Short outcome or customer commitment"></textarea></label>';
      button='Save Outcome';
    }else{
      body='<label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="What happened or what did the customer confirm?"></textarea></label>'+(task.auto_kind==='demand_letter'||task.auto_kind==='gentle_reminder'?'':'<label class="scheduled-next-check"><input type="checkbox" id="saScheduleNext" /><span>Schedule the next action after marking this one done</span></label>');
      button=task.auto_kind==='demand_letter'||task.auto_kind==='gentle_reminder'?'Mark Sent':'Mark Done';
    }
    p.innerHTML='<p class="section-label" style="margin-top:0">'+(task.workflow_kind||collectionOutcomeTask(task)?'Payment Workflow':'Complete Scheduled Action')+'</p><p class="scheduled-form-summary">'+summary+'</p><p class="brand-error" id="saError" style="display:none"></p>'+body+'<div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saComplete">'+safe(button)+'</button><button type="button" class="btn-paper" id="saClose">Cancel</button></div>';
    document.body.appendChild(p);
    document.getElementById('saClose').onclick=removePanel;
    var outcome=document.getElementById('saOutcome');
    if(outcome&&document.getElementById('saNextDateWrap'))outcome.onchange=function(){var needs=this.value==='still_pending'||this.value==='will_pay_later'||this.value==='no_response',partial=this.value==='partial_payment_commitment',nextWrap=document.getElementById('saNextDateWrap'),partialWrap=document.getElementById('saPartialCommitmentWrap');nextWrap.style.display=needs?'block':'none';if(partialWrap)partialWrap.style.display=partial?'block':'none';};
    if(task.workflow_kind==='extension_approval'&&outcome){outcome.onchange=function(){var box=document.getElementById('saExtensionApprovalFields');if(box)box.style.display=this.value==='approved'?'block':'none';};loadExtensionApproval(task);}
    var addPart=document.getElementById('saAddCommitmentPart');if(addPart)addPart.onclick=function(){var host=document.getElementById('saCommitmentParts'),n=host?host.querySelectorAll('.sa-commitment-part').length+1:0;if(!host||!n)return;var row=document.createElement('div');row.className='sa-commitment-part';row.setAttribute('data-part',n);row.innerHTML='<label class="brand-field">Part '+n+' amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" class="saCommitmentAmount" /></label><label class="brand-field">Commitment date<input type="date" class="saCommitmentDate" /></label><button type="button" class="btn-paper saRemoveCommitmentPart" style="width:100%;justify-content:center;margin:0 0 10px">Remove part</button>';host.appendChild(row);var remove=row.querySelector('.saRemoveCommitmentPart');if(remove)remove.onclick=function(){row.remove();};};
    document.getElementById('saComplete').onclick=function(){completeTask(task);};
  }

  async function loadExtensionApproval(task){
    var host=document.getElementById('saExtensionRequestSummary');if(!host||!task.extension_request_id)return;
    try{
      var r=await sb.from('payment_extension_requests').select('id,original_due_date,requested_until,reason,status').eq('id',Number(task.extension_request_id)).single();
      if(r.error)throw r.error;var x=r.data||{};
      host.innerHTML='<strong>Requested until:</strong> '+safe(formatDate(x.requested_until))+'<br><strong>Original due:</strong> '+safe(formatDate(x.original_due_date))+(x.reason?'<br><strong>Customer reason:</strong> '+safe(x.reason):'');
      var d=document.getElementById('saApprovedUntil');if(d&&!d.value)d.value=text(x.requested_until).slice(0,10);
    }catch(e){host.textContent='Could not load the extension request details.';}
  }

  async function resolveExtensionApproval(task,decision,note){
    var approvedUntil=val('saApprovedUntil'),approvedBy=val('saApprovedBy'),approvalRef=val('saApprovalRef'),penalty=val('saPenalty')||'not_specified';
    if(!decision)throw new Error('Select Approved or Rejected.');
    if(decision==='approved'&&!approvedUntil)throw new Error('Select the approved extension date.');
    if(decision==='approved'&&approvedBy.length<2)throw new Error('Enter who approved the extension.');
    var r=await sb.rpc('crm_resolve_payment_extension_request',{
      p_task_id:Number(task.id),
      p_decision:decision,
      p_approved_until:decision==='approved'?approvedUntil:null,
      p_approved_by:decision==='approved'?approvedBy:null,
      p_approval_reference:decision==='approved'?(approvalRef||null):null,
      p_penalty_basis:decision==='approved'?penalty:'not_specified',
      p_note:note||null
    });
    if(r.error)throw r.error;
    return r.data||{};
  }

  function partialCommitmentParts(){
    var host=document.getElementById('saCommitmentParts');if(!host)return[];
    return Array.from(host.querySelectorAll('.sa-commitment-part')).map(function(row){var a=row.querySelector('.saCommitmentAmount'),d=row.querySelector('.saCommitmentDate');return{amount:Number(a&&a.value||0),date:text(d&&d.value).trim()};});
  }

  async function createPartialPaymentCommitment(task,note){
    var parts=partialCommitmentParts();
    if(parts.length<2)throw new Error('Add at least two committed payment parts.');
    for(var i=0;i<parts.length;i++){if(!isFinite(parts[i].amount)||parts[i].amount<=0)throw new Error('Enter the amount for Part '+(i+1)+'.');if(!parts[i].date)throw new Error('Select the commitment date for Part '+(i+1)+'.');}
    var r=await sb.rpc('crm_create_partial_payment_commitment',{p_task_id:Number(task.id),p_parts:parts,p_note:note||null});
    if(r.error)throw r.error;
    return r.data||{};
  }

  async function resolvePaymentWorkflow(task,outcome,note,nextDate){
    var r=await sb.rpc('crm_resolve_payment_workflow_task',{p_task_id:Number(task.id),p_outcome:outcome,p_note:note||null,p_next_date:nextDate||null});
    if(r.error)throw r.error;
  }

  async function openPaymentFromTask(task){
    var c=customerForUnit(task.unit_id);if(!c||typeof window.__sunblissOpenRecordPayment!=='function')return;
    state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';
    if(typeof window.renderMain==='function')window.renderMain();
    window.setTimeout(function(){try{window.__sunblissOpenRecordPayment({scheduleId:task.schedule_id||null,commitmentPartId:task.commitment_part_id||null,sourceTaskId:(task.workflow_kind==='partial_payment_commitment'||task.workflow_kind==='payment_reported')?task.id:null});}catch(_e){}},60);
  }

  async function resolveCollectionOutcome(task,outcome,note,nextDate){
    var now=new Date().toISOString(),r;
    if(outcome==='recheck_accounts'&&task.transaction_id){
      r=await sb.rpc('crm_set_payment_confirmation_mode',{p_transaction_id:Number(task.transaction_id),p_mode:'confirmed_by_customer',p_note:note||null});
      if(r.error)throw r.error;return 'refresh';
    }
    if(outcome==='will_pay_later'){
      if(!nextDate)throw new Error('Select the promised payment date.');
      r=await sb.from('scheduled_actions').update({action_label:'Follow up on Promised Payment',due_date:nextDate,priority:'Medium',note:note||('Customer committed to pay on '+formatDate(nextDate)+'.'),source:'manual',auto_kind:null,workflow_kind:'promise_follow_up',status:'pending',completed_at:null,completion_note:null,cancelled_at:null,updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;return 'refresh';
    }
    if(outcome==='payment_issue'){
      r=await sb.from('scheduled_actions').update({action_label:'Resolve Payment Query',due_date:todayIso(0),priority:'High',note:note||'Resolve the customer payment query before continuing normal collection follow-up.',source:'manual',auto_kind:null,workflow_kind:'payment_query',status:'pending',completed_at:null,completion_note:null,cancelled_at:null,updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;return 'refresh';
    }
    if(outcome==='no_response'){
      if(!nextDate)throw new Error('Select the next follow-up date.');
      r=await sb.from('scheduled_actions').update({action_label:'Payment Follow-up with Customer',due_date:nextDate,priority:'High',note:note||'No response. Follow up with the customer again on the scheduled date.',source:'manual',auto_kind:null,workflow_kind:'payment_follow_up',status:'pending',completed_at:null,completion_note:null,cancelled_at:null,updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;return 'refresh';
    }
    if(outcome==='payment_reported'){
      if(task.workflow_kind==='partial_payment_commitment')return 'payment';
      r=await sb.from('scheduled_actions').update({status:'completed',completed_at:now,completion_note:note||'Customer reported payment.',updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;return 'payment';
    }
    if(outcome==='resolved'){
      r=await sb.from('scheduled_actions').update({status:'completed',completed_at:now,completion_note:note||'Resolved.',updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;return 'refresh';
    }
    throw new Error('Select an outcome.');
  }

  async function completeTask(task){
    var save=document.getElementById('saComplete'),err=document.getElementById('saError'),next=document.getElementById('saScheduleNext')&&document.getElementById('saScheduleNext').checked,note=val('saCompletionNote')||null,outcome=val('saOutcome'),nextDate=val('saNextDate');
    if(save){save.disabled=true;save.textContent='Saving…';}
    try{
      if(task.workflow_kind==='payment_reported'){
        removePanel();await openPaymentFromTask(task);return;
      }
      if(task.workflow_kind==='extension_approval'){
        if(!outcome)throw new Error('Select Approved or Rejected.');
        var extensionResult=await resolveExtensionApproval(task,outcome,note);
        removePanel();
        if(extensionResult&&extensionResult.decision==='approved'&&window.PaymentExtensionsCore&&typeof window.PaymentExtensionsCore.sync==='function')await window.PaymentExtensionsCore.sync();
        await refreshAfterChange();
        if(typeof window.renderMain==='function')window.renderMain();
        return;
      }
      if(task.workflow_kind==='accounts_confirmation'||task.workflow_kind==='cheque_clearance'||task.workflow_kind==='payment_receipt'){
        if(!outcome)throw new Error('Select an outcome.');
        if(task.workflow_kind==='cheque_clearance'&&outcome==='still_pending'&&!nextDate)throw new Error('Select the next clearance check date.');
        await resolvePaymentWorkflow(task,outcome,note,nextDate);
        removePanel();await refreshAfterChange();return;
      }
      if(collectionOutcomeTask(task)){
        if(!outcome)throw new Error('Select an outcome.');
        if(outcome==='partial_payment_commitment'){
          await createPartialPaymentCommitment(task,note);removePanel();await refreshAfterChange();return;
        }
        var result=await resolveCollectionOutcome(task,outcome,note,nextDate);
        removePanel();await refreshAfterChange();
        if(result==='payment')await openPaymentFromTask(task);
        return;
      }
      var now=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'completed',completed_at:now,completion_note:note,updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;removePanel();await refreshAfterChange();
      if(next){var c=customerForUnit(task.unit_id);if(c){state.selectedUnit=c.unit+'::'+c.sno;state.view='detail';window.setTimeout(function(){openForm(null);},0);}}
    }catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not save this outcome.';err.style.display='block';}if(save){save.disabled=false;save.textContent='Try Again';}}
  }

  async function cancelTask(task){
    var btn=document.getElementById('saCancelTask'),err=document.getElementById('saError');if(btn){btn.disabled=true;btn.textContent='Cancelling…';}
    try{var now=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'cancelled',cancelled_at:now,updated_at:now}).eq('id',task.id).select().single();if(r.error)throw r.error;removePanel();await refreshAfterChange();}catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not cancel this action.';err.style.display='block';}if(btn){btn.disabled=false;btn.textContent='Cancel Scheduled Action';}}
  }

  async function refreshAfterChange(){await loadTasks(true);renderScheduledViews();}
  function renderScheduledViews(){ensureStyles();ensureMenuItem();renderDetailTasks();renderOverviewTasks();}

  function ensureMenuItem(){
    if(!canUse()||!window.state||state.view!=='detail')return;var c=currentCustomer(),menu=document.getElementById('customerActionMenu');if(!c||!menu||document.getElementById('actionScheduleAction'))return;
    var b=document.createElement('button');b.type='button';b.id='actionScheduleAction';b.textContent='Schedule Action';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
    var notes=document.getElementById('actionViewNotes');if(notes&&notes.parentNode===menu)notes.insertAdjacentElement('afterend',b);else menu.appendChild(b);
    b.onclick=function(e){e.preventDefault();e.stopPropagation();openForm(null);};
  }

  function install(){
    if(!window.state||!window.sb||typeof window.renderDetail!=='function'||typeof window.renderOverview!=='function'){setTimeout(install,60);return;}
    ensureStyles();
    window.__sunblissRefreshScheduledActions=function(){return loadTasks(true);};
  window.__sunblissScheduledActionRows=function(){return cache.loaded?cache.rows:null;};
  window.__sunblissEnsureScheduledActions=async function(){await loadTasks(false);renderScheduledViews();};
    var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    var ro=window.renderOverview;window.renderOverview=function(){var out=ro.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    loadTasks(false).then(renderScheduledViews).catch(function(){});
    window.addEventListener('pageshow',function(){loadTasks(true).then(renderScheduledViews).catch(function(){});});
  }
  install();
})();
