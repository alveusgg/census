import { FastifyInstance } from 'fastify';
import { cache } from '../trpc/trpc.js';
import { useEnvironment } from '../utils/env/env.js';
import {
  authorizeDiscordModerationInteraction,
  DiscordInteraction,
  DiscordInteractionConfiguration,
  feedbackCommentRemovalCustomId,
  parseFeedbackCommentRemovalCommand,
  parseFeedbackCommentRemovalCustomId,
  verifyDiscordInteractionSignature
} from '../services/discord/interactions.js';
import {
  removeFeedbackCommentFromDiscord,
  removeFeedbackCommentFromDiscordMessage
} from '../services/identifications/identifications.js';

const PING = 1;
const APPLICATION_COMMAND = 2;
const MESSAGE_COMPONENT = 3;
const PONG = 1;
const CHANNEL_MESSAGE_WITH_SOURCE = 4;
const UPDATE_MESSAGE = 7;
const EPHEMERAL = 1 << 6;

const ephemeralResponse = (content: string) => ({
  type: CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    content,
    flags: EPHEMERAL,
    allowed_mentions: { parse: [] }
  }
});

const getConfiguration = (): DiscordInteractionConfiguration | undefined => {
  const { variables } = useEnvironment();
  if (
    !variables.DISCORD_APPLICATION_ID ||
    !variables.DISCORD_APPLICATION_PUBLIC_KEY ||
    !variables.DISCORD_SERVER_ID ||
    !variables.DISCORD_MODERATION_CHANNEL_ID
  ) {
    return;
  }

  return {
    applicationId: variables.DISCORD_APPLICATION_ID,
    publicKey: variables.DISCORD_APPLICATION_PUBLIC_KEY,
    serverId: variables.DISCORD_SERVER_ID,
    moderationChannelId: variables.DISCORD_MODERATION_CHANNEL_ID
  };
};

const invalidateFeedbackCaches = () =>
  cache.invalidate([
    ['observations'],
    ['identifications'],
    ['users', 'identifications'],
    ['users', 'profile'],
    ['users', 'leaderboard'],
    ['users', 'leaderboardPage']
  ]);

export default async function discordInteractionsRouter(router: FastifyInstance) {
  router.removeContentTypeParser('application/json');
  router.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));

  router.post('/interactions', async (request, reply) => {
    const configuration = getConfiguration();
    if (!configuration) {
      return reply.status(503).send({ error: 'Discord interactions are not configured' });
    }

    if (!Buffer.isBuffer(request.body)) {
      return reply.status(400).send({ error: 'Expected a JSON request body' });
    }

    const signature = request.headers['x-signature-ed25519'];
    const timestamp = request.headers['x-signature-timestamp'];
    if (
      !verifyDiscordInteractionSignature(
        request.body,
        typeof signature === 'string' ? signature : undefined,
        typeof timestamp === 'string' ? timestamp : undefined,
        configuration.publicKey
      )
    ) {
      return reply.status(401).send({ error: 'Invalid request signature' });
    }

    let input: unknown;
    try {
      input = JSON.parse(request.body.toString('utf8'));
    } catch {
      return reply.status(400).send({ error: 'Invalid JSON request body' });
    }

    const parsed = DiscordInteraction.safeParse(input);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid Discord interaction' });
    }

    const interaction = parsed.data;
    if (interaction.type === PING) {
      return { type: PONG };
    }

    if (interaction.type !== APPLICATION_COMMAND && interaction.type !== MESSAGE_COMPONENT) {
      return ephemeralResponse('This interaction is not supported.');
    }

    if (!authorizeDiscordModerationInteraction(interaction, configuration)) {
      return ephemeralResponse('You are not authorized to moderate Census comments.');
    }

    const discordUserId = interaction.member?.user.id;
    if (!discordUserId) {
      return ephemeralResponse('Discord could not identify the moderator.');
    }

    try {
      if (interaction.type === APPLICATION_COMMAND) {
        const discordMessageId = parseFeedbackCommentRemovalCommand(interaction);
        if (!discordMessageId) {
          return ephemeralResponse('This moderation command is not supported.');
        }

        const result = await removeFeedbackCommentFromDiscordMessage(discordMessageId, discordUserId);
        if (!result.found) {
          return ephemeralResponse('This is not a Census feedback moderation message.');
        }
        if (!result.removed) {
          return ephemeralResponse('This comment has already been removed.');
        }

        invalidateFeedbackCaches();
        return ephemeralResponse('Comment removed and achievement revoked. The vote remains.');
      }

      const feedbackId = parseFeedbackCommentRemovalCustomId(interaction.data?.custom_id);
      if (!feedbackId) {
        return ephemeralResponse('This moderation action is not supported.');
      }

      const result = await removeFeedbackCommentFromDiscord(feedbackId, discordUserId);
      if (!result.removed) {
        return ephemeralResponse('This comment has already been removed.');
      }

      invalidateFeedbackCaches();

      const originalContent = interaction.message?.content ?? `Feedback comment ${feedbackId}`;
      return {
        type: UPDATE_MESSAGE,
        data: {
          content: `${originalContent}\n\nComment removed and achievement revoked by <@${discordUserId}>.`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 4,
                  label: 'Comment removed',
                  custom_id: feedbackCommentRemovalCustomId(feedbackId),
                  disabled: true
                }
              ]
            }
          ],
          allowed_mentions: { parse: [] }
        }
      };
    } catch (error) {
      console.error('Failed to remove feedback comment from Discord', error);
      return ephemeralResponse('The comment could not be removed. It may no longer exist or may not be removable.');
    }
  });
}
