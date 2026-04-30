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

export const createRetrier = (attempts: number) => {
  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= attempts) throw error;

        const delay = 1000 * 2 ** (attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  return {
    run
  };
};

export type Retrier = ReturnType<typeof createRetrier>;
