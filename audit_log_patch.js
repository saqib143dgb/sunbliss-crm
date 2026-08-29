(function(){
  'use strict';
  if (window.__sunblissAuditLogInstalled) return;
  window.__sunblissAuditLogInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function money(value){
    var n=Number(value)||0;
    return 'AED '+n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function dateLabel(value){
    if (!value) return '—';
    var d=new Date(String(value).slice(0,10)+'T00:00:00');
    if (isNaN(d.getTime())) return text(value);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function dateTimeLabel(value){
    if (!value) return '—';
    var d=new Date(value);
    if (isNaN(d.getTime())) return text(value);
    return d.toLocaleString('en-GB',{
      timeZone:'Asia/Dubai',
      day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true
    })+' Dubai time';
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){
      return c && (String(c.unit||'')+'::'+String(c.sno||''))===String(state.selectedUnit);
    }) || null;
  }

  function ensureStyles(){
    if (document.getElementById('sunblissAuditLogStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissAuditLogStyles';
    style.textContent=[
      '#auditLogOverlay{position:fixed;inset:0;z-index:3800;background:rgba(15,26,38,.62);display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));overflow:auto}',
      '#auditLogDialog{width:min(720px,100%);max-height:min(88vh,820px);overflow:auto;background:var(--paper,#fff);border:1px solid var(--paper-line,rgba(0,0,0,.12));border-radius:18px;box-shadow:0 24px 70px rgba(15,26,38,.38)}',
      '.audit-log-head{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 18px 14px;background:var(--paper,#fff);border-bottom:1px solid var(--paper-line,rgba(0,0,0,.1))}',
      '.audit-log-title{font-family:Fraunces,serif;font-size:22px;line-height:1.15;margin:0;color:var(--ink,#17212b)}',
      '.audit-log-sub{font:500 12px/1.45 Inter,Arial,sans-serif;color:var(--muted,#667085);margin:5px 0 0}',
      '.audit-log-close{flex:none;width:34px;height:34px;border:1px solid var(--paper-line,rgba(0,0,0,.12));border-radius:9px;background:transparent;color:var(--ink,#17212b);font-size:22px;line-height:30px;cursor:pointer}',
      '.audit-log-body{padding:16px 18px 20px}',
      '.audit-log-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 13px;padding:10px 12px;border-radius:10px;background:var(--paper-dim,#f7f7f5);border:1px solid var(--paper-line,rgba(0,0,0,.08));font:600 12px/1.3 Inter,Arial,sans-serif}',
      '.audit-log-summary span:last-child{font-family:IBM Plex Mono,monospace}',
      '.audit-log-card{border:1px solid var(--paper-line,rgba(0,0,0,.1));border-radius:13px;padding:14px;margin:0 0 11px;background:var(--paper,#fff)}',
      '.audit-log-card:last-child{margin-bottom:0}',
      '.audit-log-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}',
      '.audit-log-stage{font:750 14px/1.25 Inter,Arial,sans-serif;color:var(--ink,#17212b)}',
      '.audit-log-badge{flex:none;border-radius:999px;padding:4px 8px;background:rgba(180,35,24,.08);color:#9b1c1c;font:700 10px/1.2 Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em}',
      '.audit-log-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;margin-bottom:11px}',
      '.audit-log-meta{min-width:0}',
      '.audit-log-meta span{display:block;font:600 10px/1.25 Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#667085);margin-bottom:3px}',
      '.audit-log-meta strong{display:block;font:650 12px/1.4 Inter,Arial,sans-serif;color:var(--ink,#17212b);word-break:break-word}',
      '.audit-log-reason{padding:10px 11px;border-left:3px solid rgba(180,35,24,.45);background:rgba(180,35,24,.045);border-radius:8px;font:500 12px/1.5 Inter,Arial,sans-serif;color:var(--ink,#17212b)}',
      '.audit-log-reason b{font-weight:750}',
      '.audit-log-empty{padding:26px 16px;text-align:center;border:1px dashed var(--paper-line,rgba(0,0,0,.16));border-radius:12px;color:var(--muted,#667085);font:500 12px/1.55 Inter,Arial,sans-serif}',
      '.audit-log-error{padding:12px;border-radius:10px;background:rgba(180,35,24,.07);color:#9b1c1c;font:600 12px/1.5 Inter,Arial,sans-serif}',
      '#auditLogStandalone{margin:8px 0 4px}',
      '@media(min-width:641px){#auditLogOverlay{align-items:center}}',
      '@media(max-width:520px){.audit-log-grid{grid-template-columns:1fr}.audit-log-head{padding:16px 15px 13px}.audit-log-body{padding:14px 15px 18px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeAuditLog(){
    var overlay=document.getElementById('auditLogOverlay');
    if (overlay) overlay.remove();
  }

  async function loadDeletedInstallments(c){
    var result=await sb.from('payment_schedule_deletion_log')
      .select('id,schedule_id,customer_id,unit_id,stage_name,deleted_row,reason,deleted_at,deleted_by')
      .eq('unit_id',c.sno)
      .order('deleted_at',{ascending:false});
    if (result.error) throw result.error;
    var rows=Array.isArray(result.data)?result.data:[];
    var names={};
    var ids=[];
    rows.forEach(function(row){
      if (row.deleted_by && ids.indexOf(row.deleted_by)<0) ids.push(row.deleted_by);
    });
    if (ids.length){
      try{
        var profiles=await sb.from('profiles').select('id,full_name').in('id',ids);
        if (!profiles.error && Array.isArray(profiles.data)){
          profiles.data.forEach(function(p){ names[p.id]=p.full_name || 'CRM user'; });
        }
      }catch(ignore){}
    }
    return {rows:rows,names:names};
  }

  function renderAuditRows(c,payload){
    var body=document.getElementById('auditLogBody');
    if (!body) return;
    var rows=payload.rows || [];
    var names=payload.names || {};
    if (!rows.length){
      body.innerHTML='<div class="audit-log-empty"><b>No deleted installments.</b><br>This unit does not currently have any installment-deletion history.</div>';
      return;
    }
    var html='<div class="audit-log-summary"><span>Deleted installment records</span><span>'+rows.length+'</span></div>';
    rows.forEach(function(row){
      var original=row.deleted_row || {};
      var by=names[row.deleted_by] || 'CRM user';
      html+='<article class="audit-log-card">'+
        '<div class="audit-log-card-top"><div class="audit-log-stage">'+safe(row.stage_name || original.stage_name || 'Installment')+'</div><div class="audit-log-badge">Deleted</div></div>'+
        '<div class="audit-log-grid">'+
          '<div class="audit-log-meta"><span>Original due amount</span><strong>'+safe(money(original.due_amount))+'</strong></div>'+
          '<div class="audit-log-meta"><span>Original due date</span><strong>'+safe(dateLabel(original.due_date))+'</strong></div>'+
          '<div class="audit-log-meta"><span>Original status</span><strong>'+safe(original.status || '—')+'</strong></div>'+
          '<div class="audit-log-meta"><span>Original paid amount</span><strong>'+safe(money(original.paid_amount))+'</strong></div>'+
          '<div class="audit-log-meta"><span>Deleted by</span><strong>'+safe(by)+'</strong></div>'+
          '<div class="audit-log-meta"><span>Deleted on</span><strong>'+safe(dateTimeLabel(row.deleted_at))+'</strong></div>'+
        '</div>'+
        '<div class="audit-log-reason"><b>Reason:</b> '+safe(row.reason || 'No reason recorded')+'</div>'+
      '</article>';
    });
    body.innerHTML=html;
  }

  async function openAuditLog(c){
    ensureStyles();
    closeAuditLog();
    var overlay=document.createElement('div');
    overlay.id='auditLogOverlay';
    overlay.innerHTML='<section id="auditLogDialog" role="dialog" aria-modal="true" aria-labelledby="auditLogTitle">'+
      '<div class="audit-log-head"><div><h3 class="audit-log-title" id="auditLogTitle">Audit log</h3><p class="audit-log-sub">Unit '+safe(c.unit)+' · '+safe(c.name || '')+' · Deleted installments</p></div><button type="button" class="audit-log-close" id="auditLogClose" aria-label="Close audit log">&times;</button></div>'+
      '<div class="audit-log-body" id="auditLogBody"><div class="audit-log-empty">Loading audit history…</div></div>'+
      '</section>';
    document.body.appendChild(overlay);
    document.getElementById('auditLogClose').onclick=closeAuditLog;
    overlay.addEventListener('click',function(ev){ if (ev.target===overlay) closeAuditLog(); });
    var escapeHandler=function(ev){
      if (ev.key==='Escape'){
        closeAuditLog();
        document.removeEventListener('keydown',escapeHandler);
      }
    };
    document.addEventListener('keydown',escapeHandler);
    try{
      var payload=await loadDeletedInstallments(c);
      renderAuditRows(c,payload);
    }catch(error){
      var body=document.getElementById('auditLogBody');
      if (body) body.innerHTML='<div class="audit-log-error">'+safe(error && error.message ? error.message : 'Could not load the audit log.')+'</div>';
    }
  }

  function actionButton(){
    var button=document.createElement('button');
    button.type='button';
    button.id='actionAuditLog';
    button.textContent='Audit log';
    button.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
    return button;
  }

  function installAction(){
    if (!window.state || !window.sb || state.view!=='detail') return;
    var c=currentCustomer();
    if (!c) return;
    var menu=document.getElementById('customerActionMenu');
    if (menu && !document.getElementById('actionAuditLog')){
      var button=actionButton();
      button.onclick=function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        menu.style.display='none';
        var menuButton=document.getElementById('customerActionMenuButton');
        if (menuButton) menuButton.setAttribute('aria-expanded','false');
        openAuditLog(c);
      };
      menu.appendChild(button);
      return;
    }
    if (state.userRole==='manager' && !menu && !document.getElementById('auditLogStandalone')){
      var detail=document.querySelector('.detail');
      var badges=detail && detail.querySelector('.badges');
      if (!detail) return;
      var standalone=document.createElement('button');
      standalone.type='button';
      standalone.id='auditLogStandalone';
      standalone.className='btn-paper';
      standalone.textContent='Audit log';
      standalone.onclick=function(){ openAuditLog(c); };
      if (badges && badges.parentNode) badges.parentNode.insertBefore(standalone,badges.nextSibling);
      else detail.insertBefore(standalone,detail.firstChild);
    }
  }

  var observer=new MutationObserver(function(){ installAction(); });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensureStyles();
  installAction();
})();
