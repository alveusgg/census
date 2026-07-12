WITH ranked_observation_rewards AS (
	SELECT "id", row_number() OVER (
		PARTITION BY "user_id", "payload"->'payload'->>'captureId'
		ORDER BY "id"
	) AS reward_number
	FROM "achievements"
	WHERE "type" = 'observe' AND "revoked" = false
)
UPDATE "achievements"
SET "revoked" = true
FROM ranked_observation_rewards
WHERE "achievements"."id" = ranked_observation_rewards."id"
	AND ranked_observation_rewards.reward_number > 1;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "achievements_unique_active_observation_reward_idx" ON "achievements" USING btree ("user_id",(("payload"->'payload'->>'captureId')::integer)) WHERE "achievements"."type" = 'observe' AND "achievements"."revoked" = false;
