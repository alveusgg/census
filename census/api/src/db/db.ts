import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { context, SpanKind, trace } from '@opentelemetry/api';
import { SEMATTRS_DB_STATEMENT, SEMATTRS_DB_SYSTEM } from '@opentelemetry/semantic-conventions';
import SuperJSON from 'superjson';
import { useEnvironment } from '../utils/env/env.js';
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
    schema,
    logger: {
      logQuery: (query, params) => {
        const ctx = context.active();
        const tracer = trace.getTracer('ApplicationInsightsTracer');

        const span = tracer.startSpan(
          'SQL',
          {
            kind: SpanKind.CLIENT,
            attributes: {
              params: SuperJSON.stringify(params),
              [SEMATTRS_DB_SYSTEM]: 'postgresql',
              [SEMATTRS_DB_STATEMENT]: query
            },
            startTime: new Date()
          },
          ctx
        );
        span.end();
      }
    }
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

export const tearDownDatabase = async () => {
  const { postgres } = useEnvironment();
  await postgres.end();
};
