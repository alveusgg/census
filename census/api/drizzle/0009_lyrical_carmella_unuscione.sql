DROP INDEX IF EXISTS "location_gist_idx";--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "location" "point";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_gist_idx" ON "observations" USING gist ("location");--> statement-breakpoint
ALTER TABLE "identifications" DROP COLUMN IF EXISTS "location";