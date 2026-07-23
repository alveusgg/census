import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import {
  authorizeDiscordModerationInteraction,
  DiscordInteraction,
  feedbackCommentRemovalCustomId,
  parseFeedbackCommentRemovalCommand,
  parseFeedbackCommentRemovalCustomId,
  REMOVE_FEEDBACK_COMMENT_COMMAND,
  verifyDiscordInteractionSignature
} from './interactions.js';

void test('verifies Discord Ed25519 request signatures', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const rawPublicKey = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
  const timestamp = '1784800000';
  const body = Buffer.from('{"type":1}');
  const signature = sign(null, Buffer.concat([Buffer.from(timestamp), body]), privateKey).toString('hex');

  assert.equal(verifyDiscordInteractionSignature(body, signature, timestamp, rawPublicKey), true);
  assert.equal(verifyDiscordInteractionSignature(Buffer.from('{"type":2}'), signature, timestamp, rawPublicKey), false);
  assert.equal(verifyDiscordInteractionSignature(body, 'invalid', timestamp, rawPublicKey), false);
});

void test('creates and parses feedback comment removal custom IDs', () => {
  assert.equal(feedbackCommentRemovalCustomId(42), 'census:feedback:remove:42');
  assert.equal(parseFeedbackCommentRemovalCustomId('census:feedback:remove:42'), 42);
  assert.equal(parseFeedbackCommentRemovalCustomId('census:feedback:remove:0'), undefined);
  assert.equal(parseFeedbackCommentRemovalCustomId('other:42'), undefined);
});

void test('recognizes the feedback message context command', () => {
  const interaction = DiscordInteraction.parse({
    application_id: '1',
    type: 2,
    guild_id: '2',
    channel_id: '3',
    member: {
      roles: [],
      user: { id: '5' }
    },
    data: {
      ...REMOVE_FEEDBACK_COMMENT_COMMAND,
      target_id: '6'
    }
  });

  assert.equal(parseFeedbackCommentRemovalCommand(interaction), '6');
  assert.equal(
    parseFeedbackCommentRemovalCommand({
      ...interaction,
      data: {
        ...interaction.data,
        name: 'Different command'
      }
    }),
    undefined
  );
});

void test('authorizes members of the configured channel', () => {
  const interaction = DiscordInteraction.parse({
    application_id: '1',
    type: 3,
    guild_id: '2',
    channel_id: '3',
    member: {
      roles: ['4'],
      user: { id: '5' }
    },
    data: {
      custom_id: feedbackCommentRemovalCustomId(42)
    },
    message: {
      content: 'A comment'
    }
  });
  const configuration = {
    applicationId: '1',
    publicKey: 'a'.repeat(64),
    serverId: '2',
    moderationChannelId: '3'
  };

  assert.equal(authorizeDiscordModerationInteraction(interaction, configuration), true);
  assert.equal(
    authorizeDiscordModerationInteraction(
      {
        ...interaction,
        channel_id: 'different'
      },
      configuration
    ),
    false
  );
});
