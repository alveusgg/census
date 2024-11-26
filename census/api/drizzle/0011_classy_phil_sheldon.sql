ALTER TABLE "achievements" RENAME COLUMN "username" TO "twitch_user_id";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "username" TO "twitch_user_id";--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "username" TO "twitch_user_id";--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_username_users_username_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_username_users_username_fk";
--> statement-breakpoint
ALTER TABLE "identifications" DROP CONSTRAINT "identifications_suggested_by_users_username_fk";
--> statement-breakpoint
ALTER TABLE "identifications" DROP CONSTRAINT "identifications_confirmed_by_users_username_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_username_users_username_fk";
--> statement-breakpoint
ALTER TABLE "observations" DROP CONSTRAINT "observations_observed_by_users_username_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "username_achievements_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "username_events_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "username_notifications_idx";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'users'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/
DELETE FROM "users"; -- Deletes all existing users in database
ALTER TABLE "users" DROP CONSTRAINT "roles_pkey";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitch_user_id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "achievements" ADD CONSTRAINT "achievements_twitch_user_id_users_twitch_user_id_fk" FOREIGN KEY ("twitch_user_id") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_twitch_user_id_users_twitch_user_id_fk" FOREIGN KEY ("twitch_user_id") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_suggested_by_users_twitch_user_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_confirmed_by_users_twitch_user_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_twitch_user_id_users_twitch_user_id_fk" FOREIGN KEY ("twitch_user_id") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "observations" ADD CONSTRAINT "observations_observed_by_users_twitch_user_id_fk" FOREIGN KEY ("observed_by") REFERENCES "public"."users"("twitch_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitch_user_id_achievements_idx" ON "achievements" USING btree ("twitch_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitch_user_id_events_idx" ON "events" USING btree ("twitch_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitch_user_id_notifications_idx" ON "notifications" USING btree ("twitch_user_id");