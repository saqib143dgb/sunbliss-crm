alter table public.scheduled_actions add column if not exists source text not null default 'manual';
alter table public.scheduled_actions add column if not exists auto_kind text;
alter table public.scheduled_actions add column if not exists auto_key text;
alter table public.scheduled_actions add column if not exists schedule_id bigint references public.payment_schedule(id) on delete set null;

alter table public.scheduled_actions drop constraint if exists scheduled_actions_source_check;
alter table public.scheduled_actions add constraint scheduled_actions_source_check check (source in ('manual','automatic'));

alter table public.scheduled_actions drop constraint if exists scheduled_actions_auto_kind_check;
alter table public.scheduled_actions add constraint scheduled_actions_auto_kind_check check (auto_kind is null or auto_kind in ('demand_letter','gentle_reminder','overdue_follow_up'));

create unique index if not exists scheduled_actions_owner_auto_key_uidx
  on public.scheduled_actions(owner_id, auto_key)
  where auto_key is not null;

create index if not exists scheduled_actions_schedule_source_idx
  on public.scheduled_actions(schedule_id, source, status);
