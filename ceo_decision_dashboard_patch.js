(function(){
  'use strict';

  if (window.__sunblissCeoDecisionDashboardInstalled) return;
  window.__sunblissCeoDecisionDashboardInstalled = true;

  var CEO_PREVIEW_PARAM = 'ceo-preview';
  var CEO_ROLE = 'ceo';
  var originalRender = typeof window.render === 'function' ? window.render : null;
  var ceoLoadToken = 0;
  var ceoData = null;
  var ceoView = 'overview';
  var ceoSearchTerm = '';
  var ceoSelectedUnitId = null;

  function text(v){ return v == null ? '' : String(v); }
  function num(v){ var n=Number(v); return isFinite(n)?n:0; }
  function round2(v){ return Math.round((num(v)+Number.EPSILON)*100)/100; }
  function safe(v){
    return text(v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function queryPreview(){
    try { return new URLSearchParams(location.search).get(CEO_PREVIEW_PARAM)==='1'; }
    catch(_e){ return false; }
  }
  function currentRole(){
    try { return (typeof state!=='undefined' && state && state.userRole) ? text(state.userRole) : ''; }
    catch(_e){ return ''; }
  }
  function currentName(){
    try { return (typeof state!=='undefined' && state && state.userName) ? text(state.userName) : ''; }
    catch(_e){ return ''; }
  }
  function inCeoMode(){ return queryPreview() || currentRole()===CEO_ROLE; }
  function isPreview(){ return queryPreview() && currentRole()!==CEO_ROLE; }
  function todayIso(){
    var d=new Date();
    var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  }
  function parseDate(v){
    if(!v) return null;
    var d=new Date(text(v).length===10?text(v)+'T00:00:00':v);
    return isNaN(d.getTime())?null:d;
  }
  function dateIso(d){
    if(!(d instanceof Date)||isNaN(d.getTime())) return '';
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function startOfMonth(d){ return new Date(d.getFullYear(),d.getMonth(),1); }
  function endOfMonth(d){ return new Date(d.getFullYear(),d.getMonth()+1,0); }
  function daysBetween(a,b){ return Math.floor((a.getTime()-b.getTime())/86400000); }
  function money(v){
    var n=num(v), abs=Math.abs(n);
    if(abs>=10000000) return 'AED '+(n/1000000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})+'M';
    if(abs>=1000000) return 'AED '+(n/1000000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:2})+'M';
    if(abs>=100000) return 'AED '+(n/1000).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})+'K';
    return 'AED '+n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function fullMoney(v){
    return 'AED '+num(v).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function pct(part,total){ return total>0 ? Math.max(0,Math.min(999,(part/total)*100)) : 0; }
  function dateLabel(v){
    var d=parseDate(v); if(!d) return '—';
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function timeLabel(){
    return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function firstName(name){
    var n=text(name).trim();
    if(!n) return 'Shah Alam';
    return n.split(/\s+/).slice(0,2).join(' ');
  }
  function truncate(s,n){
    s=text(s).replace(/\s+/g,' ').trim();
    return s.length>n?s.slice(0,n-1).trim()+'…':s;
  }

  function ensureStyles(){
    if(document.getElementById('ceoDecisionDashboardStyles')) return;
    var style=document.createElement('style');
    style.id='ceoDecisionDashboardStyles';
    style.textContent=[
      ':root{--ceo-bg:#f5f6f8;--ceo-card:#ffffff;--ceo-ink:#17212b;--ceo-muted:#6f7b86;--ceo-line:#e4e8ec;--ceo-navy:#132636;--ceo-gold:#b98b2f;--ceo-green:#2f7755;--ceo-red:#aa463b;--ceo-amber:#9a641f;}',
      'body.ceo-mode{background:var(--ceo-bg)!important;color:var(--ceo-ink)!important;}',
      'body.ceo-mode #app{max-width:820px!important;margin:0 auto!important;padding:0 0 92px!important;background:var(--ceo-bg)!important;min-height:100vh;}',
      '.ceo-shell{min-height:100vh;background:var(--ceo-bg);font-family:Inter,system-ui,sans-serif;}',
      '.ceo-top{background:linear-gradient(145deg,#112534 0%,#192f3f 72%,#263b49 100%);color:#fff;padding:22px 18px 28px;position:relative;overflow:hidden;}',
      '.ceo-top:after{content:"";position:absolute;width:210px;height:210px;border:1px solid rgba(185,139,47,.22);border-radius:50%;right:-84px;top:-102px;box-shadow:0 0 0 34px rgba(185,139,47,.035),0 0 0 68px rgba(185,139,47,.025);pointer-events:none;}',
      '.ceo-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:relative;z-index:1;}',
      '.ceo-kicker{font:600 10px/1.2 "IBM Plex Mono",monospace;letter-spacing:.13em;text-transform:uppercase;color:#d7b768;margin:0 0 7px;}',
      '.ceo-greeting{font:600 27px/1.12 Fraunces,Georgia,serif;margin:0;color:#fff;letter-spacing:-.01em;}',
      '.ceo-role{font-size:11.5px;color:rgba(255,255,255,.65);margin:5px 0 0;}',
      '.ceo-head-actions{display:flex;gap:7px;align-items:center;position:relative;z-index:2;}',
      '.ceo-icon-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;border-radius:10px;padding:8px 10px;font-size:11px;font-weight:650;}',
      '.ceo-preview-pill{margin-top:14px;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(215,183,104,.38);background:rgba(215,183,104,.09);color:#f3db9e;padding:7px 10px;border-radius:999px;font-size:10.5px;position:relative;z-index:1;}',
      '.ceo-content{padding:0 14px 24px;margin-top:-13px;position:relative;z-index:3;}',
      '.ceo-card{background:var(--ceo-card);border:1px solid var(--ceo-line);border-radius:16px;box-shadow:0 5px 18px rgba(21,34,45,.05);overflow:hidden;}',
      '.ceo-kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}',
      '.ceo-kpi{padding:15px 14px;min-height:102px;}',
      '.ceo-kpi-label{font:600 9.5px/1.25 "IBM Plex Mono",monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--ceo-muted);margin:0 0 8px;}',
      '.ceo-kpi-value{font:650 21px/1.1 Fraunces,Georgia,serif;color:var(--ceo-ink);margin:0;}',
      '.ceo-kpi-sub{font-size:10.5px;color:var(--ceo-muted);margin:6px 0 0;line-height:1.35;}',
      '.ceo-kpi[data-tone="danger"] .ceo-kpi-value{color:var(--ceo-red);}',
      '.ceo-kpi[data-tone="good"] .ceo-kpi-value{color:var(--ceo-green);}',
      '.ceo-section{margin-top:12px;}',
      '.ceo-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px 10px;}',
      '.ceo-section-title{font:650 16px/1.2 Fraunces,Georgia,serif;margin:0;color:var(--ceo-ink);}',
      '.ceo-section-link{border:0;background:none;color:#5f4a1a;font-size:10.5px;font-weight:700;padding:4px 0;cursor:pointer;}',
      '.ceo-section-sub{font-size:10.5px;color:var(--ceo-muted);margin:3px 0 0;}',
      '.ceo-decision-row{padding:12px 15px;border-top:1px solid var(--ceo-line);cursor:pointer;background:#fff;}',
      '.ceo-decision-row:first-of-type{border-top:0;}',
      '.ceo-decision-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}',
      '.ceo-unit{font:700 11px/1.2 "IBM Plex Mono",monospace;color:var(--ceo-ink);}',
      '.ceo-tag{flex:none;font-size:9px;font-weight:750;border-radius:999px;padding:4px 7px;background:#fff6e9;color:var(--ceo-amber);border:1px solid #eed8b7;}',
      '.ceo-decision-name{font-size:11px;font-weight:650;color:var(--ceo-ink);margin:5px 0 0;}',
      '.ceo-decision-note{font-size:10.5px;line-height:1.48;color:var(--ceo-muted);margin:5px 0 0;}',
      '.ceo-decision-meta{display:flex;justify-content:space-between;gap:10px;margin-top:8px;font-size:9.5px;color:var(--ceo-muted);}',
      '.ceo-decision-meta strong{color:var(--ceo-red);font-weight:700;}',
      '.ceo-empty{padding:18px 15px;text-align:center;color:var(--ceo-muted);font-size:11px;border-top:1px solid var(--ceo-line);}',
      '.ceo-metric-block{padding:12px 15px 15px;}',
      '.ceo-metric-row{display:grid;grid-template-columns:1fr auto;gap:12px;padding:8px 0;border-top:1px solid var(--ceo-line);align-items:center;}',
      '.ceo-metric-row:first-child{border-top:0;}',
      '.ceo-metric-label{font-size:10.5px;color:var(--ceo-muted);}',
      '.ceo-metric-value{font:700 11px/1.2 "IBM Plex Mono",monospace;color:var(--ceo-ink);text-align:right;}',
      '.ceo-progress{height:6px;background:#eef1f3;border-radius:999px;overflow:hidden;margin:4px 0 2px;}',
      '.ceo-progress>span{display:block;height:100%;background:var(--ceo-gold);border-radius:999px;}',
      '.ceo-cash-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 15px 15px;}',
      '.ceo-cash-box{border:1px solid var(--ceo-line);border-radius:12px;padding:11px;background:#fafbfb;}',
      '.ceo-cash-label{font-size:9.5px;color:var(--ceo-muted);margin-bottom:5px;}',
      '.ceo-cash-value{font:700 13px/1.2 "IBM Plex Mono",monospace;color:var(--ceo-ink);}',
      '.ceo-attention{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--ceo-line);border-top:1px solid var(--ceo-line);}',
      '.ceo-attention>div{background:#fff;padding:12px 10px;text-align:center;}',
      '.ceo-attention strong{display:block;font:700 13px/1.2 "IBM Plex Mono",monospace;color:var(--ceo-ink);}',
      '.ceo-attention span{display:block;font-size:8.8px;line-height:1.25;color:var(--ceo-muted);margin-top:4px;}',
      '.ceo-status-row{display:flex;align-items:flex-start;gap:10px;padding:13px 15px 15px;}',
      '.ceo-status-dot{width:9px;height:9px;border-radius:50%;margin-top:3px;background:var(--ceo-green);box-shadow:0 0 0 4px rgba(47,119,85,.1);flex:none;}',
      '.ceo-status-dot.attention{background:var(--ceo-amber);box-shadow:0 0 0 4px rgba(154,100,31,.1);}',
      '.ceo-status-dot.critical{background:var(--ceo-red);box-shadow:0 0 0 4px rgba(170,70,59,.1);}',
      '.ceo-status-title{font-size:11px;font-weight:750;color:var(--ceo-ink);margin:0 0 3px;}',
      '.ceo-status-copy{font-size:10px;line-height:1.45;color:var(--ceo-muted);margin:0;}',
      '.ceo-page-title{padding:2px 2px 10px;}',
      '.ceo-page-title h2{font:650 21px/1.15 Fraunces,Georgia,serif;margin:0;color:var(--ceo-ink);}',
      '.ceo-page-title p{font-size:10.5px;line-height:1.4;color:var(--ceo-muted);margin:5px 0 0;}',
      '.ceo-aging{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 15px 15px;}',
      '.ceo-aging-box{border:1px solid var(--ceo-line);border-radius:12px;padding:11px;}',
      '.ceo-aging-box span{display:block;font-size:9.5px;color:var(--ceo-muted);}',
      '.ceo-aging-box strong{display:block;font:700 12px/1.2 "IBM Plex Mono",monospace;margin-top:5px;color:var(--ceo-ink);}',
      '.ceo-list-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 15px;border-top:1px solid var(--ceo-line);}',
      '.ceo-list-row:first-of-type{border-top:0;}',
      '.ceo-list-main{min-width:0;}',
      '.ceo-list-title{font-size:10.8px;font-weight:700;color:var(--ceo-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ceo-list-sub{font-size:9.5px;color:var(--ceo-muted);margin-top:3px;}',
      '.ceo-list-value{font:700 10.5px/1.2 "IBM Plex Mono",monospace;text-align:right;white-space:nowrap;}',
      '.ceo-search{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--ceo-line);border-radius:13px;padding:11px 13px;box-shadow:0 4px 14px rgba(21,34,45,.04);}',
      '.ceo-search input{border:0;outline:0;background:transparent;width:100%;font:500 13px Inter,sans-serif;color:var(--ceo-ink);}',
      '.ceo-search-results{margin-top:10px;}',
      '.ceo-search-card{background:#fff;border:1px solid var(--ceo-line);border-radius:13px;padding:12px 13px;margin-bottom:8px;cursor:pointer;}',
      '.ceo-search-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:9px;}',
      '.ceo-search-unit{font:700 11px "IBM Plex Mono",monospace;}',
      '.ceo-search-name{font-size:10.8px;font-weight:650;margin-top:4px;}',
      '.ceo-search-meta{font-size:9.5px;color:var(--ceo-muted);margin-top:6px;}',
      '.ceo-bottom{position:fixed;z-index:40;left:50%;bottom:10px;transform:translateX(-50%);width:min(760px,calc(100% - 20px));display:grid;grid-template-columns:repeat(4,1fr);background:rgba(19,38,54,.96);border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 10px 28px rgba(12,24,33,.26);overflow:hidden;backdrop-filter:blur(14px);}',
      '.ceo-nav-btn{border:0;background:transparent;color:rgba(255,255,255,.58);padding:10px 4px 9px;font-size:8.8px;font-weight:650;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;}',
      '.ceo-nav-btn svg{width:18px;height:18px;stroke:currentColor;}',
      '.ceo-nav-btn.active{color:#f0d286;background:rgba(255,255,255,.05);}',
      '.ceo-overlay{position:fixed;z-index:100;inset:0;background:rgba(10,19,26,.46);display:flex;align-items:flex-end;justify-content:center;padding-top:48px;}',
      '.ceo-detail{width:min(820px,100%);max-height:92vh;background:var(--ceo-bg);border-radius:20px 20px 0 0;overflow:auto;box-shadow:0 -14px 34px rgba(0,0,0,.2);}',
      '.ceo-detail-head{position:sticky;top:0;z-index:2;background:rgba(245,246,248,.96);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border-bottom:1px solid var(--ceo-line);}',
      '.ceo-detail-head h3{font:650 18px Fraunces,Georgia,serif;margin:0;}',
      '.ceo-close{width:32px;height:32px;border:1px solid var(--ceo-line);background:#fff;border-radius:50%;font-size:18px;line-height:1;}',
      '.ceo-detail-body{padding:12px 14px 28px;}',
      '.ceo-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}',
      '.ceo-detail-stat{background:#fff;border:1px solid var(--ceo-line);border-radius:12px;padding:11px;}',
      '.ceo-detail-stat span{display:block;font-size:9px;color:var(--ceo-muted);margin-bottom:5px;}',
      '.ceo-detail-stat strong{font:700 11px "IBM Plex Mono",monospace;}',
      '.ceo-note{background:#fffaf0;border:1px solid #ead9b5;border-radius:12px;padding:11px 12px;font-size:10.5px;line-height:1.5;color:#5d523d;margin-bottom:10px;}',
      '.ceo-tx{background:#fff;border:1px solid var(--ceo-line);border-radius:12px;overflow:hidden;}',
      '.ceo-tx-row{display:grid;grid-template-columns:72px 1fr auto;gap:8px;padding:10px 11px;border-top:1px solid var(--ceo-line);align-items:center;}',
      '.ceo-tx-row:first-child{border-top:0;}',
      '.ceo-tx-date{font-size:8.8px;color:var(--ceo-muted);}',
      '.ceo-tx-type{font-size:9.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ceo-tx-amt{font:700 9.8px "IBM Plex Mono",monospace;}',
      '.ceo-loading{padding:80px 20px;text-align:center;color:var(--ceo-muted);font-size:12px;}',
      '.ceo-loader{width:28px;height:28px;border:2px solid #dfe4e8;border-top-color:var(--ceo-gold);border-radius:50%;margin:0 auto 12px;animation:ceoSpin .8s linear infinite;}',
      '@keyframes ceoSpin{to{transform:rotate(360deg)}}',
      '@media(min-width:680px){.ceo-kpi-grid{grid-template-columns:repeat(4,1fr)}.ceo-kpi{min-height:112px}.ceo-cash-grid{grid-template-columns:repeat(4,1fr)}.ceo-aging{grid-template-columns:repeat(4,1fr)}.ceo-content{padding-left:18px;padding-right:18px}.ceo-top{padding-left:22px;padding-right:22px}.ceo-detail-grid{grid-template-columns:repeat(4,1fr)}}',
      '@media(max-width:390px){.ceo-kpi-value{font-size:19px}.ceo-greeting{font-size:24px}.ceo-attention{grid-template-columns:1fr}.ceo-attention>div{text-align:left;display:flex;align-items:center;justify-content:space-between}.ceo-attention span{margin-top:0}.ceo-cash-grid{grid-template-columns:1fr 1fr}}'
    ].join('');
    document.head.appendChild(style);
  }

  function icon(name){
    var paths={
      overview:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
      decisions:'<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/><path d="M17 3h4v4"/>',
      portfolio:'<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/><path d="M3 20h18"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
  }

  function renderLoading(){
    document.body.classList.add('ceo-mode');
    var app=document.getElementById('app');
    if(!app) return;
    app.innerHTML='<div class="ceo-shell"><div class="ceo-top"><p class="ceo-kicker">Executive View</p><h1 class="ceo-greeting">CEO Decision Dashboard</h1><p class="ceo-role">Preparing live management position…</p></div><div class="ceo-loading"><div class="ceo-loader"></div>Loading sales, collections and decision data</div></div>';
  }

  function supabaseSelect(table,columns){
    return sb.from(table).select(columns);
  }

  async function loadCeoData(){
    var token=++ceoLoadToken;
    var results=await Promise.all([
      supabaseSelect('customers','id,customer_name,phone,email'),
      supabaseSelect('units','id,unit_no,project_name,unit_type,total_price,status,availability_status,customer_id'),
      supabaseSelect('sales','id,customer_id,unit_id,booking_date,booking_amount,spa_status,oqood_status,dld_status,remarks,customer_note,updated_at'),
      supabaseSelect('payment_schedule','id,customer_id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status,remarks'),
      supabaseSelect('payment_transactions','id,customer_id,unit_id,payment_schedule_id,payment_date,amount,payment_type,payment_reference,remarks,created_at'),
      supabaseSelect('credit_notes','id,customer_id,unit_id,payment_schedule_id,issue_date,amount,reason,reference_number'),
      supabaseSelect('carry_forward_events','id,customer_id,unit_id,payment_schedule_id,event_date,amount,reason'),
      supabaseSelect('carry_forward_allocations','id,positive_event_id,negative_event_id,amount,allocation_date'),
      supabaseSelect('payment_extensions','id,customer_id,unit_id,payment_schedule_id,original_due_date,extended_due_date,approved_on,approved_by,reason,penalty_basis,status,completed_at,expired_at,cancelled_at'),
      supabaseSelect('scheduled_actions','id,unit_id,action_label,due_date,priority,note,status,source,auto_kind,schedule_id,updated_at'),
      supabaseSelect('cancelled_units','id,customer_id,unit_id,cancellation_date,cancellation_reason,amount_paid,forfeited_amount,retained_amount,cancelled_sale_value')
    ]);
    if(token!==ceoLoadToken) return null;
    results.forEach(function(r){ if(r.error) throw r.error; });
    return buildModel({
      customers:results[0].data||[],units:results[1].data||[],sales:results[2].data||[],
      schedules:results[3].data||[],transactions:results[4].data||[],creditNotes:results[5].data||[],
      carryEvents:results[6].data||[],carryAllocations:results[7].data||[],extensions:results[8].data||[],
      actions:results[9].data||[],cancelled:results[10].data||[]
    });
  }

  function buildModel(raw){
    var customerById={},unitById={},saleByUnit={},txByUnit={},txBySchedule={},creditBySchedule={},carryEventById={},carryAppliedBySchedule={},extensionsBySchedule={},scheduleById={};
    raw.customers.forEach(function(c){customerById[text(c.id)]=c;});
    raw.units.forEach(function(u){unitById[text(u.id)]=u;});
    raw.sales.forEach(function(s){saleByUnit[text(s.unit_id)]=s;});
    raw.transactions.forEach(function(t){
      (txByUnit[text(t.unit_id)]||(txByUnit[text(t.unit_id)]=[])).push(t);
      txBySchedule[text(t.payment_schedule_id)]=(txBySchedule[text(t.payment_schedule_id)]||0)+num(t.amount);
    });
    raw.creditNotes.forEach(function(c){creditBySchedule[text(c.payment_schedule_id)]=(creditBySchedule[text(c.payment_schedule_id)]||0)+num(c.amount);});
    raw.carryEvents.forEach(function(e){carryEventById[text(e.id)]=e;});
    raw.carryAllocations.forEach(function(a){
      var negative=carryEventById[text(a.negative_event_id)];
      if(negative && negative.payment_schedule_id!=null){
        carryAppliedBySchedule[text(negative.payment_schedule_id)]=(carryAppliedBySchedule[text(negative.payment_schedule_id)]||0)+num(a.amount);
      }
    });
    raw.extensions.forEach(function(ex){
      if(ex.status==='cancelled') return;
      var key=text(ex.payment_schedule_id),list=extensionsBySchedule[key]||(extensionsBySchedule[key]=[]);
      list.push(ex);
    });
    Object.keys(extensionsBySchedule).forEach(function(k){
      extensionsBySchedule[k].sort(function(a,b){ return text(b.extended_due_date).localeCompare(text(a.extended_due_date))||num(b.id)-num(a.id);});
    });

    var activeSoldUnits=raw.units.filter(function(u){return text(u.availability_status).toLowerCase()==='sold'&&text(u.status).toLowerCase()!=='cancelled';});
    var activeUnitIds={};activeSoldUnits.forEach(function(u){activeUnitIds[text(u.id)]=true;});
    var availableUnits=raw.units.filter(function(u){return text(u.availability_status).toLowerCase()==='available'&&text(u.status).toLowerCase()!=='cancelled';});
    var cancelledUnits=raw.units.filter(function(u){return text(u.status).toLowerCase()==='cancelled';});

    var today=parseDate(todayIso()),monthStart=startOfMonth(today),monthEnd=endOfMonth(today);
    var stages=[];
    raw.schedules.forEach(function(s){
      if(!activeUnitIds[text(s.unit_id)]) return;
      scheduleById[text(s.id)]=s;
      var extension=(extensionsBySchedule[text(s.id)]||[])[0]||null;
      var effectiveDate=(extension&&extension.extended_due_date)||s.revised_due_date||s.due_date||'';
      var cashStored=num(s.paid_amount);
      var cashLedger=num(txBySchedule[text(s.id)]);
      var cash=Math.max(cashStored,cashLedger);
      var credit=num(creditBySchedule[text(s.id)]);
      var carry=num(carryAppliedBySchedule[text(s.id)]);
      var settled=Math.min(num(s.due_amount),Math.max(0,cash+credit+carry));
      var balance=Math.max(0,num(s.due_amount)-settled);
      var d=parseDate(effectiveDate);
      stages.push({
        id:s.id,customerId:s.customer_id,unitId:s.unit_id,name:s.stage_name||'Installment',
        due:num(s.due_amount),cash:cash,credit:credit,carry:carry,settled:settled,balance:balance,
        dueDate:s.due_date,revisedDueDate:s.revised_due_date,effectiveDate:effectiveDate,date:d,status:s.status||'',
        extension:extension
      });
    });

    var salesValue=activeSoldUnits.reduce(function(sum,u){return sum+num(u.total_price);},0);
    var cashCollected=raw.transactions.reduce(function(sum,t){return activeUnitIds[text(t.unit_id)]?sum+num(t.amount):sum;},0);
    var creditTotal=raw.creditNotes.reduce(function(sum,c){return activeUnitIds[text(c.unit_id)]?sum+num(c.amount):sum;},0);
    var outstanding=stages.reduce(function(sum,s){return sum+s.balance;},0);
    var overdueStages=stages.filter(function(s){return s.balance>1&&s.date&&s.date<today;});
    var overdue=overdueStages.reduce(function(sum,s){return sum+s.balance;},0);

    var monthStages=stages.filter(function(s){return s.date&&s.date>=monthStart&&s.date<=monthEnd;});
    var monthDue=monthStages.reduce(function(sum,s){return sum+s.due;},0);
    var monthSettled=monthStages.reduce(function(sum,s){return sum+s.settled;},0);
    var monthPending=monthStages.reduce(function(sum,s){return sum+s.balance;},0);

    function windowOutstanding(days){
      var end=addDays(today,days);
      return stages.filter(function(s){return s.balance>1&&s.date&&s.date>=today&&s.date<=end;}).reduce(function(sum,s){return sum+s.balance;},0);
    }
    var expected={d7:windowOutstanding(7),d30:windowOutstanding(30),d60:windowOutstanding(60),d90:windowOutstanding(90)};

    var aging={d7:0,d30:0,d60:0,d60plus:0};
    overdueStages.forEach(function(s){
      var late=daysBetween(today,s.date);
      if(late<=7) aging.d7+=s.balance;
      else if(late<=30) aging.d30+=s.balance;
      else if(late<=60) aging.d60+=s.balance;
      else aging.d60plus+=s.balance;
    });

    var unitMetrics={};
    activeSoldUnits.forEach(function(u){
      var uid=text(u.id),unitStages=stages.filter(function(s){return text(s.unitId)===uid;});
      var unitTx=(txByUnit[uid]||[]).slice().sort(function(a,b){return text(b.payment_date).localeCompare(text(a.payment_date))||num(b.id)-num(a.id);});
      var unitOutstanding=unitStages.reduce(function(sum,s){return sum+s.balance;},0);
      var unitOverdue=unitStages.filter(function(s){return s.balance>1&&s.date&&s.date<today;}).reduce(function(sum,s){return sum+s.balance;},0);
      var next=unitStages.filter(function(s){return s.balance>1&&s.date&&s.date>=today;}).sort(function(a,b){return a.date-b.date;})[0]||null;
      var activeExtension=raw.extensions.filter(function(ex){return text(ex.unit_id)===uid&&ex.status==='active';}).sort(function(a,b){return text(a.extended_due_date).localeCompare(text(b.extended_due_date));})[0]||null;
      unitMetrics[uid]={
        unit:u,customer:customerById[text(u.customer_id)]||{},sale:saleByUnit[uid]||{},
        stages:unitStages,transactions:unitTx,outstanding:unitOutstanding,overdue:unitOverdue,next:next,activeExtension:activeExtension,
        cash:unitTx.reduce(function(sum,t){return sum+num(t.amount);},0)
      };
    });

    var decisions=[];
    function addDecision(uid,source,note){
      var metric=unitMetrics[text(uid)],u=unitById[text(uid)];
      if(!metric||!u) return;
      var key=text(uid)+'|'+source;
      if(decisions.some(function(d){return d.key===key;})) return;
      var lower=text(note).toLowerCase();
      var type='Management Review';
      if(/cancel|cancellation/.test(lower)) type='Cancellation Review';
      else if(/waiver|late.?charge/.test(lower)) type='Waiver / Payment Review';
      else if(/extension|restructur|proposal|payment plan|defer/.test(lower)) type='Payment Restructuring';
      else if(/modification|alteration|construction/.test(lower)) type='Modification Review';
      else if(/credit.?note|price|adjust/.test(lower)) type='Commercial Adjustment';
      decisions.push({
        key:key,unitId:uid,unitNo:u.unit_no||'Unit',customer:metric.customer.customer_name||'Customer',
        note:text(note),type:type,outstanding:metric.outstanding,overdue:metric.overdue
      });
    }

    raw.sales.forEach(function(s){
      if(!activeUnitIds[text(s.unit_id)]) return;
      var note=[s.customer_note,s.remarks].filter(Boolean).join(' ');
      var lower=note.toLowerCase();
      var pending=/(referred to management|pending management|pending .*confirmation|awaiting .*approval|for final review|management review|decision required|no formal credit.?note has been issued yet)/i.test(note);
      var resolvedOnly=/management (approved|declined|allowed|agreed|confirmed)/i.test(note)&&!pending;
      if(pending&&!resolvedOnly) addDecision(s.unit_id,'sale',note);
    });
    raw.actions.forEach(function(a){
      if(a.status!=='pending'||!activeUnitIds[text(a.unit_id)]) return;
      var note=[a.action_label,a.note].filter(Boolean).join(' ');
      if(/management|approval|decision|waiver|final review|proposal/i.test(note)&&!/gentle reminder|demand letter|urgent follow.?up/i.test(note)){
        addDecision(a.unit_id,'action',note);
      }
    });
    decisions.sort(function(a,b){return (b.overdue||b.outstanding)-(a.overdue||a.outstanding);});

    var activeExtensions=raw.extensions.filter(function(ex){return ex.status==='active'&&activeUnitIds[text(ex.unit_id)];});
    var extensionExposure=activeExtensions.reduce(function(sum,ex){
      var stage=stages.find(function(s){return text(s.id)===text(ex.payment_schedule_id);});
      return sum+(stage?stage.balance:0);
    },0);
    var extensionDue7=activeExtensions.filter(function(ex){
      var d=parseDate(ex.extended_due_date); return d&&d>=today&&d<=addDays(today,7);
    }).reduce(function(sum,ex){
      var stage=stages.find(function(s){return text(s.id)===text(ex.payment_schedule_id);});
      return sum+(stage?stage.balance:0);
    },0);

    var overdue30=overdueStages.filter(function(s){return daysBetween(today,s.date)>30;}).reduce(function(sum,s){return sum+s.balance;},0);
    var overdue60=overdueStages.filter(function(s){return daysBetween(today,s.date)>60;}).reduce(function(sum,s){return sum+s.balance;},0);

    var soldType={};
    activeSoldUnits.forEach(function(u){var k=text(u.unit_type||'Unspecified').trim()||'Unspecified';soldType[k]=(soldType[k]||0)+1;});
    var recentMonths=[];
    for(var i=5;i>=0;i--){
      var d=new Date(today.getFullYear(),today.getMonth()-i,1);
      var key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      var count=raw.sales.filter(function(s){
        if(!activeUnitIds[text(s.unit_id)]||!s.booking_date) return false;
        return text(s.booking_date).slice(0,7)===key;
      }).length;
      var value=raw.sales.filter(function(s){return activeUnitIds[text(s.unit_id)]&&text(s.booking_date).slice(0,7)===key;}).reduce(function(sum,s){
        var u=unitById[text(s.unit_id)]; return sum+(u?num(u.total_price):0);
      },0);
      recentMonths.push({key:key,label:d.toLocaleDateString('en-GB',{month:'short'}),count:count,value:value});
    }

    var health='Good',healthTone='good',healthCopy='Collections and management exceptions are within the current operating position.';
    var overdueRatio=outstanding>0?overdue/outstanding:0;
    if(decisions.length||overdueRatio>=0.03){health='Needs attention';healthTone='attention';healthCopy=(decisions.length?decisions.length+' management decision'+(decisions.length===1?'':'s')+' pending. ':'')+(overdue?fullMoney(overdue)+' is currently overdue.':'');}
    if(overdueRatio>=0.08||overdue60>0){health='Priority attention';healthTone='critical';healthCopy=(overdue60?fullMoney(overdue60)+' is overdue by more than 60 days. ':'')+(decisions.length?decisions.length+' management decision'+(decisions.length===1?'':'s')+' pending.':'');}

    return {
      raw:raw,customerById:customerById,unitById:unitById,saleByUnit:saleByUnit,unitMetrics:unitMetrics,stages:stages,
      activeSoldUnits:activeSoldUnits,availableUnits:availableUnits,cancelledUnits:cancelledUnits,
      salesValue:salesValue,cashCollected:cashCollected,creditTotal:creditTotal,outstanding:outstanding,overdue:overdue,
      monthDue:monthDue,monthSettled:monthSettled,monthPending:monthPending,expected:expected,aging:aging,
      decisions:decisions,activeExtensions:activeExtensions,extensionExposure:extensionExposure,extensionDue7:extensionDue7,
      overdue30:overdue30,overdue60:overdue60,soldType:soldType,recentMonths:recentMonths,
      health:health,healthTone:healthTone,healthCopy:healthCopy,generatedAt:timeLabel()
    };
  }

  function header(){
    var name=isPreview()?'Shah Alam':firstName(currentName()||'Shah Alam');
    return '<header class="ceo-top">'+
      '<div class="ceo-topline"><div><p class="ceo-kicker">Executive View</p><h1 class="ceo-greeting">Good evening, '+safe(name)+'</h1><p class="ceo-role">CEO &amp; Managing Director · Decision Dashboard</p></div>'+
      '<div class="ceo-head-actions">'+(isPreview()?'<button class="ceo-icon-btn" id="ceoExitPreview">CRM</button>':'')+'<button class="ceo-icon-btn" id="ceoSignOut">Sign out</button></div></div>'+
      (isPreview()?'<div class="ceo-preview-pill">Preview mode · Interface only · no CEO permissions created yet</div>':'')+
      '</header>';
  }

  function kpi(label,value,sub,tone){
    return '<div class="ceo-card ceo-kpi"'+(tone?' data-tone="'+tone+'"':'')+'><p class="ceo-kpi-label">'+safe(label)+'</p><p class="ceo-kpi-value">'+safe(value)+'</p><p class="ceo-kpi-sub">'+safe(sub||'')+'</p></div>';
  }

  function decisionRows(limit){
    var items=ceoData.decisions.slice(0,limit||999);
    if(!items.length) return '<div class="ceo-empty">No management decisions are currently flagged.</div>';
    return items.map(function(d){
      return '<div class="ceo-decision-row" data-ceo-unit="'+safe(d.unitId)+'"><div class="ceo-decision-top"><div><div class="ceo-unit">'+safe(d.unitNo)+'</div><div class="ceo-decision-name">'+safe(d.customer)+'</div></div><span class="ceo-tag">'+safe(d.type)+'</span></div>'+
      '<p class="ceo-decision-note">'+safe(truncate(d.note,190))+'</p><div class="ceo-decision-meta"><span>Outstanding '+safe(fullMoney(d.outstanding))+'</span><strong>'+(d.overdue>0?'Overdue '+safe(fullMoney(d.overdue)):'Decision required')+'</strong></div></div>';
    }).join('');
  }

  function overview(){
    var m=ceoData, rate=pct(m.monthSettled,m.monthDue);
    return '<div class="ceo-page ceo-overview">'+
      '<div class="ceo-kpi-grid">'+
        kpi('Total Sales Value',money(m.salesValue),m.activeSoldUnits.length+' active sold units')+
        kpi('Cash Collected',money(m.cashCollected),pct(m.cashCollected,m.salesValue).toFixed(1)+'% of active sales value','good')+
        kpi('Outstanding',money(m.outstanding),'Scheduled balance after recorded settlements')+
        kpi('Overdue',money(m.overdue),m.overdue>0?'Requires collection attention':'No overdue exposure',m.overdue>0?'danger':'good')+
      '</div>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">'+m.decisions.length+' Decision'+(m.decisions.length===1?'':'s')+' Require Your Attention</h2><p class="ceo-section-sub">Only cases with management review or approval language are shown.</p></div><button class="ceo-section-link" data-ceo-view="decisions">View all</button></div>'+decisionRows(3)+'</section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Collections</h2><p class="ceo-section-sub">Current month position and forward cash schedule.</p></div></div>'+
        '<div class="ceo-metric-block"><div class="ceo-metric-row"><span class="ceo-metric-label">Due this month</span><span class="ceo-metric-value">'+safe(fullMoney(m.monthDue))+'</span></div>'+
        '<div class="ceo-metric-row"><span class="ceo-metric-label">Settled against this month&apos;s dues</span><span class="ceo-metric-value">'+safe(fullMoney(m.monthSettled))+'</span></div>'+
        '<div class="ceo-progress"><span style="width:'+Math.min(100,rate).toFixed(1)+'%"></span></div><div class="ceo-metric-row"><span class="ceo-metric-label">Collection progress</span><span class="ceo-metric-value">'+rate.toFixed(1)+'%</span></div></div>'+
        '<div class="ceo-cash-grid"><div class="ceo-cash-box"><div class="ceo-cash-label">Next 7 days</div><div class="ceo-cash-value">'+safe(money(m.expected.d7))+'</div></div><div class="ceo-cash-box"><div class="ceo-cash-label">Next 30 days</div><div class="ceo-cash-value">'+safe(money(m.expected.d30))+'</div></div><div class="ceo-cash-box"><div class="ceo-cash-label">Next 60 days</div><div class="ceo-cash-value">'+safe(money(m.expected.d60))+'</div></div><div class="ceo-cash-box"><div class="ceo-cash-label">Next 90 days</div><div class="ceo-cash-value">'+safe(money(m.expected.d90))+'</div></div></div>'+
      '</section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Portfolio</h2><p class="ceo-section-sub">Live inventory position.</p></div><button class="ceo-section-link" data-ceo-view="portfolio">Explore</button></div>'+
        '<div class="ceo-attention"><div><strong>'+m.activeSoldUnits.length+'</strong><span>Sold</span></div><div><strong>'+m.availableUnits.length+'</strong><span>Available</span></div><div><strong>'+m.cancelledUnits.length+'</strong><span>Cancelled</span></div></div></section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Management Snapshot</h2><p class="ceo-section-sub">What deserves attention now.</p></div></div>'+
        '<div class="ceo-status-row"><span class="ceo-status-dot '+safe(m.healthTone)+'"></span><div><p class="ceo-status-title">'+safe(m.health)+'</p><p class="ceo-status-copy">'+safe(m.healthCopy)+'</p></div></div>'+
        '<div class="ceo-attention"><div><strong>'+safe(money(m.overdue30))+'</strong><span>Overdue &gt;30 days</span></div><div><strong>'+safe(money(m.extensionDue7))+'</strong><span>Extensions due in 7 days</span></div><div><strong>'+m.decisions.length+'</strong><span>Management decisions</span></div></div>'+
      '</section>'+
      '<p style="font-size:9px;color:var(--ceo-muted);text-align:center;margin:14px 0 0">Updated '+safe(m.generatedAt)+'</p>'+
    '</div>';
  }

  function decisionsPage(){
    var m=ceoData;
    return '<div class="ceo-page"><div class="ceo-page-title"><h2>Decision Centre</h2><p>Management exceptions first; operating follow-ups stay out of this view.</p></div>'+
      '<section class="ceo-card">'+decisionRows()+'</section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Overdue Exposure</h2><p class="ceo-section-sub">Aging of currently unsettled scheduled amounts.</p></div></div>'+
        '<div class="ceo-aging"><div class="ceo-aging-box"><span>1–7 days</span><strong>'+safe(money(m.aging.d7))+'</strong></div><div class="ceo-aging-box"><span>8–30 days</span><strong>'+safe(money(m.aging.d30))+'</strong></div><div class="ceo-aging-box"><span>31–60 days</span><strong>'+safe(money(m.aging.d60))+'</strong></div><div class="ceo-aging-box"><span>60+ days</span><strong>'+safe(money(m.aging.d60plus))+'</strong></div></div></section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Active Extensions</h2><p class="ceo-section-sub">'+m.activeExtensions.length+' active extension'+(m.activeExtensions.length===1?'':'s')+' · '+safe(fullMoney(m.extensionExposure))+' affected.</p></div></div>'+
        activeExtensionRows()+
      '</section></div>';
  }

  function activeExtensionRows(){
    var m=ceoData,rows=m.activeExtensions.map(function(ex){
      var metric=m.unitMetrics[text(ex.unit_id)],stage=m.stages.find(function(s){return text(s.id)===text(ex.payment_schedule_id);});
      if(!metric||!stage) return null;
      return {unit:metric.unit.unit_no||'Unit',customer:metric.customer.customer_name||'Customer',date:ex.extended_due_date,balance:stage.balance};
    }).filter(Boolean).sort(function(a,b){return text(a.date).localeCompare(text(b.date));});
    if(!rows.length) return '<div class="ceo-empty">No active payment extensions.</div>';
    return rows.map(function(r){return '<div class="ceo-list-row"><div class="ceo-list-main"><div class="ceo-list-title">'+safe(r.unit)+' · '+safe(r.customer)+'</div><div class="ceo-list-sub">Extended until '+safe(dateLabel(r.date))+'</div></div><div class="ceo-list-value">'+safe(fullMoney(r.balance))+'</div></div>';}).join('');
  }

  function portfolioPage(){
    var m=ceoData,types=Object.keys(m.soldType).sort(function(a,b){return m.soldType[b]-m.soldType[a];}),maxType=Math.max.apply(null,types.map(function(k){return m.soldType[k];}).concat([1]));
    var typeRows=types.map(function(k){
      return '<div class="ceo-metric-row"><div style="min-width:0"><div class="ceo-metric-label">'+safe(k)+'</div><div class="ceo-progress" style="margin-top:6px"><span style="width:'+((m.soldType[k]/maxType)*100).toFixed(1)+'%"></span></div></div><span class="ceo-metric-value">'+m.soldType[k]+'</span></div>';
    }).join('');
    var monthRows=m.recentMonths.map(function(x){return '<div class="ceo-list-row"><div class="ceo-list-main"><div class="ceo-list-title">'+safe(x.label)+'</div><div class="ceo-list-sub">'+x.count+' sale'+(x.count===1?'':'s')+'</div></div><div class="ceo-list-value">'+safe(money(x.value))+'</div></div>';}).join('');
    return '<div class="ceo-page"><div class="ceo-page-title"><h2>Portfolio</h2><p>Sales position, inventory and recent booking momentum.</p></div>'+
      '<div class="ceo-kpi-grid">'+
        kpi('Sold',String(m.activeSoldUnits.length),money(m.salesValue)+' active sales')+
        kpi('Available',String(m.availableUnits.length),'Unsold inventory')+
        kpi('Cancelled',String(m.cancelledUnits.length),'Archived cancelled units')+
        kpi('Credit Notes',money(m.creditTotal),'Recorded commercial adjustments')+
      '</div>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Sold Unit Mix</h2><p class="ceo-section-sub">Active sold units by type.</p></div></div><div class="ceo-metric-block">'+typeRows+'</div></section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Sales · Last 6 Months</h2><p class="ceo-section-sub">Booking count and active sale value.</p></div></div>'+monthRows+'</section>'+
      '<section class="ceo-card ceo-section"><div class="ceo-section-head"><div><h2 class="ceo-section-title">Commercial Exposure</h2></div></div><div class="ceo-attention"><div><strong>'+safe(money(m.extensionExposure))+'</strong><span>Active extensions</span></div><div><strong>'+safe(money(m.creditTotal))+'</strong><span>Credit notes</span></div><div><strong>'+safe(money(m.overdue))+'</strong><span>Overdue</span></div></div></section>'+
      '</div>';
  }

  function searchPage(){
    var m=ceoData,term=ceoSearchTerm.trim().toLowerCase();
    var rows=Object.keys(m.unitMetrics).map(function(k){return m.unitMetrics[k];}).filter(function(x){
      if(!term) return true;
      var hay=[x.unit.unit_no,x.customer.customer_name,x.customer.phone,x.customer.email].join(' ').toLowerCase();
      return hay.indexOf(term)!==-1;
    }).sort(function(a,b){return text(a.unit.unit_no).localeCompare(text(b.unit.unit_no));}).slice(0,term?40:12);
    var cards=rows.map(function(x){
      return '<div class="ceo-search-card" data-ceo-unit="'+safe(x.unit.id)+'"><div class="ceo-search-card-top"><div><div class="ceo-search-unit">'+safe(x.unit.unit_no)+'</div><div class="ceo-search-name">'+safe(x.customer.customer_name||'Customer')+'</div></div><div class="ceo-list-value">'+safe(fullMoney(x.outstanding))+'</div></div><div class="ceo-search-meta">Paid '+safe(fullMoney(x.cash))+' · '+(x.overdue>0?'Overdue '+safe(fullMoney(x.overdue)):(x.next?'Next '+safe(dateLabel(x.next.effectiveDate)):'No pending installment'))+'</div></div>';
    }).join('');
    return '<div class="ceo-page"><div class="ceo-page-title"><h2>Customer &amp; Unit Search</h2><p>Read-only access to the information needed for a management query.</p></div>'+
      '<div class="ceo-search"><span style="font-size:15px;color:var(--ceo-muted)">⌕</span><input id="ceoSearchInput" type="search" placeholder="Search unit, customer, phone or email" value="'+safe(ceoSearchTerm)+'" autocomplete="off"></div>'+
      '<div class="ceo-search-results">'+(cards||'<div class="ceo-empty">No matching customer or unit.</div>')+'</div></div>';
  }

  function bottomNav(){
    return '<nav class="ceo-bottom" aria-label="Executive navigation">'+
      navBtn('overview','Overview')+navBtn('decisions','Decisions')+navBtn('portfolio','Portfolio')+navBtn('search','Search')+
      '</nav>';
  }
  function navBtn(view,label){
    return '<button class="ceo-nav-btn '+(ceoView===view?'active':'')+'" data-ceo-view="'+view+'">'+icon(view)+'<span>'+safe(label)+'</span></button>';
  }

  function renderCeo(){
    if(!ceoData){ renderLoading(); return; }
    ensureStyles();
    document.body.classList.add('ceo-mode');
    var app=document.getElementById('app'); if(!app) return;
    var body=ceoView==='decisions'?decisionsPage():ceoView==='portfolio'?portfolioPage():ceoView==='search'?searchPage():overview();
    app.innerHTML='<div class="ceo-shell">'+header()+'<main class="ceo-content">'+body+'</main>'+bottomNav()+'</div>';
    bindCeo();
    if(ceoSelectedUnitId) openUnitDetail(ceoSelectedUnitId);
  }

  function bindCeo(){
    document.querySelectorAll('[data-ceo-view]').forEach(function(btn){
      btn.addEventListener('click',function(){ceoView=this.getAttribute('data-ceo-view')||'overview';ceoSelectedUnitId=null;renderCeo();window.scrollTo({top:0,behavior:'smooth'});});
    });
    document.querySelectorAll('[data-ceo-unit]').forEach(function(row){
      row.addEventListener('click',function(){openUnitDetail(this.getAttribute('data-ceo-unit'));});
    });
    var input=document.getElementById('ceoSearchInput');
    if(input){
      input.addEventListener('input',function(){ceoSearchTerm=this.value;var pos=this.selectionStart;renderCeo();var next=document.getElementById('ceoSearchInput');if(next){next.focus();try{next.setSelectionRange(pos,pos);}catch(_e){}}});
    }
    var exit=document.getElementById('ceoExitPreview');
    if(exit) exit.onclick=function(){var u=new URL(location.href);u.searchParams.delete(CEO_PREVIEW_PARAM);location.href=u.toString();};
    var sign=document.getElementById('ceoSignOut');
    if(sign) sign.onclick=async function(){try{await sb.auth.signOut();}catch(_e){}var u=new URL(location.href);u.searchParams.delete(CEO_PREVIEW_PARAM);location.href=u.pathname;};
  }

  function openUnitDetail(unitId){
    var x=ceoData.unitMetrics[text(unitId)];
    if(!x) return;
    ceoSelectedUnitId=null;
    var note=[x.sale.customer_note,x.sale.remarks].filter(Boolean).join(' ');
    var next=x.next;
    var tx=x.transactions.slice(0,8);
    var txRows=tx.length?tx.map(function(t){
      return '<div class="ceo-tx-row"><span class="ceo-tx-date">'+safe(dateLabel(t.payment_date))+'</span><span class="ceo-tx-type">'+safe(t.payment_type||'Payment')+'</span><span class="ceo-tx-amt">'+safe(fullMoney(t.amount))+'</span></div>';
    }).join(''):'<div class="ceo-empty">No payment transactions recorded.</div>';
    var overlay=document.createElement('div');
    overlay.className='ceo-overlay';
    overlay.id='ceoUnitOverlay';
    overlay.innerHTML='<section class="ceo-detail"><div class="ceo-detail-head"><div><div class="ceo-unit">'+safe(x.unit.unit_no)+'</div><h3>'+safe(x.customer.customer_name||'Customer')+'</h3></div><button class="ceo-close" aria-label="Close">×</button></div><div class="ceo-detail-body">'+
      '<div class="ceo-detail-grid"><div class="ceo-detail-stat"><span>Sale value</span><strong>'+safe(fullMoney(x.unit.total_price))+'</strong></div><div class="ceo-detail-stat"><span>Cash paid</span><strong>'+safe(fullMoney(x.cash))+'</strong></div><div class="ceo-detail-stat"><span>Outstanding</span><strong>'+safe(fullMoney(x.outstanding))+'</strong></div><div class="ceo-detail-stat"><span>Overdue</span><strong>'+safe(fullMoney(x.overdue))+'</strong></div></div>'+
      '<div class="ceo-detail-grid"><div class="ceo-detail-stat"><span>Next payment</span><strong>'+(next?safe(fullMoney(next.balance)):'—')+'</strong></div><div class="ceo-detail-stat"><span>Next due date</span><strong>'+(next?safe(dateLabel(next.effectiveDate)):'—')+'</strong></div><div class="ceo-detail-stat"><span>SPA</span><strong>'+safe(x.sale.spa_status||'—')+'</strong></div><div class="ceo-detail-stat"><span>Oqood</span><strong>'+safe(x.sale.oqood_status||'—')+'</strong></div></div>'+
      (x.activeExtension?'<div class="ceo-note"><strong>Active extension:</strong> '+safe(dateLabel(x.activeExtension.extended_due_date))+(x.activeExtension.reason?' · '+safe(truncate(x.activeExtension.reason,180)):'')+'</div>':'')+
      (note?'<div class="ceo-note"><strong>Management / customer note:</strong><br>'+safe(truncate(note,520))+'</div>':'')+
      '<div class="ceo-section-head" style="padding-left:2px;padding-right:2px"><div><h2 class="ceo-section-title">Recent Payment History</h2><p class="ceo-section-sub">Read-only ledger view.</p></div></div><div class="ceo-tx">'+txRows+'</div>'+
      '</div></section>';
    document.body.appendChild(overlay);
    function close(){overlay.remove();}
    overlay.querySelector('.ceo-close').onclick=close;
    overlay.addEventListener('click',function(e){if(e.target===overlay) close();});
  }

  async function startCeo(){
    ensureStyles();
    renderLoading();
    try{
      ceoData=await loadCeoData();
      renderCeo();
    }catch(err){
      var app=document.getElementById('app');
      if(app) app.innerHTML='<div class="ceo-shell"><div class="ceo-top"><p class="ceo-kicker">Executive View</p><h1 class="ceo-greeting">Could not load dashboard</h1><p class="ceo-role">The CRM session is still active.</p></div><div class="ceo-loading">'+safe(err&&err.message?err.message:'Please retry loading the CRM.')+'<br><button id="ceoRetry" class="ceo-icon-btn" style="margin-top:14px;background:var(--ceo-navy)">Retry</button></div></div>';
      var retry=document.getElementById('ceoRetry'); if(retry) retry.onclick=startCeo;
    }
  }

  window.render=function(){
    if(inCeoMode()){ startCeo(); return; }
    document.body.classList.remove('ceo-mode');
    if(originalRender) return originalRender.apply(this,arguments);
  };

  window.__openSunblissCeoPreview=function(){
    var u=new URL(location.href);u.searchParams.set(CEO_PREVIEW_PARAM,'1');location.href=u.toString();
  };
})();
