drop index if exists public.scheduled_actions_owner_auto_key_uidx;

create unique index scheduled_actions_owner_auto_key_uidx
  on public.scheduled_actions(owner_id, auto_key)
  where auto_key is not null
    and not (source = 'manual' and auto_kind is null);

create unique index if not exists scheduled_actions_owner_pending_manual_schedule_uidx
  on public.scheduled_actions(owner_id, unit_id, schedule_id)
  where status = 'pending'
    and source = 'manual'
    and auto_kind is null
    and schedule_id is not null;
