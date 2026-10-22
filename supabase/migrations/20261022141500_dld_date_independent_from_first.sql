-- Make first installment => DLD/Admin the ONLY automatic due-date direction.
-- The existing AFTER UPDATE trigger handles actual first installment date changes.
-- There is intentionally no DLD => first installment update, nor a sync when
-- only the first installment's amount/remarks change.
-- No existing due dates or payment records are modified by this migration.
DO $one_way$
DECLARE
  function_sql text;
  old_block text := $old$
  if v_stage_name = '1st Installment' then
    update public.payment_schedule
       set due_date = p_due_date, updated_at = now()
     where unit_id = v_unit_id and customer_id = v_customer_id and stage_name = 'DLD + Admin Fees (SPA)' and id <> v_id and due_date is distinct from p_due_date;
  elsif v_stage_name = 'DLD + Admin Fees (SPA)' then
    update public.payment_schedule
       set due_date = p_due_date, updated_at = now()
     where unit_id = v_unit_id and customer_id = v_customer_id and stage_name = '1st Installment' and id <> v_id and due_date is distinct from p_due_date;
  end if;
$old$;
  marker text := $replacement$
  -- Date synchronization is handled by trg_sync_first_dld_on_date_change,
  -- which fires only if the 1st Installment due date itself changes.
  -- DLD/Admin due date edits remain independent.
$replacement$;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO function_sql
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname='public'
     AND p.proname='crm_save_installment'
     AND p.pronargs=8;

  IF function_sql IS NULL THEN
    RAISE EXCEPTION 'Expected crm_save_installment RPC was not found';
  END IF;

  IF position(old_block IN function_sql)>0 THEN
    EXECUTE replace(function_sql,old_block,marker);
  ELSIF position('elsif v_stage_name = ''DLD + Admin Fees (SPA)''' IN function_sql)>0 THEN
    RAISE EXCEPTION 'Unexpected DLD synchronization branch; review CRM save function manually';
  ELSIF position('trg_sync_first_dld_on_date_change' IN function_sql)=0 THEN
    RAISE EXCEPTION 'One-way synchronization guard not found; review CRM save function';
  END IF;
END;
$one_way$;

-- Verify that the existing forward synchronization trigger is still installed.
DO $verify$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.payment_schedule'::regclass
      AND tgname='trg_sync_first_dld_on_date_change'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'The 1st Installment -> DLD due date trigger must remain installed';
  END IF;
END;
$verify$;
