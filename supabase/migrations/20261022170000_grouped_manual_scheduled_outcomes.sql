-- Allow one manual scheduled action to reference multiple payment_schedule IDs via
-- its existing "manual_payment|unit:<id>|schedules:<id,id>" key.
-- No data is changed. A specific stage still must be chosen for a payment outcome.
DO $upgrade$
DECLARE
  body_sql text;
  old_vars text := 'declare t public.scheduled_actions; s public.payment_schedule; r jsonb; today date:=(now() at time zone ''Asia/Dubai'')::date;';
  new_vars text := 'declare t public.scheduled_actions; s public.payment_schedule; r jsonb; today date:=(now() at time zone ''Asia/Dubai'')::date; v_is_group boolean:=false; v_ids bigint[];';
  old_select text := 'select * into s from public.payment_schedule where id=coalesce(t.schedule_id,p_schedule_id) and unit_id=t.unit_id for update;';
  new_select text := $replacement$
 v_is_group:=coalesce(t.auto_key,'') ~ '^manual_payment[|]unit:[0-9]+[|]schedules:[0-9]+(,[0-9]+)+$';
 if v_is_group then
   select array_agg(x::bigint) into v_ids
     from regexp_split_to_table(split_part(t.auto_key,'|schedules:',2),',') as x;
   if p_schedule_id is null or not (p_schedule_id=any(v_ids)) then
     raise exception 'Choose a payment linked to this scheduled action.';
   end if;
 end if;
 select * into s from public.payment_schedule
   where id=case when v_is_group then p_schedule_id else coalesce(t.schedule_id,p_schedule_id) end
     and unit_id=t.unit_id for update;
$replacement$;
  old_link text := 'if t.schedule_id is null then update public.scheduled_actions set schedule_id=s.id where id=t.id;end if;';
  new_link text := 'if t.schedule_id is null and not v_is_group then update public.scheduled_actions set schedule_id=s.id where id=t.id;end if;';
  old_partial text := 'elsif p_outcome=''partial_payment_commitment'' then';
  new_partial text := $replacement$
 elsif p_outcome='partial_payment_commitment' then
   if v_is_group then
     raise exception 'Create a separate installment task before making a partial-payment commitment.';
   end if;
$replacement$;
BEGIN
  select pg_get_functiondef(p.oid) into body_sql
    from pg_proc p join pg_namespace n on p.pronamespace=n.oid
   where n.nspname='public' and p.proname='crm_record_scheduled_outcome' and p.pronargs=7;
  if body_sql is null then
    raise exception 'crm_record_scheduled_outcome not found';
  end if;
  if position('v_is_group boolean' in body_sql)>0 then return; end if;
  if position(old_vars in body_sql)=0 or position(old_select in body_sql)=0
    or position(old_link in body_sql)=0 or position(old_partial in body_sql)=0 then
    raise exception 'Scheduled-outcome RPC changed; review manually instead of applying partial replacement';
  end if;
  body_sql:=replace(body_sql,old_vars,new_vars);
  body_sql:=replace(body_sql,old_select,new_select);
  body_sql:=replace(body_sql,old_link,new_link);
  body_sql:=replace(body_sql,old_partial,new_partial);
  execute body_sql;
END;
$upgrade$;
