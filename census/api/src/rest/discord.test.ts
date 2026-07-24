import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import fastify from 'fastify';
import { withEnvironment } from '../utils/env/env.js';
import discordInteractionsRouter from './discord.js';

void test('accepts a signed Discord endpoint verification ping', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const rawPublicKey = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ application_id: '1', type: 1 });
  const signature = sign(null, Buffer.from(timestamp + body), privateKey).toString('hex');
  const environment = {
    variables: {
      DISCORD_APPLICATION_ID: '1',
      DISCORD_APPLICATION_PUBLIC_KEY: rawPublicKey,
      DISCORD_SERVER_ID: '2',
      DISCORD_MODERATION_CHANNEL_ID: '3'
    }
  } as unknown as Parameters<typeof withEnvironment>[0];
  const server = fastify();

  await withEnvironment(environment, async () => {
    await server.register(discordInteractionsRouter, { prefix: '/discord' });
    const response = await server.inject({
      method: 'POST',
      url: '/discord/interactions',
      body,
      headers: {
        'content-type': 'application/json',
        'x-signature-ed25519': signature,
        'x-signature-timestamp': timestamp
      }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { type: 1 });
  });
});

void test('rejects unsigned Discord interactions', async () => {
  const environment = {
    variables: {
      DISCORD_APPLICATION_ID: '1',
      DISCORD_APPLICATION_PUBLIC_KEY: 'a'.repeat(64),
      DISCORD_SERVER_ID: '2',
      DISCORD_MODERATION_CHANNEL_ID: '3'
    }
  } as unknown as Parameters<typeof withEnvironment>[0];
  const server = fastify();

  await withEnvironment(environment, async () => {
    await server.register(discordInteractionsRouter, { prefix: '/discord' });
    const response = await server.inject({
      method: 'POST',
      url: '/discord/interactions',
      body: JSON.stringify({ application_id: '1', type: 1 }),
      headers: {
        'content-type': 'application/json'
      }
    });

    assert.equal(response.statusCode, 401);
  });
});
