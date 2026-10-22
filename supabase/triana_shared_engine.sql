-- Test data has its own tables, sequences, routines and triggers. No live business
-- rows are copied. The no-login routine owner cannot write live business tables.
create role crm_triana_owner nologin noinherit;
grant crm_triana_owner to postgres;
create schema crm_triana authorization crm_triana_owner;
create schema crm_triana_private authorization crm_triana_owner;
revoke all on schema crm_triana,crm_triana_private from public,anon;
grant usage on schema crm_triana,crm_triana_private to authenticated;
grant usage on schema public to crm_triana_owner;
create function crm_triana_private.actor_id() returns uuid language sql stable security definer set search_path='' as $$select auth.uid();$$;
revoke all on function crm_triana_private.actor_id() from public,anon;
grant execute on function crm_triana_private.actor_id() to authenticated,crm_triana_owner;
create function crm_triana_private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role::text in ('crm_officer','manager'));
$$;
revoke all on function crm_triana_private.is_staff() from public,anon;
grant execute on function crm_triana_private.is_staff() to authenticated,crm_triana_owner;
set local search_path=pg_catalog;
set local check_function_bodies=off;

-- Clone table structure with separate identity sequences. LIKE does not copy FKs,
-- triggers, policies or data: each is deliberately recreated below.
do $clone$
declare r record; d text; ns text; sig text; pol text; roles text;
begin
 for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' loop
  execute format('create table crm_triana.%I (like public.%I including all)',r.relname,r.relname);
  execute format('alter table crm_triana.%I owner to crm_triana_owner',r.relname);
  execute format('alter table crm_triana.%I enable row level security',r.relname);
 end loop;
 -- Serial (non-identity) defaults must never consume live sequences.
 for r in select c.relname,a.attname,pg_get_expr(ad.adbin,ad.adrelid) expr from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace join pg_attrdef ad on ad.adrelid=c.oid and ad.adnum=a.attnum where n.nspname='public' and a.attidentity='' and pg_get_expr(ad.adbin,ad.adrelid) like '%nextval%' loop
  execute format('create sequence crm_triana.%I',r.relname||'_'||r.attname||'_test_seq');
  execute format('alter sequence crm_triana.%I owner to crm_triana_owner',r.relname||'_'||r.attname||'_test_seq');
  execute format('alter table crm_triana.%I alter column %I set default nextval(%L::regclass)',r.relname,r.attname,'crm_triana.'||r.relname||'_'||r.attname||'_test_seq');
  execute format('alter sequence crm_triana.%I owned by crm_triana.%I.%I',r.relname||'_'||r.attname||'_test_seq',r.relname,r.attname);
 end loop;
 for r in select c.relname,con.conname,pg_get_constraintdef(con.oid) def from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and con.contype='f' loop
  execute format('alter table crm_triana.%I add constraint %I %s',r.relname,r.conname,replace(r.def,'public.','crm_triana.'));
 end loop;
 for r in select c.relname,pg_get_viewdef(c.oid,true) def from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' loop
  execute format('create view crm_triana.%I with (security_invoker=true) as %s',r.relname,replace(r.def,'public.','crm_triana.'));
  execute format('alter view crm_triana.%I owner to crm_triana_owner',r.relname);
 end loop;
 for r in select p.oid,p.proname,n.nspname,p.prosecdef,p.prorettype,pg_get_functiondef(p.oid) def,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','crm_private') and p.prokind='f' and p.proname not in ('handle_new_user','crm_prepare_user') loop
  ns:=case r.nspname when 'public' then 'crm_triana' else 'crm_triana_private' end;
  d:=replace(replace(r.def,'crm_private.','crm_triana_private.'),'public.','crm_triana.');
  d:=replace(d,'crm_triana.user_role','public.user_role');
  d:=replace(d,'auth.uid()','crm_triana_private.actor_id()');
  d:=replace(d,'SET search_path TO ''public''','SET search_path TO ''crm_triana''');
  -- Definers additionally check the real, current staff role (never a test role).
  if r.prosecdef and r.prorettype<>'trigger'::regtype then
   d:=regexp_replace(d,'\mbegin\M',E'begin\n if not crm_triana_private.is_staff() then raise exception ''CRM access required.''; end if;','i');
  end if;
  execute d;
  sig:=format('%I.%I(%s)',ns,r.proname,replace(r.args,'public.','crm_triana.'));
  execute 'alter function '||sig||' owner to crm_triana_owner';
  execute 'alter function '||sig||' set search_path=crm_triana,pg_temp';
  execute 'revoke all on function '||sig||' from public,anon,authenticated';
  if has_function_privilege('authenticated',r.oid,'EXECUTE') and r.prorettype<>'trigger'::regtype then
   execute 'grant execute on function '||sig||' to authenticated';
  end if;
 end loop;
 for r in select pg_get_triggerdef(t.oid) def from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal loop
  execute replace(replace(r.def,'crm_private.','crm_triana_private.'),'public.','crm_triana.');
 end loop;
 for r in select * from pg_policies where schemaname='public' loop
  select string_agg(quote_ident(x),',') into roles from unnest(r.roles) x;
  pol:=format('create policy %I on crm_triana.%I as %s for %s to %s',r.policyname,r.tablename,r.permissive,r.cmd,roles);
  if r.qual is not null then pol:=pol||' using ('||replace(replace(r.qual,'public.','crm_triana.'),'crm_triana.user_role','public.user_role')||')';end if;
  if r.with_check is not null then pol:=pol||' with check ('||replace(replace(r.with_check,'public.','crm_triana.'),'crm_triana.user_role','public.user_role')||')';end if;
  execute pol;
 end loop;
