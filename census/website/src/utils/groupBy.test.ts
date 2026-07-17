import assert from 'node:assert/strict';
import test from 'node:test';
import { groupBy } from './groupBy';

test('groups values by their selected key', () => {
  const grouped = groupBy(
    [
      { id: 1, kind: 'bird' },
      { id: 2, kind: 'mammal' },
      { id: 3, kind: 'bird' }
    ],
    value => value.kind
  );

  assert.deepEqual(grouped.bird, [
    { id: 1, kind: 'bird' },
    { id: 3, kind: 'bird' }
  ]);
  assert.deepEqual(grouped.mammal, [{ id: 2, kind: 'mammal' }]);
});

test('does not inherit keys from Object.prototype', () => {
  const grouped = groupBy(['first', 'second'], () => '__proto__');

  assert.equal(Object.getPrototypeOf(grouped), null);
  assert.deepEqual(grouped.__proto__, ['first', 'second']);
});
