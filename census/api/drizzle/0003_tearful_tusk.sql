ALTER TYPE "capture_status" ADD VALUE 'draft';--> statement-breakpoint
ALTER TABLE "images" RENAME COLUMN "bounding_boxes" TO "bounding_box";--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "bounding_box" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "observations" ALTER COLUMN "nickname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "moderated" json DEFAULT '[]'::json NOT NULL;