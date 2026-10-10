-- Default an unspecified new DLD date from the first installment once.
-- Never update another installment when DLD is inserted or edited.
drop trigger if exists trg_sync_first_and_dld_due_dates on public.payment_schedule;
create or replace function public.crm_sync_first_and_dld_due_dates()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.due_date is null and
     (lower(coalesce(new.stage_name,'')) like '%dld%'
      or lower(coalesce(new.stage_name,'')) like '%admin fee%') then
    select due_date into new.due_date
      from public.payment_schedule
     where unit_id = new.unit_id
       and lower(coalesce(stage_name,'')) like '%installment%'
       and lower(coalesce(stage_name,'')) ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)'
     order by id limit 1;
  end if;
  return new;
end;
$$;
create trigger trg_sync_first_and_dld_due_dates
before insert on public.payment_schedule
for each row execute function public.crm_sync_first_and_dld_due_dates();
