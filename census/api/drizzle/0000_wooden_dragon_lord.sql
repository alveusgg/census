DO $$ BEGIN
 CREATE TYPE "public"."capture_status" AS ENUM('draft', 'pending', 'processing', 'complete', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('offline', 'unhealthy', 'healthy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('capturer', 'member', 'expert', 'moderator', 'researcher', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tag_type" AS ENUM('generic', 'event', 'campaign');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"identification_id" integer,
	"observation_id" integer,
	"points" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"redeemed" boolean DEFAULT false NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"captured_at" timestamp NOT NULL,
	"captured_by" integer NOT NULL,
	"status" "capture_status" DEFAULT 'pending' NOT NULL,
	"feed_id" text NOT NULL,
	"start_capture_at" timestamp NOT NULL,
	"end_capture_at" timestamp NOT NULL,
	"video_url" text,
	"clip_id" text NOT NULL,
	"clip_metadata" json NOT NULL,
	CONSTRAINT "captures_clip_id_unique" UNIQUE("clip_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payload" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feeds" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"status" "status" DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp,
	"fallback_feed_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"name" text NOT NULL,
	"source_id" text NOT NULL,
	"observation_id" integer NOT NULL,
	"suggested_by" integer NOT NULL,
	"confirmed_by" integer,
	"alternate_for" integer,
	"accessory_for" integer,
	"upvotes" json DEFAULT '[]'::json NOT NULL,
	"downvotes" json DEFAULT '[]'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"timestamp" numeric NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"observation_id" integer NOT NULL,
	"identification_id" integer,
	"bounding_box" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"payload" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" text,
	"capture_id" integer NOT NULL,
	"observed_at" timestamp NOT NULL,
	"observed_by" integer NOT NULL,
	"removed" boolean DEFAULT false NOT NULL,
	"moderated" json DEFAULT '[]'::json NOT NULL,
	"discord_thread_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag_assignments" (
	"tag_id" integer NOT NULL,
	"identification_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "tag_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"twitch_user_id" text NOT NULL,
	"username" text NOT NULL,
	"role" "role" NOT NULL,
	"points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "captures" ADD CONSTRAINT "captures_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "observations" ADD CONSTRAINT "observations_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "observations" ADD CONSTRAINT "observations_observed_by_users_id_fk" FOREIGN KEY ("observed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_identification_id_identifications_id_fk" FOREIGN KEY ("identification_id") REFERENCES "public"."identifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_achievements_idx" ON "achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "type_achievements_idx" ON "achievements" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_achievements_idx" ON "achievements" USING btree ("points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clip_id_idx" ON "captures" USING btree ("clip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_events_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "type_events_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_idx" ON "identifications" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_notifications_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitch_user_id_idx" ON "users" USING btree ("twitch_user_id");