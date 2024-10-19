DO $$ BEGIN
 CREATE TYPE "public"."capture_status" AS ENUM('pending', 'processing', 'complete', 'archived');
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
CREATE TABLE IF NOT EXISTS "captures" (
	"id" serial PRIMARY KEY NOT NULL,
	"captured_at" timestamp NOT NULL,
	"captured_by" text NOT NULL,
	"status" "capture_status" DEFAULT 'pending' NOT NULL,
	"feed_id" text NOT NULL,
	"start_capture_at" timestamp NOT NULL,
	"end_capture_at" timestamp NOT NULL,
	"video_url" text,
	"clip_url" text,
	CONSTRAINT "clip_url_unique_idx" UNIQUE NULLS NOT DISTINCT("clip_url")
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
	"suggested_by" text NOT NULL,
	"confirmed_by" text,
	"alternate_for" integer,
	"upvotes" json DEFAULT '[]'::json NOT NULL,
	"downvotes" json DEFAULT '[]'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"frame" integer NOT NULL,
	"observation_id" integer NOT NULL,
	"identification_id" integer,
	"bounding_boxes" json DEFAULT '[]'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"nickname" text NOT NULL,
	"capture_id" integer NOT NULL,
	"discord_thread_id" text,
	CONSTRAINT "discord_thread_id_unique_idx" UNIQUE NULLS NOT DISTINCT("discord_thread_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"username" text PRIMARY KEY NOT NULL,
	"role" "role" NOT NULL
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
DO $$ BEGIN
 ALTER TABLE "captures" ADD CONSTRAINT "captures_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_suggested_by_roles_username_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."roles"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_confirmed_by_roles_username_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."roles"("username") ON DELETE no action ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "source_idx" ON "identifications" USING btree ("source_id");