ALTER TABLE "shinies" RENAME COLUMN "sticker" TO "artwork";--> statement-breakpoint
ALTER TABLE "shinies" ADD COLUMN "silhouette" json NOT NULL;