DROP INDEX IF EXISTS "created_at_metrics_idx";--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_created_at_unique" UNIQUE("created_at");