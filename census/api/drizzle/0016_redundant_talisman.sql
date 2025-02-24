ALTER TABLE "identifications" ADD COLUMN "shiny_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifications" ADD CONSTRAINT "identifications_shiny_id_shinies_id_fk" FOREIGN KEY ("shiny_id") REFERENCES "public"."shinies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "identification_id_idx" ON "shinies" USING btree ("identification_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "i_nat_id_idx" ON "shinies" USING btree ("inat_id");