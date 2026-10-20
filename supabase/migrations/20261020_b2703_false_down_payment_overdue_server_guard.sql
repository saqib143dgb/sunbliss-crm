-- Guard B2-703 against automatic overdue actions that use gross SPA figures
-- instead of the protected collectible installment balance.
-- Only the demonstrably false automatic Down Payment reminder is affected.
begin;
create or replace function crm_private.prevent_b2703_false_down_payment_overdue()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare v_cash_due numeric;
begin
 if new.unit_id=467
    and new.status='pending'
    and new.source='automatic'
    and new.auto_kind='overdue_follow_up'
    and new.auto_key='overdue_follow_up|unit:467|schedules:1200'
 then
   select greatest(0,
     coalesce(ps.revised_due_amount,ps.due_amount,0)
     -coalesce(ps.paid_amount,0)
     -coalesce((select sum(c.amount) from public.credit_notes c where c.payment_schedule_id=ps.id),0))
   into v_cash_due
   from public.payment_schedule ps where ps.id=1200 and ps.unit_id=467 and ps.stage_name='Down Payment';
   if v_cash_due is null then
     raise exception 'B2-703 Down Payment installment unavailable; refusing automatic overdue task.';
   end if;
   if v_cash_due<=1000 then
     new.status='cancelled';
     new.cancelled_at=coalesce(new.cancelled_at,now());
     new.updated_at=now();
     new.completion_note='System correction: original Down Payment collectible amount is fully settled; approved supplementary SPA credits are not overdue cash.';
   end if;
 end if;
 return new;
end $fn$;
drop trigger if exists prevent_b2703_false_down_payment_overdue on public.scheduled_actions;
create trigger prevent_b2703_false_down_payment_overdue
before insert or update of status,auto_key,auto_kind on public.scheduled_actions
for each row execute function crm_private.prevent_b2703_false_down_payment_overdue();

update public.scheduled_actions a
set status='cancelled',cancelled_at=now(),updated_at=now(),
completion_note='System correction: original Down Payment collectible amount is fully settled; approved supplementary SPA credits are not overdue cash.'
where a.id=462 and a.unit_id=467 and a.schedule_id=1200
and a.status='pending' and a.source='automatic'
and a.auto_kind='overdue_follow_up'
and a.auto_key='overdue_follow_up|unit:467|schedules:1200'
and exists(select 1 from public.payment_schedule ps where ps.id=1200 and ps.unit_id=467
and coalesce(ps.revised_due_amount,ps.due_amount,0)-coalesce(ps.paid_amount,0)
-coalesce((select sum(c.amount) from public.credit_notes c where c.payment_schedule_id=ps.id),0)<=1000);
commit;