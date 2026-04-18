ALTER TABLE "shinies" ADD COLUMN "revealedUrl" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shinies" ADD COLUMN "silhouette_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shinies" DROP COLUMN IF EXISTS "asset_id";--> statement-breakpoint
ALTER TABLE "shinies" DROP COLUMN IF EXISTS "key";