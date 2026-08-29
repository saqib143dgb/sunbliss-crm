alter table public.scheduled_actions drop constraint if exists scheduled_actions_auto_kind_check;
alter table public.scheduled_actions add constraint scheduled_actions_auto_kind_check
  check (auto_kind is null or auto_kind in (
    'demand_letter',
    'gentle_reminder',
    'overdue_follow_up',
    'extension_active',
    'extension_residual_overdue',
    'extension_uncovered_overdue'
  ));