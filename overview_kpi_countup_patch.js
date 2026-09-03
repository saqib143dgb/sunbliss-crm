(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;

  var KPI_LABELS={
    'units sold':true,
    'sales value':true,
    'collected':true,
    'outstanding':true
  };
  var DURATION=525;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasAnimatedThisPage=false;

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
    if(animated)hasAnimatedThisPage=true;
  }

  function containsOverviewHero(node){
    return node&&node.nodeType===1&&(
      (node.matches&&node.matches('.stat-hero'))||
      (node.querySelector&&node.querySelector('.overview > .stat-hero'))
    );
  }

  var queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    window.requestAnimationFrame(function(){
      queued=false;
      animateOverviewKpis();
    });
  }

  var style=document.createElement('style');
  style.textContent='[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(style);

  if(window.MutationObserver){
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
