CREATE TABLE IF NOT EXISTS "observation_merges" (
	"source_observation_id" integer PRIMARY KEY NOT NULL,
	"target_observation_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "observation_merges" ADD CONSTRAINT "observation_merges_target_observation_id_observations_id_fk" FOREIGN KEY ("target_observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