end;$clone$;
grant select,insert,update,delete on all tables in schema crm_triana to authenticated;
revoke insert,update,delete on crm_triana.profiles from authenticated;
grant usage,select on all sequences in schema crm_triana to authenticated;
-- A revoked live account cannot retain access through an old test profile.
do $$ declare r record;begin
 for r in select tablename from pg_tables where schemaname='crm_triana' and tablename<>'profiles' loop
  execute format('create policy test_staff_access on crm_triana.%I as restrictive for all to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager''))) with check (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager'')))',r.tablename);
 end loop;
end;$$;

-- UI releases are shared with live mode. Refresh compatible server workflows on
-- entry; if a later migration changes table shape, fail closed until that release
-- also migrates the test schema. Never silently fall back to public tables/RPCs.
create function crm_triana_private.refresh_workflows() returns void
language plpgsql security definer set search_path=pg_catalog as $$
declare r record; d text; ns text; sig text; differs boolean;
begin
 select exists(
  (select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='public' and table_name in (select tablename from pg_tables where schemaname='public')
   except select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='crm_triana')
  union all
  (select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='crm_triana' and table_name in (select tablename from pg_tables where schemaname='crm_triana')
   except select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='public')
 ) into differs;
 if differs then raise exception 'Triana workspace needs a schema update for this release. Live CRM is available.';end if;
 perform set_config('check_function_bodies','off',true);
 for r in select p.oid,p.proname,n.nspname,p.prosecdef,p.prorettype,pg_get_functiondef(p.oid) def,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','crm_private') and p.prokind='f' and p.proname not in ('handle_new_user','crm_prepare_user') loop
  ns:=case r.nspname when 'public' then 'crm_triana' else 'crm_triana_private' end;
  d:=replace(replace(r.def,'crm_private.','crm_triana_private.'),'public.','crm_triana.');
  d:=replace(d,'crm_triana.user_role','public.user_role');
  d:=replace(d,'auth.uid()','crm_triana_private.actor_id()');
  if d ~* '\m(auth|storage|net|vault|dblink)\.' then raise exception 'Triana workspace needs review for workflow % before it can run safely.',r.proname;end if;
  d:=replace(d,'SET search_path TO ''public''','SET search_path TO ''crm_triana''');
  if r.prosecdef and r.prorettype<>'trigger'::regtype then
   d:=regexp_replace(d,'\mbegin\M',E'begin\n if not crm_triana_private.is_staff() then raise exception ''CRM access required.''; end if;','i');
  end if;
  execute d;
  sig:=format('%I.%I(%s)',ns,r.proname,replace(r.args,'public.','crm_triana.'));
  execute 'alter function '||sig||' owner to crm_triana_owner';
  execute 'alter function '||sig||' set search_path=crm_triana,pg_temp';
  execute 'revoke all on function '||sig||' from public,anon,authenticated';
  if has_function_privilege('authenticated',r.oid,'EXECUTE') and r.prorettype<>'trigger'::regtype then execute 'grant execute on function '||sig||' to authenticated';end if;
 end loop;
 for r in select t.tgname,c.relname from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='crm_triana' and not t.tgisinternal loop execute format('drop trigger %I on crm_triana.%I',r.tgname,r.relname);end loop;
 for r in select pg_get_triggerdef(t.oid) def from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal loop execute replace(replace(r.def,'crm_private.','crm_triana_private.'),'public.','crm_triana.');end loop;
