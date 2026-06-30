ALTER TABLE "feedback" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "comment_deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "identifications" ADD COLUMN "deleted_at" timestamp;