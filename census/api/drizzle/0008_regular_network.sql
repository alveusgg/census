ALTER TABLE "identifications" ADD COLUMN "location" "point";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_gist_idx" ON "identifications" USING gist ("location");