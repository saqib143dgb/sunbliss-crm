-- Align the canonical displayed CONTRACT price of B2-703 with its already
-- executed SPA. Preserve original historical amounts in an immutable audit.
-- Property installment collection bridges, payments, credits, DLD, dates and
-- signed document formatting are not altered by this migration.
begin;
create table if not exists public.spa_contract_price_sync_audit(
 id bigint generated always as identity primary key,
 unit_id bigint not null unique references public.units(id) on delete restrict,
 revision_id bigint not null unique references public.spa_price_revisions(id) on delete restrict,
 previous_contract_total numeric(14,2) not null,
 executed_spa_contract_total numeric(14,2) not null,
 revision_increase numeric(14,2) not null,
 signed_on date not null,
 customer_page_note text not null,
 approved_credit_snapshot numeric(14,2) not null,
 created_at timestamptz not null default now(),
 constraint spa_price_sync_exact check(executed_spa_contract_total-previous_contract_total=revision_increase)
);
alter table public.spa_contract_price_sync_audit enable row level security;
revoke all on public.spa_contract_price_sync_audit from anon,authenticated;
grant select on public.spa_contract_price_sync_audit to authenticated;
drop policy if exists "CRM can read executed SPA price sync audit" on public.spa_contract_price_sync_audit;
create policy "CRM can read executed SPA price sync audit"
on public.spa_contract_price_sync_audit for select to authenticated using(
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text in ('crm_officer','manager'))
);
create or replace function crm_private.guard_executed_spa_contract_price()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare v_price numeric;
begin
 if new.id=467 and new.total_price is distinct from old.total_price then
  select r.spa_price into v_price from public.spa_price_revisions r
   where r.unit_id=467 and r.is_current=true and r.status='executed';
  if v_price is null or new.total_price is distinct from v_price then
   raise exception 'B2-703 contract price must equal the current executed SPA price.';
  end if;
 end if;
 return new;
end $fn$;
drop trigger if exists guard_executed_spa_contract_price on public.units;
create trigger guard_executed_spa_contract_price
before update of total_price on public.units for each row
execute function crm_private.guard_executed_spa_contract_price();
do $sync$
declare v_unit public.units%rowtype;
 v_rev public.spa_price_revisions%rowtype;
 v_gross numeric;
 v_cash_basis numeric;
 v_supplementary numeric;
 v_n int;
 v_old_cn numeric;
begin
 select * into v_unit from public.units where id=467 and unit_no='B2-703' for update;
 if not found or v_unit.customer_id<>47 or v_unit.total_price<>1943000 then
  raise exception 'Original B2-703 unit price or customer has changed; abort.';
 end if;
 select * into v_rev from public.spa_price_revisions
  where unit_id=467 and sale_id=47 and is_current=true and status='executed'
    and spa_price=2002000 and signed_on='2026-10-15'::date for update;
 if not found then raise exception 'Executed B2-703 signed SPA is missing or differs.'; end if;
 select count(*),coalesce(sum(due_amount),0),coalesce(sum(revised_due_amount),0)
 into v_n,v_gross,v_cash_basis
 from public.payment_schedule where unit_id=467
  and id in(select payment_schedule_id from public.spa_credit_allocations where revision_id=v_rev.id);
 select coalesce(sum(approved_amount),0) into v_supplementary
 from public.spa_credit_allocations where revision_id=v_rev.id
   and status='approved_pending_issue' and credit_note_id is null;
 if v_n<>7 or v_gross<>2002000 or v_cash_basis<>1943000
   or v_supplementary<>59000 then
  raise exception 'SPA seven-stage gross, net collection bridge or supplementary approvals do not reconcile.';
 end if;
 if exists(select 1 from public.spa_stage_credit_issue_audit where unit_id=467) then
  raise exception 'Supplementary credit issuance already in progress; refresh the price-sync plan.';
 end if;
 if exists(select 1 from public.spa_contract_price_sync_audit where unit_id=467) then
  raise exception 'Executed SPA contract price is already aligned.';
 end if;
 insert into public.spa_contract_price_sync_audit(
  unit_id,revision_id,previous_contract_total,executed_spa_contract_total,
  revision_increase,signed_on,customer_page_note,approved_credit_snapshot
 ) values (
  467,v_rev.id,v_unit.total_price,v_rev.spa_price,
  v_rev.spa_price-v_unit.total_price,v_rev.signed_on,
  'Contractual purchase price revised in accordance with the executed SPA. The AED 59,000 management-approved supplementary installment credits remain pending issue until the applicable Accounts and installment conditions are satisfied; the agreed customer cash collection obligations have not changed.',
  v_supplementary
 );
 update public.units set total_price=v_rev.spa_price,updated_at=now()
 where id=467 and total_price=v_unit.total_price;
 if not found then raise exception 'Unit contractual price update failed.'; end if;
 if (select total_price from public.units where id=467)<>v_rev.spa_price then
  raise exception 'Canonical unit price failed signed SPA verification.';
 end if;
end $sync$;
commit;