(function(){
  'use strict';
  if(window.__sunblissOverviewKpiDrilldownInstalled)return;
  window.__sunblissOverviewKpiDrilldownInstalled=true;

  var KPI_IDS={
    btnUnitsSold:'units',
    btnSalesValue:'sales',
    btnCollected:'collected',
    btnOutstanding:'outstanding'
  };

  function n(value){
    var num=Number(value);
    return Number.isFinite(num)?num:0;
  }
  function safe(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function title(value){
    var raw=String(value==null?'':value).trim();
    if(!raw)return '—';
    if(typeof window.titleCase==='function'){
      try{return titleCase(raw);}catch(_){}
    }
    return raw.replace(/\b\w/g,function(c){return c.toUpperCase();});
  }
  function money(value){
    return 'AED '+Math.round(Math.abs(n(value))).toLocaleString('en-US');
  }
  function compact(value){
    var v=Math.abs(n(value));
    if(v>=1e9)return 'AED '+(v/1e9).toFixed(v>=1e10?1:2).replace(/\.0+$/,'')+'B';
    if(v>=1e6)return 'AED '+(v/1e6).toFixed(v>=1e8?1:2).replace(/\.0+$/,'')+'M';
    if(v>=1e3)return 'AED '+(v/1e3).toFixed(v>=1e5?1:2).replace(/\.0+$/,'')+'K';
    return money(v);
  }
  function naturalUnit(a,b){
    return String(a.unit||'').localeCompare(String(b.unit||''),undefined,{numeric:true,sensitivity:'base'});
  }
  function currentStats(){
    if(typeof window.portfolioStats==='function'){
      try{return portfolioStats();}catch(_){}
    }
    var rows=(window.state&&Array.isArray(state.dues))?state.dues:[];
    var totalSales=0,totalReceived=0,totalOutstanding=0;
    rows.forEach(function(c){
      totalSales+=n(c.total);
      totalReceived+=n(c.received);
      totalOutstanding+=n(c.outstanding);
    });
    return{
      units:rows.length,
      totalSales:totalSales,
      totalReceived:totalReceived,
      totalOutstanding:totalOutstanding,
      collectedPct:totalSales?Math.round(totalReceived/totalSales*1000)/10:0,
      outstandingPct:totalSales?Math.round(Math.abs(totalOutstanding)/totalSales*1000)/10:0
    };
  }
  function outstandingFor(c){
    var raw=n(c&&c.outstanding);
    return raw<0?Math.abs(raw):0;
  }
  function metricMeta(kind,stats,rows){
    if(kind==='units')return{
      title:'Units Sold',
      eyebrow:'Sales Portfolio',
      summary:String(stats.units||rows.length),
      summaryLabel:'Total units sold',
      listTitle:'Sold units',
      rowAmount:function(c){return money(c.total);},
      rowLabel:'sale value',
      include:function(){return true;},
      sort:function(a,b){return naturalUnit(a,b);}
    };
    if(kind==='sales')return{
      title:'Sales Value',
      eyebrow:'Sales Portfolio',
      summary:compact(stats.totalSales),
      summaryLabel:'Total sales value',
      listTitle:'Sales value by unit',
      rowAmount:function(c){return money(c.total);},
      rowLabel:'sale value',
      include:function(){return true;},
      sort:function(a,b){return n(b.total)-n(a.total)||naturalUnit(a,b);}
    };
    if(kind==='collected')return{
      title:'Collected',
      eyebrow:'Collections',
      summary:compact(stats.totalReceived),
      summaryLabel:(n(stats.collectedPct).toFixed(1).replace(/\.0$/,'')+'% of sales collected'),
      listTitle:'Collections by unit',
      rowAmount:function(c){return money(c.received);},
      rowLabel:'collected',
      include:function(c){return n(c.received)>0.005;},
      sort:function(a,b){return n(b.received)-n(a.received)||naturalUnit(a,b);}
    };
    return{
      title:'Outstanding',
      eyebrow:'Collections',
      summary:compact(Math.abs(n(stats.totalOutstanding))),
      summaryLabel:(n(stats.outstandingPct).toFixed(1).replace(/\.0$/,'')+'% of sales outstanding'),
      listTitle:'Outstanding by unit',
      rowAmount:function(c){return money(outstandingFor(c));},
      rowLabel:'outstanding',
      include:function(c){return outstandingFor(c)>1;},
      sort:function(a,b){return outstandingFor(b)-outstandingFor(a)||naturalUnit(a,b);}
    };
  }

  function installStyle(){
    if(document.getElementById('sbxKpiDrilldownStyle'))return;
    var style=document.createElement('style');
    style.id='sbxKpiDrilldownStyle';
    style.textContent=`
      .sbx-kpi-detail{padding:18px 18px 118px;color:var(--ink)}
      .sbx-kpi-top{display:flex;align-items:center;gap:12px;margin:0 0 16px}
      .sbx-kpi-back-source{display:none!important}
      .sbx-kpi-heading{min-width:0}
      .sbx-kpi-eyebrow{font:600 10px/1.1 "IBM Plex Mono",monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-deep);margin:0 0 4px}
      .sbx-kpi-heading h1{font:600 25px/1.08 Fraunces,serif;letter-spacing:-.02em;margin:0;color:var(--ink)}
      .sbx-kpi-summary{border:1px solid var(--paper-line);border-radius:16px;background:linear-gradient(135deg,rgba(198,151,46,.11),rgba(255,255,255,.35));padding:17px 18px;margin-bottom:20px;box-shadow:0 4px 16px rgba(15,26,38,.045)}
      .sbx-kpi-summary-value{font:600 29px/1 Fraunces,serif;letter-spacing:-.02em;color:var(--ink);margin:0 0 7px}
      .sbx-kpi-summary-label{font:500 12.5px/1.35 Inter,sans-serif;color:var(--muted);margin:0}
      .sbx-kpi-list-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 2px 8px}
      .sbx-kpi-list-head h2{font:600 17px/1.15 Fraunces,serif;margin:0;color:var(--ink)}
      .sbx-kpi-count{font:500 10.5px/1 "IBM Plex Mono",monospace;color:var(--muted);white-space:nowrap}
      .sbx-kpi-list{border:1px solid var(--paper-line);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.22)}
      .sbx-kpi-row{display:grid;width:100%;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:11px;border:0;border-bottom:1px solid var(--paper-line);background:transparent;text-align:left;padding:12px 13px;color:var(--ink)}
      .sbx-kpi-row:last-child{border-bottom:0}
      .sbx-kpi-row:active{background:rgba(198,151,46,.08)}
      .sbx-kpi-unit{font:600 11.5px/1.2 "IBM Plex Mono",monospace;color:var(--gold-deep)}
      .sbx-kpi-person{min-width:0}
      .sbx-kpi-name{display:block;font:600 12.5px/1.25 Inter,sans-serif;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sbx-kpi-type{display:block;font:500 10.5px/1.25 Inter,sans-serif;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sbx-kpi-money{text-align:right;white-space:nowrap}
      .sbx-kpi-money strong{display:block;font:600 12px/1.15 Inter,sans-serif;color:var(--ink)}
      .sbx-kpi-money small{display:block;font:500 9.5px/1.2 Inter,sans-serif;color:var(--muted);margin-top:3px}
      .sbx-kpi-empty{padding:34px 18px;text-align:center;font:500 12.5px/1.5 Inter,sans-serif;color:var(--muted)}
      @media(min-width:1024px){
        body.sunbliss-ref-desktop .sbx-kpi-detail,body.sunbliss-desktop .sbx-kpi-detail{padding:24px 28px 42px}
        body.sunbliss-ref-desktop .sbx-kpi-top,body.sunbliss-desktop .sbx-kpi-top{margin-bottom:18px}
        body.sunbliss-ref-desktop .sbx-kpi-heading h1,body.sunbliss-desktop .sbx-kpi-heading h1{font-size:28px}
        body.sunbliss-ref-desktop .sbx-kpi-summary,body.sunbliss-desktop .sbx-kpi-summary{max-width:none;padding:19px 22px}
        body.sunbliss-ref-desktop .sbx-kpi-summary-value,body.sunbliss-desktop .sbx-kpi-summary-value{font-size:32px}
        body.sunbliss-ref-desktop .sbx-kpi-row,body.sunbliss-desktop .sbx-kpi-row{grid-template-columns:110px minmax(0,1fr) 190px;padding:13px 16px}
        body.sunbliss-ref-desktop .sbx-kpi-name,body.sunbliss-desktop .sbx-kpi-name{font-size:13px}
      }`;
    document.head.appendChild(style);
  }

  function renderMetric(kind,options){
    options=options||{};
    if(!window.state||!Array.isArray(state.dues))return;
    installStyle();
    var main=document.getElementById('main')||window.mainEl;
    if(!main)return;
    var all=state.dues.slice();
    var stats=currentStats();
    var meta=metricMeta(kind,stats,all);
    var rows=all.filter(meta.include).sort(meta.sort);
    var html='<button type="button" class="back sbx-kpi-back-source" id="sbxKpiBack" aria-label="Back to overview">Back</button>'+
      '<div class="sbx-kpi-detail" data-kpi-kind="'+safe(kind)+'">'+
      '<div class="sbx-kpi-top">'+
        '<div class="sbx-kpi-heading"><p class="sbx-kpi-eyebrow">'+safe(meta.eyebrow)+'</p><h1>'+safe(meta.title)+'</h1></div>'+
      '</div>'+
      '<section class="sbx-kpi-summary"><p class="sbx-kpi-summary-value">'+safe(meta.summary)+'</p><p class="sbx-kpi-summary-label">'+safe(meta.summaryLabel)+'</p></section>'+
      '<div class="sbx-kpi-list-head"><h2>'+safe(meta.listTitle)+'</h2><span class="sbx-kpi-count">'+rows.length+' '+(rows.length===1?'record':'records')+'</span></div>'+
      '<div class="sbx-kpi-list">';

    if(!rows.length){
      html+='<div class="sbx-kpi-empty">No matching records.</div>';
    }else{
      rows.forEach(function(c){
        html+='<button type="button" class="sbx-kpi-row" data-kpi-unit="'+safe(c.unit||'')+'" data-kpi-sno="'+safe(c.sno==null?'':c.sno)+'">'+
          '<span class="sbx-kpi-unit">'+safe(c.unit||'—')+'</span>'+
          '<span class="sbx-kpi-person"><span class="sbx-kpi-name">'+safe(title(c.name||'Customer'))+'</span><span class="sbx-kpi-type">'+safe(c.type||'Unit type not specified')+'</span></span>'+
          '<span class="sbx-kpi-money"><strong>'+safe(meta.rowAmount(c))+'</strong><small>'+safe(meta.rowLabel)+'</small></span>'+
        '</button>';
      });
    }
    html+='</div></div>';
    main.innerHTML=html;

    var back=document.getElementById('sbxKpiBack');
    if(back)back.addEventListener('click',function(){
      window.__sunblissKpiReturnContext=null;
      if(typeof window.renderOverview==='function')renderOverview();
      else if(typeof window.render==='function')render();
    });
    main.querySelectorAll('.sbx-kpi-row').forEach(function(row){
      row.addEventListener('click',function(){
        var unit=row.getAttribute('data-kpi-unit'),sno=row.getAttribute('data-kpi-sno');
        window.__sunblissKpiReturnContext={
          kind:kind,
          scrollY:window.scrollY||0
        };
        if(typeof window.goToDetail==='function'){
          goToDetail(unit,sno,'overview');
        }
      });
    });
    if(options.restoreScroll!==undefined&&options.restoreScroll!==null){
      var restoreY=Math.max(0,Number(options.restoreScroll)||0);
      requestAnimationFrame(function(){window.scrollTo(0,restoreY);});
    }else{
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }

  window.renderOverviewKpiDrilldown=renderMetric;

  document.addEventListener('click',function(event){
    var target=event.target&&event.target.closest?event.target.closest('#sunblissPersistentBack'):null;
    if(!target||!window.state||state.view!=='detail')return;
    var ctx=window.__sunblissKpiReturnContext;
    if(!ctx||!ctx.kind)return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    window.__sunblissKpiReturnContext=null;
    renderMetric(ctx.kind,{restoreScroll:ctx.scrollY});
  },true);

  function metricTarget(target){
    if(!target||!target.closest)return null;
    var node=target.closest(
      '#btnUnitsSold,#btnSalesValue,#btnCollected,#btnOutstanding,'+
      '[data-proxy="btnUnitsSold"],[data-proxy="btnSalesValue"],[data-proxy="btnCollected"],[data-proxy="btnOutstanding"]'
    );
    if(!node)return null;
    var id=node.id||node.getAttribute('data-proxy');
    return KPI_IDS[id]||null;
  }

  document.addEventListener('click',function(event){
    var kind=metricTarget(event.target);
    if(!kind)return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    renderMetric(kind);
  },true);
})();