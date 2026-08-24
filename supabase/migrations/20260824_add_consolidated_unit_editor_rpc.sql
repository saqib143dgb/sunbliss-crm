create or replace function public.crm_update_unit_details(
  p_unit_id bigint,
  p_unit_no text,
  p_project_name text,
  p_unit_type text,
  p_floor text,
  p_area numeric,
  p_price_per_sqft numeric,
  p_total_price numeric,
  p_status text,
  p_furnishing_type text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_unit public.units%rowtype;
  v_sale public.sales%rowtype;
  v_unit_type text;
  v_unit_no text;
  v_project_name text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'crm_officer'
  ) then
    raise exception 'Only CRM Officer can edit unit details.' using errcode = '42501';
  end if;

  v_unit_no := btrim(coalesce(p_unit_no,''));
  v_project_name := btrim(coalesce(p_project_name,''));
  v_status := btrim(coalesce(p_status,''));
  v_unit_type := nullif(btrim(coalesce(p_unit_type,'')), '');
  if v_unit_type is not null then
    v_unit_type := nullif(btrim(regexp_replace(v_unit_type, '\s*\(\s*(fully\s*-?\s*furnished|semi\s*-?\s*furnished|unfurnished|furnished)\s*\)\s*$', '', 'i')), '');
  end if;

  if p_unit_id is null then raise exception 'Unit is required.'; end if;
  if v_unit_no = '' then raise exception 'Unit number is required.'; end if;
  if v_project_name = '' then raise exception 'Project name is required.'; end if;
  if v_status = '' then raise exception 'Unit status is required.'; end if;
  if p_furnishing_type not in ('Fully Furnished','Semi Furnished') then
    raise exception 'Choose Fully Furnished or Semi Furnished.';
  end if;
  if p_area is not null and p_area < 0 then raise exception 'Area cannot be negative.'; end if;
  if p_price_per_sqft is not null and p_price_per_sqft < 0 then raise exception 'Price per sq.ft cannot be negative.'; end if;
  if p_total_price is not null and p_total_price < 0 then raise exception 'Total unit value cannot be negative.'; end if;

  select * into v_unit from public.units where id = p_unit_id for update;
  if not found then raise exception 'Unit not found.'; end if;

  if lower(v_status) = 'cancelled' and lower(coalesce(v_unit.status,'')) <> 'cancelled' then
    raise exception 'Use the Cancel Unit workflow to cancel a unit.';
  end if;

  if exists (select 1 from public.units u where u.unit_no = v_unit_no and u.id <> p_unit_id) then
    raise exception 'Unit number % already exists.', v_unit_no;
  end if;

  select * into v_sale
  from public.sales
  where unit_id = p_unit_id
  order by id desc
  limit 1
  for update;
  if not found then raise exception 'No sale record is linked to this unit.'; end if;

  update public.units
  set unit_no = v_unit_no,
      project_name = v_project_name,
      unit_type = v_unit_type,
      floor = nullif(btrim(coalesce(p_floor,'')),''),
      area = p_area,
      price_per_sqft = p_price_per_sqft,
      total_price = p_total_price,
      status = v_status,
      updated_at = now()
  where id = p_unit_id;

  update public.sales
  set furniture_status = p_furnishing_type,
      brokerage_amount = case
        when lower(btrim(coalesce(source,''))) in ('broker','individual buyer')
             and brokerage_percentage is not null and p_total_price is not null
          then round((p_total_price * brokerage_percentage / 100.0)::numeric,2)
        when lower(btrim(coalesce(source,''))) = 'direct' then null
        else brokerage_amount
      end,
      updated_at = now()
  where id = v_sale.id;

  return jsonb_build_object(
    'unit_id', p_unit_id,
    'unit_no', v_unit_no,
    'unit_type', v_unit_type,
    'furnishing_type', p_furnishing_type,
    'total_price', p_total_price,
    'status', v_status
  );
end;
$$;

revoke all on function public.crm_update_unit_details(bigint,text,text,text,text,numeric,numeric,numeric,text,text) from public, anon;
grant execute on function public.crm_update_unit_details(bigint,text,text,text,text,numeric,numeric,numeric,text,text) to authenticated;
