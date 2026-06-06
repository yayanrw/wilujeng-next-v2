ALTER TABLE "products" ADD COLUMN "average_cost" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Backfill HPP rata-rata untuk produk lama: gunakan buy_price sebagai baseline.
-- Tidak merekonstruksi dari stock_logs karena opname/out membuat replay rawan salah.
-- Nilai ini terkoreksi otomatis pada Stock In berikutnya. Idempotent.
UPDATE "products" SET "average_cost" = "buy_price";
