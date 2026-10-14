begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
create function pg_temp.spa_advance(s bigint,o text,d jsonb default '{}') returns jsonb language plpgsql as $$
declare t bigint;begin select id into strict t from public.scheduled_actions where spa_sale_id=s and status='pending' and spa_step<>'email';return public.crm_resolve_spa_task(t,o,d);end;$$;
set local role authenticated;
do $$
declare u public.units; r jsonb; sid bigint; fee bigint; sale bigint; tx bigint; task bigint; old_task bigint; failed boolean; n int; v_owner uuid:=auth.uid(); v_manager uuid;
 today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 select * into strict u from public.units where availability_status='Available' order by id limit 1 for update;
 r:=public.create_customer_sale_atomic(jsonb_build_object('customer_name','Synthetic SPA test','unit_id',u.id,'unit_no',u.unit_no,'total_price',1000000,'booking_date',today,'booking_amount',200000,'booking_payment_date',today,'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','full','schedule',jsonb_build_array(jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date',today),jsonb_build_object('stage_name','DLD + Admin Fees','due_amount',45000,'due_date',today))));
 sid:=(r->>'down_payment_schedule_id')::bigint;
 select id into sale from public.sales where unit_id=u.id and customer_id=(r->>'customer_id')::bigint;
 if public.crm_spa_payment_ready(u.id) then raise exception 'Unpaid fees qualified';end if;
 update public.scheduled_actions set status='completed',completed_at=now() where id=(r->>'welcome_task_id')::bigint;
 select id into task from public.scheduled_actions where transaction_id=(r->>'booking_transaction_id')::bigint;
 update public.scheduled_actions set status='completed' where id=task; -- Accounts -> receipt
 update public.scheduled_actions set status='completed' where id=task; -- Receipt sent
 if exists(select 1 from public.scheduled_actions where spa_sale_id=sale) then raise exception 'Early invitation';end if;
 select id into fee from public.payment_schedule where unit_id=u.id and customer_id=(r->>'customer_id')::bigint and stage_name='DLD + Admin Fees';
 r:=public.crm_record_payment_with_credit_note(fee,45000,today,null,'Synthetic fees',0,null,null,null);
 tx:=(r->>'transaction_id')::bigint;
 select id into task from public.scheduled_actions where transaction_id=tx;
 update public.scheduled_actions set status='completed' where id=task;
 if exists(select 1 from public.scheduled_actions where spa_sale_id=sale) then raise exception 'Invitation before fee receipt';end if;
 update public.scheduled_actions set status='completed' where id=task;
 if not public.crm_spa_payment_ready(u.id) then raise exception '20 percent + fees failed';end if;
 if (select count(*) from public.scheduled_actions where spa_sale_id=sale and spa_step='invite')<>1 then raise exception 'Missing invitation';end if;
 update public.payment_transactions set receipt_sent_at=now() where id=tx;
 if (select count(*) from public.scheduled_actions where spa_sale_id=sale)<>1 then raise exception 'Duplicate invitation';end if;
 select id into old_task from public.scheduled_actions where spa_sale_id=sale;
 perform pg_temp.spa_advance(sale,'sent');
 perform public.crm_resolve_spa_task(old_task,'sent','{}'); -- Idempotent retry
 if (select count(*) from public.scheduled_actions where spa_sale_id=sale and status='pending')<>1 then raise exception 'Duplicate on retry';end if;
 if not exists(select 1 from public.scheduled_actions where spa_sale_id=sale and spa_step='reminder' and due_date=today+3 and status='pending') then raise exception '3 day reminder missing';end if;
 perform pg_temp.spa_advance(sale,'sent');perform pg_temp.spa_advance(sale,'sent');
 if not exists(select 1 from public.scheduled_actions where spa_sale_id=sale and spa_step='call' and status='pending') then raise exception 'Call escalation missing';end if;
 failed:=false;begin perform pg_temp.spa_advance(sale,'appointment',jsonb_build_object('date',today));exception when others then if sqlerrm<>'Choose an appointment time.' then raise;end if;failed:=true;end;
 if not failed then raise exception 'Missing time allowed';end if;
 perform pg_temp.spa_advance(sale,'appointment',jsonb_build_object('date',today,'time','14:30'));
 perform pg_temp.spa_advance(sale,'no_show',jsonb_build_object('date',today+1));
 perform pg_temp.spa_advance(sale,'clarification','{"note":"Clause 12 question"}');
 perform pg_temp.spa_advance(sale,'sent');
 perform pg_temp.spa_advance(sale,'change','{"note":"Please revise clause 12"}');
 perform pg_temp.spa_advance(sale,'conditional','{"note":"Management allows revised wording only"}');
 perform pg_temp.spa_advance(sale,'sent');
 perform pg_temp.spa_advance(sale,'change','{"note":"Customer asks for a second change"}');
 perform pg_temp.spa_advance(sale,'approved','{"note":"Second wording approved"}');
 perform pg_temp.spa_advance(sale,'accepted');
 if not exists(select 1 from public.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='revise') then raise exception 'Revised SPA missing';end if;
 perform pg_temp.spa_advance(sale,'prepared','{"reference":"SPA-v2"}');
 perform pg_temp.spa_advance(sale,'checked');
 perform pg_temp.spa_advance(sale,'remote');perform pg_temp.spa_advance(sale,'sent');
 failed:=false;begin perform pg_temp.spa_advance(sale,'developer_signed','{"reference":"SPA"}');exception when others then failed:=true;end;
 if not failed then raise exception 'Developer signed before customer';end if;
 perform pg_temp.spa_advance(sale,'customer_signed',jsonb_build_object('date',today,'reference','Customer signed SPA-v2','method','digital'));
 if exists(select 1 from public.sales where id=sale and spa_status='Signed') then raise exception 'Customer-only signature marked fully signed';end if;
 perform pg_temp.spa_advance(sale,'developer_signed',jsonb_build_object('date',today,'reference','Executed SPA-v2'));
 if (select count(*) from public.scheduled_actions where spa_sale_id=sale and status='pending')<>2 then raise exception 'Email and Oqood tasks missing';end if;
 if not exists(select 1 from public.sales where id=sale and spa_status='Signed') then raise exception 'Fully signed status not saved';end if;
 perform pg_temp.spa_advance(sale,'registered',jsonb_build_object('date',today,'reference','OQ-TEST'));
 perform pg_temp.spa_advance(sale,'pending',jsonb_build_object('date',today+1));
 perform pg_temp.spa_advance(sale,'issued',jsonb_build_object('date',today,'reference','ICS-TEST'));
 perform pg_temp.spa_advance(sale,'sent');
 if not exists(select 1 from public.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='email') then raise exception 'Oqood incorrectly closed SPA email';end if;
 select id into task from public.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='email';
 perform public.crm_resolve_spa_task(task,'sent','{}');
 if exists(select 1 from public.scheduled_actions where spa_sale_id=sale and status='pending') then raise exception 'Workflow not complete';end if;
 if not exists(select 1 from public.sales where id=sale and oqood_status='Completed' and spa_progress ? 'initial_contract_sent_on' and spa_progress ? 'spa_emailed_on') then raise exception 'Completion records missing';end if;
 -- Alternative package: 10% down payment + 5% first installment, plus all fees.
 update public.payment_schedule set due_amount=100000,paid_amount=100000 where id=sid;
 insert into public.payment_schedule(unit_id,customer_id,stage_name,due_amount,paid_amount) select u.id,customer_id,'1st Installment',50000,50000 from public.sales where id=sale;
 if not public.crm_spa_payment_ready(u.id) then raise exception 'Alternative first installment rule failed';end if;
 insert into public.scheduled_actions(unit_id,owner_id,action_label,due_date,workflow_kind,spa_sale_id,spa_step) values(u.id,v_owner,'Test SPA follow-up',today,'spa',sale,'followup') returning id into task;
 perform set_config('request.jwt.claim.sub','',true);
 failed:=false;begin perform public.crm_resolve_spa_task(task,'later',jsonb_build_object('date',today+1));exception when others then if sqlerrm<>'CRM access required.' then raise;end if;failed:=true;end;
 if not failed then raise exception 'Unauthenticated update allowed';end if;
 perform set_config('request.jwt.claim.sub',v_owner::text,true);
 select id into v_manager from public.profiles where role='manager' limit 1;
 if v_manager is not null then
   perform set_config('request.jwt.claim.sub',v_manager::text,true);
   perform public.crm_resolve_spa_task(task,'escalate','{"note":"Please review repeated no response"}');
   perform set_config('request.jwt.claim.sub',v_owner::text,true);
   if not exists(select 1 from public.scheduled_actions where spa_sale_id=sale and spa_step='approval' and status='pending' and owner_id=v_owner) then raise exception 'Manager transition failed';end if;
 end if;
 update public.units set availability_status='Available' where id=u.id;
 if exists(select 1 from public.scheduled_actions where spa_sale_id=sale and status='pending') then raise exception 'Inactive sale tasks remain';end if;

end;$$;
rollback;
select 'PASS: payment gate, receipt trigger, idempotency, reminders, appointments, queries, amendment revision, digital signing, two signatures, independent delivery, Oqood and final closure. All writes rolled back.' as result;
