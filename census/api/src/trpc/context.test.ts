import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext } from './context.js';

void test('collects request timings in a Server-Timing header', () => {
  const headers = new Map<string, string>();
  const context = createContext({
    req: { headers: {} },
    res: {
      header(name: string, value: string) {
        headers.set(name, value);
      }
    },
    info: {}
  } as unknown as Parameters<typeof createContext>[0]);

  context.timing('fogofwar', 200);
  context.timing('db', 400.126);

  assert.equal(headers.get('server-timing'), 'fogofwar;dur=200, db;dur=400.13');

  context.timing('db', 350);
  assert.equal(headers.get('server-timing'), 'fogofwar;dur=200, db;dur=350');
});
