import { S3Client } from '@aws-sdk/client-s3';
import { DefaultAzureCredential } from '@azure/identity';
import { LogsQueryClient } from '@azure/monitor-query';
import Mux from '@mux/mux-node';
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { TelemetryClient } from 'applicationinsights';
import z from 'zod';

import { initialise } from '../../db/db.js';
import { panic } from '../assert.js';
import { CloudflareKVCache, KVCache, LocalKVCache } from '../cache.js';

export const config = z.object({
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),
  ALVEUS_AUTH_ISSUER: z.string(),
  ALVEUS_AUTH_CLIENT_ID: z.string(),
  ALVEUS_AUTH_CLIENT_SECRET: z.string(),

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

  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),

  CF_ACCOUNT_ID: z.string().optional(),
  CF_KV_NAMESPACE: z.string().optional(),
  CF_KV_TOKEN: z.string().optional(),

  DISCORD_WEBHOOK_URL: z.string().optional(),
  DISCORD_SERVER_ID: z.string().optional(),
  DISCORD_IS_FORUM: z.coerce.boolean().optional().default(false),
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  WORKSPACE_ID: z.string().optional(),

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

    const localEndpoint =
      variables.S3_ENDPOINT?.includes('localhost') ||
      variables.S3_ENDPOINT?.includes('127.0.0.1') ||
      variables.S3_PUBLIC_URL?.includes('localhost') ||
      variables.S3_PUBLIC_URL?.includes('127.0.0.1');
    if (localEndpoint) {
      panic('Mux cannot be used alongside local S3 emulation. Please use real object storage to continue.');
    }

    return new Mux({
      tokenId: variables.MUX_TOKEN_ID,
      tokenSecret: variables.MUX_TOKEN_SECRET
    });
  })();

  const logs = (() => {
    if (!variables.WORKSPACE_ID) {
      return;
    }

    const creds = new DefaultAzureCredential();
    const client = new LogsQueryClient(creds);

    return client;
  })();

  const cache: KVCache = (() => {
    if (!variables.CF_KV_NAMESPACE || !variables.CF_KV_TOKEN || !variables.CF_ACCOUNT_ID) {
      return new LocalKVCache();
    }

    return new CloudflareKVCache(variables.CF_ACCOUNT_ID, variables.CF_KV_NAMESPACE, variables.CF_KV_TOKEN);
  })();

  // Required clients
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL
  );

  const storage = new S3Client({
    region: variables.S3_REGION,
    credentials: {
      accessKeyId: variables.S3_ACCESS_KEY_ID,
      secretAccessKey: variables.S3_SECRET_ACCESS_KEY
    },
    ...(variables.S3_ENDPOINT ? { endpoint: variables.S3_ENDPOINT, forcePathStyle: true } : {})
  });

  const twitch = new ApiClient({
    authProvider: new AppTokenAuthProvider(variables.TWITCH_CLIENT_ID, variables.TWITCH_CLIENT_SECRET)
  });

  return {
    db: database.db,
    postgres: database.client,
    storage,
    twitch,
    telemetry,
    cache,
    mux,
    logs
  };
};
