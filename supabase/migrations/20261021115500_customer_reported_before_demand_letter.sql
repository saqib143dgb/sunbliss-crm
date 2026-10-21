-- Customer-confirmed payment before Demand Letter: preserve audit, prevent duplicate collection, and resume payment verification.
-- This migration is mirrored to the crm_test schema by the existing Test Mode routine refresh.

CREATE OR REPLACE FUNCTION public.crm_customer_reported_before_demand_letter(p_task_id bigint, p_expected_updated_at timestamp with time zone, p_source text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_task public.scheduled_actions%rowtype;
 v_schedule public.payment_schedule%rowtype;
 v_group text[];
 v_ids bigint[];
 v_sid bigint;
 v_task_id bigint;
 v_created jsonb := '[]'::jsonb;
 v_today date := (now() at time zone 'Asia/Dubai')::date;
 v_reason text;
 v_owner uuid := auth.uid();
begin
 if v_owner is null or not exists (
   select 1 from public.profiles p where p.id=v_owner and p.role::text='crm_officer'
 ) then raise exception 'Only CRM officers can record this outcome.'; end if;
 if p_source not in ('phone_call','whatsapp','email','other') then
   raise exception 'Select how the customer confirmed payment.';
 end if;
 select * into v_task from public.scheduled_actions
 where id=p_task_id for update;
 if not found or v_task.status <> 'pending'
     or v_task.auto_kind <> 'demand_letter'
     or v_task.action_label <> 'Send Demand Letter' then
   raise exception 'This is no longer a pending Demand Letter. Refresh the task.';
 end if;
 if v_task.owner_id is distinct from v_owner then
   raise exception 'This Demand Letter is not assigned to your account.';
 end if;
 if v_task.updated_at is distinct from p_expected_updated_at then
   raise exception 'The task was updated. Reopen it before saving.';
 end if;
 if v_task.schedule_id is not null then
   v_ids := array[v_task.schedule_id];
 else
   v_group := regexp_match(coalesce(v_task.auto_key,''),'[|]schedules:([0-9,]+)');
   if v_group is not null then
     select array_agg(distinct x::bigint order by x::bigint) into v_ids
       from unnest(string_to_array(v_group[1],',')) as x;
   end if;
 end if;
 if coalesce(array_length(v_ids,1),0)=0 then
   raise exception 'The Demand Letter does not identify an installment. Please review its linkage.';
 end if;
 v_reason := 'Customer confirmed payment before Demand Letter via ' ||
   case p_source when 'phone_call' then 'Phone Call'
                 when 'whatsapp' then 'WhatsApp'
                 when 'email' then 'Email' else 'Other' end ||
   '. Demand Letter not sent; Accounts verification pending.' ||
   case when nullif(btrim(coalesce(p_note,'')),'') is not null
        then ' Note: ' || btrim(p_note) else '' end;

 -- Validate all linked installments and existing workflows before making changes.
 foreach v_sid in array v_ids loop
   select * into v_schedule from public.payment_schedule
     where id=v_sid and unit_id=v_task.unit_id for update;
   if not found then raise exception 'A linked installment could not be verified.'; end if;
   if exists (
     select 1 from public.scheduled_actions a
     where a.unit_id=v_task.unit_id and a.schedule_id=v_sid
       and a.status='pending' and a.source='manual' and a.auto_kind is null
       and a.transaction_id is null and a.commitment_part_id is null
       and a.extension_request_id is null and a.modification_request_id is null
       and a.workflow_kind <> 'accounts_confirmation'
   ) then
     raise exception 'This installment already has a pending manual collection task. Review that task to avoid duplicates.';
   end if;
 end loop;

 foreach v_sid in array v_ids loop
   select * into v_schedule from public.payment_schedule where id=v_sid;
   select id into v_task_id from public.scheduled_actions
   where unit_id=v_task.unit_id and schedule_id=v_sid
     and status='pending' and workflow_kind='accounts_confirmation'
     and transaction_id is null and source='manual'
   order by id desc limit 1 for update;

   if v_task_id is null then
     insert into public.scheduled_actions(
       unit_id, action_label, due_date, priority, note, status, owner_id,
       source, auto_kind, auto_key, schedule_id, workflow_kind, created_at, updated_at
     ) values (
       v_task.unit_id, 'Confirm Payment with Accounts', v_today, 'High',
       'Customer reports payment before Demand Letter for ' || coalesce(v_schedule.stage_name,'installment') ||
       ' (AED ' || trim(to_char(coalesce(v_schedule.due_amount,0),'FM999G999G999G990D00')) ||
       '). Verify with Accounts before recording payment or issuing a receipt. ' || v_reason,
       'pending',v_owner,'manual',null,
       'customer_reported_before_demand_letter|task:' || v_task.id || '|schedule:' || v_sid,
       v_sid,'accounts_confirmation',now(),now()
     ) returning id into v_task_id;
   end if;
   v_created := v_created || jsonb_build_array(v_task_id);
 end loop;

 perform set_config('crm.task_outcome','customer_confirmed_payment',true);
 update public.scheduled_actions
 set status='cancelled',completed_at=null,cancelled_at=now(),
     completion_note=v_reason,updated_at=now()
 where id=v_task.id;

 return jsonb_build_object(
   'demand_letter_task_id',v_task.id,'outcome','customer_confirmed_payment',
   'accounts_tasks',v_created,'installment_ids',to_jsonb(v_ids)
 );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_reconcile_pre_demand_payment_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.unit_id is null or new.payment_schedule_id is null then return new; end if;
 update public.scheduled_actions a
 set status=case when new.accounts_confirmation_status='confirmed' then 'completed' else 'cancelled' end,
     completed_at=case when new.accounts_confirmation_status='confirmed' then now() else null end,
     cancelled_at=case when new.accounts_confirmation_status='confirmed' then null else now() end,
     completion_note=case when new.accounts_confirmation_status='confirmed'
       then 'Accounts-confirmed payment recorded in transaction #' || new.id ||
            '. Continue with the transaction-linked Payment Receipt task.'
       else 'Payment entered as transaction #' || new.id ||
            '. Verification continues through the transaction-linked payment workflow.' end,
     updated_at=now()
 where a.unit_id=new.unit_id and a.schedule_id=new.payment_schedule_id
   and a.workflow_kind='accounts_confirmation' and a.transaction_id is null
   and a.source='manual' and a.status='pending'
   and a.auto_key like 'customer_reported_before_demand_letter|task:%';
 return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.crm_resolve_pre_demand_verification(p_task_id bigint, p_outcome text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_task public.scheduled_actions%rowtype; v_owner uuid:=auth.uid();
begin
 if v_owner is null or not exists(
   select 1 from public.profiles p where p.id=v_owner and p.role::text='crm_officer'
 ) then raise exception 'Only CRM officers can record this outcome.'; end if;
 select * into v_task from public.scheduled_actions where id=p_task_id for update;
 if not found or v_task.status<>'pending'
     or v_task.workflow_kind<>'accounts_confirmation'
     or v_task.transaction_id is not null
     or v_task.auto_key not like 'customer_reported_before_demand_letter|task:%'
     or v_task.owner_id is distinct from v_owner
 then raise exception 'This is not an active pre-demand verification task.'; end if;
 if p_outcome not in ('not_received','amount_mismatch') then
   raise exception 'Select Not Received or Amount Mismatch. For confirmed payments, use Record Payment.';
 end if;
 perform set_config('crm.task_outcome',p_outcome,true);
 update public.scheduled_actions
 set action_label=case p_outcome when 'not_received' then 'Payment Follow-up with Customer'
                                      else 'Review Payment Amount' end,
     workflow_kind=case p_outcome when 'not_received' then 'payment_follow_up'
                                else 'payment_review' end,
     due_date=(now() at time zone 'Asia/Dubai')::date,priority='High',
     note=case when nullif(btrim(coalesce(p_note,'')),'') is not null then btrim(p_note)
       when p_outcome='not_received' then 'Accounts could not verify the customer-reported payment. Request transfer details or evidence from the customer.'
       else 'Accounts found an amount mismatch. Clarify the actual amount before recording payment.' end,
     updated_at=now()
 where id=v_task.id;
 return jsonb_build_object('task_id',v_task.id,'outcome',p_outcome);
end;
$function$
;

revoke all on function public.crm_customer_reported_before_demand_letter(bigint,timestamptz,text,text) from public,anon;
grant execute on function public.crm_customer_reported_before_demand_letter(bigint,timestamptz,text,text) to authenticated;
revoke all on function public.crm_reconcile_pre_demand_payment_task() from public,anon,authenticated;
drop trigger if exists zz_reconcile_pre_demand_payment_task on public.payment_transactions;
create trigger zz_reconcile_pre_demand_payment_task after insert on public.payment_transactions
for each row execute function public.crm_reconcile_pre_demand_payment_task();
revoke all on function public.crm_resolve_pre_demand_verification(bigint,text,text) from public,anon;
grant execute on function public.crm_resolve_pre_demand_verification(bigint,text,text) to authenticated;
