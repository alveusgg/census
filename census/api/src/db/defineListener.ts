import { EventEmitterAsyncResource, on } from 'events';
import { useEnvironment, withEnvironment } from '../utils/env/env.js';
import { subscribeToChanges } from './listen.js';

interface ChangeParams {
  table: string;
  id?: number | string;
  events: ('insert' | 'update' | 'delete')[];
}

interface HandlerContext {
  end: AbortController;
}

interface SubscribeOptions {
  signal?: AbortSignal;
}

interface Listener<T> {
  get: () => Promise<T>;
  subscribe: (options?: SubscribeOptions) => AsyncIterable<T>;
  close: () => void;
}

interface LoadResult<T> {
  value: T;
  shouldEnd: boolean;
}

const VALUE = 'value';
const END = Symbol('end');

export const defineListener = <T>(options: {
  changes: ChangeParams;
  handler: (context: HandlerContext) => Promise<T> | T;
}): Listener<T> => {
  const environment = useEnvironment();
  const ee = new EventEmitterAsyncResource({ name: `Listener:${options.changes.table}` });
  ee.setMaxListeners(1_000);

  const changes = new AbortController();

  let ended = false;
  let inFlight: Promise<LoadResult<T>> | undefined;
  let dirty = false;
  let broadcast: Promise<void> | undefined;

  const load = async (): Promise<LoadResult<T>> => {
    const end = new AbortController();
    const value = await withEnvironment(environment, () => options.handler({ end }));

    return { value, shouldEnd: end.signal.aborted };
  };

  const loadSnapshot = async () => {
    if (!inFlight) {
      inFlight = load().finally(() => {
        inFlight = undefined;
      });
    }

    return await inFlight;
  };

  const endSubscriptions = () => {
    if (ended) return;
    ended = true;
    changes.abort();
    ee.emit(VALUE, END);
  };

  const broadcastSnapshot = async (): Promise<LoadResult<T>> => {
    const result = await loadSnapshot();
    ee.emit(VALUE, result.value);

    if (result.shouldEnd) {
      endSubscriptions();
    }

    return result;
  };

  const broadcastLatestSnapshot = async (): Promise<void> => {
    dirty = true;

    if (!broadcast) {
      broadcast = (async () => {
        while (dirty && !ended) {
          dirty = false;
          const result = await broadcastSnapshot();
          if (result.shouldEnd) return;
        }
      })().finally(() => {
        broadcast = undefined;
      });
    }

    await broadcast;
  };

  void (async () => {
    try {
      for await (const _ of subscribeToChanges(options.changes, { signal: changes.signal })) {
        if (ended) break;

        await broadcastLatestSnapshot();
      }
    } catch (error) {
      if (!changes.signal.aborted) {
        throw error;
      }
    }
  })();

  const get = async () => {
    const { value } = await loadSnapshot();
    return value;
  };

  const subscribe = async function* ({ signal }: SubscribeOptions = {}) {
    const events = on(ee, VALUE, { signal });

    try {
      const initial = await loadSnapshot();
      yield initial.value;

      if (initial.shouldEnd || ended) {
        if (initial.shouldEnd) {
          endSubscriptions();
        }

        return;
      }

      for await (const [event] of events) {
        if (event === END) return;

        yield event as T;
      }
    } finally {
      await events.return?.();
    }
  };

  const close = () => {
    endSubscriptions();
  };

  return { get, subscribe, close };
};

export const defineParameterizedListener = <TInput, TValue>(options: {
  key: (input: TInput) => string;
  create: (input: TInput) => Listener<TValue>;
}) => {
  interface Entry {
    listener: Listener<TValue>;
    subscribers: number;
  }

  const listeners = new Map<string, Entry>();

  const getListener = (input: TInput) => {
    const key = options.key(input);
    let entry = listeners.get(key);

    if (!entry) {
      entry = { listener: options.create(input), subscribers: 0 };
      listeners.set(key, entry);
    }

    return { key, entry };
  };

  const cleanupIfIdle = (key: string, entry: Entry) => {
    if (entry.subscribers === 0) {
      listeners.delete(key);
      entry.listener.close();
    }
  };

  return {
    get: async (input: TInput) => {
      const { key, entry } = getListener(input);

      try {
        return await entry.listener.get();
      } finally {
        cleanupIfIdle(key, entry);
      }
    },

    subscribe: async function* (input: TInput, subscribeOptions?: SubscribeOptions) {
      const { key, entry } = getListener(input);
      entry.subscribers += 1;

      try {
        yield* entry.listener.subscribe(subscribeOptions);
      } finally {
        entry.subscribers -= 1;
        cleanupIfIdle(key, entry);
      }
    }
  };
};
