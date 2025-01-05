import { EventEmitterAsyncResource, on } from 'events';
import { ReplicationEvent, Row } from 'postgres';
import { z } from 'zod';
import { assert } from '../utils/assert.js';

export const ee = new EventEmitterAsyncResource({
  name: 'Database Changes'
});

interface SubscribeParams {
  events: ('insert' | 'update' | 'delete')[];
}

export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams) {
  for await (const [payload] of on(ee, '*')) {
    const { name, change } = payload as Event;
    if (getReceiveKey(params) === name && params.events.includes(change.event)) {
      yield change;
    }
  }
};

export const getReceiveKey = (params: KeyParams) => {
  if (params.id) return `${params.table}:${params.id}`;
  return params.table;
};

export const getEmitKeys = (params: KeyParams) => {
  const keys: string[] = [params.table];
  if (params.id) keys.push(`${params.table}:${params.id}`);
  return keys;
};

interface KeyParams {
  table: string;
  id?: number;
}

interface Event {
  name: string;
  change: Change;
}

interface Change {
  table: string;
  id: number;
  event: 'insert' | 'update' | 'delete';
}

// postgres.js's type signature for `Row` is Record<string, any>
export const listen = async (row: Row | null, info: ReplicationEvent) => {
  assert.shape(z.object({ id: z.number() }), row, 'Row must have an id');
  const change: Change = {
    table: info.relation.table,
    id: row.id,
    event: info.command
  };

  const keys = getEmitKeys({ table: info.relation.table, id: row.id });
  keys.forEach(key => ee.emit('*', { name: key, change }));
};
