(function(){
  'use strict';

  if (window.__sunblissAllTasksOverviewInstalled) return;
  window.__sunblissAllTasksOverviewInstalled = true;

  function norm(value){
    return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g,' ');
  }

  function findLabel(prefix){
    var labels = document.querySelectorAll('.overview .section-label');
    var key = norm(prefix);
    for (var i=0;i<labels.length;i++){
      if (norm(labels[i].textContent).indexOf(key) === 0) return labels[i];
    }
    return null;
  }

  function listAfter(label){
    if (!label) return null;
    var next = label.nextElementSibling;
    return next && next.classList && next.classList.contains('list') ? next : null;
  }

  function customerForRow(row){
    if (!window.state || !Array.isArray(state.dues) || !row) return null;
    var unit = String(row.getAttribute('data-unit') || '');
    var sno = String(row.getAttribute('data-sno') || '');
    for (var i=0;i<state.dues.length;i++){
      var c = state.dues[i];
      if (String(c.unit || '') === unit && String(c.sno || '') === sno) return c;
    }
    return null;
  }

  function taskDate(customer){
    if (!customer || typeof window.parseAction !== 'function') return null;
    var parsed = window.parseAction(customer.action);
    var value = parsed && parsed.date;
    if (!value) return null;
    var d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function dateText(date){
    if (!date) return '';
    if (typeof window.fmtDate === 'function') return window.fmtDate(date);
    return date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }

  function moneyText(amount){
    if (typeof window.fmtAED === 'function') return window.fmtAED(Number(amount)||0);
    return 'AED ' + (Number(amount)||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }

  function fallbackOverdueInfo(customer){
    var result = {isOverdue:false,overdueAmount:0,stageLabels:[]};
    if (!customer || !Array.isArray(customer.stages)) return result;
    var today = new Date();
    customer.stages.forEach(function(stage){
      var overdue = false;
      if (typeof window.stageStatus === 'function'){
        overdue = window.stageStatus(stage.due,stage.paid,stage.dueDate,today) === 'overdue';
      } else {
        var dueDate = stage.dueDate instanceof Date ? stage.dueDate : (stage.dueDate ? new Date(stage.dueDate) : null);
        var due = Number(stage.due)||0;
        var paid = Number(stage.paid)||0;
        overdue = !!(dueDate && !isNaN(dueDate.getTime()) && dueDate < today && due-paid > 1);
      }
      if (!overdue) return;
      var remaining = Math.max(0,(Number(stage.due)||0)-(Number(stage.paid)||0));
      result.overdueAmount += remaining;
      result.stageLabels.push(String(stage.label || stage.code || 'Installment'));
    });
    result.isOverdue = result.stageLabels.length > 0;
    return result;
  }

  function overdueInfo(customer){
    if (!customer) return {isOverdue:false,overdueAmount:0,stageLabels:[]};
    if (typeof window.customerOverdueInfo === 'function'){
      try {
        var info = window.customerOverdueInfo(customer);
        if (info && Array.isArray(info.stageLabels)) return info;
      } catch (e) {}
    }
    return fallbackOverdueInfo(customer);
  }

  function addMultipleOverdueSummary(row,customer){
    if (!row) return;
    var old = row.querySelector('.multi-overdue-summary');
    if (old) old.remove();

    var info = overdueInfo(customer);
    if (!info || !info.isOverdue || !Array.isArray(info.stageLabels) || info.stageLabels.length < 2) return;

    var main = row.querySelector('.row-main');
    if (!main) return;

    var summary = document.createElement('span');
    summary.className = 'multi-overdue-summary';
    var names = info.stageLabels.join(' + ');
    summary.innerHTML = '<span class="multi-overdue-label">Overdue</span><span class="multi-overdue-stages"></span><strong></strong>';
    summary.querySelector('.multi-overdue-stages').textContent = names;
    summary.querySelector('strong').textContent = 'Total ' + moneyText(info.overdueAmount);
    main.appendChild(summary);
  }

  function ensureStyles(){
    if (document.getElementById('sunblissAllTasksOverviewStyle')) return;
    var style = document.createElement('style');
    style.id = 'sunblissAllTasksOverviewStyle';
    style.textContent = [
      '.all-tasks-date{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--muted);white-space:nowrap;}',
      '.all-tasks-empty{padding:14px 4px 18px;color:var(--muted);font-size:12px;border-top:1px solid var(--paper-line);}',
      '.all-tasks-list .task-row:first-child{border-top:1px solid var(--paper-line);}',
      '.multi-overdue-summary{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:5px;font-size:10.5px;line-height:1.35;color:var(--muted);}',
      '.multi-overdue-label{font-family:"IBM Plex Mono",monospace;font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:var(--rust);}',
      '.multi-overdue-stages{color:var(--ink);}',
      '.multi-overdue-summary strong{font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:600;color:var(--rust);white-space:nowrap;}',
      '@media(max-width:420px){.all-tasks-date{font-size:9px}.all-tasks-list .row-meta{flex-wrap:wrap;}.multi-overdue-summary{font-size:10px;gap:5px}.multi-overdue-summary strong{font-size:9.5px;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function decorateExistingTasks(label,list){
    label.textContent = 'All tasks · newest first';
    list.classList.add('all-tasks-list');

    var rows = Array.prototype.slice.call(list.querySelectorAll('.task-row'));
    rows.sort(function(a,b){
      var ca = customerForRow(a), cb = customerForRow(b);
      var da = taskDate(ca), db = taskDate(cb);
      var ta = da ? da.getTime() : -Infinity;
      var tb = db ? db.getTime() : -Infinity;
      if (tb !== ta) return tb - ta;
      var an = norm(ca && ca.name), bn = norm(cb && cb.name);
      return an.localeCompare(bn);
    });

    rows.forEach(function(row){
      var customer = customerForRow(row);
      var d = taskDate(customer);
      var meta = row.querySelector('.row-meta');
      if (meta){
        var old = meta.querySelector('.all-tasks-date');
        if (old) old.remove();
        if (d){
          var span = document.createElement('span');
          span.className = 'all-tasks-date';
          span.textContent = dateText(d);
          meta.appendChild(span);
        }
      }
      addMultipleOverdueSummary(row,customer);
      list.appendChild(row);
    });
  }

  function ensureEmptyTasks(overview,overdueLabel){
    var label = document.createElement('p');
    label.className = 'section-label';
    label.id = 'sunblissAllTasksEmptyLabel';
    label.textContent = 'All tasks · newest first';

    var empty = document.createElement('div');
    empty.className = 'all-tasks-empty';
    empty.id = 'sunblissAllTasksEmpty';
    empty.textContent = 'No active tasks.';

    var anchor = overdueLabel || overview.querySelector('.footnote');
    if (anchor){
      overview.insertBefore(label,anchor);
      overview.insertBefore(empty,anchor);
    } else {
      overview.appendChild(label);
      overview.appendChild(empty);
    }
    return {label:label,list:empty};
  }

  function decorate(){
    if (!window.state || state.view !== 'overview') return;
    var overview = document.querySelector('.overview');
    if (!overview) return;
    ensureStyles();

    var overdueLabel = findLabel('top overdue accounts');
    var tasksLabel = findLabel('follow-up tasks') || findLabel('all tasks');
    var tasksList = listAfter(tasksLabel);

    var emptyLabel = document.getElementById('sunblissAllTasksEmptyLabel');
    var empty = document.getElementById('sunblissAllTasksEmpty');

    if (tasksLabel && tasksList){
      if (emptyLabel) emptyLabel.remove();
      if (empty) empty.remove();
      decorateExistingTasks(tasksLabel,tasksList);
      if (overdueLabel && overdueLabel.parentNode === overview){
        overview.insertBefore(tasksLabel,overdueLabel);
        overview.insertBefore(tasksList,overdueLabel);
      }
      return;
    }

    if (!emptyLabel || !empty){
      ensureEmptyTasks(overview,overdueLabel);
    } else if (overdueLabel){
      overview.insertBefore(emptyLabel,overdueLabel);
      overview.insertBefore(empty,overdueLabel);
    }
  }

  function install(){
    if (typeof window.renderOverview !== 'function'){
      window.setTimeout(install,50);
      return;
    }
    var base = window.renderOverview;
    window.renderOverview = function(){
      var out = base.apply(this,arguments);
      decorate();
      return out;
    };
    if (window.state && state.view === 'overview') decorate();
  }

  install();
})();
