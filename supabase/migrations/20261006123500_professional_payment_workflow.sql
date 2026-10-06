-- Professional payment workflow: confirmation source, workflow state, and controlled task outcomes.

alter table public.payment_transactions
  add column if not exists payment_confirmation_mode text,
  add column if not exists payment_workflow_status text,
  add column if not exists payment_verification_issue text;

update public.payment_transactions
set payment_confirmation_mode = case
  when accounts_confirmation_status = 'confirmed' then 'confirmed_by_accounts'
  else 'confirmed_by_customer'
end
where payment_confirmation_mode is null;

update public.payment_transactions
set payment_workflow_status = case
  when receipt_sent_at is not null then 'receipt_sent'
  when accounts_confirmation_status = 'confirmed' then 'receipt_pending'
  else 'awaiting_accounts'
end
where payment_workflow_status is null;

alter table public.payment_transactions
  alter column payment_confirmation_mode set default 'confirmed_by_customer',
  alter column payment_confirmation_mode set not null,
  alter column payment_workflow_status set default 'awaiting_accounts',
  alter column payment_workflow_status set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid='public.payment_transactions'::regclass
      and conname='payment_transactions_confirmation_mode_check'
  ) then
    alter table public.payment_transactions drop constraint payment_transactions_confirmation_mode_check;
  end if;
  if exists (
    select 1 from pg_constraint
    where conrelid='public.payment_transactions'::regclass
      and conname='payment_transactions_workflow_status_check'
  ) then
    alter table public.payment_transactions drop constraint payment_transactions_workflow_status_check;
  end if;
end $$;

alter table public.payment_transactions
  add constraint payment_transactions_confirmation_mode_check
    check (payment_confirmation_mode in ('confirmed_by_accounts','confirmed_by_customer','cheque_pending_clearance')),
  add constraint payment_transactions_workflow_status_check
    check (payment_workflow_status in ('awaiting_accounts','cheque_pending','receipt_pending','receipt_sent','verification_issue','reversed'));

alter table public.scheduled_actions
  drop constraint if exists scheduled_actions_workflow_kind_check;

alter table public.scheduled_actions
  add constraint scheduled_actions_workflow_kind_check
  check (
    workflow_kind is null or workflow_kind in (
      'accounts_confirmation',
      'cheque_clearance',
      'payment_receipt',
      'promise_follow_up',
      'payment_query',
      'payment_follow_up',
      'payment_review'
    )
  );

create index if not exists payment_transactions_workflow_status_idx
  on public.payment_transactions(payment_workflow_status, unit_id);

create or replace function public.crm_create_payment_confirmation_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
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
    unit_id, action_label, due_date, priority, note, status, owner_id,
    source, auto_kind, auto_key, schedule_id, transaction_id, workflow_kind,
    created_at, updated_at
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
    case when new.payment_schedule_id is not null
      then 'manual_payment|unit:' || new.unit_id::text || '|schedule:' || new.payment_schedule_id::text
      else null end,
    new.payment_schedule_id,
    new.id,
    'accounts_confirmation',
    now(),
    now()
  )
  on conflict do nothing;

  return new;
end;
$function$;

create or replace function public.crm_advance_payment_confirmation_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
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

  if old.workflow_kind in ('accounts_confirmation','cheque_clearance') then
    update public.payment_transactions
       set accounts_confirmation_status = 'confirmed',
           accounts_confirmed_at = now(),
           accounts_confirmed_by = coalesce(auth.uid(), old.owner_id),
           accounts_confirmation_note = nullif(btrim(coalesce(new.completion_note,'')),''),
           payment_workflow_status = 'receipt_pending',
           payment_verification_issue = null
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
    new.source := 'manual';
    new.auto_kind := null;
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
           ),
           payment_workflow_status = 'receipt_sent'
     where id = old.transaction_id;
  end if;

  return new;
end;
$function$;

