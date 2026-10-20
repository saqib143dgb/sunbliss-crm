/* Pure, read-only decision model for per-installment SPA credit-note preparation.
   These readiness states NEVER issue a note, change an installment, or send email. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SunblissSpaCreditReadiness=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function n(v){const x=Number(v||0);if(!Number.isFinite(x))throw Error('Invalid financial amount');return Math.round(x*100);}
  function inspect(allocations,schedules,transactions,creditNotes){
    if(!Array.isArray(allocations)||!Array.isArray(schedules)||!Array.isArray(transactions))
      throw Error('Credit readiness requires verified schedules and payment confirmations');
    const notes=creditNotes||[];
    const cents=v=>n(v);
    const byId=new Map(schedules.map(s=>[String(s.id),s]));
    const stages=new Set(),usedNoteIds=new Set();
    const second=byId.get('1205');
    const sumConfirmed=sid=>transactions.filter(t=>String(t.payment_schedule_id)===String(sid)
       &&String(t.accounts_confirmation_status||'').toLowerCase()==='confirmed')
       .reduce((sum,t)=>sum+cents(t.amount),0);
    const amountOfNotes=sid=>notes.filter(x=>String(x.payment_schedule_id)===String(sid))
       .reduce((sum,x)=>sum+cents(x.amount),0);
    return allocations.filter(a=>a.status!=='cancelled').map(a=>{
      const sid=String(a.payment_schedule_id);
      if(stages.has(sid))throw Error('Duplicate approved credit allocation for stage '+sid);
      stages.add(sid);
      const s=byId.get(sid);
      if(!s||Number(s.unit_id)!==Number(a.unit_id))throw Error('Invalid installment linked to SPA credit allocation');
      const approved=cents(a.approved_amount),gross=cents(a.spa_gross_amount);
      if(approved<=0||gross<=0||approved>gross)throw Error('Invalid approved supplementary credit amount');
      const issued=a.status==='issued';
      if(issued){
        if(a.credit_note_id==null)throw Error('Issued allocation has no linked issued credit note');
        if(usedNoteIds.has(String(a.credit_note_id)))throw Error('Credit note linked twice');
        usedNoteIds.add(String(a.credit_note_id));
      }
      const scheduleDue=cents(s.due_amount),existingNotes=amountOfNotes(sid);
      const ledgerAligned=scheduleDue===gross;
      const canReconcileAtomically=s.revised_due_amount==null&&scheduleDue+approved===gross;
      const cashRequired=Math.max(0,scheduleDue-existingNotes);
      const recorded=cents(s.paid_amount||0);
      const confirmed=sumConfirmed(sid);
      let clearance='not_required';
      if(a.clearance_schedule_id!=null&&Number(a.clearance_schedule_id)!==1205)
        throw Error('Second-installment clearance requirement points to an invalid installment');
      if(a.clearance_schedule_id!=null||/^(Down Payment|1st Installment|2nd Installment)$/i.test(s.stage_name)){
        if(!second||Number(second.unit_id)!==Number(a.unit_id)||second.stage_name!=='2nd Installment')
          throw Error('Second-installment clearance requirement points to an invalid installment');
        const needed=cents(second.due_amount);
        clearance=sumConfirmed(second.id)>=needed?'confirmed':'awaiting_accounts';
      }
      const match=notes.find(note=>String(note.id)===String(a.credit_note_id));
      if(issued&&(!match||String(match.payment_schedule_id)!==sid||cents(match.amount)!==approved))
        throw Error('Issued allocation has no matching posted credit note');
      const state=issued?'issued':
        !canReconcileAtomically?'ledger_preparation':
        recorded<cashRequired?'awaiting_stage_payment':
        confirmed<cashRequired||clearance==='awaiting_accounts'?'awaiting_accounts':
        'ready_for_manual_issuance';
      return {
        allocationId:Number(a.id),stageId:Number(s.id),stage:s.stage_name||'',
        approvedAmount:approved/100,state,clearance,ledgerAligned,
        canReconcileAtomically,issuedCreditNoteId:issued?Number(a.credit_note_id):null,
        canIssue:state==='ready_for_manual_issuance',
        reason:state==='issued'?'Issued credit note recorded':
          state==='ledger_preparation'?'SPA stage amounts need reconciliation review':
          state==='awaiting_stage_payment'?'Awaiting the installment payment':
          state==='awaiting_accounts'?'Awaiting Accounts confirmation':
          'Ready for controlled SPA gross adjustment and matching credit-note issuance'
      };
    });
  }
  return {inspect};
});