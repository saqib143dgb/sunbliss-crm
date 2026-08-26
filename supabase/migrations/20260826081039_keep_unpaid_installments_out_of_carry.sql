-- Carry-forward represents a variance created by an actual settlement event.
-- A completely unpaid installment remains normal Outstanding and must not become
-- a full negative carry-forward balance merely because no payment exists yet.

create or replace function public.crm_sync_schedule_carry(
  p_schedule_id bigint,
  p_event_date date default current_date,
  p_payment_transaction_id bigint default null,
  p_reason text default 'Payment variance'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule public.payment_schedule%rowtype;
  v_credit numeric := 0;
  v_current_position numeric := 0;
  v_target_position numeric := 0;
  v_delta numeric := 0;
  v_event_id bigint;
  v_unit_balance numeric := 0;
  v_applied_to_schedule numeric := 0;
  v_rebalance jsonb;
begin
  select * into v_schedule
  from public.payment_schedule
  where id=p_schedule_id
  for update;
  if not found then raise exception 'Installment schedule not found.'; end if;

  select coalesce(sum(cn.amount),0)
    into v_credit
    from public.credit_notes cn
   where cn.payment_schedule_id=v_schedule.id;

  select coalesce(sum(e.amount),0)
    into v_current_position
    from public.carry_forward_events e
   where e.payment_schedule_id=v_schedule.id;

  if v_schedule.due_amount is null or v_schedule.due_amount<=0 then
    v_target_position:=0;
  elsif coalesce(v_schedule.paid_amount,0)>0 or v_credit>0 then
    v_target_position:=coalesce(v_schedule.paid_amount,0)+v_credit-v_schedule.due_amount;
  else
    v_target_position:=0;
  end if;

  v_target_position:=round(v_target_position,2);
  v_current_position:=round(v_current_position,2);
  v_delta:=round(v_target_position-v_current_position,2);

  if abs(v_delta)>=0.01 then
    insert into public.carry_forward_events(
      customer_id,unit_id,payment_schedule_id,payment_transaction_id,event_date,amount,reason,created_by
    ) values (
      v_schedule.customer_id,v_schedule.unit_id,v_schedule.id,p_payment_transaction_id,
      coalesce(p_event_date,current_date),v_delta,coalesce(nullif(btrim(p_reason),''),'Payment variance'),auth.uid()
    ) returning id into v_event_id;
  end if;

  v_rebalance:=public.crm_rebalance_unit_carry(
    v_schedule.unit_id,
    coalesce(p_event_date,current_date),
    coalesce(nullif(btrim(p_reason),''),'Carry-forward recalculation')
  );

  select round(coalesce(sum(e.amount),0),2)
    into v_unit_balance
    from public.carry_forward_events e
   where e.unit_id=v_schedule.unit_id;

  select round(coalesce(sum(a.amount),0),2)
    into v_applied_to_schedule
    from public.carry_forward_allocations a
    join public.carry_forward_events ne on ne.id=a.negative_event_id
   where ne.payment_schedule_id=v_schedule.id
     and a.reversed_at is null;

  return jsonb_build_object(
    'schedule_id',v_schedule.id,
    'event_id',v_event_id,
    'event_delta',v_delta,
    'schedule_position',v_target_position,
    'carry_applied',v_applied_to_schedule,
    'unit_carry_forward',v_unit_balance,
    'rebalanced',v_rebalance
  );
end;
$$;

revoke all on function public.crm_sync_schedule_carry(bigint,date,bigint,text) from public,anon,authenticated;
