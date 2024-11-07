import { createStore } from '@alveusgg/node';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { useEnvironment } from '../utils/env/env';
import * as schema from './schema';

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
