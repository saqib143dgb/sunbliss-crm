-- Split commitments use the effective installment amount after approved revisions.
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
    coalesce(v_schedule.revised_due_amount,v_schedule.due_amount,0)
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


