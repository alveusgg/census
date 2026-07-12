# Database Handover Document

> **Scope:** `census/api` — how PostgreSQL is wired into the API layer.

---

## 1. Technology Stack

| Layer         | Library / Driver                                  | Version (from `census/api/package.json`) |
| ------------- | ------------------------------------------------- | ---------------------------------------- |
| ORM           | Drizzle ORM                                       | `^0.33.0`                                |
| Driver        | `postgres` (postgres-js)                          | `^3.4.4`                                 |
| Migration CLI | drizzle-kit                                       | `^0.24.2`                                |
| Validation    | Zod                                               | `^3.23.8`                                |
| Async Context | `node:async_hooks` (wrapped via `@alveusgg/node`) | Node built-in                            |

---

## 2. Setup

### 2.1 Drizzle Kit Config

File: `census/api/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    user: 'myuser',
    password: 'mypassword',
    database: 'db01'
  }
});
```

This file is **only** used by the `drizzle-kit` CLI (generate / push). It is **not** used by the running API.

### 2.2 Runtime Database Initialisation

File: `census/api/src/db/db.ts`

```typescript
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
```

What happens inside `initialise`:

1. **Connection** — a single `postgres` client is created from the validated env credentials.
2. **Drizzle wrapper** — the client is wrapped with Drizzle, passing in the full `schema` object so relational queries work.
3. **Auto-migration** — `migrate()` runs every time the server starts, applying any pending `.sql` files in `census/api/drizzle`.
4. **Telemetry** — every SQL query is emitted as an OpenTelemetry span via `logger.logQuery`.
5. **Logical replication** — the client subscribes to `*` (all tables) so Postgres pushes change events back to the API (see §5 Real-time Subscriptions).

---

## 3. Migrations

### 3.1 Generating a New Migration

```bash
pnpm db:generate
```

This script is defined in `census/api/package.json`:

```json
"db:generate": "NODE_OPTIONS='--import tsx' drizzle-kit generate"
```

- Reads `drizzle.config.ts`.
- Compares the current schema (`src/db/schema/index.ts`) against the DB (or previous migrations).
- Emits a new `.sql` file into `census/api/drizzle/` and updates `drizzle/meta/_journal.json`.

### 3.2 Migration Files

Migrations live in `census/api/drizzle/`. Example file name: `0012_third_starbolt.sql`.

Each file is plain SQL plus Drizzle comments such as:

```sql
ALTER TABLE "shinies" RENAME COLUMN "sticker" TO "artwork";--> statement-breakpoint
ALTER TABLE "shinies" ADD COLUMN "silhouette" json NOT NULL;
```

The `meta/_journal.json` file tracks the ordered list of applied migrations.

### 3.3 Applying Migrations at Runtime

**Migrations are applied automatically on every server start** via `migrate(db, { migrationsFolder: 'drizzle' })` inside `initialise`.

There is no separate `db:push` or `db:migrate` script that operators run by hand.

---

## 4. Syntax (Drizzle ORM)

### 4.1 Schema Definition

All schema files are under `census/api/src/db/schema/` and re-exported from `index.ts`.

**Example — `users.ts`:**

```typescript
import { index, json, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['active', 'pending']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    status: userStatusEnum('status').notNull(),
    providerId: text('provider_id').notNull(),
    username: text('username').notNull(),
    stickers: json('stickers'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => {
    return {
      providerIdIdx: index('provider_id_idx').on(table.providerId)
    };
  }
);

export type User = typeof users.$inferSelect;
```

Key conventions:

- Prefer `pgTable`, `pgEnum`, `serial`, `timestamp`, `json`, `text`, etc. from `drizzle-orm/pg-core`.
- Indexes are declared in the second argument callback.
- Types are inferred with `typeof table.$inferSelect` (or `$inferInsert`).
- Relations (foreign keys, many-to-one, one-to-many) are declared in separate `*.ts` files using `relations()` from `drizzle-orm` and also re-exported from the schema index.

### 4.2 Query Patterns in Services

Services are the only place that should talk to the DB. Example from `census/api/src/services/users/index.ts`:

```typescript
import { desc, eq } from 'drizzle-orm';
import { users } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';

export const getUsers = async () => {
  const db = useDB();
  return db.select().from(users).orderBy(desc(users.createdAt));
};

export const getUser = async (id: number) => {
  const db = useDB();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotAuthenticatedError('User not found');
  return user;
};
```

Important rules:

- **Always use `useDB()`** rather than importing a raw `db` instance. `useDB()` is context-aware and will return an active transaction if one exists (see §6 AsyncLocalStorage).
- Use Drizzle's SQL builder (`eq`, `desc`, `gt`, etc.) for filtering and ordering.
- Throw domain errors (`NotAuthenticatedError`, `NotFoundError`) when rows are missing.

### 4.3 Transactions

