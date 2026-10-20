-- Contractual SPA gross schedule alignment without premature credit-note posting.
-- Gross contract amounts are stored in due_amount. While the corresponding
-- approved note is unissued, revised_due_amount protects the historically agreed
-- net collectible ledger amount; issued notes are never simulated as payments.
begin;
create table if not exists public.spa_gross_schedule_alignment_audit (
 id bigint generated always as identity primary key,
 unit_id bigint not null references public.units(id) on delete restrict,
 schedule_id bigint not null unique references public.payment_schedule(id) on delete restrict,
 allocation_id bigint not null unique references public.spa_credit_allocations(id) on delete restrict,
 original_due numeric(14,2) not null,
 signed_spa_due numeric(14,2) not null,
 protected_collectible_due numeric(14,2) not null,
 approved_pending_credit numeric(14,2) not null,
 original_status text,
 updated_status text,
 approval_reference text not null,
 created_at timestamptz not null default now(),
 constraint spa_gross_schedule_alignment_math check (
  original_due = protected_collectible_due
  and signed_spa_due = original_due + approved_pending_credit
 )
);
alter table public.spa_gross_schedule_alignment_audit enable row level security;
revoke all on public.spa_gross_schedule_alignment_audit from anon,authenticated;
grant select on public.spa_gross_schedule_alignment_audit to authenticated;
drop policy if exists "approved CRM reads SPA gross alignment audit" on public.spa_gross_schedule_alignment_audit;
create policy "approved CRM reads SPA gross alignment audit"
on public.spa_gross_schedule_alignment_audit for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text in ('crm_officer','manager'))
);
do $prep$
declare
 rec record;
 old_due numeric;
 old_status text;
 new_status text;
 v_allocation_count integer;
 v_old_total numeric;
 v_gross_total numeric;
 v_credit_total numeric;
 v_revision_id bigint;
begin
 select id into v_revision_id from public.spa_price_revisions
  where unit_id=467 and sale_id=47 and is_current and status='executed'
  and spa_price=2002000 and commercial_price_snapshot=1876000;
 if v_revision_id is null then
  raise exception 'Executed B2-703 signed SPA revision not verified.';
 end if;
 -- Explicitly require a fresh seven-stage, unissued allocation set.
 select count(*),coalesce(sum(approved_amount),0),coalesce(sum(spa_gross_amount),0)
 into v_allocation_count,v_credit_total,v_gross_total
 from public.spa_credit_allocations
 where revision_id=v_revision_id and unit_id=467 and status='approved_pending_issue' and credit_note_id is null;
 if v_allocation_count<>7 or v_credit_total<>59000 or v_gross_total<>2002000 then
   raise exception 'Cannot align SPA: seven pending allocations and exact signed totals are required.';
 end if;
 if exists(select 1 from public.spa_stage_credit_issue_audit where unit_id=467)
   or exists(select 1 from public.spa_gross_schedule_alignment_audit where unit_id=467) then
   raise exception 'SPA schedule already reconciled or credit note issued.';
 end if;
 select count(*),coalesce(sum(s.due_amount),0) into v_allocation_count,v_old_total
 from public.payment_schedule s join public.spa_credit_allocations a on a.payment_schedule_id=s.id
 where s.unit_id=467 and a.revision_id=v_revision_id and a.status='approved_pending_issue'
 and s.revised_due_amount is null and s.due_amount + a.approved_amount = a.spa_gross_amount;
 if v_allocation_count<>7 or v_old_total<>1943000 then
   raise exception 'Original seven installment cash bases do not match the approved SPA reconciliation.';
 end if;
 for rec in
  select s.id as schedule_id,s.unit_id,s.due_amount,s.stage_name,s.status,
         a.id as allocation_id,a.approved_amount,a.spa_gross_amount
  from public.payment_schedule s
  join public.spa_credit_allocations a on a.payment_schedule_id=s.id
  where a.revision_id=v_revision_id and s.unit_id=467 and a.status='approved_pending_issue'
  order by s.id for update of s,a
 loop
  if rec.due_amount+rec.approved_amount<>rec.spa_gross_amount then
    raise exception 'Installment differs from signed SPA.';
  end if;
  old_due:=rec.due_amount;old_status:=rec.status;
  perform set_config('crm.b2703_issuance_schedule',rec.schedule_id::text,true);
  update public.payment_schedule set
   due_amount=rec.spa_gross_amount,
   revised_due_amount=old_due,
   updated_at=now()
  where id=rec.schedule_id and unit_id=467;
  select status into new_status from public.payment_schedule where id=rec.schedule_id;
  if new_status is distinct from old_status then
    raise exception 'SPA gross alignment would change customer paid/outstanding status for schedule %.',rec.schedule_id;
  end if;
  insert into public.spa_gross_schedule_alignment_audit(
   unit_id,schedule_id,allocation_id,original_due,signed_spa_due,
   protected_collectible_due,approved_pending_credit,original_status,updated_status,approval_reference
  ) values (
   467,rec.schedule_id,rec.allocation_id,old_due,rec.spa_gross_amount,
   old_due,rec.approved_amount,old_status,new_status,
   'Official CRM signed SPA correspondence confirmed 24-Sep-2026'
  );
 end loop;
 perform set_config('crm.b2703_issuance_schedule','',true);
 if (select coalesce(sum(due_amount),0) from public.payment_schedule where unit_id=467
    and id in (select payment_schedule_id from public.spa_credit_allocations where revision_id=v_revision_id))<>2002000
 then raise exception 'Gross schedule total verification failed.'; end if;
 if (select coalesce(sum(revised_due_amount),0) from public.payment_schedule where unit_id=467
    and id in (select payment_schedule_id from public.spa_credit_allocations where revision_id=v_revision_id))<>1943000
 then raise exception 'Net collectible bridge verification failed.'; end if;