end;$$;
revoke all on function crm_triana_private.refresh_workflows() from public,anon,authenticated;


create function crm_triana_private.prepare_workspace() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not crm_triana_private.is_staff() then raise exception 'CRM access required.'; end if;
 perform pg_advisory_xact_lock(77159002);
 perform crm_triana_private.refresh_workflows();
 insert into crm_triana.profiles select * from public.profiles
 on conflict(id) do update set role=excluded.role,full_name=excluded.full_name;
 return jsonb_build_object('ready',true);
end;$$;
revoke all on function crm_triana_private.prepare_workspace() from public,anon;
grant execute on function crm_triana_private.prepare_workspace() to authenticated;
create function crm_triana.prepare_project_workspace() returns jsonb language sql security invoker set search_path='' as $$select crm_triana_private.prepare_workspace();$$;
revoke all on function crm_triana.prepare_project_workspace() from public,anon;
grant execute on function crm_triana.prepare_project_workspace() to authenticated;
insert into crm_triana.profiles select * from public.profiles;
insert into crm_triana.branding select * from public.branding;
update crm_triana.branding set name='Purvanchal Real Estate Developers LLC',crm_email='crm@purvanchaluae.ae',collections_contact='+971 4 397 7033' where id=1;
alter table crm_triana.units alter column project_name set default 'Triana Residences';

do $$ declare r record; begin
 for r in select sequencename from pg_sequences where schemaname='crm_triana' loop
 execute format('alter sequence crm_triana.%I restart with 1000000',r.sequencename);
 end loop;
end $$;
-- Test data has its own tables, sequences, routines and triggers. No live business
-- rows are copied. The no-login routine owner cannot write live business tables.
create role crm_triana_test_owner nologin noinherit;
grant crm_triana_test_owner to postgres;
create schema crm_triana_test authorization crm_triana_test_owner;
create schema crm_triana_test_private authorization crm_triana_test_owner;
revoke all on schema crm_triana_test,crm_triana_test_private from public,anon;
grant usage on schema crm_triana_test,crm_triana_test_private to authenticated;
grant usage on schema public to crm_triana_test_owner;
create function crm_triana_test_private.actor_id() returns uuid language sql stable security definer set search_path='' as $$select auth.uid();$$;
revoke all on function crm_triana_test_private.actor_id() from public,anon;
grant execute on function crm_triana_test_private.actor_id() to authenticated,crm_triana_test_owner;
create function crm_triana_test_private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role::text in ('crm_officer','manager'));
$$;
revoke all on function crm_triana_test_private.is_staff() from public,anon;
grant execute on function crm_triana_test_private.is_staff() to authenticated,crm_triana_test_owner;
set local search_path=pg_catalog;
set local check_function_bodies=off;

