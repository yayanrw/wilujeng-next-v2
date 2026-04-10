CREATE TABLE "debt_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "points_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_id" uuid,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_logs" ADD COLUMN "transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "stock_logs" ADD COLUMN "return_reason" text;