end $prep$;

-- Reconcile each stage's pending collectible bridge and post its approved credit
-- in one audited transaction, only after its own Accounts payment is verified.
create or replace function crm_private.issue_b2703_spa_credit(p_allocation_id bigint)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 v_user uuid := auth.uid();
 v_role text;
 v_allocation public.spa_credit_allocations%rowtype;
 v_schedule public.payment_schedule%rowtype;
 v_revision public.spa_price_revisions%rowtype;
 v_check_schedule public.payment_schedule%rowtype;
 v_required numeric;
 v_confirmed numeric;
 v_prior_credit numeric;
 v_before_net numeric;
 v_after_net numeric;
 v_id bigint;
 v_old_status text;
 v_new_status text;
 v_reference text;
 v_today date := (now() at time zone 'Asia/Dubai')::date;
begin
 if v_user is null then raise exception 'Authentication required.'; end if;
 select role::text into v_role from public.profiles where id=v_user;
 if v_role is distinct from 'crm_officer' then raise exception 'CRM officer authorization required.'; end if;
 if p_allocation_id is null then raise exception 'Select an approved installment allocation.'; end if;
 select * into v_allocation from public.spa_credit_allocations
   where id=p_allocation_id for update;
 if not found or v_allocation.unit_id<>467 or v_allocation.status<>'approved_pending_issue'
   or v_allocation.credit_note_id is not null then
    raise exception 'Allocation is not approved and pending for B2-703, or was already issued.';
 end if;
 select * into v_revision from public.spa_price_revisions
   where id=v_allocation.revision_id and is_current=true and status='executed' and unit_id=467;
 if not found or v_revision.spa_price<>2002000 or v_revision.commercial_price_snapshot<>1876000
   then raise exception 'The executed signed SPA revision must be verified before issuance.'; end if;
 select * into v_schedule from public.payment_schedule
   where id=v_allocation.payment_schedule_id and unit_id=467 for update;
 if not found or v_schedule.customer_id is null then
   raise exception 'Linked installment or customer is invalid.'; end if;
 if v_allocation.approved_amount<=0 or v_allocation.spa_gross_amount<=0
   then raise exception 'Invalid approved credit amount.'; end if;
 if v_schedule.due_amount <> v_allocation.spa_gross_amount
    or v_schedule.revised_due_amount is null
    or v_schedule.revised_due_amount + v_allocation.approved_amount <> v_schedule.due_amount then
    raise exception 'SPA gross stage and collectible bridge have not been reconciled.'; end if;
 if (select count(*) from public.spa_credit_allocations where revision_id=v_revision.id and status<>'cancelled')<>7
   or (select coalesce(sum(approved_amount),0) from public.spa_credit_allocations
      where revision_id=v_revision.id and status<>'cancelled')<>59000
   or (select coalesce(sum(spa_gross_amount),0) from public.spa_credit_allocations
      where revision_id=v_revision.id and status<>'cancelled')<>v_revision.spa_price
 then raise exception 'SPA installment totals or credits have changed; issuance blocked.'; end if;
 if exists(select 1 from public.spa_stage_credit_issue_audit where allocation_id=p_allocation_id)
 then raise exception 'Credit note was already issued for this allocation.'; end if;
 select coalesce(sum(amount),0) into v_prior_credit from public.credit_notes
   where payment_schedule_id=v_schedule.id;
 v_required := greatest(0, v_schedule.revised_due_amount - v_prior_credit);
 if v_schedule.paid_amount < v_required-0.01 then
   raise exception 'The installment net cash payment has not been recorded in full.';
 end if;
 select coalesce(sum(amount),0) into v_confirmed from public.payment_transactions
   where unit_id=467 and payment_schedule_id=v_schedule.id
     and accounts_confirmation_status='confirmed';
 if v_confirmed < v_required-0.01 then
   raise exception 'The installment payment is awaiting Accounts confirmation.';
 end if;
 -- The down payment and first installment additionally require the 2nd installment clearance.
 if v_allocation.clearance_schedule_id is not null
   or v_schedule.stage_name in ('Down Payment','1st Installment','2nd Installment') then
   select * into v_check_schedule from public.payment_schedule
     where id=1205 and unit_id=467;
   if not found or v_check_schedule.stage_name<>'2nd Installment' then
     raise exception 'Second-installment clearance stage missing.'; end if;
   select coalesce(sum(amount),0) into v_confirmed from public.payment_transactions
     where unit_id=467 and payment_schedule_id=1205 and accounts_confirmation_status='confirmed';
   if v_confirmed < coalesce(v_check_schedule.revised_due_amount,
      v_check_schedule.due_amount-(select coalesce(sum(c.amount),0) from public.credit_notes c where c.payment_schedule_id=1205))-0.01 then
     raise exception 'Second-installment Accounts clearance is required before issuance.';
   end if;
 end if;
 v_before_net := v_schedule.revised_due_amount - v_schedule.paid_amount-v_prior_credit;
 v_old_status := v_schedule.status;
 v_reference := 'SPA-UPLIFT-B2703-'||p_allocation_id::text;
 if exists(select 1 from public.credit_notes where reference_number=v_reference) then
   raise exception 'A credit note already exists with the approved reference.'; end if;
 -- Existing CRM note ID is populated by its sequence in application logic. Use
 -- an exclusive lock here to avoid concurrent manual allocation of the same ID.
 lock table public.credit_notes in share row exclusive mode;
 select greatest(nextval('public.credit_notes_id_seq'::regclass),
   coalesce(max(id),0)+1) into v_id from public.credit_notes;
 perform set_config('crm.b2703_issuance_schedule',v_schedule.id::text,true);
 update public.payment_schedule
   set revised_due_amount=null, updated_at=now()
   where id=v_schedule.id;
 insert into public.credit_notes (
   id,customer_id,unit_id,payment_schedule_id,issue_date,
   amount,reason,reference_number,created_by
 ) values (
   v_id,v_schedule.customer_id,467,v_schedule.id,v_today,
   v_allocation.approved_amount,
   'Management-approved signed SPA price uplift credit. Original customer cash obligation preserved; approval 24-Sep-2026.',
   v_reference,v_user
 );
 update public.spa_credit_allocations
   set status='issued', credit_note_id=v_id, issued_at=now(),updated_at=now()
   where id=p_allocation_id and status='approved_pending_issue';
 if not found then raise exception 'Allocation changed during issuance.'; end if;
 select * into v_schedule from public.payment_schedule where id=v_schedule.id;
 v_new_status := v_schedule.status;
 select coalesce(sum(amount),0) into v_prior_credit from public.credit_notes
   where payment_schedule_id=v_schedule.id;
 v_after_net := v_schedule.due_amount-v_schedule.paid_amount-v_prior_credit;
 if abs(v_before_net-v_after_net)>0.01 then
   raise exception 'Customer cash due changed unexpectedly; transaction rolled back.';
 end if;
 insert into public.spa_stage_credit_issue_audit (
   allocation_id,unit_id,schedule_id,credit_note_id,previous_due,
   new_due,previous_status,new_status,issued_amount,issued_by,source_reference
 ) values (
   p_allocation_id,467,v_schedule.id,v_id,
   v_allocation.spa_gross_amount-v_allocation.approved_amount,v_schedule.due_amount,
   v_old_status,v_new_status,v_allocation.approved_amount,v_user,v_reference
 );
 perform set_config('crm.b2703_issuance_schedule','',true);
 return jsonb_build_object('allocation_id',p_allocation_id,'credit_note_id',v_id,
   'reference',v_reference,'stage',v_schedule.stage_name,
   'issued_amount',v_allocation.approved_amount,'unchanged_cash_due',v_after_net,
   'send_task_created',true);
end $fn$;

-- Deny direct API writes to audit table and preserve established RPC permissions.
revoke all on public.spa_gross_schedule_alignment_audit from anon;
commit;