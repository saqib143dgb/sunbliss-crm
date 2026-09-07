(function(){
  'use strict';
  if(window.__sunblissOverviewKpiCountUpInstalled)return;
  window.__sunblissOverviewKpiCountUpInstalled=true;

  var root=document.documentElement;
  var DURATION=1892;
  var DESKTOP_MIN=1024;
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets=null;
  var started=false;
  var completed=false;
  var startTime=null;
  var currentProgress=0;
  var frameId=0;

  function text(v){return v==null?'':String(v);}
  function normalise(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
  function desktop(){return window.matchMedia?window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches:window.innerWidth>=DESKTOP_MIN;}
  function loaderReleased(){return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');}
  function ease(progress){return 1-Math.pow(1-progress,4);}

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

  function stateReady(){
    if(!window.state||state.view!=='overview'||!Array.isArray(state.dues)||!state.syncedAt)return false;
    for(var i=0;i<state.dues.length;i++){
      var c=state.dues[i];
      if(!c||c.customerId===null||c.customerId===undefined||text(c.customerId).trim()==='')return false;
    }
    return true;
  }

  function captureTargets(nodes){
    if(!nodes||!stateReady())return null;
    var result={values:{},progress:null};
    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(!label||!value)continue;
      var key=normalise(label.textContent);
      if(key!=='units sold'&&key!=='sales value'&&key!=='collected'&&key!=='outstanding')continue;
      var parsed=parseValue(value.textContent);
      if(parsed)result.values[key]=parsed;
    }
    var units=result.values['units sold'];
    if(!units||units.value!==state.dues.length)return null;
    if(nodes.progress){
      var fill=nodes.progress.querySelector(nodes.fillSelector),width=fill?parseFloat(fill.style.width||''):NaN,percents=[];
      nodes.progress.querySelectorAll(nodes.percentSelector).forEach(function(node){var p=parsePercent(node);if(p)percents.push(p);});
      if(fill&&Number.isFinite(width))result.progress={width:Math.max(0,Math.min(100,width)),percents:percents};
    }
    return result;
  }

  function applyProgress(progress){
    if(!targets)return false;
    var nodes=overviewNodes();
    if(!nodes)return false;
    var raw=Math.max(0,Math.min(1,progress)),eased=ease(raw);
    for(var i=0;i<nodes.cells.length;i++){
      var label=nodes.cells[i].querySelector(nodes.label),value=nodes.cells[i].querySelector(nodes.value);
      if(!label||!value)continue;
      var target=targets.values[normalise(label.textContent)];
      if(!target)continue;
      value.setAttribute('aria-label',target.finalText);
      if(raw<1)value.setAttribute('data-sbx-kpi-counting','');else value.removeAttribute('data-sbx-kpi-counting');
      value.textContent=raw>=1?target.finalText:formatValue(target,target.value*eased);
    }
    if(nodes.progress&&targets.progress){
      var fill=nodes.progress.querySelector(nodes.fillSelector);
      if(fill)fill.style.width=(targets.progress.width*(raw>=1?1:eased))+'%';
      var percentNodes=nodes.progress.querySelectorAll(nodes.percentSelector);
      for(var j=0;j<percentNodes.length&&j<targets.progress.percents.length;j++){
        var p=targets.progress.percents[j];
        percentNodes[j].textContent=raw>=1?p.finalText:formatPercent(p,p.value*eased);
      }
    }
    return true;
  }

  function frame(ts){
    if(completed)return;
    if(startTime===null)startTime=ts;
    currentProgress=Math.min(1,(ts-startTime)/DURATION);
    applyProgress(currentProgress);
    if(currentProgress<1){frameId=requestAnimationFrame(frame);return;}
    completed=true;
    frameId=0;
  }

  function startTimeline(){
    if(started||completed||!targets)return false;
    started=true;
    currentProgress=0;
    applyProgress(0);
    if(reduceMotion){currentProgress=1;applyProgress(1);completed=true;return true;}
    frameId=requestAnimationFrame(frame);
    return true;
  }

  function prepareFromRenderedOverview(){
    if(completed)return false;

    /* Once animation has started, its captured target values are immutable.
       Never recapture from the in-flight DOM because the animation itself changes
       textContent every frame. Recapturing those mutations was the source of the
       desktop main-thread feedback loop. */
    if(started&&targets)return false;

    var nodes=overviewNodes();
    var next=captureTargets(nodes);
    if(!next)return false;
    targets=next;
    applyProgress(0);
    if(loaderReleased())startTimeline();
    return true;
  }

  /* Called by renderers that own the final Overview DOM. Keeping this explicit
     avoids watching the whole document for child mutations. */
  window.__sunblissOverviewKpiRendered=prepareFromRenderedOverview;

  /* The only observer left watches loader state on <html>. It cannot see KPI text
     mutations, so it cannot feed back into the animation. */
  if(window.MutationObserver){
    new MutationObserver(function(){
      if(!loaderReleased()||completed)return;
      if(!targets)prepareFromRenderedOverview();
      startTimeline();
    }).observe(root,{attributes:true,attributeFilter:['class']});
  }

  /* Desktop shell is created by a deferred runtime patch. Detect it with a small,
     bounded one-shot bootstrap instead of a document-wide MutationObserver.
     The retry stops as soon as the shell/targets exist and is capped so startup
     can never create an unbounded polling loop. */
  function armDesktopBootstrap(){
    if(!desktop()||completed||targets)return;
    var attempts=0;
    var MAX_ATTEMPTS=240;
    function check(){
      if(completed||targets||attempts>=MAX_ATTEMPTS)return;
      attempts++;
      if(document.getElementById('sbRefOverviewV2')){
        prepareFromRenderedOverview();
        if(targets)return;
      }
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }

  var style=document.createElement('style');
  style.id='sunblissOverviewKpiCountUpStyle';
  style.textContent='[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(style);

  if(document.readyState!=='loading')prepareFromRenderedOverview();
  armDesktopBootstrap();
})();
