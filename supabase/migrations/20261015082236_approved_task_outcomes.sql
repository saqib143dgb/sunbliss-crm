-- Durable task history and atomic outcome transitions. Existing payment/SPA RPCs remain authoritative.
create table public.scheduled_action_events (
 id bigint generated always as identity primary key,
 task_id bigint references public.scheduled_actions(id) on delete set null,
 unit_id bigint not null references public.units(id) on delete cascade,
 owner_id uuid,
 actor_id uuid,
 outcome text,
 before_task jsonb not null,
 after_task jsonb not null,
 created_at timestamptz not null default now()
);
create index scheduled_action_events_unit_idx on public.scheduled_action_events(unit_id,id desc);
create index scheduled_action_events_task_idx on public.scheduled_action_events(task_id,id desc);
alter table public.scheduled_action_events enable row level security;
revoke all on public.scheduled_action_events from anon,authenticated;
grant select on public.scheduled_action_events to authenticated;
create policy scheduled_action_events_read on public.scheduled_action_events for select to authenticated
 using (owner_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text='manager'));
create or replace function crm_private.capture_scheduled_action_event() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if (old.action_label,old.due_date,old.note,old.status,old.workflow_kind,old.completion_note,old.spa_step)
    is distinct from (new.action_label,new.due_date,new.note,new.status,new.workflow_kind,new.completion_note,new.spa_step) then
  insert into public.scheduled_action_events(task_id,unit_id,owner_id,actor_id,outcome,before_task,after_task)
  values(new.id,new.unit_id,new.owner_id,auth.uid(),coalesce(nullif(current_setting('crm.task_outcome',true),''),new.workflow_kind,new.status),to_jsonb(old),to_jsonb(new));
 end if;
 return new;
end;$$;
revoke all on function crm_private.capture_scheduled_action_event() from public,anon,authenticated;
create trigger capture_scheduled_action_event after update on public.scheduled_actions
 for each row execute function crm_private.capture_scheduled_action_event();

-- One collection follow-up per promised part; unrelated duplicate installment tasks stay blocked.
drop index public.scheduled_actions_owner_pending_manual_schedule_uidx;
create unique index scheduled_actions_owner_pending_manual_schedule_uidx on public.scheduled_actions(owner_id,unit_id,schedule_id)
 where status='pending' and source='manual' and auto_kind is null and schedule_id is not null
 and extension_request_id is null and modification_request_id is null and transaction_id is null and commitment_part_id is null;

create or replace function public.crm_record_scheduled_outcome(
 p_task_id bigint,p_expected_updated_at timestamptz,p_outcome text,p_schedule_id bigint default null,
 p_note text default null,p_next_date date default null,p_parts jsonb default null
) returns jsonb language plpgsql security invoker set search_path=public as $$
declare t public.scheduled_actions; s public.payment_schedule; r jsonb; today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role::text='crm_officer') then
  raise exception 'Only CRM officers can record collection outcomes.';
 end if;
 select * into t from public.scheduled_actions where id=p_task_id for update;
 if not found then raise exception 'Task not found or not available to your account.';end if;
 if t.status<>'pending' or t.updated_at is distinct from p_expected_updated_at then
  raise exception 'This task has changed. Go back and reopen it before saving.';
 end if;
 if t.workflow_kind in ('spa','extension_approval','extension_customer_confirmation','extension_clarification','modification_request','accounts_confirmation','cheque_clearance','payment_receipt')
 or t.auto_kind in ('demand_letter','gentle_reminder','extension_active') then
  raise exception 'Use the dedicated workflow for this task.';
 end if;
 if p_outcome not in ('will_pay_later','no_response','payment_issue','query_resolved','extension_request','partial_payment_commitment','cancel_task','recheck_accounts') or p_outcome is null then
  raise exception 'Select an outcome.';
 end if;
 if p_outcome in ('extension_request','payment_issue','query_resolved','cancel_task') and nullif(btrim(p_note),'') is null then raise exception 'Enter the reason or details.';end if;
 perform set_config('crm.task_outcome',p_outcome,true);
 if p_outcome='cancel_task' then
  if t.transaction_id is not null then raise exception 'Resolve the recorded payment before cancelling its task.';end if;
  update public.scheduled_actions set status='cancelled',cancelled_at=now(),completion_note=p_note,updated_at=now() where id=t.id;
  return jsonb_build_object('task_id',t.id,'outcome',p_outcome);
 end if;
 if p_outcome='recheck_accounts' then
  if t.transaction_id is null then raise exception 'No payment is linked to this task.';end if;
  return public.crm_set_payment_confirmation_mode(t.transaction_id,'confirmed_by_customer',p_note);
 end if;
 if t.transaction_id is not null and p_outcome not in ('no_response','payment_issue','query_resolved') then raise exception 'Resolve the existing payment verification first.';end if;
 select * into s from public.payment_schedule where id=coalesce(t.schedule_id,p_schedule_id) and unit_id=t.unit_id for update;
 if not found then raise exception 'Select the related installment.';end if;
 if p_outcome in ('will_pay_later','no_response','payment_issue','query_resolved','extension_request') and (p_next_date is null or p_next_date<today) then raise exception 'Select today or a future date.';end if;
 if t.schedule_id is null then update public.scheduled_actions set schedule_id=s.id where id=t.id;end if;
 if p_outcome='extension_request' then
  return public.crm_create_payment_extension_request(t.unit_id,s.id,p_next_date,p_note);
 elsif p_outcome='partial_payment_commitment' then
  return public.crm_create_partial_payment_commitment(t.id,p_parts,p_note);
 end if;
 update public.scheduled_actions set
 action_label=case when p_outcome='payment_issue' then 'Resolve Payment Query' when p_outcome='will_pay_later' then 'Follow up on Promised Payment' else 'Payment Follow-up with Customer' end,
 due_date=p_next_date,note=p_note,source='manual',auto_kind=null,
 workflow_kind=case when p_outcome='payment_issue' then 'payment_query' when t.commitment_part_id is not null then 'partial_payment_commitment' when p_outcome='will_pay_later' then 'promise_follow_up' else 'payment_follow_up' end,
 updated_at=now() where id=t.id;
 return jsonb_build_object('task_id',t.id,'outcome',p_outcome);
