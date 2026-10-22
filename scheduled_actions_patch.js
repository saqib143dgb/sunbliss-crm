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
  function customerForUnit(unitId){
    if(!window.state)return null;
    var active=Array.isArray(state.dues)?state.dues.find(function(c){return Number(c&&c.sno)===Number(unitId);}):null;
    if(active)return active;
    // Preserve task identity after the original booking moves to the cancelled archive.
    var cancelled=Array.isArray(state.cancelled)?state.cancelled.find(function(c){return Number(c&&c.sno)===Number(unitId);}):null;
    if(cancelled)return Object.assign({},cancelled,{status:'Cancelled'});
    var archive=window.__sunblissCancelledUnitArchive;
    var record=archive&&Array.isArray(archive.records)?archive.records.find(function(r){return Number(r&&r.cancel&&r.cancel.unit_id)===Number(unitId);}):null;
    return record?{sno:Number(unitId),unit:record.unitNo,name:record.customer&&record.customer.customer_name||'Former customer',status:'Cancelled'}:null;
  }
  function canUse(){return !!(window.state&&(state.userRole==='crm_officer'||state.userRole==='manager'));}
  function managerOnly(){return window.state&&state.userRole==='manager';}
  function managementApproval(t){
    if(!t||t.status!=='pending')return false;
    if(t.workflow_kind==='extension_approval')return true;
    if(t.workflow_kind==='spa')return t.spa_step==='approval';
    if(t.workflow_kind==='modification_request')return /^Management (?:Re[- ]?)?Approval(?:\s|$)/i.test(text(t.action_label));
    return !t.workflow_kind&&/^Management (?:Re[- ]?)?Approval(?:\s|$)/i.test(text(t.action_label));
  }
  function visibleTask(t){return !managerOnly()||managementApproval(t);}
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
       '#scheduledActionPanel .sa-payment-selector{border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);margin:5px 0;overflow:hidden}',
       '#scheduledActionPanel .sa-payment-selector>summary{cursor:pointer;padding:10px 11px;font:600 12px/1.45 Inter,sans-serif;color:var(--ink);list-style-position:inside}',
       '#scheduledActionPanel .sa-payment-list{max-height:260px;overflow:auto;border-top:1px solid var(--paper-line);padding:4px 8px}',
       '#scheduledActionPanel .sa-payment-option{display:flex!important;align-items:flex-start;gap:10px;padding:9px 4px;margin:0;border-bottom:1px solid var(--paper-line);cursor:pointer;color:var(--ink)}',
       '#scheduledActionPanel .sa-payment-option:last-child{border-bottom:0}',
       '#scheduledActionPanel .sa-payment-option input[type="checkbox"]{appearance:auto!important;display:inline-block!important;width:17px!important;min-width:17px!important;height:17px!important;padding:0!important;margin:2px 0 0!important;flex:none;accent-color:var(--gold-deep,#A27C35)}',
       '#scheduledActionPanel .sa-payment-option-text{display:block;flex:1;min-width:0;font:600 12px/1.35 Inter,sans-serif}',
       '#scheduledActionPanel .sa-payment-option-details{display:block;color:var(--muted);font:400 11px/1.4 Inter,sans-serif;margin-top:3px}',
       '#scheduledActionPanel .sa-payment-total{font:600 11px/1.4 Inter,sans-serif;color:var(--muted);margin:5px 1px 13px}',
      '#scheduledActionPanel .scheduled-danger{margin-top:10px;width:100%;justify-content:center;color:var(--rust)}',
      '.scheduled-next-check{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;font-size:11.5px;line-height:1.4;color:var(--muted)}',
      '.scheduled-next-check input{width:auto!important;margin:1px 0 0!important}',
      '.scheduled-outcome-help{margin:0 0 10px;font-size:11.5px;line-height:1.45;color:var(--muted)}',
      '.scheduled-outcome-current{margin:0 0 12px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);font-size:11.5px;line-height:1.45;color:var(--ink)}',
      '@media(max-width:520px){.scheduled-task-actions{flex-direction:column}.scheduled-task-actions button{width:100%}.scheduled-overview-row{grid-template-columns:1fr}.scheduled-overview-done{width:100%}.scheduled-overview-head{align-items:flex-start}.scheduled-overview-select{max-width:155px}}'
    ].join('');
    s.textContent+="@media(max-width:1023px){\nbody.crm-scheduled-ui-open{overflow:hidden!important;overscroll-behavior:none!important}\nbody.crm-scheduled-ui-open #app>.topbar,body.crm-scheduled-ui-open>.tabs,body.crm-scheduled-ui-open #sunblissPersistentBackDock,body.crm-scheduled-ui-open #sunblissDockSearchPanel{visibility:hidden!important;pointer-events:none!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel,body.crm-scheduled-ui-open>#scheduledActionPanel.crm-full-page-inline{position:fixed!important;inset:auto!important;top:var(--crm-vtop,0px)!important;left:0!important;right:0!important;bottom:auto!important;z-index:30090!important;display:flex!important;flex-direction:column!important;gap:0!important;width:100%!important;max-width:100%!important;height:var(--crm-vh,100dvh)!important;max-height:var(--crm-vh,100dvh)!important;min-height:0!important;margin:0!important;padding:calc(14px + env(safe-area-inset-top)) 16px calc(14px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;overflow:hidden!important;box-sizing:border-box!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel>.section-label{display:none!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel>.crm-scheduled-head{display:flex!important;align-items:center!important;gap:15px!important;flex:0 0 auto!important;margin:0 0 22px!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-back{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:none!important;width:30px!important;height:42px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:var(--ink,#102333)!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-title{margin:0!important;font:700 24px/1.25 CRMInter,Inter,Arial,sans-serif!important;letter-spacing:-.025em!important;color:var(--ink,#102333)!important;overflow-wrap:anywhere!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel>.crm-scheduled-scroll{display:block!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;margin:0!important;padding:18px 15px 21px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-bottom:0!important;border-radius:14px 14px 0 0!important;background:transparent!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-scroll .brand-field{display:block!important;min-width:0!important;margin:0 0 18px!important;font:400 11.5px/1.4 CRMInter,Inter,Arial,sans-serif!important;color:var(--muted,#66635c)!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-scroll .brand-field :is(input:not([type=\"checkbox\"]),textarea,select){display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:46px!important;margin:7px 0 0!important;padding:10px 12px!important;border:1px solid var(--paper-line,#ded7c8)!important;border-radius:8px!important;background:var(--paper-dim,#efe9d9)!important;color:var(--ink,#102333)!important;font:500 16px/1.25 CRMInter,Inter,Arial,sans-serif!important;box-sizing:border-box!important;box-shadow:none!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .scheduled-form-summary{margin:0 0 16px!important;padding:10px 11px!important;font:400 11.5px/1.5 CRMInter,Inter,Arial,sans-serif!important;color:var(--muted,#66635c)!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-scroll .scheduled-next-check input[type=\"checkbox\"]{width:18px!important;height:18px!important;flex:none!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel>.crm-scheduled-actions,body.crm-scheduled-ui-open>#scheduledActionPanel.crm-full-page-inline>.crm-scheduled-actions{position:relative!important;bottom:auto!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;gap:10px!important;flex:0 0 auto!important;margin:0 -16px calc(-14px - env(safe-area-inset-bottom))!important;padding:12px 16px calc(32px + env(safe-area-inset-bottom))!important;border-top:1px solid var(--paper-line,#ded7c8)!important;background:var(--paper,#faf7ef)!important;box-shadow:none!important;z-index:9!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel>.crm-scheduled-actions>button,body.crm-scheduled-ui-open>#scheduledActionPanel.crm-full-page-inline>.crm-scheduled-actions>button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;min-height:48px!important;height:auto!important;margin:0!important;padding:10px 8px!important;border-radius:999px!important;font:600 14px/1.3 CRMInter,Inter,Arial,sans-serif!important;white-space:nowrap!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-scroll .scheduled-danger{display:flex!important;width:100%!important;min-height:42px!important;justify-content:center!important;margin:12px 0 0!important}\nbody.crm-scheduled-ui-open>#scheduledActionPanel .crm-scheduled-scroll .task-next-preview{margin:12px 0!important}\n}";
    document.head.appendChild(s);
  }

  async function loadTasks(force){
    // Do not cache the anonymous startup response as an authenticated empty list.
    if(!window.sb||!canUse())return[];
    if(cache.loaded&&!force)return cache.rows;
    if(cache.loading)return cache.loading;
    cache.loading=(async function(){
      var r=await sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,transaction_id,workflow_kind,spa_step,commitment_part_id,extension_request_id,modification_request_id,created_at,updated_at,completed_at,completion_note,cancelled_at').order('due_date',{ascending:true}).order('id',{ascending:true});
      if(r.error)throw r.error;
      cache.rows=r.data||[];
      // Cancelled units are archived asynchronously. Resolve their unit numbers before listing their tasks.
      var archive=window.__sunblissCancelledUnitArchive;
      if(archive&&archive.loading){try{await archive.loading;}catch(_e){}}
      cache.loaded=true;cache.loading=null;return cache.rows;
    })().catch(function(e){cache.loading=null;throw e;});
    return cache.loading;
  }

  function pendingForUnit(unitId){return cache.rows.filter(function(t){return Number(t.unit_id)===Number(unitId)&&t.status==='pending'&&visibleTask(t);}).sort(taskSort);}
  function taskSort(a,b){var d=text(a.due_date).localeCompare(text(b.due_date));if(d)return d;var p={High:0,Medium:1,Low:2};return (p[a.priority]||1)-(p[b.priority]||1)||Number(a.id)-Number(b.id);}
  function stageKind(r){var n=text(r&&r.stage_name).toLowerCase().replace(/instalment/g,'installment');if(!n||n.indexOf('booking')>=0)return'';if(n.indexOf('dld')>=0||n.indexOf('admin fee')>=0)return'dld';if(n.indexOf('down payment')>=0)return'dp';if(/\b(1st|first)\b/.test(n)&&n.indexOf('installment')>=0)return'first';if(n.indexOf('installment')>=0||n.indexOf('final')>=0)return'later';return'';}
  function paymentStage(r){return!!stageKind(r);}
  function idsFromKey(k){var m=text(k).match(/\|schedules?:([0-9,]+)/);return m?m[1].split(',').map(Number):[];}
  function isPaymentAction(action){return /(payment|installment|dld|admin fee|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection)/i.test(text(action));}

  function linkedPaymentIds(t){
    if(!t)return [];
    var ids=idsFromKey(t.auto_key);
    return ids.length>1?ids:(t.schedule_id!=null?[Number(t.schedule_id)]:ids);
  }
  function selectedPaymentIds(panel){
    return Array.from((panel||document).querySelectorAll('#saPaymentList input[name="saPaymentIds"]:checked'))
      .map(function(x){return Number(x.value)}).filter(function(n){return Number.isInteger(n)&&n>0})
      .filter(function(n,i,a){return a.indexOf(n)===i}).sort(function(a,b){return a-b;});
  }
  function userNoteOnly(v){return text(v).split('\n\n[Related payments]')[0].trim();}
  function selectedPaymentNote(note,rows){
    if(rows.length<2)return note||null;
    var total=Math.round(rows.reduce(function(n,x){return n+x.remaining},0)*100)/100;
    return (note?note+'\n\n':'')+'[Related payments]\n'
      +rows.map(function(x){return x.name+' · '+formatDate(x.due)+' · AED '+x.remaining.toLocaleString('en-AE',{minimumFractionDigits:2,maximumFractionDigits:2})+' outstanding';}).join('\n')
      +'\nTotal outstanding · AED '+total.toLocaleString('en-AE',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function relatedPaymentField(){
    return '<div class="brand-field"><span>Related payments</span>'
      +'<details class="sa-payment-selector" id="saPaymentSelector"><summary id="saPaymentSelectorSummary">Loading payments…</summary>'
      +'<div class="sa-payment-list" id="saPaymentList">Loading outstanding installments…</div></details>'
      +'<p class="sa-payment-total" id="saPaymentTotal">Select one, multiple, or none for a general follow-up.</p></div>';
  }
  async function loadRelatedPaymentChoices(c,task,panel){
    var list=panel.querySelector('#saPaymentList'),summary=panel.querySelector('#saPaymentSelectorSummary'),total=panel.querySelector('#saPaymentTotal');
    if(!list)return;
    try{
      var q=await Promise.all([
        sb.from('current_payment_schedule').select('id,unit_id,stage_name,due_amount,revised_due_amount,due_date,revised_due_date,paid_amount,status').eq('unit_id',Number(c.sno)),
        sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',Number(c.sno)),
        sb.from('payment_extensions').select('payment_schedule_id,extended_due_date,status').eq('unit_id',Number(c.sno)).eq('status','active')
      ]);
      q.forEach(function(r){if(r.error)throw r.error;});
      if(!panel.isConnected)return;
      var credit={},extensions={};
      (q[1].data||[]).forEach(function(x){var k=String(x.payment_schedule_id);credit[k]=(credit[k]||0)+(Number(x.amount)||0);});
      (q[2].data||[]).forEach(function(x){if(x.payment_schedule_id&&x.extended_due_date)extensions[String(x.payment_schedule_id)]=text(x.extended_due_date).slice(0,10);});
      var linked=linkedPaymentIds(task);
      var rows=(q[0].data||[]).filter(paymentStage).map(function(r){
        var amount=Number(r.revised_due_amount==null?r.due_amount:r.revised_due_amount)||0;
        var remaining=Math.round(Math.max(0,amount-(Number(r.paid_amount)||0)-(credit[String(r.id)]||0))*100)/100;
        return {id:Number(r.id),name:text(r.stage_name),due:extensions[String(r.id)]||text(r.revised_due_date||r.due_date).slice(0,10),remaining:remaining};
      }).filter(function(x){return x.remaining>.01||linked.indexOf(x.id)>=0;})
        .sort(function(a,b){return text(a.due).localeCompare(text(b.due))||a.id-b.id;});
      panel.__saPaymentRows=rows;
      if(!rows.length){list.textContent='No outstanding payments. Leave unselected for a general follow-up.';summary.textContent='General customer follow-up';total.textContent='No outstanding payment stages available.';return;}
      list.innerHTML=rows.map(function(x){
        return '<label class="sa-payment-option"><input type="checkbox" name="saPaymentIds" value="'+x.id+'"'+(linked.indexOf(x.id)>=0?' checked':'')+'><span class="sa-payment-option-text">'+safe(x.name)+'<span class="sa-payment-option-details">'+safe(formatDate(x.due))+' · '+safe(typeof window.fmtAED==='function'?window.fmtAED(x.remaining):'AED '+x.remaining.toLocaleString('en-AE',{maximumFractionDigits:2}))+' outstanding</span></span></label>';
      }).join('');
      function update(){
        var ids=selectedPaymentIds(panel),chosen=rows.filter(function(x){return ids.indexOf(x.id)>=0;});
        var sum=Math.round(chosen.reduce(function(n,x){return n+x.remaining},0)*100)/100;
        summary.textContent=chosen.length?chosen.length+' payment'+(chosen.length===1?'':'s')+' selected':'Select payment(s)';
        total.textContent=chosen.length?'Selected outstanding: '+(typeof window.fmtAED==='function'?window.fmtAED(sum):'AED '+sum.toLocaleString('en-AE',{maximumFractionDigits:2})):'No payments selected — general customer follow-up';
      }
      list.addEventListener('change',update);update();
    }catch(e){
      list.textContent='Could not load payment stages. Reopen to try again.';
      summary.textContent='Payments unavailable';total.textContent='Could not verify outstanding payments.';
      panel.__saPaymentRows=null;
    }
  }
  function stateForTask(t){var today=todayIso(0),tomorrow=todayIso(1),date=text(t.due_date);if(t.status==='completed')return{key:'completed',label:'Completed'};if(t.workflow_kind==='modification_request'&&/in progress/i.test(text(t.action_label)))return{key:'inprogress',label:'In Progress'};if(date<today)return{key:'overdue',label:'Overdue'};if(date===today)return{key:'today',label:'Today'};if(date===tomorrow)return{key:'tomorrow',label:'Tomorrow'};return{key:'upcoming',label:'Upcoming'};}
  function addDaysIso(n){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+(Number(n)||0));var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);}
  function isBookingWelcome(t){return text(t&&t.auto_key).indexOf('booking_welcome|')===0;}
  function taskButtonLabel(t){if(t&&t.auto_kind==='credit_note_send')return'Mark Sent';if(collectionOutcomeTask(t))return'Open';if(isBookingWelcome(t))return'Mark Sent';if(t&&t.workflow_kind)return'Open';if(t&&t.auto_kind==='overdue_follow_up')return'Open';if(t&&t.auto_kind==='demand_letter')return'Open';if(t&&t.auto_kind==='gentle_reminder')return'Mark Sent';return'Mark Done';}
  function collectionOutcomeTask(t){return !!(t&&(['overdue_follow_up','extension_residual_overdue','extension_uncovered_overdue'].indexOf(t.auto_kind)>=0||(!t.workflow_kind&&!t.auto_kind&&!isBookingWelcome(t)&&/collect.*payment|payment.*follow|follow.*payment|installment.*follow|dld.*follow/i.test(text(t.action_label)))||['promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment'].indexOf(text(t.workflow_kind))>=0));}

  function renderDetailTasks(){var old=document.getElementById('scheduledActionsDetail');if(old)old.remove();}

  function filterRows(kind){
    var today=todayIso(0),tomorrow=todayIso(1),rows=cache.rows.filter(visibleTask);
    if(managerOnly())return rows.sort(taskSort);
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
    section.innerHTML='<div class="scheduled-overview-head"><p class="section-label">Scheduled Actions</p><select id="scheduledOverviewFilter" class="scheduled-overview-select" aria-label="Scheduled action filter">'+overviewOption('today','Today')+overviewOption('tomorrow','Tomorrow')+overviewOption('overdue','Overdue')+overviewOption('modifications',(window.matchMedia&&window.matchMedia('(max-width:520px)').matches)?'Modification Req.':'Modification\u00A0Request')+overviewOption('upcoming','Upcoming')+overviewOption('completed','Completed')+'</select></div><div id="scheduledOverviewList" class="scheduled-overview-list"></div>';
    if(managerOnly()){section.querySelector('.section-label').textContent='Management Approvals';section.querySelector('select').innerHTML='<option value="approvals">Pending approvals · '+filterRows('approvals').length+'</option>';}
    var foot=overview.querySelector(':scope > .footnote');if(foot)overview.insertBefore(section,foot);else overview.appendChild(section);
    document.getElementById('scheduledOverviewFilter').onchange=function(){cache.overviewFilter=this.value;renderOverviewList();};
    renderOverviewList();
  }
  function renderOverviewList(){
    var host=document.getElementById('scheduledOverviewList');if(!host)return;
    var rows=filterRows(cache.overviewFilter);
    if(!rows.length&&managerOnly()){host.innerHTML='<div class="scheduled-empty">No tasks awaiting management approval.</div>';return;}
    if(!rows.length){host.innerHTML='<div class="scheduled-empty">No '+safe(cache.overviewFilter==='completed'?'completed':'pending')+' actions in this view.</div>';return;}
    host.innerHTML=rows.map(function(t){var c=customerForUnit(t.unit_id),st=stateForTask(t),name=c?c.name:'Customer',unit=c?c.unit:'Unit '+t.unit_id;var completion=t.status==='completed'&&t.completion_note?'<div class="scheduled-overview-meta">Completed: '+safe(t.completion_note)+'</div>':'';return '<div class="scheduled-overview-row" data-task-id="'+t.id+'"><div class="scheduled-overview-main" data-open-unit="'+safe(t.unit_id)+'"><div class="scheduled-overview-unit">'+safe(unit)+' · '+safe(name)+'</div><div class="scheduled-overview-title">'+safe(t.action_label)+'</div><div class="scheduled-overview-meta"><span class="scheduled-task-state '+st.key+'">'+safe(st.label)+'</span> · '+safe(t.priority)+' · '+safe(formatDate(t.due_date))+(t.note?' · '+safe(t.note):'')+'</div>'+completion+'</div>'+(t.status==='pending'?'<button type="button" class="btn-paper scheduled-overview-done scheduled-mark-done" data-task-id="'+t.id+'">'+safe(taskButtonLabel(t))+'</button>':'')+'</div>';}).join('');
    host.querySelectorAll('[data-open-unit]').forEach(function(el){el.onclick=function(){
      var id=Number(el.getAttribute('data-open-unit')),c=customerForUnit(id);
      var wrapper=el.closest('[data-task-id]'),task=wrapper?taskById(wrapper.getAttribute('data-task-id')):null;
      // A cancelled booking has no active customer detail page. Open the existing task instead.
      if(!c||c.status==='Cancelled'){if(task&&task.status==='pending')openComplete(task);return;}
      if(typeof window.goToDetail==='function')window.goToDetail(c.unit,c.sno,'overview');
      else{state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain();}
    };});
    bindTaskButtons(host);
  }

  function taskById(id){return cache.rows.find(function(t){return Number(t.id)===Number(id);})||null;}
  function bindTaskButtons(root){
    root.querySelectorAll('.scheduled-mark-done').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();var t=taskById(btn.getAttribute('data-task-id'));if(t)openComplete(t);};});
    root.querySelectorAll('.scheduled-edit').forEach(function(btn){btn.onclick=function(e){e.preventDefault();e.stopPropagation();var t=taskById(btn.getAttribute('data-task-id'));if(t)openForm(t);};});
  }

  function removePanel(){var p=document.getElementById('scheduledActionPanel');if(p)p.remove();document.body.classList.remove('crm-scheduled-ui-open');}
  function actionOptions(current){return ACTIONS.map(function(a){return '<option value="'+safe(a)+'"'+(a===current?' selected':'')+'>'+safe(a)+'</option>';}).join('');}
  /* Original Scheduled Actions form owns all workflow and date values.
     This only groups existing DOM controls under the approved mobile frame. */
  function scheduledRootUi(panel){
    if(!panel||!document.body)return;
    var mobile=window.matchMedia?window.matchMedia('(max-width:1023px)').matches:window.innerWidth<=1023;
    if(!mobile)return;
    var actions=panel.querySelector('.brand-editor-actions');
    if(!actions||panel.querySelector('.crm-scheduled-head'))return;
    var label=panel.querySelector('.section-label');
    var title=label?label.textContent.trim():'Scheduled Action';
    var header=document.createElement('div');header.className='crm-scheduled-head';
    header.innerHTML='<button type="button" class="crm-scheduled-back" aria-label="Back to customer"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="crm-scheduled-title">'+safe(title)+'</h2>';
    header.querySelector('button').onclick=removePanel;
    panel.insertBefore(header,panel.firstChild);
    var card=document.createElement('div');card.className='crm-scheduled-scroll';
    Array.from(panel.children).forEach(function(el){
      if(el===header||el===actions||el===label)return;
      card.appendChild(el);
    });
    panel.insertBefore(card,actions);
    actions.classList.add('crm-scheduled-actions');
    document.body.classList.add('crm-scheduled-ui-open');
  }

  function openForm(task){
    removePanel();closeActionMenu();var c=task?customerForUnit(task.unit_id):currentCustomer();if(!c)return;
    var current=task?task.action_label:'Payment follow-up',isKnown=ACTIONS.indexOf(current)>=0,selectValue=isKnown?current:'Other';
    var p=document.createElement('div');p.id='scheduledActionPanel';p.className='brand-editor';p.setAttribute('data-mode',task?'edit':'new');
    p.innerHTML='<p class="section-label" style="margin-top:0">'+(task?'Edit Scheduled Action':'Schedule Action')+'</p><p class="scheduled-form-summary">Unit '+safe(c.unit)+' · '+safe(c.name)+(task?' · update or reschedule this action.':' · this action will stay in Scheduled Actions on the overview until completed or cancelled.')+'</p><p class="brand-error" id="saError" style="display:none"></p><label class="brand-field">Action<select id="saAction">'+actionOptions(selectValue)+'</select></label><label class="brand-field" id="saCustomWrap"'+(selectValue==='Other'?'':' style="display:none"')+'>Custom action<input type="text" id="saCustom" maxlength="120" value="'+safe(isKnown?'':current)+'" placeholder="What needs to be done?" /></label>'+relatedPaymentField()+'<label class="brand-field">Due date<input type="date" id="saDate" value="'+safe(task?task.due_date:'')+'" /></label><label class="brand-field">Priority<select id="saPriority"><option'+((task?task.priority:'Medium')==='High'?' selected':'')+'>High</option><option'+((task?task.priority:'Medium')==='Medium'?' selected':'')+'>Medium</option><option'+((task?task.priority:'Medium')==='Low'?' selected':'')+'>Low</option></select></label><label class="brand-field">Note (optional)<textarea id="saNote" placeholder="Short instruction or customer commitment">'+safe(userNoteOnly(task&&task.note))+'</textarea></label><div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saSave">'+(task?'Save Changes':'Schedule Action')+'</button><button type="button" class="btn-paper" id="saClose">Cancel</button></div>'+(task?'<button type="button" class="btn-paper scheduled-danger" id="saCancelTask">Cancel Scheduled Action</button>':'');
    document.body.appendChild(p);
    scheduledRootUi(p);
    loadRelatedPaymentChoices(c,task,p);
    document.getElementById('saAction').onchange=function(){document.getElementById('saCustomWrap').style.display=this.value==='Other'?'block':'none';};
    document.getElementById('saClose').onclick=removePanel;
    document.getElementById('saSave').onclick=function(){saveTask(c,task);};
    if(task)document.getElementById('saCancelTask').onclick=function(){cancelTask(task);};
  }

  function val(id){var el=document.getElementById(id);return el?text(el.value).trim():'';}
  async function saveTask(c,task){
    var panel=document.getElementById('scheduledActionPanel'),err=document.getElementById('saError'),save=document.getElementById('saSave');
    var action=val('saAction')==='Other'?val('saCustom'):val('saAction'),due=val('saDate'),priority=val('saPriority'),note=val('saNote')||null;
    function fail(msg){if(err){err.textContent=msg;err.style.display='block';}}
    if(action.length<2){fail('Enter the action you need to complete.');return;}
    if(!due){fail('Select a due date.');return;}
    if(!panel||!Array.isArray(panel.__saPaymentRows)){fail('Payment stages have not loaded. Reopen the form and try again.');return;}
    var ids=selectedPaymentIds(panel),all=panel.__saPaymentRows,chosen=ids.map(function(id){return all.find(function(x){return x.id===id;});}).filter(Boolean);
    if(ids.length!==chosen.length){fail('Payment selection changed. Reopen the form and select again.');return;}
    if(save){save.disabled=true;save.textContent='Saving…';}if(err)err.style.display='none';
    try{
      var related=ids.length===1?ids[0]:null,
        autoKey=ids.length>1?'manual_payment|unit:'+Number(c.sno)+'|schedules:'+ids.join(','):
          related?'manual_payment|unit:'+Number(c.sno)+'|schedule:'+related:null,
        payload={action_label:action,due_date:due,priority:priority,note:selectedPaymentNote(note,chosen),
          source:'manual',auto_kind:null,schedule_id:related,auto_key:autoKey,updated_at:new Date().toISOString()},r;
      if(!task&&related){
        var conflict=cache.rows.find(function(t){return Number(t.unit_id)===Number(c.sno)&&t.status==='pending'&&t.source==='manual'&&
          !t.auto_kind&&Number(t.schedule_id)===related&&!t.transaction_id&&!t.commitment_part_id&&
          !t.extension_request_id&&!t.modification_request_id;});
        if(conflict)throw new Error('A task already exists for this payment. Open that task to edit it, or select multiple payments.');
      }
      if(!task&&ids.length>1){
        var duplicate=cache.rows.find(function(t){return Number(t.unit_id)===Number(c.sno)&&t.status==='pending'&&
          t.source==='manual'&&t.action_label===action&&t.auto_key===autoKey;});
        if(duplicate)throw new Error('A follow-up for these selected payments already exists. Open that task instead.');
      }
      if(task)r=await sb.from('scheduled_actions').update(payload).eq('id',task.id).select().single();
      else{payload.unit_id=Number(c.sno);r=await sb.from('scheduled_actions').insert(payload).select().single();}
      if(r.error)throw r.error;
      removePanel();await refreshAfterChange();
    }catch(e){fail(e&&e.message?e.message:'Could not save this scheduled action.');if(save){save.disabled=false;save.textContent=task?'Save Changes':'Schedule Action';}}
  }

  function openComplete(task){
    if(task&&task.workflow_kind==='modification_request'&&typeof window.__sunblissOpenModificationTask==='function'){window.__sunblissOpenModificationTask(task);return;}
    removePanel();var c=customerForUnit(task.unit_id),p=document.createElement('div');p.id='scheduledActionPanel';p.className='brand-editor';p.setAttribute('data-mode','complete');
    var summary=safe(c?('Unit '+c.unit+' · '+c.name):('Unit '+task.unit_id))+' · due '+safe(formatDate(task.due_date));
    var body='',button='Mark Done';p.dataset.taskId=task.id;
    if(task.auto_kind==='credit_note_send'){
      body='<p class="scheduled-outcome-current">Send the issued credit note to the customer. Mark this task as sent only after delivery.</p><label class="brand-field">Email reference / sending note (optional)<textarea id="saCompletionNote" placeholder="e.g. sent by email, include thread reference"></textarea></label>';
      button='Mark Sent';
    }else if(isBookingWelcome(task)){
      body='<p class="scheduled-outcome-current">Send the Welcome Letter before the payment receipt, then mark this task as sent.</p><label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="e.g. sent by email or WhatsApp"></textarea></label>';
      button='Mark Sent';
    }else if(task.auto_kind==='demand_letter'){
      body='<p class="scheduled-outcome-help">Choose what happened before the Demand Letter. Customer confirmation does not mean Accounts has received the money.</p>'+
        '<label class="brand-field">Demand Letter outcome<select id="saOutcome"><option value="">Select outcome</option><option value="sent">Demand Letter Sent</option><option value="customer_confirmed_payment">Customer Confirmed Payment</option></select></label>'+
        '<label class="brand-field" id="saConfirmationSourceWrap" style="display:none">Confirmation via<select id="saConfirmationSource"><option value="">Select source</option><option value="phone_call">Phone Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="other">Other</option></select></label>'+
        '<label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Payment reference or customer message"></textarea></label>';
      button='Save Outcome';
    }else if(task.workflow_kind==='accounts_confirmation'){
      body='<label class="brand-field">Accounts verification<select id="saOutcome"><option value="">Select outcome</option><option value="confirmed">Confirmed</option><option value="not_received">Not Received</option><option value="amount_mismatch">Amount Mismatch</option></select></label><label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Reference, confirmation detail or issue"></textarea></label>';
      button='Save Outcome';
    }else if(task.workflow_kind==='cheque_clearance'){
      body='<label class="brand-field">Cheque status<select id="saOutcome"><option value="">Select outcome</option><option value="cleared">Cleared</option><option value="still_pending">Still Pending</option><option value="returned">Returned</option></select></label><label class="brand-field" id="saNextDateWrap" style="display:none">Next clearance check<input type="date" id="saNextDate" value="'+safe(addDaysIso(1))+'" /></label><label class="brand-field">Note (optional)<textarea id="saCompletionNote" placeholder="Clearance reference or issue"></textarea></label>';
      button='Save Outcome';
    }else if(task.workflow_kind==='payment_receipt'){
      body='<p class="scheduled-outcome-current">Accounts confirmation is complete. Send and complete the Welcome Letter task first, then send the payment receipt and mark this task done.</p><label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="e.g. sent by email or WhatsApp"></textarea></label><input type="hidden" id="saOutcome" value="sent">';
      button='Mark Done';
    }else if(task.workflow_kind==='payment_reported'){
      body='<p class="scheduled-outcome-current">The customer reported that payment has been made. Record the actual payment before closing this action.</p><input type="hidden" id="saOutcome" value="record_payment">';
      button='Record Payment';
    }else if(task.workflow_kind==='extension_approval'){
      body='<p class="scheduled-outcome-help">Record Management\'s decision on the customer\'s requested extension. Approval is offered to the customer first; it is not activated until the customer accepts.</p>'+
        '<div class="scheduled-outcome-current" id="saExtensionRequestSummary">Loading extension details…</div>'+
        '<label class="brand-field">Management decision<select id="saOutcome"><option value="">Select decision</option><option value="approved">Approved as Requested</option><option value="approved_with_changes">Approved with Different Date / Conditions</option><option value="rejected">Rejected</option><option value="clarification">Clarification Required</option></select></label>'+
        '<div id="saExtensionApprovalFields" style="display:none"><label class="brand-field">Management approved until<input type="date" id="saApprovedUntil" /></label>'+
        '<label class="brand-field">Approved by<input type="text" id="saApprovedBy" maxlength="120" value="Management" /></label>'+
        '<label class="brand-field">Approval reference (optional)<input type="text" id="saApprovalRef" maxlength="250" placeholder="Email / written approval reference" /></label>'+
        '<label class="brand-field">Late-charge treatment<select id="saPenalty"><option value="not_specified">Not specified in approval</option><option value="original_due_date">Charges continue from original due date</option><option value="extended_due_date">Charges start after extended deadline</option><option value="waived_until_extension">Waived if paid by extended deadline</option><option value="no_late_charges">No late charges under approval</option></select></label></div>'+
        '<label class="brand-field">Decision notes / conditions<textarea id="saCompletionNote" placeholder="Record Management\'s conditions, reason or clarification request"></textarea></label>';
      button='Save Decision';
    }else if(task.workflow_kind==='extension_customer_confirmation'){
      body='<p class="scheduled-outcome-help">Confirm Management\'s decision with the customer. A different date must be re-approved before it can take effect.</p>'+
        '<div class="scheduled-outcome-current" id="saExtensionRequestSummary">Loading extension details…</div>'+
        '<label class="brand-field">Customer response<select id="saOutcome"><option value="">Select response</option><option value="accepted">Accepted Approved Date</option><option value="rerequest">Request Another Date</option><option value="no_response">No Response</option><option value="declined">Declined / Not Agreed</option><option value="withdrawn">Withdrawn</option><option value="acknowledged">Acknowledged Rejection</option><option value="payment_reported">Payment Reported</option></select></label>'+
        '<label class="brand-field" id="saExtensionReRequestWrap" style="display:none">New requested extension date<input type="date" id="saExtensionNewDate" /></label>'+
        '<label class="brand-field" id="saExtensionFollowupWrap" style="display:none">Next customer follow-up<input type="date" id="saExtensionFollowupDate" value="'+safe(addDaysIso(2))+'" /></label>'+
        '<label class="brand-field">Customer response / email reference<textarea id="saCompletionNote" placeholder="Customer response, reason and email reference"></textarea></label>';
      button='Save Customer Response';
    }else if(task.workflow_kind==='extension_clarification'){
      body='<p class="scheduled-outcome-help">Obtain the information requested by Management. This will send the same task back for Management re-approval.</p>'+
        '<div class="scheduled-outcome-current" id="saExtensionRequestSummary">Loading extension details…</div>'+
        '<label class="brand-field">Clarification received<textarea id="saCompletionNote" placeholder="Enter clarification, email reference and supporting details"></textarea></label>';
      button='Return to Management';
    }else if(collectionOutcomeTask(task)){
      var txReview=!!task.transaction_id;
      var partialOption=!txReview&&!task.commitment_part_id?'<option value="partial_payment_commitment">Payment in parts</option>':'';
      body='<p class="scheduled-outcome-help">Choose what happened. Review the next step before saving.</p>'+(!task.schedule_id?'<label class="brand-field">Related installment *<select id="saRelatedSchedule"><option value="">Loading installments…</option></select></label>':'<div id="saPaymentSummary" class="scheduled-outcome-current">Loading payment balance…</div>')+
        '<label class="brand-field">What happened?<select id="saOutcome"><option value="">Select outcome</option>'+
        (txReview?'<option value="recheck_accounts">Recheck with Accounts</option>':'<option value="payment_reported">Payment received / reported</option><option value="will_pay_later">Payment promised</option>'+partialOption+'<option value="extension_request">Extension requested</option>')+
        '<option value="payment_issue">Payment query</option>'+(task.workflow_kind==='payment_query'?'<option value="query_resolved">Query resolved</option>':'')+
        '<option value="no_response">No response</option>'+(!txReview?'<option value="cancel_task">Cancel task</option>':'')+'</select></label>'+
        '<label class="brand-field" id="saNextDateWrap" style="display:none"><span id="saNextDateLabel">Next follow-up date</span><input type="date" id="saNextDate" value="'+safe(addDaysIso(3))+'" /></label>'+
        '<div id="saPartialCommitmentWrap" style="display:none"><p class="scheduled-outcome-help">Split the full outstanding balance into two or more amounts. The installment and its contractual date stay unchanged.</p><div id="saCommitmentParts">'+[1,2].map(function(n){return '<div class="sa-commitment-part"><label class="brand-field">Part '+n+' amount (AED)<input type="number" min="0.01" step="0.01" class="saCommitmentAmount" /></label><label class="brand-field">Promised date<input type="date" class="saCommitmentDate" /></label></div>';}).join('')+'</div><button type="button" class="btn-paper" id="saAddCommitmentPart">+ Add part</button></div>'+
        '<label class="brand-field"><span id="saNoteLabel">Note (optional)</span><textarea id="saCompletionNote" placeholder="Short customer response or reason"></textarea></label>';
      button='Save Outcome';
    }else{
      body='<label class="brand-field">Completion note (optional)<textarea id="saCompletionNote" placeholder="What happened or what did the customer confirm?"></textarea></label>'+(task.auto_kind==='demand_letter'||task.auto_kind==='gentle_reminder'?'':'<label class="scheduled-next-check"><input type="checkbox" id="saScheduleNext" /><span>Schedule the next action after marking this one done</span></label>');
      button=task.auto_kind==='demand_letter'||task.auto_kind==='gentle_reminder'?'Mark Sent':'Mark Done';
    }
    p.innerHTML='<p class="section-label" style="margin-top:0">'+safe(task.action_label)+'</p><p class="scheduled-form-summary">'+summary+'</p><p class="brand-error" id="saError" style="display:none"></p>'+body+'<div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="saComplete">'+safe(button)+'</button><button type="button" class="btn-paper" id="saClose">Back</button></div>';
    document.body.appendChild(p);
    if(task.note){var prior=document.createElement('details');prior.className='task-prior-note';var label=document.createElement('summary');var amount=String(task.note).match(/AED\s+[\d,]+(?:\.\d{1,2})?/i);label.textContent=amount&&['accounts_confirmation','cheque_clearance','payment_receipt'].indexOf(task.workflow_kind)>=0?'Payment details · '+amount[0]:'Previous note';var note=document.createElement('p');note.textContent=task.note;prior.append(label,note);p.querySelector('.scheduled-form-summary').after(prior);}
    scheduledRootUi(p);
    if(collectionOutcomeTask(task))loadOutcomePayment(task,p);
    document.getElementById('saClose').onclick=removePanel;
    var outcome=document.getElementById('saOutcome');
    if(task.auto_kind==='demand_letter'&&outcome){outcome.onchange=function(){var wrap=document.getElementById('saConfirmationSourceWrap');if(wrap)wrap.style.display=this.value==='customer_confirmed_payment'?'block':'none';};}
    if(outcome&&document.getElementById('saNextDateWrap'))outcome.onchange=function(){var needs=['still_pending','will_pay_later','no_response','extension_request','payment_issue','query_resolved'].indexOf(this.value)>=0,partial=this.value==='partial_payment_commitment',nextWrap=document.getElementById('saNextDateWrap'),partialWrap=document.getElementById('saPartialCommitmentWrap');nextWrap.style.display=needs?'block':'none';if(partialWrap)partialWrap.style.display=partial?'block':'none';var label=document.getElementById('saNextDateLabel');if(label)label.textContent=this.value==='extension_request'?'Requested extension date':this.value==='will_pay_later'?'Promised payment date':this.value==='payment_issue'?'Review by':'Next follow-up date';var noteLabel=document.getElementById('saNoteLabel');if(noteLabel)noteLabel.textContent=['extension_request','payment_issue','cancel_task','query_resolved'].indexOf(this.value)>=0?'Reason / details *':'Note (optional)';};
    if(task.workflow_kind==='extension_approval'&&outcome){outcome.onchange=function(){var box=document.getElementById('saExtensionApprovalFields');if(box)box.style.display=/^approved/.test(this.value)?'block':'none';};}
    if(task.workflow_kind==='extension_customer_confirmation'&&outcome){outcome.onchange=function(){var rereq=document.getElementById('saExtensionReRequestWrap'),followup=document.getElementById('saExtensionFollowupWrap');if(rereq)rereq.style.display=this.value==='rerequest'?'block':'none';if(followup)followup.style.display=this.value==='no_response'?'block':'none';};}
    if(['extension_approval','extension_customer_confirmation','extension_clarification'].indexOf(task.workflow_kind)>=0)loadExtensionApproval(task);
    var addPart=document.getElementById('saAddCommitmentPart');if(addPart)addPart.onclick=function(){var host=document.getElementById('saCommitmentParts'),n=host?host.querySelectorAll('.sa-commitment-part').length+1:0;if(!host||!n)return;var row=document.createElement('div');row.className='sa-commitment-part';row.setAttribute('data-part',n);row.innerHTML='<label class="brand-field">Part '+n+' amount (AED)<input type="number" min="0.01" step="0.01" inputmode="decimal" class="saCommitmentAmount" /></label><label class="brand-field">Commitment date<input type="date" class="saCommitmentDate" /></label><button type="button" class="btn-paper saRemoveCommitmentPart" style="width:100%;justify-content:center;margin:0 0 10px">Remove part</button>';host.appendChild(row);var remove=row.querySelector('.saRemoveCommitmentPart');if(remove)remove.onclick=function(){row.remove();};};
    document.getElementById('saComplete').onclick=function(){completeTask(task);};
    if(window.__sunblissEnhanceTaskOutcome)window.__sunblissEnhanceTaskOutcome(p,{task:task,selectId:'saOutcome',saveId:'saComplete',pendingPaymentSteps:cache.rows.filter(function(t){return t.unit_id===task.unit_id&&t.status==='pending';}).map(function(t){return t.workflow_kind;})});
  }

  async function loadOutcomePayment(task,panel){
    try{
      var q=await Promise.all([sb.from('current_payment_schedule').select('id,unit_id,stage_name,due_amount,revised_due_amount,paid_amount,due_date,revised_due_date').eq('unit_id',Number(task.unit_id)),sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',Number(task.unit_id))]);
      q.forEach(function(r){if(r.error)throw r.error;});if(!panel.isConnected)return;
      var credits={};(q[1].data||[]).forEach(function(c){credits[c.payment_schedule_id]=(credits[c.payment_schedule_id]||0)+Number(c.amount||0);});
      function remaining(r){return Math.max(0,Number(r.revised_due_amount==null?r.due_amount:r.revised_due_amount)-Number(r.paid_amount||0)-(credits[r.id]||0));}
      function describe(r){return r.stage_name+' · AED '+remaining(r).toLocaleString('en-AE',{maximumFractionDigits:2})+' outstanding';}
      var select=panel.querySelector('#saRelatedSchedule'),summary=panel.querySelector('#saPaymentSummary');
      if(select)select.innerHTML='<option value="">Select installment</option>'+(q[0].data||[]).filter(function(r){return remaining(r)>.01&&!/booking/i.test(r.stage_name);}).map(function(r){return '<option value="'+Number(r.id)+'">'+safe(describe(r))+'</option>';}).join('');
      if(summary){var row=(q[0].data||[]).find(function(r){return Number(r.id)===Number(task.schedule_id);});summary.textContent=row?describe(row):'Linked installment could not be found. Reopen the task after syncing.';}
    }catch(e){var host=panel.querySelector('#saPaymentSummary');if(host)host.textContent='Balance unavailable. Sync and reopen to check the current amount.';var select=panel.querySelector('#saRelatedSchedule');if(select)select.innerHTML='<option value="">Could not load installments. Go back and retry.</option>';}
  }

  async function loadExtensionApproval(task){
    var host=document.getElementById('saExtensionRequestSummary');if(!host||!task.extension_request_id)return;
    try{
      var q=await Promise.all([
        sb.from('payment_extension_requests').select('id,payment_schedule_id,original_due_date,requested_until,reason,status,approved_until,approved_by,decision_type,decision_note,customer_response,revision_no,previous_request_id').eq('id',Number(task.extension_request_id)).single(),
        sb.from('payment_extension_requests').select('id,payment_schedule_id,revision_no,requested_until,approved_until,decision_type,status,customer_response').eq('payment_schedule_id',Number(task.schedule_id)).order('id',{ascending:false}).limit(12),
        sb.from('payment_extensions').select('id,extended_due_date,status').eq('payment_schedule_id',Number(task.schedule_id)).eq('status','active').limit(1)
      ]);
      q.forEach(function(x){if(x.error)throw x.error;});
      var x=q[0].data||{},previous=q[1].data||[],active=q[2].data&&q[2].data[0]||null;
      var head='<strong>Request #'+safe(x.revision_no||1)+'</strong> · Requested until '+safe(formatDate(x.requested_until))+
        '<br>Original due: '+safe(formatDate(x.original_due_date))+
        '<br>Effective deadline: '+safe(formatDate(active?active.extended_due_date:x.original_due_date));
      if(x.approved_until)head+='<br><strong>Management offered:</strong> '+safe(formatDate(x.approved_until))+' ('+safe(x.decision_type||'approved')+')';
      if(x.approved_by)head+='<br>Approved by: '+safe(x.approved_by);
      if(x.reason)head+='<br>Customer reason: '+safe(x.reason);
      if(x.decision_note)head+='<br>Decision / conditions: '+safe(x.decision_note);
      if(previous.length>1)head+='<div style="margin-top:9px;padding-top:8px;border-top:1px solid var(--paper-line)"><strong>Extension history</strong>'+
        previous.map(function(y){return '<div style="padding-top:5px">#'+safe(y.revision_no||1)+': requested '+safe(formatDate(y.requested_until))+
        (y.approved_until?', offered '+safe(formatDate(y.approved_until)):'')+
        ' · '+safe(y.status)+(y.customer_response?' · customer '+safe(y.customer_response):'')+'</div>';}).join('')+'</div>';
      host.innerHTML=head;
      var d=document.getElementById('saApprovedUntil');if(d&&!d.value)d.value=text(x.requested_until).slice(0,10);
      if(task.workflow_kind==='extension_customer_confirmation'){
        var select=document.getElementById('saOutcome');
        if(select&&x.status==='rejected'){var accept=select.querySelector('option[value="accepted"]');if(accept)accept.remove();}
        else if(select){var ack=select.querySelector('option[value="acknowledged"]');if(ack)ack.remove();}
        var panel=document.getElementById('scheduledActionPanel');if(panel)panel.dispatchEvent(new Event('outcome-options-changed'));
      }
    }catch(e){host.textContent='Could not load extension details. '+(e&&e.message?e.message:'');}
  }

  async function resolveExtensionApproval(task,decision,note){
    var approvedUntil=val('saApprovedUntil'),approvedBy=val('saApprovedBy'),approvalRef=val('saApprovalRef'),penalty=val('saPenalty')||'not_specified';
    if(!decision)throw new Error('Select a management decision.');
    var approved=/^approved/.test(decision);
    if(approved&&!approvedUntil)throw new Error('Select the management-approved date.');
    if(approved&&approvedBy.length<2)throw new Error('Enter who approved the extension.');
    if(['rejected','clarification'].indexOf(decision)>=0&&!note)throw new Error('Enter the reason for the management decision.');
    var r=await sb.rpc('crm_resolve_payment_extension_request',{
      p_task_id:Number(task.id),
      p_decision:decision,
      p_approved_until:approved?approvedUntil:null,
      p_approved_by:approved?approvedBy:null,
      p_approval_reference:approved?(approvalRef||null):null,
      p_penalty_basis:approved?penalty:'not_specified',
      p_note:note||null
    });
    if(r.error)throw r.error;
    return r.data||{};
  }

  async function resolveExtensionCustomerResponse(task,outcome,note){
    if(!outcome)throw new Error('Select the customer response.');
    if(outcome==='payment_reported')return 'payment';
    var requested=val('saExtensionNewDate'),followup=val('saExtensionFollowupDate');
    if(outcome==='rerequest'&&!requested)throw new Error('Enter the newly requested extension date.');
    if(outcome==='rerequest'&&!note)throw new Error('Enter the customer\'s reason for re-request.');
    if(outcome==='no_response'&&!followup)throw new Error('Select the next customer follow-up date.');
    var r=await sb.rpc('crm_record_extension_customer_response',{
      p_task_id:Number(task.id),p_outcome:outcome,p_note:note||null,
      p_requested_until:outcome==='rerequest'?requested:null,
      p_next_date:outcome==='no_response'?followup:null
    });
    if(r.error)throw r.error;
    return r.data||{};
  }

  async function submitExtensionClarification(task,note){
    if(!note)throw new Error('Enter the clarification you obtained.');
    var r=await sb.rpc('crm_submit_extension_clarification',{p_task_id:Number(task.id),p_note:note});
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
    window.setTimeout(function(){try{window.__sunblissOpenRecordPayment({scheduleId:task.schedule_id||null,commitmentPartId:task.commitment_part_id||null,sourceTaskId:task.id});}catch(_e){}},60);
  }

  async function resolveCollectionOutcome(task,outcome,note,nextDate){
    // Payment entry owns the transaction and completion. Leaving it must not close this task.
    if(outcome==='payment_reported')return 'payment';
    var scheduleId=Number(task.schedule_id||val('saRelatedSchedule'))||null;
    var r=await sb.rpc('crm_record_scheduled_outcome',{
      p_task_id:Number(task.id),p_expected_updated_at:task.updated_at,
      p_outcome:outcome,p_schedule_id:scheduleId,p_note:note||null,
      p_next_date:nextDate||null,p_parts:outcome==='partial_payment_commitment'?partialCommitmentParts():null
    });
    if(r.error)throw r.error;
    return 'refresh';
  }

  async function completeTask(task){
    var save=document.getElementById('saComplete'),err=document.getElementById('saError'),next=document.getElementById('saScheduleNext')&&document.getElementById('saScheduleNext').checked,note=val('saCompletionNote')||null,outcome=val('saOutcome'),nextDate=val('saNextDate');
    if(save&&save.disabled)return;
    if(save){save.disabled=true;save.textContent='Saving…';}
    try{
      if(task.workflow_kind==='payment_reported'){
        removePanel();await openPaymentFromTask(task);return;
      }
      if(task.auto_kind==='demand_letter'){
        if(!outcome)throw new Error('Select the Demand Letter outcome.');
        if(outcome==='customer_confirmed_payment'){
          var source=val('saConfirmationSource');
          if(!source)throw new Error('Select Phone Call, WhatsApp or another confirmation source.');
          var report=await sb.rpc('crm_customer_reported_before_demand_letter',{
            p_task_id:Number(task.id),p_expected_updated_at:task.updated_at,p_source:source,p_note:note
          });
          if(report.error)throw report.error;
          removePanel();await refreshAfterChange();return;
        }
        if(outcome!=='sent')throw new Error('Select a valid Demand Letter outcome.');
      }
      if(task.workflow_kind==='extension_approval'){
        await resolveExtensionApproval(task,outcome,note);
        removePanel();await refreshAfterChange();return;
      }
      if(task.workflow_kind==='extension_customer_confirmation'){
        var extResponse=await resolveExtensionCustomerResponse(task,outcome,note);
        if(extResponse==='payment'){removePanel();await openPaymentFromTask(task);return;}
        removePanel();
        if(outcome==='accepted'&&window.PaymentExtensionsCore&&typeof window.PaymentExtensionsCore.sync==='function')await window.PaymentExtensionsCore.sync();
        await refreshAfterChange();if(typeof window.renderMain==='function')window.renderMain();return;
      }
      if(task.workflow_kind==='extension_clarification'){
        await submitExtensionClarification(task,note);
        removePanel();await refreshAfterChange();return;
      }
      if(task.workflow_kind==='accounts_confirmation'&&!task.transaction_id&&text(task.auto_key).indexOf('customer_reported_before_demand_letter|')===0){
        if(!outcome)throw new Error('Select an Accounts verification outcome.');
        if(outcome==='confirmed'){removePanel();await openPaymentFromTask(task);return;}
        var verification=await sb.rpc('crm_resolve_pre_demand_verification',{p_task_id:Number(task.id),p_outcome:outcome,p_note:note});
        if(verification.error)throw verification.error;
        removePanel();await refreshAfterChange();return;
      }
      if(task.workflow_kind==='accounts_confirmation'||task.workflow_kind==='cheque_clearance'||task.workflow_kind==='payment_receipt'){
        if(!outcome)throw new Error('Select an outcome.');
        if(task.workflow_kind==='cheque_clearance'&&outcome==='still_pending'&&!nextDate)throw new Error('Select the next clearance check date.');
        await resolvePaymentWorkflow(task,outcome,note,nextDate);
        removePanel();await refreshAfterChange();return;
      }
      if(collectionOutcomeTask(task)){
        if(!outcome)throw new Error('Select an outcome.');
        if(!task.schedule_id&&outcome!=='cancel_task'){var sid=Number(val('saRelatedSchedule'));if(!sid)throw new Error('Select the related installment.');task=Object.assign({},task,{schedule_id:sid});}
        if(['extension_request','payment_issue','cancel_task','query_resolved'].indexOf(outcome)>=0&&!note)throw new Error('Enter the reason or details.');
        if(['will_pay_later','no_response','extension_request','payment_issue','query_resolved'].indexOf(outcome)>=0&&!nextDate)throw new Error('Select the next date.');
        var result=await resolveCollectionOutcome(task,outcome,note,nextDate);
        removePanel();await refreshAfterChange();
        if(result==='payment')await openPaymentFromTask(task);
        return;
      }
      var now=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'completed',completed_at:now,completion_note:note,updated_at:now}).eq('id',task.id).select().single();
      if(r.error)throw r.error;removePanel();await refreshAfterChange();
      if(next){var c=customerForUnit(task.unit_id);if(c){state.selectedUnit=c.unit+'::'+c.sno;state.view='detail';window.setTimeout(function(){openForm(null);},0);}}
    }catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not save this outcome.';err.style.display='block';err.setAttribute('role','alert');err.scrollIntoView({block:'center'});}if(save){save.disabled=false;save.textContent='Try Again';}}
  }

  async function cancelTask(task){
    var btn=document.getElementById('saCancelTask'),err=document.getElementById('saError');if(btn){btn.disabled=true;btn.textContent='Cancelling…';}
    try{var now=new Date().toISOString(),r=await sb.from('scheduled_actions').update({status:'cancelled',cancelled_at:now,updated_at:now}).eq('id',task.id).select().single();if(r.error)throw r.error;removePanel();await refreshAfterChange();}catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not cancel this action.';err.style.display='block';}if(btn){btn.disabled=false;btn.textContent='Cancel Scheduled Action';}}
  }

  async function refreshAfterChange(){await loadTasks(true);renderScheduledViews();window.dispatchEvent(new Event("sunbliss:scheduled-actions-updated"));}
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
    // Reuse the existing outcome screen, scoped to the customer currently open.
    window.__sunblissOpenScheduledAction=function(id){
      if(!canUse())return false;
      var c=currentCustomer(),task=taskById(id);
      if(!c||!task||task.status!=='pending'||!visibleTask(task)||task.auto_kind==='extension_active'||Number(task.unit_id)!==Number(c.sno))return false;
      openComplete(task);
      return true;
    };
    window.__sunblissOpenArchivedScheduledAction=function(id){
      if(!canUse())return false;
      var task=taskById(id);
      if(!task||task.status!=='pending'||!visibleTask(task)||task.auto_kind==='extension_active')return false;
      openComplete(task);
      return true;
    };
    window.__sunblissRefreshScheduledActions=function(){return loadTasks(true);};
  window.__sunblissScheduledActionRows=function(){return cache.loaded?cache.rows.filter(visibleTask):null;};
  window.__sunblissEnsureScheduledActions=async function(){await loadTasks(false);renderScheduledViews();};
    var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    var ro=window.renderOverview;window.renderOverview=function(){var out=ro.apply(this,arguments);loadTasks(false).then(renderScheduledViews).catch(function(){});return out;};
    loadTasks(false).then(renderScheduledViews).catch(function(){});
    window.addEventListener('pageshow',function(){loadTasks(true).then(renderScheduledViews).catch(function(){});});
  }
  install();
})();
