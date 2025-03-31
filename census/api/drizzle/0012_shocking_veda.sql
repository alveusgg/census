CREATE TABLE IF NOT EXISTS "metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"value" json NOT NULL
);
--> statement-breakpoint
DROP TABLE "events";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_metrics_idx" ON "metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_metrics_idx" ON "metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_metrics_idx" ON "metrics" USING btree ("name");