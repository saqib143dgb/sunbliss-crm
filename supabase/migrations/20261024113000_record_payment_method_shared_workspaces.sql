-- Record tender method separately from payment_type, which identifies the installment.
-- Apply identically to Sunbliss, Triana, and both isolated Test Mode schemas.
do $migration$
declare
  ns text;
begin
  foreach ns in array array['public','crm_test','crm_triana','crm_triana_test'] loop
    execute format('alter table %I.payment_transactions add column if not exists payment_method text',ns);
    if not exists (
      select 1 from pg_constraint k
      join pg_class c on c.oid=k.conrelid
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname=ns and c.relname='payment_transactions'
        and k.conname='payment_transactions_method_check'
    ) then
      execute format('alter table %I.payment_transactions add constraint payment_transactions_method_check check (payment_method is null or payment_method in (''Online'',''Cheque'',''Card'',''Cash''))',ns);
    end if;

    execute format($ddl$
      create or replace function %1$I.crm_record_payment_with_method(
        p_schedule_id bigint,
        p_payment_method text,
        p_cash_amount numeric default 0,
        p_payment_date date default null,
        p_payment_reference text default null,
        p_remarks text default null,
        p_credit_amount numeric default 0,
        p_credit_issue_date date default null,
        p_credit_reason text default null,
        p_credit_reference text default null
      )
      returns jsonb
      language plpgsql
      security definer
      set search_path = %1$I, pg_temp
      as $body$
      declare
        v_result jsonb;
        v_tx_id bigint;
      begin
        -- Original recorder enforces CRM-officer permission and owns cash and credit ledger updates.
        if coalesce(p_cash_amount,0)>0 then
          if p_payment_method is null or p_payment_method not in ('Online','Cheque','Card','Cash') then
            raise exception 'Select a valid payment method.';
          end if;
          if p_payment_method='Cheque' and nullif(btrim(coalesce(p_payment_reference,'')),'') is null then
            raise exception 'Cheque number is required.';
          end if;
        end if;

        v_result := %1$I.crm_record_payment_with_credit_note(
          p_schedule_id => p_schedule_id,
          p_cash_amount => p_cash_amount,
          p_payment_date => p_payment_date,
          p_payment_reference => p_payment_reference,
          p_remarks => p_remarks,
          p_credit_amount => p_credit_amount,
          p_credit_issue_date => p_credit_issue_date,
          p_credit_reason => p_credit_reason,
          p_credit_reference => p_credit_reference
        );
        v_tx_id := nullif(v_result->>'transaction_id','')::bigint;
        if v_tx_id is not null then
          update %1$I.payment_transactions
             set payment_method = p_payment_method
           where id = v_tx_id and payment_schedule_id = p_schedule_id;
          if not found then raise exception 'Recorded payment could not be linked to its method.'; end if;
        end if;
        return v_result;
      end;
      $body$;
    $ddl$,ns);

    execute format('revoke all on function %I.crm_record_payment_with_method(bigint,text,numeric,date,text,text,numeric,date,text,text) from public',ns);
    execute format('grant execute on function %I.crm_record_payment_with_method(bigint,text,numeric,date,text,text,numeric,date,text,text) to authenticated',ns);
  end loop;
end
$migration$;
