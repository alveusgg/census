import assert from 'node:assert/strict';
import test from 'node:test';
import { createId } from './id';

test('creates distinct non-empty identifiers', () => {
  const first = createId();
  const second = createId();

  assert.ok(first.length > 0);
  assert.notEqual(first, second);
});
