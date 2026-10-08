(function(){
  'use strict';
  if(window.__sunblissDesktopAllKpiDonutsInstalled)return;
  window.__sunblissDesktopAllKpiDonutsInstalled=true;

  var DESKTOP_MIN=1024;
  var inventoryTotal=null;
  var inventoryLoading=null;
  var decorateTimer=0;
  var KPI_META=[
    {key:'units',title:'Units Sold'},
    {key:'sales',title:'Sales Value'},
    {key:'collected',title:'Collected'},
    {key:'outstanding',title:'Outstanding'}
  ];

  function desktop(){
    return window.matchMedia
      ? window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches
      : window.innerWidth>=DESKTOP_MIN;
  }
  function num(v){
    var n=Number(v);
    return isFinite(n)?n:0;
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function liveStats(){
    try{
      if(typeof window.portfolioStats==='function'){
        var p=window.portfolioStats()||{};
        return{
          units:num(p.units),
          totalSales:num(p.totalSales),
          totalReceived:num(p.totalReceived),
          totalOutstanding:Math.abs(num(p.totalOutstanding)),
          collectedPct:num(p.collectedPct),
          outstandingPct:num(p.outstandingPct)
        };
      }
    }catch(_e){}
    var dues=window.state&&Array.isArray(state.dues)?state.dues:[],sales=0,received=0;
    dues.forEach(function(row){
      sales+=num(row&&row.total);
      received+=num(row&&row.received);
    });
    var outstanding=Math.max(0,sales-received);
    return{
      units:dues.length,
      totalSales:sales,
      totalReceived:received,
      totalOutstanding:outstanding,
      collectedPct:sales>0?received/sales*100:0,
      outstandingPct:sales>0?outstanding/sales*100:0
    };
  }
  function loadInventoryTotal(){
    if(inventoryTotal!==null)return Promise.resolve(inventoryTotal);
    if(inventoryLoading)return inventoryLoading;
    if(!window.sb||typeof window.sb.from!=='function')return Promise.resolve(null);
    inventoryLoading=window.sb.from('units')
      .select('id',{count:'exact',head:true})
      .then(function(result){
        if(result&&result.error)throw result.error;
        var count=result&&Number(result.count);
        if(isFinite(count)&&count>0)inventoryTotal=count;
        return inventoryTotal;
      })
      .catch(function(err){
        console.warn('Could not load total inventory for overview KPI rings',err);
        return null;
      })
      .finally(function(){inventoryLoading=null;});
    return inventoryLoading;
  }
  function ringValue(key,stats,totalInventory){
    if(key==='units')return totalInventory>0?clamp(stats.units/totalInventory*100,0,100):0;
    if(key==='sales')return stats.totalSales>0?100:0;
    if(key==='collected')return clamp(stats.collectedPct,0,100);
    if(key==='outstanding')return clamp(stats.outstandingPct,0,100);
    return 0;
  }
  function applyRings(){
    var root=document.getElementById('sbRefOverviewV2');
    if(!root)return;
    var stats=liveStats();
    KPI_META.forEach(function(meta){
      var card=root.querySelector('.sb-v2-kpi.'+meta.key+'.sb-kpi-donut-card');
      if(!card)return;
      var progress=ringValue(meta.key,stats,inventoryTotal);
      var circle=card.querySelector('.sb-kpi-donut-progress');
      if(circle){
        circle.setAttribute('stroke-dasharray',progress.toFixed(2)+' 100');
        circle.style.strokeOpacity=progress>0.01?'1':'0';
      }
      var donut=card.querySelector('.sb-kpi-donut');
      var value=card.querySelector('.sb-kpi-donut-value');
      if(donut){
        var spoken=value?String(value.textContent||'').trim():'';
        donut.setAttribute('aria-label',meta.title+(spoken?' '+spoken:''));
        donut.setAttribute('data-progress',progress.toFixed(2));
        if(meta.key==='units'&&inventoryTotal)donut.setAttribute('data-total-inventory',inventoryTotal);
      }
    });
  }
  function decorateCard(card,meta){
    if(!card||card.classList.contains('sb-kpi-donut-card'))return;
    var icon=card.querySelector('.sb-v2-kpi-icon');
    var value=card.querySelector('.sb-v2-kpi-value');
    var iconHtml=icon?icon.innerHTML:'';
    var valueText=value?String(value.textContent||'').trim():'';

    card.classList.add('sb-kpi-donut-card');
    card.innerHTML=
      '<div class="sb-kpi-card-head">'+
        '<span class="sb-v2-kpi-icon" aria-hidden="true">'+iconHtml+'</span>'+
        '<div class="sb-v2-kpi-label">'+meta.title+'</div>'+
      '</div>'+
      '<div class="sb-kpi-card-body">'+
        '<div class="sb-kpi-donut" role="img" aria-label="'+meta.title+' '+valueText+'">'+
          '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+
            '<circle class="sb-kpi-donut-track" cx="60" cy="60" r="48" pathLength="100"></circle>'+
            '<circle class="sb-kpi-donut-progress" cx="60" cy="60" r="48" pathLength="100" stroke-dasharray="0 100"></circle>'+
          '</svg>'+
          '<div class="sb-kpi-donut-value">'+valueText+'</div>'+
        '</div>'+
      '</div>';
  }
  function decorate(){
    if(!desktop()||!document.body.classList.contains('sunbliss-ref-desktop'))return false;
    if(!window.state||state.view!=='overview')return false;
    var root=document.getElementById('sbRefOverviewV2');
    if(!root)return false;

    KPI_META.forEach(function(meta){
      decorateCard(root.querySelector('.sb-v2-kpi.'+meta.key),meta);
    });
    applyRings();
    loadInventoryTotal().then(function(){applyRings();});
    return true;
  }
  function schedule(delay){
    clearTimeout(decorateTimer);
    decorateTimer=setTimeout(decorate,delay==null?0:delay);
  }
  function installStyle(){
    if(document.getElementById('sunblissDesktopAllKpiDonutStyle'))return;
    var style=document.createElement('style');
    style.id='sunblissDesktopAllKpiDonutStyle';
    style.textContent=[
      '@media(min-width:1024px){',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-kpis{align-items:start;gap:12px;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-kpi.sb-kpi-donut-card{height:auto!important;min-height:0!important;aspect-ratio:1/1;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:0!important;overflow:hidden!important;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head{min-height:64px;display:flex;align-items:center;gap:12px;padding:11px 15px;border-bottom:1px solid rgba(220,210,182,.55);box-sizing:border-box;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-icon{width:42px;height:42px;flex:0 0 42px;border-radius:12px;display:grid;place-items:center;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-icon svg{width:23px;height:23px;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-label{margin:0;font:700 11px/1 Inter,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--ink);white-space:nowrap;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-body{flex:1;min-height:0;display:grid;place-items:center;padding:18px;box-sizing:border-box;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut{width:min(78%,220px);aspect-ratio:1/1;position:relative;display:grid;place-items:center;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut circle{fill:none;stroke-width:9.5;stroke-linecap:round;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut-progress{transition:stroke-dasharray .45s ease;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .units .sb-kpi-donut-track{stroke:rgba(198,151,46,.13);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .units .sb-kpi-donut-progress{stroke:var(--gold-deep);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sales .sb-kpi-donut-track{stroke:rgba(69,86,107,.12);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sales .sb-kpi-donut-progress{stroke:var(--slate);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .collected .sb-kpi-donut-track{stroke:rgba(63,122,87,.12);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .collected .sb-kpi-donut-progress{stroke:var(--sage);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .outstanding .sb-kpi-donut-track{stroke:rgba(174,59,43,.11);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .outstanding .sb-kpi-donut-progress{stroke:var(--rust);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut-value{position:absolute;inset:0;display:grid;place-items:center;margin:0!important;padding:0!important;font:650 clamp(18px,1.7vw,30px)/1 Inter,sans-serif;letter-spacing:-.04em;color:var(--ink);text-align:center;white-space:nowrap;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .units .sb-kpi-donut-value{font-size:clamp(36px,3.1vw,58px);}',
        '@media(max-width:1180px){',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head{min-height:56px;padding:8px 10px;gap:8px;}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-icon{width:36px;height:36px;flex-basis:36px;border-radius:10px;}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-icon svg{width:20px;height:20px;}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-head .sb-v2-kpi-label{font-size:9px;letter-spacing:.045em;}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-card-body{padding:12px;}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut{width:min(82%,180px);}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-kpi-donut-value{font-size:clamp(15px,1.75vw,22px);}',
          'body.sunbliss-ref-desktop #sbRefOverviewV2 .units .sb-kpi-donut-value{font-size:clamp(30px,3vw,42px);}',
        '}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }
  function hookKpiRendered(){
    var previous=window.__sunblissOverviewKpiRendered;
    if(previous&&previous.__sunblissAllKpiDonutsWrapped)return;
    var wrapped=function(){
      var result;
      if(typeof previous==='function')result=previous.apply(this,arguments);
      schedule(0);
      return result;
    };
    wrapped.__sunblissAllKpiDonutsWrapped=true;
    wrapped.__sunblissOriginal=previous;
    window.__sunblissOverviewKpiRendered=wrapped;
  }
  function install(){
    installStyle();
    hookKpiRendered();
    schedule(0);
    setTimeout(function(){schedule(0);},120);
    setTimeout(function(){schedule(0);},650);
  }

  window.addEventListener('resize',function(){schedule(80);},{passive:true});
  window.addEventListener('pageshow',function(){schedule(0);});
  window.addEventListener('focus',function(){schedule(0);});
  install();
})();