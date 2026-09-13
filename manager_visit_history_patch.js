(function(){
  'use strict';
  if(window.__sunblissManagerVisitHistoryInstalled)return;
  window.__sunblissManagerVisitHistoryInstalled=true;

  var TABLE='crm_visit_sessions';
  var STALE_AFTER_MS=15*60*1000;
  var visit={sessionKey:null,rowId:null,userId:null,started:false,heartbeat:null,startPromise:null,closePromise:null};
  var trackingQueued=false;
  var dialogRows=[];
  var dialogTimer=null;
  var dialogKeyHandler=null;

  function text(value){return value===null||value===undefined?'':String(value);}
  function roleText(value){return text(value).trim().toLowerCase();}
  function isAuthorizedRole(value){var role=roleText(value);return role==='crm_officer'||role==='manager';}
  function escapeHtml(value){return text(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function nowIso(){return new Date().toISOString();}
  function apiWithTimeout(promise,ms){
    return new Promise(function(resolve,reject){
      var done=false,timer=setTimeout(function(){if(done)return;done=true;reject(new Error('request timeout'));},ms||10000);
      Promise.resolve(promise).then(function(value){if(done)return;done=true;clearTimeout(timer);resolve(value);},function(error){if(done)return;done=true;clearTimeout(timer);reject(error);});
    });
  }
  function randomKey(){
    try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();}catch(_e){}
    return 'crm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  }
  function decodeJwtPayload(token){
    var part=text(token).split('.')[1];
    if(!part||typeof window.atob!=='function')return null;
    try{
      var normalized=part.replace(/-/g,'+').replace(/_/g,'/');
      while(normalized.length%4)normalized+='=';
      var binary=window.atob(normalized),encoded='';
      for(var i=0;i<binary.length;i++)encoded+='%'+('00'+binary.charCodeAt(i).toString(16)).slice(-2);
      return JSON.parse(decodeURIComponent(encoded));
    }catch(_e){return null;}
  }
  function sessionKey(session,user){
    var payload=decodeJwtPayload(session&&session.access_token);
    var key=payload&&(payload.session_id||payload.sid||payload.jti);
    if(key)return text(key);
    var storageKey='sunbliss-crm-visit-session-key';
    try{
      if(window.sessionStorage){
        var saved=sessionStorage.getItem(storageKey);
        if(saved)return saved;
        var generated=randomKey();
        sessionStorage.setItem(storageKey,generated);
        return generated;
      }
    }catch(_e){}
    return user&&user.id?('fallback-'+text(user.id)):randomKey();
  }
  function currentRole(profile){
    return roleText(profile&&profile.role||(window.state&&state.userRole));
  }
  function currentName(profile,user){
    return text(profile&&profile.full_name||(window.state&&state.userName)||user&&user.email).trim()||'CRM user';
  }
  function rowFields(){
    return 'id,auth_session_id,user_id,user_role,user_name,signed_in_at,last_seen_at,signed_out_at';
  }
  function stopHeartbeat(){
    if(visit.heartbeat){clearInterval(visit.heartbeat);visit.heartbeat=null;}
  }
  async function touchVisit(){
    if(!visit.rowId||!visit.userId||!window.sb)return;
    try{
      await apiWithTimeout(sb.from(TABLE).update({last_seen_at:nowIso()}).eq('id',visit.rowId).eq('user_id',visit.userId),7000);
    }catch(_e){}
  }
  function startHeartbeat(){
    stopHeartbeat();
    visit.heartbeat=setInterval(function(){
      if(document.visibilityState==='hidden')return;
      touchVisit();
    },45000);
  }
  function resetVisit(){
    stopHeartbeat();
    visit.sessionKey=null;
    visit.rowId=null;
    visit.userId=null;
    visit.started=false;
  }
  async function trackSession(session,user,profile){
    if(!window.sb||!sb.from||!session||!user||!isAuthorizedRole(currentRole(profile)))return null;
    var key=sessionKey(session,user),role=currentRole(profile);
    if(!key||!role)return null;
    if(visit.started&&visit.sessionKey===key)return visit;
    if(visit.startPromise)return visit.startPromise;
    visit.startPromise=(async function(){
      var payload={auth_session_id:key,user_id:user.id,user_role:role,user_name:currentName(profile,user)};
      var result;
      try{
        result=await apiWithTimeout(sb.from(TABLE).insert(payload).select(rowFields()).single(),10000);
      }catch(_e){return null;}
      var row=result&&result.data;
      if(result&&result.error){
        var message=text(result.error.message).toLowerCase();
        var duplicate=result.error.code==='23505'||message.indexOf('duplicate')!==-1||message.indexOf('unique')!==-1;
        if(!duplicate)return null;
        try{
          var existing=await apiWithTimeout(sb.from(TABLE).select(rowFields()).eq('auth_session_id',key).maybeSingle(),8000);
          if(existing.error||!existing.data)return null;
          row=existing.data;
        }catch(_e){return null;}
      }
      if(!row||!row.id||row.signed_out_at)return null;
      visit.sessionKey=key;
      visit.rowId=row.id;
      visit.userId=user.id;
      visit.started=true;
      startHeartbeat();
      return row;
    })();
    var promise=visit.startPromise;
    promise.then(function(){visit.startPromise=null;},function(){visit.startPromise=null;});
    return promise;
  }
  async function closeVisitSession(){
    if(visit.closePromise)return visit.closePromise;
    visit.closePromise=(async function(){
      var id=visit.rowId,userId=visit.userId;
      stopHeartbeat();
      if(id&&userId&&window.sb){
        try{
          await apiWithTimeout(sb.from(TABLE).update({last_seen_at:nowIso(),signed_out_at:nowIso()}).eq('id',id).eq('user_id',userId),7000);
        }catch(_e){}
      }
      try{if(window.sessionStorage)sessionStorage.removeItem('sunbliss-crm-visit-session-key');}catch(_e){}
      resetVisit();
    })();
    var promise=visit.closePromise;
    promise.then(function(){visit.closePromise=null;},function(){visit.closePromise=null;});
    return promise;
  }
  window.crmVisitTrackSignIn=function(session,user,profile){return trackSession(session,user,profile);};
  window.crmVisitEndSession=function(){return closeVisitSession();};

  function installSignoutWrapper(){
    var auth=window.sb&&sb.auth;
    if(!auth||typeof auth.signOut!=='function')return false;
    if(auth.signOut.__sunblissManagerVisitWrapped)return true;
    var original=auth.signOut;
    function wrapped(options){
      return closeVisitSession().catch(function(){}).then(function(){return original.call(auth,options);});
    }
    wrapped.__sunblissManagerVisitWrapped=true;
    wrapped.__sunblissManagerVisitOriginal=original;
    auth.signOut=wrapped;
    return true;
  }

  function ensureStyles(){
    if(document.getElementById('sunblissManagerVisitHistoryStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissManagerVisitHistoryStyles';
    style.textContent=[
      '.sb-manager-visit-trigger{cursor:pointer!important;user-select:none;-webkit-user-select:none;transition:background .16s ease,border-color .16s ease,box-shadow .16s ease!important;}',
      '.sb-manager-visit-trigger::after{content:"⌄";display:inline-block;margin-left:7px;color:#f0c36b;font-size:12px;line-height:1;transform:translateY(-1px);}',
      '.sb-manager-visit-trigger:hover{background:rgba(198,151,46,.14)!important;border-color:rgba(240,195,107,.92)!important;box-shadow:0 3px 12px rgba(0,0,0,.12);}',
      '.sb-manager-visit-trigger:focus-visible{outline:2px solid #f0c36b!important;outline-offset:3px;}',
      '#managerVisitOverlay{position:fixed;inset:0;z-index:3900;background:rgba(7,21,32,.66);display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));overflow:auto;}',
      '#managerVisitDialog{width:min(720px,100%);max-height:min(88vh,820px);overflow:auto;background:var(--paper,#f6f1e4);color:var(--ink,#16232f);border:1px solid var(--paper-line,#dcd2b6);border-radius:18px;box-shadow:0 24px 70px rgba(7,21,32,.42);}',
      '.manager-visit-head{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 18px 14px;background:var(--paper,#f6f1e4);border-bottom:1px solid var(--paper-line,#dcd2b6);}',
      '.manager-visit-title{font-family:Fraunces,Georgia,serif;font-size:23px;line-height:1.15;margin:0;color:var(--ink,#16232f);}',
      '.manager-visit-sub{font:500 12px/1.45 Inter,Arial,sans-serif;color:var(--muted,#736c5c);margin:5px 0 0;}',
      '.manager-visit-close{flex:none;width:34px;height:34px;border:1px solid var(--paper-line,#dcd2b6);border-radius:9px;background:transparent;color:var(--ink,#16232f);font-size:22px;line-height:30px;cursor:pointer;}',
      '.manager-visit-close:hover{background:var(--paper-dim,#ebe3ce);}',
      '.manager-visit-body{padding:16px 18px 20px;}',
      '.manager-visit-summary{display:grid;grid-template-columns:1.3fr 1fr;gap:10px;margin:0 0 14px;}',
      '.manager-visit-summary-card{min-width:0;padding:12px 13px;border:1px solid var(--paper-line,#dcd2b6);border-radius:12px;background:rgba(255,255,255,.3);}',
      '.manager-visit-summary-label{display:block;font:650 10px/1.25 Inter,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#736c5c);margin-bottom:5px;}',
      '.manager-visit-summary-value{display:block;font:650 13px/1.4 Inter,Arial,sans-serif;color:var(--ink,#16232f);word-break:break-word;}',
      '.manager-visit-summary-note{display:block;font:500 11px/1.4 Inter,Arial,sans-serif;color:var(--muted,#736c5c);margin-top:3px;}',
      '.manager-visit-card{padding:14px;border:1px solid var(--paper-line,#dcd2b6);border-radius:13px;background:rgba(255,255,255,.22);margin:0 0 11px;}',
      '.manager-visit-card:last-child{margin-bottom:0;}',
      '.manager-visit-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}',
      '.manager-visit-person{min-width:0;}',
      '.manager-visit-person strong{display:block;font:700 14px/1.25 Inter,Arial,sans-serif;color:var(--ink,#16232f);word-break:break-word;}',
      '.manager-visit-person span{display:block;font:500 11px/1.35 Inter,Arial,sans-serif;color:var(--muted,#736c5c);margin-top:2px;}',
      '.manager-visit-status{flex:none;border-radius:999px;padding:4px 9px;font:700 10px/1.2 Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.035em;}',
      '.manager-visit-status.is-active{color:var(--sage,#3f7a57);background:rgba(63,122,87,.12);border:1px solid rgba(63,122,87,.3);}',
      '.manager-visit-status.is-closed{color:var(--slate,#45566b);background:rgba(69,86,107,.1);border:1px solid rgba(69,86,107,.25);}',
      '.manager-visit-status.is-observed{color:var(--amber,#9c5a12);background:rgba(156,90,18,.1);border:1px solid rgba(156,90,18,.28);}',
      '.manager-visit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 12px;}',
      '.manager-visit-meta{min-width:0;}',
      '.manager-visit-meta span{display:block;font:650 10px/1.25 Inter,Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#736c5c);margin-bottom:4px;}',
      '.manager-visit-meta strong{display:block;font:600 12px/1.4 Inter,Arial,sans-serif;color:var(--ink,#16232f);word-break:break-word;}',
      '.manager-visit-note{margin:11px 0 0;padding:9px 10px;border-left:3px solid rgba(198,151,46,.75);border-radius:8px;background:rgba(198,151,46,.08);font:500 11.5px/1.5 Inter,Arial,sans-serif;color:var(--ink,#16232f);}',
      '.manager-visit-empty,.manager-visit-error{padding:27px 16px;text-align:center;border:1px dashed var(--paper-line,#dcd2b6);border-radius:12px;color:var(--muted,#736c5c);font:500 12px/1.55 Inter,Arial,sans-serif;}',
      '.manager-visit-error{border-style:solid;background:rgba(174,59,43,.07);color:var(--rust,#ae3b2b);}',
      '@media(min-width:641px){#managerVisitOverlay{align-items:center;}}',
      '@media(max-width:620px){.manager-visit-summary{grid-template-columns:1fr 1fr;}.manager-visit-grid{grid-template-columns:1fr 1fr;}}',
      '@media(max-width:480px){.manager-visit-head{padding:16px 15px 13px;}.manager-visit-body{padding:14px 15px 18px;}.manager-visit-summary{grid-template-columns:1fr;}.manager-visit-grid{grid-template-columns:1fr;}.manager-visit-card{padding:13px;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function dateTimeLabel(value){
    if(!value)return 'Not recorded';
    var d=new Date(value);
    if(isNaN(d.getTime()))return escapeHtml(value);
    try{
      return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(d)+' Dubai time';
    }catch(_e){return d.toLocaleString();}
  }
  function durationLabel(seconds){
    var total=Math.max(0,Math.round(Number(seconds)||0));
    var hours=Math.floor(total/3600),minutes=Math.floor((total%3600)/60),secs=total%60;
    if(hours)return hours+'h '+minutes+'m';
    if(minutes)return minutes+'m '+secs+'s';
    return secs+'s';
  }
  function visitFacts(row){
    var start=Date.parse(row&&row.signed_in_at),out=Date.parse(row&&row.signed_out_at),last=Date.parse(row&&row.last_seen_at),now=Date.now();
    if(isNaN(start))start=now;
    var active=!isNaN(out)?false:(!isNaN(last)&&now-last<=STALE_AFTER_MS);
    var end=!isNaN(out)?out:(active?now:(!isNaN(last)?last:now));
    var duration=Math.max(0,(end-start)/1000);
    if(!isNaN(out))return {status:'closed',label:'Signed out',end:out,duration:duration};
    if(active)return {status:'active',label:'Active now',end:null,duration:duration};
    return {status:'observed',label:'Last active recorded',end:isNaN(last)?null:last,duration:duration};
  }
  function closeManagerVisitDialog(){
    if(dialogTimer){clearInterval(dialogTimer);dialogTimer=null;}
    if(dialogKeyHandler){document.removeEventListener('keydown',dialogKeyHandler);dialogKeyHandler=null;}
    var overlay=document.getElementById('managerVisitOverlay');
    if(overlay)overlay.remove();
    dialogRows=[];
  }
  function renderManagerVisitRows(rows){
    var body=document.getElementById('managerVisitBody');
    if(!body)return;
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length){
      body.innerHTML='<div class="manager-visit-empty"><b>No manager visits recorded yet.</b><br>New visits will appear after the manager signs in to the CRM.</div>';
      return;
    }
    var latest=rows[0],latestFacts=visitFacts(latest);
    var html='<div class="manager-visit-summary">'+
      '<div class="manager-visit-summary-card"><span class="manager-visit-summary-label">Last manager visit</span><strong class="manager-visit-summary-value">'+escapeHtml(dateTimeLabel(latest.signed_in_at))+'</strong><span class="manager-visit-summary-note">'+escapeHtml(latest.user_name||'Manager')+'</span></div>'+
      '<div class="manager-visit-summary-card"><span class="manager-visit-summary-label">Time in CRM</span><strong class="manager-visit-summary-value">'+escapeHtml(durationLabel(latestFacts.duration))+'</strong><span class="manager-visit-summary-note">'+escapeHtml(latestFacts.label)+'</span></div>'+
    '</div>';
    rows.forEach(function(row){
      var facts=visitFacts(row),endLabel=facts.end?dateTimeLabel(new Date(facts.end).toISOString()):facts.status==='active'?'Still active':'Not recorded';
      html+='<article class="manager-visit-card">'+
        '<div class="manager-visit-card-top"><div class="manager-visit-person"><strong>'+escapeHtml(row.user_name||'Manager')+'</strong><span>Manager account</span></div><span class="manager-visit-status is-'+facts.status+'">'+escapeHtml(facts.label)+'</span></div>'+
        '<div class="manager-visit-grid">'+
          '<div class="manager-visit-meta"><span>Signed in</span><strong>'+escapeHtml(dateTimeLabel(row.signed_in_at))+'</strong></div>'+
          '<div class="manager-visit-meta"><span>Signed out</span><strong>'+escapeHtml(endLabel)+'</strong></div>'+
          '<div class="manager-visit-meta"><span>Duration</span><strong>'+escapeHtml(durationLabel(facts.duration))+'</strong></div>'+
        '</div>'+
        (facts.status==='observed'?'<p class="manager-visit-note">A sign-out was not recorded. The duration is based on the last active CRM heartbeat.</p>':'')+
      '</article>';
    });
    body.innerHTML=html;
  }
  async function loadManagerVisits(){
    if(!window.sb||!sb.from)throw new Error('CRM visit history unavailable');
    var result=await apiWithTimeout(sb.from(TABLE).select(rowFields()).eq('user_role','manager').order('signed_in_at',{ascending:false}).limit(50),10000);
    if(result.error)throw result.error;
    return Array.isArray(result.data)?result.data:[];
  }
  async function openManagerVisitDialog(){
    if(!window.state||roleText(state.userRole)!=='crm_officer')return;
    ensureStyles();
    closeManagerVisitDialog();
    var overlay=document.createElement('div');
    overlay.id='managerVisitOverlay';
    overlay.innerHTML='<section id="managerVisitDialog" role="dialog" aria-modal="true" aria-labelledby="managerVisitTitle"><div class="manager-visit-head"><div><h3 class="manager-visit-title" id="managerVisitTitle">Manager CRM visits</h3><p class="manager-visit-sub">Sign-in time, sign-out time and time spent in the CRM · Dubai time</p></div><button type="button" class="manager-visit-close" id="managerVisitClose" aria-label="Close manager visit history">&times;</button></div><div class="manager-visit-body" id="managerVisitBody"><div class="manager-visit-empty">Loading manager visit history…</div></div></section>';
    document.body.appendChild(overlay);
    var close=document.getElementById('managerVisitClose');
    if(close)close.onclick=closeManagerVisitDialog;
    overlay.addEventListener('click',function(event){if(event.target===overlay)closeManagerVisitDialog();});
    dialogKeyHandler=function(event){if(event.key==='Escape')closeManagerVisitDialog();};
    document.addEventListener('keydown',dialogKeyHandler);
    try{
      dialogRows=await loadManagerVisits();
      renderManagerVisitRows(dialogRows);
      dialogTimer=setInterval(function(){renderManagerVisitRows(dialogRows);},30000);
    }catch(_e){
      var body=document.getElementById('managerVisitBody');
      if(body)body.innerHTML='<div class="manager-visit-error">Manager visit history could not be loaded right now. Please try again.</div>';
    }
  }

  function closest(node,selector){
    while(node&&node!==document){
      if(node.matches&&node.matches(selector))return node;
      node=node.parentNode;
    }
    return null;
  }
  function ensureTrigger(){
    var trigger=document.querySelector('.topbar.sunbliss-professional-header .sb-pro-role,.topbar .sb-pro-role');
    if(!trigger)return;
    var officer=window.state&&roleText(state.userRole)==='crm_officer';
    trigger.classList.toggle('sb-manager-visit-trigger',!!officer);
    if(officer){
      trigger.setAttribute('role','button');
      trigger.setAttribute('tabindex','0');
      trigger.setAttribute('aria-haspopup','dialog');
      trigger.setAttribute('title','View manager CRM visits');
    }else{
      trigger.removeAttribute('role');
      trigger.removeAttribute('tabindex');
      trigger.removeAttribute('aria-haspopup');
      trigger.removeAttribute('title');
    }
  }
  function queueTracking(delay){
    if(trackingQueued)return;
    trackingQueued=true;
    setTimeout(function(){
      trackingQueued=false;
      if(!window.state||!isAuthorizedRole(state.userRole)||!window.sb||!sb.auth)return;
      sb.auth.getSession().then(function(result){
        if(result&&result.data&&result.data.session&&result.data.session.user){
          trackSession(result.data.session,result.data.session.user,{role:state.userRole,full_name:state.userName});
        }
      }).catch(function(){});
    },delay||0);
  }
  function wrapRender(){
    if(typeof window.render!=='function'||window.render.__sunblissManagerVisitWrapped)return;
    var original=window.render;
    function wrapped(){
      var result=original.apply(this,arguments);
      ensureTrigger();
      queueTracking(80);
      return result;
    }
    wrapped.__sunblissManagerVisitWrapped=true;
    wrapped.__sunblissManagerVisitOriginal=original;
    window.render=wrapped;
  }
  document.addEventListener('click',function(event){
    var trigger=closest(event.target,'.sb-manager-visit-trigger');
    if(!trigger)return;
    event.preventDefault();
    event.stopPropagation();
    openManagerVisitDialog();
  },true);
  document.addEventListener('keydown',function(event){
    var trigger=closest(event.target,'.sb-manager-visit-trigger');
    if(!trigger||event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    openManagerVisitDialog();
  },true);

  ensureStyles();
  installSignoutWrapper();
  wrapRender();
  ensureTrigger();
  queueTracking(250);
  if(window.MutationObserver){
    var app=document.getElementById('app'),queued=false;
    if(app)new MutationObserver(function(){
      if(queued)return;
      queued=true;
      requestAnimationFrame(function(){queued=false;ensureTrigger();queueTracking(80);});
    }).observe(app,{childList:true,subtree:true});
  }
  setTimeout(function(){installSignoutWrapper();ensureTrigger();queueTracking(0);},1200);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){touchVisit();ensureTrigger();}});
  window.addEventListener('focus',function(){touchVisit();});
})();