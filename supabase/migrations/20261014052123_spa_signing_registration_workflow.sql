-- SPA tasks are sale-scoped: a resale must never inherit the former buyer's workflow.
alter table public.sales add column spa_progress jsonb not null default '{}'::jsonb;
alter table public.scheduled_actions
  add column spa_sale_id bigint references public.sales(id),
  add column spa_step text,
  add column spa_data jsonb not null default '{}'::jsonb;
alter table public.scheduled_actions drop constraint scheduled_actions_workflow_kind_check;
alter table public.scheduled_actions add constraint scheduled_actions_workflow_kind_check check
 (workflow_kind is null or workflow_kind in ('accounts_confirmation','cheque_clearance','payment_receipt','promise_follow_up','payment_query','payment_follow_up','payment_review','partial_payment_commitment','payment_reported','extension_approval','extension_customer_confirmation','extension_clarification','modification_request','spa'));
alter table public.scheduled_actions add constraint scheduled_actions_spa_fields check
 ((workflow_kind is distinct from 'spa' and spa_sale_id is null and spa_step is null) or
 (workflow_kind='spa' and spa_sale_id is not null and spa_step in ('invite','reminder','call','appointment','followup','clarify','approval','decision','revise','review','remote','developer','email','oqood','issuance','contract')));
create index scheduled_actions_spa_sale_idx on public.scheduled_actions(spa_sale_id) where spa_sale_id is not null;
create unique index scheduled_actions_spa_lane_pending_uidx on public.scheduled_actions
 (spa_sale_id,(case when spa_step='email' then 'email' else 'main' end))
 where workflow_kind='spa' and status='pending';

create or replace function crm_private.spa_payment_ready(p_sale bigint)
returns boolean language sql stable set search_path='' as $$
 with s as (select s.*,u.total_price from public.sales s join public.units u on u.id=s.unit_id
   and u.customer_id=s.customer_id where s.id=p_sale and coalesce(u.status,'') !~* 'cancel'),
 p as (select ps.*,case when ps.stage_name ~* 'dld|admin.*fee' then 'fee'
   when ps.stage_name ~* 'down payment' then 'dp'
   when ps.stage_name ~* '(1st|first).*installment' then 'first' else 'other' end kind,
   coalesce(ps.revised_due_amount,ps.due_amount,0) due,
   coalesce(ps.paid_amount,0)+coalesce((select sum(c.amount) from public.credit_notes c where c.payment_schedule_id=ps.id),0)
   +coalesce((select sum(a.amount) from public.carry_forward_allocations a
      join public.carry_forward_events ne on ne.id=a.negative_event_id
      join public.carry_forward_events pe on pe.id=a.positive_event_id
      where ne.payment_schedule_id=ps.id and pe.payment_schedule_id<>ne.payment_schedule_id and a.reversed_at is null),0) settled
   from public.payment_schedule ps join s on s.unit_id=ps.unit_id and s.customer_id=ps.customer_id)
 select coalesce((select count(*) filter(where kind='fee' and due>0)>0
   and coalesce(sum(greatest(0,due-settled)) filter(where kind='fee'),0)<=0.01
   and (coalesce(sum(least(due,greatest(0,settled))) filter(where kind<>'fee'),0)>=(select total_price*.2 from s)-0.01
     or (count(*) filter(where kind='dp' and due>0)>0 and count(*) filter(where kind='first' and due>0)>0
       and coalesce(sum(greatest(0,due-settled)) filter(where kind in ('dp','first')),0)<=0.01))
   from p),false) and exists(select 1 from s where total_price>0);
$$;
revoke all on function crm_private.spa_payment_ready(bigint) from public,anon,authenticated;

create or replace function crm_private.spa_add_task(p_sale bigint,p_owner uuid,p_step text,p_date date,p_note text default null,p_data jsonb default '{}')
returns bigint language plpgsql set search_path='' as $$
declare v_id bigint; v_label text;
begin
 v_label:=case p_step when 'invite' then 'Send SPA Invitation' when 'reminder' then 'Send SPA Signing Reminder'
 when 'call' then 'Call Customer — SPA Signing' when 'appointment' then 'SPA Signing Appointment'
 when 'followup' then 'Follow Up — SPA Signing' when 'clarify' then 'Reply to SPA Query'
 when 'approval' then 'Review SPA Change Request' when 'decision' then 'Send SPA Decision'
 when 'revise' then 'Prepare Revised SPA' when 'review' then 'Review Revised SPA'
 when 'remote' then 'Send SPA for Digital Signing' when 'developer' then 'Obtain Developer Signature'
 when 'email' then 'Email Fully Executed SPA' when 'oqood' then 'Complete Oqood Registration'
 when 'issuance' then 'Check Initial Contract Issuance' when 'contract' then 'Send Initial Contract of Sale' end;
 if v_label is null then raise exception 'Invalid SPA step.'; end if;
 insert into public.scheduled_actions(unit_id,owner_id,action_label,due_date,note,workflow_kind,spa_sale_id,spa_step,spa_data,source,auto_key)
 select unit_id,p_owner,v_label,p_date,p_note,'spa',id,p_step,p_data,'manual','spa|sale:'||id from public.sales where id=p_sale
 returning id into v_id;
 return v_id;
