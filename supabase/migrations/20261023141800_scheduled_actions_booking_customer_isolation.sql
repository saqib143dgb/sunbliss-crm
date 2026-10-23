-- Schema parity: preserve the original booking customer of every scheduled task.

-- Applied to the live project as migration scheduled_actions_booking_customer_isolation.

ALTER TABLE "public".scheduled_actions ADD COLUMN IF NOT EXISTS booking_customer_id BIGINT REFERENCES "public".customers(id);

CREATE INDEX IF NOT EXISTS scheduled_actions_booking_customer_idx ON "public".scheduled_actions (booking_customer_id,unit_id,status);

UPDATE "public".scheduled_actions a SET booking_customer_id=COALESCE(
 (SELECT customer_id FROM "public".payment_schedule ps WHERE ps.id=a.schedule_id AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".payment_transactions pt WHERE pt.id=a.transaction_id AND pt.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".sales ss WHERE ss.id=a.spa_sale_id AND ss.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".payment_extension_requests er WHERE er.id=a.extension_request_id AND er.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".modification_requests mr WHERE mr.id=a.modification_request_id AND mr.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".payment_schedule ps WHERE ps.id=NULLIF(substring(a.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "public".units u WHERE u.id=a.unit_id)
) WHERE booking_customer_id IS NULL;

CREATE OR REPLACE FUNCTION "public".assign_scheduled_action_booking_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = "public", pg_temp AS $body$
DECLARE resolved BIGINT;
BEGIN
 IF TG_OP='UPDATE'
  AND NEW.unit_id IS NOT DISTINCT FROM OLD.unit_id
  AND NEW.schedule_id IS NOT DISTINCT FROM OLD.schedule_id
  AND NEW.transaction_id IS NOT DISTINCT FROM OLD.transaction_id
  AND NEW.spa_sale_id IS NOT DISTINCT FROM OLD.spa_sale_id
  AND NEW.extension_request_id IS NOT DISTINCT FROM OLD.extension_request_id
  AND NEW.modification_request_id IS NOT DISTINCT FROM OLD.modification_request_id
  AND NEW.auto_key IS NOT DISTINCT FROM OLD.auto_key
  AND OLD.booking_customer_id IS NOT NULL
 THEN
   NEW.booking_customer_id:=OLD.booking_customer_id;
   RETURN NEW;
 END IF;
 SELECT COALESCE(
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NEW.schedule_id AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_transactions t WHERE t.id=NEW.transaction_id AND t.unit_id=NEW.unit_id),
  (SELECT customer_id FROM sales s WHERE s.id=NEW.spa_sale_id AND s.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_extension_requests e WHERE e.id=NEW.extension_request_id AND e.unit_id=NEW.unit_id),
  (SELECT customer_id FROM modification_requests m WHERE m.id=NEW.modification_request_id AND m.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NULLIF(substring(NEW.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM units u WHERE u.id=NEW.unit_id)
 ) INTO resolved;
 IF resolved IS NULL THEN RAISE EXCEPTION 'Cannot identify customer for scheduled task unit %',NEW.unit_id; END IF;
 IF NEW.booking_customer_id IS NOT NULL AND NEW.booking_customer_id IS DISTINCT FROM resolved THEN
  RAISE EXCEPTION 'Scheduled task customer conflicts with linked booking';
 END IF;
 NEW.booking_customer_id:=resolved;
 RETURN NEW;
END $body$;

DROP TRIGGER IF EXISTS trg_assign_scheduled_action_booking_customer ON "public".scheduled_actions;

CREATE TRIGGER trg_assign_scheduled_action_booking_customer BEFORE INSERT OR UPDATE ON "public".scheduled_actions FOR EACH ROW EXECUTE FUNCTION "public".assign_scheduled_action_booking_customer();

ALTER TABLE "crm_test".scheduled_actions ADD COLUMN IF NOT EXISTS booking_customer_id BIGINT REFERENCES "crm_test".customers(id);

CREATE INDEX IF NOT EXISTS scheduled_actions_booking_customer_idx ON "crm_test".scheduled_actions (booking_customer_id,unit_id,status);

UPDATE "crm_test".scheduled_actions a SET booking_customer_id=COALESCE(
 (SELECT customer_id FROM "crm_test".payment_schedule ps WHERE ps.id=a.schedule_id AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".payment_transactions pt WHERE pt.id=a.transaction_id AND pt.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".sales ss WHERE ss.id=a.spa_sale_id AND ss.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".payment_extension_requests er WHERE er.id=a.extension_request_id AND er.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".modification_requests mr WHERE mr.id=a.modification_request_id AND mr.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".payment_schedule ps WHERE ps.id=NULLIF(substring(a.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_test".units u WHERE u.id=a.unit_id)
) WHERE booking_customer_id IS NULL;

CREATE OR REPLACE FUNCTION "crm_test".assign_scheduled_action_booking_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = "crm_test", pg_temp AS $body$
DECLARE resolved BIGINT;
BEGIN
 IF TG_OP='UPDATE'
  AND NEW.unit_id IS NOT DISTINCT FROM OLD.unit_id
  AND NEW.schedule_id IS NOT DISTINCT FROM OLD.schedule_id
  AND NEW.transaction_id IS NOT DISTINCT FROM OLD.transaction_id
  AND NEW.spa_sale_id IS NOT DISTINCT FROM OLD.spa_sale_id
  AND NEW.extension_request_id IS NOT DISTINCT FROM OLD.extension_request_id
  AND NEW.modification_request_id IS NOT DISTINCT FROM OLD.modification_request_id
  AND NEW.auto_key IS NOT DISTINCT FROM OLD.auto_key
  AND OLD.booking_customer_id IS NOT NULL
 THEN
   NEW.booking_customer_id:=OLD.booking_customer_id;
   RETURN NEW;
 END IF;
 SELECT COALESCE(
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NEW.schedule_id AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_transactions t WHERE t.id=NEW.transaction_id AND t.unit_id=NEW.unit_id),
  (SELECT customer_id FROM sales s WHERE s.id=NEW.spa_sale_id AND s.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_extension_requests e WHERE e.id=NEW.extension_request_id AND e.unit_id=NEW.unit_id),
  (SELECT customer_id FROM modification_requests m WHERE m.id=NEW.modification_request_id AND m.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NULLIF(substring(NEW.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM units u WHERE u.id=NEW.unit_id)
 ) INTO resolved;
 IF resolved IS NULL THEN RAISE EXCEPTION 'Cannot identify customer for scheduled task unit %',NEW.unit_id; END IF;
 IF NEW.booking_customer_id IS NOT NULL AND NEW.booking_customer_id IS DISTINCT FROM resolved THEN
  RAISE EXCEPTION 'Scheduled task customer conflicts with linked booking';
 END IF;
 NEW.booking_customer_id:=resolved;
 RETURN NEW;
END $body$;

DROP TRIGGER IF EXISTS trg_assign_scheduled_action_booking_customer ON "crm_test".scheduled_actions;

CREATE TRIGGER trg_assign_scheduled_action_booking_customer BEFORE INSERT OR UPDATE ON "crm_test".scheduled_actions FOR EACH ROW EXECUTE FUNCTION "crm_test".assign_scheduled_action_booking_customer();

ALTER TABLE "crm_triana".scheduled_actions ADD COLUMN IF NOT EXISTS booking_customer_id BIGINT REFERENCES "crm_triana".customers(id);

CREATE INDEX IF NOT EXISTS scheduled_actions_booking_customer_idx ON "crm_triana".scheduled_actions (booking_customer_id,unit_id,status);

UPDATE "crm_triana".scheduled_actions a SET booking_customer_id=COALESCE(
 (SELECT customer_id FROM "crm_triana".payment_schedule ps WHERE ps.id=a.schedule_id AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".payment_transactions pt WHERE pt.id=a.transaction_id AND pt.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".sales ss WHERE ss.id=a.spa_sale_id AND ss.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".payment_extension_requests er WHERE er.id=a.extension_request_id AND er.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".modification_requests mr WHERE mr.id=a.modification_request_id AND mr.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".payment_schedule ps WHERE ps.id=NULLIF(substring(a.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana".units u WHERE u.id=a.unit_id)
) WHERE booking_customer_id IS NULL;

CREATE OR REPLACE FUNCTION "crm_triana".assign_scheduled_action_booking_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = "crm_triana", pg_temp AS $body$
DECLARE resolved BIGINT;
BEGIN
 IF TG_OP='UPDATE'
  AND NEW.unit_id IS NOT DISTINCT FROM OLD.unit_id
  AND NEW.schedule_id IS NOT DISTINCT FROM OLD.schedule_id
  AND NEW.transaction_id IS NOT DISTINCT FROM OLD.transaction_id
  AND NEW.spa_sale_id IS NOT DISTINCT FROM OLD.spa_sale_id
  AND NEW.extension_request_id IS NOT DISTINCT FROM OLD.extension_request_id
  AND NEW.modification_request_id IS NOT DISTINCT FROM OLD.modification_request_id
  AND NEW.auto_key IS NOT DISTINCT FROM OLD.auto_key
  AND OLD.booking_customer_id IS NOT NULL
 THEN
   NEW.booking_customer_id:=OLD.booking_customer_id;
   RETURN NEW;
 END IF;
 SELECT COALESCE(
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NEW.schedule_id AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_transactions t WHERE t.id=NEW.transaction_id AND t.unit_id=NEW.unit_id),
  (SELECT customer_id FROM sales s WHERE s.id=NEW.spa_sale_id AND s.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_extension_requests e WHERE e.id=NEW.extension_request_id AND e.unit_id=NEW.unit_id),
  (SELECT customer_id FROM modification_requests m WHERE m.id=NEW.modification_request_id AND m.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NULLIF(substring(NEW.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM units u WHERE u.id=NEW.unit_id)
 ) INTO resolved;
 IF resolved IS NULL THEN RAISE EXCEPTION 'Cannot identify customer for scheduled task unit %',NEW.unit_id; END IF;
 IF NEW.booking_customer_id IS NOT NULL AND NEW.booking_customer_id IS DISTINCT FROM resolved THEN
  RAISE EXCEPTION 'Scheduled task customer conflicts with linked booking';
 END IF;
 NEW.booking_customer_id:=resolved;
 RETURN NEW;
END $body$;

DROP TRIGGER IF EXISTS trg_assign_scheduled_action_booking_customer ON "crm_triana".scheduled_actions;

CREATE TRIGGER trg_assign_scheduled_action_booking_customer BEFORE INSERT OR UPDATE ON "crm_triana".scheduled_actions FOR EACH ROW EXECUTE FUNCTION "crm_triana".assign_scheduled_action_booking_customer();

ALTER TABLE "crm_triana_test".scheduled_actions ADD COLUMN IF NOT EXISTS booking_customer_id BIGINT REFERENCES "crm_triana_test".customers(id);

CREATE INDEX IF NOT EXISTS scheduled_actions_booking_customer_idx ON "crm_triana_test".scheduled_actions (booking_customer_id,unit_id,status);

UPDATE "crm_triana_test".scheduled_actions a SET booking_customer_id=COALESCE(
 (SELECT customer_id FROM "crm_triana_test".payment_schedule ps WHERE ps.id=a.schedule_id AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".payment_transactions pt WHERE pt.id=a.transaction_id AND pt.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".sales ss WHERE ss.id=a.spa_sale_id AND ss.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".payment_extension_requests er WHERE er.id=a.extension_request_id AND er.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".modification_requests mr WHERE mr.id=a.modification_request_id AND mr.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".payment_schedule ps WHERE ps.id=NULLIF(substring(a.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND ps.unit_id=a.unit_id),
 (SELECT customer_id FROM "crm_triana_test".units u WHERE u.id=a.unit_id)
) WHERE booking_customer_id IS NULL;

CREATE OR REPLACE FUNCTION "crm_triana_test".assign_scheduled_action_booking_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = "crm_triana_test", pg_temp AS $body$
DECLARE resolved BIGINT;
BEGIN
 IF TG_OP='UPDATE'
  AND NEW.unit_id IS NOT DISTINCT FROM OLD.unit_id
  AND NEW.schedule_id IS NOT DISTINCT FROM OLD.schedule_id
  AND NEW.transaction_id IS NOT DISTINCT FROM OLD.transaction_id
  AND NEW.spa_sale_id IS NOT DISTINCT FROM OLD.spa_sale_id
  AND NEW.extension_request_id IS NOT DISTINCT FROM OLD.extension_request_id
  AND NEW.modification_request_id IS NOT DISTINCT FROM OLD.modification_request_id
  AND NEW.auto_key IS NOT DISTINCT FROM OLD.auto_key
  AND OLD.booking_customer_id IS NOT NULL
 THEN
   NEW.booking_customer_id:=OLD.booking_customer_id;
   RETURN NEW;
 END IF;
 SELECT COALESCE(
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NEW.schedule_id AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_transactions t WHERE t.id=NEW.transaction_id AND t.unit_id=NEW.unit_id),
  (SELECT customer_id FROM sales s WHERE s.id=NEW.spa_sale_id AND s.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_extension_requests e WHERE e.id=NEW.extension_request_id AND e.unit_id=NEW.unit_id),
  (SELECT customer_id FROM modification_requests m WHERE m.id=NEW.modification_request_id AND m.unit_id=NEW.unit_id),
  (SELECT customer_id FROM payment_schedule p WHERE p.id=NULLIF(substring(NEW.auto_key FROM 'schedules?:([0-9]+)'),'')::BIGINT AND p.unit_id=NEW.unit_id),
  (SELECT customer_id FROM units u WHERE u.id=NEW.unit_id)
 ) INTO resolved;
 IF resolved IS NULL THEN RAISE EXCEPTION 'Cannot identify customer for scheduled task unit %',NEW.unit_id; END IF;
 IF NEW.booking_customer_id IS NOT NULL AND NEW.booking_customer_id IS DISTINCT FROM resolved THEN
  RAISE EXCEPTION 'Scheduled task customer conflicts with linked booking';
 END IF;
 NEW.booking_customer_id:=resolved;
 RETURN NEW;
END $body$;

DROP TRIGGER IF EXISTS trg_assign_scheduled_action_booking_customer ON "crm_triana_test".scheduled_actions;

CREATE TRIGGER trg_assign_scheduled_action_booking_customer BEFORE INSERT OR UPDATE ON "crm_triana_test".scheduled_actions FOR EACH ROW EXECUTE FUNCTION "crm_triana_test".assign_scheduled_action_booking_customer();
