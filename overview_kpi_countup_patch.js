(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;

  var root=document.documentElement;
  var DURATION=1892;
  var DESKTOP_MIN=1024;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started=false;
  var completed=false;
  var queued=false;
  var rerendering=false;
  var startTime=null;
  var targets=null;
  var latestProgress=0;

  function text(v){return v==null?'':String(v);}
  function normalise(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
  function desktop(){return window.matchMedia?window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches:window.innerWidth>=DESKTOP_MIN;}
  function loaderReleased(){return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');}
  function ease(progress){
    return progress<0.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
  }

  function normalisePortfolioBeforePaint(){
    if(rerendering||!window.state||!Array.isArray(state.dues))return false;
    var clean=state.dues.filter(function(c){
      return !!c&&c.customerId!==null&&c.customerId!==undefined&&text(c.customerId).trim()!=='';
    });
    if(clean.length===state.dues.length)return false;
    state.dues=clean;
    if(state.view==='overview'&&typeof window.renderMain==='function'){
      rerendering=true;
      try{window.renderMain();}finally{rerendering=false;}
    }
    return true;
  }

  function stateReady(){
    if(!window.state||state.view!=='overview'||!Array.isArray(state.dues)||!state.syncedAt)return false;
    for(var i=0;i<state.dues.length;i++){
      var c=state.dues[i];
      if(!c||c.customerId===null||c.customerId===undefined||text(c.customerId).trim()==='')return false;
    }
    return true;
  }

  function parseValue(value){
    var finalText=text(value).replace(/\u00a0/g,' ').trim();
    var m=finalText.match(/^([^0-9+\-]*)([+\-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)(\s*[KMBT]?)$/i);
    if(!m)return null;
    var numberText=m[2],dot=numberText.indexOf('.');
    return{finalText:finalText,prefix:m[1],value:Number(numberText.replace(/,/g,'')),suffix:m[3],decimals:dot<0?0:numberText.length-dot-1,grouped:numberText.indexOf(',')>=0};
  }

  function formatValue(p,value){
    var factor=Math.pow(10,p.decimals),rounded=Math.round(value*factor)/factor;
    return p.prefix+rounded.toLocaleString('en-US',{useGrouping:p.grouped,minimumFractionDigits:p.decimals,maximumFractionDigits:p.decimals})+p.suffix;
  }

  function parsePercent(node){
    if(!node)return null;
    var finalText=text(node.textContent).trim(),m=finalText.match(/^([+\-]?\d+(?:\.\d+)?)%$/);
    if(!m)return null;
    var dot=m[1].indexOf('.');
    return{finalText:finalText,value:Number(m[1]),decimals:dot<0?0:m[1].length-dot-1};
  }

  function formatPercent(p,value){
    var factor=Math.pow(10,p.decimals),rounded=Math.round(value*factor)/factor;
    return rounded.toFixed(p.decimals)+'%';
  }

  function overviewNodes(){
    if(desktop()){
      var dashboard=document.getElementById('sbRefOverviewV2');
      if(!dashboard)return null;
      return{
        cells:dashboard.querySelectorAll('.sb-v2-kpi'),
        label:'.sb-v2-kpi-label',value:'.sb-v2-kpi-value',
        progress:dashboard.querySelector('.sb-v2-collection'),
        fillSelector:'.sb-v2-bar i',percentSelector:'.sb-v2-bar-cap b'
      };
    }
    var hero=document.querySelector('.overview > .stat-hero');
    if(!hero)return null;
    return{
      cells:hero.querySelectorAll('.stat-cell:not(.wide)'),
      label:'.stat-label',value:'.stat-value',
      progress:hero.querySelector('.stat-cell.wide'),
      fillSelector:'.bar-fill',percentSelector:'.bar-caption b'
    };
  }

  function finalOverviewReady(nodes){
    if(!nodes||!stateReady())return false;
    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(label&&value&&normalise(label.textContent)==='units sold'){
        var parsed=parseValue(value.textContent);
        return !!parsed&&parsed.value===state.dues.length;
      }
    }
    return false;
  }

  function captureTargets(nodes){
    var result={values:{},progress:null};
    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(!label||!value)continue;
      var key=normalise(label.textContent);
      if(key!=='units sold'&&key!=='sales value'&&key!=='collected'&&key!=='outstanding')continue;
      var parsed=parseValue(value.textContent);
      if(parsed)result.values[key]=parsed;
    }
    var holder=nodes.progress;
    if(holder){
      var fill=holder.querySelector(nodes.fillSelector),width=fill?parseFloat(fill.style.width||''):NaN,percents=[];
      holder.querySelectorAll(nodes.percentSelector).forEach(function(node){var p=parsePercent(node);if(p)percents.push(p);});
      if(fill&&Number.isFinite(width))result.progress={width:Math.max(0,Math.min(100,width)),percents:percents};
    }
    return Object.keys(result.values).length?result:null;
  }

  function applyProgress(rawProgress){
    if(!targets)return;
    var nodes=overviewNodes();
    if(!nodes)return;
    var progress=Math.max(0,Math.min(1,rawProgress)),eased=ease(progress);

    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(!label||!value)continue;
      var key=normalise(label.textContent),target=targets.values[key];
      if(!target)continue;
      value.setAttribute('aria-label',target.finalText);
      value.setAttribute('data-sbx-kpi-counting','');
      value.textContent=progress>=1?target.finalText:formatValue(target,target.value*eased);
      if(progress>=1)value.removeAttribute('data-sbx-kpi-counting');
    }

    if(nodes.progress&&targets.progress){
      var fill=nodes.progress.querySelector(nodes.fillSelector);
      if(fill)fill.style.width=(targets.progress.width*(progress>=1?1:eased))+'%';
      var percentNodes=nodes.progress.querySelectorAll(nodes.percentSelector);
      for(var j=0;j<percentNodes.length&&j<targets.progress.percents.length;j++){
        var p=targets.progress.percents[j];
        percentNodes[j].textContent=progress>=1?p.finalText:formatPercent(p,p.value*eased);
      }
    }
  }

  function frame(ts){
    if(completed)return;
    if(startTime===null)startTime=ts;
    latestProgress=Math.min(1,(ts-startTime)/DURATION);
    applyProgress(latestProgress);
    if(latestProgress<1){
      requestAnimationFrame(frame);
    }else{
      completed=true;
      root.classList.remove('sbx-overview-data-pending','sbx-kpi-pending');
    }
  }

  function start(){
    if(started||!loaderReleased())return false;
    normalisePortfolioBeforePaint();
    var nodes=overviewNodes();
    if(!finalOverviewReady(nodes))return false;
    targets=captureTargets(nodes);
    if(!targets)return false;
    started=true;
    if(reduceMotion){latestProgress=1;applyProgress(1);completed=true;return true;}
    applyProgress(0);
    requestAnimationFrame(frame);
    return true;
  }

  function schedule(){
    if(started||queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;start();});
  }

  var style=document.createElement('style');
  style.id='sunblissOverviewKpiCountUpStyle';
  style.textContent='[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(style);

  if(window.MutationObserver){
    new MutationObserver(function(){
      if(started&&!completed){applyProgress(latestProgress);return;}
      if(!start())schedule();
    }).observe(root,{attributes:true,attributeFilter:['class']});

    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].addedNodes&&mutations[i].addedNodes.length){
          normalisePortfolioBeforePaint();
          if(started&&!completed){applyProgress(latestProgress);return;}
          if(!start())schedule();
          return;
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  document.addEventListener('sunbliss:overview-financial-ready',function(){
    if(started&&!completed)applyProgress(latestProgress);else schedule();
  });
  start();
})();