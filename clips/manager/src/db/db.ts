import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { listen } from './listen.js';
import * as schema from './schema/index.js';

export const initialise = async (
  host: string,
  user: string,
  password: string,
  database: string,
  ssl: boolean = false,
  port?: number
) => {
  const client = postgres({
    host,
    user,
    password,
    database,
    port,
    ssl
  });

  // Also do migrations in here
  const db = drizzle(client, {
    schema
  });
  await migrate(db, { migrationsFolder: 'drizzle' });
  await client.subscribe(
    '*',
    listen,
    () => console.log(`Subscribed to ${database}`),
    () => console.log(`Failed to subscribe to ${database}`)
  );

  return { db, client };
};
