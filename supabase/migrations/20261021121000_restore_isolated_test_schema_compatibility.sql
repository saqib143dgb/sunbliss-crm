begin;
-- Repair the isolated Test Mode schema drift from recent live audit tables.
-- Empty test tables only: no live data is copied.
do $$
declare r record;
begin
 for r in select t.tablename from pg_tables t where t.schemaname='public'
   and not exists (select 1 from pg_tables z where z.schemaname='crm_test' and z.tablename=t.tablename)
 loop
  execute format('create table crm_test.%I (like public.%I including all)',r.tablename,r.tablename);
  execute format('alter table crm_test.%I owner to crm_test_owner',r.tablename);
  execute format('alter table crm_test.%I enable row level security',r.tablename);
  execute format('grant select,insert,update,delete on crm_test.%I to authenticated',r.tablename);
  execute format('create policy test_staff_access on crm_test.%I as restrictive for all to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager''))) with check (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager'')))',r.tablename);
 end loop;
end $$;
select crm_test_private.refresh_workflows();
commit;