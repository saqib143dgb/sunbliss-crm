-- Integration regression. All customer, sale, schedule, payment and task writes roll back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='crm_officer' order by id limit 1),true);
set local role authenticated;
do $$
declare
  u public.units%rowtype;
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
  select * into strict u from public.units where availability_status='Available' order by id limit 1 for update;
  payload := jsonb_build_object('customer_name','Synthetic booking regression','unit_id',u.id,'unit_no',u.unit_no,
    'total_price',1000000,'booking_date','2026-10-13','booking_amount',10000,'booking_payment_date','2026-10-13',
    'source','Direct','furnishing_type','Semi Furnished','booking_payment_status','partial','partial_booking_note','-',
    'schedule',jsonb_build_array(jsonb_build_object('stage_name','Down Payment','due_amount',200000,'due_date','2026-10-20')));
  select count(*) into baseline from public.customers;
  begin
    perform public.create_customer_sale_atomic(payload);
  exception when others then
    if sqlerrm <> 'Balance follow-up date is missing.' then raise; end if;
    failed := true;
  end;
  if not failed or (select count(*) from public.customers)<>baseline then raise exception 'Missing-date validation did not roll back'; end if;
  payload := payload || jsonb_build_object('balance_followup_date','2026-10-25');
  result := public.create_customer_sale_atomic(payload);
  sid := (result->>'down_payment_schedule_id')::bigint;
  task_id := (result->>'balance_task_id')::bigint;
  welcome_id := (result->>'welcome_task_id')::bigint;
  if not exists(select 1 from public.scheduled_actions where id=welcome_id and action_label='Send Welcome Letter' and status='pending' and schedule_id is null and id<task_id) then raise exception 'Welcome Letter task missing or out of order'; end if;
  if (select count(*) from public.scheduled_actions where schedule_id=sid and status='pending')<>2 then raise exception 'Expected two independent tasks'; end if;
  if not exists(select 1 from public.scheduled_actions where id=task_id and due_date='2026-10-25' and action_label like '%190,000.00%' and transaction_id is null) then raise exception 'Incorrect balance task'; end if;
  if not exists(select 1 from public.payment_schedule where id=sid and due_date='2026-10-20' and paid_amount=10000 and due_amount=200000) then raise exception 'Incorrect installment'; end if;
  if not exists(select 1 from public.sales where customer_id=(result->>'customer_id')::bigint and partial_booking_note='-') then raise exception 'Note not saved atomically'; end if;
  select id into strict tx_task_id from public.scheduled_actions where transaction_id=(result->>'booking_transaction_id')::bigint and workflow_kind='accounts_confirmation';
  update public.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  if not exists(select 1 from public.scheduled_actions where id=tx_task_id and status='pending' and workflow_kind='payment_receipt') then raise exception 'Receipt transition failed'; end if;
  if not exists(select 1 from public.scheduled_actions where id=task_id and status='pending') then raise exception 'Receipt hid balance task'; end if;
  failed := false;
  begin
    update public.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  exception when others then
    if sqlerrm not like 'Send the Welcome Letter%' then raise; end if;
    failed := true;
  end;
  if not failed then raise exception 'Receipt completion was allowed before Welcome Letter'; end if;
  update public.scheduled_actions set status='completed',completed_at=now(),completion_note='Sent' where id=welcome_id;
  perform public.crm_record_payment_with_credit_note(sid,50000,'2026-10-14',null,'Synthetic second payment',0,null,null,null);
  if not exists(select 1 from public.scheduled_actions where id=task_id and action_label like '%140,000.00%' and status='pending' and due_date='2026-10-25') then raise exception 'Balance did not update'; end if;
  insert into public.credit_notes(customer_id,unit_id,payment_schedule_id,issue_date,amount,reason,created_by)
    values((result->>'customer_id')::bigint,u.id,sid,current_date,5000,'Synthetic regression',auth.uid()) returning id into credit_id;
  if not exists(select 1 from public.scheduled_actions where id=task_id and action_label like '%135,000.00%') then raise exception 'Credit not reflected'; end if;
  delete from public.credit_notes where id=credit_id;
  if not exists(select 1 from public.scheduled_actions where id=task_id and action_label like '%140,000.00%') then raise exception 'Credit removal not reflected'; end if;
  perform public.crm_record_payment_with_credit_note(sid,140000,'2026-10-15',null,'Synthetic final payment',0,null,null,null);
  if not exists(select 1 from public.scheduled_actions where id=task_id and status='completed') then raise exception 'Settled balance task not closed'; end if;
  if not exists(select 1 from public.scheduled_actions where id=tx_task_id and status='pending') then raise exception 'Settlement incorrectly closed receipt task'; end if;
  update public.scheduled_actions set status='completed',completed_at=now() where id=tx_task_id;
  if not exists(select 1 from public.scheduled_actions where id=tx_task_id and status='completed') then raise exception 'Receipt could not close after Welcome Letter'; end if;
  failed := false;
  begin
    perform public.create_customer_sale_atomic(payload);
  exception when others then
    if sqlerrm not like 'That unit is no longer available%' then raise; end if;
    failed := true;
  end;
  if not failed or (select count(*) from public.scheduled_actions where id=task_id)<>1 then raise exception 'Repeated save duplicated booking'; end if;
  select * into strict u from public.units where availability_status='Available' order by id limit 1 for update;
  result := public.create_customer_sale_atomic(payload || jsonb_build_object('unit_id',u.id,'unit_no',u.unit_no,'booking_amount',200000,'booking_payment_status','full','balance_followup_date',null));
  if result->>'welcome_task_id' is null then raise exception 'Full booking missing Welcome Letter'; end if;
  if result->>'balance_task_id' is not null then raise exception 'Full payment created balance follow-up'; end if;
end;
$$;
rollback;
select 'PASS: Welcome Letter task, receipt sequencing, validation rollback, independent tasks, receipt transition, balance updates, credit notes, settlement, repeat save and full payment' as result;
