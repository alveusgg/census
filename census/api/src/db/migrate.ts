import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema/index.js';

const MIGRATIONS_SCHEMA = 'drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

type Database = PostgresJsDatabase<typeof schema>;

/**
 * Apply pending migrations, one transaction per migration.
 *
 * drizzle-orm's built-in migrate() runs every pending migration inside a single
 * transaction. Postgres refuses to use a newly added enum value in the same
 * transaction that added it (error 55P04), so on a fresh database the whole
 * batch fails once one migration does `ALTER TYPE ... ADD VALUE` and a later
 * migration uses that value (here 0013 adds capture_status 'dead' and 0017
 * indexes on it). Existing databases never hit this because they migrated
 * incrementally, committing between runs.
 *
 * Committing per migration reproduces that incremental behaviour: the ADD VALUE
 * lands and commits before any later migration uses it. Bookkeeping is written
 * to the same drizzle.__drizzle_migrations table drizzle-orm uses, so existing
 * databases and drizzle-kit stay compatible. Relies on Postgres 12+, where
 * ALTER TYPE ... ADD VALUE is allowed inside a transaction.
 */
export const runMigrations = async (db: Database, migrationsFolder: string) => {
  const migrations = readMigrationFiles({ migrationsFolder });

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(MIGRATIONS_SCHEMA)}`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(MIGRATIONS_SCHEMA)}.${sql.identifier(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const applied = (await db.execute(sql`
    select created_at from ${sql.identifier(MIGRATIONS_SCHEMA)}.${sql.identifier(MIGRATIONS_TABLE)}
    order by created_at desc limit 1
  `)) as unknown as Array<{ created_at: string | number }>;
  const lastCreatedAt = applied.length > 0 ? Number(applied[0].created_at) : undefined;

  for (const migration of migrations) {
    if (lastCreatedAt !== undefined && lastCreatedAt >= migration.folderMillis) continue;

    await db.transaction(async tx => {
      for (const statement of migration.sql) {
        if (!statement.trim()) continue;
        await tx.execute(sql.raw(statement));
      }
      await tx.execute(sql`
        insert into ${sql.identifier(MIGRATIONS_SCHEMA)}.${sql.identifier(MIGRATIONS_TABLE)} ("hash", "created_at")
        values (${migration.hash}, ${migration.folderMillis})
      `);
    });
  }
};