create or replace function public.crm_set_payment_confirmation_mode(
  p_transaction_id bigint,
  p_mode text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_tx public.payment_transactions%rowtype;
  v_task_id bigint;
  v_owner uuid := auth.uid();
  v_amount_text text;
  v_label text;
  v_kind text;
  v_status text;
  v_note text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to update payment verification.';
  end if;

  if p_mode not in ('confirmed_by_accounts','confirmed_by_customer','cheque_pending_clearance') then
    raise exception 'Select a valid payment confirmation option.';
  end if;

  select * into v_tx
  from public.payment_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Payment transaction not found.';
  end if;

  v_amount_text := trim(to_char(round(coalesce(v_tx.amount,0),2),'FM999G999G999G990D00'));

  if p_mode = 'confirmed_by_accounts' then
    update public.payment_transactions
       set payment_confirmation_mode = p_mode,
           accounts_confirmation_status = 'confirmed',
           accounts_confirmed_at = now(),
           accounts_confirmed_by = v_owner,
           accounts_confirmation_note = nullif(btrim(coalesce(p_note,'')),''),
           payment_workflow_status = 'receipt_pending',
           payment_verification_issue = null
     where id = p_transaction_id;
    v_label := 'Send Payment Receipt';
    v_kind := 'payment_receipt';
    v_status := 'receipt_pending';
    v_note := 'Accounts confirmed AED ' || v_amount_text ||
      case when nullif(btrim(coalesce(v_tx.payment_type,'')),'') is not null
        then ' · ' || btrim(v_tx.payment_type) else '' end ||
      '. Generate and send the official payment receipt to the customer.';
  elsif p_mode = 'confirmed_by_customer' then
    update public.payment_transactions
       set payment_confirmation_mode = p_mode,
           accounts_confirmation_status = 'pending',
           accounts_confirmed_at = null,
           accounts_confirmed_by = null,
           accounts_confirmation_note = null,
           payment_workflow_status = 'awaiting_accounts',
           payment_verification_issue = null
     where id = p_transaction_id;
    v_label := 'Confirm Payment with Accounts';
    v_kind := 'accounts_confirmation';
    v_status := 'awaiting_accounts';
    v_note := 'Customer confirmed AED ' || v_amount_text ||
      case when nullif(btrim(coalesce(v_tx.payment_type,'')),'') is not null
        then ' · ' || btrim(v_tx.payment_type) else '' end ||
      '. Verify the amount with Accounts before issuing the payment receipt.';
  else
    update public.payment_transactions
       set payment_confirmation_mode = p_mode,
           accounts_confirmation_status = 'pending',
           accounts_confirmed_at = null,
           accounts_confirmed_by = null,
           accounts_confirmation_note = null,
           payment_workflow_status = 'cheque_pending',
           payment_verification_issue = null
     where id = p_transaction_id;
    v_label := 'Confirm Cheque Clearance';
    v_kind := 'cheque_clearance';
    v_status := 'cheque_pending';
    v_note := 'Cheque recorded for AED ' || v_amount_text ||
      case when nullif(btrim(coalesce(v_tx.payment_type,'')),'') is not null
        then ' · ' || btrim(v_tx.payment_type) else '' end ||
      '. Confirm clearance before issuing the payment receipt.';
  end if;

  select id into v_task_id
  from public.scheduled_actions
  where transaction_id = p_transaction_id
    and status = 'pending'
  order by id desc
  limit 1
  for update;

  if v_task_id is null then
    insert into public.scheduled_actions(
      unit_id, action_label, due_date, priority, note, status, owner_id,
      source, auto_kind, auto_key, schedule_id, transaction_id, workflow_kind,
      created_at, updated_at
    ) values (
      v_tx.unit_id, v_label, current_date, 'Medium', v_note, 'pending', v_owner,
      'manual', null,
      case when v_tx.payment_schedule_id is not null
        then 'manual_payment|unit:' || v_tx.unit_id::text || '|schedule:' || v_tx.payment_schedule_id::text
        else null end,
      v_tx.payment_schedule_id, p_transaction_id, v_kind, now(), now()
    )
    returning id into v_task_id;
  else
    update public.scheduled_actions
       set action_label = v_label,
           due_date = current_date,
           priority = 'Medium',
           note = v_note,
           status = 'pending',
           owner_id = coalesce(owner_id, v_owner),
           source = 'manual',
           auto_kind = null,
           auto_key = case when v_tx.payment_schedule_id is not null
             then 'manual_payment|unit:' || v_tx.unit_id::text || '|schedule:' || v_tx.payment_schedule_id::text
             else null end,
           schedule_id = v_tx.payment_schedule_id,
           workflow_kind = v_kind,
           completed_at = null,
           completion_note = null,
           cancelled_at = null,
           updated_at = now()
     where id = v_task_id;
  end if;

  return jsonb_build_object(
    'transaction_id', p_transaction_id,
    'task_id', v_task_id,
    'confirmation_mode', p_mode,
    'workflow_status', v_status,
    'next_action', v_label
  );
end;
$function$;

create or replace function public.crm_resolve_payment_workflow_task(
  p_task_id bigint,
  p_outcome text,
  p_note text default null,
  p_next_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_task public.scheduled_actions%rowtype;
  v_tx public.payment_transactions%rowtype;
  v_now timestamptz := now();
  v_due date;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to resolve payment workflow tasks.';
  end if;

  select * into v_task
  from public.scheduled_actions
  where id = p_task_id
  for update;

  if not found or v_task.status <> 'pending' then
    raise exception 'Pending workflow task not found.';
  end if;

  if v_task.transaction_id is null then
    raise exception 'This task is not linked to a payment transaction.';
  end if;

  select * into v_tx
  from public.payment_transactions
  where id = v_task.transaction_id
  for update;

  if not found then
    raise exception 'Linked payment transaction not found.';
  end if;

  if v_task.workflow_kind = 'accounts_confirmation' then
    if p_outcome = 'confirmed' then
      update public.scheduled_actions
         set status='completed', completed_at=v_now,
             completion_note=nullif(btrim(coalesce(p_note,'')),''),
             updated_at=v_now
       where id=v_task.id;
    elsif p_outcome = 'not_received' then
      update public.payment_transactions
         set payment_workflow_status='verification_issue',
             payment_verification_issue='not_received'
       where id=v_tx.id;
      update public.scheduled_actions
         set action_label='Payment Follow-up with Customer',
             due_date=current_date,
             priority='High',
             note=coalesce(nullif(btrim(coalesce(p_note,'')),''),
               'Accounts could not confirm this payment. Follow up with the customer and verify the transfer details.'),
             source='manual', auto_kind=null,
             workflow_kind='payment_follow_up',
             status='pending', updated_at=v_now
       where id=v_task.id;
    elsif p_outcome = 'amount_mismatch' then
      update public.payment_transactions
         set payment_workflow_status='verification_issue',
             payment_verification_issue='amount_mismatch'
       where id=v_tx.id;
      update public.scheduled_actions
         set action_label='Review Payment Amount',
             due_date=current_date,
             priority='High',
             note=coalesce(nullif(btrim(coalesce(p_note,'')),''),
               'Accounts reported a payment amount mismatch. Review the transaction before issuing a receipt.'),
             source='manual', auto_kind=null,
             workflow_kind='payment_review',
             status='pending', updated_at=v_now
       where id=v_task.id;
    else
      raise exception 'Select a valid Accounts verification outcome.';
    end if;

  elsif v_task.workflow_kind = 'cheque_clearance' then
    if p_outcome = 'cleared' then
      update public.scheduled_actions
         set status='completed', completed_at=v_now,
             completion_note=nullif(btrim(coalesce(p_note,'')),''),
             updated_at=v_now
       where id=v_task.id;
    elsif p_outcome = 'still_pending' then
      v_due := coalesce(p_next_date, current_date + 1);
      update public.scheduled_actions
         set due_date=v_due,
             note=coalesce(nullif(btrim(coalesce(p_note,'')),''),
               'Cheque clearance is still pending. Recheck with Accounts on the scheduled date.'),
             updated_at=v_now
       where id=v_task.id;
    elsif p_outcome = 'returned' then
      update public.payment_transactions
         set payment_workflow_status='verification_issue',
             payment_verification_issue='cheque_returned'
       where id=v_tx.id;
      update public.scheduled_actions
         set action_label='Review Returned Payment / Cheque',
             due_date=current_date,
             priority='High',
             note=coalesce(nullif(btrim(coalesce(p_note,'')),''),
               'Cheque was returned. Review or reverse the recorded transaction, then continue collection for the outstanding balance.'),
             source='manual', auto_kind=null,
             workflow_kind='payment_review',
             status='pending', updated_at=v_now
       where id=v_task.id;
    else
      raise exception 'Select a valid cheque clearance outcome.';
    end if;

  elsif v_task.workflow_kind = 'payment_receipt' then
    if p_outcome <> 'sent' then
      raise exception 'Select Receipt Sent to close this task.';
    end if;
    update public.scheduled_actions
       set status='completed', completed_at=v_now,
           completion_note=nullif(btrim(coalesce(p_note,'')),''),
           updated_at=v_now
     where id=v_task.id;
  else
    raise exception 'This payment workflow task does not use this resolver.';
  end if;

  return jsonb_build_object(
    'task_id', v_task.id,
    'transaction_id', v_tx.id,
    'outcome', p_outcome
  );
end;
$function$;

revoke all on function public.crm_set_payment_confirmation_mode(bigint,text,text) from public, anon;
grant execute on function public.crm_set_payment_confirmation_mode(bigint,text,text) to authenticated;

revoke all on function public.crm_resolve_payment_workflow_task(bigint,text,text,date) from public, anon;
grant execute on function public.crm_resolve_payment_workflow_task(bigint,text,text,date) to authenticated;
