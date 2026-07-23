import { S3Client } from '@aws-sdk/client-s3';
import Mux from '@mux/mux-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import * as Sentry from '@sentry/node';
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import z from 'zod';

import { initialise } from '../../db/db.js';
import { panic } from '../assert.js';
import { CloudflareKVCache, KVCache, PostgresKVCache } from '../cache.js';

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
  POSTGRES_PORT: z.coerce.number().optional(),

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
  DISCORD_MODERATION_WEBHOOK_URL: z.string().url().optional(),
  DISCORD_APPLICATION_ID: z.string().regex(/^\d+$/).optional(),
  DISCORD_APPLICATION_PUBLIC_KEY: z
    .string()
    .regex(/^[\da-f]{64}$/i)
    .optional(),
  DISCORD_BOT_TOKEN: z.string().min(1).optional(),
  DISCORD_SERVER_ID: z.string().regex(/^\d+$/).optional(),
  DISCORD_MODERATION_CHANNEL_ID: z.string().regex(/^\d+$/).optional(),
  DISCORD_IS_FORUM: z.coerce.boolean().optional().default(false),

  DEV_FLAG_USE_TWITCH_CLIP_DIRECTLY: z.coerce.boolean().optional().default(false),

  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  LOCAL_OTEL_COLLECTOR_URL: z.string().optional()
});

export const services = async (variables: z.infer<typeof config>) => {
  /*
    This is where we initialise all clients that use some configuration from the environment.
    This is useful because we can fail fast, not initialise clients that are not needed and
    ensure we make only one client for each service.
  */

  const sentry = (() => {
    // For local development, we use a valid-enough DSN so that the
    // telemetry is properly initialised. This is forwarded to
    // a local collector not to Sentry.
    const dsn =
      variables.SENTRY_DSN ??
      'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o0000000000000000.ingest.us.sentry.io/0000000000000000';

    const additionalProcessors: SpanProcessor[] = [];

    if (variables.NODE_ENV === 'development' && variables.LOCAL_OTEL_COLLECTOR_URL) {
      const processor = new BatchSpanProcessor(new OTLPTraceExporter({ url: variables.LOCAL_OTEL_COLLECTOR_URL }));
      // const consoleProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
      additionalProcessors.push(processor /* consoleProcessor */);
    }

    return Sentry.init({
      enableLogs: true,
      enableMetrics: true,
      sendDefaultPii: false,
      tracesSampleRate: 1.0,
      dsn,
      release: variables.SENTRY_RELEASE,

      integrations: integrations => [
        ...integrations.filter(integration => integration.name !== 'Fastify'),
        Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })
      ],
      openTelemetrySpanProcessors: additionalProcessors
    });
  })();

  // Optional clients
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

  // Required clients
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL,
    variables.POSTGRES_PORT
  );

  const cache: KVCache = (() => {
    if (!variables.CF_KV_NAMESPACE || !variables.CF_KV_TOKEN || !variables.CF_ACCOUNT_ID) {
      return new PostgresKVCache(database.db);
    }

    return new CloudflareKVCache(variables.CF_ACCOUNT_ID, variables.CF_KV_NAMESPACE, variables.CF_KV_TOKEN);
  })();

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
    cache,
    mux,
    sentry
  };
};
