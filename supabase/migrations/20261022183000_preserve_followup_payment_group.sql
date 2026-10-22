-- Preserve all payment links when an overdue task becomes a customer follow-up.
-- Guard repeated No Response / promise outcomes for the same payment(s) and date.
-- Historical task transitions stay in scheduled_action_events; no money or payment dates change.
DO $upgrade$
DECLARE
  src text;
  old_vars text := $old$declare t public.scheduled_actions; s public.payment_schedule; r jsonb; today date:=(now() at time zone 'Asia/Dubai')::date; v_is_group boolean:=false; v_ids bigint[];$old$;
  new_vars text := $new$declare t public.scheduled_actions; s public.payment_schedule; r jsonb; today date:=(now() at time zone 'Asia/Dubai')::date; v_is_group boolean:=false; v_ids bigint[]; v_followup_key text; v_duplicate bigint;$new$;
  old_group text := $old$v_is_group:=coalesce(t.auto_key,'') ~ '^manual_payment[|]unit:[0-9]+[|]schedules:[0-9]+(,[0-9]+)+$';$old$;
  new_group text := $new$v_is_group:=coalesce(t.auto_key,'') ~ '^(manual_payment|overdue_follow_up)[|]unit:[0-9]+[|]schedules:[0-9]+(,[0-9]+)+$';$new$;
  old_select text := $old$select array_agg(x::bigint) into v_ids$old$;
  new_select text := $new$select array_agg(x::bigint order by x::bigint) into v_ids$new$;
  update_anchor text := $old$ update public.scheduled_actions set
 action_label=case$old$;
  update_prelude text := $new$
 -- The displayed group and future automation must retain the original linked obligations.
 v_followup_key:=case
   when v_is_group then 'manual_payment|unit:'||t.unit_id||'|schedules:'||array_to_string(v_ids,',')
   when t.auto_kind='overdue_follow_up' then 'manual_payment|unit:'||t.unit_id||'|schedule:'||s.id
   else t.auto_key
 end;
 -- Repeating the same customer response should not create two follow-ups
 -- for the same linked installment group on the same follow-up date.
 if p_outcome in ('no_response','will_pay_later') and v_followup_key like 'manual_payment|%' then
   select x.id into v_duplicate from public.scheduled_actions x
    where x.id<>t.id and x.unit_id=t.unit_id and x.status='pending'
      and x.source='manual' and x.auto_kind is null
      and x.workflow_kind=case when p_outcome='will_pay_later' then 'promise_follow_up' else 'payment_follow_up' end
      and x.due_date=p_next_date and x.auto_key=v_followup_key
      and x.transaction_id is null and x.commitment_part_id is null
    order by x.id limit 1 for update;
   if v_duplicate is not null then
     update public.scheduled_actions
       set status='cancelled',cancelled_at=now(),updated_at=now(),
         completion_note='Consolidated into follow-up task #'||v_duplicate||
           ' for the same payment(s) and date. Response: '||replace(p_outcome,'_',' ')||
           case when nullif(btrim(p_note),'') is null then '' else '. Note: '||p_note end
       where id=t.id;
     return jsonb_build_object('task_id',t.id,'outcome',p_outcome,'consolidated_into',v_duplicate);
   end if;
 end if;
 update public.scheduled_actions set
 action_label=case$new$;
  old_fields text := $old$ due_date=p_next_date,note=p_note,source='manual',auto_kind=null,
 workflow_kind=case$old$;
  new_fields text := $new$ due_date=p_next_date,note=p_note,source='manual',auto_kind=null,
 schedule_id=case when v_is_group then null else s.id end,
 auto_key=v_followup_key,
 workflow_kind=case$new$;
BEGIN
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='crm_record_scheduled_outcome' and p.pronargs=7;
  if src is null then raise exception 'Collection outcome function missing'; end if;
  if position('v_followup_key text' in src)>0 then return; end if;
  if position(old_vars in src)=0 or position(old_group in src)=0
    or position(old_select in src)=0 or position(update_anchor in src)=0
    or position(old_fields in src)=0 then
    raise exception 'Collection outcome function changed: refusing unsafe partial edit';
  end if;
  src:=replace(src,old_vars,new_vars);
  src:=replace(src,old_group,new_group);
  src:=replace(src,old_select,new_select);
  src:=replace(src,update_anchor,update_prelude);
  src:=replace(src,old_fields,new_fields);
  execute src;
END;
$upgrade$;
