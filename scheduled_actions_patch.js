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
      '.scheduled-task-state.outstanding{background:rgba(162,124,53,.11);color:var(--gold-deep)}',
      '.scheduled-task-state.extension{background:rgba(156,90,18,.09);color:var(--amber)}',
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
      '.scheduled-outstanding-row:before{background:var(--gold-deep)!important}',
      '.scheduled-outstanding-amount{display:flex;flex-direction:column;align-items:flex-end;gap:2px;text-align:right;white-space:nowrap}',
      '.scheduled-outstanding-value{font:750 13px/1.2 Inter,sans-serif;color:var(--ink)}',
      '.scheduled-outstanding-label{font:600 8.5px/1.2 IBM Plex Mono,monospace;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}',
      '.scheduled-empty{padding:18px 2px;color:var(--muted);font-size:12px}',
      '#scheduledActionPanel .scheduled-form-summary{margin:-2px 0 14px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font-size:11.5px;line-height:1.45;color:var(--muted)}',
      '#scheduledActionPanel select,#scheduledActionPanel input,#scheduledActionPanel textarea{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.25 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box}',
      '#scheduledActionPanel textarea{min-height:100px;resize:vertical}',
      '#scheduledActionPanel .scheduled-danger{margin-top:10px;width:100%;justify-content:center;color:var(--rust)}',
      '.scheduled-next-check{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;font-size:11.5px;line-height:1.4;color:var(--muted)}',
      '.scheduled-next-check input{width:auto!important;margin:1px 0 0!important}',
      '@media(max-width:520px){.scheduled-task-actions{flex-direction:column}.scheduled-task-actions button{width:100%}.scheduled-overview-row{grid-template-columns:1fr}.scheduled-overview-done{width:100%}.scheduled-overview-head{align-items:flex-start}.scheduled-overview-select{max-width:155px}.scheduled-outstanding-amount{align-items:flex-start;text-align:left;padding-top:2px}}'
    ].join('');document.head.appendChild(s);
  }

  async function loadTasks(force){
    if(!window.sb)return[];
    if(cache.loaded&&!force)return cache.rows;
    if(cache.loading&&!force)return cache.loading;
    cache.loading=(async function(){
      var r=await sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,created_at,updated_at,completed_at,completion_note,cancelled_at').order('due_date',{ascending:true}).order('id',{ascending:true});
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
    var rows=cc.s.filter(function(r){if(Number(r&&r.unit_id)!==Number(c.sno)||!paymentStage(r))return false;var applied=stageKind(r)==='dld'?0:(Number(credit[r.id])||0);return Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-applied)>1;}).map(function(r){var applied=stageKind(r)==='dld'?0:(Number(credit[r.id])||0),due=ext[String(r.id)]||text(r.revised_due_date||r.due_date).slice(0,10),remaining=Math.max(0,(Number(r.due_amount)||0)-(Number(r.paid_amount)||0)-applied);return{row:r,due:due,remaining:remaining,kind:stageKind(r)};}).sort(function(a,b){return text(a.due).localeCompare(text(b.due))||Number(a.row.id)-Number(b.row.id);});
    var dp=rows.filter(function(x){return x.kind==='dp';});if(dp.length)return dp;
    var pre=rows.filter(function(x){return x.kind==='first'||x.kind==='dld';});if(pre.length)return pre;
    return rows.filter(function(x){return x.kind==='later';});
  }
  function relatedPaymentField(c,selected){
    var rows=relatedPaymentRows(c);if(!rows.length)return'';var chosen=selected==='auto'?Number(rows[0].row.id):Number(selected)||0;
    return '<label class="brand-field">Related payment<select id="saRelatedSchedule"><option value="">General customer follow-up</option>'+rows.map(function(x){var r=x.row;return'<option value="'+r.id+'"'+(Number(r.id)===chosen?' selected':'')+'>'+safe(r.stage_name)+' · '+safe(formatDate(x.due))+' · '+safe(typeof window.fmtAED==='function'?window.fmtAED(x.remaining):x.remaining)+'</option>';}).join('')+'</select></label>';
  }
  function stateForTask(t){var today=todayIso(0),tomorrow=todayIso(1),date=text(t.due_date);if(t.status==='completed')return{key:'completed',label:'Completed'};if(date<today)return{key:'overdue',label:'Overdue'};if(date===today)return{key:'today',label:'Today'};if(date===tomorrow)return{key:'tomorrow',label:'Tomorrow'};return{key:'upcoming',label:'Upcoming'};}

  function outstandingAmount(c){
    var balance=Number(c&&c.outstanding);
    return isFinite(balance)&&balance<-1?Math.round(Math.abs(balance)*100)/100:0;
  }
  function outstandingCustomers(){
    if(!window.state||!Array.isArray(state.dues))return[];
    return state.dues.filter(function(c){return outstandingAmount(c)>1;}).map(function(c){
      return{customer:c,amount:outstandingAmount(c),status:outstandingStatus(c)};
    }).sort(function(a,b){
      var rank={overdue:0,today:1,extension:2,upcoming:3,outstanding:4};
      var ar=rank[a.status.key]===undefined?4:rank[a.status.key],br=rank[b.status.key]===undefined?4:rank[b.status.key];
      return ar-br||text(a.status.date).localeCompare(text(b.status.date))||b.amount-a.amount||text(a.customer.unit).localeCompare(text(b.customer.unit),undefined,{numeric:true});
    });
  }
  function outstandingStatus(c){
    var today=todayIso(0),core=window.PaymentExtensionsCore,C=core&&core.cache,activeIds={},activeDates=[];
    if(core&&typeof core.active==='function'){
      core.active().forEach(function(e){
        if(Number(e&&e.unit_id)!==Number(c.sno))return;
        activeIds[String(e.payment_schedule_id)]=true;
        if(e.extended_due_date)activeDates.push(text(e.extended_due_date).slice(0,10));
      });
    }
    var open=[];
    if(C&&Array.isArray(C.s)&&typeof core.remaining==='function'){
      var credits=typeof core.creditMap==='function'?core.creditMap():{};
      C.s.forEach(function(r){
        if(Number(r&&r.unit_id)!==Number(c.sno)||!paymentStage(r))return;
        var remaining=core.remaining(r,credits),date=text(r.revised_due_date||r.due_date).slice(0,10);
        if(remaining>1)open.push({id:r.id,date:date,label:text(r.stage_name)});
      });
    }else{
      (c.stages||[]).forEach(function(r){
        var remaining=Math.max(0,(Number(r&&r.due)||0)-(Number(r&&r.paid)||0));
        var date=r&&r.dueDate instanceof Date&&!isNaN(r.dueDate)?todayIsoFromDate(r.dueDate):'';
        if(remaining>1)open.push({id:r&&r.id,date:date,label:text(r&&r.label)});
      });
    }
    var unextended=open.filter(function(r){return !activeIds[String(r.id)];});
    var overdue=unextended.filter(function(r){return r.date&&r.date<today;}).sort(function(a,b){return a.date.localeCompare(b.date);});
    if(overdue.length)return{key:'overdue',label:'Overdue',date:overdue[0].date,next:overdue[0].label};
    var dueToday=unextended.filter(function(r){return r.date===today;});
    if(dueToday.length)return{key:'today',label:'Due Today',date:today,next:dueToday[0].label};
    if(activeDates.length){activeDates.sort();return{key:'extension',label:'Extension Active',date:activeDates[0],next:'Extended payment'};}
    var future=unextended.filter(function(r){return r.date>today;}).sort(function(a,b){return a.date.localeCompare(b.date);});
    if(future.length)return{key:'upcoming',label:'Upcoming',date:future[0].date,next:future[0].label};
    return{key:'outstanding',label:'Outstanding',date:'',next:text(c.upStage)||'Balance pending'};
  }
  function todayIsoFromDate(d){var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);}
  function renderOutstandingList(host){
    var rows=outstandingCustomers();
    if(!rows.length){host.innerHTML='<div class="scheduled-empty">No customers have an outstanding balance.</div>';return;}
    host.innerHTML=rows.map(function(item){
      var c=item.customer,st=item.status,detail=st.next||'Balance pending';
      if(st.date)detail+=' · '+formatDate(st.date);
      return '<div class="scheduled-overview-row scheduled-outstanding-row"><div class="scheduled-overview-main" data-open-unit="'+safe(c.sno)+'"><div class="scheduled-overview-unit">'+safe(c.unit||'Unit '+c.sno)+' · '+safe(c.name||'Customer')+'</div><div class="scheduled-overview-title">'+safe(detail)+'</div><div class="scheduled-overview-meta"><span class="scheduled-task-state '+safe(st.key)+'">'+safe(st.label)+'</span></div></div><div class="scheduled-outstanding-amount"><span class="scheduled-outstanding-value">'+safe(typeof window.fmtAED==='function'?window.fmtAED(item.amount):'AED '+item.amount.toLocaleString('en-AE'))+'</span><span class="scheduled-outstanding-label">Total outstanding</span></div></div>';
    }).join('');
    bindCustomerLinks(host);
  }
  function bindCustomerLinks(host){
    host.querySelectorAll('[data-open-unit]').forEach(function(el){el.onclick=function(){var c=customerForUnit(Number(el.getAttribute('data-open-unit')));if(!c)return;if(typeof window.goToDetail==='function')window.goToDetail(c.unit,c.sno,'overview');else{state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain();}};});
  }

  function renderDetailTasks(){
    if(!window.state||state.view!=='detail')return;
    var c=currentCustomer(),detail=document.querySelector('.detail');if(!c||!detail)return;
    var old=document.getElementById('scheduledActionsDetail');if(old)old.remove();
    var tasks=pendingForUnit(c.sno);if(!tasks.length)return;
    var section=document.createElement('section');section.id='scheduledActionsDetail';section.className='scheduled-actions-detail';
    section.innerHTML='<div class="scheduled-actions-heading"><p class="section-label">Scheduled Action'+(tasks.length>1?'s':'')+'</p><span class="scheduled-actions-count">'+tasks.length+' pending</span></div>'+
      tasks.map(function(t){var st=stateForTask(t);return '<div class="scheduled-task-card" data-task-id="'+t.id+'" data-priority="'+safe(t.priority)+'"><div class="scheduled-task-top"><div><div class="scheduled-task-title">'+safe(t.action_label)+'</div><div class="scheduled-task-meta"><span class="scheduled-task-state '+st.key+'">'+safe(st.label)+'</span><span>'+safe(t.priority)+' priority</span><span>'+safe(formatDate(t.due_date))+'</span></div></div><div class="scheduled-task-date">'+safe(formatDate(t.due_date))+'</div></div>'+(t.note?'<p class="scheduled-task-note">'+safe(t.note)+'</p>':'')+'<div class="scheduled-task-actions"><button type="button" class="btn btn-gold scheduled-mark-done" data-task-id="'+t.id+'">Mark Done</button><button type="button" class="btn-paper scheduled-edit" data-task-id="'+t.id+'">Edit / Reschedule</button></div></div>';}).join('');
    var anchor=document.getElementById('actionRequiredCard');
    if(anchor&&anchor.parentNode)anchor.insertAdjacentElement('afterend',section);else{var badges=detail.querySelector('.badges');if(badges)badges.insertAdjacentElement('afterend',section);else detail.insertBefore(section,detail.firstChild);}
    bindTaskButtons(section);
  }

  function filterRows(kind){
    var today=todayIso(0),tomorrow=todayIso(1),rows=cache.rows.slice();
    if(kind==='completed')return rows.filter(function(t){return t.status==='completed';}).sort(function(a,b){return text(b.completed_at||b.updated_at).localeCompare(text(a.completed_at||a.updated_at));});
    rows=rows.filter(function(t){return t.status==='pending';});
    if(kind==='overdue')rows=rows.filter(function(t){return text(t.due_date)<today;});
    else if(kind==='today')rows=rows.filter(function(t){return text(t.due_date)===today;});
    else if(kind==='tomorrow')rows=rows.filter(function(t){return text(t.due_date)===tomorrow;});
    else if(kind==='upcoming')rows=rows.filter(function(t){return text(t.due_date)>tomorrow;});
    return rows.sort(taskSort);
  }

  function count(kind){
    if(kind==='outstanding')return outstandingCustomers().length;
    if(kind==='extensions')return cache.rows.filter(function(t){return t.status==='pending'&&t.auto_kind==='extension_active';}).length;
    return filterRows(kind).length;
  }
  function overviewOption(value,label){return '<option value="'+value+'"'+(cache.overviewFilter===value?' selected':'')+'>'+safe(label)+' · '+count(value)+'</option>';}
  function renderOverviewTasks(){
    if(!window.state||state.view!=='overview')return;
    var overview=document.querySelector('.overview');if(!overview)return;
    var old=document.getElementById('scheduledActionsOverview');if(old)old.remove();
    var section=document.createElement('section');section.id='scheduledActionsOverview';
    section.innerHTML='<div class="scheduled-overview-head"><p class="section-label">Scheduled Actions</p><select id="scheduledOverviewFilter" class="scheduled-overview-select" aria-label="Scheduled action filter">'+overviewOption('today','Today')+overviewOption('overdue','Overdue')+overviewOption('extensions','Extensions')+overviewOption('outstanding','Outstanding')+'</select></div><div id="scheduledOverviewList" class="scheduled-overview-list"></div>';
    var foot=overview.querySelector('.footnote');if(foot)overview.insertBefore(section,foot);else overview.appendChild(section);
    document.getElementById('scheduledOverviewFilter').onchange=function(){cache.overviewFilter=this.value;renderOverviewList();};
    renderOverviewList();
  }
  function renderOverviewList(){
    var host=document.getElementById('scheduledOverviewList');if(!host)return;
    if(cache.overviewFilter==='outstanding'){renderOutstandingList(host);return;}
    if(cache.overviewFilter==='extensions'){host.innerHTML='<div class="scheduled-empty">Loading active extensions…</div>';return;}
    var rows=filterRows(cache.overviewFilter);
    if(!rows.length){host.innerHTML='<div class="scheduled-empty">No '+safe(cache.overviewFilter==='completed'?'completed':'pending')+' actions in this view.</div>';return;}
    host.innerHTML=rows.map(function(t){var c=customerForUnit(t.unit_id),st=stateForTask(t),name=c?c.name:'Customer',unit=c?c.unit:'Unit '+t.unit_id;var completion=t.status==='completed'&&t.completion_note?'<div class="scheduled-overview-meta">Completed: '+safe(t.completion_note)+'</div>':'';return '<div class="scheduled-overview-row" data-task-id="'+t.id+'"><div class="scheduled-overview-main" data-open-unit="'+safe(t.unit_id)+'"><div class="scheduled-overview-unit">'+safe(unit)+' · '+safe(name)+'</div><div class="scheduled-overview-title">'+safe(t.action_label)+'</div><div class="scheduled-overview-meta"><span class="scheduled-task-state '+st.key+'">'+safe(st.label)+'</span> · '+safe(t.priority)+' · '+safe(formatDate(t.due_date))+(t.note?' · '+safe(t.note):'')+'</div>'+completion+'</div>'+(t.status==='pending'?'<button type="button" class="btn-paper scheduled-overview-done scheduled-mark-done" data-task-id="'+t.id+'">Mark Done</button>':'')+'</div>';}).join('');
    bindCustomerLinks(host);
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
    p.innerHTML='<p class="section-label" style="margin-top:0">'+(task?'Edit Scheduled Action':'Schedule Action')+'</p><p class="scheduled-form-summary">Unit '+safe(c.unit)+' · '+safe(c.name)+(task?' · update or reschedule this action.':' · this action will stay visible on the customer page until completed or cancelled.')+'</p><p class="brand-error" id="saError" style="display:none"></p><label class="brand-field">Action<select id="saAction">'+actionOptions(selectValue)+'</select></label><label class="brand-field" id="saCustomWrap"'+(selectValue==='Other'?'':' style="display:none"')+'>Custom action<input type="text" id="saCustom" maxlength="120" value="'+safe(isKnown?'':current)+'" placeholder="What needs to be done?" /></label>'+relatedPaymentField(c,task?task.schedule_id:'auto')+'<label class="brand-field">Due date<input type="date" id="saDate" value="'+safe(task?task.due_date:'')+'" /></label><label class="brand-field">Priority<select id="saPriority"><option'+((task?task.priority:'Medium')==='High'?' selected':'')+'>High</option><option'+((task?task.priority:'Medium')==='Medium'?' selected':'')+'>Medium</option><option'+((task?task.priority:'Medium')==='Low'?' selected':'')+'>Low</option></select></label><label class="brand-field">Note (optional)<textarea id="saNote" placeholder="Short instruction or customer commitment">'+safe(task&&task.note||'')+'</textarea></label><div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saSave">'+(task?'Save Changes':'Schedule Action')+'</button><button type="button" class="btn-paper" id="saClose">Cancel</button></div>'+(task?'<button type="button" class="btn-paper scheduled-danger" id="saCancelTask">Cancel Scheduled Action</button>':'');
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
    removePanel();var c=customerForUnit(task.unit_id),p=document.createElement('div');p.id='scheduledActionPanel';p.className='brand-editor';p.setAttribute('data-mode','complete');
    p.innerHTML='<p class="section-label" style="margin-top:0">Complete Scheduled Action</p><p class="scheduled-form-summary">'+safe(task.action_label)+' · '+safe(c?('Unit '+c.unit+' · '+c.name):('Unit '+task.unit_id))+' · due '+safe(formatDate(task.due_date))+'</p><p class="brand-error" id="saError" style="display:none"></p><label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="What happened or what did the customer confirm?"></textarea></label><label class="scheduled-next-check"><input type="checkbox" id="saScheduleNext" /><span>Schedule the next action after marking this one done</span></label><div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saComplete">Mark Done</button><button type="button" class="btn-paper" id="saClose">Cancel</button></div>';
    document.body.appendChild(p);document.getElementById('saClose').onclick=removePanel;document.getElementById('saComplete').onclick=function(){completeTask(task);};
  }
  async function completeTask(task){
    var save=document.getElementById('saComplete'),err=document.getElementById('saError'),next=document.getElementById('saScheduleNext')&&document.getElementById('saScheduleNext').checked,note=val('saCompletionNote')||null;
    if(save){save.disabled=true;save.textContent='Completing…';}
    try{var now=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'completed',completed_at:now,completion_note:note,updated_at:now}).eq('id',task.id).select().single();if(r.error)throw r.error;removePanel();await refreshAfterChange();if(next){var c=customerForUnit(task.unit_id);if(c){state.selectedUnit=c.unit+'::'+c.sno;state.view='detail';window.setTimeout(function(){openForm(null);},0);}}}catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not complete this action.';err.style.display='block';}if(save){save.disabled=false;save.textContent='Mark Done';}}
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
    var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    var ro=window.renderOverview;window.renderOverview=function(){var out=ro.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    loadTasks(false).then(renderScheduledViews).catch(function(){});
    window.addEventListener('pageshow',function(){loadTasks(true).then(renderScheduledViews).catch(function(){});});
  }
  install();
})();
