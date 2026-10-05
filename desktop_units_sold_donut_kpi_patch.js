(function(){
  'use strict';
  if(window.__sunblissDesktopUnitsSoldDonutInstalled)return;
  window.__sunblissDesktopUnitsSoldDonutInstalled=true;

  var DESKTOP_MIN=1024;
  var inventoryTotal=null;
  var inventoryLoading=null;
  var decorateTimer=0;

  function desktop(){
    return window.matchMedia
      ? window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches
      : window.innerWidth>=DESKTOP_MIN;
  }
  function number(v){
    var n=Number(v);
    return isFinite(n)?n:0;
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function soldCount(){
    if(window.state&&Array.isArray(state.dues))return state.dues.length;
    var node=document.querySelector('#sbRefOverviewV2 .sb-v2-kpi.units .sb-v2-kpi-value');
    if(!node)return 0;
    var n=parseInt(String(node.textContent||'').replace(/[^0-9-]/g,''),10);
    return isFinite(n)?n:0;
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
        console.warn('Could not load total inventory for Units Sold KPI',err);
        return null;
      })
      .finally(function(){inventoryLoading=null;});
    return inventoryLoading;
  }
  function ringProgress(sold,total){
    if(!total||total<=0)return 0;
    return clamp((sold/total)*100,0,100);
  }
  function applyRing(card,total){
    if(!card)return;
    var sold=soldCount();
    var progress=ringProgress(sold,total);
    var circle=card.querySelector('.sb-units-donut-progress');
    if(circle)circle.setAttribute('stroke-dasharray',progress.toFixed(2)+' 100');
    var donut=card.querySelector('.sb-units-donut');
    if(donut){
      donut.setAttribute('data-total-inventory',total||'');
      donut.setAttribute('aria-label',total?('Units sold '+sold+' of '+total):('Units sold '+sold));
    }
  }
  function decorate(){
    if(!desktop()||!document.body.classList.contains('sunbliss-ref-desktop'))return false;
    if(!window.state||state.view!=='overview')return false;
    var card=document.querySelector('#sbRefOverviewV2 .sb-v2-kpi.units');
    if(!card)return false;

    if(!card.classList.contains('sb-units-donut-kpi')){
      var icon=card.querySelector('.sb-v2-kpi-icon');
      var value=card.querySelector('.sb-v2-kpi-value');
      var iconHtml=icon?icon.innerHTML:'';
      var valueText=value?value.textContent:soldCount();

      card.classList.add('sb-units-donut-kpi');
      card.innerHTML=
        '<div class="sb-units-kpi-head">'+
          '<span class="sb-v2-kpi-icon" aria-hidden="true">'+iconHtml+'</span>'+
          '<div class="sb-v2-kpi-label">Units Sold</div>'+
        '</div>'+
        '<div class="sb-units-kpi-body">'+
          '<div class="sb-units-donut" role="img" aria-label="Units sold '+String(valueText||'')+'">'+
            '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">'+
              '<circle class="sb-units-donut-track" cx="60" cy="60" r="48" pathLength="100"></circle>'+
              '<circle class="sb-units-donut-progress" cx="60" cy="60" r="48" pathLength="100" stroke-dasharray="0 100"></circle>'+
            '</svg>'+
            '<div class="sb-v2-kpi-value">'+String(valueText||'')+'</div>'+
          '</div>'+
        '</div>';
    }

    applyRing(card,inventoryTotal);
    loadInventoryTotal().then(function(total){
      var latest=document.querySelector('#sbRefOverviewV2 .sb-v2-kpi.units.sb-units-donut-kpi');
      if(latest)applyRing(latest,total);
    });
    return true;
  }
  function schedule(delay){
    clearTimeout(decorateTimer);
    decorateTimer=setTimeout(decorate,delay==null?0:delay);
  }
  function installStyle(){
    if(document.getElementById('sunblissDesktopUnitsSoldDonutStyle'))return;
    var style=document.createElement('style');
    style.id='sunblissDesktopUnitsSoldDonutStyle';
    style.textContent=[
      '@media(min-width:1024px){',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-kpis{align-items:start;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-v2-kpi.units.sb-units-donut-kpi{height:auto!important;min-height:0!important;aspect-ratio:1/1;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;padding:0!important;overflow:hidden!important;background:linear-gradient(90deg,rgba(198,151,46,.055),rgba(198,151,46,.018))!important;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-kpi-head{min-height:62px;display:flex;align-items:center;gap:12px;padding:12px 15px;border-bottom:1px solid rgba(220,210,182,.55);box-sizing:border-box;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-kpi-head .sb-v2-kpi-icon{width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:rgba(198,151,46,.13);color:var(--gold-deep);display:grid;place-items:center;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-kpi-head .sb-v2-kpi-icon svg{width:23px;height:23px;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-kpi-head .sb-v2-kpi-label{margin:0;font:700 11px/1 Inter,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--ink);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-kpi-body{flex:1;min-height:0;display:grid;place-items:center;padding:20px;box-sizing:border-box;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut{width:min(78%,230px);aspect-ratio:1/1;position:relative;display:grid;place-items:center;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut circle{fill:none;stroke-width:10;stroke-linecap:round;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut-track{stroke:rgba(198,151,46,.13);}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut-progress{stroke:var(--gold-deep);transition:stroke-dasharray .45s ease;}',
        'body.sunbliss-ref-desktop #sbRefOverviewV2 .sb-units-donut .sb-v2-kpi-value{position:absolute;inset:0;display:grid;place-items:center;margin:0!important;padding:0!important;font:650 clamp(42px,4vw,66px)/1 Inter,sans-serif;letter-spacing:-.045em;color:var(--ink);text-align:center;white-space:nowrap;}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }
  function hookKpiRendered(){
    var previous=window.__sunblissOverviewKpiRendered;
    if(previous&&previous.__sunblissUnitsSoldDonutWrapped)return;
    var wrapped=function(){
      var result;
      if(typeof previous==='function')result=previous.apply(this,arguments);
      schedule(0);
      return result;
    };
    wrapped.__sunblissUnitsSoldDonutWrapped=true;
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