-- Clone table structure with separate identity sequences. LIKE does not copy FKs,
-- triggers, policies or data: each is deliberately recreated below.
do $clone$
declare r record; d text; ns text; sig text; pol text; roles text;
begin
 for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' loop
  execute format('create table crm_triana_test.%I (like public.%I including all)',r.relname,r.relname);
  execute format('alter table crm_triana_test.%I owner to crm_triana_test_owner',r.relname);
  execute format('alter table crm_triana_test.%I enable row level security',r.relname);
 end loop;
 -- Serial (non-identity) defaults must never consume live sequences.
 for r in select c.relname,a.attname,pg_get_expr(ad.adbin,ad.adrelid) expr from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace join pg_attrdef ad on ad.adrelid=c.oid and ad.adnum=a.attnum where n.nspname='public' and a.attidentity='' and pg_get_expr(ad.adbin,ad.adrelid) like '%nextval%' loop
  execute format('create sequence crm_triana_test.%I',r.relname||'_'||r.attname||'_test_seq');
  execute format('alter sequence crm_triana_test.%I owner to crm_triana_test_owner',r.relname||'_'||r.attname||'_test_seq');
  execute format('alter table crm_triana_test.%I alter column %I set default nextval(%L::regclass)',r.relname,r.attname,'crm_triana_test.'||r.relname||'_'||r.attname||'_test_seq');
  execute format('alter sequence crm_triana_test.%I owned by crm_triana_test.%I.%I',r.relname||'_'||r.attname||'_test_seq',r.relname,r.attname);
 end loop;
 for r in select c.relname,con.conname,pg_get_constraintdef(con.oid) def from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and con.contype='f' loop
  execute format('alter table crm_triana_test.%I add constraint %I %s',r.relname,r.conname,replace(r.def,'public.','crm_triana_test.'));
 end loop;
 for r in select c.relname,pg_get_viewdef(c.oid,true) def from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' loop
  execute format('create view crm_triana_test.%I with (security_invoker=true) as %s',r.relname,replace(r.def,'public.','crm_triana_test.'));
  execute format('alter view crm_triana_test.%I owner to crm_triana_test_owner',r.relname);
 end loop;
 for r in select p.oid,p.proname,n.nspname,p.prosecdef,p.prorettype,pg_get_functiondef(p.oid) def,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','crm_private') and p.prokind='f' and p.proname not in ('handle_new_user','crm_prepare_user') loop
  ns:=case r.nspname when 'public' then 'crm_triana_test' else 'crm_triana_test_private' end;
  d:=replace(replace(r.def,'crm_private.','crm_triana_test_private.'),'public.','crm_triana_test.');
  d:=replace(d,'crm_triana_test.user_role','public.user_role');
  d:=replace(d,'auth.uid()','crm_triana_test_private.actor_id()');
  d:=replace(d,'SET search_path TO ''public''','SET search_path TO ''crm_triana_test''');
  -- Definers additionally check the real, current staff role (never a test role).
  if r.prosecdef and r.prorettype<>'trigger'::regtype then
   d:=regexp_replace(d,'\mbegin\M',E'begin\n if not crm_triana_test_private.is_staff() then raise exception ''CRM access required.''; end if;','i');
  end if;
  execute d;
  sig:=format('%I.%I(%s)',ns,r.proname,replace(r.args,'public.','crm_triana_test.'));
  execute 'alter function '||sig||' owner to crm_triana_test_owner';
  execute 'alter function '||sig||' set search_path=crm_triana_test,pg_temp';
  execute 'revoke all on function '||sig||' from public,anon,authenticated';
  if has_function_privilege('authenticated',r.oid,'EXECUTE') and r.prorettype<>'trigger'::regtype then
   execute 'grant execute on function '||sig||' to authenticated';
  end if;
 end loop;
 for r in select pg_get_triggerdef(t.oid) def from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal loop
  execute replace(replace(r.def,'crm_private.','crm_triana_test_private.'),'public.','crm_triana_test.');
 end loop;
 for r in select * from pg_policies where schemaname='public' loop
  select string_agg(quote_ident(x),',') into roles from unnest(r.roles) x;
  pol:=format('create policy %I on crm_triana_test.%I as %s for %s to %s',r.policyname,r.tablename,r.permissive,r.cmd,roles);
  if r.qual is not null then pol:=pol||' using ('||replace(replace(r.qual,'public.','crm_triana_test.'),'crm_triana_test.user_role','public.user_role')||')';end if;
  if r.with_check is not null then pol:=pol||' with check ('||replace(replace(r.with_check,'public.','crm_triana_test.'),'crm_triana_test.user_role','public.user_role')||')';end if;
  execute pol;
 end loop;
