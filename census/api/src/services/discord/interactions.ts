import { createPublicKey, verify } from 'node:crypto';
import { z } from 'zod';

const ED25519_PUBLIC_KEY_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const REMOVE_FEEDBACK_COMMENT_PREFIX = 'census:feedback:remove:';
export const REMOVE_FEEDBACK_COMMENT_COMMAND_NAME = 'Remove Census comment';
export const REMOVE_FEEDBACK_COMMENT_COMMAND = {
  name: REMOVE_FEEDBACK_COMMENT_COMMAND_NAME,
  type: 3
} as const;

export const DiscordInteraction = z.object({
  application_id: z.string(),
  type: z.number().int(),
  guild_id: z.string().optional(),
  channel_id: z.string().optional(),
  member: z
    .object({
      roles: z.array(z.string()),
      user: z.object({ id: z.string() })
    })
    .optional(),
  data: z
    .object({
      custom_id: z.string().optional(),
      name: z.string().optional(),
      type: z.number().int().optional(),
      target_id: z.string().optional()
    })
    .optional(),
  message: z
    .object({
      content: z.string()
    })
    .optional()
});

export type DiscordInteraction = z.infer<typeof DiscordInteraction>;

export type DiscordInteractionConfiguration = {
  applicationId: string;
  publicKey: string;
  serverId: string;
  moderationChannelId: string;
};

export const feedbackCommentRemovalCustomId = (feedbackId: number) => `${REMOVE_FEEDBACK_COMMENT_PREFIX}${feedbackId}`;

export const parseFeedbackCommentRemovalCustomId = (customId: string | undefined) => {
  if (!customId?.startsWith(REMOVE_FEEDBACK_COMMENT_PREFIX)) return;

  const feedbackId = Number(customId.slice(REMOVE_FEEDBACK_COMMENT_PREFIX.length));
  if (!Number.isSafeInteger(feedbackId) || feedbackId <= 0) return;
  return feedbackId;
};

export const parseFeedbackCommentRemovalCommand = (interaction: DiscordInteraction) => {
  if (interaction.data?.type !== REMOVE_FEEDBACK_COMMENT_COMMAND.type) return;
  if (interaction.data.name !== REMOVE_FEEDBACK_COMMENT_COMMAND.name) return;
  return interaction.data.target_id;
};

export const verifyDiscordInteractionSignature = (
  body: Buffer,
  signature: string | undefined,
  timestamp: string | undefined,
  publicKey: string
) => {
  if (!signature || !timestamp || !/^[\da-f]{128}$/i.test(signature) || !/^[\da-f]{64}$/i.test(publicKey)) {
    return false;
  }

  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_PUBLIC_KEY_PREFIX, Buffer.from(publicKey, 'hex')]),
      format: 'der',
      type: 'spki'
    });
    const signedBody = Buffer.concat([Buffer.from(timestamp), body]);
    return verify(null, signedBody, key, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
};

export const authorizeDiscordModerationInteraction = (
  interaction: DiscordInteraction,
  configuration: DiscordInteractionConfiguration
) => {
  if (interaction.application_id !== configuration.applicationId) return false;
  if (interaction.guild_id !== configuration.serverId) return false;
  if (interaction.channel_id !== configuration.moderationChannelId) return false;
  if (!interaction.member?.user.id) return false;
  return true;
};
