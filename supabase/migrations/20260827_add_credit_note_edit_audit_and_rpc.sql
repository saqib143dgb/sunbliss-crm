create table if not exists public.credit_note_edit_log (
  id uuid primary key default gen_random_uuid(),
  credit_note_id bigint not null,
  customer_id bigint,
  unit_id bigint,
  old_payment_schedule_id bigint,
  old_issue_date date,
  old_amount numeric not null,
  old_reason text,
  old_reference_number text,
  new_payment_schedule_id bigint,
  new_issue_date date,
  new_amount numeric not null,
  new_reason text,
  new_reference_number text,
  edited_by uuid not null,
  edited_at timestamptz not null default now()
);

alter table public.credit_note_edit_log enable row level security;

revoke all on table public.credit_note_edit_log from anon;
revoke all on table public.credit_note_edit_log from authenticated;
grant select, insert on table public.credit_note_edit_log to authenticated;

drop policy if exists "crm read credit note edit log" on public.credit_note_edit_log;
create policy "crm read credit note edit log"
on public.credit_note_edit_log
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'crm_officer'::public.user_role
  )
);

drop policy if exists "crm insert credit note edit log" on public.credit_note_edit_log;
create policy "crm insert credit note edit log"
on public.credit_note_edit_log
for insert
to authenticated
with check (
  edited_by = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'crm_officer'::public.user_role
  )
);

create or replace function public.crm_edit_credit_note(
  p_credit_note_id bigint,
  p_payment_schedule_id bigint,
  p_issue_date date,
  p_amount numeric,
  p_reason text,
  p_reference_number text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_note public.credit_notes%rowtype;
  v_new_schedule public.payment_schedule%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'crm_officer'::public.user_role
  ) then
    raise exception 'Not authorized to edit credit notes';
  end if;

  if p_issue_date is null then
    raise exception 'Credit note issue date is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit note amount must be greater than zero';
  end if;

  if v_reason = '' then
    raise exception 'Credit note reason is required';
  end if;

  select * into v_note
  from public.credit_notes
  where id = p_credit_note_id
  for update;

  if not found then
    raise exception 'Credit note not found';
  end if;

  select * into v_new_schedule
  from public.payment_schedule
  where id = p_payment_schedule_id
  for update;

  if not found then
    raise exception 'Selected installment was not found';
  end if;

  if v_new_schedule.customer_id is distinct from v_note.customer_id
     or v_new_schedule.unit_id is distinct from v_note.unit_id then
    raise exception 'The selected installment does not belong to this customer and unit';
  end if;

  if v_note.payment_schedule_id is distinct from p_payment_schedule_id then
    perform 1
    from public.payment_schedule
    where id = v_note.payment_schedule_id
    for update;
  end if;

  insert into public.credit_note_edit_log (
    credit_note_id, customer_id, unit_id,
    old_payment_schedule_id, old_issue_date, old_amount, old_reason, old_reference_number,
    new_payment_schedule_id, new_issue_date, new_amount, new_reason, new_reference_number,
    edited_by
  ) values (
    v_note.id, v_note.customer_id, v_note.unit_id,
    v_note.payment_schedule_id, v_note.issue_date, v_note.amount, v_note.reason, v_note.reference_number,
    p_payment_schedule_id, p_issue_date, p_amount, v_reason, nullif(btrim(coalesce(p_reference_number, '')), ''),
    auth.uid()
  );

  update public.credit_notes
  set payment_schedule_id = p_payment_schedule_id,
      issue_date = p_issue_date,
      amount = p_amount,
      reason = v_reason,
      reference_number = nullif(btrim(coalesce(p_reference_number, '')), '')
  where id = v_note.id;

  return jsonb_build_object(
    'credit_note_id', v_note.id,
    'old_schedule_id', v_note.payment_schedule_id,
    'new_schedule_id', p_payment_schedule_id,
    'old_amount', v_note.amount,
    'new_amount', p_amount
  );
end;
$$;

revoke execute on function public.crm_edit_credit_note(bigint,bigint,date,numeric,text,text) from public;
revoke execute on function public.crm_edit_credit_note(bigint,bigint,date,numeric,text,text) from anon;
grant execute on function public.crm_edit_credit_note(bigint,bigint,date,numeric,text,text) to authenticated;

comment on table public.credit_note_edit_log is 'Audit history for CRM credit note edits.';
comment on function public.crm_edit_credit_note(bigint,bigint,date,numeric,text,text) is 'Edits one credit note while retaining an audit record and refreshing affected installment statuses via credit note triggers.';
