(function(){
  'use strict';
  if (window.__sunblissOverviewCleanupInstalled) return;
  window.__sunblissOverviewCleanupInstalled = true;

  var taskCache={rows:[],loadedAt:0,loading:null};
  var enhancementTimers=[];

  function norm(value){return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g,' ');}
  function safe(value){return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch];});}
  function todayIso(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function formatShortDate(value){if(!value)return'';var d=new Date(String(value).slice(0,10)+'T00:00:00');if(isNaN(d.getTime()))return String(value);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});}
  function priorityRank(value){var p=String(value||'Medium').toLowerCase();return p==='high'?0:p==='medium'?1:2;}
  function customerForUnitId(unitId){if(!window.state||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return Number(c&&c.sno)===Number(unitId);})||null;}
  function customerForUnitCode(unit){if(!window.state||!Array.isArray(state.dues))return null;var key=norm(unit);return state.dues.find(function(c){return norm(c&&c.unit)===key;})||null;}
  function openCustomer(customer){if(!customer)return;if(typeof window.goToDetail==='function'){window.goToDetail(customer.unit,customer.sno,'overview');return;}if(!window.state)return;state.selectedUnit=customer.unit+'::'+customer.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain();}
  function makeKeyboardClickable(node,customer){if(!node||!customer)return;node.classList.add('sb-v2-row-clickable');node.setAttribute('role','button');node.tabIndex=0;node.onclick=function(){openCustomer(customer);};node.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openCustomer(customer);}};}

  function removeSectionByPrefixes(prefixes){
    var overview=document.querySelector('.overview');
    if(!overview)return;
    Array.prototype.slice.call(overview.querySelectorAll('.section-label')).forEach(function(label){
      var value=norm(label.textContent);
      if(!prefixes.some(function(prefix){return value.indexOf(prefix)===0;}))return;
      var next=label.nextElementSibling;
      if(next && (next.classList.contains('list') || next.classList.contains('all-tasks-empty'))) next.remove();
      label.remove();
    });
  }

  function removeRedundantFinancialPercentages(){
    ['btnCollected','btnOutstanding'].forEach(function(id){
      var cell=document.getElementById(id);
      if(!cell)return;
      var sub=cell.querySelector('.stat-sub');
      if(!sub)return;
      Array.prototype.slice.call(sub.childNodes).forEach(function(node){
        if(node.nodeType!==3)return;
        node.nodeValue=String(node.nodeValue||'').replace(/\s*\d+(?:\.\d+)?%\s+of\s+sales\s*/ig,' ');
      });
      if(!norm(sub.textContent))sub.remove();
    });
  }

  function removeCollectionMetricSelector(){
    var selectors=document.querySelectorAll('#sbV2CollectionMode,#sbRefOverviewV2 .sb-v2-collection .sb-v2-select');
    selectors.forEach(function(selector){selector.remove();});
  }
  function removeStatusViewAll(){document.querySelectorAll('#sbRefOverviewV2 .sb-v2-status .sb-v2-view').forEach(function(button){button.remove();});}
  function removeBottomPanelViewAll(){document.querySelectorAll('#sbRefOverviewV2 .sb-v2-bottom .sb-v2-view').forEach(function(button){button.remove();});}

  function enhanceRecentActivity(){
    var panel=document.querySelector('#sbRefOverviewV2 .sb-v2-bottom .sb-v2-panel:first-child');
    if(!panel)return;
    panel.querySelectorAll('.sb-v2-row').forEach(function(row){
      if(row.dataset.activityEnhanced==='1')return;
      var copy=row.children[1];
      if(!copy)return;
      var raw=String(copy.textContent||'').trim();
      var match=raw.match(/^Payment received from Unit\s+(.+?)\s+·\s+(.+)$/i);
      if(!match)return;
      var unit=match[1].trim(),name=match[2].trim(),customer=customerForUnitCode(unit);
      copy.className='sb-v2-activity-copy';
      copy.innerHTML='<strong>'+safe(unit)+' · '+safe(name)+'</strong><small>Payment received</small>';
      row.dataset.activityEnhanced='1';
      makeKeyboardClickable(row,customer);
    });
  }

  function insightWeight(row){
    var label=norm(row.textContent),countEl=row.querySelector('.sb-v2-count'),count=Number(countEl&&countEl.textContent)||0,base=0;
    if(label.indexOf('overdue payments')>=0)base=400;
    else if(label.indexOf('payments due within next 7 days')>=0)base=300;
    else if(label.indexOf('spa signature')>=0)base=200;
    else if(label.indexOf('oqood registration')>=0)base=100;
    return (count>0?1000:0)+base+Math.min(count,99)/100;
  }
  function prioritizeQuickInsights(){
    var panels=document.querySelectorAll('#sbRefOverviewV2 .sb-v2-bottom .sb-v2-panel');
    if(panels.length<2)return;
    var list=panels[1].querySelector('.sb-v2-list');
    if(!list)return;
    var rows=Array.prototype.slice.call(list.querySelectorAll(':scope > .sb-v2-row'));
    rows.sort(function(a,b){return insightWeight(b)-insightWeight(a);});
    rows.forEach(function(row){list.appendChild(row);});
  }

  function loadOperationalTasks(force){
    if(!window.sb)return Promise.resolve(taskCache.rows);
    if(taskCache.loading)return taskCache.loading;
    if(!force&&Date.now()-taskCache.loadedAt<15000)return Promise.resolve(taskCache.rows);
    taskCache.loading=sb.from('scheduled_actions')
      .select('id,unit_id,action_label,due_date,priority,status')
      .eq('status','pending')
      .gte('due_date',todayIso())
      .order('due_date',{ascending:true})
      .order('id',{ascending:true})
      .limit(20)
      .then(function(result){
        taskCache.loading=null;
        taskCache.loadedAt=Date.now();
        if(result.error)return taskCache.rows;
        taskCache.rows=(result.data||[]).slice().sort(function(a,b){
          var date=String(a.due_date||'').localeCompare(String(b.due_date||''));
          if(date)return date;
          var priority=priorityRank(a.priority)-priorityRank(b.priority);
          if(priority)return priority;
          return Number(a.id||0)-Number(b.id||0);
        });
        return taskCache.rows;
      }).catch(function(){taskCache.loading=null;return taskCache.rows;});
    return taskCache.loading;
  }

  function taskCustomerCopy(task){
    var customer=customerForUnitId(task.unit_id),unit=customer&&customer.unit?customer.unit:'Unit '+task.unit_id,name=customer&&customer.name?customer.name:'Customer';
    return{customer:customer,unit:unit,name:name};
  }
  function todayTaskHtml(task){
    var p=String(task.priority||'Medium').toLowerCase(),info=taskCustomerCopy(task);
    return '<div class="sb-v2-action-row sb-v2-operational-row" data-unit-id="'+safe(task.unit_id)+'"><span class="sb-v2-task-dot '+safe(p)+'"></span><span class="sb-v2-action-copy"><strong>'+safe(task.action_label||'Follow-up')+'</strong><small>'+safe(info.unit)+' · '+safe(info.name)+'</small></span><span class="sb-v2-priority '+safe(p)+'">'+safe(task.priority||'Medium')+'</span></div>';
  }
  function nextTaskHtml(task){
    var info=taskCustomerCopy(task);
    return '<div class="sb-v2-next-action" data-unit-id="'+safe(task.unit_id)+'"><span class="sb-v2-next-kicker">Next</span><span class="sb-v2-action-copy"><strong>'+safe(task.action_label||'Follow-up')+'</strong><small>'+safe(info.unit)+' · '+safe(info.name)+' · '+safe(task.priority||'Medium')+' priority</small></span><span class="sb-v2-time">'+safe(formatShortDate(task.due_date))+'</span></div>';
  }
  function bindOperationalRows(host,rows){
    host.querySelectorAll('[data-unit-id]').forEach(function(row){var customer=customerForUnitId(row.getAttribute('data-unit-id'));makeKeyboardClickable(row,customer);});
  }
  function renderOperationalActions(rows){
    var host=document.getElementById('sbV2Actions');
    if(!host)return;
    var today=todayIso(),todayRows=(rows||[]).filter(function(task){return String(task.due_date||'').slice(0,10)===today;});
    if(todayRows.length){
      host.innerHTML=todayRows.slice(0,4).map(todayTaskHtml).join('');
      bindOperationalRows(host,todayRows);
      return;
    }
    var next=(rows||[])[0]||null;
    host.innerHTML='<div class="sb-v2-no-today"><strong>No actions today</strong><span>Your scheduled workload is clear for today.</span></div>'+(next?nextTaskHtml(next):'<div class="sb-v2-no-upcoming">No upcoming scheduled actions.</div>');
    if(next)bindOperationalRows(host,[next]);
  }

  function cleanupStatic(){
    if(!window.state || state.view!=='overview')return;
    var emptyLabel=document.getElementById('sunblissAllTasksEmptyLabel');
    var empty=document.getElementById('sunblissAllTasksEmpty');
    if(emptyLabel)emptyLabel.remove();
    if(empty)empty.remove();
    removeSectionByPrefixes(['top overdue accounts']);
    removeSectionByPrefixes(['all tasks','follow-up tasks']);
    removeRedundantFinancialPercentages();
    removeCollectionMetricSelector();
    removeStatusViewAll();
    removeBottomPanelViewAll();
    enhanceRecentActivity();
    prioritizeQuickInsights();
  }

  function enhance(forceTasks){
    if(!window.state||state.view!=='overview')return;
    cleanupStatic();
    if(!document.getElementById('sbV2Actions'))return;
    loadOperationalTasks(!!forceTasks).then(function(rows){if(window.state&&state.view==='overview')renderOperationalActions(rows);});
  }

  function scheduleEnhancement(forceTasks){
    enhancementTimers.forEach(function(timer){clearTimeout(timer);});
    enhancementTimers=[];
    [0,120,720,1400,2600].forEach(function(delay,index){
      enhancementTimers.push(setTimeout(function(){enhance(!!forceTasks&&index===0);},delay));
    });
  }

  function install(){
    if(!document.getElementById('sunblissCollectionMetricSelectorCleanupStyle')){
      var style=document.createElement('style');
      style.id='sunblissCollectionMetricSelectorCleanupStyle';
      style.textContent='@media(min-width:1024px){body.sunbliss-ref-desktop #sbV2CollectionMode,body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-collection .sb-v2-select,body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-status .sb-v2-view,body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-bottom .sb-v2-view{display:none!important}.sb-v2-activity-copy,.sb-v2-action-copy{min-width:0;display:flex;flex-direction:column;gap:3px}.sb-v2-activity-copy strong,.sb-v2-action-copy strong{font:600 10.5px/1.2 Inter,sans-serif;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sb-v2-activity-copy small,.sb-v2-action-copy small{font:500 9px/1.2 Inter,sans-serif;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sb-v2-row-clickable{cursor:pointer}.sb-v2-row-clickable:focus-visible{outline:2px solid rgba(198,151,46,.45);outline-offset:-2px;border-radius:6px}.sb-v2-task-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);justify-self:center}.sb-v2-task-dot.high{background:var(--rust)}.sb-v2-task-dot.medium{background:var(--amber)}.sb-v2-task-dot.low{background:var(--sage)}.sb-v2-no-today{min-height:52px;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid rgba(220,210,182,.50)}.sb-v2-no-today strong{font:650 10.5px/1.2 Inter,sans-serif;color:var(--ink)}.sb-v2-no-today span,.sb-v2-no-upcoming{margin-top:4px;font:500 9.5px/1.3 Inter,sans-serif;color:var(--muted)}.sb-v2-next-action{min-height:52px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px}.sb-v2-next-kicker{font:700 8.5px/1 Inter,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--gold-deep)}.sb-v2-no-upcoming{padding:14px 0}.sb-v2-bottom .sb-v2-mini{width:26px;height:26px;border-radius:7px}.sb-v2-bottom .sb-v2-mini svg{width:15px;height:15px}}';
      document.head.appendChild(style);
    }
    if(typeof window.renderOverview!=='function'){setTimeout(install,50);return;}
    var base=window.renderOverview;
    if(!base.__sunblissOverviewOperationalWrapped){
      window.renderOverview=function(){var out=base.apply(this,arguments);scheduleEnhancement(false);return out;};
      window.renderOverview.__sunblissOverviewOperationalWrapped=true;
    }
    window.addEventListener('pageshow',function(){taskCache.loadedAt=0;scheduleEnhancement(true);});
    window.addEventListener('focus',function(){scheduleEnhancement(false);});
    scheduleEnhancement(true);
  }
  install();
})();
