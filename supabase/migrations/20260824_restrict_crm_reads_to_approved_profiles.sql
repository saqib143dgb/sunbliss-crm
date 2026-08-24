drop policy if exists "crm_dashboard_read_customers" on public.customers;
drop policy if exists "read customers" on public.customers;
drop policy if exists "crm_dashboard_read_units" on public.units;
drop policy if exists "read units" on public.units;
drop policy if exists "read sales" on public.sales;
drop policy if exists "crm_dashboard_read_payment_schedule" on public.payment_schedule;
drop policy if exists "read payment_schedule" on public.payment_schedule;
drop policy if exists "crm_dashboard_read_payment_transactions" on public.payment_transactions;
drop policy if exists "read payment_transactions" on public.payment_transactions;
drop policy if exists "read cancelled_units" on public.cancelled_units;
drop policy if exists "read branding" on public.branding;
drop policy if exists "read snapshots" on public.kpi_snapshots;

create policy "approved profiles read customers"
on public.customers for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read units"
on public.units for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read sales"
on public.sales for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read payment_schedule"
on public.payment_schedule for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read payment_transactions"
on public.payment_transactions for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read cancelled_units"
on public.cancelled_units for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read branding"
on public.branding for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);

create policy "approved profiles read snapshots"
on public.kpi_snapshots for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text in ('crm_officer','manager')
  )
);
