create table if not exists public.sales_note_history (
  id uuid primary key default gen_random_uuid(),
  sale_id bigint not null references public.sales(id) on delete cascade,
  customer_id bigint,
  unit_id bigint not null,
  old_note text,
  new_note text,
  edited_by uuid not null,
  edited_at timestamptz not null default now()
);

create index if not exists sales_note_history_unit_edited_idx
  on public.sales_note_history (unit_id, edited_at desc);

alter table public.sales_note_history enable row level security;

revoke all on table public.sales_note_history from anon;
revoke all on table public.sales_note_history from authenticated;
grant select, insert on table public.sales_note_history to authenticated;

drop policy if exists "approved profiles read sales note history" on public.sales_note_history;
create policy "approved profiles read sales note history"
on public.sales_note_history
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

drop policy if exists "crm insert sales note history" on public.sales_note_history;
create policy "crm insert sales note history"
on public.sales_note_history
for insert
to authenticated
with check (
  edited_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'crm_officer'::public.user_role
  )
);

create or replace function public.crm_save_sales_note(
  p_unit_id bigint,
  p_note text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
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

  if v_sale.remarks is not distinct from v_new_note then
    return jsonb_build_object('changed',false,'sale_id',v_sale.id,'unit_id',v_sale.unit_id,'note',v_new_note);
  end if;

  insert into public.sales_note_history (
    sale_id,customer_id,unit_id,old_note,new_note,edited_by
  ) values (
    v_sale.id,v_sale.customer_id,v_sale.unit_id,v_sale.remarks,v_new_note,auth.uid()
  );

  update public.sales
  set remarks = v_new_note,
      updated_at = now()
  where id = v_sale.id;

  return jsonb_build_object('changed',true,'sale_id',v_sale.id,'unit_id',v_sale.unit_id,'note',v_new_note);
end;
$$;

revoke execute on function public.crm_save_sales_note(bigint,text) from public;
revoke execute on function public.crm_save_sales_note(bigint,text) from anon;
grant execute on function public.crm_save_sales_note(bigint,text) to authenticated;

comment on table public.sales_note_history is 'Persistent audit history for customer Special Note changes made from the Notes panel.';
comment on function public.crm_save_sales_note(bigint,text) is 'Adds or edits the customer Special Note while retaining the previous value in sales_note_history.';
