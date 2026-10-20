/* Pure financial model; no database writes or side effects. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SunblissPriceRevision=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function cents(value,label){
    var x=Number(value);
    if(!Number.isFinite(x)||x<0||Math.abs(x*100-Math.round(x*100))>0.00001)
      throw new Error((label||'Amount')+' must be a nonnegative AED amount with at most two decimals');
    return Math.round(x*100);
  }
  function amount(c){return c/100;}
  function summarize(input){
    if(!input||!Array.isArray(input.stages)||!input.stages.length)throw Error('Stages required');
    var spa=cents(input.spaPrice,'SPA price'),commercial=cents(input.commercialPrice,'Commercial price');
    var explicit=input.stages.every(function(s){return s.grossAmount!==undefined&&s.grossAmount!==null;});
    var weights=input.stages.map(function(stage){return Number(stage.sharePercent);});
    if(!explicit&&(weights.some(function(n){return !Number.isFinite(n)||n<=0;})||
       Math.abs(weights.reduce(function(a,b){return a+b;},0)-100)>0.000001))
      throw Error('Installment percentages must total 100');
    if(explicit && input.stages.reduce(function(total,s){return total+cents(s.grossAmount,'Gross amount');},0)!==spa)
      throw Error('Gross installment amounts must sum to signed SPA price');
    var grossRunning=0,seen=new Set();
    var rows=input.stages.map(function(s,i){
      if(s.id==null||seen.has(String(s.id)))throw Error('Every installment needs a unique ID');
      seen.add(String(s.id));
      var gross=explicit?cents(s.grossAmount,'Gross amount'):(i===input.stages.length-1?spa-grossRunning:Math.round(spa*weights[i]/100));
      grossRunning+=gross;
      var existing=cents(s.existingIssuedCredit||0,'Existing credit');
      var newApproved=cents(s.approvedNewCredit||0,'Approved credit');
      var newIssued=cents(s.newIssuedCredit||0,'Issued supplemental credit');
      var paid=cents(s.cashPaid||0,'Cash paid');
      if(newIssued>newApproved)throw Error('Issued supplemental credit exceeds approval for '+s.id);
      if(existing+newApproved>gross)throw Error('Credits exceed gross installment for '+s.id);
      var pending=newApproved-newIssued;
      return {
        id:s.id,label:s.label||String(s.id),sharePercent:Number.isFinite(weights[i])?weights[i]:null,
        gross:amount(gross),existingIssuedCredit:amount(existing),
        approvedNewCredit:amount(newApproved),newIssuedCredit:amount(newIssued),
        pendingNewCredit:amount(pending),cashPaid:amount(paid),
        customerCashObligation:amount(gross-existing-newApproved),
        expectedCashOutstanding:amount(Math.max(0,gross-existing-newApproved-paid)),
        accountingOutstanding:amount(Math.max(0,gross-existing-newIssued-paid))
      };
    });
    var sum=function(field){return Math.round(rows.reduce(function(n,r){return n+cents(r[field],field);},0));};
    var issued=sum('existingIssuedCredit')+sum('newIssuedCredit');
    var expectedCredit=sum('existingIssuedCredit')+sum('approvedNewCredit');
    return {
      spaPrice:amount(spa),commercialPrice:amount(commercial),
      approvedPriceCredit:amount(spa-commercial),
      existingIssuedCredit:amount(sum('existingIssuedCredit')),
      additionalApprovedCredit:amount(sum('approvedNewCredit')),
      additionalIssuedCredit:amount(sum('newIssuedCredit')),
      pendingNewCredit:amount(sum('pendingNewCredit')),
      totalIssuedCredit:amount(issued),totalAuthorizedCredit:amount(expectedCredit),
      cashPaid:amount(sum('cashPaid')),
      totalCashObligation:amount(spa-expectedCredit),
      expectedCashOutstanding:amount(sum('expectedCashOutstanding')),
      accountingOutstanding:amount(sum('accountingOutstanding')),
      stages:rows
    };
  }
  function dld(input){
    if(!input)throw Error('DLD inputs required');
    var spa=cents(input.spaPrice,'SPA price'),rate=Number(input.ratePercent);
    if(!Number.isFinite(rate)||rate<0)throw Error('Invalid DLD percentage');
    var dldAmount=Math.round(spa*rate/100);
    var admin=cents(input.adminFees||0,'Admin fees'),
        cash=cents(input.cashPaid||0,'DLD cash'),
        issued=cents(input.existingIssuedCredit||0,'DLD credit');
    return {dldAmount:amount(dldAmount),adminFees:amount(admin),
      totalObligation:amount(dldAmount+admin),
      cashPaid:amount(cash),existingIssuedCredit:amount(issued),
      additionalCashDue:amount(Math.max(0,dldAmount+admin-cash-issued))};
  }
  return {summarize:summarize,dld:dld};
});
