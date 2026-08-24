alter table public.cancelled_units
  add column if not exists amount_paid numeric not null default 0,
  add column if not exists cancellation_type text,
  add column if not exists settlement_type text,
  add column if not exists forfeited_amount numeric not null default 0,
  add column if not exists cancelled_by uuid;

update public.cancelled_units cu
set amount_paid = coalesce(
  (select sum(coalesce(ps.paid_amount, 0)) from public.payment_schedule ps where ps.unit_id = cu.unit_id and ps.customer_id = cu.customer_id),
  cu.refund_amount,
  0
)
where coalesce(cu.amount_paid, 0) = 0;

update public.cancelled_units
set settlement_type = case
  when coalesce(refund_amount,0) > 0 then 'Refunded'
  when coalesce(forfeited_amount,0) > 0 then 'Forfeited'
  else 'No settlement'
end
where settlement_type is null;

create or replace function public.crm_cancel_unit(
  p_unit_id bigint,
  p_cancellation_date date,
  p_cancellation_type text,
  p_cancellation_reason text,
  p_settlement_type text,
  p_refund_amount numeric default 0,
  p_forfeited_amount numeric default 0,
  p_remarks text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_unit public.units%rowtype;
  v_amount_paid numeric := 0;
  v_refund numeric := greatest(coalesce(p_refund_amount,0),0);
  v_forfeited numeric := greatest(coalesce(p_forfeited_amount,0),0);
  v_cancel_id bigint;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::user_role
  ) then
    raise exception 'Not authorized to cancel units';
  end if;

  select * into v_unit
  from public.units
  where id = p_unit_id
  for update;

  if not found then
    raise exception 'Unit not found';
  end if;

  if lower(coalesce(v_unit.status,'')) = 'cancelled' then
    raise exception 'This unit is already cancelled';
  end if;

  if v_unit.customer_id is null then
    raise exception 'This unit has no customer linked to it';
  end if;

  if nullif(btrim(coalesce(p_cancellation_type,'')),'') is null then
    raise exception 'Select a cancellation reason category';
  end if;

  if length(btrim(coalesce(p_cancellation_reason,''))) < 5 then
    raise exception 'Enter a clear cancellation reason';
  end if;

  if p_settlement_type not in ('Refunded','Forfeited','Split','No settlement') then
    raise exception 'Select how the money paid is being treated';
  end if;

  select coalesce(sum(coalesce(ps.paid_amount,0)),0)
  into v_amount_paid
  from public.payment_schedule ps
  where ps.unit_id = v_unit.id
    and ps.customer_id = v_unit.customer_id;

  if v_refund + v_forfeited > v_amount_paid + 0.01 then
    raise exception 'Refunded plus forfeited amount cannot exceed amount paid (%)', v_amount_paid;
  end if;

  if p_settlement_type = 'Refunded' and v_forfeited > 0 then
    raise exception 'Refunded settlement cannot include a forfeited amount';
  elsif p_settlement_type = 'Forfeited' and v_refund > 0 then
    raise exception 'Forfeited settlement cannot include a refund';
  elsif p_settlement_type = 'No settlement' and (v_refund > 0 or v_forfeited > 0) then
    raise exception 'No settlement must have zero refund and forfeited amounts';
  end if;

  insert into public.cancelled_units (
    customer_id,
    unit_id,
    cancellation_date,
    cancellation_type,
    cancellation_reason,
    amount_paid,
    settlement_type,
    refund_amount,
    forfeited_amount,
    remarks,
    cancelled_by
  ) values (
    v_unit.customer_id,
    v_unit.id,
    coalesce(p_cancellation_date,current_date),
    btrim(p_cancellation_type),
    btrim(p_cancellation_reason),
    v_amount_paid,
    p_settlement_type,
    v_refund,
    v_forfeited,
    nullif(btrim(coalesce(p_remarks,'')),''),
    auth.uid()
  ) returning id into v_cancel_id;

  update public.units
  set status = 'Cancelled',
      updated_at = now()
  where id = v_unit.id;

  return jsonb_build_object(
    'cancelled_unit_id', v_cancel_id,
    'unit_id', v_unit.id,
    'customer_id', v_unit.customer_id,
    'amount_paid', v_amount_paid,
    'settlement_type', p_settlement_type,
    'refund_amount', v_refund,
    'forfeited_amount', v_forfeited,
    'unit_status', 'Cancelled'
  );
end;
$$;

revoke all on function public.crm_cancel_unit(bigint,date,text,text,text,numeric,numeric,text) from public;
revoke all on function public.crm_cancel_unit(bigint,date,text,text,text,numeric,numeric,text) from anon;
grant execute on function public.crm_cancel_unit(bigint,date,text,text,text,numeric,numeric,text) to authenticated;
