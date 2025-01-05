ALTER TABLE "identifications" ADD COLUMN "feedback" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "identifications" DROP COLUMN IF EXISTS "upvotes";--> statement-breakpoint
ALTER TABLE "identifications" DROP COLUMN IF EXISTS "downvotes";