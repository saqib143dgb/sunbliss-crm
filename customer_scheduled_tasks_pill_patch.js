(function(){
  'use strict';
  if(window.__sunblissCustomerTasksPillInstalled)return;
  window.__sunblissCustomerTasksPillInstalled=true;

  var popover=null;
  var lastKey='';
  var inFlight=null;

  function str(v){return v==null?'':String(v);}
  function esc(v){return str(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function authorized(){return !!(window.state&&(state.userRole==='crm_officer'||state.userRole==='manager'));}
  function currentCustomer(){
    if(!authorized()||state.view!=='detail'||!Array.isArray(state.dues))return null;
    return state.dues.find(function(c){return c&&(str(c.unit)+'::'+str(c.sno))===str(state.selectedUnit);})||null;
  }
  function currentKey(){return window.state&&state.view==='detail'?str(state.selectedUnit):'';}
  function taskRows(){
    return typeof window.__sunblissScheduledActionRows==='function'?window.__sunblissScheduledActionRows():null;
  }
  function activeTasks(c){
    var rows=taskRows();
    if(!c||!Array.isArray(rows))return null;
    return rows.filter(function(t){
      return Number(t.unit_id)===Number(c.sno)&&t.status==='pending'&&t.auto_kind!=='extension_active';
    }).sort(function(a,b){
      return str(a.due_date).localeCompare(str(b.due_date))||Number(a.id)-Number(b.id);
    });
  }
  function dateISO(){
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function dueText(v){
    if(!v)return 'No due date';
    var value=str(v).slice(0,10),dt=new Date(value+'T00:00:00');
    return isNaN(dt.getTime())?value:dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function dueState(v){
    var d=str(v).slice(0,10),today=dateISO();
    if(!d)return {label:'Unscheduled',kind:'upcoming'};
    if(d<today)return {label:'Overdue',kind:'overdue'};
    if(d===today)return {label:'Today',kind:'today'};
    return {label:'Upcoming',kind:'upcoming'};
  }
  function styles(){
    if(document.getElementById('crmCustomerTasksPillStyles'))return;
    var s=document.createElement('style');
    s.id='crmCustomerTasksPillStyles';
    s.textContent=[
      '#crmCustomerTasksPill{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;min-height:35px;padding:7px 11px;border:1px solid var(--paper-line,#ded7c8);border-radius:999px;background:var(--paper-dim,#efe9d9);color:var(--ink,#102333);font:600 11.5px/1.2 CRMInter,Inter,Arial,sans-serif;white-space:nowrap;cursor:pointer;box-shadow:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
      '#crmCustomerTasksPill:focus-visible,.crm-customer-tasks-item:focus-visible{outline:2px solid var(--gold-deep,#a17c36);outline-offset:2px}',
      '#crmCustomerTasksPill .crm-task-count{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 3px;border-radius:999px;background:rgba(69,86,107,.12);font:650 10px/1 CRMInter,Inter,Arial,sans-serif;box-sizing:border-box}',
      '#crmCustomerTasksPill .crm-task-icon{width:15px;height:15px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '#crmCustomerTasksPill .crm-task-count[hidden]{display:none!important}',
      '#crmCustomerTasksPill[hidden]{display:none!important}',
      '.detail .d-name #crmCustomerTasksPill{margin:0!important;min-width:0;max-width:100%;font-size:11px!important;letter-spacing:0!important}',
      '.detail .d-name .crm-customer-task-title{min-width:0;overflow-wrap:anywhere}',
      '#crmCustomerTasksPopover{position:fixed;z-index:30300;box-sizing:border-box;width:min(350px,calc(100vw - 20px));max-height:min(65dvh,500px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--paper-line,#ded7c8);border-radius:13px;background:var(--paper,#faf7ef);color:var(--ink,#102333);box-shadow:0 15px 45px rgba(15,26,38,.20);font-family:CRMInter,Inter,Arial,sans-serif;}',
      '#crmCustomerTasksPopover .crm-customer-tasks-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex:none;padding:13px 14px;border-bottom:1px solid var(--paper-line,#ded7c8)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-title{font-size:13px;font-weight:650}',
      '#crmCustomerTasksPopover .crm-customer-tasks-unit{font-size:10.5px;color:var(--muted,#66635c)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-list{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}',
      '#crmCustomerTasksPopover .crm-customer-tasks-item{display:block;width:100%;margin:0;padding:11px 14px;text-align:left;border:0;border-bottom:1px solid var(--paper-line,#ded7c8);border-radius:0;background:transparent;color:inherit;cursor:pointer;font-family:inherit}',
      '#crmCustomerTasksPopover .crm-customer-tasks-item:last-child{border-bottom:0}',
      '#crmCustomerTasksPopover .crm-customer-tasks-item:hover{background:var(--paper-dim,#efe9d9)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-row{display:flex;align-items:center;justify-content:space-between;gap:7px;font-size:11.5px;font-weight:600;line-height:1.4}',
      '#crmCustomerTasksPopover .crm-customer-tasks-row span:first-child{min-width:0;overflow-wrap:anywhere}',
      '#crmCustomerTasksPopover .crm-customer-tasks-due{flex:none;font-size:10px;white-space:nowrap;color:var(--muted,#66635c)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-due.overdue{color:var(--rust,#ad4732)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-due.today{color:var(--amber,#9c5a12)}',
      '#crmCustomerTasksPopover .crm-customer-tasks-note{margin-top:4px;font-size:10.5px;line-height:1.4;color:var(--muted,#66635c);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '#crmCustomerTasksPopover .crm-customer-tasks-empty{padding:18px 14px;font-size:11.5px;color:var(--muted,#66635c)}',
      '@media(max-width:520px){#crmCustomerTasksPill{min-height:32px;padding:6px 9px;font-size:11px}.detail .d-name #crmCustomerTasksPill{font-size:10.5px!important}.detail .d-name #crmCustomerTasksPill .crm-task-icon{width:13px;height:13px}}'
    ].join('');
    document.head.appendChild(s);
  }
  function updateCount(){
    var button=document.getElementById('crmCustomerTasksPill'),c=currentCustomer();
    if(!button||!c)return;
    var tasks=activeTasks(c),count=button.querySelector('.crm-task-count');
    if(!count)return;
    // Only actionable, pending tasks warrant a customer header control.
    // Keep the pill hidden until the current task list has loaded.
    if(tasks===null){
      button.hidden=true;
      count.hidden=true;
      count.textContent='';
      button.setAttribute('aria-label','Customer scheduled tasks');
    }else{
      button.hidden=tasks.length===0;
      count.hidden=tasks.length===0;
      count.textContent=String(tasks.length);
      button.setAttribute('aria-label',tasks.length+' scheduled tasks for '+str(c.unit));
      if(!tasks.length&&popover)close();
    }
  }
  function close(){
    if(popover){popover.remove();popover=null;}
    var button=document.getElementById('crmCustomerTasksPill');
    if(button)button.setAttribute('aria-expanded','false');
  }
  function place(){
    var button=document.getElementById('crmCustomerTasksPill');
    if(!popover||!button){close();return;}
    var r=button.getBoundingClientRect(),w=Math.min(350,window.innerWidth-20);
    var x=Math.max(10,Math.min(r.right-w,window.innerWidth-w-10));
    var y=r.bottom+8;
    if(y+160>window.innerHeight&&r.top>170)y=Math.max(10,r.top-Math.min(popover.scrollHeight,420)-8);
    popover.style.left=x+'px';
    popover.style.top=y+'px';
    popover.style.maxHeight=Math.max(100,Math.min(500,window.innerHeight-y-12))+'px';
  }
  function content(status){
    if(!popover)return;
    var c=currentCustomer();
    if(!c||currentKey()!==lastKey){close();return;}
    var rows=activeTasks(c);
    var list=popover.querySelector('.crm-customer-tasks-list');
    var subtitle=popover.querySelector('.crm-customer-tasks-unit');
    subtitle.textContent='Unit '+str(c.unit)+(rows?' · '+rows.length+' active':'');
    if(status==='loading'){list.innerHTML='<div class="crm-customer-tasks-empty">Loading tasks…</div>';return;}
    if(status==='error'){list.innerHTML='<div class="crm-customer-tasks-empty">Could not load tasks. Close and try again.</div>';return;}
    if(!rows){list.innerHTML='<div class="crm-customer-tasks-empty">Loading tasks…</div>';return;}
    if(!rows.length){list.innerHTML='<div class="crm-customer-tasks-empty">No active scheduled tasks for this customer.</div>';return;}
    list.innerHTML=rows.map(function(t){
      var state=dueState(t.due_date),note=str(t.note).trim(),label=str(t.action_label)||'Scheduled action';
      return '<button type="button" class="crm-customer-tasks-item" data-customer-task-id="'+esc(t.id)+'" aria-label="Open '+esc(label)+'"><div class="crm-customer-tasks-row"><span>'+esc(label)+'</span><span class="crm-customer-tasks-due '+state.kind+'">'+esc(state.label)+'</span></div><div class="crm-customer-tasks-note">'+esc(dueText(t.due_date))+(note?' · '+esc(note):'')+'</div></button>';
    }).join('');
  }
  async function open(){
    var c=currentCustomer(),button=document.getElementById('crmCustomerTasksPill');
    if(!c||!button)return;
    if(popover){close();return;}
    close();lastKey=currentKey();
    popover=document.createElement('div');
    popover.id='crmCustomerTasksPopover';
    popover.setAttribute('role','dialog');
    popover.setAttribute('aria-label','Scheduled tasks for this customer');
    popover.innerHTML='<div class="crm-customer-tasks-head"><span class="crm-customer-tasks-title">Scheduled Tasks</span><span class="crm-customer-tasks-unit"></span></div><div class="crm-customer-tasks-list"></div>';
    document.body.appendChild(popover);
    button.setAttribute('aria-expanded','true');
    content('loading');place();
    try{
      if(typeof window.__sunblissRefreshScheduledActions==='function')await window.__sunblissRefreshScheduledActions();
      if(popover&&currentKey()===lastKey){updateCount();content();place();}
    }catch(_e){if(popover&&currentKey()===lastKey)content('error');}
  }
  function insert(){
    if(!authorized()){close();return;}
    var c=currentCustomer(),detail=document.querySelector('.detail');
    if(!c||!detail){close();return;}
    var button=document.getElementById('crmCustomerTasksPill');
    var heading=detail.querySelector('.d-name');
    if(!heading)return;
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.id='crmCustomerTasksPill';
      button.hidden=true;
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-expanded','false');
      button.innerHTML='<svg class="crm-task-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 2 2 4-4"/></svg><span>Tasks</span><span class="crm-task-count" hidden></span>';
      button.addEventListener('click',function(e){e.stopPropagation();open();});
    }
    var actionButton=heading.querySelector('#customerActionMenuButton');
    if(actionButton&&actionButton.parentNode){
      var actionWrap=actionButton.parentNode;
      actionWrap.style.gap='7px';
      if(button.parentNode!==actionWrap||button.nextElementSibling!==actionButton)actionWrap.insertBefore(button,actionButton);
    }else{
      if(!heading.querySelector('.crm-customer-task-title')){
        var title=document.createElement('span');
        title.className='crm-customer-task-title';
        while(heading.firstChild)title.appendChild(heading.firstChild);
        heading.appendChild(title);
        heading.style.display='flex';
        heading.style.alignItems='center';
        heading.style.justifyContent='space-between';
        heading.style.gap='9px';
      }
      if(button.parentNode!==heading)heading.appendChild(button);
    }
    updateCount();
    if(typeof window.__sunblissEnsureScheduledActions==='function'){
      Promise.resolve(window.__sunblissEnsureScheduledActions()).then(function(){
        if(currentKey()===str(c.unit)+'::'+str(c.sno))updateCount();
      }).catch(function(){});
    }
  }
  document.addEventListener('click',function(e){
    var task=e.target&&e.target.closest?e.target.closest('#crmCustomerTasksPopover [data-customer-task-id]'):null;
    if(task){
      var id=task.getAttribute('data-customer-task-id');
      close();
      if(typeof window.__sunblissOpenScheduledAction==='function')window.__sunblissOpenScheduledAction(id);
      return;
    }
    if(popover&&e.target&&!popover.contains(e.target)&&!e.target.closest('#crmCustomerTasksPill'))close();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&popover)close();});
  window.addEventListener('resize',function(){if(popover)place();});
  window.addEventListener('scroll',function(){if(popover)place();},true);
  window.addEventListener('sunbliss:scheduled-actions-updated',function(){updateCount();if(popover){content();place();}});
  function install(){
    if(typeof window.renderDetail!=='function'||typeof window.__sunblissScheduledActionRows!=='function'){
      window.setTimeout(install,75);return;
    }
    styles();
    var original=window.renderDetail;
    window.renderDetail=function(){
      close();
      var output=original.apply(this,arguments);
      insert();
      return output;
    };
    if(currentCustomer())insert();
  }
  install();
})();