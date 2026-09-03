(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;
  var root=document.documentElement;
  root.classList.add('sbx-kpi-pending');

  var KPI_LABELS={
    'units sold':true,
    'sales value':true,
    'collected':true,
    'outstanding':true
  };
  var DURATION=525;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasAnimatedThisPage=false;
  var retryTimer=null;

  function normalise(value){
    return String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
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

  function animateOverviewKpis(){
    if(hasAnimatedThisPage)return;
    var cells=document.querySelectorAll('.overview > .stat-hero > .stat-cell:not(.wide)');
    var animated=false;
    Array.prototype.forEach.call(cells,function(cell){
      var label=cell.querySelector('.stat-label');
      var value=cell.querySelector('.stat-value');
      if(!label||!value||!KPI_LABELS[normalise(label.textContent)])return;
      var parsed=parseValue(value.textContent);
      if(parsed){
        animateValue(value,parsed);
        animated=true;
      }
    });
    if(animated){
      hasAnimatedThisPage=true;
      root.classList.remove('sbx-kpi-pending');
    }
  }

  function containsOverviewHero(node){
    return node&&node.nodeType===1&&(
      (node.matches&&node.matches('.stat-hero'))||
      (node.querySelector&&node.querySelector('.overview > .stat-hero'))
    );
  }

  var queued=false;
  function loaderHasReleased(){
    return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');
  }

  function finalPortfolioHasRendered(){
    var hero=document.querySelector('.overview > .stat-hero');
    if(!hero||!window.state||state.view!=='overview'||!Array.isArray(state.dues))return false;
    for(var i=0;i<state.dues.length;i++){
      var customer=state.dues[i];
      if(!customer||customer.customerId===null||customer.customerId===undefined||String(customer.customerId).trim()==='')return false;
    }
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

  function runAtLoaderRelease(){
    if(hasAnimatedThisPage||!loaderHasReleased())return false;
    if(!finalPortfolioHasRendered())return false;
    window.clearTimeout(retryTimer);
    animateOverviewKpis();
    return hasAnimatedThisPage;
  }

  function schedule(){
    if(hasAnimatedThisPage||queued)return;
    queued=true;
    window.requestAnimationFrame(function(){
      queued=false;
      if(hasAnimatedThisPage)return;
      if(!document.querySelector('.overview > .stat-hero'))return;
      if(runAtLoaderRelease())return;
      window.clearTimeout(retryTimer);
      retryTimer=window.setTimeout(schedule,24);
    });
  }

  var style=document.createElement('style');
  style.textContent='html.sbx-kpi-pending .overview > .stat-hero{visibility:hidden!important;opacity:0!important;}[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(style);

  window.setTimeout(function(){root.classList.remove('sbx-kpi-pending');},8000);

  if(window.MutationObserver){
    /* The loader removes sbx-loading/sbx-booting in one task. MutationObserver callbacks
       run before the browser paints that class change, so initialize the count-up here.
       This prevents a visible frame where the loader is gone but the KPI hero is hidden. */
    new MutationObserver(function(){
      if(hasAnimatedThisPage||!loaderHasReleased())return;
      if(!runAtLoaderRelease())schedule();
    }).observe(root,{attributes:true,attributeFilter:['class']});

    new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        for(var j=0;j<mutations[i].addedNodes.length;j++){
          if(containsOverviewHero(mutations[i].addedNodes[j])){schedule();return;}
        }
      }
    }).observe(document.body||document.documentElement,{childList:true,subtree:true});
  }
  schedule();
})();
