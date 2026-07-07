import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { context, SpanKind, trace } from '@opentelemetry/api';
import { SEMATTRS_DB_STATEMENT, SEMATTRS_DB_SYSTEM } from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/node';
import SuperJSON from 'superjson';
import { useEnvironment } from '../utils/env/env.js';
import { listen } from './listen.js';
import * as schema from './schema/index.js';

let shuttingDownAfterPostgresError = false;

const isAbortError = (reason: unknown) => {
  if (!(reason instanceof Error)) return false;
  return reason.name === 'AbortError' || ('code' in reason && reason.code === 'ABORT_ERR');
};

const exitAfterUnhandledRejection = (reason: unknown, tags: Record<string, string>) => {
  console.error('Unhandled rejection, shutting down process', reason);
  Sentry.captureException(reason, { tags });

  void Sentry.flush(2000).finally(() => process.exit(1));
};

process.on('unhandledRejection', reason => {
  if (isAbortError(reason)) return;

  if (!(reason instanceof postgres.PostgresError)) {
    exitAfterUnhandledRejection(reason, {
      component: 'process',
      fatal: 'true'
    });
    return;
  }

  if (shuttingDownAfterPostgresError) return;

  shuttingDownAfterPostgresError = true;
  exitAfterUnhandledRejection(reason, {
    component: 'postgres',
    fatal: 'true'
  });
});

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
    ssl,
    max: 3,
    prepare: false
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

export const checkDatabaseHealth = async () => {
  const { postgres } = useEnvironment();
  await postgres`SELECT 1`;
};