end;$clone$;
grant select,insert,update,delete on all tables in schema crm_triana_test to authenticated;
revoke insert,update,delete on crm_triana_test.profiles from authenticated;
grant usage,select on all sequences in schema crm_triana_test to authenticated;
-- A revoked live account cannot retain access through an old test profile.
do $$ declare r record;begin
 for r in select tablename from pg_tables where schemaname='crm_triana_test' and tablename<>'profiles' loop
  execute format('create policy test_staff_access on crm_triana_test.%I as restrictive for all to authenticated using (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager''))) with check (exists(select 1 from public.profiles where id=auth.uid() and role::text in (''crm_officer'',''manager'')))',r.tablename);
 end loop;
end;$$;

-- UI releases are shared with live mode. Refresh compatible server workflows on
-- entry; if a later migration changes table shape, fail closed until that release
-- also migrates the test schema. Never silently fall back to public tables/RPCs.
create function crm_triana_test_private.refresh_workflows() returns void
language plpgsql security definer set search_path=pg_catalog as $$
declare r record; d text; ns text; sig text; differs boolean;
begin
 select exists(
  (select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='public' and table_name in (select tablename from pg_tables where schemaname='public')
   except select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='crm_triana_test')
  union all
  (select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='crm_triana_test' and table_name in (select tablename from pg_tables where schemaname='crm_triana_test')
   except select table_name,column_name,data_type,udt_name,is_nullable from information_schema.columns where table_schema='public')
 ) into differs;
 if differs then raise exception 'Test Mode needs a schema update for this release. Live CRM is available.';end if;
 perform set_config('check_function_bodies','off',true);
 for r in select p.oid,p.proname,n.nspname,p.prosecdef,p.prorettype,pg_get_functiondef(p.oid) def,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','crm_private') and p.prokind='f' and p.proname not in ('handle_new_user','crm_prepare_user') loop
  ns:=case r.nspname when 'public' then 'crm_triana_test' else 'crm_triana_test_private' end;
  d:=replace(replace(r.def,'crm_private.','crm_triana_test_private.'),'public.','crm_triana_test.');
  d:=replace(d,'crm_triana_test.user_role','public.user_role');
  d:=replace(d,'auth.uid()','crm_triana_test_private.actor_id()');
  if d ~* '\m(auth|storage|net|vault|dblink)\.' then raise exception 'Test Mode needs review for workflow % before it can run safely.',r.proname;end if;
  d:=replace(d,'SET search_path TO ''public''','SET search_path TO ''crm_triana_test''');
  if r.prosecdef and r.prorettype<>'trigger'::regtype then
   d:=regexp_replace(d,'\mbegin\M',E'begin\n if not crm_triana_test_private.is_staff() then raise exception ''CRM access required.''; end if;','i');
  end if;
  execute d;
  sig:=format('%I.%I(%s)',ns,r.proname,replace(r.args,'public.','crm_triana_test.'));
  execute 'alter function '||sig||' owner to crm_triana_test_owner';
  execute 'alter function '||sig||' set search_path=crm_triana_test,pg_temp';
  execute 'revoke all on function '||sig||' from public,anon,authenticated';
  if has_function_privilege('authenticated',r.oid,'EXECUTE') and r.prorettype<>'trigger'::regtype then execute 'grant execute on function '||sig||' to authenticated';end if;
 end loop;
 for r in select t.tgname,c.relname from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='crm_triana_test' and not t.tgisinternal loop execute format('drop trigger %I on crm_triana_test.%I',r.tgname,r.relname);end loop;
 for r in select pg_get_triggerdef(t.oid) def from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal loop execute replace(replace(r.def,'crm_private.','crm_triana_test_private.'),'public.','crm_triana_test.');end loop;
