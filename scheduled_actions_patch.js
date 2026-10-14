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
    // Do not cache the anonymous startup response as an authenticated empty list.
    if(!window.sb||!canUse())return[];
    if(cache.loaded&&!force)return cache.rows;
    if(cache.loading)return cache.loading;
    cache.loading=(async function(){
      var r=await sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,transaction_id,workflow_kind,spa_sale_id,spa_step,spa_data,commitment_part_id,extension_request_id,modification_request_id,created_at,updated_at,completed_at,completion_note,cancelled_at').order('due_date',{ascending:true}).order('id',{ascending:true});
      if(r.error)throw r.error;
      cache.rows=r.data||[];cache.loaded=true;cache.loading=null;return cache.rows;
    })().catch(function(e){cache.loading=null;throw e;});
    return cache.loading;
  }

  function pendingForUnit(unitId){return cache.rows.filter(function…10779 tokens truncated…ndow.__sunblissEnsureScheduledActions=async function(){await loadTasks(false);renderScheduledViews();};
    var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    var ro=window.renderOverview;window.renderOverview=function(){var out=ro.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    loadTasks(false).then(renderScheduledViews).catch(function(){});
    window.addEventListener('pageshow',function(){loadTasks(true).then(renderScheduledViews).catch(function(){});});
  }
  install();
})();
