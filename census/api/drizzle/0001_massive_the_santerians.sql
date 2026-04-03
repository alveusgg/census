CREATE TABLE IF NOT EXISTS "sightings" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" text,
	"observation_id" integer NOT NULL,
	"capture_id" integer NOT NULL,
	"observed_at" timestamp NOT NULL,
	"observed_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" DROP CONSTRAINT "observations_capture_id_captures_id_fk";
--> statement-breakpoint
ALTER TABLE "observations" DROP CONSTRAINT "observations_observed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "sighting_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sightings" ADD CONSTRAINT "sightings_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sightings" ADD CONSTRAINT "sightings_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sightings" ADD CONSTRAINT "sightings_observed_by_users_id_fk" FOREIGN KEY ("observed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_sighting_id_sightings_id_fk" FOREIGN KEY ("sighting_id") REFERENCES "public"."sightings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN IF EXISTS "observation_id";--> statement-breakpoint
ALTER TABLE "observations" DROP COLUMN IF EXISTS "nickname";--> statement-breakpoint
ALTER TABLE "observations" DROP COLUMN IF EXISTS "capture_id";--> statement-breakpoint
ALTER TABLE "observations" DROP COLUMN IF EXISTS "observed_by";