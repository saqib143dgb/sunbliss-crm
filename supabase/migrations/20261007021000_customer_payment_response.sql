-- Universal customer payment response workflow.
-- Allows CRM staff to record a customer response immediately after any collection communication.

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
      'payment_review',
      'partial_payment_commitment',
      'payment_reported'
    )
  );

create or replace function public.crm_record_customer_payment_response(
  p_unit_id bigint,
  p_schedule_id bigint,
  p_outcome text,
  p_note text default null,
  p_next_date date default null,
  p_parts jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_schedule public.payment_schedule%rowtype;
  v_task_id bigint;
  v_owner uuid := auth.uid();
  v_now timestamptz := now();
  v_credit numeric := 0;
  v_outstanding numeric := 0;
  v_next_action text;
  v_partial jsonb;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to record a customer payment response.';
  end if;

  if p_outcome not in (
    'payment_reported',
    'will_pay_later',
    'partial_payment_commitment',
    'payment_issue',
    'no_response'
  ) then
    raise exception 'Select a valid customer response.';
  end if;

  select * into v_schedule
  from public.payment_schedule
  where id=p_schedule_id and unit_id=p_unit_id
  for update;

  if not found then
    raise exception 'The selected installment was not found for this customer.';
  end if;

  if exists (
    select 1
    from public.scheduled_actions a
    where a.unit_id=p_unit_id
      and a.schedule_id=p_schedule_id
      and a.status='pending'
      and a.workflow_kind in ('accounts_confirmation','cheque_clearance','payment_receipt')
  ) then
    raise exception 'This installment already has an active payment verification or receipt workflow. Complete that workflow first.';
  end if;

  select coalesce(sum(c.amount),0)
    into v_credit
  from public.credit_notes c
  where c.payment_schedule_id=p_schedule_id;

  v_outstanding := greatest(
    0,
    coalesce(v_schedule.due_amount,0)
      - coalesce(v_schedule.paid_amount,0)
      - coalesce(v_credit,0)
  );

  if v_outstanding <= 0.01 then
    raise exception 'This installment is already settled.';
  end if;

  -- Prefer reusing the one exact pending collection task for this installment.
  select a.id into v_task_id
  from public.scheduled_actions a
  where a.unit_id=p_unit_id
    and a.schedule_id=p_schedule_id
    and a.status='pending'
    and (
      a.auto_kind in ('demand_letter','gentle_reminder','overdue_follow_up','extension_residual_overdue','extension_uncovered_overdue')
      or a.workflow_kind in ('promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment','payment_reported')
    )
  order by
    case when a.source='manual' then 0 else 1 end,
    a.id desc
  limit 1
  for update;

  if v_task_id is null then
    insert into public.scheduled_actions(
      unit_id,action_label,due_date,priority,note,status,owner_id,
      source,auto_kind,auto_key,schedule_id,transaction_id,workflow_kind,
      commitment_part_id,created_at,updated_at
    ) values (
      p_unit_id,'Payment Follow-up with Customer',current_date,'Medium',
      null,'pending',v_owner,'manual',null,
      'manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
      p_schedule_id,null,'payment_follow_up',null,v_now,v_now
    )
    returning id into v_task_id;
  else
    -- Cancel any other exact duplicate collection tasks for this installment.
    update public.scheduled_actions
       set status='cancelled',cancelled_at=v_now,updated_at=v_now
     where unit_id=p_unit_id
       and schedule_id=p_schedule_id
       and status='pending'
       and id<>v_task_id
       and (
         auto_kind in ('demand_letter','gentle_reminder','overdue_follow_up','extension_residual_overdue','extension_uncovered_overdue')
         or workflow_kind in ('promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment','payment_reported')
       );
  end if;

  if p_outcome <> 'partial_payment_commitment' then
    update public.partial_payment_plans
       set status='cancelled',updated_at=v_now
     where payment_schedule_id=p_schedule_id
       and status='active';
  end if;

  if p_outcome='payment_reported' then
    update public.scheduled_actions
       set action_label='Record Payment',
           due_date=current_date,
           priority='High',
           note=coalesce(nullif(btrim(coalesce(p_note,'')),''),'Customer reported that payment has been made. Record the payment and select the confirmation source.'),
           status='pending',
           owner_id=coalesce(owner_id,v_owner),
           source='manual',
           auto_kind=null,
           auto_key='manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
           schedule_id=p_schedule_id,
           transaction_id=null,
           workflow_kind='payment_reported',
           commitment_part_id=null,
           completed_at=null,
           completion_note=null,
           cancelled_at=null,
           updated_at=v_now
     where id=v_task_id;
    v_next_action := 'Record Payment';

  elsif p_outcome='will_pay_later' then
    if p_next_date is null then
      raise exception 'Select the promised payment date.';
    end if;
    if p_next_date < current_date then
      raise exception 'The promised payment date cannot be in the past.';
    end if;

    update public.scheduled_actions
       set action_label='Follow up on Promised Payment',
           due_date=p_next_date,
           priority='Medium',
           note=coalesce(
             nullif(btrim(coalesce(p_note,'')),''),
             'Customer committed to pay the outstanding amount on '||to_char(p_next_date,'DD Mon YYYY')||'.'
           ),
           status='pending',
           owner_id=coalesce(owner_id,v_owner),
           source='manual',
           auto_kind=null,
           auto_key='manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
           schedule_id=p_schedule_id,
           transaction_id=null,
           workflow_kind='promise_follow_up',
           commitment_part_id=null,
           completed_at=null,
           completion_note=null,
           cancelled_at=null,
           updated_at=v_now
     where id=v_task_id;
    v_next_action := 'Follow up on Promised Payment';

  elsif p_outcome='payment_issue' then
    update public.scheduled_actions
       set action_label='Resolve Payment Query',
           due_date=current_date,
           priority='High',
           note=coalesce(
             nullif(btrim(coalesce(p_note,'')),''),
             'Resolve the customer payment query before continuing normal collection follow-up.'
           ),
           status='pending',
           owner_id=coalesce(owner_id,v_owner),
           source='manual',
           auto_kind=null,
           auto_key='manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
           schedule_id=p_schedule_id,
           transaction_id=null,
           workflow_kind='payment_query',
           commitment_part_id=null,
           completed_at=null,
           completion_note=null,
           cancelled_at=null,
           updated_at=v_now
     where id=v_task_id;
    v_next_action := 'Resolve Payment Query';

  elsif p_outcome='no_response' then
    if p_next_date is null then
      raise exception 'Select the next follow-up date.';
    end if;
    if p_next_date < current_date then
      raise exception 'The next follow-up date cannot be in the past.';
    end if;

    update public.scheduled_actions
       set action_label='Payment Follow-up with Customer',
           due_date=p_next_date,
           priority='High',
           note=coalesce(
             nullif(btrim(coalesce(p_note,'')),''),
             'No response. Follow up with the customer again on '||to_char(p_next_date,'DD Mon YYYY')||'.'
           ),
           status='pending',
           owner_id=coalesce(owner_id,v_owner),
           source='manual',
           auto_kind=null,
           auto_key='manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
           schedule_id=p_schedule_id,
           transaction_id=null,
           workflow_kind='payment_follow_up',
           commitment_part_id=null,
           completed_at=null,
           completion_note=null,
           cancelled_at=null,
           updated_at=v_now
     where id=v_task_id;
    v_next_action := 'Payment Follow-up with Customer';

  else
    if p_parts is null then
      raise exception 'Add the committed payment parts.';
    end if;

    v_partial := public.crm_create_partial_payment_commitment(
      v_task_id,
      p_parts,
      p_note
    );
    v_next_action := coalesce(v_partial->>'next_action','Follow up for Partial Payment');
  end if;

  return jsonb_build_object(
    'task_id',v_task_id,
    'unit_id',p_unit_id,
    'schedule_id',p_schedule_id,
    'outcome',p_outcome,
    'outstanding_amount',v_outstanding,
    'next_action',v_next_action
  ) || case when v_partial is not null
            then jsonb_build_object('partial_payment',v_partial)
            else '{}'::jsonb end;
end;
$function$;

grant execute on function public.crm_record_customer_payment_response(bigint,bigint,text,text,date,jsonb) to authenticated;
