-- Reuse an existing manual installment task when a customer response becomes an extension request.
-- Prevents duplicate-key failures such as an existing "Call customer" task on the same payment schedule.

create or replace function public.crm_create_payment_extension_request(
  p_unit_id bigint,
  p_schedule_id bigint,
  p_requested_until date,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_schedule public.payment_schedule%rowtype;
  v_task_id bigint;
  v_request_id bigint;
  v_owner uuid := auth.uid();
  v_now timestamptz := now();
  v_credit numeric := 0;
  v_outstanding numeric := 0;
  v_note text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id=auth.uid()
      and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to create an extension request.';
  end if;

  if p_requested_until is null then
    raise exception 'Select the requested extension date.';
  end if;

  select * into v_schedule
  from public.payment_schedule
  where id=p_schedule_id
    and unit_id=p_unit_id
  for update;

  if not found then
    raise exception 'The selected installment was not found for this customer.';
  end if;

  if v_schedule.due_date is null then
    raise exception 'This installment has no contractual due date and cannot use the extension workflow.';
  end if;

  if p_requested_until <= v_schedule.due_date then
    raise exception 'Requested extension date must be later than the contractual due date.';
  end if;

  if exists (
    select 1 from public.payment_extensions e
    where e.payment_schedule_id=p_schedule_id
      and e.status='active'
  ) then
    raise exception 'This installment already has an active payment extension.';
  end if;

  if exists (
    select 1 from public.payment_extension_requests r
    where r.payment_schedule_id=p_schedule_id
      and r.status='pending'
  ) then
    raise exception 'An extension request for this installment is already awaiting approval.';
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

  -- Reuse the current collection task for this exact installment when possible.
  select a.id into v_task_id
  from public.scheduled_actions a
  where a.unit_id=p_unit_id
    and a.status='pending'
    and (
      a.schedule_id=p_schedule_id
      or a.auto_key like '%|schedule:'||p_schedule_id::text||'%'
      or a.auto_key like '%|schedules:%'||p_schedule_id::text||'%'
    )
    and (
      a.auto_kind in ('demand_letter','gentle_reminder','overdue_follow_up','extension_residual_overdue','extension_uncovered_overdue')
      or a.workflow_kind in ('promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment','payment_reported')
      or (
        a.source='manual'
        and (
          a.schedule_id=p_schedule_id
          or lower(coalesce(a.action_label,'')) ~ '(payment|installment|demand|reminder|outstanding|overdue|collection|call customer|follow up|follow-up)'
        )
      )
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
      p_unit_id,
      'Management Approval — Payment Extension',
      current_date,
      'High',
      null,
      'pending',
      v_owner,
      'manual',
      null,
      'manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
      p_schedule_id,
      null,
      'extension_approval',
      null,
      v_now,
      v_now
    )
    returning id into v_task_id;
  end if;

  insert into public.payment_extension_requests(
    customer_id,unit_id,payment_schedule_id,source_task_id,
    original_due_date,requested_until,reason,status,requested_by,
    requested_at,created_at,updated_at
  ) values (
    v_schedule.customer_id,p_unit_id,p_schedule_id,v_task_id,
    v_schedule.due_date,p_requested_until,
    nullif(btrim(coalesce(p_reason,'')),''),
    'pending',v_owner,v_now,v_now,v_now
  )
  returning id into v_request_id;

  v_note := 'Customer requested payment extension from ' ||
    to_char(v_schedule.due_date,'DD Mon YYYY') ||
    ' to ' || to_char(p_requested_until,'DD Mon YYYY') || '.';
  if nullif(btrim(coalesce(p_reason,'')),'') is not null then
    v_note := v_note || ' ' || btrim(p_reason);
  end if;

  update public.scheduled_actions
     set action_label='Management Approval — Payment Extension',
         due_date=current_date,
         priority='High',
         note=v_note,
         status='pending',
         owner_id=coalesce(owner_id,v_owner),
         source='manual',
         auto_kind=null,
         auto_key='manual_payment|unit:'||p_unit_id::text||'|schedule:'||p_schedule_id::text,
         schedule_id=p_schedule_id,
         transaction_id=null,
         workflow_kind='extension_approval',
         commitment_part_id=null,
         extension_request_id=v_request_id,
         completed_at=null,
         completion_note=null,
         cancelled_at=null,
         updated_at=v_now
   where id=v_task_id;

  -- One collection action for the installment while approval is pending.
  update public.scheduled_actions
     set status='cancelled',cancelled_at=v_now,updated_at=v_now
   where unit_id=p_unit_id
     and status='pending'
     and id<>v_task_id
     and (
       schedule_id=p_schedule_id
       or auto_key like '%|schedule:'||p_schedule_id::text||'%'
       or auto_key like '%|schedules:%'||p_schedule_id::text||'%'
     )
     and (
       auto_kind in ('demand_letter','gentle_reminder','overdue_follow_up','extension_residual_overdue','extension_uncovered_overdue')
       or workflow_kind in ('promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment','payment_reported')
     );

  -- A new extension request replaces an earlier split-payment promise for this installment.
  update public.partial_payment_plans
     set status='cancelled',updated_at=v_now
   where payment_schedule_id=p_schedule_id
     and status='active';

  return jsonb_build_object(
    'request_id',v_request_id,
    'task_id',v_task_id,
    'schedule_id',p_schedule_id,
    'requested_until',p_requested_until,
    'next_action','Management Approval — Payment Extension'
  );
end;
$function$;


grant execute on function public.crm_create_payment_extension_request(bigint,bigint,date,text) to authenticated;
