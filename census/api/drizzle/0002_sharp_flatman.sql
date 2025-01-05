ALTER TABLE "captures" ADD COLUMN "mux_asset_id" text;--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "mux_playback_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "captures" ADD CONSTRAINT "captures_captured_by_users_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
