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
 if (p_outcome='customer_signed' or (t.spa_step in ('invite','remote') and p_outcome='sent')) and not crm_private.spa_payment_ready(s.id) then raise exception 'The payment package is no longer settled. Review payments before continuing.'; end if;
 v_date:=nullif(p_data->>'date','')::date;
 v_done_date:=coalesce(v_date,v_today);v_next_date:=v_today;
 v_data:=t.spa_data-'outcome'-'reference'-'date'-'note';
 v_reminders:=coalesce((t.spa_data->>'reminders')::int,0);
 if p_outcome in ('appointment','later','no_show','pending') then
   if v_date is null or v_date<v_today then raise exception 'Choose today or a future date.'; end if;
   v_next_date:=v_date;
 end if;
 if p_outcome in ('customer_signed','developer_signed','registered','issued','sent') and v_done_date>v_today then raise exception 'The completed date cannot be in the future.'; end if;
 if p_outcome in ('clarification','change','refused','escalate','approved','conditional','rejected') and v_note is null then raise exception 'Enter a short note.'; end if;
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
   when 'escalate' then v_next:='approval';v_next_note:=v_note;v_data:=v_data||jsonb_build_object('request',v_note,'request_type','signing');
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

-- An active Oqood workflow must record the reference and create the issuance task.
create function crm_private.guard_spa_oqood_status() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.oqood_status='Completed' and old.oqood_status is distinct from 'Completed'
   and exists(select 1 from public.scheduled_actions where spa_sale_id=new.id)
   and nullif(new.spa_progress->>'oqood_registered_on','') is null then
   raise exception 'Open the Oqood task to record registration and its reference.';
 end if;
 return new;
end;$$;
revoke all on function crm_private.guard_spa_oqood_status() from public,anon,authenticated;
create trigger guard_spa_oqood_status before update of oqood_status on public.sales for each row execute function crm_private.guard_spa_oqood_status();
