import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import z from 'zod';
import { initialise } from '../../db/db.js';

export const config = z.object({
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),

  NODE_ENV: z.enum(['development', 'production']).default('development'),
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

  STORAGE_ACCOUNT_NAME: z.string(),
  STORAGE_ACCOUNT_KEY: z.string(),
  CONTAINER_NAME: z.string(),

  ASSETS_PATH: z.string().default('./assets'),
  ASSETS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().transform(value => Buffer.from(value, 'hex'))
});

export const services = async (variables: z.infer<typeof config>) => {
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

  const twitch = new ApiClient({
    authProvider: new AppTokenAuthProvider(variables.TWITCH_CLIENT_ID, variables.TWITCH_CLIENT_SECRET)
  });

  return {
    db: database.db,
    postgres: database.client,
    storage,
    twitch
  };
};
