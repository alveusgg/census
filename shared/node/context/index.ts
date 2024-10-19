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
