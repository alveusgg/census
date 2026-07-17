export const groupBy = <T, Key extends PropertyKey>(
  values: Iterable<T>,
  getKey: (value: T, index: number) => Key
): Record<Key, T[]> => {
  const groups = Object.create(null) as Record<Key, T[]>;

  let index = 0;
  for (const value of values) {
    const key = getKey(value, index++);
    const group = groups[key];
    if (group) group.push(value);
    else groups[key] = [value];
  }

  return groups;
};
