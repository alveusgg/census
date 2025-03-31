ALTER TABLE "seasons" ALTER COLUMN "start_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "end_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "points";