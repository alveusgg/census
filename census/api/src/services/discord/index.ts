import { DownstreamError } from '@alveusgg/error';
import { eq } from 'drizzle-orm';
import { feedback } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { useEnvironment, useUser } from '../../utils/env/env.js';
import { report } from '../../utils/logs.js';
import { REMOVE_FEEDBACK_COMMENT_COMMAND } from './interactions.js';

export const registerDiscordModerationCommand = async () => {
  const { variables } = useEnvironment();
  if (!variables.DISCORD_APPLICATION_ID || !variables.DISCORD_BOT_TOKEN || !variables.DISCORD_SERVER_ID) return;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${variables.DISCORD_APPLICATION_ID}/guilds/${variables.DISCORD_SERVER_ID}/commands`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(5_000),
        body: JSON.stringify(REMOVE_FEEDBACK_COMMENT_COMMAND),
        headers: {
          Authorization: `Bot ${variables.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new DownstreamError(
        'discord',
        `Failed to register moderation command: ${response.status} ${response.statusText} ${body}`
      );
    }
  } catch (error) {
    const registrationError =
      error instanceof Error ? error : new DownstreamError('discord', 'Failed to register moderation command');
    report(registrationError);
    console.error(registrationError);
  }
};

export const notifyDiscordModerationFeed = async (feedbackId: number, comment: string) => {
  const { variables } = useEnvironment();
  const user = useUser();
  const useDiscordApplication = variables.DISCORD_BOT_TOKEN && variables.DISCORD_MODERATION_CHANNEL_ID;
  if (!useDiscordApplication && !variables.DISCORD_MODERATION_WEBHOOK_URL) return;

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

    const response = await fetch(
      useDiscordApplication
        ? `https://discord.com/api/v10/channels/${variables.DISCORD_MODERATION_CHANNEL_ID}/messages`
        : variables.DISCORD_MODERATION_WEBHOOK_URL!,
      {
        method: 'POST',
        signal: AbortSignal.timeout(5_000),
        body: JSON.stringify({
          content: `**${user.username}**: "${comment}"`,
          allowed_mentions: { parse: [] }
        }),
        headers: {
          'Content-Type': 'application/json',
          ...(useDiscordApplication ? { Authorization: `Bot ${variables.DISCORD_BOT_TOKEN}` } : {})
        }
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new DownstreamError(
        'discord',
        `Failed to post moderation notification: ${response.status} ${response.statusText} ${body}`
      );
    }

    if (useDiscordApplication) {
      const message: unknown = await response.json();
      if (typeof message !== 'object' || message === null || !('id' in message) || typeof message.id !== 'string') {
        throw new DownstreamError('discord', 'Moderation notification response did not include a message ID');
      }
      await db.update(feedback).set({ discordModerationMessageId: message.id }).where(eq(feedback.id, feedbackId));
    }
  } catch (error) {
    const notificationError =
      error instanceof Error ? error : new DownstreamError('discord', 'Failed to post moderation notification');
    report(notificationError);
    console.error(notificationError);
  }
};
