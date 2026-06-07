ALTER TYPE "capture_status" ADD VALUE IF NOT EXISTS 'dead';--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN IF NOT EXISTS "upgrade_attempt_count" integer DEFAULT 1 NOT NULL;
