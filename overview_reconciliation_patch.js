(function(){
  'use strict';
  if(window.__sunblissSalesReconciliation)return;
  function n(v){var x=Number(v);return Number.isFinite(x)?x:0;}
  function cents(v){return Math.round(n(v)*100);}
  function isFee(s){return String(s.code||'').toUpperCase()==='DLD'||/\bdld\b|admin\s*fees?/i.test(String(s.label||s.stage_name||''));}
  function creditFor(c){
    if(c.dldAdminSeparated)return cents(c.creditNoteTotal)/100;
    if(Array.isArray(c.stages))return c.stages.reduce(function(sum,s){return sum+(isFee(s)?0:cents(s.creditNoteTotal));},0)/100;
    return Math.max(0,cents(c.creditNoteTotal)-cents(c.dldAdminCreditNoteTotal))/100;
  }
  function calculate(stats,customers){
    var sales=cents(stats.totalSales),cash=cents(stats.totalReceived),outstanding=Math.abs(cents(stats.totalOutstanding));
    var credits=(customers||[]).reduce(function(sum,c){return sum+cents(creditFor(c));},0);
    var values=[cash,credits,outstanding],difference=sales-cash-credits-outstanding;
    var raw=values.map(function(v){return sales>0?v/sales*1000:0;});
    var tenths=raw.map(Math.round);
    // Distribute only rounding tenths, never hide a real reconciliation difference.
    if(sales>0&&difference===0&&values.every(function(v){return v>=0;})){
      tenths=raw.map(Math.floor);
      var order=[0,1,2].sort(function(a,b){return (raw[b]-tenths[b])-(raw[a]-tenths[a])||a-b;});
      var left=1000-tenths.reduce(function(a,b){return a+b;},0);
      for(var i=0;i<left;i++)tenths[order[i%3]]++;
    }
    return {sales:sales/100,cash:cash/100,credits:credits/100,outstanding:outstanding/100,difference:difference/100,
      percentages:tenths.map(function(v){return v/10;}),widths:raw.map(function(v){return Math.max(0,Math.min(100,v/10));})};
  }
  function money(v){return 'AED '+n(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function markup(r){
    var labels=['Collected','Credit notes','Outstanding'];
    var html='<button type="button" class="sbx-credit-summary" data-proxy="btnCreditNotes"><span>Credit notes applied</span><strong>'+money(r.credits)+'</strong></button>'+
      '<div class="sbx-reconciliation-bar" role="img" aria-label="'+labels.map(function(label,i){return label+' '+r.percentages[i].toFixed(1)+' percent';}).join(', ')+'">';
    r.widths.forEach(function(width,i){html+='<span class="sbx-reconciliation-segment segment-'+i+'" style="width:'+width+'%"></span>';});
    html+='</div><div class="sbx-reconciliation-legend">';
    labels.forEach(function(label,i){html+='<span><i class="segment-'+i+'"></i><b>'+r.percentages[i].toFixed(1)+'%</b> '+label+'</span>';});
    html+='</div><details class="sbx-reconciliation-details"><summary>View exact amounts</summary><table aria-label="Sales reconciliation"><tbody>';
    [['Cash collected',r.cash],['Credit notes applied',r.credits],['Outstanding',r.outstanding],['Sales value',r.sales]].forEach(function(row){html+='<tr><th scope="row">'+row[0]+'</th><td>'+money(row[1])+'</td></tr>';});
    if(Math.abs(r.difference)>=0.01)html+='<tr class="sbx-reconciliation-difference"><th scope="row">Difference to review</th><td>'+money(r.difference)+'</td></tr>';
    return html+'</tbody></table><p>Property amounts only. DLD and admin fees are separate.</p></details>';
  }
  window.__sunblissSalesReconciliation={calculate:calculate,creditFor:creditFor};
  function styles(){
    if(document.getElementById('sbxReconciliationStyle'))return;
    var s=document.createElement('style');s.id='sbxReconciliationStyle';s.textContent=`
      .sbx-sales-reconciliation{color:var(--ink);font-family:Inter,Arial,sans-serif;min-width:0;box-sizing:border-box}
      #sbRefOverviewV2>.sbx-sales-reconciliation{margin:12px 0;padding:16px 20px;border:1px solid var(--paper-line);border-radius:12px;background:var(--paper)}
      .sbx-credit-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:0 0 14px;border:0;background:transparent;color:var(--ink);font:500 12px/1.5 Inter,Arial,sans-serif;text-align:left;cursor:pointer}
      .sbx-credit-summary strong{font-weight:650;color:var(--gold-deep,#906b25);white-space:nowrap;font-variant-numeric:tabular-nums}
      .sbx-credit-summary:focus-visible{outline:2px solid var(--gold-deep);outline-offset:4px}
      .sbx-reconciliation-bar{height:9px;width:100%;display:flex;overflow:hidden;border-radius:99px;background:var(--paper-dim)}
      .sbx-reconciliation-segment{height:100%;display:block;flex-shrink:0}
      .segment-0{background:var(--sage,#44785d)}.segment-1{background:var(--gold,#c6972e)}.segment-2{background:#ead6ce}
      .sbx-reconciliation-legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 14px;margin-top:10px;font:500 11px/1.45 Inter,Arial,sans-serif;color:var(--muted)}
      .sbx-reconciliation-legend span{white-space:nowrap}.sbx-reconciliation-legend b{font-weight:650;color:var(--ink)}
      .sbx-reconciliation-legend i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:middle}
      .sbx-reconciliation-details{margin-top:14px;font:500 11px/1.5 Inter,Arial,sans-serif}
      .sbx-reconciliation-details summary{cursor:pointer;color:var(--muted)}
      .sbx-reconciliation-details table{width:100%;border-collapse:collapse;margin-top:9px;font:500 11px/1.5 Inter,Arial,sans-serif}
      .sbx-reconciliation-details th{font-weight:500;text-align:left}.sbx-reconciliation-details td{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
      .sbx-reconciliation-details th,.sbx-reconciliation-details td{padding:7px 0;border-bottom:1px solid var(--paper-line)}
      .sbx-reconciliation-details tr:last-child th,.sbx-reconciliation-details tr:last-child td{font-weight:650}
      .sbx-reconciliation-details p{margin:8px 0 0;color:var(--muted);font-size:10px}
      .sbx-reconciliation-difference{color:var(--rust)}
      @media(max-width:420px){.sbx-credit-summary{font-size:11px}.sbx-reconciliation-legend{font-size:10px;gap:7px}.sbx-reconciliation-details table{font-size:10px}}
    `;document.head.appendChild(s);
  }
  var queued=false;
  function apply(){
    queued=false;
    if(!window.state||state.view!=='overview'||!Array.isArray(state.dues)||typeof window.portfolioStats!=='function')return;
    var desktop=window.matchMedia('(min-width:1024px)').matches;
    var root=desktop?document.getElementById('sbRefOverviewV2'):document.querySelector('.overview > .stat-hero');
    if(!root)return;
    var host=desktop?root.querySelector(':scope > .sbx-sales-reconciliation'):root.querySelector('.stat-cell.wide');
    if(!host&&desktop){var cards=root.querySelector('.sb-v2-kpis');if(!cards)return;host=document.createElement('section');host.className='sbx-sales-reconciliation';cards.insertAdjacentElement('afterend',host);}
    if(!host)return;
    var stats=window.portfolioStats(),r=calculate(stats,state.dues),signature=JSON.stringify(r);
    if(host.dataset.reconciliation===signature)return;
    host.classList.add('sbx-sales-reconciliation');
    var wasOpen=!!host.querySelector('details[open]');host.innerHTML=markup(r);host.dataset.reconciliation=signature;
    if(wasOpen)host.querySelector('details').open=true;
  }
  function queue(){if(!queued){queued=true;requestAnimationFrame(apply);}}
  function install(){
    if(typeof window.portfolioStats!=='function'){setTimeout(install,50);return;}
    var base=window.portfolioStats;
    window.portfolioStats=function(){var k=base.apply(this,arguments),r=calculate(k,(window.state&&state.dues)||[]);k.totalCreditNotes=r.credits;k.creditNotesPct=r.percentages[1];k.collectedPct=r.percentages[0];k.outstandingPct=r.percentages[2];k.reconciliationDifference=r.difference;return k;};
    styles();
    var render=window.renderOverview;
    if(typeof render==='function')window.renderOverview=function(){var out=render.apply(this,arguments);queue();return out;};
    new MutationObserver(queue).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.addEventListener('resize',queue);window.addEventListener('pageshow',queue);queue();
  }
  install();
})();
