-- Keep a booking-balance task accurate when the Down Payment and DLD/Admin
-- obligations share an effective due date. No due dates, payments, or completed
-- customer correspondence are rewritten by this migration.
CREATE OR REPLACE FUNCTION crm_private.sync_booking_balance_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_task record;
  v_dp public.payment_schedule%rowtype;
  v_dld public.payment_schedule%rowtype;
  v_dp_effective date;
  v_dld_effective date;
  v_dp_balance numeric;
  v_dld_balance numeric;
  v_total numeric;
  v_label text;
  v_note text;
  v_base_note text;
  v_include_dld boolean;
  v_first_same_date boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.units u
    WHERE u.id=NEW.unit_id AND u.customer_id=NEW.customer_id
  ) THEN RETURN NEW; END IF;
  IF lower(coalesce(NEW.stage_name,'')) NOT LIKE '%down payment%'
     AND lower(coalesce(NEW.stage_name,'')) NOT LIKE '%dld%'
     AND lower(coalesce(NEW.stage_name,'')) NOT LIKE '%admin fee%'
  THEN RETURN NEW; END IF;

  FOR v_task IN
    SELECT a.id,a.note,a.schedule_id,a.unit_id
    FROM public.scheduled_actions a
    WHERE a.unit_id=NEW.unit_id
      AND a.status='pending'
      AND a.auto_key LIKE 'booking_balance|unit:'||NEW.unit_id||'|schedule:%'
      AND a.workflow_kind IN ('payment_follow_up','promise_follow_up','payment_query')
      AND a.transaction_id IS NULL AND a.commitment_part_id IS NULL
      AND a.extension_request_id IS NULL AND a.modification_request_id IS NULL
    FOR UPDATE
  LOOP
    SELECT ps.* INTO v_dp
      FROM public.payment_schedule ps
      WHERE ps.id=v_task.schedule_id AND ps.unit_id=NEW.unit_id
        AND ps.customer_id=NEW.customer_id
        AND lower(coalesce(ps.stage_name,'')) LIKE '%down payment%';
    IF NOT FOUND THEN CONTINUE; END IF;

    v_dp_effective:=coalesce(v_dp.revised_due_date,v_dp.due_date);
    SELECT greatest(0,coalesce(v_dp.revised_due_amount,v_dp.due_amount,0)
        -coalesce(v_dp.paid_amount,0)
        -coalesce((SELECT sum(c.amount) FROM public.credit_notes c
                   WHERE c.payment_schedule_id=v_dp.id),0))
      INTO v_dp_balance;

    SELECT d.* INTO v_dld
      FROM public.payment_schedule d
      WHERE d.unit_id=v_dp.unit_id AND d.customer_id=v_dp.customer_id
        AND (lower(coalesce(d.stage_name,'')) LIKE '%dld%'
          OR lower(coalesce(d.stage_name,'')) LIKE '%admin fee%')
      ORDER BY d.id DESC LIMIT 1;
    v_include_dld:=false;
    v_dld_balance:=0;
    IF FOUND AND v_dp_effective IS NOT NULL THEN
      v_dld_effective:=coalesce(v_dld.revised_due_date,v_dld.due_date);
      SELECT EXISTS(
        SELECT 1 FROM public.payment_schedule f
        WHERE f.unit_id=v_dp.unit_id AND f.customer_id=v_dp.customer_id
          AND lower(coalesce(f.stage_name,'')) ~ '(^|[^a-z0-9])(1st|first)([^a-z0-9]|$)'
          AND lower(coalesce(f.stage_name,'')) LIKE '%installment%'
          AND coalesce(f.revised_due_date,f.due_date)=v_dld_effective
      ) INTO v_first_same_date;
      -- Prefer the established 1st Installment+DLD task when those share a date.
      v_include_dld:=v_dld_effective=v_dp_effective AND NOT v_first_same_date;
      IF v_include_dld THEN
        SELECT greatest(0,coalesce(v_dld.revised_due_amount,v_dld.due_amount,0)
          -coalesce(v_dld.paid_amount,0)
          -coalesce((SELECT sum(c.amount) FROM public.credit_notes c
                     WHERE c.payment_schedule_id=v_dld.id),0))
          INTO v_dld_balance;
      END IF;
    END IF;
    v_total:=round(v_dp_balance+v_dld_balance,2);
    IF v_dp_balance>0.01 AND v_dld_balance>0.01 THEN
      v_label:='Follow Up — Remaining Down Payment & DLD+Admin Fees';
    ELSIF v_dld_balance>0.01 THEN
      v_label:='Follow Up — Outstanding DLD+Admin Fees';
    ELSE
      v_label:='Follow Up — Remaining Down Payment';
    END IF;

    v_base_note:=split_part(coalesce(v_task.note,''),E'\n\n[Payment obligations]',1);
    v_note:=rtrim(v_base_note)
      ||E'\n\n[Payment obligations]'
      ||E'\nDown Payment (schedule #'||v_dp.id||'): AED '
      ||to_char(v_dp_balance,'FM999G999G999G990D00')
      ||' outstanding, due '||to_char(v_dp_effective,'DD Mon YYYY');
    IF v_include_dld THEN
      v_note:=v_note
        ||E'\nDLD + Admin Fees (schedule #'||v_dld.id||'): AED '
        ||to_char(v_dld_balance,'FM999G999G999G990D00')
        ||' outstanding, due '||to_char(v_dld_effective,'DD Mon YYYY');
    END IF;

    UPDATE public.scheduled_actions a
       SET action_label=v_label||' · AED '||to_char(v_total,'FM999G999G999G990D00'),
           note=v_note,
           status=CASE WHEN v_total<=0.01 THEN 'completed' ELSE a.status END,
           completed_at=CASE WHEN v_total<=0.01 THEN now() ELSE a.completed_at END,
           completion_note=CASE WHEN v_total<=0.01 THEN 'Linked payment obligation(s) settled.' ELSE a.completion_note END,
           updated_at=now()
     WHERE a.id=v_task.id AND a.status='pending';
  END LOOP;
  RETURN NEW;
END;
$function$;

-- Date changes can break or create the shared obligation; recompute in either case.
DROP TRIGGER IF EXISTS sync_booking_balance_task ON public.payment_schedule;
CREATE TRIGGER sync_booking_balance_task
AFTER UPDATE OF due_amount,revised_due_amount,paid_amount,status,due_date,revised_due_date
ON public.payment_schedule
FOR EACH ROW
EXECUTE FUNCTION crm_private.sync_booking_balance_task();
