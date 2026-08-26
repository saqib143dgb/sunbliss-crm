-- Rebalance at individual event level so edits/deletions preserve truthful audit history.
-- Same-installment correction events may offset each other for audit purposes, but only
-- carry originating from a different installment can settle a shortage.

create or replace function public.crm_rebalance_unit_carry(
  p_unit_id bigint,
  p_allocation_date date default current_date,
  p_reason text default 'Carry-forward recalculation'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pos record;
  v_neg record;
  v_pos_remaining numeric;
  v_neg_remaining numeric;
  v_amount numeric;
  v_created integer := 0;
  v_reversed integer := 0;
  v_balance numeric := 0;
begin
  if p_unit_id is null then
    raise exception 'Unit is required for carry-forward reconciliation.';
  end if;

  update public.carry_forward_allocations a
     set reversed_at = now(),
         reversed_by = auth.uid(),
         reversal_reason = coalesce(nullif(btrim(p_reason),''),'Carry-forward recalculation')
   where a.reversed_at is null
     and exists (
       select 1 from public.carry_forward_events e
       where e.id in (a.positive_event_id,a.negative_event_id)
         and e.unit_id = p_unit_id
     );
  get diagnostics v_reversed = row_count;

  create temporary table if not exists pg_temp.cf_event_residual(
    event_id bigint primary key,
    schedule_id bigint not null,
    event_date date not null,
    amount numeric not null,
    remaining numeric not null
  ) on commit drop;
  truncate pg_temp.cf_event_residual;

  insert into pg_temp.cf_event_residual(event_id,schedule_id,event_date,amount,remaining)
  select e.id,e.payment_schedule_id,e.event_date,round(e.amount,2),round(abs(e.amount),2)
  from public.carry_forward_events e
  where e.unit_id=p_unit_id and abs(e.amount)>=0.01;

  for v_pos in
    select * from pg_temp.cf_event_residual where amount>0 order by schedule_id,event_date,event_id
  loop
    for v_neg in
      select * from pg_temp.cf_event_residual
      where amount<0 and schedule_id=v_pos.schedule_id and remaining>=0.01
      order by event_date,event_id
    loop
      select remaining into v_pos_remaining from pg_temp.cf_event_residual where event_id=v_pos.event_id;
      exit when v_pos_remaining<0.01;
      select remaining into v_neg_remaining from pg_temp.cf_event_residual where event_id=v_neg.event_id;
      if v_neg_remaining<0.01 then continue; end if;
      v_amount:=least(v_pos_remaining,v_neg_remaining);
      insert into public.carry_forward_allocations(positive_event_id,negative_event_id,amount,allocation_date,created_by)
      values(v_pos.event_id,v_neg.event_id,v_amount,coalesce(p_allocation_date,current_date),auth.uid());
      v_created:=v_created+1;
      update pg_temp.cf_event_residual set remaining=round(remaining-v_amount,2) where event_id=v_pos.event_id;
      update pg_temp.cf_event_residual set remaining=round(remaining-v_amount,2) where event_id=v_neg.event_id;
    end loop;
  end loop;

  for v_pos in
    select * from pg_temp.cf_event_residual where amount>0 and remaining>=0.01 order by event_date,event_id
  loop
    for v_neg in
      select * from pg_temp.cf_event_residual
      where amount<0 and remaining>=0.01 and schedule_id<>v_pos.schedule_id
      order by event_date,event_id
    loop
      select remaining into v_pos_remaining from pg_temp.cf_event_residual where event_id=v_pos.event_id;
      exit when v_pos_remaining<0.01;
      select remaining into v_neg_remaining from pg_temp.cf_event_residual where event_id=v_neg.event_id;
      if v_neg_remaining<0.01 then continue; end if;
      v_amount:=least(v_pos_remaining,v_neg_remaining);
      insert into public.carry_forward_allocations(positive_event_id,negative_event_id,amount,allocation_date,created_by)
      values(v_pos.event_id,v_neg.event_id,v_amount,coalesce(p_allocation_date,current_date),auth.uid());
      v_created:=v_created+1;
      update pg_temp.cf_event_residual set remaining=round(remaining-v_amount,2) where event_id=v_pos.event_id;
      update pg_temp.cf_event_residual set remaining=round(remaining-v_amount,2) where event_id=v_neg.event_id;
    end loop;
  end loop;

  update public.payment_schedule ps set status=ps.status,updated_at=now() where ps.unit_id=p_unit_id;

  select round(coalesce(sum(e.amount),0),2) into v_balance
  from public.carry_forward_events e where e.unit_id=p_unit_id;

  return jsonb_build_object(
    'unit_id',p_unit_id,'unit_carry_forward',v_balance,
    'allocations_reversed',v_reversed,'allocations_created',v_created
  );
end;
$$;

create or replace function public.crm_set_payment_schedule_status_with_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credit numeric := 0;
  v_carry_applied numeric := 0;
  v_settled numeric := 0;
begin
  if new.id is not null then
    select coalesce(sum(cn.amount),0) into v_credit
    from public.credit_notes cn where cn.payment_schedule_id=new.id;

    select coalesce(sum(a.amount),0) into v_carry_applied
    from public.carry_forward_allocations a
    join public.carry_forward_events ne on ne.id=a.negative_event_id
    join public.carry_forward_events pe on pe.id=a.positive_event_id
    where ne.payment_schedule_id=new.id
      and pe.payment_schedule_id<>ne.payment_schedule_id
      and a.reversed_at is null;
  end if;

  v_settled:=coalesce(new.paid_amount,0)+v_credit+v_carry_applied;
  if new.due_amount is null then new.status:=coalesce(new.status,'Outstanding');
  elsif coalesce(new.due_amount,0)>0 and v_settled>=new.due_amount-0.01 then new.status:='Paid';
  elsif v_settled>0 then new.status:='Partial';
  else new.status:='Outstanding'; end if;
  return new;
end;
$$;

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
  v_credit numeric:=0;
  v_current_position numeric:=0;
  v_target_position numeric:=0;
  v_delta numeric:=0;
  v_event_id bigint;
  v_unit_balance numeric:=0;
  v_applied_to_schedule numeric:=0;
  v_rebalance jsonb;
begin
  select * into v_schedule from public.payment_schedule where id=p_schedule_id for update;
  if not found then raise exception 'Installment schedule not found.'; end if;

  select coalesce(sum(cn.amount),0) into v_credit
  from public.credit_notes cn where cn.payment_schedule_id=v_schedule.id;
  select coalesce(sum(e.amount),0) into v_current_position
  from public.carry_forward_events e where e.payment_schedule_id=v_schedule.id;

  if v_schedule.due_amount is null or v_schedule.due_amount<=0 then v_target_position:=0;
  elsif coalesce(v_schedule.paid_amount,0)>0 or v_credit>0 then
    v_target_position:=coalesce(v_schedule.paid_amount,0)+v_credit-v_schedule.due_amount;
  else v_target_position:=0; end if;

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
    v_schedule.unit_id,coalesce(p_event_date,current_date),coalesce(nullif(btrim(p_reason),''),'Carry-forward recalculation')
  );

  select round(coalesce(sum(e.amount),0),2) into v_unit_balance
  from public.carry_forward_events e where e.unit_id=v_schedule.unit_id;

  select round(coalesce(sum(a.amount),0),2) into v_applied_to_schedule
  from public.carry_forward_allocations a
  join public.carry_forward_events ne on ne.id=a.negative_event_id
  join public.carry_forward_events pe on pe.id=a.positive_event_id
  where ne.payment_schedule_id=v_schedule.id
    and pe.payment_schedule_id<>ne.payment_schedule_id
    and a.reversed_at is null;

  return jsonb_build_object(
    'schedule_id',v_schedule.id,'event_id',v_event_id,'event_delta',v_delta,
    'schedule_position',v_target_position,'carry_applied',v_applied_to_schedule,
    'unit_carry_forward',v_unit_balance,'rebalanced',v_rebalance
  );
end;
$$;
