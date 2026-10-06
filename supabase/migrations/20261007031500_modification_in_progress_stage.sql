-- Final modification stage remains In Progress until manually completed.

alter table public.modification_requests
  drop constraint if exists modification_requests_status_check;
alter table public.modification_requests
  drop constraint if exists modification_requests_step_check;

update public.modification_requests
   set status='in_progress'
 where status='execution';

update public.modification_requests
   set step='in_progress'
 where step='execution';

alter table public.modification_requests
  add constraint modification_requests_status_check
  check (status in (
    'under_review',
    'clarification_required',
    'approval_pending',
    'awaiting_customer_confirmation',
    'in_progress',
    'completed',
    'not_feasible',
    'rejected',
    'withdrawn'
  ));

alter table public.modification_requests
  add constraint modification_requests_step_check
  check (step in (
    'review',
    'clarification',
    'management_approval',
    'send_confirmation',
    'customer_confirmation',
    'inform_customer',
    'in_progress',
    'closed'
  ));

update public.scheduled_actions a
   set action_label='Modification In Progress',
       updated_at=now()
 where a.workflow_kind='modification_request'
   and a.status='pending'
   and exists (
     select 1
     from public.modification_requests r
     where r.id=a.modification_request_id
       and r.step='in_progress'
   );

create or replace function public.crm_advance_modification_request(
  p_task_id bigint,
  p_outcome text,
  p_note text default null,
  p_next_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_task public.scheduled_actions%rowtype;
  v_req public.modification_requests%rowtype;
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_today date := (now() at time zone 'Asia/Dubai')::date;
  v_from_status text;
  v_to_status text;
  v_event text;
  v_action text;
  v_due date;
  v_priority text := 'Medium';
  v_new_step text;
  v_close boolean := false;
  v_note text := nullif(btrim(coalesce(p_note,'')),'');
begin
  if not exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.role::text in ('crm_officer','manager')
  ) then
    raise exception 'You are not authorized to update modification requests.';
  end if;

  select * into v_task
  from public.scheduled_actions
  where id=p_task_id
  for update;

  if not found
     or v_task.status<>'pending'
     or v_task.workflow_kind<>'modification_request'
     or v_task.modification_request_id is null then
    raise exception 'Pending modification workflow task not found.';
  end if;

  select * into v_req
  from public.modification_requests
  where id=v_task.modification_request_id
  for update;

  if not found or v_req.step='closed' then
    raise exception 'Active modification request not found.';
  end if;

  v_from_status := v_req.status;

  if v_req.step='review' then
    if p_outcome='feasible' then
      v_to_status:='under_review'; v_new_step:='send_confirmation';
      v_action:='Send Final Modification Confirmation'; v_due:=v_today;
      v_event:='feasible';
    elsif p_outcome='clarification_required' then
      if p_next_date is null then raise exception 'Select the customer follow-up date.'; end if;
      v_to_status:='clarification_required'; v_new_step:='clarification';
      v_action:='Follow up for Modification Clarification'; v_due:=p_next_date;
      v_priority:='High'; v_event:='clarification_required';
    elsif p_outcome='management_approval_required' then
      v_to_status:='approval_pending'; v_new_step:='management_approval';
      v_action:='Management Approval — Modification Request'; v_due:=v_today;
      v_priority:='High'; v_event:='management_approval_required';
    elsif p_outcome='not_feasible' then
      v_to_status:='not_feasible'; v_new_step:='inform_customer';
      v_action:='Inform Customer — Modification Not Feasible'; v_due:=v_today;
      v_priority:='High'; v_event:='not_feasible';
    else
      raise exception 'Select a valid review outcome.';
    end if;

  elsif v_req.step='clarification' then
    if p_outcome='clarified' then
      v_to_status:='under_review'; v_new_step:='review';
      v_action:='Review Modification Request'; v_due:=v_today;
      v_event:='clarification_received';
    elsif p_outcome='no_response' then
      if p_next_date is null then raise exception 'Select the next follow-up date.'; end if;
      v_to_status:='clarification_required'; v_new_step:='clarification';
      v_action:='Follow up for Modification Clarification'; v_due:=p_next_date;
      v_priority:='High'; v_event:='no_response';
    elsif p_outcome='withdrawn' then
      v_to_status:='withdrawn'; v_new_step:='closed';
      v_event:='withdrawn'; v_close:=true;
    else
      raise exception 'Select a valid clarification outcome.';
    end if;

  elsif v_req.step='management_approval' then
    if p_outcome='approved' then
      v_to_status:='under_review'; v_new_step:='send_confirmation';
      v_action:='Send Final Modification Confirmation'; v_due:=v_today;
      v_event:='management_approved';
    elsif p_outcome='rejected' then
      v_to_status:='rejected'; v_new_step:='inform_customer';
      v_action:='Inform Customer — Modification Rejected'; v_due:=v_today;
      v_priority:='High'; v_event:='management_rejected';
    else
      raise exception 'Select Approved or Rejected.';
    end if;

  elsif v_req.step='send_confirmation' then
    if p_outcome<>'sent' then raise exception 'Mark the final confirmation as sent.'; end if;
    v_to_status:='awaiting_customer_confirmation'; v_new_step:='customer_confirmation';
    v_action:='Await Customer Confirmation'; v_due:=coalesce(p_next_date,v_today+3);
    v_event:='final_confirmation_sent';

  elsif v_req.step='customer_confirmation' then
    if p_outcome='confirmed' then
      v_to_status:='in_progress'; v_new_step:='in_progress';
      v_action:='Modification In Progress'; v_due:=v_today;
      v_event:='customer_confirmed';
    elsif p_outcome='revision_requested' then
      if v_note is null then raise exception 'Enter the revised request/details.'; end if;
      v_to_status:='under_review'; v_new_step:='review';
      v_action:='Review Revised Modification Request'; v_due:=v_today;
      v_event:='revision_requested';
    elsif p_outcome='no_response' then
      if p_next_date is null then raise exception 'Select the next follow-up date.'; end if;
      v_to_status:='awaiting_customer_confirmation'; v_new_step:='customer_confirmation';
      v_action:='Await Customer Confirmation'; v_due:=p_next_date;
      v_event:='no_response';
    elsif p_outcome='withdrawn' then
      v_to_status:='withdrawn'; v_new_step:='closed';
      v_event:='withdrawn'; v_close:=true;
    else
      raise exception 'Select a valid customer outcome.';
    end if;

  elsif v_req.step='inform_customer' then
    if p_outcome<>'informed' then raise exception 'Mark the customer as informed.'; end if;
    v_to_status:=v_req.status; v_new_step:='closed';
    v_event:='customer_informed'; v_close:=true;

  elsif v_req.step='in_progress' then
    if p_outcome<>'completed' then raise exception 'Mark the modification as completed.'; end if;
    v_to_status:='completed'; v_new_step:='closed';
    v_event:='completed'; v_close:=true;

  else
    raise exception 'Unsupported modification workflow step.';
  end if;

  update public.modification_requests
     set status=v_to_status,
         step=v_new_step,
         revision_no=case when v_event='revision_requested' then revision_no+1 else revision_no end,
         details=case when v_event='revision_requested' and v_note is not null then v_note else details end,
         updated_at=v_now,
         closed_at=case when v_close then v_now else null end
   where id=v_req.id;

  insert into public.modification_request_events(
    request_id,event_type,from_status,to_status,note,created_by,created_at
  ) values (
    v_req.id,v_event,v_from_status,v_to_status,v_note,v_user,v_now
  );

  if v_close then
    update public.scheduled_actions
       set status='completed',
           completed_at=v_now,
           completion_note=coalesce(v_note,
             case
               when v_to_status='completed' then 'Modification completed.'
               when v_to_status='withdrawn' then 'Modification request withdrawn.'
               else 'Customer informed and request closed.'
             end),
           updated_at=v_now
     where id=v_task.id;
  else
    update public.scheduled_actions
       set action_label=v_action,
           due_date=v_due,
           priority=v_priority,
           note=case
             when v_note is not null then v_note
             when v_event='final_confirmation_sent' then 'Final modification confirmation sent. Awaiting customer confirmation.'
             when v_event='customer_confirmed' then 'Customer confirmed the final modification scope.'
             else v_task.note
           end,
           status='pending',
           source='manual',
           auto_kind=null,
           auto_key='modification|request:'||v_req.id::text,
           schedule_id=null,
           transaction_id=null,
           workflow_kind='modification_request',
           commitment_part_id=null,
           extension_request_id=null,
           modification_request_id=v_req.id,
           completed_at=null,
           completion_note=null,
           cancelled_at=null,
           updated_at=v_now
     where id=v_task.id;
  end if;

  return jsonb_build_object(
    'request_id',v_req.id,
    'request_no',v_req.request_no,
    'task_id',v_task.id,
    'status',v_to_status,
    'step',v_new_step,
    'next_action',case when v_close then null else v_action end,
    'closed',v_close
  );
end;
$function$;

grant execute on function public.crm_create_modification_request(bigint,text,text,text,date) to authenticated;
grant execute on function public.crm_get_modification_requests(bigint) to authenticated;
grant execute on function public.crm_get_modification_request(bigint) to authenticated;

grant execute on function public.crm_advance_modification_request(bigint,text,text,date) to authenticated;
