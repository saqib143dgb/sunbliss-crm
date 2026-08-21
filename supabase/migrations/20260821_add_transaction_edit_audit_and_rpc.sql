create table if not exists public.payment_transaction_edit_log (
  id uuid primary key default gen_random_uuid(),
  transaction_id bigint not null,
  customer_id bigint,
  unit_id bigint,
  old_payment_date date,
  old_amount numeric not null,
  old_payment_type text,
  old_payment_reference text,
  old_remarks text,
  new_payment_date date,
  new_amount numeric not null,
  new_payment_type text,
  new_payment_reference text,
  new_remarks text,
  edited_by uuid not null,
  edited_at timestamptz not null default now()
);

alter table public.payment_transaction_edit_log enable row level security;

revoke all on table public.payment_transaction_edit_log from anon;
revoke all on table public.payment_transaction_edit_log from authenticated;
grant select, insert on table public.payment_transaction_edit_log to authenticated;

create policy "crm read transaction edit log"
on public.payment_transaction_edit_log
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  )
);

create policy "crm insert transaction edit log"
on public.payment_transaction_edit_log
for insert
to authenticated
with check (
  edited_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  )
);

create or replace function public.crm_edit_payment_transaction(
  p_transaction_id bigint,
  p_payment_date date,
  p_amount numeric,
  p_payment_type text,
  p_payment_reference text,
  p_remarks text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_tx public.payment_transactions%rowtype;
  v_old_sched public.payment_schedule%rowtype;
  v_new_sched public.payment_schedule%rowtype;
  v_old_schedule_id bigint;
  v_new_schedule_id bigint;
  v_same_schedule boolean := false;
  v_old_new_paid numeric := 0;
  v_new_new_paid numeric := 0;
  v_latest_date date;
  v_old_status text;
  v_new_status text;
  v_payment_type text := btrim(coalesce(p_payment_type, ''));
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  ) then
    raise exception 'Not authorized to edit transactions';
  end if;

  if p_payment_date is null then
    raise exception 'Payment date is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  if v_payment_type = '' then
    raise exception 'Installment is required';
  end if;

  select * into v_tx
  from public.payment_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  select id into v_old_schedule_id
  from public.payment_schedule
  where customer_id is not distinct from v_tx.customer_id
    and unit_id is not distinct from v_tx.unit_id
    and lower(btrim(stage_name)) = lower(btrim(coalesce(v_tx.payment_type, '')))
  order by id
  limit 1;

  if v_old_schedule_id is null then
    raise exception 'The original installment could not be matched safely. Review the installment ledger before editing this transaction.';
  end if;

  select id into v_new_schedule_id
  from public.payment_schedule
  where customer_id is not distinct from v_tx.customer_id
    and unit_id is not distinct from v_tx.unit_id
    and lower(btrim(stage_name)) = lower(v_payment_type)
  order by id
  limit 1;

  if v_new_schedule_id is null then
    raise exception 'The selected installment is not linked to this customer and unit';
  end if;

  perform 1
  from public.payment_schedule
  where id in (v_old_schedule_id, v_new_schedule_id)
  order by id
  for update;

  select * into v_old_sched
  from public.payment_schedule
  where id = v_old_schedule_id;

  select * into v_new_sched
  from public.payment_schedule
  where id = v_new_schedule_id;

  v_same_schedule := v_old_schedule_id = v_new_schedule_id;

  insert into public.payment_transaction_edit_log (
    transaction_id, customer_id, unit_id,
    old_payment_date, old_amount, old_payment_type, old_payment_reference, old_remarks,
    new_payment_date, new_amount, new_payment_type, new_payment_reference, new_remarks,
    edited_by
  ) values (
    v_tx.id, v_tx.customer_id, v_tx.unit_id,
    v_tx.payment_date, v_tx.amount, v_tx.payment_type, v_tx.payment_reference, v_tx.remarks,
    p_payment_date, p_amount, v_payment_type, nullif(btrim(coalesce(p_payment_reference, '')), ''), nullif(btrim(coalesce(p_remarks, '')), ''),
    auth.uid()
  );

  update public.payment_transactions
  set payment_date = p_payment_date,
      amount = p_amount,
      payment_type = v_payment_type,
      payment_reference = nullif(btrim(coalesce(p_payment_reference, '')), ''),
      remarks = nullif(btrim(coalesce(p_remarks, '')), '')
  where id = v_tx.id;

  if v_same_schedule then
    v_new_new_paid := greatest(0, coalesce(v_old_sched.paid_amount, 0) - coalesce(v_tx.amount, 0) + p_amount);

    select max(payment_date) into v_latest_date
    from public.payment_transactions
    where customer_id is not distinct from v_tx.customer_id
      and unit_id is not distinct from v_tx.unit_id
      and lower(btrim(coalesce(payment_type, ''))) = lower(v_payment_type);

    v_new_status := case
      when coalesce(v_old_sched.due_amount, 0) > 0
        and v_new_new_paid >= coalesce(v_old_sched.due_amount, 0) - 1 then 'Paid'
      when v_new_new_paid > 0 then 'Partial'
      else 'Outstanding'
    end;

    update public.payment_schedule
    set paid_amount = v_new_new_paid,
        paid_date = case
          when v_new_new_paid <= 0 then null
          else coalesce(v_latest_date, v_old_sched.paid_date)
        end,
        status = v_new_status,
        updated_at = now()
    where id = v_old_schedule_id;

    v_old_new_paid := v_new_new_paid;
  else
    v_old_new_paid := greatest(0, coalesce(v_old_sched.paid_amount, 0) - coalesce(v_tx.amount, 0));

    select max(payment_date) into v_latest_date
    from public.payment_transactions
    where customer_id is not distinct from v_tx.customer_id
      and unit_id is not distinct from v_tx.unit_id
      and lower(btrim(coalesce(payment_type, ''))) = lower(btrim(coalesce(v_tx.payment_type, '')));

    v_old_status := case
      when coalesce(v_old_sched.due_amount, 0) > 0
        and v_old_new_paid >= coalesce(v_old_sched.due_amount, 0) - 1 then 'Paid'
      when v_old_new_paid > 0 then 'Partial'
      else 'Outstanding'
    end;

    update public.payment_schedule
    set paid_amount = v_old_new_paid,
        paid_date = case
          when v_old_new_paid <= 0 then null
          else coalesce(v_latest_date, v_old_sched.paid_date)
        end,
        status = v_old_status,
        updated_at = now()
    where id = v_old_schedule_id;

    v_new_new_paid := coalesce(v_new_sched.paid_amount, 0) + p_amount;

    select max(payment_date) into v_latest_date
    from public.payment_transactions
    where customer_id is not distinct from v_tx.customer_id
      and unit_id is not distinct from v_tx.unit_id
      and lower(btrim(coalesce(payment_type, ''))) = lower(v_payment_type);

    v_new_status := case
      when coalesce(v_new_sched.due_amount, 0) > 0
        and v_new_new_paid >= coalesce(v_new_sched.due_amount, 0) - 1 then 'Paid'
      when v_new_new_paid > 0 then 'Partial'
      else 'Outstanding'
    end;

    update public.payment_schedule
    set paid_amount = v_new_new_paid,
        paid_date = case
          when v_new_new_paid <= 0 then null
          else coalesce(v_latest_date, v_new_sched.paid_date)
        end,
        status = v_new_status,
        updated_at = now()
    where id = v_new_schedule_id;
  end if;

  return jsonb_build_object(
    'transaction_id', v_tx.id,
    'old_schedule_id', v_old_schedule_id,
    'new_schedule_id', v_new_schedule_id,
    'same_schedule', v_same_schedule,
    'old_schedule_paid_amount', v_old_new_paid,
    'new_schedule_paid_amount', v_new_new_paid
  );
end;
$$;

revoke execute on function public.crm_edit_payment_transaction(bigint, date, numeric, text, text, text) from public;
revoke execute on function public.crm_edit_payment_transaction(bigint, date, numeric, text, text, text) from anon;
grant execute on function public.crm_edit_payment_transaction(bigint, date, numeric, text, text, text) to authenticated;
