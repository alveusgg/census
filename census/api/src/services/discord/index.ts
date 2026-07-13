import { DownstreamError } from '@alveusgg/error';
import { eq } from 'drizzle-orm';
import { feedback } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { report } from '../../utils/logs.js';

export const notifyDiscordModerationFeed = async (feedbackId: number, comment: string) => {
  const { variables } = useEnvironment();
  const user = useUser();
  if (!variables.DISCORD_MODERATION_WEBHOOK_URL) return;

  try {
    const db = useDB();
    const entry = await db.query.feedback.findFirst({
      where: eq(feedback.id, feedbackId),
      columns: { type: true },
      with: {
        identification: {
          columns: { name: true, observationId: true }
        }
      }
    });
    if (!entry) return;

    const response = await fetch(variables.DISCORD_MODERATION_WEBHOOK_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({
        content: `**${user.username}**: "${comment}"`,
        allowed_mentions: { parse: [] }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new DownstreamError(
        'discord',
        `Failed to post moderation notification: ${response.status} ${response.statusText} ${body}`
      );
    }
  } catch (error) {
    const notificationError =
      error instanceof Error ? error : new DownstreamError('discord', 'Failed to post moderation notification');
    report(notificationError);
    console.error(notificationError);
  }
};