end;$$;
revoke all on function crm_private.spa_add_task(bigint,uuid,text,date,text,jsonb) from public,anon,authenticated;

create or replace function crm_private.start_spa_after_receipt()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_sale public.sales; v_owner uuid;
begin
 if new.receipt_sent_at is null or (tg_op='UPDATE' and old.receipt_sent_at is not null) or auth.uid() is null then return new; end if;
 select s.* into v_sale from public.sales s join public.units u on u.id=s.unit_id and u.customer_id=s.customer_id
 where s.unit_id=new.unit_id and s.customer_id=new.customer_id order by s.id desc limit 1 for update of s;
 if not found or v_sale.spa_status='Signed' or not crm_private.spa_payment_ready(v_sale.id) then return new; end if;
 if exists(select 1 from public.scheduled_actions where spa_sale_id=v_sale.id) then return new; end if;
 -- All recorded package payments must be receipted; later-installment receipts do not block the SPA.
 if exists(select 1 from public.payment_transactions t left join public.payment_schedule ps on ps.id=t.payment_schedule_id
   where t.unit_id=new.unit_id and t.customer_id=new.customer_id and t.amount>0 and t.receipt_sent_at is null
   and coalesce(t.payment_workflow_status,'')<>'reversed'
   and (ps.stage_name ~* 'dld|admin.*fee|down payment|(1st|first).*installment' or ps.id is null)) then return new; end if;
 v_owner:=coalesce(new.receipt_sent_by,auth.uid());
 perform crm_private.spa_add_task(v_sale.id,v_owner,'invite',(now() at time zone 'Asia/Dubai')::date,'Payment package settled. Invite the customer to sign the SPA.');
 return new;
end;$$;
revoke all on function crm_private.start_spa_after_receipt() from public,anon,authenticated;
create trigger start_spa_after_receipt after insert or update of receipt_sent_at on public.payment_transactions for each row execute function crm_private.start_spa_after_receipt();

-- Keep legacy signed records, but use the approved package rule for new signatures.
create or replace function public.crm_enforce_spa_payment_gate()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if lower(coalesce(new.spa_status,''))<>'signed' or (tg_op='UPDATE' and old.spa_status='Signed') then return new; end if;
 if not crm_private.spa_payment_ready(new.id) then raise exception 'Settle 20%% or the down payment and first installment, plus DLD and admin fees, before marking the SPA signed.'; end if;
 if exists(select 1 from public.scheduled_actions where spa_sale_id=new.id and workflow_kind='spa')
    and nullif(new.spa_progress->>'developer_signed_on','') is null then
   raise exception 'Open the SPA task to record the customer and developer signatures.';
 end if;
 return new;
end;$$;

