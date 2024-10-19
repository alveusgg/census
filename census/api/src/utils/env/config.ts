import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { Redis, RedisOptions } from 'ioredis';
import z from 'zod';
import { initialise } from '../../db/db.js';

export const config = z.object({
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),
  TWITCH_USERNAME: z.string(),

  NODE_ENV: z.enum(['development', 'production']).default('development'),
  HOST: z.string(),
  PORT: z.coerce.number(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SSL: z.coerce.boolean().default(false),

  POSTGRES_HOST: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SSL: z.coerce.boolean().default(false),

  UI_URL: z.string(),
  API_URL: z.string().optional(),

  STORAGE_ACCOUNT_NAME: z.string(),
  STORAGE_ACCOUNT_KEY: z.string(),
  CONTAINER_NAME: z.string(),

  CHANNELS_TO_LISTEN_TO: z.string().transform(value => value.split(',')),

  COMMAND_PREFIX: z.string().default('!'),
  JWT_SECRET: z.string().transform(value => Buffer.from(value, 'hex'))
});

export const services = async (variables: z.infer<typeof config>) => {
  const options: RedisOptions = {};
  if (variables.REDIS_PASSWORD) {
    options.password = variables.REDIS_PASSWORD;
  }
  if (variables.REDIS_SSL) {
    options.tls = { rejectUnauthorized: false };
  }

  const redis = new Redis(Number(variables.REDIS_PORT), variables.REDIS_HOST, options);
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL
  );

  const storage = new ContainerClient(
    `https://${variables.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${variables.CONTAINER_NAME}`,
    new StorageSharedKeyCredential(variables.STORAGE_ACCOUNT_NAME, variables.STORAGE_ACCOUNT_KEY)
  );

  return {
    redis,
    db: database.db,
    postgres: database.client,
    storage
  };
};
