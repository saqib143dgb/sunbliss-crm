(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;

  var root=document.documentElement;
  window.__sunblissOverviewFinancialGateRequired=true;
  root.classList.remove('sbx-kpi-pending');
  root.classList.add('sbx-overview-data-pending');

  var KPI_LABELS={
    'units sold':true,
    'sales value':true,
    'collected':true,
    'outstanding':true
  };
  var DURATION=788;
  var DESKTOP_MIN=1024;
  var DESKTOP_SETTLE_MS=660;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasAnimatedThisPage=false;
  var queued=false;
  var retryTimer=null;
  var desktopFirstDashboardSeenAt=0;

  function normalise(value){
    return String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function desktop(){
    return window.matchMedia?window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches:window.innerWidth>=DESKTOP_MIN;
  }

  function now(){
    return window.performance&&typeof window.performance.now==='function'?window.performance.now():Date.now();
  }

  function desktopDashboard(){
    if(!desktop())return null;
    var dashboard=document.getElementById('sbRefOverviewV2');
    if(dashboard&&!desktopFirstDashboardSeenAt)desktopFirstDashboardSeenAt=now();
    return dashboard;
  }

  function desktopDashboardSettled(){
    var dashboard=desktopDashboard();
    if(!dashboard)return false;
    return now()-desktopFirstDashboardSeenAt>=DESKTOP_SETTLE_MS;
  }

  function parseValue(text){
    var finalText=String(text||'').replace(/\u00a0/g,' ').trim();
    var match=finalText.match(/^([^0-9+\-]*)([+\-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)(\s*[KMBT]?)$/i);
    if(!match)return null;
    var numberText=match[2];
    var dot=numberText.indexOf('.');
    return{
      finalText:finalText,
      prefix:match[1],
      value:Number(numberText.replace(/,/g,'')),
      suffix:match[3],
      decimals:dot<0?0:numberText.length-dot-1,
      grouped:numberText.indexOf(',')>=0
    };
  }

  function formatValue(parsed,value){
    var factor=Math.pow(10,parsed.decimals);
    var rounded=Math.round(value*factor)/factor;
    var number=rounded.toLocaleString('en-US',{
      useGrouping:parsed.grouped,
      minimumFractionDigits:parsed.decimals,
      maximumFractionDigits:parsed.decimals
    });
    return parsed.prefix+number+parsed.suffix;
  }

  function parsePercentNode(node){
    if(!node)return null;
    var finalText=String(node.textContent||'').trim();
    var match=finalText.match(/^([+\-]?\d+(?:\.\d+)?)%$/);
    if(!match)return null;
    var numberText=match[1];
    var dot=numberText.indexOf('.');
    return{
      node:node,
      finalText:finalText,
      value:Number(numberText),
      decimals:dot<0?0:numberText.length-dot-1
    };
  }

  function formatPercent(parsed,value){
    var factor=Math.pow(10,parsed.decimals);
    var rounded=Math.round(value*factor)/factor;
    return rounded.toFixed(parsed.decimals)+'%';
  }

  function loaderHasReleased(){
    return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');
  }

  function financialDataReady(){
    return window.__sunblissOverviewFinancialReady===true;
  }

  function portfolioStateReady(){
    if(!financialDataReady()||!window.state||state.view!=='overview'||!Array.isArray(state.dues))return false;
    for(var i=0;i<state.dues.length;i++){
      var customer=state.dues[i];
      if(!customer||customer.customerId===null||customer.customerId===undefined||String(customer.customerId).trim()==='')return false;
    }
    return true;
  }

  function finalPortfolioHasRendered(){
    if(!portfolioStateReady())return false;

    if(desktop()){
      if(!desktopDashboardSettled())return false;
      var desktopUnits=document.querySelector('#sbRefOverviewV2 .sb-v2-kpi.units .sb-v2-kpi-value');
      var desktopParsed=parseValue(desktopUnits&&desktopUnits.textContent);
      return !!desktopParsed&&desktopParsed.value===state.dues.length;
    }

    var hero=document.querySelector('.overview > .stat-hero');
    if(!hero)return false;
    var cells=hero.querySelectorAll('.stat-cell:not(.wide)');
    for(var j=0;j<cells.length;j++){
      var label=cells[j].querySelector('.stat-label');
      var value=cells[j].querySelector('.stat-value');
      if(label&&value&&normalise(label.textContent)==='units sold'){
        var parsed=parseValue(value.textContent);
        return !!parsed&&parsed.value===state.dues.length;
      }
    }
    return false;
  }

  function animateValue(node,parsed){
    if(!node||node.dataset.sbxKpiCountup==='1')return;
    node.dataset.sbxKpiCountup='1';
    node.setAttribute('aria-label',parsed.finalText);
    if(reduceMotion||!Number.isFinite(parsed.value)){
      node.textContent=parsed.finalText;
      return;
    }

    var started=null;
    node.setAttribute('data-sbx-kpi-counting','');
    node.textContent=formatValue(parsed,0);
    function frame(timestamp){
      if(node.isConnected===false)return;
      if(started===null)started=timestamp;
      var progress=Math.min(1,(timestamp-started)/DURATION);
      var eased=1-Math.pow(1-progress,4);
      node.textContent=progress===1?parsed.finalText:formatValue(parsed,parsed.value*eased);
      if(progress<1){
        window.requestAnimationFrame(frame);
      }else{
        node.removeAttribute('data-sbx-kpi-counting');
      }
    }
    window.requestAnimationFrame(frame);
  }

  function prepareOverviewProgress(){
    if(reduceMotion)return null;

    var holder,fill,percentNodes;
    if(desktop()){
      holder=document.querySelector('#sbRefOverviewV2 .sb-v2-collection');
      if(!holder||holder.dataset.sbxProgressPrepared==='1')return null;
      fill=holder.querySelector('.sb-v2-bar i');
      percentNodes=holder.querySelectorAll('.sb-v2-bar-cap b');
    }else{
      holder=document.querySelector('.overview > .stat-hero > .stat-cell.wide');
      if(!holder||holder.dataset.sbxProgressPrepared==='1')return null;
      fill=holder.querySelector('.bar-fill');
      var caption=holder.querySelector('.bar-caption');
      percentNodes=caption?caption.querySelectorAll('b'):[];
    }

    if(!fill)return null;
    var targetWidth=parseFloat(fill.style.width||'');
    if(!Number.isFinite(targetWidth))return null;
    var percents=[];
    Array.prototype.forEach.call(percentNodes,function(node){
      var parsed=parsePercentNode(node);
      if(parsed)percents.push(parsed);
    });
    holder.dataset.sbxProgressPrepared='1';
    fill.style.width='0%';
    percents.forEach(function(parsed){parsed.node.textContent=formatPercent(parsed,0);});
    return {wide:holder,fill:fill,targetWidth:Math.max(0,Math.min(100,targetWidth)),percents:percents};
  }

  function animateOverviewProgress(prepared){
    if(!prepared||reduceMotion)return;
    var started=null;
    prepared.fill.setAttribute('data-sbx-kpi-counting','');
    prepared.percents.forEach(function(parsed){parsed.node.setAttribute('data-sbx-kpi-counting','');});
    function frame(timestamp){
      if(!prepared.fill.isConnected)return;
      if(started===null)started=timestamp;
      var progress=Math.min(1,(timestamp-started)/DURATION);
      var eased=1-Math.pow(1-progress,4);
      prepared.fill.style.width=(prepared.targetWidth*eased)+'%';
      prepared.percents.forEach(function(parsed){
        parsed.node.textContent=progress===1?parsed.finalText:formatPercent(parsed,parsed.value*eased);
      });
      if(progress<1){
        window.requestAnimationFrame(frame);
      }else{
        prepared.fill.style.width=prepared.targetWidth+'%';
        prepared.fill.removeAttribute('data-sbx-kpi-counting');
        prepared.percents.forEach(function(parsed){
          parsed.node.textContent=parsed.finalText;
          parsed.node.removeAttribute('data-sbx-kpi-counting');
        });
      }
    }
    window.requestAnimationFrame(frame);
  }

  function overviewKpiCells(){
    return desktop()?document.querySelectorAll('#sbRefOverviewV2 .sb-v2-kpi'):document.querySelectorAll('.overview > .stat-hero > .stat-cell:not(.wide)');
  }

  function animateOverviewKpis(){
    if(hasAnimatedThisPage||!finalPortfolioHasRendered())return false;
    var cells=overviewKpiCells();
    var animated=false;
    Array.prototype.forEach.call(cells,function(cell){
      var label=cell.querySelector(desktop()?'.sb-v2-kpi-label':'.stat-label');
      var value=cell.querySelector(desktop()?'.sb-v2-kpi-value':'.stat-value');
      if(!label||!value||!KPI_LABELS[normalise(label.textContent)])return;
      var parsed=parseValue(value.textContent);
      if(parsed){
        animateValue(value,parsed);
        animated=true;
      }
    });
    if(animated)hasAnimatedThisPage=true;
    return animated;
  }

  function revealFinalOverview(){
    if(!financialDataReady()||!finalPortfolioHasRendered())return false;
    if(!loaderHasReleased())return false;
    var progressAnimation=!hasAnimatedThisPage?prepareOverviewProgress():null;
    root.classList.remove('sbx-overview-data-pending');
    if(!hasAnimatedThisPage){
      window.requestAnimationFrame(function(){
        animateOverviewKpis();
        animateOverviewProgress(progressAnimation);
      });
    }
    return true;
  }

  function containsOverviewHero(node){
    return node&&node.nodeType===1&&(
      (node.matches&&node.matches('.stat-hero,#sbRefOverviewV2,.sb-v2-kpis'))||
      (node.querySelector&&node.querySelector('.overview > .stat-hero,#sbRefOverviewV2,.sb-v2-kpis'))
    );
  }

  function schedule(){
    if(queued)return;
    queued=true;
    window.requestAnimationFrame(function(){
      queued=false;
      if(revealFinalOverview())return;
      window.clearTimeout(retryTimer);
      retryTimer=window.setTimeout(schedule,20);
    });
  }

  var style=document.createElement('style');
  style.id='sunblissOverviewKpiCountUpStyle';
  style.textContent=[
    '[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}',
    'html.sbx-overview-data-pending body{background:#03101a!important;overflow:hidden!important;}',
    'html.sbx-overview-data-pending #app{opacity:0!important;visibility:hidden!important;}',
    'html.sbx-overview-data-pending #sbxLoader{opacity:1!important;visibility:visible!important;pointer-events:auto!important;}',
    'html.sbx-overview-data-pending #sbxBootScene{opacity:1!important;}',
    'html.sbx-overview-data-pending #sbxBootCard{display:block!important;}'
  ].join('');
  document.head.appendChild(style);

  document.addEventListener('sunbliss:overview-financial-loading',function(){
    root.classList.add('sbx-overview-data-pending');
  });
  document.addEventListener('sunbliss:overview-financial-ready',function(){
    schedule();
  });

  if(window.MutationObserver){
    new MutationObserver(function(){
      schedule();
    }).observe(root,{attributes:true,attributeFilter:['class']});

    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        for(var j=0;j<mutations[i].addedNodes.length;j++){
          if(containsOverviewHero(mutations[i].addedNodes[j])){
            schedule();
            return;
          }
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  schedule();
})();
