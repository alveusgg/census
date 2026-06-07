CREATE INDEX CONCURRENTLY IF NOT EXISTS "achievements_valid_created_user_points_idx" ON "achievements" USING btree ("created_at","user_id") INCLUDE ("points") WHERE "achievements"."redeemed" = true AND "achievements"."revoked" = false;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "achievements_valid_user_created_points_idx" ON "achievements" USING btree ("user_id","created_at") INCLUDE ("points") WHERE "achievements"."redeemed" = true AND "achievements"."revoked" = false;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "achievements_pending_by_user_idx" ON "achievements" USING btree ("user_id") WHERE "achievements"."redeemed" = false AND "achievements"."revoked" = false;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "captures_captured_at_desc_idx" ON "captures" USING btree ("captured_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "captures_captured_by_captured_at_not_dead_idx" ON "captures" USING btree ("captured_by","captured_at" DESC NULLS LAST) WHERE "captures"."status" != 'dead';--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "captures_pending_feed_idx" ON "captures" USING btree ("feed_id") WHERE "captures"."status" = 'pending';--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "identifications_observation_source_accessory_idx" ON "identifications" USING btree ("observation_id","source_id","is_accessory");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "identifications_suggested_confirmed_primary_id_idx" ON "identifications" USING btree ("suggested_by","id" DESC NULLS LAST) WHERE "identifications"."confirmed_by" IS NOT NULL AND "identifications"."is_accessory" IS NOT TRUE;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "images_sighting_id_idx" ON "images" USING btree ("sighting_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "images_identification_id_idx" ON "images" USING btree ("identification_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "observations_observed_at_desc_idx" ON "observations" USING btree ("observed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sightings_observation_id_idx" ON "sightings" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sightings_capture_id_observed_by_idx" ON "sightings" USING btree ("capture_id","observed_by");
