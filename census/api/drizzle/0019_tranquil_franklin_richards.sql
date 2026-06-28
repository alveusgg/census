CREATE TABLE IF NOT EXISTS "anonymous_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"payload" json NOT NULL
);
