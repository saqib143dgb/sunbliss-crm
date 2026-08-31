(function(){
  'use strict';

  if(window.__sunblissCeoCommandV2Installed) return;
  window.__sunblissCeoCommandV2Installed=true;

  var PARAM='ceo-preview';
  var pulseCache=null;
  var pulseLoadedAt=0;
  var upgradeTimer=null;
  var observer=null;

  function text(v){return v==null?'':String(v);}
  function num(v){var n=Number(v);return isFinite(n)?n:0;}
  function safe(v){return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function inMode(){
    try{
      var q=new URLSearchParams(location.search).get(PARAM)==='1';
      var role=(window.state&&state.userRole)?String(state.userRole):'';
      return q||role==='ceo';
    }catch(_e){return false;}
  }
  function todayIso(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parseDate(v){if(!v)return null;var d=new Date(String(v).length===10?String(v)+'T00:00:00':v);return isNaN(d.getTime())?null:d;}
  function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
  function money(v){
    var n=num(v),a=Math.abs(n);
    if(a>=10000000)return 'AED '+(n/1000000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})+'M';
    if(a>=1000000)return 'AED '+(n/1000000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:2})+'M';
    if(a>=100000)return 'AED '+(n/1000).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})+'K';
    return 'AED '+n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  }
  function fullMoney(v){return 'AED '+num(v).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function parsePercent(s){var m=text(s).match(/([0-9]+(?:\.[0-9]+)?)%/);return m?Math.max(0,Math.min(100,Number(m[1]))):0;}
  function hourGreeting(){var h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening';}

  function ensureStyles(){
    if(document.getElementById('ceoCommandV2Styles'))return;
    var s=document.createElement('style');
    s.id='ceoCommandV2Styles';
    s.textContent=[
      'body.ceo-mode.ceo-v2{--v2-ink:#0d1d29;--v2-ink2:#142b3a;--v2-gold:#d4a94c;--v2-gold2:#f2d999;--v2-paper:#f3f5f7;--v2-card:#fff;--v2-line:#e3e8ec;--v2-green:#2c7a59;--v2-red:#a7483f;--v2-amber:#9d6a22;background:#0d1d29!important;}',
      'body.ceo-mode.ceo-v2 #app{max-width:980px!important;background:var(--v2-paper)!important;box-shadow:0 0 70px rgba(0,0,0,.26);}',
      'body.ceo-mode.ceo-v2 .ceo-shell{background:linear-gradient(180deg,#0d1d29 0,#0d1d29 265px,var(--v2-paper) 265px,var(--v2-paper) 100%);}',
      'body.ceo-mode.ceo-v2 .ceo-top{padding:24px 20px 74px;background:radial-gradient(780px 340px at 78% -25%,rgba(212,169,76,.22),transparent 62%),radial-gradient(520px 300px at 0 15%,rgba(81,131,154,.18),transparent 66%),linear-gradient(140deg,#091721 0%,#102b3c 62%,#173649 100%);border-bottom:1px solid rgba(255,255,255,.06);}',
      'body.ceo-mode.ceo-v2 .ceo-top:after{width:320px;height:320px;right:-130px;top:-175px;border-color:rgba(242,217,153,.18);box-shadow:0 0 0 52px rgba(212,169,76,.03),0 0 0 104px rgba(212,169,76,.018);}',
      'body.ceo-mode.ceo-v2 .ceo-kicker{color:var(--v2-gold2);font-size:9.5px;letter-spacing:.19em;}',
      'body.ceo-mode.ceo-v2 .ceo-greeting{font-size:31px;letter-spacing:-.02em;}',
      'body.ceo-mode.ceo-v2 .ceo-role{color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.02em;}',
      'body.ceo-mode.ceo-v2 .ceo-icon-btn{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.06);backdrop-filter:blur(10px);transition:.18s ease;}',
      'body.ceo-mode.ceo-v2 .ceo-icon-btn:hover{transform:translateY(-1px);background:rgba(255,255,255,.11);border-color:rgba(242,217,153,.36);}',
      'body.ceo-mode.ceo-v2 .ceo-preview-pill{border-color:rgba(242,217,153,.27);background:rgba(242,217,153,.08);color:#f4dea6;}',
      'body.ceo-mode.ceo-v2 .ceo-content{margin-top:-55px;padding:0 16px 30px;}',
      'body.ceo-mode.ceo-v2 .ceo-card{border-color:rgba(222,228,233,.9);border-radius:18px;box-shadow:0 10px 32px rgba(18,39,53,.07),0 1px 2px rgba(18,39,53,.05);}',
      'body.ceo-mode.ceo-v2 .ceo-kpi-grid{gap:10px;margin-bottom:10px;}',
      'body.ceo-mode.ceo-v2 .ceo-kpi{position:relative;overflow:hidden;min-height:116px;padding:16px 15px;background:linear-gradient(180deg,#fff,#fbfcfd);}',
      'body.ceo-mode.ceo-v2 .ceo-kpi:after{content:"";position:absolute;width:64px;height:64px;border-radius:50%;right:-28px;bottom:-30px;background:radial-gradient(circle,rgba(212,169,76,.16),transparent 70%);}',
      'body.ceo-mode.ceo-v2 .ceo-kpi-label{font-size:8.9px;letter-spacing:.105em;}',
      'body.ceo-mode.ceo-v2 .ceo-kpi-value{font-size:22px;letter-spacing:-.02em;}',
      'body.ceo-mode.ceo-v2 .ceo-kpi-sub{font-size:9.7px;line-height:1.4;}',
      '.ceo-v2-command{position:relative;z-index:2;display:grid;grid-template-columns:110px 1fr;gap:15px;align-items:center;margin-top:17px;padding:14px;border:1px solid rgba(255,255,255,.11);border-radius:17px;background:linear-gradient(130deg,rgba(255,255,255,.075),rgba(255,255,255,.025));backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}',
      '.ceo-v2-gauge{--p:0;position:relative;width:94px;height:94px;margin:auto;border-radius:50%;background:conic-gradient(var(--v2-gold2) calc(var(--p)*1%),rgba(255,255,255,.09) 0);display:grid;place-items:center;}',
      '.ceo-v2-gauge:before{content:"";position:absolute;inset:7px;border-radius:50%;background:#102838;box-shadow:inset 0 0 20px rgba(0,0,0,.16);}',
      '.ceo-v2-gauge-core{position:relative;text-align:center;z-index:1;color:#fff;}',
      '.ceo-v2-gauge-core strong{display:block;font:650 19px/1 Fraunces,serif;letter-spacing:-.02em;}',
      '.ceo-v2-gauge-core span{display:block;margin-top:4px;font:600 7.5px/1.2 "IBM Plex Mono",monospace;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.48);}',
      '.ceo-v2-signal-kicker{font:650 8.7px/1.2 "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--v2-gold2);}',
      '.ceo-v2-signal-title{font:600 19px/1.15 Fraunces,serif;color:#fff;margin:5px 0 4px;}',
      '.ceo-v2-signal-copy{font-size:9.8px;line-height:1.5;color:rgba(255,255,255,.55);margin:0;max-width:520px;}',
      '.ceo-v2-signal-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;}',
      '.ceo-v2-signal-pill{font-size:8.5px;color:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 7px;background:rgba(0,0,0,.08);}',
      '.ceo-v2-pulse{margin:10px 0 0;border-radius:18px;overflow:hidden;border:1px solid rgba(222,228,233,.9);box-shadow:0 10px 32px rgba(18,39,53,.06);background:#fff;}',
      '.ceo-v2-pulse-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px 10px;}',
      '.ceo-v2-pulse-title{font:650 15px/1.2 Fraunces,serif;margin:0;color:var(--v2-ink);}',
      '.ceo-v2-live{display:inline-flex;align-items:center;gap:6px;font-size:8.5px;font-weight:700;color:var(--v2-green);text-transform:uppercase;letter-spacing:.08em;}',
      '.ceo-v2-live:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--v2-green);box-shadow:0 0 0 4px rgba(44,122,89,.10);animation:ceoLivePulse 2.1s ease-in-out infinite;}',
      '@keyframes ceoLivePulse{50%{box-shadow:0 0 0 7px rgba(44,122,89,0)}}',
      '.ceo-v2-pulse-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--v2-line);}',
      '.ceo-v2-pulse-item{padding:12px 11px;border-left:1px solid var(--v2-line);min-width:0;}',
      '.ceo-v2-pulse-item:first-child{border-left:0;}',
      '.ceo-v2-pulse-label{font-size:8.2px;line-height:1.25;color:#77838d;text-transform:uppercase;letter-spacing:.06em;}',
      '.ceo-v2-pulse-value{font:700 13px/1.2 "IBM Plex Mono",monospace;color:var(--v2-ink);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ceo-v2-pulse-note{font-size:8.4px;color:#8d969e;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ceo-v2-intel{margin-top:10px;background:linear-gradient(140deg,#112c3d,#183a4d);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;box-shadow:0 12px 32px rgba(13,29,41,.16);color:#fff;}',
      '.ceo-v2-intel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}',
      '.ceo-v2-intel-title{font:600 15px/1.2 Fraunces,serif;margin:0;}',
      '.ceo-v2-intel-badge{font-size:7.8px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#f2d999;border:1px solid rgba(242,217,153,.22);border-radius:999px;padding:5px 7px;}',
      '.ceo-v2-intel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}',
      '.ceo-v2-insight{min-height:92px;padding:11px;border-radius:13px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.075);}',
      '.ceo-v2-insight-num{font:650 18px/1 Fraunces,serif;color:#f2d999;}',
      '.ceo-v2-insight-title{font-size:9.2px;font-weight:750;margin-top:7px;color:#fff;}',
      '.ceo-v2-insight-copy{font-size:8.7px;line-height:1.42;color:rgba(255,255,255,.48);margin-top:4px;}',
      'body.ceo-mode.ceo-v2 .ceo-section{margin-top:10px;}',
      'body.ceo-mode.ceo-v2 .ceo-section-head{padding:15px 15px 11px;}',
      'body.ceo-mode.ceo-v2 .ceo-section-title{font-size:17px;letter-spacing:-.01em;}',
      'body.ceo-mode.ceo-v2 .ceo-section-sub{font-size:9.6px;}',
      'body.ceo-mode.ceo-v2 .ceo-section-link{color:#805e1b;background:#f9f4e7;border:1px solid #ead9b1;border-radius:999px;padding:6px 9px;text-decoration:none;}',
      'body.ceo-mode.ceo-v2 .ceo-decision-row{position:relative;padding:13px 14px 13px 18px;transition:.16s ease;}',
      'body.ceo-mode.ceo-v2 .ceo-decision-row:before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:0 4px 4px 0;background:#d8aa4e;}',
      'body.ceo-mode.ceo-v2 .ceo-decision-row:hover{background:#fbfcfd;transform:translateX(1px);}',
      'body.ceo-mode.ceo-v2 .ceo-tag{font-size:8px;letter-spacing:.025em;background:#fff7e7;border-color:#ecd7ad;}',
      '.ceo-v2-recommend{display:flex;align-items:flex-start;gap:7px;margin-top:8px;padding:7px 8px;border-radius:9px;background:#f6f8f9;border:1px solid #e7ebee;font-size:8.8px;line-height:1.4;color:#65727d;}',
      '.ceo-v2-recommend strong{color:#263846;}',
      'body.ceo-mode.ceo-v2 .ceo-cash-box{background:linear-gradient(180deg,#fbfcfd,#f6f8f9);border-radius:13px;}',
      'body.ceo-mode.ceo-v2 .ceo-cash-value{font-size:12px;}',
      'body.ceo-mode.ceo-v2 .ceo-progress{height:7px;background:#edf0f2;}',
      'body.ceo-mode.ceo-v2 .ceo-progress>span{background:linear-gradient(90deg,#b98629,#e2bd67);}',
      'body.ceo-mode.ceo-v2 .ceo-bottom{bottom:10px;width:min(820px,calc(100% - 22px));background:rgba(7,24,34,.94);border-color:rgba(255,255,255,.09);box-shadow:0 15px 38px rgba(7,24,34,.30);}',
      'body.ceo-mode.ceo-v2 .ceo-nav-btn{font-size:8px;letter-spacing:.02em;padding-top:11px;}',
      'body.ceo-mode.ceo-v2 .ceo-nav-btn.active{color:#f2d999;background:linear-gradient(180deg,rgba(242,217,153,.06),rgba(255,255,255,.025));}',
      'body.ceo-mode.ceo-v2 .ceo-page-title h2{font-size:23px;}',
      'body.ceo-mode.ceo-v2 .ceo-search{border-radius:15px;padding:12px 13px;box-shadow:0 8px 24px rgba(18,39,53,.06);}',
      'body.ceo-mode.ceo-v2 .ceo-search-card{border-radius:15px;box-shadow:0 5px 18px rgba(18,39,53,.04);}',
      '.ceo-v2-board-btn{border-color:rgba(242,217,153,.34)!important;color:#f5dda0!important;background:rgba(212,169,76,.10)!important;}',
      '.ceo-v2-boardmark{display:flex;align-items:center;gap:7px;color:#71808b;font-size:8.4px;margin:12px 2px 0;}',
      '.ceo-v2-boardmark:before{content:"";height:1px;flex:1;background:#dfe4e8}.ceo-v2-boardmark:after{content:"";height:1px;flex:1;background:#dfe4e8}',
      '@media(min-width:720px){body.ceo-mode.ceo-v2 .ceo-top{padding-left:26px;padding-right:26px}.ceo-v2-command{grid-template-columns:120px 1fr;padding:16px 18px}.ceo-v2-gauge{width:104px;height:104px}.ceo-v2-intel{padding:16px}.ceo-v2-insight{min-height:100px;padding:13px}}',
      '@media(max-width:560px){body.ceo-mode.ceo-v2 .ceo-greeting{font-size:27px}.ceo-v2-command{grid-template-columns:86px 1fr;gap:10px}.ceo-v2-gauge{width:78px;height:78px}.ceo-v2-gauge-core strong{font-size:16px}.ceo-v2-pulse-grid{grid-template-columns:1fr 1fr}.ceo-v2-pulse-item:nth-child(3){border-left:0;border-top:1px solid var(--v2-line)}.ceo-v2-pulse-item:nth-child(4){border-top:1px solid var(--v2-line)}.ceo-v2-intel-grid{grid-template-columns:1fr}.ceo-v2-insight{min-height:auto}.ceo-v2-signal-title{font-size:16px}.ceo-v2-signal-copy{font-size:8.8px}}',
      '@media(max-width:380px){body.ceo-mode.ceo-v2 .ceo-head-actions{gap:4px}body.ceo-mode.ceo-v2 .ceo-icon-btn{padding:7px 8px;font-size:9px}.ceo-v2-command{grid-template-columns:1fr}.ceo-v2-gauge{margin:0}.ceo-v2-signal-pills{margin-top:7px}}'
    ].join('');
    document.head.appendChild(s);
  }

  function readKpis(){
    var out={};
    document.querySelectorAll('.ceo-kpi').forEach(function(card){
      var label=card.querySelector('.ceo-kpi-label'),value=card.querySelector('.ceo-kpi-value'),sub=card.querySelector('.ceo-kpi-sub');
      if(!label)return;
      out[text(label.textContent).trim().toLowerCase()]={value:value?text(value.textContent).trim():'',sub:sub?text(sub.textContent).trim():''};
    });
    return out;
  }

  function decisionCount(){
    var title=Array.prototype.slice.call(document.querySelectorAll('.ceo-section-title')).find(function(x){return /Decision/.test(text(x.textContent));});
    var m=title&&text(title.textContent).match(/(\d+)\s+Decision/i);return m?Number(m[1]):0;
  }
  function monthProgress(){
    var p=document.querySelector('.ceo-progress>span');
    if(p&&p.style&&p.style.width)return parsePercent(p.style.width);
    var rows=Array.prototype.slice.call(document.querySelectorAll('.ceo-metric-row'));
    for(var i=0;i<rows.length;i++)if(/Collection progress/i.test(text(rows[i].textContent)))return parsePercent(rows[i].textContent);
    return 0;
  }

  async function loadPulse(force){
    if(!window.sb)return null;
    var now=Date.now();
    if(!force&&pulseCache&&now-pulseLoadedAt<60000)return pulseCache;
    var today=todayIso(),todayDate=parseDate(today),weekEnd=addDays(todayDate,7);
    var r=await Promise.all([
      sb.from('payment_transactions').select('id,unit_id,payment_date,amount,payment_type').eq('payment_date',today),
      sb.from('sales').select('id,unit_id,booking_date').eq('booking_date',today),
      sb.from('units').select('id,unit_no,total_price,status,availability_status'),
      sb.from('payment_extensions').select('id,unit_id,extended_due_date,status').eq('status','active')
    ]);
    r.forEach(function(x){if(x.error)throw x.error;});
    var tx=r[0].data||[],sales=r[1].data||[],units=r[2].data||[],ext=r[3].data||[],unitBy={};
    units.forEach(function(u){unitBy[String(u.id)]=u;});
    var soldToday=sales.filter(function(s){var u=unitBy[String(s.unit_id)];return u&&String(u.status).toLowerCase()!=='cancelled';});
    var bookedValue=soldToday.reduce(function(sum,s){var u=unitBy[String(s.unit_id)];return sum+(u?num(u.total_price):0);},0);
    var dueSoon=ext.filter(function(e){var d=parseDate(e.extended_due_date);return d&&d>=todayDate&&d<=weekEnd;});
    pulseCache={
      todayCash:tx.reduce(function(sum,t){return sum+num(t.amount);},0),
      todayPayments:tx.length,
      todayBookings:soldToday.length,
      todayBookingValue:bookedValue,
      activeExtensions:ext.length,
      extensionsDue7:dueSoon.length,
      loadedAt:new Date()
    };
    pulseLoadedAt=now;
    return pulseCache;
  }

  function signalFrom(rate,decisions){
    if(decisions>=4||rate<55)return {title:'Priority focus',copy:'Several management items or collection performance require closer executive attention.',tone:'Priority'};
    if(decisions>0||rate<75)return {title:'Active attention',copy:'Business position is controlled, with a small set of items that deserve management focus.',tone:'Watch'};
    return {title:'Position stable',copy:'Current collection progress and management exceptions are within a healthy operating range.',tone:'Stable'};
  }

  function enhanceHero(){
    var top=document.querySelector('.ceo-top');if(!top||document.getElementById('ceoV2Command'))return;
    var k=readKpis();
    var collected=k['cash collected']||{};
    var rate=parsePercent(collected.sub);
    var d=decisionCount(),signal=signalFrom(rate,d);
    var cmd=document.createElement('div');cmd.id='ceoV2Command';cmd.className='ceo-v2-command';
    cmd.innerHTML='<div class="ceo-v2-gauge" style="--p:'+rate.toFixed(1)+'"><div class="ceo-v2-gauge-core"><strong>'+safe(rate.toFixed(1))+'%</strong><span>Collected</span></div></div>'+ 
      '<div><div class="ceo-v2-signal-kicker">Executive Signal · '+safe(signal.tone)+'</div><div class="ceo-v2-signal-title">'+safe(signal.title)+'</div><p class="ceo-v2-signal-copy">'+safe(signal.copy)+'</p><div class="ceo-v2-signal-pills"><span class="ceo-v2-signal-pill">'+d+' decision'+(d===1?'':'s')+' flagged</span><span class="ceo-v2-signal-pill">Live CRM position</span><span class="ceo-v2-signal-pill">Read-only executive view</span></div></div>';
    top.appendChild(cmd);

    var actions=top.querySelector('.ceo-head-actions');
    if(actions&&!document.getElementById('ceoBoardBrief')){
      var b=document.createElement('button');b.id='ceoBoardBrief';b.className='ceo-icon-btn ceo-v2-board-btn';b.textContent='Board brief';b.onclick=makeBoardBrief;
      actions.insertBefore(b,actions.lastElementChild||null);
    }
  }

  function recommendationFor(row){
    var tag=row.querySelector('.ceo-tag');var t=tag?text(tag.textContent).toLowerCase():'';
    if(/cancellation/.test(t))return 'Review financial settlement, retention and cancellation impact before confirming.';
    if(/waiver|restructur|payment/.test(t))return 'Review payment history, amount at risk and proposed dates before approving any concession.';
    if(/adjustment|credit/.test(t))return 'Confirm documentary support and receivable impact before adjustment is finalized.';
    if(/modification/.test(t))return 'Confirm technical feasibility, cost and delivery impact before committing to the customer.';
    return 'Review the financial exposure and latest customer position before management confirmation.';
  }

  function enhanceDecisions(){
    document.querySelectorAll('.ceo-decision-row').forEach(function(row){
      if(row.querySelector('.ceo-v2-recommend'))return;
      var r=document.createElement('div');r.className='ceo-v2-recommend';r.innerHTML='<span>◆</span><span><strong>Executive review:</strong> '+safe(recommendationFor(row))+'</span>';
      row.appendChild(r);
    });
  }

  function injectPulse(p){
    var page=document.querySelector('.ceo-overview');if(!page||!p)return;
    var grid=page.querySelector('.ceo-kpi-grid');if(!grid)return;
    if(!document.getElementById('ceoV2Pulse')){
      var box=document.createElement('section');box.id='ceoV2Pulse';box.className='ceo-v2-pulse';
      box.innerHTML='<div class="ceo-v2-pulse-head"><div><h2 class="ceo-v2-pulse-title">Business Pulse · Today</h2><div style="font-size:8.8px;color:#8a959e;margin-top:3px">What changed in the CRM today</div></div><span class="ceo-v2-live">Live data</span></div>'+ 
        '<div class="ceo-v2-pulse-grid">'+
          '<div class="ceo-v2-pulse-item"><div class="ceo-v2-pulse-label">Cash received today</div><div class="ceo-v2-pulse-value">'+safe(money(p.todayCash))+'</div><div class="ceo-v2-pulse-note">'+p.todayPayments+' payment'+(p.todayPayments===1?'':'s')+' recorded</div></div>'+ 
          '<div class="ceo-v2-pulse-item"><div class="ceo-v2-pulse-label">New bookings today</div><div class="ceo-v2-pulse-value">'+p.todayBookings+'</div><div class="ceo-v2-pulse-note">'+safe(money(p.todayBookingValue))+' sale value</div></div>'+ 
          '<div class="ceo-v2-pulse-item"><div class="ceo-v2-pulse-label">Extensions due ≤ 7d</div><div class="ceo-v2-pulse-value">'+p.extensionsDue7+'</div><div class="ceo-v2-pulse-note">'+p.activeExtensions+' active overall</div></div>'+ 
          '<div class="ceo-v2-pulse-item"><div class="ceo-v2-pulse-label">Decisions flagged</div><div class="ceo-v2-pulse-value">'+decisionCount()+'</div><div class="ceo-v2-pulse-note">Management review only</div></div>'+ 
        '</div>';
      grid.parentNode.insertBefore(box,grid.nextSibling);
    }
    injectIntelligence(p);
  }

  function injectIntelligence(p){
    var pulse=document.getElementById('ceoV2Pulse');if(!pulse||document.getElementById('ceoV2Intel'))return;
    var rate=monthProgress(),d=decisionCount();
    var cashMsg=p.todayPayments?fullMoney(p.todayCash)+' logged across '+p.todayPayments+' payment'+(p.todayPayments===1?'':'s')+'.':'No new payment was logged today.';
    var rateMsg=rate?rate.toFixed(1)+'% of this month\'s scheduled dues are currently settled.':'Monthly collection progress is still being established.';
    var decisionMsg=d?d+' case'+(d===1?'':'s')+' need management attention before commitments are finalized.':'No management-decision case is currently flagged.';
    var intel=document.createElement('section');intel.id='ceoV2Intel';intel.className='ceo-v2-intel';
    intel.innerHTML='<div class="ceo-v2-intel-head"><h2 class="ceo-v2-intel-title">Executive Intelligence</h2><span class="ceo-v2-intel-badge">Decision lens</span></div><div class="ceo-v2-intel-grid">'+
      '<div class="ceo-v2-insight"><div class="ceo-v2-insight-num">'+safe(money(p.todayCash))+'</div><div class="ceo-v2-insight-title">Today\'s collection signal</div><div class="ceo-v2-insight-copy">'+safe(cashMsg)+'</div></div>'+ 
      '<div class="ceo-v2-insight"><div class="ceo-v2-insight-num">'+safe(rate.toFixed(1))+'%</div><div class="ceo-v2-insight-title">Monthly collection progress</div><div class="ceo-v2-insight-copy">'+safe(rateMsg)+'</div></div>'+ 
      '<div class="ceo-v2-insight"><div class="ceo-v2-insight-num">'+d+'</div><div class="ceo-v2-insight-title">Decisions requiring attention</div><div class="ceo-v2-insight-copy">'+safe(decisionMsg)+'</div></div>'+ 
      '</div>';
    pulse.parentNode.insertBefore(intel,pulse.nextSibling);
  }

  function addBoardmark(){
    var page=document.querySelector('.ceo-overview');if(!page||document.getElementById('ceoV2Boardmark'))return;
    var m=document.createElement('div');m.id='ceoV2Boardmark';m.className='ceo-v2-boardmark';m.textContent='CEO COMMAND CENTER · SUNBLISS RESIDENCES';page.appendChild(m);
  }

  function makeBoardBrief(){
    var k=readKpis(),p=pulseCache||{},d=decisionCount(),rate=monthProgress();
    var rows=Array.prototype.slice.call(document.querySelectorAll('.ceo-decision-row')).slice(0,5).map(function(row){
      var unit=row.querySelector('.ceo-unit'),name=row.querySelector('.ceo-decision-name'),tag=row.querySelector('.ceo-tag'),note=row.querySelector('.ceo-decision-note');
      return '<tr><td><strong>'+safe(unit?unit.textContent:'—')+'</strong><br><small>'+safe(name?name.textContent:'')+'</small></td><td>'+safe(tag?tag.textContent:'Management review')+'</td><td>'+safe(note?text(note.textContent).slice(0,180):'')+'</td></tr>';
    }).join('')||'<tr><td colspan="3">No management-decision cases are currently flagged.</td></tr>';
    var w=window.open('','_blank','noopener,noreferrer');if(!w)return;
    var html='<!doctype html><html><head><title>CEO Board Brief</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#172733;margin:0;background:#fff}main{max-width:900px;margin:auto;padding:34px}.head{border-bottom:3px solid #b88b2f;padding-bottom:18px;margin-bottom:22px}.kicker{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8a6928}.head h1{font-family:Georgia,serif;font-size:28px;margin:7px 0 4px}.sub{font-size:12px;color:#6f7880}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card{border:1px solid #dde3e7;border-radius:10px;padding:14px}.card span{display:block;font-size:9px;text-transform:uppercase;color:#7a848c;letter-spacing:.06em}.card strong{display:block;font-family:Georgia,serif;font-size:18px;margin-top:7px}.section{margin-top:24px}.section h2{font-family:Georgia,serif;font-size:18px;margin:0 0 10px}.pulse{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.pulse div{background:#f5f7f8;border-radius:9px;padding:12px}.pulse small{display:block;color:#77828a;font-size:9px}.pulse b{display:block;margin-top:5px;font-size:14px}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;background:#142b3a;color:#fff;padding:9px}td{border-bottom:1px solid #e4e8eb;padding:10px;vertical-align:top;line-height:1.45}td small{color:#7a848c}.foot{margin-top:28px;padding-top:12px;border-top:1px solid #e2e6e9;font-size:9px;color:#818b92}@media print{main{padding:18px}.no-print{display:none}}</style></head><body><main><div class="head"><div class="kicker">Purvanchal Real Estate Developers LLC · Executive Brief</div><h1>Sunbliss Residences — CEO Board Brief</h1><div class="sub">Prepared for Shah Alam · CEO &amp; Managing Director · '+safe(new Date().toLocaleString('en-GB'))+'</div></div><div class="grid">'+
      cardHtml('Sales value',(k['total sales value']||{}).value)+cardHtml('Cash collected',(k['cash collected']||{}).value)+cardHtml('Outstanding',(k['outstanding']||{}).value)+cardHtml('Overdue',(k['overdue']||{}).value)+'</div>'+ 
      '<div class="section"><h2>Today\'s Business Pulse</h2><div class="pulse"><div><small>Cash received today</small><b>'+safe(money(p.todayCash||0))+'</b></div><div><small>New bookings today</small><b>'+num(p.todayBookings)+'</b></div><div><small>Monthly collection progress</small><b>'+safe(rate.toFixed(1))+'%</b></div></div></div>'+ 
      '<div class="section"><h2>'+d+' Management Decision'+(d===1?'':'s')+' Flagged</h2><table><thead><tr><th>Customer / Unit</th><th>Type</th><th>Position</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+ 
      '<div class="foot">Read-only executive summary generated from the live CRM position. Verify supporting documents before making contractual or financial commitments.</div><div class="no-print" style="margin-top:18px"><button onclick="window.print()" style="background:#142b3a;color:#fff;border:0;border-radius:8px;padding:10px 15px;font-weight:700">Print / Save PDF</button></div></main></body></html>';
    w.document.open();w.document.write(html);w.document.close();
  }
  function cardHtml(label,value){return '<div class="card"><span>'+safe(label)+'</span><strong>'+safe(value||'—')+'</strong></div>';}

  async function upgrade(){
    if(!inMode())return;
    var shell=document.querySelector('.ceo-shell');if(!shell)return;
    ensureStyles();document.body.classList.add('ceo-v2');
    var greeting=document.querySelector('.ceo-greeting');if(greeting&&/Good (morning|afternoon|evening)/i.test(text(greeting.textContent))){
      greeting.textContent=hourGreeting()+', Shah Alam';
    }
    enhanceHero();enhanceDecisions();addBoardmark();
    try{var p=await loadPulse(false);injectPulse(p);}catch(_e){}
  }

  function scheduleUpgrade(){clearTimeout(upgradeTimer);upgradeTimer=setTimeout(upgrade,45);setTimeout(upgrade,260);setTimeout(upgrade,850);}
  function attachObserver(){
    var app=document.getElementById('app');if(!app||observer)return;
    observer=new MutationObserver(function(){scheduleUpgrade();});observer.observe(app,{childList:true,subtree:true});scheduleUpgrade();
  }

  var priorRender=window.render;
  if(typeof priorRender==='function')window.render=function(){var r=priorRender.apply(this,arguments);if(inMode())scheduleUpgrade();return r;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachObserver);else attachObserver();
})();
