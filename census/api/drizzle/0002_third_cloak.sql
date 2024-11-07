CREATE TABLE IF NOT EXISTS "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payload" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payload" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "captures" DROP CONSTRAINT "clip_url_unique_idx";--> statement-breakpoint
ALTER TABLE "identifications" DROP CONSTRAINT "identifications_suggested_by_roles_username_fk";
--> statement-breakpoint
ALTER TABLE "identifications" DROP CONSTRAINT "identifications_confirmed_by_roles_username_fk";
--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "clip_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "clip_metadata" json NOT NULL;--> statement-breakpoint
ALTER TABLE "identifications" ADD COLUMN "accessory_for" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_achievements_idx" ON "achievements" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "type_achievements_idx" ON "achievements" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_achievements_idx" ON "achievements" USING btree ("points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_events_idx" ON "events" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "type_events_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "username_notifications_idx" ON "notifications" USING btree ("username");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_suggested_by_users_username_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_confirmed_by_users_username_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clip_id_idx" ON "captures" USING btree ("clip_id");--> statement-breakpoint
ALTER TABLE "captures" DROP COLUMN IF EXISTS "clip_url";--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_clip_id_unique" UNIQUE("clip_id");