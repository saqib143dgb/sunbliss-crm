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

  function ensureStyles(){
    if (document.getElementById('sunblissAllTasksOverviewStyle')) return;
    var style = document.createElement('style');
    style.id = 'sunblissAllTasksOverviewStyle';
    style.textContent = [
      '.all-tasks-date{font-family:"IBM Plex Mono",monospace;font-size:9.5px;color:var(--muted);white-space:nowrap;}',
      '.all-tasks-empty{padding:14px 4px 18px;color:var(--muted);font-size:12px;border-top:1px solid var(--paper-line);}',
      '.all-tasks-list .task-row:first-child{border-top:1px solid var(--paper-line);}',
      '@media(max-width:420px){.all-tasks-date{font-size:9px}.all-tasks-list .row-meta{flex-wrap:wrap;}}'
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
