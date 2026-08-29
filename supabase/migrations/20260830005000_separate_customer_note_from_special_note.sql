alter table public.sales
  add column if not exists customer_note text;

alter table public.sales_note_history
  add column if not exists note_type text;

update public.sales_note_history
set note_type = 'special_note'
where note_type is null;

alter table public.sales_note_history
  alter column note_type set default 'note';

alter table public.sales_note_history
  alter column note_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_note_history_note_type_check'
      and conrelid = 'public.sales_note_history'::regclass
  ) then
    alter table public.sales_note_history
      add constraint sales_note_history_note_type_check
      check (note_type in ('note','special_note'));
  end if;
end $$;

create or replace function public.crm_save_sales_note(p_unit_id bigint, p_note text)
returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
declare
  v_sale public.sales%rowtype;
  v_new_note text := nullif(btrim(coalesce(p_note,'')), '');
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  ) then
    raise exception 'Not authorized to edit customer notes';
  end if;

  select * into v_sale
  from public.sales
  where unit_id = p_unit_id
  order by id desc
  limit 1
  for update;

  if not found then
    raise exception 'Sale record not found for this unit';
  end if;

  if v_sale.customer_note is not distinct from v_new_note then
    return jsonb_build_object('changed',false,'sale_id',v_sale.id,'unit_id',v_sale.unit_id,'note',v_new_note);
  end if;

  insert into public.sales_note_history (
    sale_id,customer_id,unit_id,old_note,new_note,edited_by,note_type
  ) values (
    v_sale.id,v_sale.customer_id,v_sale.unit_id,v_sale.customer_note,v_new_note,auth.uid(),'note'
  );

  update public.sales
  set customer_note = v_new_note,
      updated_at = now()
  where id = v_sale.id;

  return jsonb_build_object('changed',true,'sale_id',v_sale.id,'unit_id',v_sale.unit_id,'note',v_new_note);
end;
$$;
