CREATE TABLE "product_bxgy_promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"buy_qty" integer NOT NULL,
	"free_qty" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"max_multiplier_per_tx" integer,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_bxgy_promos_product_buy_free_unique" ON "product_bxgy_promos" USING btree ("product_id","buy_qty","free_qty");