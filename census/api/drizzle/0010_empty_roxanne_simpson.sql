ALTER TABLE "shinies" ADD COLUMN "sticker" json NOT NULL;--> statement-breakpoint
ALTER TABLE "shinies" DROP COLUMN IF EXISTS "revealedUrl";--> statement-breakpoint
ALTER TABLE "shinies" DROP COLUMN IF EXISTS "silhouette_url";