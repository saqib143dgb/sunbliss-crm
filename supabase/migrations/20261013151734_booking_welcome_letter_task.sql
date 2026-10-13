-- Save the booking payment and independent balance follow-up atomically.
CREATE OR REPLACE FUNCTION public.create_customer_sale_atomic(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_customer_id bigint;
  v_unit_id bigint;
  v_unit_no text;
  v_total_price numeric;
  v_booking_amount numeric;
  v_booking_date date;
  v_booking_payment_date date;
  v_source text;
  v_furnishing text;
  v_broker_name text;
  v_brokerage_percentage numeric;
  v_incentive_type text;
  v_stage jsonb;
  v_stage_amount numeric;
  v_stage_date date;
  v_down_payment_schedule_id bigint;
  v_payment_result jsonb;
  v_booking_tx_id bigint;
  v_balance numeric;
  v_followup_date date;
  v_balance_task_id bigint;
  v_welcome_task_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  v_unit_id := nullif(payload->>'unit_id','')::bigint;
  v_unit_no := nullif(btrim(payload->>'unit_no'),'');
  v_total_price := nullif(payload->>'total_price','')::numeric;
  v_booking_amount := coalesce(nullif(payload->>'booking_amount','')::numeric,0);
  v_booking_date := nullif(payload->>'booking_date','')::date;
  v_booking_payment_date := nullif(payload->>'booking_payment_date','')::date;
  v_source := nullif(btrim(payload->>'source'),'');
  v_furnishing := nullif(btrim(payload->>'furnishing_type'),'');
  v_broker_name := nullif(btrim(payload->>'broker_name'),'');
  v_brokerage_percentage := nullif(payload->>'brokerage_percentage','')::numeric;
  v_incentive_type := nullif(btrim(payload->>'incentive_type'),'');

  if nullif(btrim(payload->>'customer_name'),'') is null then
    raise exception 'Enter the customer''s name.';
  end if;
  if v_unit_id is null or v_unit_no is null then
    raise exception 'Select an available unit.';
  end if;
  if v_total_price is null or v_total_price <= 0 then
    raise exception 'Enter a valid total price.';
  end if;
  if v_source is null or v_source not in ('Broker','Direct','Individual Buyer') then
    raise exception 'Choose Broker, Direct or Individual Buyer as the sales channel.';
  end if;
  if v_furnishing is null or v_furnishing not in ('Fully Furnished','Semi Furnished') then
    raise exception 'Choose Fully Furnished or Semi Furnished.';
  end if;
  if v_booking_amount < 0 then
    raise exception 'Enter a valid booking amount.';
  end if;
  if v_booking_amount > 0 and v_booking_payment_date is null then
    raise exception 'Choose the booking payment date.';
  end if;

  if v_source='Broker' then
    if v_broker_name is null then
      raise exception 'Enter the broker name.';
    end if;
    if v_brokerage_percentage is null or v_brokerage_percentage <= 0 or v_brokerage_percentage > 100 then
      raise exception 'Enter a valid brokerage percentage between 0 and 100.';
    end if;
  elsif v_source='Individual Buyer' then
    if v_incentive_type is null or v_incentive_type not in ('Credit Voucher','Referral Voucher') then
      raise exception 'Choose Credit Voucher or Referral Voucher for the individual buyer.';
    end if;
    if v_brokerage_percentage is null or v_brokerage_percentage <= 0 or v_brokerage_percentage > 100 then
      raise exception 'Enter a valid voucher percentage between 0 and 100.';
    end if;
  end if;

  perform 1
    from public.units
   where id=v_unit_id
     and unit_no=v_unit_no
     and availability_status='Available'
   for update;

  if not found then
    raise exception 'That unit is no longer available. Refresh the form and choose another unit.';
  end if;

  insert into public.customers(
    customer_name, phone, email, nationality, designation, date_of_birth,
    passport_no, eid_no, address, permanent_address, co_applicant
  )
  values(
    nullif(btrim(payload->>'customer_name'),''),
    nullif(btrim(payload->>'phone'),''),
    nullif(btrim(payload->>'email'),''),
    nullif(btrim(payload->>'nationality'),''),
    nullif(btrim(payload->>'designation'),''),
    nullif(payload->>'date_of_birth','')::date,
    nullif(btrim(payload->>'passport_no'),''),
    nullif(btrim(payload->>'eid_no'),''),
    nullif(btrim(payload->>'address'),''),
    nullif(btrim(payload->>'permanent_address'),''),
    nullif(btrim(payload->>'co_applicant'),'')
  )
  returning id into v_customer_id;

  update public.units
     set customer_id=v_customer_id,
         unit_type=coalesce(nullif(btrim(payload->>'unit_type'),''),unit_type),
         floor=coalesce(nullif(btrim(payload->>'floor'),''),floor),
         area=coalesce(nullif(payload->>'area','')::numeric,area,unit_area_sqft),
         price_per_sqft=nullif(payload->>'price_per_sqft','')::numeric,
         total_price=v_total_price,
         status='Sold',
         availability_status='Sold',
         updated_at=now()
   where id=v_unit_id
     and availability_status='Available';

  if not found then
    raise exception 'That unit is no longer available.';
  end if;

  insert into public.sales(
    customer_id, unit_id, booking_date, booking_amount, sold_by, source,
    broker_name, broker_company, brokerage_percentage, brokerage_amount,
    incentive_type, individual_source_name, furniture_status
  )
  values(
    v_customer_id,
    v_unit_id,
    v_booking_date,
    nullif(payload->>'booking_amount','')::numeric,
    nullif(btrim(payload->>'sold_by'),''),
    v_source,
    case when v_source='Broker' then v_broker_name else null end,
    case when v_source='Broker' then nullif(btrim(payload->>'broker_company'),'') else null end,
    case when v_source in ('Broker','Individual Buyer') then v_brokerage_percentage else null end,
    case when v_source in ('Broker','Individual Buyer') then nullif(payload->>'brokerage_amount','')::numeric else null end,
    case when v_source='Individual Buyer' then v_incentive_type else null end,
    case when v_source='Individual Buyer' then nullif(btrim(payload->>'individual_source_name'),'') else null end,
    v_furnishing
  );

  for v_stage in
    select value from jsonb_array_elements(coalesce(payload->'schedule','[]'::jsonb))
  loop
    v_stage_amount := nullif(v_stage->>'due_amount','')::numeric;
    v_stage_date := nullif(v_stage->>'due_date','')::date;
    if v_stage_amount is not null and v_stage_amount > 0 then
      if nullif(btrim(v_stage->>'stage_name'),'') is null then
        raise exception 'A payment stage is missing its name.';
      end if;

      insert into public.payment_schedule(
        customer_id, unit_id, stage_name, due_amount, due_date, paid_amount, status
      )
      values(
        v_customer_id,
        v_unit_id,
        btrim(v_stage->>'stage_name'),
        v_stage_amount,
        v_stage_date,
        0,
        'Outstanding'
      )
      returning id into v_down_payment_schedule_id;

      if lower(btrim(v_stage->>'stage_name')) <> 'down payment' then
        v_down_payment_schedule_id := null;
      end if;

      if lower(btrim(v_stage->>'stage_name')) = 'down payment' then
        -- keep the exact Down Payment schedule id for booking allocation
        null;
      end if;
    end if;
  end loop;

  insert into public.scheduled_actions(unit_id,action_label,due_date,priority,note,status,owner_id,source,auto_key)
  values(v_unit_id,'Send Welcome Letter',(now() at time zone 'Asia/Dubai')::date,'Medium',
    'Send the Welcome Letter to the customer before sending the payment receipt.',
    'pending',auth.uid(),'manual','booking_welcome|unit:' || v_unit_id || '|customer:' || v_customer_id)
  returning id into v_welcome_task_id;

  if v_booking_amount > 0 then
    select id into v_down_payment_schedule_id
      from public.payment_schedule
     where customer_id=v_customer_id
       and unit_id=v_unit_id
       and lower(btrim(stage_name))='down payment'
     order by id
     limit 1;

    if v_down_payment_schedule_id is null then
      raise exception 'A Down Payment installment is required when a booking amount is entered.';
    end if;

    v_payment_result := public.crm_record_payment_with_credit_note(
      v_down_payment_schedule_id,
      v_booking_amount,
      v_booking_payment_date,
      null,
      'Auto-recorded from New Customer booking amount',
      0,
      null,
      null,
      null
    );

    v_booking_tx_id := nullif(v_payment_result->>'transaction_id','')::bigint;

    if v_booking_tx_id is not null then
      update public.payment_transactions
         set payment_type='Booking Amount',
             remarks='Auto-recorded from New Customer booking amount'
       where id=v_booking_tx_id;
    end if;
  end if;

  if payload->>'booking_payment_status' = 'partial' then
    select greatest(0,coalesce(revised_due_amount,due_amount)-coalesce(paid_amount,0))
      into v_balance from public.payment_schedule
      where id=v_down_payment_schedule_id;
    if v_booking_amount <= 0 or coalesce(v_balance,0) <= 0 then
      raise exception 'Partial booking amount must be greater than zero and less than the Down Payment.';
    end if;
    v_followup_date := nullif(payload->>'balance_followup_date','')::date;
    if v_followup_date is null then
      raise exception 'Balance follow-up date is missing.';
    end if;
    if nullif(btrim(payload->>'partial_booking_note'),'') is null then
      raise exception 'Partial Booking Note is missing. Enter a note or a dash.';
    end if;
    update public.sales set partial_booking_note=btrim(payload->>'partial_booking_note')
      where unit_id=v_unit_id and customer_id=v_customer_id;
    insert into public.scheduled_actions(
      unit_id,action_label,due_date,priority,note,status,owner_id,
      source,auto_key,schedule_id,workflow_kind
    ) values (
      v_unit_id,'Follow Up — Remaining Down Payment · AED ' || to_char(v_balance,'FM999G999G999G990D00'),
      v_followup_date,'Medium','Partial Booking Note: ' || btrim(payload->>'partial_booking_note'),
      'pending',auth.uid(),'manual',
      'booking_balance|unit:' || v_unit_id || '|schedule:' || v_down_payment_schedule_id,
      v_down_payment_schedule_id,'payment_follow_up'
    ) returning id into v_balance_task_id;
  end if;

  return jsonb_build_object(
    'welcome_task_id',v_welcome_task_id,
    'balance_task_id',v_balance_task_id,
    'customer_id',v_customer_id,
    'unit_id',v_unit_id,
    'unit_no',v_unit_no,
    'booking_transaction_id',v_booking_tx_id,
    'down_payment_schedule_id',v_down_payment_schedule_id
  );
end;
$function$;



-- Confirmation with Accounts may proceed while the Welcome Letter is pending.
-- Only marking the receipt sent waits for completion of the Welcome Letter.
create or replace function crm_private.require_booking_welcome_before_receipt()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.workflow_kind='payment_receipt' and old.status='pending' and new.status='completed'
     and exists(select 1 from public.scheduled_actions w
       join public.payment_transactions t on t.id=old.transaction_id
       where w.auto_key='booking_welcome|unit:' || t.unit_id || '|customer:' || t.customer_id
         and w.status='pending') then
    raise exception 'Send the Welcome Letter and mark its task as sent before completing the payment receipt.';
  end if;
  return new;
end;
$$;
revoke all on function crm_private.require_booking_welcome_before_receipt() from public, anon, authenticated;
create trigger zz_require_booking_welcome_before_receipt
  before update of status on public.scheduled_actions
  for each row execute function crm_private.require_booking_welcome_before_receipt();
