ALTER TABLE "transaction_items" ADD COLUMN "unit_buy_price" integer;
--> statement-breakpoint
-- Freeze historical COGS (plan STEP 1, Opsi A): set snapshot = current product buy_price
-- for all pre-existing items so historical profit stops floating. Idempotent: only
-- touches NULL rows, safe to re-run.
UPDATE "transaction_items" ti
SET "unit_buy_price" = p."buy_price"
FROM "products" p
WHERE ti."product_id" = p."id"
  AND ti."unit_buy_price" IS NULL;
