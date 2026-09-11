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

  /*
    The preload script runs before the CRM renderer. Keep KPI values hidden until
    the authoritative rendered snapshot has been captured and reset to the start
    of the count-up. This prevents a final-value -> intermediate-value flash on
    refresh while preserving the one-shot count-up animation.
  */
  root.classList.add('sbx-kpi-pending');

  function text(v){return v==null?'':String(v);}
  function normalise(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
  function desktop(){return window.matchMedia?window.matchMedia('(min-width:'+DESKTOP_MIN+'px)').matches:window.innerWidth>=DESKTOP_MIN;}
  function loaderReleased(){return !root.classList.contains('sbx-booting')&&!root.classList.contains('sbx-loading');}
  function ease(progress){return 1-Math.pow(1-progress,4);}

  var KPI_META={
    'units sold':{
      kind:'units',
      icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-4 8 4v13M2 21h20M8 10h1M8 14h1M15 10h1M15 14h1M9 21v-4h6v4"/></svg>'
    },
    'sales value':{
      kind:'sales',
      icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="10" cy="6" rx="6" ry="3"/><path d="M4 6v6c0 1.7 2.7 3 6 3 1 0 1.9-.1 2.7-.3M4 12v5c0 1.7 2.7 3 6 3 1.1 0 2.1-.1 3-.4"/><circle cx="17" cy="14" r="4"/><path d="M15.6 14h2.8M17 12.6v2.8"/></svg>'
    },
    'collected':{
      kind:'collected',
      icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="16" cy="7" r="4"/><path d="M14.5 7h3M16 5.5v3M3 14h4l2.2 3H16a4 4 0 0 0 4-4v-1h-7l-2-2H7M3 14v6"/></svg>'
    },
    'outstanding':{
      kind:'outstanding',
      icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 11h6M9 15h4"/><circle cx="17.5" cy="17.5" r="3.2"/><path d="M17.5 15.9v2M17.5 19.4h.01"/></svg>'
    }
  };

  function decorateKpis(nodes){
    if(!nodes||desktop())return false;
    for(var i=0;i<nodes.cells.length;i++){
      var cell=nodes.cells[i],label=cell.querySelector(nodes.label);
      if(!label)continue;
      var key=normalise(label.textContent),meta=KPI_META[key];
      if(!meta)continue;
      cell.classList.add('sbx-kpi-card');
      cell.setAttribute('data-sbx-kpi-kind',meta.kind);
      if(!label.querySelector('.sbx-kpi-header-icon')){
        var icon=document.createElement('span');
        icon.className='sbx-kpi-header-icon';
        icon.setAttribute('aria-hidden','true');
        icon.innerHTML=meta.icon;
        label.insertBefore(icon,label.firstChild);
      }
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
    decorateKpis(nodes);
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

    /*
      Collection percentage and bar are ratios, not count-up counters. Keep them at
      their final authoritative values throughout the number animation so the UI
      never displays mathematically misleading percentages such as 19.3% + 41.6%.
    */
    if(nodes.progress&&targets.progress){
      var fill=nodes.progress.querySelector(nodes.fillSelector);
      if(fill)fill.style.width=targets.progress.width+'%';
      var percentNodes=nodes.progress.querySelectorAll(nodes.percentSelector);
      for(var j=0;j<percentNodes.length&&j<targets.progress.percents.length;j++){
        percentNodes[j].textContent=targets.progress.percents[j].finalText;
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
    root.classList.remove('sbx-kpi-pending');
  }

  function startTimeline(){
    if(started||completed||!targets)return false;
    started=true;
    currentProgress=0;
    applyProgress(0);
    root.classList.remove('sbx-kpi-pending');
    if(reduceMotion){currentProgress=1;applyProgress(1);completed=true;return true;}
    frameId=requestAnimationFrame(frame);
    return true;
  }

  function prepareFromRenderedOverview(){
    var nodes=overviewNodes();
    decorateKpis(nodes);
    if(completed)return false;

    /* Once animation has started, its captured target values are immutable.
       Never recapture from the in-flight DOM because the animation itself changes
       textContent every frame. Recapturing those mutations was the source of the
       desktop main-thread feedback loop. */
    if(started&&targets)return false;

    var next=captureTargets(nodes);
    if(!next)return false;
    targets=next;

    /* Reset before exposure. Because this hook runs synchronously from the owning
       renderer, the browser cannot paint the final KPI snapshot and then reverse
       into the animation on the next frame. */
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
  style.textContent=[
    '[data-sbx-kpi-counting]{font-variant-numeric:tabular-nums;}',
    'html.sbx-kpi-pending .overview>.stat-hero .stat-value,html.sbx-kpi-pending #sbRefOverviewV2 .sb-v2-kpi-value{visibility:hidden!important;}',
    'html.sbx-kpi-pending .overview>.stat-hero .bar-fill,html.sbx-kpi-pending .overview>.stat-hero .bar-caption,html.sbx-kpi-pending #sbRefOverviewV2 .sb-v2-bar,html.sbx-kpi-pending #sbRefOverviewV2 .sb-v2-bar-cap{visibility:hidden!important;}',
    '@media(max-width:1023px){',
      '.overview>.stat-hero .stat-cell.sbx-kpi-card{padding:12px 12px 15px!important;}',
      '.overview>.stat-hero .sbx-kpi-card .stat-label{display:flex!important;align-items:center!important;gap:10px!important;min-height:46px!important;width:100%!important;margin:0 0 11px!important;padding:5px 10px 5px 7px!important;border-radius:11px!important;font-size:9.5px!important;letter-spacing:.075em!important;color:#625f56!important;box-sizing:border-box!important;}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="units"] .stat-label{background:linear-gradient(90deg,rgba(214,224,202,.78),rgba(226,232,216,.58))!important;}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="sales"] .stat-label{background:linear-gradient(90deg,rgba(236,225,202,.78),rgba(242,234,217,.58))!important;}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="collected"] .stat-label{background:linear-gradient(90deg,rgba(210,225,205,.82),rgba(227,235,221,.60))!important;}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="outstanding"] .stat-label{background:linear-gradient(90deg,rgba(235,211,205,.82),rgba(242,225,221,.60))!important;}',
      '.overview>.stat-hero .sbx-kpi-header-icon{align-self:stretch;display:flex;align-items:center;justify-content:flex-start;flex:0 0 42px;width:42px;padding-right:8px;border-right:1px solid rgba(115,108,92,.24);color:var(--gold-deep);}',
      '.overview>.stat-hero .sbx-kpi-header-icon svg{width:30px;height:30px;padding:5px;border-radius:50%;background:rgba(255,255,255,.46);fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round;box-sizing:border-box;}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="collected"] .sbx-kpi-header-icon{color:var(--sage);}',
      '.overview>.stat-hero .sbx-kpi-card[data-sbx-kpi-kind="outstanding"] .sbx-kpi-header-icon{color:#9b655b;}',
      '.overview>.stat-hero .sbx-kpi-card .stat-value{padding-left:2px;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  if(document.readyState!=='loading')prepareFromRenderedOverview();
  armDesktopBootstrap();
})();
