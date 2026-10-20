/* Pure, read-only decision model for per-installment SPA credit-note preparation.
   These readiness states NEVER issue a note, change an installment, or send email. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SunblissSpaCreditReadiness=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function n(v){const x=Number(v||0);if(!Number.isFinite(x))throw Error('Invalid financial amount');return Math.round(x*100);}
  function inspect(allocations,schedules,transactions){
    if(!Array.isArray(allocations)||!Array.isArray(schedules)||!Array.isArray(transactions))
      throw Error('Credit readiness requires verified schedules and payment confirmations');
    const byId=new Map(schedules.map(s=>[String(s.id),s]));
    const noteIds=new Set(),stageIds=new Set();
    return allocations.filter(a=>a.status!=='cancelled').map(a=>{
      const sid=String(a.payment_schedule_id);
      if(stageIds.has(sid))throw Error('Duplicate approved credit allocation for stage '+sid);
      stageIds.add(sid);
      const s=byId.get(sid);
      if(!s||Number(s.unit_id)!==Number(a.unit_id))throw Error('Invalid installment linked to SPA credit allocation');
      const approved=n(a.approved_amount),gross=n(a.spa_gross_amount);
      if(approved<=0||gross<=0||approved>gross)throw Error('Invalid approved supplementary credit amount');
      let clearance='not_required';
      if(a.clearance_schedule_id!=null){
        const required=byId.get(String(a.clearance_schedule_id));
        if(!required||Number(required.unit_id)!==Number(a.unit_id))
          throw Error('Accounts clearance requirement points to an invalid installment');
        // The ledger is the authority for Accounts confirmation. Recorded cash
        // or a customer payment slip is NOT Accounts confirmation.
        const confirmed=transactions.filter(t=>String(t.payment_schedule_id)===String(required.id)
          &&String(t.accounts_confirmation_status||'').toLowerCase()==='confirmed')
          .reduce((v,t)=>v+n(t.amount),0);
        const applicable=allocations.find(row=>row.status!=='cancelled'&&String(row.payment_schedule_id)===String(required.id));
        const approvedNet=applicable?n(applicable.spa_gross_amount)-n(applicable.approved_amount):n(required.due_amount);
        const necessary=Math.min(n(required.due_amount),approvedNet);
        clearance=confirmed>=necessary?'confirmed':'awaiting_accounts';
      }
      const issued=a.status==='issued';
      if(issued){
        if(a.credit_note_id==null)throw Error('Issued allocation has no linked issued credit note');
        if(noteIds.has(String(a.credit_note_id)))throw Error('Credit note linked twice');
        noteIds.add(String(a.credit_note_id));
      }
      const ledgerAligned=Math.abs(n(s.due_amount)-gross)<=1;
      // Never enable issuance merely because approval is present. The existing
      // schedule must first be reconciled to SPA gross so posting does not
      // double-reduce the amount the customer actually owes.
      const state=issued?'issued':clearance==='awaiting_accounts'?'awaiting_accounts'
        :!ledgerAligned?'ledger_preparation':'ready_for_manual_issuance';
      return {
        allocationId:Number(a.id),stageId:Number(s.id),
        stage:s.stage_name||'',approvedAmount:approved/100,
        state,clearance,ledgerAligned,
        issuedCreditNoteId:issued?Number(a.credit_note_id):null,
        canIssue:state==='ready_for_manual_issuance',
        reason:state==='issued'?'Issued credit note recorded':
          state==='awaiting_accounts'?'Awaiting Accounts confirmation of the 2nd installment':
          state==='ledger_preparation'?'SPA gross schedule reconciliation required before issuance':
          'Eligible for individual issuance through verified credit-note procedure'
      };
    });
  }
  return {inspect};
});