```typescript
import { useDB, withTransaction } from '../../db/transaction.js';

export const onboardUser = async (id: number, data: OnboardingFormSchema) => {
  const db = useDB();
  return await db.transaction(async tx => {
    return await withTransaction(tx, async () => {
      await tx.update(users).set({ status: 'active' }).where(eq(users.id, id));
      await recordAchievement('onboard', id, { ... }, true);
      await tx.insert(responses).values({ userId: id, type: 'onboarding', payload: data });
    });
  });
};
```

- `db.transaction()` gives you a `tx` object.
- `withTransaction(tx, callback)` stores that `tx` in AsyncLocalStorage.
- Any nested service call inside the callback that calls `useDB()` will receive `tx` instead of the base connection.

---

## 5. Environment Variables & Zod

### 5.1 Schema Definition

File: `census/api/src/utils/env/config.ts`

```typescript
import z from 'zod';

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

  DEV_FLAG_USE_TWITCH_CLIP_DIRECTLY: z.coerce.boolean().optional().default(false),

  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  LOCAL_OTEL_COLLECTOR_URL: z.string().optional()
});
```

Key Zod patterns used:

- `z.string()` — required string.
- `z.coerce.number()` — casts env strings to numbers (e.g. `PORT=3000`).
- `z.coerce.boolean().default(false)` — casts `"true"` / `"false"` strings to booleans; falls back to `false` if missing.
- `z.enum(['development', 'production'])` — strict union for `NODE_ENV`.
- `.optional()` — marks a variable as not required.

If any required key is missing or the wrong type, `config.parse(process.env)` throws a descriptive Zod error and the process exits early.

### 5.2 Environment Object Creation

File: `census/api/src/utils/env/env.ts`

```typescript
import { z } from 'zod';
import { config, services } from './config.js';

type Env = {
  variables: z.infer<typeof config>;
  host: string;
} & Awaited<ReturnType<typeof services>>;

export const createEnvironment = async (): Promise<Env> => {
  const variables = config.parse(process.env);
  const host = getHost(variables);

  return {
    variables,
    host,
    ...(await services(variables))
  };
};
```

Flow:

1. `dotenv` is loaded first in `src/index.ts`.
2. `createEnvironment()` parses `process.env` through the Zod schema.
3. `services(variables)` is awaited, which initialises every external client (Postgres, S3, Twitch, etc.).
4. The resulting `Env` object contains `variables`, `host`, `db`, `postgres`, `storage`, `twitch`, `cache`, `mux`, `sentry`.

---

## 6. The `services()` Factory

File: `census/api/src/utils/env/config.ts` (same file as the Zod schema)

```typescript
export const services = async (variables: z.infer<typeof config>) => {
  /*
    This is where we initialise all clients that use some configuration from the environment.
    This is useful because we can fail fast, not initialise clients that are not needed and
    ensure we make only one client for each service.
  */

  const sentry = (() => {
    /* … */
  })();

  // Optional clients
  const mux = (() => {
    /* … */
  })();
  const cache = (() => {
    /* … */
  })();

  // Required clients
  const database = await initialise(
    variables.POSTGRES_HOST,
    variables.POSTGRES_USER,
    variables.POSTGRES_PASSWORD,
    variables.POSTGRES_DB,
    variables.POSTGRES_SSL
  );

  const storage = new S3Client({/* … */});
  const twitch = new ApiClient({/* … */});

  return {
    db: database.db, // Drizzle instance
    postgres: database.client, // Raw postgres-js client
    storage,
    twitch,
    cache,
    mux,
    sentry
  };
};
```

Why this pattern matters:

- **Fail-fast** — if Postgres is unreachable, the server crashes immediately during startup instead of on the first request.
- **Singleton guarantee** — every service gets exactly one client instance.
- **Conditional initialisation** — optional services (Mux, Cloudflare KV) are only created when their env vars are present.

---

## 7. AsyncLocalStorage & Context Stores

### 7.1 The Primitive: `createStore`

File: `shared/node/context/index.ts` (monorepo package `@alveusgg/node`)

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

export const createStore = <T>(name: string) => {
  const store = new AsyncLocalStorage<T>();
  return [
    <R>(value: T, cb: () => R) => store.run(value, cb),
    () => {
      const value = store.getStore();
      if (value === undefined) {
        throw new Error(`No value in store: "${name}"`);
      }
      return value;
    }
  ] as const;
};
```

`createStore` returns a tuple `[withStore, useStore]`:

- `withStore(value, callback)` — runs the callback inside an async context where `value` is retrievable.
- `useStore()` — retrieves the current value from the active async context. Throws if called outside a `withStore` block.

### 7.2 Three Stores in the API

All three are declared in `census/api/src/utils/env/env.ts`.

#### 1. Environment Store

```typescript
const EnvironmentStore = createStore<Env>('environment');
export const [withEnvironment, useEnvironment] = EnvironmentStore;
```

Usage in `src/index.ts`:

```typescript
const environment = await createEnvironment();

