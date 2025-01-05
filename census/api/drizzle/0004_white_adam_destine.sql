ALTER TABLE "identifications" ADD COLUMN "is_accessory" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "identifications" DROP COLUMN IF EXISTS "accessory_for";