end;$$;
revoke all on function crm_triana_test_private.refresh_workflows() from public,anon,authenticated;

-- Only this bounded initializer has live read access. Reset truncates an explicit
-- list of test tables, WITHOUT CASCADE and WITHOUT restarting sequences, so stale
-- task IDs cannot accidentally target a newly seeded record.
create function crm_triana_test_private.prepare_workspace(p_reset boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_role text; r record; tables text; uid bigint; result jsonb; today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if auth.uid() is null or v_role is null or v_role not in ('crm_officer','manager') then raise exception 'CRM access required.';end if;
 perform pg_advisory_xact_lock(77159001);
 perform crm_triana_test_private.refresh_workflows();
 if p_reset and v_role<>'crm_officer' then raise exception 'Only a CRM officer can reset Test Mode.';end if;
 insert into crm_triana_test.profiles select * from public.profiles
 on conflict(id) do update set role=excluded.role,full_name=excluded.full_name;
 if not p_reset and exists(select 1 from crm_triana_test.units) then return jsonb_build_object('ready',true,'reset',false);end if;
 if v_role<>'crm_officer' then raise exception 'Ask a CRM officer to prepare the demo customer first.';end if;
 select string_agg(format('crm_triana_test.%I',tablename),',') into tables from pg_tables where schemaname='crm_triana_test' and tablename<>'profiles';
 execute 'truncate table '||tables;
 insert into crm_triana_test.branding select * from public.branding;
 -- Templates/layout files are intentionally not copied into test storage.
 insert into crm_triana_test.units(unit_no,project_name,unit_type,floor,area,total_price,status,availability_status,unit_area_sqft,furnishing_status,list_price)
 select 'TEST-'||lpad(i::text,3,'0'),'TEST ONLY — Triana','2BR+STORE','1',1000,1000000,'Available','Available',1000,'Semi Furnished',1000000 from generate_series(1,5) i;
 select id into uid from crm_triana_test.units where unit_no='TEST-001';
 result:=crm_triana_test.create_customer_sale_atomic(jsonb_build_object(
 'customer_name','Demo Customer — TEST ONLY','email','demo@example.invalid','phone','-','address','TEST ONLY — Not a real customer','nationality','Test',
 'unit_id',uid,'unit_no','TEST-001','total_price',1000000,'booking_date',today,'booking_amount',10000,'booking_payment_date',today,
 'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','partial','balance_followup_date',today+2,'partial_booking_note','TEST ONLY — AED 10,000 received against AED 200,000 Down Payment.',
 'schedule',jsonb_build_array(
 jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date',today),
 jsonb_build_object('stage_name','1st Installment','due_amount',100000,'due_date',today+30),
 jsonb_build_object('stage_name','2nd Installment','due_amount',100000,'due_date',today+60),
 jsonb_build_object('stage_name','Final Installment (Handover)','due_amount',600000,'due_date',today+180),
 jsonb_build_object('stage_name','DLD + Admin Fees','due_amount',45000,'due_date',today+30))));
 return result||jsonb_build_object('ready',true,'reset',p_reset,'unit_no','TEST-001');
end;$$;
revoke all on function crm_triana_test_private.prepare_workspace(boolean) from public,anon;
grant execute on function crm_triana_test_private.prepare_workspace(boolean) to authenticated;
create function crm_triana_test.prepare_test_workspace(p_reset boolean default false) returns jsonb language sql security invoker set search_path='' as $$select crm_triana_test_private.prepare_workspace(p_reset);$$;
revoke all on function crm_triana_test.prepare_test_workspace(boolean) from public,anon;
grant execute on function crm_triana_test.prepare_test_workspace(boolean) to authenticated;

alter role authenticator set pgrst.db_schemas='public,graphql_public,crm_test,crm_triana,crm_triana_test';
notify pgrst,'reload config';
notify pgrst,'reload schema';
