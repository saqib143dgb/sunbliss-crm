-- Authorized 2026-10-19: initial cancellation officers may choose
-- Refunded / Forfeited / Split / No settlement. Never modify stored rows.
-- Preserve both functions' current privilege checks and original date handling.
-- "No settlement" records no disbursement, forfeiture, or retention.
CREATE OR REPLACE FUNCTION public.crm_cancel_unit(p_unit_id bigint, p_cancellation_date date, p_cancellation_type text, p_cancellation_reason text, p_settlement_type text, p_refund_amount numeric DEFAULT 0, p_forfeited_amount numeric DEFAULT 0, p_remarks text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_unit public.units%rowtype;
  v_amount_paid numeric := 0;
  v_cancel_id bigint;
  v_settlement text;
  v_refund numeric := 0;
  v_forfeited numeric := 0;
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

  select coalesce(sum(coalesce(ps.paid_amount,0)),0)
  into v_amount_paid
  from public.payment_schedule ps
  where ps.unit_id = v_unit.id
    and ps.customer_id = v_unit.customer_id;

  -- Respect the officer's explicit settlement choice. A pending settlement is
  -- recorded as unallocated, not silently treated as forfeiture.
  v_settlement := case lower(btrim(coalesce(p_settlement_type,'')))
    when 'refunded' then 'Refunded'
    when 'forfeited' then 'Forfeited'
    when 'split' then 'Split'
    when 'no settlement' then 'No settlement'
    else null
  end;
  if v_settlement is null then
    raise exception 'Select a valid treatment of money paid';
  end if;

  v_refund := coalesce(p_refund_amount,0);
  v_forfeited := coalesce(p_forfeited_amount,0);
  if v_refund < 0 or v_forfeited < 0 then
    raise exception 'Refunded and forfeited amounts cannot be negative';
  end if;
  if v_settlement = 'Refunded' then
    v_refund := v_amount_paid;
    v_forfeited := 0;
  elsif v_settlement = 'Forfeited' then
    v_refund := 0;
    v_forfeited := v_amount_paid;
  elsif v_settlement = 'No settlement' then
    v_refund := 0;
    v_forfeited := 0;
  else
    if abs((v_refund + v_forfeited) - v_amount_paid) > 0.01 then
      raise exception 'For a split settlement, refund plus forfeiture must equal the amount paid';
    end if;
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
    cancelled_sale_value,
    remarks,
    cancelled_by
  ) values (
    v_unit.customer_id,
    v_unit.id,
    coalesce(p_cancellation_date,current_date),
    btrim(p_cancellation_type),
    btrim(p_cancellation_reason),
    v_amount_paid,
    v_settlement,
    v_refund,
    v_forfeited,
    v_unit.total_price,
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
    'settlement_type', v_settlement,
    'refund_amount', v_refund,
    'forfeited_amount', v_forfeited,
    'cancelled_sale_value', v_unit.total_price,
    'unit_status', 'Cancelled'
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.crm_edit_cancelled_unit(p_cancelled_unit_id bigint, p_cancellation_date date, p_cancellation_type text, p_cancellation_reason text, p_amount_paid numeric, p_settlement_type text, p_refund_amount numeric, p_forfeited_amount numeric, p_retained_amount numeric, p_cancelled_sale_value numeric, p_remarks text, p_change_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_old public.cancelled_units%rowtype;
  v_new public.cancelled_units%rowtype;
  v_settlement text;
  v_paid numeric := coalesce(p_amount_paid,0);
  v_refund numeric := coalesce(p_refund_amount,0);
  v_forfeited numeric := coalesce(p_forfeited_amount,0);
  v_retained numeric := coalesce(p_retained_amount,0);
  v_adjustment_id bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  ) then
    raise exception 'Not authorized to edit cancelled units';
  end if;

  select * into v_old
  from public.cancelled_units
  where id = p_cancelled_unit_id
  for update;

  if not found then
    raise exception 'Cancelled unit record not found';
  end if;

  if length(btrim(coalesce(p_change_reason,''))) < 3 then
    raise exception 'Enter a short reason for this adjustment';
  end if;

  if v_paid < 0 or v_refund < 0 or v_forfeited < 0 or v_retained < 0 then
    raise exception 'Settlement amounts cannot be negative';
  end if;

  if p_cancelled_sale_value is not null and p_cancelled_sale_value <= 0 then
    raise exception 'Cancelled sale value must be greater than zero';
  end if;

  v_settlement := lower(btrim(coalesce(p_settlement_type,'')));
  if v_settlement not in ('forfeited','refunded','customer retained','split','no settlement') then
    raise exception 'Select a valid settlement outcome';
  end if;

  if v_settlement = 'forfeited' then
    v_refund := 0;
    v_retained := 0;
    v_forfeited := v_paid;
    v_settlement := 'Forfeited';
  elsif v_settlement = 'refunded' then
    v_forfeited := 0;
    v_retained := 0;
    v_refund := v_paid;
    v_settlement := 'Refunded';
  elsif v_settlement = 'customer retained' then
    v_forfeited := 0;
    v_refund := 0;
    v_retained := v_paid;
    v_settlement := 'Customer Retained';
  elsif v_settlement = 'no settlement' then
    v_forfeited := 0;
    v_refund := 0;
    v_retained := 0;
    v_settlement := 'No settlement';
  else
    if abs((v_refund + v_forfeited + v_retained) - v_paid) > 0.01 then
      raise exception 'Refunded, forfeited and retained amounts must equal the amount paid';
    end if;
    v_settlement := 'Split';
  end if;

  update public.cancelled_units
  set cancellation_date = p_cancellation_date,
      cancellation_type = nullif(btrim(coalesce(p_cancellation_type,'')),''),
      cancellation_reason = nullif(btrim(coalesce(p_cancellation_reason,'')),''),
      amount_paid = v_paid,
      settlement_type = v_settlement,
      refund_amount = v_refund,
      forfeited_amount = v_forfeited,
      retained_amount = v_retained,
      cancelled_sale_value = p_cancelled_sale_value,
      remarks = nullif(btrim(coalesce(p_remarks,'')),''),
      last_adjusted_at = now(),
      last_adjusted_by = auth.uid(),
      last_adjustment_reason = btrim(p_change_reason)
  where id = p_cancelled_unit_id
  returning * into v_new;

  insert into public.cancelled_unit_adjustments (
    cancelled_unit_id,
    changed_by,
    change_reason,
    old_values,
    new_values
  ) values (
    p_cancelled_unit_id,
    auth.uid(),
    btrim(p_change_reason),
    to_jsonb(v_old),
    to_jsonb(v_new)
  ) returning id into v_adjustment_id;

  return jsonb_build_object(
    'record', to_jsonb(v_new),
    'adjustment_id', v_adjustment_id
  );
end;
$function$
