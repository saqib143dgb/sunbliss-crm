(function(){
  'use strict';
  if(window.__sunblissAutomaticPaymentActionsInstalled)return;
  window.__sunblissAutomaticPaymentActionsInstalled=true;

  var syncing=null;
  var lastSyncAt=0;
  var syncTimer=null;
  var autoMeta={};

  function text(v){return v==null?'':String(v);}
  function norm(v){return text(v).trim().toLowerCase().replace(/\s+/g,' ');}
  function isoDate(v){
    if(!v)return'';
    if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v))return v;
    var d=v instanceof Date?new Date(v.getTime()):new Date(v);
    if(isNaN(d.getTime()))return'';
    var m=d.getMonth()+1,day=d.getDate();
    return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);
  }
  function localDay(v){
    var value=isoDate(v);if(!value)return null;
    var d=new Date(value+'T00:00:00');
    return isNaN(d.getTime())?null:d;
  }
  function addDaysIso(v,days){var d=localDay(v);if(!d)return'';d.setDate(d.getDate()+days);return isoDate(d);}
  function daysUntil(v){var due=localDay(v),today=new Date();today.setHours(0,0,0,0);if(!due)return null;return Math.round((due.getTime()-today.getTime())/86400000);}
  function money(v){
    var n=Math.max(0,Number(v)||0);
    if(typeof window.fmtAED==='function')return window.fmtAED(n);
    return 'AED '+n.toLocaleString('en-AE',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function dateText(v){
    var d=localDay(v);if(!d)return text(v);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function isPaymentStage(row){
    var name=norm(row&&row.stage_name);
    if(!name)return false;
    if(name.indexOf('dld')!==-1||name.indexOf('admin fee')!==-1||name.indexOf('booking')!==-1)return false;
    return name.indexOf('installment')!==-1||name.indexOf('down payment')!==-1||name.indexOf('final')!==-1;
  }
  function isPaymentRelatedManual(row){
    if(!row||row.status!=='pending'||(row.source&&row.source!=='manual'))return false;
    var hay=norm(text(row.action_label)+' '+text(row.note));
    return /(payment|installment|demand|reminder|outstanding|overdue|receipt|transfer|charges|collection)/.test(hay);
  }
  function carryManagedIds(){
    var out={};
    if(!window.state||!Array.isArray(state.dues))return out;
    state.dues.forEach(function(c){
      (c.stages||[]).forEach(function(stage){if(stage&&stage.id&&stage.carryForwardManaged===true)out[String(stage.id)]=true;});
    });
    return out;
  }
  function activeUnitIds(){
    if(!window.state||!Array.isArray(state.dues))return[];
    var seen={};
    state.dues.forEach(function(c){var id=Number(c&&c.sno);if(id>0)seen[id]=true;});
    return Object.keys(seen).map(Number);
  }
  function keyFor(kind,scheduleId,installmentDue){return kind+'|schedule:'+scheduleId+'|due:'+installmentDue;}
  function overdueKey(unitId,rows){
    var ids=rows.map(function(x){return Number(x.row.id);}).sort(function(a,b){return a-b;});
    return 'overdue_follow_up|unit:'+unitId+'|schedules:'+ids.join(',');
  }
  function kindLabel(kind,remaining){
    if(kind==='demand_letter')return'Send Demand Letter';
    if(kind==='gentle_reminder')return'Send Gentle Reminder';
    return'Urgent Follow-up — '+money(remaining)+' overdue';
  }
  function kindPriority(kind){return kind==='overdue_follow_up'?'High':(kind==='gentle_reminder'?'High':'Medium');}
  function taskDueDate(kind,installmentDue){
    if(kind==='demand_letter')return addDaysIso(installmentDue,-10);
    if(kind==='gentle_reminder')return addDaysIso(installmentDue,-2);
    return installmentDue;
  }
  function taskNote(row,remaining,creditApplied){
    var parts=[text(row.stage_name),money(remaining)+' outstanding'];
    if(creditApplied>0)parts.push(money(creditApplied)+' credit note applied');
    parts.push('installment due '+dateText(row.due_date)+'.');
    return parts.join(' · ');
  }
  function overdueNote(rows,total){
    rows=rows.slice().sort(function(a,b){return text(a.row.due_date).localeCompare(text(b.row.due_date));});
    if(rows.length===1)return taskNote(rows[0].row,total,rows[0].creditApplied||0);
    var stages=rows.map(function(x){return text(x.row.stage_name);}).join(' + ');
    var creditTotal=Math.round(rows.reduce(function(sum,x){return sum+(Number(x.creditApplied)||0);},0)*100)/100;
    var note=rows.length+' installments overdue · '+money(total)+' total outstanding';
    if(creditTotal>0)note+=' after '+money(creditTotal)+' linked credit notes';
    return note+' · '+stages+' · oldest due '+dateText(rows[0].row.due_date)+'.';
  }

  function ensureStyles(){
    if(document.getElementById('automaticPaymentActionStyles'))return;
    var s=document.createElement('style');s.id='automaticPaymentActionStyles';s.textContent=[
      '.scheduled-auto-badge{display:inline-flex;align-items:center;margin-left:7px;padding:2px 6px;border:1px solid rgba(162,124,53,.38);border-radius:999px;background:rgba(162,124,53,.08);color:var(--gold-deep,#A27C35);font:700 8px/1.2 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;vertical-align:1px}',
      '#scheduledActionsOverview .scheduled-overview-row.scheduled-auto[data-auto-kind="demand_letter"]:before{background:var(--gold-deep,#A27C35)!important}',
      '#scheduledActionsOverview .scheduled-overview-row.scheduled-auto[data-auto-kind="gentle_reminder"]:before{background:var(--amber,#9C5A12)!important}',
      '#scheduledActionsOverview .scheduled-overview-row.scheduled-auto[data-auto-kind="overdue_follow_up"]:before{background:var(--rust,#AE3B2B)!important}',
      '.scheduled-task-card.scheduled-auto[data-auto-kind="demand_letter"]{border-left-color:var(--gold-deep,#A27C35)!important}',
      '.scheduled-task-card.scheduled-auto[data-auto-kind="gentle_reminder"]{border-left-color:var(--amber,#9C5A12)!important}',
      '.scheduled-task-card.scheduled-auto[data-auto-kind="overdue_follow_up"]{border-left-color:var(--rust,#AE3B2B)!important}',
      '.scheduled-task-card.scheduled-auto .scheduled-edit{display:none!important}'
    ].join('');document.head.appendChild(s);
  }

  function applyBadge(container,meta){
    if(!container||!meta)return;
    container.classList.add('scheduled-auto');
    container.setAttribute('data-auto-kind',meta.auto_kind||'');
    var title=container.querySelector('.scheduled-overview-title,.scheduled-task-title');
    if(title&&!title.querySelector('.scheduled-auto-badge')){
      var badge=document.createElement('span');badge.className='scheduled-auto-badge';badge.textContent='Automatic';title.appendChild(badge);
    }
  }
  function decorate(){
    ensureStyles();
    document.querySelectorAll('[data-task-id]').forEach(function(node){
      var id=text(node.getAttribute('data-task-id'));
      var meta=autoMeta[id];
      if(meta)applyBadge(node,meta);
    });
  }
  async function refreshAutoMeta(){
    if(!window.sb)return;
    var r=await sb.from('scheduled_actions').select('id,auto_kind').eq('source','automatic');
    if(r.error)return;
    autoMeta={};(r.data||[]).forEach(function(row){autoMeta[String(row.id)]={auto_kind:row.auto_kind};});
    decorate();
  }

  async function cancelIds(ids){
    if(!ids.length)return false;
    var now=new Date().toISOString();
    var r=await sb.from('scheduled_actions').update({status:'cancelled',cancelled_at:now,updated_at:now}).in('id',ids);
    if(r.error)throw r.error;
    return true;
  }

  async function runSync(){
    if(!window.state||state.userRole!=='crm_officer'||!window.sb)return false;
    var units=activeUnitIds();if(!units.length){await refreshAutoMeta();return false;}
    var userResult=await sb.auth.getUser();
    var user=userResult&&userResult.data&&userResult.data.user;
    if(!user)return false;

    var pair=await Promise.all([
      sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,due_date,paid_amount,status').in('unit_id',units),
      sb.from('scheduled_actions').select('id,unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_kind,auto_key,schedule_id,created_at,updated_at'),
      sb.from('credit_notes').select('payment_schedule_id,unit_id,amount').in('unit_id',units)
    ]);
    if(pair[0].error)throw pair[0].error;
    if(pair[1].error)throw pair[1].error;
    if(pair[2].error)throw pair[2].error;

    var schedules=pair[0].data||[],tasks=pair[1].data||[],credits=pair[2].data||[];
    var creditBySchedule={};
    credits.forEach(function(cn){
      if(cn.payment_schedule_id==null)return;
      var key=String(cn.payment_schedule_id);
      creditBySchedule[key]=Math.round(((creditBySchedule[key]||0)+(Number(cn.amount)||0))*100)/100;
    });

    var managed=carryManagedIds(),activeUnits={};units.forEach(function(id){activeUnits[String(id)]=true;});
    var manualBlock={};
    tasks.forEach(function(t){if(isPaymentRelatedManual(t))manualBlock[String(t.unit_id)]=true;});

    var autoRows=tasks.filter(function(t){return t.source==='automatic';});
    var byKey={};autoRows.forEach(function(t){if(t.auto_key)byKey[t.auto_key]=t;});
    var phaseBySchedule={};
    var overdueByUnit={};
    var desired=[];

    schedules.forEach(function(row){
      var sid=String(row.id);
      if(!isPaymentStage(row)||managed[sid])return;
      var due=Number(row.due_amount)||0;
      var paid=Number(row.paid_amount)||0;
      var creditApplied=Number(creditBySchedule[sid])||0;
      var remaining=Math.round(Math.max(0,due-paid-creditApplied)*100)/100;
      var installmentDue=isoDate(row.due_date),delta=daysUntil(installmentDue);
      if(!installmentDue||delta===null)return;
      var phase={row:row,remaining:remaining,creditApplied:creditApplied,delta:delta,paid:remaining<=1,manualBlock:!!manualBlock[String(row.unit_id)],desiredKind:null,desiredKey:null};
      if(!phase.paid){
        if(delta===10)phase.desiredKind='demand_letter';
        else if(delta===2)phase.desiredKind='gentle_reminder';
        else if(delta<0){
          var key=String(row.unit_id);
          (overdueByUnit[key]=overdueByUnit[key]||[]).push({row:row,remaining:remaining,creditApplied:creditApplied});
        }
      }
      if(phase.desiredKind){
        phase.desiredKey=keyFor(phase.desiredKind,row.id,installmentDue);
        desired.push({
          unit_id:Number(row.unit_id),action_label:kindLabel(phase.desiredKind,remaining),due_date:taskDueDate(phase.desiredKind,installmentDue),priority:kindPriority(phase.desiredKind),note:taskNote(row,remaining,creditApplied),status:'pending',owner_id:user.id,source:'automatic',auto_kind:phase.desiredKind,auto_key:phase.desiredKey,schedule_id:Number(row.id),updated_at:new Date().toISOString()
        });
      }
      phaseBySchedule[sid]=phase;
    });

    var overdueExpected={};
    Object.keys(overdueByUnit).forEach(function(unitKey){
      var rows=overdueByUnit[unitKey];
      if(!rows.length||manualBlock[unitKey])return;
      rows.sort(function(a,b){return text(a.row.due_date).localeCompare(text(b.row.due_date));});
      var total=Math.round(rows.reduce(function(sum,x){return sum+x.remaining;},0)*100)/100;
      var key=overdueKey(unitKey,rows);
      overdueExpected[unitKey]=key;
      desired.push({
        unit_id:Number(unitKey),action_label:kindLabel('overdue_follow_up',total),due_date:isoDate(rows[0].row.due_date),priority:'High',note:overdueNote(rows,total),status:'pending',owner_id:user.id,source:'automatic',auto_kind:'overdue_follow_up',auto_key:key,schedule_id:null,updated_at:new Date().toISOString()
      });
    });

    var cancel=[];
    autoRows.forEach(function(t){
      if(t.status!=='pending')return;
      if(!activeUnits[String(t.unit_id)]){cancel.push(t.id);return;}
      if(t.auto_kind==='overdue_follow_up'){
        var expected=overdueExpected[String(t.unit_id)];
        if(!expected||t.auto_key!==expected)cancel.push(t.id);
        return;
      }
      var sid=t.schedule_id==null?'':String(t.schedule_id),phase=phaseBySchedule[sid];
      if(!phase){cancel.push(t.id);return;}
      var currentKey=keyFor(t.auto_kind,phase.row.id,isoDate(phase.row.due_date));
      if(t.auto_key!==currentKey){cancel.push(t.id);return;}
      if(phase.paid){cancel.push(t.id);return;}
      if(phase.delta===2&&t.auto_kind==='demand_letter'){cancel.push(t.id);return;}
      if(phase.delta<0&&(t.auto_kind==='demand_letter'||t.auto_kind==='gentle_reminder')){cancel.push(t.id);return;}
    });

    var changed=await cancelIds(cancel);
    for(var i=0;i<desired.length;i++){
      var payload=desired[i],existing=byKey[payload.auto_key];
      if(existing){
        if(existing.status==='pending'){
          var needs=text(existing.action_label)!==text(payload.action_label)||text(existing.due_date)!==text(payload.due_date)||text(existing.priority)!==text(payload.priority)||text(existing.note)!==text(payload.note);
          if(needs){
            var u=await sb.from('scheduled_actions').update({action_label:payload.action_label,due_date:payload.due_date,priority:payload.priority,note:payload.note,updated_at:payload.updated_at}).eq('id',existing.id);
            if(u.error)throw u.error;changed=true;
          }
        }
        continue;
      }
      var ins=await sb.from('scheduled_actions').insert(payload);
      if(ins.error&&ins.error.code!=='23505')throw ins.error;
      if(!ins.error)changed=true;
    }

    await refreshAutoMeta();
    if(changed){
      window.setTimeout(function(){try{window.dispatchEvent(new Event('pageshow'));}catch(e){}},0);
    }
    return changed;
  }

  function sync(force){
    if(syncing)return syncing;
    if(!force&&Date.now()-lastSyncAt<5000){decorate();return Promise.resolve(false);}
    syncing=runSync().catch(function(err){console.warn('Automatic payment actions could not sync',err);return false;}).then(function(result){lastSyncAt=Date.now();syncing=null;return result;});
    return syncing;
  }
  function scheduleSync(delay){
    if(syncTimer)clearTimeout(syncTimer);
    syncTimer=setTimeout(function(){sync(false);},delay==null?250:delay);
  }

  function install(){
    if(!window.state||!window.sb||typeof window.renderOverview!=='function'||typeof window.renderDetail!=='function'||typeof window.loadFromSupabase!=='function'){
      setTimeout(install,60);return;
    }
    ensureStyles();
    var ro=window.renderOverview;window.renderOverview=function(){var out=ro.apply(this,arguments);scheduleSync(80);decorate();return out;};
    var rd=window.renderDetail;window.renderDetail=function(){var out=rd.apply(this,arguments);scheduleSync(80);decorate();return out;};
    var load=window.loadFromSupabase;window.loadFromSupabase=async function(){var out=await load.apply(this,arguments);await sync(true);return out;};
    window.addEventListener('pageshow',function(){decorate();scheduleSync(120);});
    sync(true);
  }

  install();
})();