-- Run after the test-mode migration; every synthetic write is rolled back.
begin;
create temporary table live_before as select 'customers'::text name,md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) hash from public.customers t union all select 'units',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.units t union all select 'sales',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.sales t union all select 'schedule',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.payment_schedule t union all select 'transactions',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.payment_transactions t union all select 'tasks',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.scheduled_actions t;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
set local role authenticated;
select crm_test.prepare_test_workspace(true);
do $$declare old_id bigint; r jsonb;begin
 if (select count(*) from crm_test.units)<>5 then raise exception 'Expected 5 test units';end if;
 if (select count(*) from crm_test.customers)<>1 then raise exception 'Expected one dummy customer';end if;
 if (select sum(amount) from crm_test.payment_transactions)<>10000 then raise exception 'Incorrect booking amount';end if;
 if (select due_amount-paid_amount from crm_test.payment_schedule where stage_name='Down Payment')<>190000 then raise exception 'Incorrect remaining down payment';end if;
 select min(id) into old_id from crm_test.units;
 r:=crm_test.prepare_test_workspace(false);
 if (select min(id) from crm_test.units)<>old_id then raise exception 'Enter unexpectedly reset progress';end if;
 r:=crm_test.prepare_test_workspace(true);
 if (select min(id) from crm_test.units)<=old_id then raise exception 'Reset reused stale unit IDs';end if;
 begin update crm_test.profiles set role='manager' where id=auth.uid();raise exception 'Test profile escalation accepted';exception when insufficient_privilege then null;end;
end;$$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='manager' order by id limit 1),true);
set local role authenticated;
do $$begin
 begin perform crm_test.prepare_test_workspace(true);raise exception 'Manager reset accepted';exception when raise_exception then if sqlerrm not like 'Only a CRM officer%' then raise;end if;end;
end;$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
set local role authenticated;
do $$begin
 if exists(select 1 from crm_test.units) then raise exception 'Unapproved user read test data';end if;
 begin perform crm_test.prepare_test_workspace(false);raise exception 'Unapproved initialization accepted';exception when raise_exception then if sqlerrm<>'CRM access required.' then raise;end if;end;
end;$$;
reset role;
do $$declare r record; new_hash text;begin
 for r in select * from live_before loop
  execute format('select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'''')) from public.%I t',case r.name when 'schedule' then 'payment_schedule' when 'transactions' then 'payment_transactions' when 'tasks' then 'scheduled_actions' else r.name end) into new_hash;
  if new_hash<>r.hash then raise exception 'Live data changed: %',r.name;end if;
 end loop;
 if has_table_privilege('crm_test_owner','public.units','UPDATE') or has_table_privilege('crm_test_owner','public.payment_transactions','INSERT') then raise exception 'Test owner has live write privileges';end if;
 if exists(select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace join pg_class ft on ft.oid=c.confrelid join pg_namespace fn on fn.oid=ft.relnamespace where n.nspname='crm_test' and fn.nspname='public') then raise exception 'Test FK references live data';end if;
end;$$;
rollback;
