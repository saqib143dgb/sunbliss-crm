alter table public.payment_transactions
  add column if not exists accounts_confirmation_status text,
  add column if not exists accounts_confirmed_at timestamptz,
  add column if not exists accounts_confirmed_by uuid references public.profiles(id) on delete set null,
  add column if not exists accounts_confirmation_note text,
  add column if not exists receipt_sent_at timestamptz,
  add column if not exists receipt_sent_by uuid references public.profiles(id) on delete set null,
  add column if not exists receipt_send_note text;

update public.payment_transactions
set
  accounts_confirmation_status = 'confirmed',
  accounts_confirmed_at = coalesce(accounts_confirmed_at, created_at, now())
where accounts_confirmation_status is null;

alter table public.payment_transactions
  alter column accounts_confirmation_status set default 'pending',
  alter column accounts_confirmation_status set not null;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_accounts_confirmation_status_check;

alter table public.payment_transactions
  add constraint payment_transactions_accounts_confirmation_status_check
  check (accounts_confirmation_status in ('pending','confirmed'));

comment on column public.payment_transactions.accounts_confirmation_status is
  'Operational Accounts verification state for a recorded payment. New payments start pending; historical payments were backfilled as confirmed.';
comment on column public.payment_transactions.receipt_sent_at is
  'Timestamp when CRM marked the official payment receipt as sent to the customer.';

alter table public.scheduled_actions
  add column if not exists transaction_id bigint references public.payment_transactions(id) on delete cascade,
  add column if not exists workflow_kind text;

alter table public.scheduled_actions
  drop constraint if exists scheduled_actions_workflow_kind_check;

alter table public.scheduled_actions
  add constraint scheduled_actions_workflow_kind_check
  check (workflow_kind is null or workflow_kind in ('accounts_confirmation','payment_receipt'));

create index if not exists scheduled_actions_transaction_workflow_idx
  on public.scheduled_actions(owner_id, transaction_id, workflow_kind, status)
  where transaction_id is not null;

create unique index if not exists scheduled_actions_owner_pending_transaction_workflow_uidx
  on public.scheduled_actions(owner_id, transaction_id)
  where status = 'pending'
    and transaction_id is not null
    and workflow_kind is not null;

create or replace function public.crm_create_payment_confirmation_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_amount text;
begin
  if coalesce(new.amount,0) <= 0
     or new.accounts_confirmation_status <> 'pending'
     or new.unit_id is null then
    return new;
  end if;

  if v_owner is null then
    return new;
  end if;

  v_amount := trim(to_char(round(new.amount,2),'FM999G999G999G990D00'));

  insert into public.scheduled_actions(
    unit_id,
    action_label,
    due_date,
    priority,
    note,
    status,
    owner_id,
    source,
    auto_kind,
    auto_key,
    schedule_id,
    transaction_id,
    workflow_kind,
    created_at,
    updated_at
  )
  values(
    new.unit_id,
    'Confirm Payment with Accounts',
    current_date,
    'Medium',
    'Customer payment recorded: AED ' || v_amount ||
      case when nullif(btrim(coalesce(new.payment_type,'')),'') is not null
        then ' · ' || btrim(new.payment_type) else '' end ||
      '. Confirm the amount with Accounts before issuing the payment receipt.',
    'pending',
    v_owner,
    'manual',
    null,
    null,
    null,
    new.id,
    'accounts_confirmation',
    now(),
    now()
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists payment_transactions_create_confirmation_task
  on public.payment_transactions;

create trigger payment_transactions_create_confirmation_task
after insert on public.payment_transactions
for each row
execute function public.crm_create_payment_confirmation_task();

create or replace function public.crm_advance_payment_confirmation_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric;
  v_type text;
  v_amount_text text;
begin
  if old.status <> 'pending'
     or new.status <> 'completed'
     or old.workflow_kind is null
     or old.transaction_id is null then
    return new;
  end if;

  select amount, payment_type
    into v_amount, v_type
  from public.payment_transactions
  where id = old.transaction_id;

  if not found then
    return new;
  end if;

  v_amount_text := trim(to_char(round(coalesce(v_amount,0),2),'FM999G999G999G990D00'));

  if old.workflow_kind = 'accounts_confirmation' then
    update public.payment_transactions
       set accounts_confirmation_status = 'confirmed',
           accounts_confirmed_at = now(),
           accounts_confirmed_by = coalesce(auth.uid(), old.owner_id),
           accounts_confirmation_note = nullif(btrim(coalesce(new.completion_note,'')),'')
     where id = old.transaction_id;

    new.action_label := 'Send Payment Receipt';
    new.due_date := current_date;
    new.priority := 'Medium';
    new.note := 'Accounts confirmed AED ' || v_amount_text ||
      case when nullif(btrim(coalesce(v_type,'')),'') is not null
        then ' · ' || btrim(v_type) else '' end ||
      '. Generate and send the official payment receipt to the customer.';
    new.status := 'pending';
    new.completed_at := null;
    new.completion_note := null;
    new.cancelled_at := null;
    new.workflow_kind := 'payment_receipt';
    new.updated_at := now();

    return new;
  end if;

  if old.workflow_kind = 'payment_receipt' then
    update public.payment_transactions
       set receipt_sent_at = coalesce(receipt_sent_at, now()),
           receipt_sent_by = coalesce(receipt_sent_by, auth.uid(), old.owner_id),
           receipt_send_note = coalesce(
             nullif(btrim(coalesce(new.completion_note,'')),''),
             receipt_send_note
           )
     where id = old.transaction_id;
  end if;

  return new;
end;
$$;

drop trigger if exists scheduled_actions_advance_payment_confirmation
  on public.scheduled_actions;

create trigger scheduled_actions_advance_payment_confirmation
before update of status on public.scheduled_actions
for each row
execute function public.crm_advance_payment_confirmation_task();
