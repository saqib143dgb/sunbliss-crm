create table if not exists public.payment_transaction_deletion_log (
  id uuid primary key default gen_random_uuid(),
  transaction_id bigint not null,
  customer_id bigint,
  unit_id bigint,
  payment_date date,
  amount numeric not null,
  payment_type text,
  payment_reference text,
  remarks text,
  deleted_by uuid not null,
  deleted_at timestamptz not null default now()
);

alter table public.payment_transaction_deletion_log enable row level security;

create policy "crm read transaction deletion log"
on public.payment_transaction_deletion_log
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::user_role
  )
);

create policy "crm insert transaction deletion log"
on public.payment_transaction_deletion_log
for insert
to authenticated
with check (
  deleted_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::user_role
  )
);

grant select, insert on public.payment_transaction_deletion_log to authenticated;

create or replace function public.crm_delete_payment_transaction(p_transaction_id bigint)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_tx public.payment_transactions%rowtype;
  v_sched public.payment_schedule%rowtype;
  v_schedule_found boolean := false;
  v_new_paid numeric := 0;
  v_latest_date date;
  v_status text;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::user_role
  ) then
    raise exception 'Not authorized to delete transactions';
  end if;

  select * into v_tx
  from public.payment_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  select * into v_sched
  from public.payment_schedule
  where customer_id is not distinct from v_tx.customer_id
    and unit_id is not distinct from v_tx.unit_id
    and lower(btrim(stage_name)) = lower(btrim(coalesce(v_tx.payment_type, '')))
  order by id
  limit 1
  for update;
  v_schedule_found := found;

  insert into public.payment_transaction_deletion_log (
    transaction_id, customer_id, unit_id, payment_date, amount,
    payment_type, payment_reference, remarks, deleted_by
  ) values (
    v_tx.id, v_tx.customer_id, v_tx.unit_id, v_tx.payment_date, v_tx.amount,
    v_tx.payment_type, v_tx.payment_reference, v_tx.remarks, auth.uid()
  );

  delete from public.payment_transactions where id = p_transaction_id;

  if v_schedule_found then
    v_new_paid := greatest(0, coalesce(v_sched.paid_amount, 0) - coalesce(v_tx.amount, 0));

    select max(payment_date) into v_latest_date
    from public.payment_transactions
    where customer_id is not distinct from v_tx.customer_id
      and unit_id is not distinct from v_tx.unit_id
      and lower(btrim(coalesce(payment_type, ''))) = lower(btrim(coalesce(v_tx.payment_type, '')));

    v_status := case
      when coalesce(v_sched.due_amount, 0) > 0
        and v_new_paid >= coalesce(v_sched.due_amount, 0) - 1 then 'Paid'
      when v_new_paid > 0 then 'Partial'
      else 'Outstanding'
    end;

    update public.payment_schedule
    set paid_amount = v_new_paid,
        paid_date = case when v_new_paid > 0 then v_latest_date else null end,
        status = v_status,
        updated_at = now()
    where id = v_sched.id;
  end if;

  return jsonb_build_object(
    'deleted_transaction_id', v_tx.id,
    'schedule_updated', v_schedule_found,
    'new_paid_amount', case when v_schedule_found then v_new_paid else null end
  );
end;
$$;

revoke all on function public.crm_delete_payment_transaction(bigint) from public;
revoke all on function public.crm_delete_payment_transaction(bigint) from anon;
grant execute on function public.crm_delete_payment_transaction(bigint) to authenticated;