end;$$;
revoke all on function public.crm_record_scheduled_outcome(bigint,timestamptz,text,bigint,text,date,jsonb) from public,anon;
grant execute on function public.crm_record_scheduled_outcome(bigint,timestamptz,text,bigint,text,date,jsonb) to authenticated;

CREATE OR REPLACE FUNCTION public.crm_create_partial_payment_commitment(p_task_id bigint, p_parts jsonb, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_task public.scheduled_actions%rowtype;
  v_schedule public.payment_schedule%rowtype;
  v_plan_id bigint;
  v_part_id bigint;
  v_first_id bigint;
  v_first_amount numeric;
  v_first_date date;
  v_total numeric := 0;
  v_outstanding numeric := 0;
  v_credit numeric := 0;
  v_count integer := 0;
  v_idx integer := 0;
  v_item jsonb;
  v_amount numeric;
  v_date date;
  v_owner uuid := auth.uid();
  v_note text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to create a partial payment commitment.';
  end if;

  select * into v_task
  from public.scheduled_actions
  where id = p_task_id
  for update;

  if not found or v_task.status <> 'pending' then
    raise exception 'Pending collection task not found.';
  end if;

  if v_task.schedule_id is null then
    raise exception 'This collection task is not linked to a single installment.';
  end if;

  select * into v_schedule
  from public.payment_schedule
  where id = v_task.schedule_id
  for update;

  if not found then
    raise exception 'Linked installment not found.';
  end if;

  if p_parts is null or jsonb_typeof(p_parts) <> 'array' then
    raise exception 'Add at least two committed payment parts.';
  end if;

  v_count := jsonb_array_length(p_parts);
  if v_count < 2 then
    raise exception 'Add at least two committed payment parts.';
  end if;

  select coalesce(sum(c.amount),0)
    into v_credit
  from public.credit_notes c
  where c.payment_schedule_id = v_schedule.id;

  v_outstanding := greatest(0,
    coalesce(v_schedule.due_amount,0)
    - coalesce(v_schedule.paid_amount,0)
    - coalesce(v_credit,0)
  );

  for v_item in select value from jsonb_array_elements(p_parts)
  loop
    v_idx := v_idx + 1;
    begin
      v_amount := round((v_item->>'amount')::numeric,2);
      v_date := (v_item->>'date')::date;
    exception when others then
      raise exception 'Check the amount and date for payment part %.', v_idx;
    end;

    if v_amount is null or v_amount <= 0 then
      raise exception 'Payment part % must have an amount above zero.', v_idx;
    end if;
    if v_date is null then
      raise exception 'Payment part % must have a commitment date.', v_idx;
    end if;
    if v_date < (now() at time zone 'Asia/Dubai')::date then
      raise exception 'Payment part % cannot be scheduled in the past.', v_idx;
    end if;

    v_total := v_total + v_amount;
  end loop;

  if abs(v_total - v_outstanding) > 0.01 then
    raise exception 'Committed amount (AED %) must equal the current outstanding amount (AED %).',
      trim(to_char(v_total,'FM999G999G999G990D00')),
      trim(to_char(v_outstanding,'FM999G999G999G990D00'));
  end if;

  update public.scheduled_actions a set status='cancelled',cancelled_at=now(),updated_at=now()
  where a.id<>v_task.id and a.status='pending' and a.workflow_kind='partial_payment_commitment'
  and a.schedule_id=v_schedule.id and a.transaction_id is null;

  update public.partial_payment_plans
     set status='cancelled', updated_at=now()
   where payment_schedule_id=v_schedule.id
     and status='active';

  insert into public.partial_payment_plans(
    unit_id,payment_schedule_id,source_task_id,status,note,created_by,created_at,updated_at
  ) values (
    v_task.unit_id,v_schedule.id,v_task.id,'active',
    nullif(btrim(coalesce(p_note,'')),''),
    v_owner,now(),now()
  )
  returning id into v_plan_id;

  v_idx := 0;
  for v_item in select value from jsonb_array_elements(p_parts)
  loop
    v_idx := v_idx + 1;
    v_amount := round((v_item->>'amount')::numeric,2);
    v_date := (v_item->>'date')::date;

    insert into public.partial_payment_plan_parts(
      plan_id,sequence_no,amount,commitment_date,paid_amount,status,created_at,updated_at
    ) values (
      v_plan_id,v_idx,v_amount,v_date,0,'pending',now(),now()
    )
    returning id into v_part_id;

    if v_idx > 1 then
      insert into public.scheduled_actions(unit_id,owner_id,action_label,due_date,priority,note,status,source,schedule_id,workflow_kind,commitment_part_id)
      values(v_task.unit_id,coalesce(v_task.owner_id,v_owner),'Follow up for Partial Payment',v_date,'Medium',
      'Part '||v_idx||' of '||v_count||' · AED '||v_amount||coalesce(' · '||p_note,''),'pending','manual',v_schedule.id,'partial_payment_commitment',v_part_id);
    end if;

    if v_idx = 1 then
      v_first_id := v_part_id;
      v_first_amount := v_amount;
      v_first_date := v_date;
    end if;
  end loop;

  v_note := 'Customer committed AED ' ||
    trim(to_char(v_first_amount,'FM999G999G999G990D00')) ||
    ' on ' || to_char(v_first_date,'DD Mon YYYY') ||
    ' · Part 1 of ' || v_count::text || '.';
  if nullif(btrim(coalesce(p_note,'')),'') is not null then
    v_note := v_note || ' ' || btrim(p_note);
  end if;

  update public.scheduled_actions
     set action_label='Follow up for Partial Payment',
         due_date=v_first_date,
         priority='Medium',
         note=v_note,
         source='manual',
         auto_kind=null,
         workflow_kind='partial_payment_commitment',
         commitment_part_id=v_first_id,
         transaction_id=null,
         status='pending',
         completed_at=null,
         completion_note=null,
         cancelled_at=null,
         updated_at=now()
   where id=v_task.id;

  return jsonb_build_object(
    'plan_id',v_plan_id,
    'task_id',v_task.id,
    'first_part_id',v_first_id,
    'parts',v_count,
    'committed_amount',v_total,
    'outstanding_amount',v_outstanding,
    'next_action','Follow up for Partial Payment'
  );
end;
$function$;


CREATE OR REPLACE FUNCTION public.crm_advance_payment_confirmation_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_amount numeric;
  v_type text;
  v_amount_text text;
  v_commitment_part_id bigint;
  v_part public.partial_payment_plan_parts%rowtype;
  v_plan public.partial_payment_plans%rowtype;
  v_next public.partial_payment_plan_parts%rowtype;
  v_new_paid numeric;
  v_remaining numeric;
  v_part_count integer;
begin
  if old.status <> 'pending'
     or new.status <> 'completed'
     or old.workflow_kind is null
     or old.transaction_id is null then
    return new;
  end if;

  select amount, payment_type, commitment_part_id
    into v_amount, v_type, v_commitment_part_id
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
      '. Send the official payment receipt to the customer.';
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

    if v_commitment_part_id is not null then
      select * into v_part
      from public.partial_payment_plan_parts
      where id=v_commitment_part_id
      for update;

      if found and v_part.status='pending' then
        select * into v_plan
        from public.partial_payment_plans
        where id=v_part.plan_id
        for update;

        v_new_paid := least(v_part.amount, coalesce(v_part.paid_amount,0) + greatest(0,coalesce(v_amount,0)));

        update public.partial_payment_plan_parts
           set paid_amount=v_new_paid,
               status=case when v_new_paid >= amount-0.01 then 'paid' else 'pending' end,
               updated_at=now()
         where id=v_part.id;

        if v_plan.status<>'active' then return new;end if;

        if v_new_paid < v_part.amount-0.01 then
          -- A separately scheduled part already owns this follow-up.
          if exists(select 1 from public.scheduled_actions a where a.id<>new.id and a.commitment_part_id=v_part.id and a.workflow_kind='partial_payment_commitment' and a.status='pending') then
            update public.scheduled_actions set note='Remaining partial payment: AED '||(v_part.amount-v_new_paid),updated_at=now()
            where id<>new.id and commitment_part_id=v_part.id and workflow_kind='partial_payment_commitment' and status='pending';
            return new;
          end if;
          v_remaining := greatest(0,v_part.amount-v_new_paid);
          select count(*) into v_part_count
          from public.partial_payment_plan_parts
          where plan_id=v_part.plan_id and status<>'cancelled';

          new.action_label := 'Follow up for Remaining Partial Payment';
          new.due_date := greatest(v_part.commitment_date,current_date);
          new.priority := 'High';
          new.note := 'AED ' || trim(to_char(v_remaining,'FM999G999G999G990D00')) ||
            ' remains from Part ' || v_part.sequence_no::text || ' of ' || v_part_count::text ||
            ' · originally committed for ' || to_char(v_part.commitment_date,'DD Mon YYYY') || '.';
          new.status := 'pending';
          new.completed_at := null;
          new.completion_note := null;
          new.cancelled_at := null;
          new.workflow_kind := 'partial_payment_commitment';
          new.transaction_id := null;
          new.commitment_part_id := v_part.id;
          new.schedule_id := v_plan.payment_schedule_id;
          new.source := 'manual';
          new.auto_kind := null;
          new.updated_at := now();
          return new;
        end if;

        update public.scheduled_actions set status='completed',completed_at=now(),completion_note='Promised part paid; receipt sent.',updated_at=now()
        where id<>new.id and commitment_part_id=v_part.id and workflow_kind='partial_payment_commitment' and status='pending';

        select * into v_next
        from public.partial_payment_plan_parts
        where plan_id=v_part.plan_id
          and status='pending'
        order by sequence_no
        limit 1
        for update;

        if found then
          if exists(select 1 from public.scheduled_actions a where a.id<>new.id and a.commitment_part_id=v_next.id and a.workflow_kind='partial_payment_commitment' and a.status='pending') then return new;end if;
          select count(*) into v_part_count
          from public.partial_payment_plan_parts
          where plan_id=v_part.plan_id and status<>'cancelled';

          new.action_label := 'Follow up for Partial Payment';
          new.due_date := v_next.commitment_date;
          new.priority := 'Medium';
          new.note := 'Customer committed AED ' ||
            trim(to_char(v_next.amount,'FM999G999G999G990D00')) ||
            ' on ' || to_char(v_next.commitment_date,'DD Mon YYYY') ||
            ' · Part ' || v_next.sequence_no::text || ' of ' || v_part_count::text || '.';
          new.status := 'pending';
          new.completed_at := null;
          new.completion_note := null;
          new.cancelled_at := null;
          new.workflow_kind := 'partial_payment_commitment';
          new.transaction_id := null;
          new.commitment_part_id := v_next.id;
          new.schedule_id := v_plan.payment_schedule_id;
          new.source := 'manual';
          new.auto_kind := null;
          new.updated_at := now();
          return new;
        else
          update public.partial_payment_plans
             set status='completed', updated_at=now()
           where id=v_part.plan_id;
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$function$;

revoke execute on function public.crm_create_partial_payment_commitment(bigint,jsonb,text) from public,anon;
grant execute on function public.crm_create_partial_payment_commitment(bigint,jsonb,text) to authenticated;
