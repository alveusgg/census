import { ContainerClient } from '@azure/storage-blob';
import Mux from '@mux/mux-node';
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { TelemetryClient } from 'applicationinsights';
import { Redis, RedisOptions } from 'ioredis';
import z from 'zod';

import { initialise } from '../../db/db.js';
import { panic } from '../assert.js';

export const config = z.object({
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),

  NODE_ENV: z.enum(['development', 'production']),
  HOST: z.string(),
  PORT: z.coerce.number(),

  POSTGRES_HOST: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SSL: z.coerce.boolean().default(false),

  API_URL: z.string().optional(),
  CONTAINER_APP_NAME: z.string().optional(),
  CONTAINER_APP_ENV_DNS_SUFFIX: z.string().optional(),

  STORAGE_CONNECTION_STRING: z.string(),
  CONTAINER_NAME: z.string(),

  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SSL: z.coerce.boolean().default(false),

  DISCORD_WEBHOOK_URL: z.string().optional(),
  DISCORD_SERVER_ID: z.string().optional(),
  DISCORD_IS_FORUM: z.coerce.boolean().optional().default(false),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),

  JWT_SECRET: z.string().transform(value => Buffer.from(value, 'hex')),

  DEV_FLAG_USE_TWITCH_CLIP_DIRECTLY: z.coerce.boolean().optional().default(false)
});

export const services = async (variables: z.infer<typeof config>) => {
  /*
    This is where we initialise all clients that use some configuration from the environment.
    This is useful because we can fail fast, not initialise clients that are not needed and
    ensure we make only one client for each service.
  */

  // Optional clients
  const telemetry = (() => {
    if (!variables.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      if (variables.NODE_ENV === 'production') {
        panic('App insights is required in production');
      }
      return;
    }

    const client = new TelemetryClient(variables.APPLICATIONINSIGHTS_CONNECTION_STRING);
    client.initialize();

    return client;
  })();

  const mux = (() => {
    if (!variables.MUX_TOKEN_ID || !variables.MUX_TOKEN_SECRET) {
      if (variables.NODE_ENV === 'production') {
        panic('Mux is required in production');
      }
      return;
    }

    if (variables.STORAGE_CONNECTION_STRING.includes('localhost')) {
      panic('Mux cannot be used alongside blob storage emulation. Please use a real storage account to continue.');
    }

    return new Mux({
      tokenId: variables.MUX_TOKEN_ID,
      tokenSecret: variables.MUX_TOKEN_SECRET
    });
  })();

  const options: RedisOptions = {};
  if (variables.REDIS_PASSWORD) {
    options.password = variables.REDIS_PASSWORD;
  }
  if (variables.REDIS_SSL) {
    options.tls = { rejectUnauthorized: false };
  }

  const redis = new Redis(Number(variables.REDIS_PORT), variables.REDIS_HOST, options);

  // Required clients
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL
  );

  const storage = new ContainerClient(variables.STORAGE_CONNECTION_STRING, variables.CONTAINER_NAME, {});
  await storage.createIfNotExists({ access: 'blob' });

  const twitch = new ApiClient({
    authProvider: new AppTokenAuthProvider(variables.TWITCH_CLIENT_ID, variables.TWITCH_CLIENT_SECRET)
  });

  return {
    db: database.db,
    postgres: database.client,
    storage,
    twitch,
    telemetry,
    redis,
    mux
  };
};
