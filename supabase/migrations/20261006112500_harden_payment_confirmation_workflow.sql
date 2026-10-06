revoke execute on function public.crm_create_payment_confirmation_task() from public, anon, authenticated;
revoke execute on function public.crm_advance_payment_confirmation_task() from public, anon, authenticated;

create index if not exists payment_transactions_accounts_confirmed_by_idx
  on public.payment_transactions(accounts_confirmed_by)
  where accounts_confirmed_by is not null;

create index if not exists payment_transactions_receipt_sent_by_idx
  on public.payment_transactions(receipt_sent_by)
  where receipt_sent_by is not null;

create index if not exists scheduled_actions_transaction_id_idx
  on public.scheduled_actions(transaction_id)
  where transaction_id is not null;
