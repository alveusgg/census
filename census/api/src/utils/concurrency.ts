import PQueue from 'p-queue';

export const createConcurrencyLimiter = (concurrency: number) => {
  const queue = new PQueue({ concurrency });

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    return (await queue.add(fn, { throwOnTimeout: true })) as T;
  };

  return {
    run,
    map: async <T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
      return await Promise.all(items.map(item => run(() => fn(item))));
    },
    get size() {
      return queue.size;
    },
    get pending() {
      return queue.pending;
    },
    onIdle: () => queue.onIdle()
  };
};

export type ConcurrencyLimiter = ReturnType<typeof createConcurrencyLimiter>;
