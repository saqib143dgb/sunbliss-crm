update public.sales s
set furniture_status = case
  when coalesce(u.unit_type, '') ~* '\(\s*fully\s*-?\s*furnished\s*\)' then 'Fully Furnished'
  when lower(coalesce(s.furniture_status, '')) in ('furnished','fully furnished') then 'Fully Furnished'
  else 'Semi Furnished'
end,
updated_at = now()
from public.units u
where s.unit_id = u.id;

update public.units
set unit_type = nullif(trim(regexp_replace(coalesce(unit_type, ''), '\s*\(\s*fully\s*-?\s*furnished\s*\)\s*$', '', 'i')), '')
where coalesce(unit_type, '') ~* '\(\s*fully\s*-?\s*furnished\s*\)';

alter table public.sales alter column furniture_status set default 'Semi Furnished';

alter table public.sales drop constraint if exists sales_furniture_status_check;
alter table public.sales add constraint sales_furniture_status_check
check (furniture_status in ('Fully Furnished','Semi Furnished'));