create or replace function crm_private.resolve_spa_task(p_task_id bigint,p_outcome text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.scheduled_actions; s public.sales; v_sale_id bigint; v_today date:=(now() at time zone 'Asia/Dubai')::date;
 v_date date; v_note text:=nullif(btrim(p_data->>'note'),''); v_ref text:=nullif(btrim(p_data->>'reference'),'');
 v_next text; v_next_date date; v_next_note text; v_data jsonb; v_reminders int; v_done_date date; v_role text;
begin
 select role::text into v_role from public.profiles where id=auth.uid();
 if auth.uid() is null or v_role not in ('crm_officer','manager') or v_role is null then raise exception 'CRM access required.'; end if;
 select spa_sale_id into v_sale_id from public.scheduled_actions where id=p_task_id and workflow_kind='spa';
 -- Consistent lock order also serializes both post-signing branches.
 select * into s from public.sales where id=v_sale_id for update;
 select * into t from public.scheduled_actions where id=p_task_id and workflow_kind='spa' for update;
 if t.id is null or (t.owner_id<>auth.uid() and v_role<>'manager') then raise exception 'This SPA task is not assigned to you.'; end if;
 if t.status='completed' then return jsonb_build_object('already_done',true); end if;
 if t.status<>'pending' then raise exception 'This task is closed.'; end if;
 if not exists(select 1 from public.units where id=s.unit_id and customer_id=s.customer_id and coalesce(status,'') !~* 'cancel') then raise exception 'This sale is no longer active.'; end if;
 v_date:=nullif(p_data->>'date','')::date;
 v_done_date:=coalesce(v_date,v_today);v_next_date:=v_today;
 v_data:=t.spa_data-'outcome'-'reference'-'date'-'note';
 v_reminders:=coalesce((t.spa_data->>'reminders')::int,0);
 if p_outcome in ('appointment','later','no_show','pending') then
   if v_date is null or v_date<v_today then raise exception 'Choose today or a future date.'; end if;
   v_next_date:=v_date;
 end if;
 if p_outcome in ('customer_signed','developer_signed','registered','issued','sent') and v_done_date>v_today then raise exception 'The completed date cannot be in the future.'; end if;
 if p_outcome in ('clarification','change','refused','approved','conditional','rejected') and v_note is null then raise exception 'Enter a short note.'; end if;
 if p_outcome='appointment' and (p_data->>'time') is null then raise exception 'Choose an appointment time.'; end if;
 if p_outcome in ('customer_signed','developer_signed','registered','issued') and v_ref is null then raise exception 'Enter the document or registration reference.'; end if;
 if p_outcome='later' then
   v_next:=t.spa_step;v_next_note:=coalesce(v_note,'Follow up on the selected date.');
 elsif t.spa_step in ('invite','reminder','call','appointment','followup','remote','decision','clarify') then
   case p_outcome
   when 'sent' then
     if t.spa_step not in ('invite','reminder','remote','decision','clarify') then raise exception 'Choose a customer outcome.'; end if;
     if t.spa_step='reminder' then v_reminders:=v_reminders+1; else v_reminders:=0; end if;
     v_next:=case when v_reminders>=2 then 'call' else 'reminder' end;v_next_date:=v_done_date+3;
     v_next_note:='If there is no reply, follow up on this date.';
     v_data:=v_data||jsonb_build_object('reminders',v_reminders);
   when 'accepted' then
     v_next:=case when v_data->>'decision' in ('approved','conditional') and v_data->>'request_type'='change' then 'revise' else 'followup' end;
     v_data:=v_data-'decision'-'request_type';
     v_next_note:=case when v_next='revise' then 'Customer accepted the change. Prepare the revised SPA.' else 'Customer agreed. Arrange SPA signing.' end;
   when 'no_reply' then
     if t.spa_step='call' then raise exception 'Choose a follow-up date or management review.'; end if;
     v_next:=case when v_reminders>=2 then 'call' else 'reminder' end;v_next_note:='Customer has not replied.';
   when 'appointment' then
     perform (p_data->>'time')::time;
     v_next:='appointment';v_next_note:='Office visit at '||(p_data->>'time')||' (Dubai time).';
     v_data:=v_data||jsonb_build_object('appointment_time',p_data->>'time');
   when 'no_show' then
     if t.spa_step<>'appointment' then raise exception 'This is not an appointment.'; end if;
     v_next:='followup';v_next_note:='Customer missed the SPA signing appointment.';
   when 'clarification' then v_next:='clarify';v_next_note:=v_note;
   when 'change' then v_next:='approval';v_next_note:=v_note;v_data:=v_data||jsonb_build_object('request',v_note,'request_type','change');
   when 'refused' then v_next:='approval';v_next_note:=v_note;v_data:=v_data||jsonb_build_object('request',v_note,'request_type','refusal');
   when 'remote' then v_next:='remote';v_next_note:='Send the SPA using the approved digital signing process.';
   when 'customer_signed' then
     if coalesce(p_data->>'method','') not in ('office','digital') then raise exception 'Choose Office or Digital signing.'; end if;
     update public.sales set spa_progress=spa_progress||jsonb_build_object('customer_signed_on',v_done_date,'signing_method',p_data->>'method','customer_signed_reference',v_ref),updated_at=now() where id=s.id;
     v_next:='developer';v_next_note:='Customer signed. Obtain the developer signature.';
   else raise exception 'Choose a valid SPA outcome.'; end case;
 elsif t.spa_step='approval' then
   if p_outcome not in ('approved','conditional','rejected') then raise exception 'Choose the management decision.'; end if;
   v_data:=v_data||jsonb_build_object('decision',p_outcome,'decision_note',v_note);
   v_next:='decision';v_next_note:=v_note;
 elsif t.spa_step='revise' and p_outcome='prepared' then
   if v_ref is null then raise exception 'Enter the revised SPA reference.'; end if;
   v_data:=v_data||jsonb_build_object('revised_reference',v_ref);v_next:='review';v_next_note:='Check the revised SPA before sending.';
 elsif t.spa_step='review' and p_outcome in ('checked','revise') then
   v_next:=case p_outcome when 'checked' then 'invite' else 'revise' end;v_next_note:=coalesce(v_note,'Revised SPA reviewed.');
 elsif t.spa_step='developer' and p_outcome='developer_signed' then
   if nullif(s.spa_progress->>'customer_signed_on','') is null then raise exception 'Record the customer signature first.'; end if;
   if v_done_date<(s.spa_progress->>'customer_signed_on')::date then raise exception 'Developer signature cannot be before customer signature.'; end if;
   update public.sales set spa_progress=spa_progress||jsonb_build_object('developer_signed_on',v_done_date,'executed_reference',v_ref),spa_status='Signed',spa_date=v_done_date,updated_at=now() where id=s.id;
   v_next:='oqood';v_next_note:='Both parties have signed. Complete Oqood registration.';
 elsif t.spa_step='email' and p_outcome='sent' then
   update public.sales set spa_progress=spa_progress||jsonb_build_object('spa_emailed_on',v_done_date,'spa_email_note',coalesce(v_note,'')),updated_at=now() where id=s.id;
 elsif t.spa_step='oqood' and p_outcome='registered' then
   update public.sales set oqood_status='Completed',oqood_date=v_done_date,spa_progress=spa_progress||jsonb_build_object('oqood_reference',v_ref,'oqood_registered_on',v_done_date),updated_at=now() where id=s.id;
   v_next:='issuance';v_next_note:='Check whether the Initial Contract of Sale has been issued.';
 elsif t.spa_step='issuance' and p_outcome='pending' then
   v_next:='issuance';v_next_note:='Initial Contract of Sale not yet issued. Check again.';
 elsif t.spa_step='issuance' and p_outcome='issued' then
   update public.sales set spa_progress=spa_progress||jsonb_build_object('initial_contract_issued_on',v_done_date,'initial_contract_reference',v_ref),updated_at=now() where id=s.id;
   v_next:='contract';v_next_note:='Initial Contract of Sale issued. Send it to the customer.';
 elsif t.spa_step='contract' and p_outcome='sent' then
   update public.sales set spa_progress=spa_progress||jsonb_build_object('initial_contract_sent_on',v_done_date,'initial_contract_send_note',coalesce(v_note,'')),updated_at=now() where id=s.id;
 else raise exception 'Choose a valid SPA outcome.'; end if;

 update public.scheduled_actions set status='completed',completed_at=now(),updated_at=now(),
   completion_note=replace(p_outcome,'_',' ')||coalesce(' · '||v_note,''),spa_data=spa_data||p_data||jsonb_build_object('outcome',p_outcome,'recorded_by',auth.uid()) where id=t.id;
 if v_next is not null then perform crm_private.spa_add_task(s.id,t.owner_id,v_next,v_next_date,coalesce(v_next_note,v_note),v_data); end if;
 if t.spa_step='developer' and p_outcome='developer_signed' then
   perform crm_private.spa_add_task(s.id,t.owner_id,'email',v_today,'Email the fully executed SPA to the customer.');
 end if;
 return jsonb_build_object('next_step',v_next,'completed',true);
end;$$;
revoke all on function crm_private.resolve_spa_task(bigint,text,jsonb) from public,anon;
grant usage on schema crm_private to authenticated;
grant execute on function crm_private.resolve_spa_task(bigint,text,jsonb) to authenticated;
create or replace function public.crm_resolve_spa_task(p_task_id bigint,p_outcome text,p_data jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$ select crm_private.resolve_spa_task(p_task_id,p_outcome,p_data); $$;
revoke all on function public.crm_resolve_spa_task(bigint,text,jsonb) from public,anon;
grant execute on function public.crm_resolve_spa_task(bigint,text,jsonb) to authenticated;

create or replace function crm_private.close_inactive_spa_tasks()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.customer_id is distinct from old.customer_id or new.status ~* 'cancel' or new.availability_status='Available' then
   update public.scheduled_actions a set status='cancelled',cancelled_at=now(),updated_at=now(),completion_note='Sale no longer active.'
   from public.sales s where a.spa_sale_id=s.id and a.status='pending' and a.unit_id=new.id
     and (s.customer_id is distinct from new.customer_id or new.status ~* 'cancel' or new.availability_status='Available');
 end if;
 return new;
end;$$;
revoke all on function crm_private.close_inactive_spa_tasks() from public,anon,authenticated;
create trigger close_inactive_spa_tasks after update of customer_id,status,availability_status on public.units for each row execute function crm_private.close_inactive_spa_tasks();

-- Shared validation for the existing inline SPA editor.
grant execute on function crm_private.spa_payment_ready(bigint) to authenticated;
create function public.crm_spa_payment_ready(p_unit_id bigint) returns boolean
language sql security invoker set search_path='' as $$
 select coalesce((select crm_private.spa_payment_ready(s.id) from public.sales s
 join public.units u on u.id=s.unit_id and u.customer_id=s.customer_id
 where s.unit_id=p_unit_id order by s.id desc limit 1),false);
$$;
revoke all on function public.crm_spa_payment_ready(bigint) from public,anon;
grant execute on function public.crm_spa_payment_ready(bigint) to authenticated;
