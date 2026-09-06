(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;

  var root=document.documentElement;
  var DURATION=946;
  var DESKTOP_MIN=1024;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animated=false;
  var queued=false;
  var rerendering=false;

  function text(v){return v==null?'':String(v);}
  function normalise(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
  function desktop(){return window.matchMedia?window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches:window.innerWidth>=DESKTOP_MIN;}
  function loaderReleased(){return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');}

  /* Available / resale inventory must never enter the sales KPI state. Doing this
     before the first Overview paint prevents the old 95 -> 70 second-render jump. */
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
    return{node:node,finalText:finalText,value:Number(m[1]),decimals:dot<0?0:m[1].length-dot-1};
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

  function animateNumber(node,p){
    if(!node||!p||!Number.isFinite(p.value))return;
    node.setAttribute('aria-label',p.finalText);
    if(reduceMotion){node.textContent=p.finalText;return;}
    node.textContent=formatValue(p,0);
    node.setAttribute('data-sbx-kpi-counting','');
    var started=null;
    function frame(ts){
      if(!node.isConnected)return;
      if(started===null)started=ts;
      var progress=Math.min(1,(ts-started)/DURATION),eased=1-Math.pow(1-progress,4);
      node.textContent=progress===1?p.finalText:formatValue(p,p.value*eased);
      if(progress<1)requestAnimationFrame(frame);else node.removeAttribute('data-sbx-kpi-counting');
    }
    requestAnimationFrame(frame);
  }

  function animateProgress(nodes){
    var holder=nodes&&nodes.progress;
    if(!holder||reduceMotion)return;
    var fill=holder.querySelector(nodes.fillSelector);
    if(!fill)return;
    var target=parseFloat(fill.style.width||'');
    if(!Number.isFinite(target))return;
    var percents=[];
    holder.querySelectorAll(nodes.percentSelector).forEach(function(node){var p=parsePercent(node);if(p)percents.push(p);});
    fill.style.width='0%';
    percents.forEach(function(p){p.node.textContent=formatPercent(p,0);});
    var started=null;
    function frame(ts){
      if(!fill.isConnected)return;
      if(started===null)started=ts;
      var progress=Math.min(1,(ts-started)/DURATION),eased=1-Math.pow(1-progress,4);
      fill.style.width=(Math.max(0,Math.min(100,target))*eased)+'%';
      percents.forEach(function(p){p.node.textContent=progress===1?p.finalText:formatPercent(p,p.value*eased);});
      if(progress<1)requestAnimationFrame(frame);else fill.style.width=Math.max(0,Math.min(100,target))+'%';
    }
    requestAnimationFrame(frame);
  }

  function start(){
    if(animated||!loaderReleased())return false;
    normalisePortfolioBeforePaint();
    var nodes=overviewNodes();
    if(!finalOverviewReady(nodes))return false;
    var didAnimate=false;
    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(!label||!value)continue;
      var key=normalise(label.textContent);
      if(key!=='units sold'&&key!=='sales value'&&key!=='collected'&&key!=='outstanding')continue;
      var parsed=parseValue(value.textContent);
      if(parsed){animateNumber(value,parsed);didAnimate=true;}
    }
    if(!didAnimate)return false;
    animated=true;
    animateProgress(nodes);
    root.classList.remove('sbx-overview-data-pending','sbx-kpi-pending');
    return true;
  }

  function schedule(){
    if(animated||queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;start();});
  }

  var style=document.createElement('style');
  style.id='sunblissOverviewKpiCountUpStyle';
  style.textContent='[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(style);

  if(window.MutationObserver){
    new MutationObserver(function(){if(!start())schedule();}).observe(root,{attributes:true,attributeFilter:['class']});
    new MutationObserver(function(mutations){
      if(animated)return;
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].addedNodes&&mutations[i].addedNodes.length){
          normalisePortfolioBeforePaint();
          if(!start())schedule();
          return;
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  document.addEventListener('sunbliss:overview-financial-ready',schedule);
  start();
})();