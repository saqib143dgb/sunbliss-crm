create table if not exists public.crm_visit_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_session_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null check (user_role in ('crm_officer', 'manager')),
  user_name text,
  signed_in_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  signed_out_at timestamptz,
  constraint crm_visit_sessions_signout_after_signin
    check (signed_out_at is null or signed_out_at >= signed_in_at)
);

create index if not exists crm_visit_sessions_role_signed_in_idx
  on public.crm_visit_sessions (user_role, signed_in_at desc);

create index if not exists crm_visit_sessions_user_signed_in_idx
  on public.crm_visit_sessions (user_id, signed_in_at desc);

alter table public.crm_visit_sessions enable row level security;

drop policy if exists "approved profiles read crm visit sessions" on public.crm_visit_sessions;
drop policy if exists "approved profiles insert own crm visit session" on public.crm_visit_sessions;
drop policy if exists "approved profiles update own crm visit session" on public.crm_visit_sessions;

create policy "approved profiles read crm visit sessions"
on public.crm_visit_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer', 'manager')
  )
);

create policy "approved profiles insert own crm visit session"
on public.crm_visit_sessions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and user_role = coalesce(
    (
      select profiles.role::text
      from public.profiles
      where profiles.id = (select auth.uid())
    ),
    ''
  )
  and user_role in ('crm_officer', 'manager')
);

create policy "approved profiles update own crm visit session"
on public.crm_visit_sessions
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer', 'manager')
  )
)
with check (
  user_id = (select auth.uid())
  and user_role = coalesce(
    (
      select profiles.role::text
      from public.profiles
      where profiles.id = (select auth.uid())
    ),
    ''
  )
  and user_role in ('crm_officer', 'manager')
);

revoke all on public.crm_visit_sessions from anon;
grant select, insert, update on public.crm_visit_sessions to authenticated;