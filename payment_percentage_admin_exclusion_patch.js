(function(){
  'use strict';
  if(window.__sunblissAdminFeeNeutralPercentagesInstalled)return;
  window.__sunblissAdminFeeNeutralPercentagesInstalled=true;

  var ADMIN_FEE=5100;

  function num(v){var n=Number(v);return isFinite(n)?n:0;}
  function isDld(stage){
    if(!stage)return false;
    if(String(stage.code||'').toUpperCase()==='DLD')return true;
    return /dld/i.test(String(stage.label||stage.stage_name||''));
  }
  function stageDue(stage){return Math.max(0,num(stage&&stage.due));}
  function stageSettled(stage){
    if(!stage)return 0;
    var v=stage.settledAmount!==undefined?stage.settledAmount:stage.paid;
    return Math.max(0,num(v));
  }
  function eligibleDue(stage){
    var due=stageDue(stage);
    return isDld(stage)?Math.max(0,due-ADMIN_FEE):due;
  }
  function eligibleSettled(stage){
    var cap=eligibleDue(stage);
    return Math.min(stageSettled(stage),cap);
  }
  function eligibleCollected(customer){
    if(!customer||!Array.isArray(customer.stages))return Math.max(0,num(customer&&customer.received));
    return customer.stages.reduce(function(sum,stage){return sum+eligibleSettled(stage);},0);
  }
  function progressPct(customer){
    var total=Math.max(0,num(customer&&customer.total));
    if(total<=0)return 0;
    return Math.max(0,Math.min(100,Math.round(eligibleCollected(customer)/total*1000)/10));
  }
  function formatPct(v){
    var n=Math.round(num(v)*10)/10;
    return String(Math.abs(n-Math.round(n))<0.0001?Math.round(n):n);
  }
  function personKey(v){
    if(typeof window.normPersonName==='function')return window.normPersonName(v||'');
    return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  }
  function companyKey(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
  function aggregatePct(customers){
    var total=0,eligible=0;
    (customers||[]).forEach(function(c){total+=Math.max(0,num(c&&c.total));eligible+=eligibleCollected(c);});
    return total>0?Math.max(0,Math.min(100,Math.round(eligible/total*1000)/10)):0;
  }
  function currentCustomer(){
    if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
    return state.dues.find(function(c){return c&&(String(c.unit)+'::'+String(c.sno))===String(state.selectedUnit);})||null;
  }

  window.__sunblissPaymentPercentageRules={
    adminFee:ADMIN_FEE,
    eligibleDue:eligibleDue,
    eligibleSettled:eligibleSettled,
    eligibleCollected:eligibleCollected,
    progressPct:progressPct,
    aggregatePct:aggregatePct
  };

  if(typeof window.portfolioStats==='function'&&!window.__sunblissAdminNeutralPortfolioWrapped){
    var previousPortfolioStats=window.portfolioStats;
    window.portfolioStats=function(){
      var result=previousPortfolioStats.apply(this,arguments);
      var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
      var total=customers.reduce(function(sum,c){return sum+Math.max(0,num(c&&c.total));},0);
      var eligible=customers.reduce(function(sum,c){return sum+eligibleCollected(c);},0);
      if(total>0){
        result.collectedPct=Math.max(0,Math.min(100,Math.round(eligible/total*1000)/10));
        result.outstandingPct=Math.max(0,Math.min(100,Math.round((total-Math.min(total,eligible))/total*1000)/10));
      }
      return result;
    };
    window.__sunblissAdminNeutralPortfolioWrapped=true;
  }

  if(typeof window.brokerPerformance==='function'&&!window.__sunblissAdminNeutralBrokerWrapped){
    var previousBrokerPerformance=window.brokerPerformance;
    window.brokerPerformance=function(){
      var result=previousBrokerPerformance.apply(this,arguments);
      var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
      (result.brokers||[]).forEach(function(b){
        var bk=personKey(b.name),ck=companyKey(b.company),matches=customers.filter(function(c){
          if(!c||!c.info||personKey(c.info.brokerName)!==bk)return false;
          return !ck||companyKey(c.info.brokerCompany)===ck;
        });
        b.pct=aggregatePct(matches);
      });
      return result;
    };
    window.__sunblissAdminNeutralBrokerWrapped=true;
  }

  if(typeof window.rmPerformance==='function'&&!window.__sunblissAdminNeutralRmWrapped){
    var previousRmPerformance=window.rmPerformance;
    window.rmPerformance=function(){
      var result=previousRmPerformance.apply(this,arguments);
      var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
      (result.rms||[]).forEach(function(r){
        var rk=personKey(r.name);
        r.pct=aggregatePct(customers.filter(function(c){return c&&c.info&&personKey(c.info.soldBy)===rk;}));
      });
      return result;
    };
    window.__sunblissAdminNeutralRmWrapped=true;
  }

  if(typeof window.dldFeeTracker==='function'&&!window.__sunblissAdminNeutralDldWrapped){
    var previousDldFeeTracker=window.dldFeeTracker;
    window.dldFeeTracker=function(){
      var result=previousDldFeeTracker.apply(this,arguments),due=0,settled=0;
      var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
      customers.forEach(function(c){
        var stage=(c.stages||[]).find(function(s){return isDld(s);});
        if(!stage||stage.due===null||stage.due===undefined)return;
        due+=eligibleDue(stage);settled+=eligibleSettled(stage);
      });
      result.collectedPct=due>0?Math.max(0,Math.min(100,Math.round(settled/due*1000)/10)):0;
      return result;
    };
    window.__sunblissAdminNeutralDldWrapped=true;
  }

  if(typeof window.svgStageRateChart==='function'&&!window.__sunblissAdminNeutralStageChartWrapped){
    var previousSvgStageRateChart=window.svgStageRateChart;
    window.svgStageRateChart=function(rows,options){
      var copy=(rows||[]).map(function(row){var x={};Object.keys(row||{}).forEach(function(k){x[k]=row[k];});return x;});
      copy.forEach(function(row){
        if(!/dld/i.test(String(row.label||'')))return;
        var due=0,settled=0;
        var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
        customers.forEach(function(c){
          var stage=(c.stages||[]).find(function(s){return isDld(s);});
          if(!stage||stage.due===null||stage.due===undefined)return;
          due+=eligibleDue(stage);settled+=eligibleSettled(stage);
        });
        row.due=due;row.received=settled;
      });
      return previousSvgStageRateChart.call(this,copy,options);
    };
    window.__sunblissAdminNeutralStageChartWrapped=true;
  }

  if(typeof window.buildCustomerStatementHTML==='function'&&!window.__sunblissAdminNeutralLegacyStatementWrapped){
    var previousBuildCustomerStatementHTML=window.buildCustomerStatementHTML;
    window.buildCustomerStatementHTML=function(customer){
      var result=previousBuildCustomerStatementHTML.apply(this,arguments),pct=formatPct(progressPct(customer))+'%';
      if(result&&typeof result.body==='string'){
        result.body=result.body.replace(/(<p class="print-summary-label">Paid<\/p><p class="print-summary-value">)[^<]*(<\/p>)/i,'$1'+pct+'$2');
      }
      return result;
    };
    window.__sunblissAdminNeutralLegacyStatementWrapped=true;
  }

  function fixCustomerProgress(){
    var c=currentCustomer(),box=document.querySelector('.detail .cust-progress');
    if(!c||!box)return;
    var pct=progressPct(c),remaining=Math.round((100-pct)*10)/10,fill=box.querySelector('.bar-fill'),nums=box.querySelectorAll('.bar-caption b');
    if(fill&&fill.style.width!==pct+'%')fill.style.width=pct+'%';
    if(nums[0]&&nums[0].textContent!==formatPct(pct)+'%')nums[0].textContent=formatPct(pct)+'%';
    if(nums[1]&&nums[1].textContent!==formatPct(remaining)+'%')nums[1].textContent=formatPct(remaining)+'%';
  }

  if(typeof window.renderDetail==='function'&&!window.__sunblissAdminNeutralDetailWrapped){
    var previousRenderDetail=window.renderDetail;
    window.renderDetail=function(){
      var result=previousRenderDetail.apply(this,arguments);
      fixCustomerProgress();
      return result;
    };
    window.__sunblissAdminNeutralDetailWrapped=true;
  }

  function fixProfessionalStatement(){
    var statement=document.querySelector('#printArea .professional-payment-statement'),c=currentCustomer();
    if(!statement||!c)return;
    var pct=progressPct(c),value=statement.querySelector('.ps-card-paid .ps-card-value'),fill=statement.querySelector('.ps-card-paid .ps-progress span');
    if(value&&value.textContent!==formatPct(pct)+'%')value.textContent=formatPct(pct)+'%';
    if(fill&&fill.style.width!==pct+'%')fill.style.width=pct+'%';
  }

  function fixPeopleDetail(){
    var customers=window.state&&Array.isArray(state.dues)?state.dues:[];
    var brokerPage=document.querySelector('.broker-detail-page');
    if(brokerPage){
      var brokerName=brokerPage.querySelector('.broker-detail-name'),cells=brokerPage.querySelectorAll('.broker-detail-summary .stat-cell');
      if(brokerName&&cells.length>=3){
        var key=personKey(brokerName.textContent),pct=aggregatePct(customers.filter(function(c){return c&&c.info&&personKey(c.info.brokerName)===key;})),sub=cells[2].querySelector('.stat-sub'),text=formatPct(pct)+'% collected';
        if(sub&&sub.textContent!==text)sub.textContent=text;
      }
    }
    var rmPage=document.querySelector('.rm-detail-page');
    if(rmPage){
      var rmName=rmPage.querySelector('.rm-detail-name'),rmCells=rmPage.querySelectorAll('.rm-detail-summary .stat-cell');
      if(rmName&&rmCells.length>=3){
        var rmKey=personKey(rmName.textContent),rmPct=aggregatePct(customers.filter(function(c){return c&&c.info&&personKey(c.info.soldBy)===rmKey;})),rmSub=rmCells[2].querySelector('.stat-sub'),rmText=formatPct(rmPct)+'% collected';
        if(rmSub&&rmSub.textContent!==rmText)rmSub.textContent=rmText;
      }
    }
  }

  var scheduled=false;
  function scheduleFixes(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(function(){scheduled=false;fixCustomerProgress();fixProfessionalStatement();fixPeopleDetail();});
  }
  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    var observer=new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].type==='childList'){scheduleFixes();break;}
      }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
  var printArea=document.getElementById('printArea');
  if(printArea&&window.MutationObserver){
    var printObserver=new MutationObserver(function(){scheduleFixes();});
    printObserver.observe(printArea,{childList:true,subtree:true});
  }
  document.addEventListener('click',function(e){
    var target=e.target&&e.target.closest?e.target.closest('#btnPrintStatement'):null;
    if(target){setTimeout(fixProfessionalStatement,0);setTimeout(fixProfessionalStatement,20);}
  },true);

  scheduleFixes();
})();
