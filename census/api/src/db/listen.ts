import { EventEmitterAsyncResource, on } from 'events';
import { ReplicationEvent, Row } from 'postgres';
import { z } from 'zod';
import { assert } from '../utils/assert.js';

export const ee = new EventEmitterAsyncResource({
  name: 'Database Changes'
});
ee.setMaxListeners(1_000);

interface SubscribeParams {
  events: ('insert' | 'update' | 'delete')[];
}

export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams, options?: { signal?: AbortSignal }) {
  const key = getReceiveKey(params);

  for await (const [change] of on(ee, key, { signal: options?.signal })) {
    if (params.events.includes((change as Change).event)) {
      yield change as Change;
    }
  }
};

export const getReceiveKey = (params: KeyParams) => {
  if (params.id !== undefined) return `${params.table}:${params.id}`;
  return params.table;
};

export const getEmitKeys = (params: KeyParams) => {
  const keys: string[] = [params.table];
  if (params.id !== undefined) keys.push(`${params.table}:${params.id}`);
  return keys;
};

interface KeyParams {
  table: string;
  id?: number | string;
}

interface Change {
  table: string;
  id: number | string;
  event: 'insert' | 'update' | 'delete';
}

// postgres.js's type signature for `Row` is Record<string, any>
export const listen = async (row: Row | null, info: ReplicationEvent) => {
  assert.shape(z.object({ id: z.number().or(z.string()) }), row, 'Row must have an id');
  const change: Change = {
    table: info.relation.table,
    id: row.id,
    event: info.command
  };

  const keys = getEmitKeys({ table: info.relation.table, id: row.id });
  keys.forEach(key => ee.emit(key, change));
};
