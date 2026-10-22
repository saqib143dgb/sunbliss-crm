-- Integration regression. All customer, sale, schedule, payment and task writes roll back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
select crm_triana.prepare_project_workspace();
insert into crm_triana.units(unit_no,project_name,unit_type,floor,area,total_price,status,availability_status) values ('QA-TEMP','Triana Residences','Studio','1',375,1000000,'Available','Available'),('QA-TEMP-2','Triana Residences','Studio','1',375,1000000,'Available','Available');

select set_config('request.jwt.claim.sub',(select id::text from crm_triana.profiles where role='crm_officer' order by id limit 1),true);
set local role authenticated;
do $$
declare
  u crm_triana.units%rowtype;
  payload jsonb;
  result jsonb;
  sid bigint;
  task_id bigint;
  tx_task_id bigint;
  welcome_id bigint;
  credit_id bigint;
  baseline bigint;
  failed boolean := false;
begin
  select * into strict u from crm_triana.units where availability_status='Available' order by id limit 1 for update;
  payload := jsonb_build_object('customer_name','Synthetic booking regression','unit_id',u.id,'unit_no',u.unit_no,
    'total_price',1000000,'booking_date','2026-10-13','booking_amount',10000,'booking_payment_date','2026-10-13',
    'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','partial','partial_booking_note','-',
    'schedule',jsonb_build_array(jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date','2026-10-20')));
  select count(*) into baseline from crm_triana.customers;
  begin
    perform crm_triana.create_customer_sale_atomic(payload);
  exception when others then
    if sqlerrm <> 'Balance follow-up date is missing.' then raise; end if;
    failed := true;
  end;
  if not failed or (select count(*) from crm_triana.customers)<>baseline then raise exception 'Missing-date validation did not roll back'; end if;
  payload := payload || jsonb_build_object('balance_followup_date','2026-10-25');
  result := crm_triana.create_customer_sale_atomic(payload);
  sid := (result->>'down_payment_schedule_id')::bigint;
  task_id := (result->>'balance_task_id')::bigint;
  welcome_id := (result->>'welcome_task_id')::bigint;
  if not exists(select 1 from crm_triana.scheduled_actions where id=welcome_id and action_label='Send Welcome Letter' and status='pending' and schedule_id is null and id<task_id) then raise exception 'Welcome Letter task missing or out of order'; end if;
  if (select count(*) from crm_triana.scheduled_actions where schedule_id=sid and status='pending')<>2 then raise exception 'Expected two independent tasks'; end if;
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and due_date='2026-10-25' and action_label like '%190,000.00%' and transaction_id is null) then raise exception 'Incorrect balance task'; end if;
  if not exists(select 1 from crm_triana.payment_schedule where id=sid and due_date='2026-10-20' and paid_amount=10000 and due_amount=200000) then raise exception 'Incorrect installment'; end if;
  if not exists(select 1 from crm_triana.sales where customer_id=(result->>'customer_id')::bigint and partial_booking_note='-') then raise exception 'Note not saved atomically'; end if;
  select id into strict tx_task_id from crm_triana.scheduled_actions where transaction_id=(result->>'booking_transaction_id')::bigint and workflow_kind='accounts_confirmation';
  update crm_triana.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  if not exists(select 1 from crm_triana.scheduled_actions where id=tx_task_id and status='pending' and workflow_kind='payment_receipt') then raise exception 'Receipt transition failed'; end if;
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and status='pending') then raise exception 'Receipt hid balance task'; end if;
  failed := false;
  begin
    update crm_triana.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  exception when others then
    if sqlerrm not like 'Send the Welcome Letter%' then raise; end if;
    failed := true;
  end;
  if not failed then raise exception 'Receipt completion was allowed before Welcome Letter'; end if;
  update crm_triana.scheduled_actions set status='completed',completed_at=now(),completion_note='Sent' where id=welcome_id;
  perform crm_triana.crm_record_payment_with_credit_note(sid,50000,'2026-10-14',null,'Synthetic second payment',0,null,null,null);
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and action_label like '%140,000.00%' and status='pending' and due_date='2026-10-25') then raise exception 'Balance did not update'; end if;
  insert into crm_triana.credit_notes(customer_id,unit_id,payment_schedule_id,issue_date,amount,reason,created_by)
    values((result->>'customer_id')::bigint,u.id,sid,current_date,5000,'Synthetic regression',auth.uid()) returning id into credit_id;
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and action_label like '%135,000.00%') then raise exception 'Credit not reflected'; end if;
  delete from crm_triana.credit_notes where id=credit_id;
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and action_label like '%140,000.00%') then raise exception 'Credit removal not reflected'; end if;
  perform crm_triana.crm_record_payment_with_credit_note(sid,140000,'2026-10-15',null,'Synthetic final payment',0,null,null,null);
  if not exists(select 1 from crm_triana.scheduled_actions where id=task_id and status='completed') then raise exception 'Settled balance task not closed'; end if;
  if not exists(select 1 from crm_triana.scheduled_actions where id=tx_task_id and status='pending') then raise exception 'Settlement incorrectly closed receipt task'; end if;
  update crm_triana.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  if not exists(select 1 from crm_triana.scheduled_actions where id=tx_task_id and status='completed') then raise exception 'Receipt could not close after Welcome Letter'; end if;
  failed := false;
  begin
    perform crm_triana.create_customer_sale_atomic(payload);
  exception when others then
    if sqlerrm not like 'That unit is no longer available%' then raise; end if;
    failed := true;
  end;
  if not failed or (select count(*) from crm_triana.scheduled_actions where id=task_id)<>1 then raise exception 'Repeated save duplicated booking'; end if;
  select * into strict u from crm_triana.units where availability_status='Available' order by id limit 1 for update;
  result := crm_triana.create_customer_sale_atomic(payload || jsonb_build_object('unit_id',u.id,'unit_no',u.unit_no,'booking_amount',200000,'booking_payment_status','full','balance_followup_date',null));
  if result->>'welcome_task_id' is null then raise exception 'Full booking missing Welcome Letter'; end if;
  if result->>'balance_task_id' is not null then raise exception 'Full payment created balance follow-up'; end if;
