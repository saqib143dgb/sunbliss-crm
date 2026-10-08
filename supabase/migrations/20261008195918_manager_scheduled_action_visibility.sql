-- Managers need the shared CRM task register for supervision.
-- Preserve existing owner/extension policies and all write permissions.
create policy scheduled_actions_manager_read
on public.scheduled_actions
for select
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role::text = 'manager'
));