await withEnvironment(environment, async () => {
  // entire server lifecycle lives inside this context
  const server = fastify();
  // …
});
```

`useEnvironment()` is called by:

- `tearDownDatabase()` to grab the raw `postgres` client.
- `useDB()` as a fallback when no transaction is active.

#### 2. User Store

```typescript
type User = TokenPayload & CoreUser & UserActions;

const UserStore = createStore<User>('user');
export const [withUser, useUser] = UserStore;
```

Usage in tRPC auth middleware (`census/api/src/trpc/trpc.ts`):

```typescript
export const procedure = loggedProcedure.use(async ({ ctx, next }) => {
  // JWT validation …
  const user = await getUserByProviderId(payload.data.sub);
  return withUser({ ...payload.data, ...user, points: ctx.points, achievements: ctx.achievements }, next);
});
```

Any tRPC handler downstream can call `useUser()` to get the currently authenticated user without passing it through every function signature.

#### 3. Transaction Store

File: `census/api/src/db/transaction.ts`

```typescript
import { createStore } from '@alveusgg/node';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { useEnvironment } from '../utils/env/env.js';
import * as schema from './schema/index.js';

const TransactionStore =
  createStore<PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>>(
    'transaction'
  );

export const [withTransaction, useRawTransaction] = TransactionStore;

export const useDB = () => {
  try {
    return useRawTransaction();
  } catch {
    return useEnvironment().db;
  }
};
```

This is the most important store for day-to-day DB work.

- `withTransaction(tx, callback)` — stores the Drizzle `PgTransaction` object in AsyncLocalStorage.
- `useRawTransaction()` — retrieves that transaction. Throws if none is active.
- `useDB()` — **the function every service should call**. It tries to get the active transaction first; if none exists, it falls back to the base Drizzle instance from the environment store.

### 7.3 Why This Pattern Exists

Without AsyncLocalStorage, every service function would need an optional `tx` parameter:

```typescript
// Bad — requires every function to accept and forward tx
const getUser = async (id: number, tx?: DB) => { … }
```

With the store pattern:

- `useDB()` transparently resolves to the correct instance.
- Nested service calls automatically participate in the parent transaction.
- The code stays flat and readable.

---

## 8. Real-time Database Subscriptions

File: `census/api/src/db/listen.ts`

The `postgres` client is subscribed to logical replication events (`*` — all tables). When a row is inserted, updated, or deleted, Postgres pushes a notification to the API.

```typescript
export const ee = new EventEmitterAsyncResource({ name: 'Database Changes' });

export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams) {
  for await (const [payload] of on(ee, '*')) {
    const { name, change } = payload as Event;
    if (getReceiveKey(params) === name && params.events.includes(change.event)) {
      yield change;
    }
  }
};
```

Example consumer (tRPC subscription):

```typescript
recentAchievements: procedure.subscription(async function* () {
  yield await getRecentRedeemedAchievements(7);
  for await (const _ of subscribeToChanges({ table: 'achievements', events: ['insert', 'update'] })) {
    yield await getRecentRedeemedAchievements(7);
  }
});
```

Every time an achievement row is inserted or updated, the subscription re-fetches and pushes the latest 7 achievements to connected WebSocket clients.

---

## 9. Quick Reference Cheatsheet

| Task                    | File / Command                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| Add a new table         | `census/api/src/db/schema/<name>.ts` → export in `index.ts`          |
| Generate migration      | `pnpm db:generate`                                                   |
| Run migrations          | **Automatic** on server start via `initialise()`                     |
| Query the DB            | Call `useDB()` then `db.select().from(table)`                        |
| Start a transaction     | `db.transaction(async tx => withTransaction(tx, async () => { … }))` |
| Get current user        | `useUser()` inside any tRPC handler                                  |
| Get env / host          | `useEnvironment()`                                                   |
| Listen to table changes | `subscribeToChanges({ table: 'users', events: ['insert'] })`         |
| Close DB gracefully     | `tearDownDatabase()` (called by SIGTERM handler)                     |

---

## 10. File Map

```
census/api/
├── drizzle.config.ts              # Drizzle Kit CLI config (generate only)
├── drizzle/
│   ├── 0000_*.sql                 # Migration files
│   └── meta/_journal.json         # Migration ledger
├── src/
│   ├── db/
│   │   ├── db.ts                  # initialise(), tearDownDatabase()
│   │   ├── listen.ts              # Postgres replication listener
│   │   ├── transaction.ts         # withTransaction, useDB
│   │   └── schema/
│   │       ├── index.ts           # Re-exports all tables
│   │       └── *.ts               # One file per domain table
│   ├── utils/env/
│   │   ├── config.ts              # Zod schema + services() factory
│   │   └── env.ts                 # createEnvironment(), withEnvironment, withUser
│   └── services/
│       └── */index.ts             # Business logic; all call useDB()
└── package.json
```

---

_Document generated from codebase audit on 2026-05-10._
