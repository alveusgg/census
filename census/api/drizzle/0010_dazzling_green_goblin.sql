ALTER TABLE "observations" ADD COLUMN "observed_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "observed_by" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "observations" ADD CONSTRAINT "observations_observed_by_users_username_fk" FOREIGN KEY ("observed_by") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
