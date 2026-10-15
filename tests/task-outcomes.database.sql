begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
set local role authenticated;
do $$
declare u public.units; r jsonb; sid bigint; tid bigint; tx bigint; part bigint; before_updated timestamptz; failed boolean; today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 select * into strict u from public.units where availability_status='Available' order by id limit 1 for update;
 r:=public.create_customer_sale_atomic(jsonb_build_object('customer_name','Synthetic outcome test','unit_id',u.id,'unit_no',u.unit_no,'total_price',1000000,'booking_date',today,'booking_amount',10000,'booking_payment_date',today,'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','partial','balance_followup_date',today+2,'partial_booking_note','Test booking','schedule',jsonb_build_array(jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date',today),jsonb_build_object('stage_name','DLD + Admin Fees','due_amount',40000,'due_date',today))));
 sid:=(r->>'down_payment_schedule_id')::bigint;
 update public.scheduled_actions set status='completed',completed_at=now() where id=(r->>'welcome_task_id')::bigint;
 update public.scheduled_actions set status='cancelled',cancelled_at=now() where unit_id=u.id and status='pending' and transaction_id is null;
 insert into public.scheduled_actions(unit_id,owner_id,action_label,due_date,priority,status,source,schedule_id)
 values(u.id,auth.uid(),'Collect Payment',today,'Medium','pending','manual',sid) returning id,updated_at into tid,before_updated;
 perform public.crm_record_scheduled_outcome(tid,before_updated,'will_pay_later',sid,'Customer promised payment',today+2,null);
 if (select paid_amount from public.payment_schedule where id=sid)<>10000 then raise exception 'Promise changed balance';end if;
 if not exists(select 1 from public.scheduled_action_events where task_id=tid and outcome='will_pay_later') then raise exception 'Missing history';end if;
 -- Reject a stale request even when the task remains pending.
 failed:=false;begin perform public.crm_record_scheduled_outcome(tid,before_updated-interval '1 minute','cancel_task',sid,'Stale request',null,null);exception when others then failed:=true;end;
 if not failed then raise exception 'Stale task was accepted';end if;
 update public.payment_schedule set revised_due_amount=210000 where id=sid;
 select updated_at into before_updated from public.scheduled_actions where id=tid;
 failed:=false;begin perform public.crm_record_scheduled_outcome(tid,before_updated,'partial_payment_commitment',sid,null,null,'[{"amount":100,"date":"2099-01-01"},{"amount":100,"date":"2099-02-01"}]');exception when others then failed:=true;end;
 if not failed then raise exception 'Short commitment total accepted';end if;
 perform public.crm_record_scheduled_outcome(tid,before_updated,'partial_payment_commitment',sid,'Two parts',null,jsonb_build_array(jsonb_build_object('amount',90000,'date',today+2),jsonb_build_object('amount',110000,'date',today+12)));
 if (select count(*) from public.scheduled_actions where unit_id=u.id and workflow_kind='partial_payment_commitment' and status='pending')<>2 then raise exception 'Expected one task per part';end if;
 select commitment_part_id into part from public.scheduled_actions where id=tid;
 r:=public.crm_record_payment_with_credit_note(sid,90000,today,null,'Test part',0,null,null,null);tx:=(r->>'transaction_id')::bigint;
 perform public.crm_link_payment_commitment_part(tx,part);
 perform public.crm_set_payment_confirmation_mode(tx,'confirmed_by_accounts',null);
 update public.scheduled_actions set status='completed',completed_at=now(),updated_at=clock_timestamp() where id=tid;
 select id into tid from public.scheduled_actions where transaction_id=tx and status='pending';
 perform public.crm_resolve_payment_workflow_task(tid,'sent',null,null);
 if (select count(*) from public.scheduled_actions where unit_id=u.id and workflow_kind='partial_payment_commitment' and status='pending')<>1 then raise exception 'Receipt duplicated the next part';end if;
 if (select paid_amount from public.payment_schedule where id=sid)<>100000 then raise exception 'Wrong balance';end if;
 select id,updated_at into tid,before_updated from public.scheduled_actions where unit_id=u.id and workflow_kind='partial_payment_commitment' and status='pending';
 perform public.crm_record_scheduled_outcome(tid,before_updated,'extension_request',sid,'Needs extra time',today+20,null);
 if not exists(select 1 from public.scheduled_actions where unit_id=u.id and workflow_kind='extension_approval' and status='pending') then raise exception 'Missing approval task';end if;
 if exists(select 1 from public.payment_extensions where unit_id=u.id and status='active') then raise exception 'Extension activated before acceptance';end if;
end;$$;
rollback;
