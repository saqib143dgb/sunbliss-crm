-- Collection follow-ups must not collide with independent extension,
-- modification or transaction workflows for the same installment.
-- Transaction workflow uniqueness is enforced by its existing dedicated index.
drop index if exists public.scheduled_actions_owner_pending_manual_schedule_uidx;
create unique index scheduled_actions_owner_pending_manual_schedule_uidx
  on public.scheduled_actions(owner_id, unit_id, schedule_id)
  where status = 'pending'
    and source = 'manual'
    and auto_kind is null
    and schedule_id is not null
    and extension_request_id is null
    and modification_request_id is null
    and transaction_id is null;
