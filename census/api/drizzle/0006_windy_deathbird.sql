DO $$ BEGIN
 CREATE TYPE "public"."feedback_type" AS ENUM('agree', 'disagree', 'confirm');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"identification_id" integer NOT NULL,
	"type" "feedback_type" NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "identification_idx" ON "feedback" USING btree ("identification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "identifications" DROP COLUMN IF EXISTS "feedback";