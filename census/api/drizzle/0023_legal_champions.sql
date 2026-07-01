CREATE TABLE IF NOT EXISTS "cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"expired_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cache_expired_at_idx" ON "cache" USING btree ("expired_at");