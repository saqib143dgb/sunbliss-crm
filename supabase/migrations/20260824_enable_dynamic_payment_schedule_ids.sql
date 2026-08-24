create sequence if not exists public.payment_schedule_id_seq;

alter sequence public.payment_schedule_id_seq
  owned by public.payment_schedule.id;

select setval(
  'public.payment_schedule_id_seq',
  greatest(
    coalesce((select max(id) from public.payment_schedule), 0),
    (select last_value from public.payment_schedule_id_seq)
  ),
  true
);

alter table public.payment_schedule
  alter column id set default nextval('public.payment_schedule_id_seq'::regclass);

grant usage, select on sequence public.payment_schedule_id_seq to authenticated;
