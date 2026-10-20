/* SPA gross installment projection for the SOA, preserving the historical cash
   and issued-credit ledger. Approved unissued credits are NOT treated as paid. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SunblissSoaSpaProjection=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const money=v=>Math.round((Number(v)||0)*100)/100;
 const id=s=>String(s&&((s.id!=null?s.id:s.scheduleId))||'');
 const iso=v=>String(v||'').slice(0,10);
 function project(legacyStages,model,opts){
   if(!Array.isArray(legacyStages)||!model||!Array.isArray(model.stages))throw Error('SOA SPA stages required');
   opts=opts||{};
   const byId=new Map(model.stages.map(s=>[String(s.id),s]));
   const originalIds=legacyStages.map(id);
   if(byId.size!==model.stages.length||legacyStages.length!==model.stages.length
      ||originalIds.some(s=>!byId.has(s))||new Set(originalIds).size!==originalIds.length)
     throw Error('SOA installment schedule does not match the signed SPA');
   const pendingIds=new Set((opts.pendingAccountsIds||[]).map(String));
   const date=iso(opts.asOfDate),tolerance=Number.isFinite(Number(opts.tolerance))?Number(opts.tolerance):0;
   const stages=legacyStages.map(s=>{
     const r=byId.get(id(s)),paid=money(s.paid),gross=money(r.gross);
     const pendingCredit=money(r.pendingNewCredit);
     const balance=Math.max(0,money(gross-paid));
     const cashDue=Math.max(0,money(balance-pendingCredit));
     const dueDate=iso(s.revisedDueDate||s.dueDate);
     let status;
     if(pendingIds.has(id(s)))status='Pending Accounts';
     else if(cashDue<=tolerance && balance>0.005 && pendingCredit>0)status='CN Pending';
     else if(cashDue<=tolerance)status='Paid';
     else if(dueDate && date && dueDate<date)status='Overdue';
     else if(paid>.005)status='Partial';
     else if(!dueDate && (s.code==='FIN'||/final|handover/i.test(String(s.label||''))))status='At Possession';
     else status='Upcoming';
     return {...s,due:gross,paid:paid,balance:balance,cashDue:cashDue,
       pendingCredit:pendingCredit,status:status};
   });
   const sum=k=>money(stages.reduce((acc,s)=>acc+money(s[k]),0));
   const gross=sum('due'),paid=sum('paid'),pending=sum('pendingCredit'),contractBalance=sum('balance'),cashDue=sum('cashDue');
   if(Math.abs(gross-money(model.spaPrice))>.01)throw Error('SOA gross installments do not total signed SPA price');
   if(Math.abs(pending-money(model.pendingNewCredit))>.01)throw Error('SOA approved credits do not reconcile');
   // Stage-paid amounts can differ from the transaction aggregate if customer
   // receipts are unallocated. Never assume a payment was cleared or invent it.
   const currentOverdue=money(stages.filter(s=>s.status==='Overdue').reduce((v,s)=>v+s.cashDue,0));
   return {stages,total:gross,paid,contractBalance,pendingCredits:pending,
     expectedCashOutstanding:cashDue,overdue:currentOverdue};
 }
 return {project};
});