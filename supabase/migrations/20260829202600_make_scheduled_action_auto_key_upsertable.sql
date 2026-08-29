drop index if exists public.scheduled_actions_owner_auto_key_uidx;
create unique index scheduled_actions_owner_auto_key_uidx
  on public.scheduled_actions(owner_id, auto_key);
