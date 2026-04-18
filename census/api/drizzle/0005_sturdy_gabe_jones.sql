ALTER TABLE "achievements" DROP CONSTRAINT "achievements_identification_id_identifications_id_fk";
--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_observation_id_observations_id_fk";
--> statement-breakpoint
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_identification_id_identifications_id_fk";
--> statement-breakpoint
ALTER TABLE "identifications" DROP CONSTRAINT "identifications_observation_id_observations_id_fk";
--> statement-breakpoint
ALTER TABLE "images" DROP CONSTRAINT "images_sighting_id_sightings_id_fk";
--> statement-breakpoint
ALTER TABLE "sightings" DROP CONSTRAINT "sightings_observation_id_observations_id_fk";
--> statement-breakpoint
ALTER TABLE "tag_assignments" DROP CONSTRAINT "tag_assignments_identification_id_identifications_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_sighting_id_sightings_id_fk" FOREIGN KEY ("sighting_id") REFERENCES "public"."sightings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sightings" ADD CONSTRAINT "sightings_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
