-- Treat DLD + Admin Fees as a cash-only part of the 24% pre-SPA payment gate.
-- Existing DLD credit notes are retained as immutable history, but no longer settle DLD.

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
    if not (lower(coalesce(new.stage_name,'')) like '%dld%'
            or lower(coalesce(new.stage_name,'')) like '%admin fee%') then
      select coalesce(sum(cn.amount),0)
        into v_credit
        from public.credit_notes cn
       where cn.payment_schedule_id = new.id;
    end if;

    select coalesce(sum(a.amount),0)
      into v_carry_applied
      from public.carry_forward_allocations a
      join public.carry_forward_events ne on ne.id = a.negative_event_id
      join public.carry_forward_events pe on pe.id = a.positive_event_id
     where ne.payment_schedule_id = new.id
       and pe.payment_schedule_id <> ne.payment_schedule_id
       and a.reversed_at is null;
  end if;

  v_settled := coalesce(new.paid_amount,0) + v_credit + v_carry_applied;

  if new.due_amount is null then
    new.status := coalesce(new.status,'Outstanding');
  elsif coalesce(new.due_amount,0) > 0 and v_settled >= new.due_amount - 1 then
    new.status := 'Paid';
  elsif v_settled > 0 then
    new.status := 'Partial';
  else
    new.status := 'Outstanding';
  end if;
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
  v_credit numeric := 0;
  v_current_position numeric := 0;
  v_raw_position numeric := 0;
  v_target_position numeric := 0;
  v_delta numeric := 0;
  v_event_id bigint;
  v_unit_balance numeric := 0;
  v_applied_to_schedule numeric := 0;
  v_rebalance jsonb;
  v_is_dld boolean := false;
begin
  select * into v_schedule
    from public.payment_schedule
   where id = p_schedule_id
   for update;
  if not found then raise exception 'Installment schedule not found.'; end if;

  v_is_dld := lower(coalesce(v_schedule.stage_name,'')) like '%dld%'
              or lower(coalesce(v_schedule.stage_name,'')) like '%admin fee%';

  if not v_is_dld then
    select coalesce(sum(cn.amount),0)
      into v_credit
      from public.credit_notes cn
     where cn.payment_schedule_id = v_schedule.id;
  end if;

  select coalesce(sum(e.amount),0)
    into v_current_position
    from public.carry_forward_events e
   where e.payment_schedule_id = v_schedule.id;

  if v_schedule.due_amount is null or v_schedule.due_amount <= 0 then
    v_raw_position := 0;
  elsif coalesce(v_schedule.paid_amount,0) > 0 or v_credit > 0 then
    v_raw_position := coalesce(v_schedule.paid_amount,0) + v_credit - v_schedule.due_amount;
  else
    v_raw_position := 0;
  end if;

  v_raw_position := round(v_raw_position,2);
  if v_raw_position < -5000 then
    v_target_position := 0;
  else
    v_target_position := v_raw_position;
  end if;

  v_current_position := round(v_current_position,2);
  v_target_position := round(v_target_position,2);
  v_delta := round(v_target_position-v_current_position,2);

  if abs(v_delta) >= 0.01 then
    insert into public.carry_forward_events(
      customer_id,unit_id,payment_schedule_id,payment_transaction_id,event_date,amount,reason,created_by
    ) values (
      v_schedule.customer_id,v_schedule.unit_id,v_schedule.id,p_payment_transaction_id,
      coalesce(p_event_date,current_date),v_delta,
      coalesce(nullif(btrim(p_reason),''),'Payment variance'),auth.uid()
    ) returning id into v_event_id;
  end if;

  v_rebalance := public.crm_rebalance_unit_carry(
    v_schedule.unit_id,coalesce(p_event_date,current_date),
    coalesce(nullif(btrim(p_reason),''),'Carry-forward recalculation')
  );

  select round(coalesce(sum(e.amount),0),2)
    into v_unit_balance
    from public.carry_forward_events e
   where e.unit_id = v_schedule.unit_id;

  select round(coalesce(sum(a.amount),0),2)
    into v_applied_to_schedule
    from public.carry_forward_allocations a
    join public.carry_forward_events ne on ne.id = a.negative_event_id
    join public.carry_forward_events pe on pe.id = a.positive_event_id
   where ne.payment_schedule_id = v_schedule.id
     and pe.payment_schedule_id <> ne.payment_schedule_id
     and a.reversed_at is null;

  return jsonb_build_object(
    'schedule_id',v_schedule.id,
    'event_id',v_event_id,
    'event_delta',v_delta,
    'schedule_position',v_raw_position,
    'carry_position',v_target_position,
    'carry_applied',v_applied_to_schedule,
    'unit_carry_forward',v_unit_balance,
    'rebalanced',v_rebalance
  );
end;
$$;

create or replace function public.crm_reject_dld_credit_notes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_name text;
begin
  select ps.stage_name into v_stage_name
    from public.payment_schedule ps
   where ps.id = new.payment_schedule_id;

  if lower(coalesce(v_stage_name,'')) like '%dld%'
     or lower(coalesce(v_stage_name,'')) like '%admin fee%' then
    raise exception 'DLD + Admin Fees must be settled in cash. Credit notes cannot be applied to this stage.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reject_dld_credit_notes on public.credit_notes;
create trigger trg_reject_dld_credit_notes
before insert or update on public.credit_notes
for each row execute function public.crm_reject_dld_credit_notes();

