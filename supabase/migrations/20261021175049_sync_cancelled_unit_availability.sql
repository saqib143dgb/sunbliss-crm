-- Synchronize physical inventory with cancellation status at the database root.
-- Protect cancellation bookkeeping, existing sales, credits, and original customer history.
-- The RPC remains the only official cancellation entry point.
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
      -- A blocked unit stays blocked; all other cancelled bookings return to resale inventory.
      availability_status = case when v_unit.availability_status = 'Blocked' then 'Blocked' else 'Available' end,
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
$function$;

-- Guard cancellation from any other writer that changes public.units.status.
-- On cancellation, keep intentionally Blocked stock blocked; otherwise release it.
CREATE OR REPLACE FUNCTION crm_private.sync_cancelled_unit_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'pg_temp'
AS $trigger$
BEGIN
  IF NEW.status = 'Cancelled' AND NEW.availability_status IS DISTINCT FROM 'Blocked' THEN
    NEW.availability_status := 'Available';
  END IF;
  RETURN NEW;
END;
$trigger$;

REVOKE ALL ON FUNCTION crm_private.sync_cancelled_unit_availability() FROM PUBLIC;

CREATE TRIGGER sync_cancelled_unit_availability
BEFORE UPDATE OF status ON public.units
FOR EACH ROW
WHEN (NEW.status = 'Cancelled')
EXECUTE FUNCTION crm_private.sync_cancelled_unit_availability();

-- Align the historical mismatch only; preserve cancellation and sale records.
UPDATE public.units u
SET availability_status = 'Available',
    updated_at = now()
WHERE u.status = 'Cancelled'
  AND u.availability_status = 'Sold'
  AND EXISTS (SELECT 1 FROM public.cancelled_units cu WHERE cu.unit_id = u.id);
