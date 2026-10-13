-- Read-only live-booking projections; historical rows remain in their base tables.
-- Caller permissions and base-table RLS apply through security_invoker.
create or replace view public.current_payment_schedule
with (security_invoker = true) as
select p.* from public.payment_schedule p
where exists(select 1 from public.units u
             where u.id=p.unit_id and u.customer_id=p.customer_id);
create or replace view public.current_sales
with (security_invoker = true) as
select s.* from public.sales s
where exists(select 1 from public.units u
             where u.id=s.unit_id and u.customer_id=s.customer_id);
revoke all on public.current_payment_schedule, public.current_sales from public, anon;
grant select on public.current_payment_schedule, public.current_sales to authenticated;
