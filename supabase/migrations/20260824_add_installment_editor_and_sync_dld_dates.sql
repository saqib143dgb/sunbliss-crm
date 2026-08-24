-- Keep DLD due dates aligned with the 1st installment and provide an atomic
-- CRM Officer-only schedule editor used by the installment three-dot menu.

update public.payment_schedule dld
set due_date = first_inst.due_date,
    updated_at = now()
from public.payment_schedule first_inst
where dld.unit_id = first_inst.unit_id
  and dld.stage_name = 'DLD + Admin Fees (SPA)'
  and first_inst.stage_name = '1st Installment'
  and dld.due_date is distinct from first_inst.due_date;

-- Correct B1-310 only when there is still no DLD transaction evidence.
update public.payment_schedule ps
set paid_amount = 0,
    paid_date = null,
    status = 'Outstanding',
    due_date = first_inst.due_date,
    updated_at = now()
from public.units u
join public.payment_schedule first_inst
  on first_inst.unit_id = u.id
 and first_inst.stage_name = '1st Installment'
where ps.unit_id = u.id
  and ps.stage_name = 'DLD + Admin Fees (SPA)'
  and regexp_replace(upper(u.unit_no),'\s','','g') = 'B1-310'
  and not exists (
    select 1
    from public.payment_transactions pt
    where pt.unit_id = u.id
      and lower(coalesce(pt.payment_type,'')) like '%dld%'
  );

create or replace function public.crm_save_installment(
  p_schedule_id bigint,
  p_unit_id bigint,
  p_stage_name text,
  p_due_amount numeric,
  p_due_date date,
  p_paid_amount numeric,
  p_paid_date date,
  p_remarks text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id bigint;
  v_customer_id bigint;
  v_unit_id bigint;
  v_stage_name text;
  v_status text;
  v_rows integer;
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role::text = 'crm_officer'
  ) then
    raise exception 'Only CRM Officers can edit installments.';
  end if;

  if p_unit_id is null then
    raise exception 'Unit is required.';
  end if;
  if nullif(btrim(coalesce(p_stage_name,'')),'') is null then
    raise exception 'Installment name is required.';
  end if;
  if p_due_amount is null or p_due_amount < 0 then
    raise exception 'Due amount must be zero or greater.';
  end if;
  if p_paid_amount is null or p_paid_amount < 0 then
    raise exception 'Paid amount must be zero or greater.';
  end if;
  if p_paid_amount > p_due_amount + 0.01 then
    raise exception 'Paid amount cannot be greater than the due amount.';
  end if;
  if p_paid_amount > 0 and p_paid_date is null then
    raise exception 'Paid date is required when a paid amount is entered.';
  end if;

  select customer_id into v_customer_id
  from public.units
  where id = p_unit_id;
  if v_customer_id is null then
    raise exception 'Unit not found.';
  end if;

  v_status := case
    when p_paid_amount <= 0 then 'Outstanding'
    when p_due_amount > 0 and p_paid_amount >= p_due_amount - 0.01 then 'Paid'
    else 'Partial'
  end;

  if p_schedule_id is null then
    v_stage_name := btrim(p_stage_name);
    if exists (
      select 1 from public.payment_schedule
      where unit_id = p_unit_id and stage_name = v_stage_name
    ) then
      raise exception 'That installment already has a schedule row. Refresh and edit the existing row.';
    end if;

    insert into public.payment_schedule(
      customer_id,unit_id,stage_name,due_amount,due_date,paid_amount,paid_date,status,remarks,updated_at
    ) values (
      v_customer_id,p_unit_id,v_stage_name,p_due_amount,p_due_date,p_paid_amount,
      case when p_paid_amount > 0 then p_paid_date else null end,
      v_status,p_remarks,now()
    ) returning id into v_id;
    v_unit_id := p_unit_id;
  else
    select id,unit_id,stage_name
      into v_id,v_unit_id,v_stage_name
    from public.payment_schedule
    where id = p_schedule_id
    for update;

    if v_id is null then
      raise exception 'Installment schedule row not found.';
    end if;
    if v_unit_id <> p_unit_id then
      raise exception 'Installment does not belong to this unit.';
    end if;

    update public.payment_schedule
    set due_amount = p_due_amount,
        due_date = p_due_date,
        paid_amount = p_paid_amount,
        paid_date = case when p_paid_amount > 0 then p_paid_date else null end,
        status = v_status,
        remarks = p_remarks,
        updated_at = now()
    where id = v_id;
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'Installment could not be updated.';
    end if;
  end if;

  if v_stage_name = '1st Installment' then
    update public.payment_schedule
    set due_date = p_due_date,
        updated_at = now()
    where unit_id = v_unit_id
      and stage_name = 'DLD + Admin Fees (SPA)'
      and id <> v_id;
  elsif v_stage_name = 'DLD + Admin Fees (SPA)' then
    update public.payment_schedule
    set due_date = p_due_date,
        updated_at = now()
    where unit_id = v_unit_id
      and stage_name = '1st Installment'
      and id <> v_id;
  end if;

  return jsonb_build_object(
    'id',v_id,
    'status',v_status,
    'stage_name',v_stage_name,
    'unit_id',v_unit_id
  );
end;
$$;

revoke all on function public.crm_save_installment(bigint,bigint,text,numeric,date,numeric,date,text) from public;
revoke all on function public.crm_save_installment(bigint,bigint,text,numeric,date,numeric,date,text) from anon;
grant execute on function public.crm_save_installment(bigint,bigint,text,numeric,date,numeric,date,text) to authenticated;