create or replace function public.crm_sync_first_and_dld_due_dates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := lower(coalesce(new.stage_name,''));
begin
  if v_name like '%dld%' or v_name like '%admin fee%' then
    update public.payment_schedule
       set due_date = new.due_date,
           updated_at = now()
     where unit_id = new.unit_id
       and id <> new.id
       and lower(coalesce(stage_name,'')) like '%installment%'
       and lower(coalesce(stage_name,'')) ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)'
       and due_date is distinct from new.due_date;
  elsif v_name like '%installment%'
        and v_name ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)' then
    update public.payment_schedule
       set due_date = new.due_date,
           updated_at = now()
     where unit_id = new.unit_id
       and id <> new.id
       and (lower(coalesce(stage_name,'')) like '%dld%'
            or lower(coalesce(stage_name,'')) like '%admin fee%')
       and due_date is distinct from new.due_date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_first_and_dld_due_dates on public.payment_schedule;
create trigger trg_sync_first_and_dld_due_dates
after insert or update of unit_id,stage_name,due_date on public.payment_schedule
for each row execute function public.crm_sync_first_and_dld_due_dates();

-- The 1st Installment date is canonical for existing records.
update public.payment_schedule dld
   set due_date = first_inst.due_date,
       updated_at = now()
  from public.payment_schedule first_inst
 where dld.unit_id = first_inst.unit_id
   and (lower(coalesce(dld.stage_name,'')) like '%dld%'
        or lower(coalesce(dld.stage_name,'')) like '%admin fee%')
   and lower(coalesce(first_inst.stage_name,'')) like '%installment%'
   and lower(coalesce(first_inst.stage_name,'')) ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)'
   and dld.due_date is distinct from first_inst.due_date;

create or replace function public.crm_enforce_spa_payment_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blockers text;
begin
  if lower(btrim(coalesce(new.spa_status,''))) <> 'signed' then
    return new;
  end if;
  if tg_op = 'UPDATE' and lower(btrim(coalesce(old.spa_status,''))) = 'signed' then
    return new;
  end if;

  with required(kind,label) as (
    values ('dp','Down Payment'),('first','1st Installment'),('dld','DLD + Admin Fees')
  ), stage_rows as (
    select ps.id,ps.due_amount,ps.paid_amount,
      case
        when lower(coalesce(ps.stage_name,'')) like '%dld%'
          or lower(coalesce(ps.stage_name,'')) like '%admin fee%' then 'dld'
        when lower(coalesce(ps.stage_name,'')) like '%down payment%' then 'dp'
        when lower(coalesce(ps.stage_name,'')) like '%installment%'
          and lower(coalesce(ps.stage_name,'')) ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)' then 'first'
        else null
      end as kind
    from public.payment_schedule ps
    where ps.unit_id = new.unit_id
  ), credits as (
    select cn.payment_schedule_id,sum(cn.amount) amount
    from public.credit_notes cn
    join stage_rows sr on sr.id = cn.payment_schedule_id
    group by cn.payment_schedule_id
  ), carry as (
    select ne.payment_schedule_id,sum(a.amount) amount
    from public.carry_forward_allocations a
    join public.carry_forward_events ne on ne.id = a.negative_event_id
    join public.carry_forward_events pe on pe.id = a.positive_event_id
    join stage_rows sr on sr.id = ne.payment_schedule_id
    where a.reversed_at is null
      and pe.payment_schedule_id <> ne.payment_schedule_id
    group by ne.payment_schedule_id
  ), balances as (
    select r.kind,r.label,count(sr.id) schedule_count,
      round(coalesce(sum(greatest(0,
        coalesce(sr.due_amount,0)-coalesce(sr.paid_amount,0)
        -case when r.kind='dld' then 0 else coalesce(cr.amount,0) end
        -coalesce(ca.amount,0)
      )),0),2) remaining
    from required r
    left join stage_rows sr on sr.kind = r.kind
    left join credits cr on cr.payment_schedule_id = sr.id
    left join carry ca on ca.payment_schedule_id = sr.id
    group by r.kind,r.label
  )
  select string_agg(
    case when schedule_count=0 then label||' schedule is missing'
         else label||' AED '||trim(to_char(remaining,'FM999G999G999G990D00'))||' outstanding'
    end,
    '; ' order by case kind when 'dp' then 1 when 'first' then 2 else 3 end
  ) into v_blockers
  from balances
  where schedule_count=0 or remaining>1;

  if v_blockers is not null then
    raise exception 'SPA cannot be marked Signed. Settle the full 24%% package first: %.',v_blockers;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_spa_payment_gate on public.sales;
create trigger trg_enforce_spa_payment_gate
before insert or update of spa_status on public.sales
for each row execute function public.crm_enforce_spa_payment_gate();

-- Rebuild cash/credit carry positions and visible statuses without deleting history.
do $$
declare
  v_row record;
begin
  for v_row in
    select id
      from public.payment_schedule
     where lower(coalesce(stage_name,'')) like '%dld%'
        or lower(coalesce(stage_name,'')) like '%admin fee%'
  loop
    perform public.crm_sync_schedule_carry(v_row.id,current_date,null,'DLD cash-only rule applied');
  end loop;
end;
$$;

update public.payment_schedule
   set status = status,
       updated_at = now();

revoke all on function public.crm_reject_dld_credit_notes() from public,anon,authenticated;
revoke all on function public.crm_sync_first_and_dld_due_dates() from public,anon,authenticated;
revoke all on function public.crm_enforce_spa_payment_gate() from public,anon,authenticated;

comment on function public.crm_enforce_spa_payment_gate() is
  'Prevents new SPA Signed transitions until Down Payment, 1st Installment, and cash-only DLD + Admin Fees balances are each AED 1 or less.';
