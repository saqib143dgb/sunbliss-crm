-- Preserve revised customer requests made while approval is pending, without duplicate task creation.
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
  v_previous_request_id bigint;
  v_revision_no integer := 1;
  v_open public.payment_extension_requests%rowtype;
  v_open_task_id bigint;
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

  -- An existing effective extension remains in force until the new offer is accepted.

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

  -- Repeated or revised customer requests share the SAME pending workflow task.
  select * into v_open
  from public.payment_extension_requests r
  where r.payment_schedule_id=p_schedule_id
    and r.status in ('pending','clarification','offered','rejected')
  order by r.id desc limit 1 for update;

  if found then
    select t.id into v_open_task_id from public.scheduled_actions t
    where t.extension_request_id=v_open.id
      and t.status='pending'
      and t.workflow_kind in ('extension_approval','extension_clarification','extension_customer_confirmation')
    order by t.id desc limit 1 for update;

    if v_open_task_id is not null then
      if v_open.status in ('offered','rejected') then
        -- Re-request through the same customer confirmation task; retain the original decision.
        return public.crm_record_extension_customer_response(
          v_open_task_id,'rerequest',coalesce(nullif(btrim(p_reason),''),'Customer asked management to reconsider the requested date.'),
          p_requested_until,null
        );
      end if;

      if v_open.requested_until=p_requested_until then
        -- Same-date follow-up while management is deciding: no duplicate request/version.
        insert into public.payment_extension_request_events(request_id,event_type,notes,actor_id,details)
        values(v_open.id,'customer_follow_up',nullif(btrim(coalesce(p_reason,'')),''),v_owner,
         jsonb_build_object('requested_until',p_requested_until));
        return jsonb_build_object('request_id',v_open.id,'task_id',v_open_task_id,
          'requested_until',p_requested_until,'next_action','Existing Management Approval');
      end if;

      -- Changed date before decision: preserve old request as superseded.
      update public.payment_extension_requests set
        status='superseded',customer_response='rerequest',
        customer_responded_at=v_now,customer_response_note=nullif(btrim(coalesce(p_reason,'')),''),
        updated_at=v_now where id=v_open.id;
      insert into public.payment_extension_request_events(request_id,event_type,notes,actor_id,details)
      values(v_open.id,'superseded_before_management_decision',
        nullif(btrim(coalesce(p_reason,'')),''),v_owner,jsonb_build_object('new_requested_until',p_requested_until));
      v_task_id:=v_open_task_id;
    else
      raise exception 'An extension request already exists, but its active task could not be found. Contact the CRM administrator.';
    end if;
  end if;

  -- Reuse the current collection task for this exact installment when possible.
  if v_task_id is null then
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
  end if;

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

  select r.id, coalesce(r.revision_no,1)+1
    into v_previous_request_id, v_revision_no
  from public.payment_extension_requests r
  where r.payment_schedule_id=p_schedule_id
  order by r.id desc limit 1;
  v_revision_no := coalesce(v_revision_no,1);

  insert into public.payment_extension_requests(
    customer_id,unit_id,payment_schedule_id,source_task_id,
    original_due_date,requested_until,reason,status,requested_by,
    requested_at,created_at,updated_at,previous_request_id,revision_no
  ) values (
    v_schedule.customer_id,p_unit_id,p_schedule_id,v_task_id,
    v_schedule.due_date,p_requested_until,
    nullif(btrim(coalesce(p_reason,'')),''),
    'pending',v_owner,v_now,v_now,v_now,v_previous_request_id,v_revision_no
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

  insert into public.payment_extension_request_events(request_id,event_type,notes,actor_id,details)
  values (v_request_id,case when v_previous_request_id is null then 'requested' else 'rerequested' end,
    nullif(btrim(coalesce(p_reason,'')),''),v_owner,
    jsonb_build_object('requested_until',p_requested_until,'previous_request_id',v_previous_request_id,'revision_no',v_revision_no));

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