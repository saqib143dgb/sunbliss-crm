-- B2-703: align revised SPA's DLD contractual liability with two Accounts-confirmed
-- cash transactions and existing DLD credit note. Preserve all source records.
-- Attach verified executed-SPA provenance without fabricating signature timestamps.
begin;
create table if not exists public.b2703_dld_spa_alignment_audit (
 id bigint generated always as identity primary key,
 unit_id bigint not null references public.units(id) on delete restrict,
 sale_id bigint not null references public.sales(id) on delete restrict,
 schedule_id bigint not null references public.payment_schedule(id) on delete restrict,
 revision_id bigint not null references public.spa_price_revisions(id) on delete restrict,
 previous_dld_due numeric(14,2) not null,
 signed_spa_dld_due numeric(14,2) not null,
 accounts_confirmed_dld_cash numeric(14,2) not null,
 existing_issued_dld_credit numeric(14,2) not null,
 previous_spa_progress jsonb not null,
 evidence_reference text not null,
 reconciled_at timestamptz not null default now(),
 constraint one_b2703_dld_spa_alignment unique(unit_id,schedule_id,revision_id),
 constraint dld_signed_spa_matched check (
   signed_spa_dld_due=accounts_confirmed_dld_cash+existing_issued_dld_credit
 )
);
alter table public.b2703_dld_spa_alignment_audit enable row level security;
revoke all on public.b2703_dld_spa_alignment_audit from anon,authenticated;
grant select on public.b2703_dld_spa_alignment_audit to authenticated;
drop policy if exists "CRM personnel read B2-703 DLD SPA audit" on public.b2703_dld_spa_alignment_audit;
create policy "CRM personnel read B2-703 DLD SPA audit"
 on public.b2703_dld_spa_alignment_audit
 for select to authenticated using (exists(
 select 1 from public.profiles p where p.id=(select auth.uid())
 and p.role::text in ('crm_officer','manager')
));
do $sync$
declare
 v_price numeric;
 v_revision public.spa_price_revisions%rowtype;
 v_schedule public.payment_schedule%rowtype;
 v_sale public.sales%rowtype;
 v_cash numeric;
 v_confirmed numeric;
 v_credit numeric;
 v_dld_total numeric;
 v_n integer;
 v_pending integer;
begin
 select * into v_revision from public.spa_price_revisions
 where unit_id=467 and sale_id=47 and is_current=true and status='executed' and spa_price=2002000;
 if not found then raise exception 'Signed B2-703 SPA revision missing or changed.'; end if;
 select * into v_sale from public.sales where id=47 and unit_id=467 and customer_id=47 for update;
 if not found or v_sale.spa_status is distinct from 'Signed'
   or v_sale.spa_date is distinct from v_revision.signed_on
 then raise exception 'Verified signed SPA sale status is not consistent with executed revision.'; end if;
 if nullif(v_sale.spa_progress->>'customer_signed_on','') is not null
   or nullif(v_sale.spa_progress->>'developer_signed_on','') is not null
 then raise exception 'Individual signature workflow has changed; manual verification needed.'; end if;
 select * into v_schedule from public.payment_schedule
 where id=1198 and unit_id=467 and customer_id=47
   and stage_name='DLD + Admin Fees (SPA)' for update;
 if not found or v_schedule.due_amount<>82820 or v_schedule.revised_due_amount is not null
    or v_schedule.paid_amount<>82500 or v_schedule.status<>'Paid'
 then raise exception 'DLD stage has changed; reconciliation aborted.'; end if;
 v_dld_total:=round(v_revision.spa_price*v_revision.dld_rate_percent/100+v_revision.dld_admin_fees,2);
 select coalesce(sum(amount),0),coalesce(sum(amount) filter(where accounts_confirmation_status='confirmed'),0),count(*)
 into v_cash,v_confirmed,v_n from public.payment_transactions
 where unit_id=467 and payment_schedule_id=1198 and amount>0;
 select coalesce(sum(amount),0) into v_credit from public.credit_notes
 where unit_id=467 and payment_schedule_id=1198;
 select count(*) into v_pending from public.payment_transactions
 where unit_id=467 and payment_schedule_id=1198 and accounts_confirmation_status<>'confirmed';
 if v_dld_total<>85180 or v_cash<>82500 or v_confirmed<>82500
   or v_n<>2 or v_pending<>0 or v_credit<>2680
   or v_cash+v_credit<>v_dld_total
 then raise exception 'DLD Accounts payments, issued credit and SPA charge do not reconcile.'; end if;
 if not exists(select 1 from public.scheduled_actions
 where id=464 and unit_id=467 and schedule_id=1198 and transaction_id=916
 and workflow_kind='payment_receipt' and status='pending')
 then raise exception 'Existing confirmed supplementary DLD receipt task changed.'; end if;
 if exists(select 1 from public.b2703_dld_spa_alignment_audit where unit_id=467)
 then raise exception 'B2-703 revised DLD was already aligned.'; end if;
 insert into public.b2703_dld_spa_alignment_audit(
 unit_id,sale_id,schedule_id,revision_id,previous_dld_due,signed_spa_dld_due,
 accounts_confirmed_dld_cash,existing_issued_dld_credit,previous_spa_progress,evidence_reference
 )values(
 467,47,1198,v_revision.id,82820,v_dld_total,v_confirmed,v_credit,v_sale.spa_progress,
 'Current executed SPA revision and Accounts-confirmed DLD transactions'
 );
 update public.payment_schedule
 set due_amount=v_dld_total,updated_at=now()
 where id=1198 and unit_id=467 and due_amount=82820;
 if not found then raise exception 'DLD source update did not occur.'; end if;
 if (select status from public.payment_schedule where id=1198) is distinct from 'Paid'
 then raise exception 'DLD stage was not fully settled after correction.'; end if;
 -- Link the executed revision as proof of the already recorded SPA Signed state.
 -- Individual customer/developer signature dates remain unspecified.
 update public.sales
 set spa_progress=coalesce(spa_progress,'{}'::jsonb)||
 jsonb_build_object(
  'executed_spa_revision_id',v_revision.id,
  'executed_spa_signed_on',v_revision.signed_on,
  'executed_spa_evidence','spa_price_revisions',
  'signed_agreement_verified',true
 )
 where id=47 and unit_id=467 and spa_status='Signed';
 if not found then raise exception 'Signed SPA provenance linkage failed.'; end if;
 if exists(select 1 from public.spa_credit_allocations a
   where a.unit_id=467 and a.status='issued')
 then raise exception 'Unexpected supplementary SPA credit issuance occurred.'; end if;
end $sync$;
commit;