end;
$$;
rollback;
select 'PASS: Welcome Letter task, receipt sequencing, validation rollback, independent tasks, receipt transition, balance updates, credit notes, settlement, repeat save and full payment' as result;

begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
select crm_triana.prepare_project_workspace();
insert into crm_triana.units(unit_no,unit_type,floor,area,total_price,status,availability_status) values ('QA-SPA','Studio','1',375,1000000,'Available','Available');
select set_config('request.jwt.claim.sub',(select id::text from crm_triana.profiles where role='crm_officer' order by id limit 1),true);
create function pg_temp.spa_advance(s bigint,o text,d jsonb default '{}') returns jsonb language plpgsql as $$
declare t bigint;begin select id into strict t from crm_triana.scheduled_actions where spa_sale_id=s and status='pending' and spa_step<>'email';return crm_triana.crm_resolve_spa_task(t,o,d);end;$$;
set local role authenticated;
do $$
declare u crm_triana.units; r jsonb; sid bigint; fee bigint; sale bigint; tx bigint; task bigint; old_task bigint; failed boolean; n int; v_owner uuid:=auth.uid(); v_manager uuid;
 today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 select * into strict u from crm_triana.units where availability_status='Available' order by id limit 1 for update;
 r:=crm_triana.create_customer_sale_atomic(jsonb_build_object('customer_name','Synthetic SPA test','unit_id',u.id,'unit_no',u.unit_no,'total_price',1000000,'booking_date',today,'booking_amount',200000,'booking_payment_date',today,'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','full','schedule',jsonb_build_array(jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date',today),jsonb_build_object('stage_name','DLD + Admin Fees','due_amount',45000,'due_date',today))));
 sid:=(r->>'down_payment_schedule_id')::bigint;
 select id into sale from crm_triana.sales where unit_id=u.id and customer_id=(r->>'customer_id')::bigint;
 if crm_triana.crm_spa_payment_ready(u.id) then raise exception 'Unpaid fees qualified';end if;
 update crm_triana.scheduled_actions set status='completed',completed_at=now() where id=(r->>'welcome_task_id')::bigint;
 select id into task from crm_triana.scheduled_actions where transaction_id=(r->>'booking_transaction_id')::bigint;
 update crm_triana.scheduled_actions set status='completed' where id=task; -- Accounts -> receipt
 update crm_triana.scheduled_actions set status='completed' where id=task; -- Receipt sent
 if exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale) then raise exception 'Early invitation';end if;
 select id into fee from crm_triana.payment_schedule where unit_id=u.id and customer_id=(r->>'customer_id')::bigint and stage_name='DLD + Admin Fees';
 r:=crm_triana.crm_record_payment_with_credit_note(fee,45000,today,null,'Synthetic fees',0,null,null,null);
 tx:=(r->>'transaction_id')::bigint;
 select id into task from crm_triana.scheduled_actions where transaction_id=tx;
 update crm_triana.scheduled_actions set status='completed' where id=task;
 if exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale) then raise exception 'Invitation before fee receipt';end if;
 update crm_triana.scheduled_actions set status='completed' where id=task;
 if not crm_triana.crm_spa_payment_ready(u.id) then raise exception '20 percent + fees failed';end if;
 if (select count(*) from crm_triana.scheduled_actions where spa_sale_id=sale and spa_step='invite')<>1 then raise exception 'Missing invitation';end if;
 update crm_triana.payment_transactions set receipt_sent_at=now() where id=tx;
 if (select count(*) from crm_triana.scheduled_actions where spa_sale_id=sale)<>1 then raise exception 'Duplicate invitation';end if;
 select id into old_task from crm_triana.scheduled_actions where spa_sale_id=sale;
 perform pg_temp.spa_advance(sale,'sent');
 perform crm_triana.crm_resolve_spa_task(old_task,'sent','{}'); -- Idempotent retry
 if (select count(*) from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending')<>1 then raise exception 'Duplicate on retry';end if;
 if not exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and spa_step='reminder' and due_date=today+3 and status='pending') then raise exception '3 day reminder missing';end if;
 perform pg_temp.spa_advance(sale,'sent');perform pg_temp.spa_advance(sale,'sent');
 if not exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and spa_step='call' and status='pending') then raise exception 'Call escalation missing';end if;
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
 if not exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='revise') then raise exception 'Revised SPA missing';end if;
 perform pg_temp.spa_advance(sale,'prepared','{"reference":"SPA-v2"}');
 perform pg_temp.spa_advance(sale,'checked');
 perform pg_temp.spa_advance(sale,'remote');perform pg_temp.spa_advance(sale,'sent');
 failed:=false;begin perform pg_temp.spa_advance(sale,'developer_signed','{"reference":"SPA"}');exception when others then failed:=true;end;
 if not failed then raise exception 'Developer signed before customer';end if;
 perform pg_temp.spa_advance(sale,'customer_signed',jsonb_build_object('date',today,'reference','Customer signed SPA-v2','method','digital'));
 if exists(select 1 from crm_triana.sales where id=sale and spa_status='Signed') then raise exception 'Customer-only signature marked fully signed';end if;
 perform pg_temp.spa_advance(sale,'developer_signed',jsonb_build_object('date',today,'reference','Executed SPA-v2'));
 if (select count(*) from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending')<>2 then raise exception 'Email and Oqood tasks missing';end if;
 if not exists(select 1 from crm_triana.sales where id=sale and spa_status='Signed') then raise exception 'Fully signed status not saved';end if;
 perform pg_temp.spa_advance(sale,'registered',jsonb_build_object('date',today,'reference','OQ-TEST'));
 perform pg_temp.spa_advance(sale,'pending',jsonb_build_object('date',today+1));
 perform pg_temp.spa_advance(sale,'issued',jsonb_build_object('date',today,'reference','ICS-TEST'));
 perform pg_temp.spa_advance(sale,'sent');
 if not exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='email') then raise exception 'Oqood incorrectly closed SPA email';end if;
 select id into task from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending' and spa_step='email';
 perform crm_triana.crm_resolve_spa_task(task,'sent','{}');
 if exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending') then raise exception 'Workflow not complete';end if;
 if not exists(select 1 from crm_triana.sales where id=sale and oqood_status='Completed' and spa_progress ? 'initial_contract_sent_on' and spa_progress ? 'spa_emailed_on') then raise exception 'Completion records missing';end if;
 -- Alternative package: 10% down payment + 5% first installment, plus all fees.
 update crm_triana.payment_schedule set due_amount=100000,paid_amount=100000 where id=sid;
 insert into crm_triana.payment_schedule(unit_id,customer_id,stage_name,due_amount,paid_amount) select u.id,customer_id,'1st Installment',50000,50000 from crm_triana.sales where id=sale;
 if not crm_triana.crm_spa_payment_ready(u.id) then raise exception 'Alternative first installment rule failed';end if;
 insert into crm_triana.scheduled_actions(unit_id,owner_id,action_label,due_date,workflow_kind,spa_sale_id,spa_step) values(u.id,v_owner,'Test SPA follow-up',today,'spa',sale,'followup') returning id into task;
 perform set_config('request.jwt.claim.sub','',true);
 failed:=false;begin perform crm_triana.crm_resolve_spa_task(task,'later',jsonb_build_object('date',today+1));exception when others then if sqlerrm<>'CRM access required.' then raise;end if;failed:=true;end;
 if not failed then raise exception 'Unauthenticated update allowed';end if;
 perform set_config('request.jwt.claim.sub',v_owner::text,true);
 select id into v_manager from crm_triana.profiles where role='manager' limit 1;
 if v_manager is not null then
   perform set_config('request.jwt.claim.sub',v_manager::text,true);
   perform crm_triana.crm_resolve_spa_task(task,'escalate','{"note":"Please review repeated no response"}');
   perform set_config('request.jwt.claim.sub',v_owner::text,true);
   if not exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and spa_step='approval' and status='pending' and owner_id=v_owner) then raise exception 'Manager transition failed';end if;
 end if;
 update crm_triana.units set availability_status='Available' where id=u.id;
 if exists(select 1 from crm_triana.scheduled_actions where spa_sale_id=sale and status='pending') then raise exception 'Inactive sale tasks remain';end if;

end;$$;
rollback;
select 'PASS: payment gate, receipt trigger, idempotency, reminders, appointments, queries, amendment revision, digital signing, two signatures, independent delivery, Oqood and final closure. All writes rolled back.' as result;


