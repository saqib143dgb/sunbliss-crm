/* Shared, read-only SPA reconciliation loading for CRM documents and reports.
   It never changes payment rows, amounts, issued credit notes or task statuses. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./price_revision_core.js'),require('./spa_credit_issuance_readiness.js'));
 else root.SunblissSpaReconciliation=factory(root.SunblissPriceRevision,root.SunblissSpaCreditReadiness);
})(typeof globalThis!=='undefined'?globalThis:this,function(Model,Readiness){
 'use strict';
 if(!Model)throw Error('SPA price revision model must load first');
 const number=v=>Number(v||0);
 const round=v=>Math.round(number(v)*100)/100;
 const sum=(rows,f)=>round((rows||[]).reduce((v,r)=>v+number(f(r)),0));
 const normalize=x=>String(x||'').trim().toLowerCase();
 const isFee=x=>/\bdld\b|admin fees/i.test(String(x||''));
 const rank=x=>{
   const s=normalize(x);
   if(/down payment/.test(s))return 0;
   if(/final|handover/.test(s))return 99;
   const m=s.match(/\b(\d+)(st|nd|rd|th)\b/);
   return m?Number(m[1]):80;
 };
 async function data(query,msg){const r=await query;if(r.error)throw Error(msg+': '+r.error.message);return r.data||[];}
 async function loadForUnit(sb,unitId){
   if(!sb||!Number.isSafeInteger(Number(unitId)))throw Error('Unit and CRM connection required');
   const id=Number(unitId);
   const revision=await data(sb.from('spa_price_revisions').select('*').eq('unit_id',id).eq('is_current',true).limit(1),'Read signed SPA revision');
   const rev=revision[0];
   if(!rev)return null;
   if(rev.status!=='executed')throw Error('Current SPA revision is not executed');
   const [allocations,schedules,notes,transactions]=await Promise.all([
     data(sb.from('spa_credit_allocations').select('*').eq('revision_id',rev.id),'Read approved SPA credits'),
     data(sb.from('payment_schedule').select('id,unit_id,stage_name,due_amount,revised_due_amount,paid_amount,due_date,revised_due_date').eq('unit_id',id),'Read payment schedule'),
     data(sb.from('credit_notes').select('id,unit_id,payment_schedule_id,amount,issue_date').eq('unit_id',id),'Read issued credit notes'),
     data(sb.from('payment_transactions').select('id,payment_schedule_id,amount,accounts_confirmation_status').eq('unit_id',id),'Read payment confirmations')
   ]);
   const active=allocations.filter(x=>x.status!=='cancelled');
   if(!active.length)throw Error('Signed SPA requires installment-level approval records');
   const schedulesById=new Map(schedules.map(s=>[String(s.id),s]));
   const linkedIds=new Set(active.filter(a=>a.credit_note_id!=null).map(a=>String(a.credit_note_id)));
   const rows=active.map(a=>{
     const s=schedulesById.get(String(a.payment_schedule_id));
     if(!s)throw Error('SPA allocation references an unrelated payment installment');
     if(number(s.unit_id)!==id||number(a.unit_id)!==id)throw Error('SPA allocation unit mismatch');
     const issuedCredit=sum(notes.filter(n=>String(n.payment_schedule_id)===String(s.id)&&!linkedIds.has(String(n.id))),n=>n.amount);
     return {
       id:s.id,label:s.stage_name,grossAmount:number(a.spa_gross_amount),
       cashPaid:number(s.paid_amount),existingIssuedCredit:issuedCredit,
       approvedNewCredit:number(a.approved_amount),
       newIssuedCredit:a.status==='issued'?number(a.approved_amount):0,
       allocationStatus:a.status,
       legacyDue:number(s.revised_due_amount==null?s.due_amount:s.revised_due_amount),
       effectiveDate:s.revised_due_date||s.due_date||null
     };
   }).sort((a,b)=>rank(a.label)-rank(b.label)||number(a.id)-number(b.id));
   if(new Set(rows.map(r=>String(r.id))).size!==rows.length)throw Error('Duplicate installment allocations');
   const model=Model.summarize({spaPrice:number(rev.spa_price),commercialPrice:number(rev.commercial_price_snapshot),stages:rows});
   const legacyMatch=rows.every(r=>Math.abs(round(r.legacyDue-r.existingIssuedCredit)-
     round(r.grossAmount-r.existingIssuedCredit-r.approvedNewCredit))<=.01);
   // For non-issued approvals only: current legacy balances must reconcile
   // exactly. If this invariant fails, never make an official financial claim.
   if(rows.every(r=>!r.newIssuedCredit)&&!legacyMatch)throw Error('SPA credits do not reconcile with recorded installment cash obligations');
   const fees=schedules.filter(s=>isFee(s.stage_name));
   const feeNotes=notes.filter(n=>fees.some(s=>String(s.id)===String(n.payment_schedule_id)));
   const paidDld=sum(fees,s=>s.paid_amount),issuedDld=sum(feeNotes,n=>n.amount);
   const dld=Model.dld({
     spaPrice:number(rev.spa_price),ratePercent:number(rev.dld_rate_percent),
     adminFees:number(rev.dld_admin_fees),cashPaid:paidDld,existingIssuedCredit:issuedDld
   });
   const propertyIds=new Set(rows.map(x=>String(x.id)));
   const pendingAccounts=sum(transactions.filter(t=>propertyIds.has(String(t.payment_schedule_id)) &&
     normalize(t.accounts_confirmation_status)!=='confirmed'),t=>t.amount);
   const approval=String(rev.approval_reference||'');
   const clearance=rows.filter(row=>active.some(a=>String(a.payment_schedule_id)===String(row.id)&&a.clearance_schedule_id!=null))
     .every(row=>active.filter(a=>String(a.payment_schedule_id)===String(row.id)&&a.clearance_schedule_id!=null).every(a=>{
       const schedule=schedulesById.get(String(a.clearance_schedule_id));
       if(!schedule)return false;
       const confirmed=sum(transactions.filter(t=>String(t.payment_schedule_id)===String(schedule.id)
         && normalize(t.accounts_confirmation_status)==='confirmed'),t=>t.amount);
       return confirmed>=number(schedule.due_amount)-.01;
     }));
   const issuanceReadiness=Readiness?Readiness.inspect(active,schedules,transactions):[];
   return {unitId:id,revisionId:rev.id,signedSpa:number(rev.spa_price),
     signedOn:rev.signed_on||null,commercialPrice:number(rev.commercial_price_snapshot),
     approvalReference:approval,
     rows:rows,model:model,dld:dld,pendingAccounts:pendingAccounts,
     contingentCreditsClearanceConfirmed:clearance,legacyMatchesApprovedNet:legacyMatch,
     issuanceReadiness:issuanceReadiness,readOnly:true};
 }
 return {loadForUnit};
});