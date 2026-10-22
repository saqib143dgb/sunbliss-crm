-- Link 1st Installment due-date changes to the same customer/unit DLD obligation.
-- Existing records are NOT backfilled; only future changes trigger synchronization.
CREATE OR REPLACE FUNCTION public.crm_sync_first_dld_on_date_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $sync$
BEGIN
  IF NEW.unit_id IS NULL OR NEW.customer_id IS NULL
     OR lower(coalesce(NEW.stage_name,'')) !~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)'
     OR (lower(NEW.stage_name) NOT LIKE '%installment%'
         AND lower(NEW.stage_name) NOT LIKE '%instalment%')
  THEN
    RETURN NEW;
  END IF;

  -- Do not modify prior buyers' archived schedules or other units.
  IF NOT EXISTS (
    SELECT 1 FROM public.units u
    WHERE u.id = NEW.unit_id AND u.customer_id = NEW.customer_id
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.payment_schedule AS d
     SET due_date = CASE
           WHEN NEW.due_date IS DISTINCT FROM OLD.due_date THEN NEW.due_date
           ELSE d.due_date
         END,
         revised_due_date = CASE
           WHEN NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
           THEN NEW.revised_due_date ELSE d.revised_due_date
         END,
         revision_approved_on = CASE
           WHEN NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
           THEN NEW.revision_approved_on ELSE d.revision_approved_on
         END,
         revision_approved_by = CASE
           WHEN NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
           THEN NEW.revision_approved_by ELSE d.revision_approved_by
         END,
         revision_reference = CASE
           WHEN NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
           THEN NEW.revision_reference ELSE d.revision_reference
         END,
         revision_reason = CASE
           WHEN NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
           THEN NEW.revision_reason ELSE d.revision_reason
         END,
         updated_at = now()
   WHERE d.unit_id = NEW.unit_id
     AND d.customer_id = NEW.customer_id
     AND d.id <> NEW.id
     AND lower(coalesce(d.stage_name,'')) ~ '(dld|admin[[:space:]]*fees?)'
     AND (
        (NEW.due_date IS DISTINCT FROM OLD.due_date AND d.due_date IS DISTINCT FROM NEW.due_date)
        OR
        (NEW.revised_due_date IS DISTINCT FROM OLD.revised_due_date
         AND d.revised_due_date IS DISTINCT FROM NEW.revised_due_date)
     );
  RETURN NEW;
END;
$sync$;

DROP TRIGGER IF EXISTS trg_sync_first_dld_on_date_change ON public.payment_schedule;
CREATE TRIGGER trg_sync_first_dld_on_date_change
AFTER UPDATE OF due_date, revised_due_date ON public.payment_schedule
FOR EACH ROW
WHEN (OLD.due_date IS DISTINCT FROM NEW.due_date OR OLD.revised_due_date IS DISTINCT FROM NEW.revised_due_date)
EXECUTE FUNCTION public.crm_sync_first_dld_on_date_change();

-- Restrict the existing bidirectional installment editor's synchronization to
-- the CURRENT customer's schedule. Previously it matched unit ID only, which
-- could inadvertently modify a previous buyer's archived DLD or 1st installment.
DO $fix_rpc$
DECLARE
  function_sql text;
  before_dld text := 'where unit_id = v_unit_id and stage_name = ''DLD + Admin Fees (SPA)'' and id <> v_id;';
  after_dld text := 'where unit_id = v_unit_id and customer_id = v_customer_id and stage_name = ''DLD + Admin Fees (SPA)'' and id <> v_id and due_date is distinct from p_due_date;';
  before_first text := 'where unit_id = v_unit_id and stage_name = ''1st Installment'' and id <> v_id;';
  after_first text := 'where unit_id = v_unit_id and customer_id = v_customer_id and stage_name = ''1st Installment'' and id <> v_id and due_date is distinct from p_due_date;';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO function_sql
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = 'crm_save_installment'
     AND p.pronargs = 8;

  IF function_sql IS NULL THEN RAISE EXCEPTION 'Expected crm_save_installment RPC was not found'; END IF;
  IF position(after_dld IN function_sql) > 0 AND position(after_first IN function_sql) > 0 THEN RETURN; END IF;
  IF position(before_dld IN function_sql) = 0 OR position(before_first IN function_sql) = 0 THEN
    RAISE EXCEPTION 'crm_save_installment has changed; review synchronization statements before modifying';
  END IF;

  function_sql := replace(function_sql, before_dld, after_dld);
  function_sql := replace(function_sql, before_first, after_first);
  EXECUTE function_sql;
END;
$fix_rpc$;