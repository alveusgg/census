# SSE listener scalability implementation plan

## Problem

The current SSE subscriptions are backed by a single process-local `EventEmitterAsyncResource` in `census/api/src/db/listen.ts`.

Postgres change notifications are already fanned out at the process level: `census/api/src/db/db.ts` calls `client.subscribe('*', listen, ...)` once per API process. That part is fine.

The scalability issue is inside the process:

```ts
export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams) {
  for await (const [payload] of on(ee, '*')) {
    const { name, change } = payload as Event;
    if (getReceiveKey(params) === name && params.events.includes(change.event)) {
      yield change;
    }
  }
};
```

Every SSE subscriber listens to `'*'`, so every database change wakes every active SSE subscription. Matching subscribers then each run their own snapshot query.

For `users.live.recentAchievements`, one achievement update with 500 connected clients can result in 500 identical `getRecentRedeemedAchievements(7)` calls in one API process.

For `capture.live.capture`, one capture update wakes every active SSE subscription, then matching subscribers for that capture ID each run `getCapture(id)`.

## Goals

1. Subscribe to keyed in-process events, not `'*'`.
2. Centralize snapshot queries so one change burst causes one DB read per listener key per API process.
3. Keep endpoint code readable.
4. Keep public-safe SSE subscriptions public so EventSource auth token refresh is not part of the steady-state path.
5. Add SSE keepalive pings so idle streams do not churn through proxy timeouts.
6. Keep parameterized listener composition outside the core listener primitive.

## Non-Goals

1. Do not add Redis/NATS/external pub-sub in this pass.
2. Do not make `defineListener` aware of parameterized inputs.
3. Do not expose a public `onIdle` API from listener instances.
4. Do not pass request `AbortSignal` into listener handlers unless the handler actually uses signal-aware APIs.

## Phase 1: Key The DB Change EventEmitter

File: `census/api/src/db/listen.ts`

Replace the global `'*'` subscriber model with keyed events.

Current emit path:

```ts
const keys = getEmitKeys({ table: info.relation.table, id: row.id });
keys.forEach(key => ee.emit('*', { name: key, change }));
```

Target emit path:

```ts
const keys = getEmitKeys({ table: info.relation.table, id: row.id });
keys.forEach(key => ee.emit(key, change));
```

Current subscribe path:

```ts
export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams) {
  for await (const [payload] of on(ee, '*')) {
    const { name, change } = payload as Event;
    if (getReceiveKey(params) === name && params.events.includes(change.event)) {
      yield change;
    }
  }
};
```

Target subscribe path:

```ts
export const subscribeToChanges = async function* (params: SubscribeParams & KeyParams) {
  const key = getReceiveKey(params);

  for await (const [change] of on(ee, key)) {
    if (params.events.includes((change as Change).event)) {
      yield change as Change;
    }
  }
};
```

Also remove the now-unneeded wrapper type:

```ts
interface Event {
  name: string;
  change: Change;
}
```

Set listener limits deliberately after `ee` is created:

```ts
export const ee = new EventEmitterAsyncResource({
  name: 'Database Changes'
});

ee.setMaxListeners(1_000);
```

This does not make 1,000 listeners inherently safe. It avoids false-positive `MaxListenersExceededWarning` for expected popular channels while the rest of this plan reduces per-listener work.

## Phase 2: Add `defineListener`

File: `census/api/src/db/defineListener.ts`

Create a listener primitive that owns the local fan-out and coalesces snapshot queries.

Desired endpoint usage:

```ts
const activity = defineListener({
  changes: { table: 'achievements', events: ['insert', 'update'] },
  handler: () => getRecentRedeemedAchievements(7)
});

for await (const achievements of activity.subscribe({ signal })) {
  yield achievements;
}
```

Handler lifecycle stays data-focused:

```ts
const capture = defineListener({
  changes: { table: 'captures', id, events: ['update'] },
  handler: async ({ end }) => {
    const capture = await getCapture(id);

    if (capture.status === 'complete') {
      end.abort();
    }

    return capture;
  }
});
```

Important semantic: `end.abort()` means broadcast the returned value, then close the listener. It should not skip the final payload. This `AbortController` is not the request lifecycle signal; it is a handler-owned signal for ending the data stream.

### Public API

```ts
import { EventEmitterAsyncResource, on } from 'events';
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

export const defineListener = <T>(options: {
  changes: ChangeParams;
  handler: (context: HandlerContext) => Promise<T> | T;
}): Listener<T> => {
  // implementation
};
```

`close()` is for internal composition by `defineParameterizedListener`. Endpoint code should normally use only `get()` and `subscribe()`.

### Implementation Details

The listener needs these internal pieces:

```ts
const VALUE = 'value';
const END = Symbol('end');

type ListenerEvent<T> = T | typeof END;

const ee = new EventEmitterAsyncResource({ name: `Listener:${options.changes.table}` });
ee.setMaxListeners(1_000);

const changes = new AbortController();

let ended = false;
let inFlight: Promise<LoadResult<T>> | undefined;
let dirty = false;

interface LoadResult<T> {
  value: T;
  shouldEnd: boolean;
}
```

`get()` should fetch a fresh snapshot, but coalesce concurrent callers:

```ts
const load = async (): Promise<LoadResult<T>> => {
  const end = new AbortController();

  const value = await options.handler({ end });

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

const get = async () => {
  const { value } = await loadSnapshot();
  return value;
};
```

Change-triggered broadcasting should have a small core function plus a deduping wrapper. The core function loads one snapshot and broadcasts it once. The wrapper is used when a database change arrives: it dedupes concurrent calls and, if another change arrived while the handler was in flight, runs one follow-up broadcast so subscribers converge to the latest snapshot.

```ts
const broadcastSnapshot = async (): Promise<LoadResult<T>> => {
  const result = await load();
  ee.emit(VALUE, result.value);

  if (result.shouldEnd) {
    endSubscriptions();
  }

  return result;
};

const broadcastLatestSnapshot = async (): Promise<void> => {
  if (inFlight) {
    dirty = true;
    await inFlight;
    return;
  }

  inFlight = broadcastSnapshot().finally(() => {
    inFlight = undefined;
  });

  await inFlight;

  if (dirty && !ended) {
    dirty = false;
    await broadcastLatestSnapshot();
  }
};
```

The DB-change loop starts once for the lifetime of the listener. This keeps singleton listeners simple: if a listener is defined at module scope, it is one of a small, explicit set of long-lived listeners. Parameterized listeners are still deleted from their cache when their subscription finishes, so they do not accumulate for every ID ever seen.

```ts
void (async () => {
  try {
    for await (const _ of subscribeToChanges(options.changes, { signal: changes.signal })) {
      if (ended) {
        break;
      }

      await broadcastLatestSnapshot();
    }
  } catch (error) {
    if (!changes.signal.aborted) {
      throw error;
    }
  }
})();
```

`subscribeToChanges` currently does not accept an abort signal. Add signal support so `close()` and `endSubscriptions()` can stop the DB-change loop immediately:

```ts
export const subscribeToChanges = async function* (
  params: SubscribeParams & KeyParams,
  options?: { signal?: AbortSignal }
) {
  const key = getReceiveKey(params);

  for await (const [change] of on(ee, key, { signal: options?.signal })) {
    if (params.events.includes((change as Change).event)) {
      yield change as Change;
    }
  }
};
```

Then the listener can pass `changes.signal`.

`subscribe()` should yield an initial snapshot, then fan out subsequent values:

```ts
const subscribe = async function* ({ signal }: SubscribeOptions = {}) {
  // Create the event iterator before loading the snapshot so any broadcast that
  // happens during the initial load is queued for this subscriber.
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
```

`endSubscriptions()` should terminate active subscribers and the DB loop after the final value has been broadcast. It should not prevent future snapshot reads; `get()` can still call the handler, and a parameterized cache can delete and recreate ended listeners after they are no longer needed.

```ts
const endSubscriptions = () => {
  if (ended) return;
  ended = true;
  changes.abort();
  ee.emit(VALUE, END);
};
```

The `close()` method used by parameterized cache cleanup can be a stronger teardown that also ends subscribers:

```ts
const close = () => {
  endSubscriptions();
};
```

## Phase 3: Add `defineParameterizedListener`

File: `census/api/src/db/defineListener.ts`

Keep parameterization out of `defineListener`. Compose it with a cache utility.

Desired usage:

```ts
const captures = defineParameterizedListener({
  key: (id: number) => id.toString(),
  create: (id: number) =>
    defineListener({
      changes: { table: 'captures', id, events: ['update'] },
      handler: async ({ end }) => {
        const capture = await getCapture(id);

        if (capture.status === 'complete') {
          end.abort();
        }

        return capture;
      }
    })
});
```

Public API:

```ts
export const defineParameterizedListener = <TInput, TValue>(options: {
  key: (input: TInput) => string;
  create: (input: TInput) => Listener<TValue>;
}) => {
  // implementation
};
```

Require an explicit `key` function. Do not default to `JSON.stringify`; listener identity is too important to make implicit.

Keep cleanup simple: delete the cached listener as soon as the last subscriber leaves. If reconnect churn becomes a measured problem later, add a grace-period cache then. The first implementation should avoid timers and TTL state.

Implementation sketch:

```ts
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
```

### Impact Of Not Cleaning Up

If parameterized listeners are never removed from the map, every unique capture ID ever viewed remains in memory until process restart. Because `defineListener` now starts its DB-change loop for the lifetime of the listener, a leaked parameterized listener also keeps an active keyed in-process listener.

Delete idle parameterized listeners immediately. Recreating a listener for a later request is cheap, and this avoids a second cleanup system. Add an idle TTL only if reconnect churn shows up in metrics.

## Phase 4: Apply Listeners To Current SSE Endpoints

### Recent Achievements

File: `census/api/src/api/users.ts`

Add module-level listener:

```ts
const recentAchievements = defineListener({
  changes: { table: 'achievements', events: ['insert', 'update'] },
  handler: () => getRecentRedeemedAchievements(7)
});
```

Use it for both snapshot query and subscription:

```ts
recentAchievements: publicProcedure.query(async () => {
  return await recentAchievements.get();
}),
live: {
  recentAchievements: publicProcedure.subscription(async function* ({ signal }) {
    yield* recentAchievements.subscribe({ signal });
  })
}
```

This gives one DB query per achievement change burst per API process, then fan-out to all local subscribers.

### Capture

File: `census/api/src/api/capture.ts`

Add module-level parameterized listener:

```ts
const captures = defineParameterizedListener({
  key: (id: number) => id.toString(),
  create: (id: number) =>
    defineListener({
      changes: { table: 'captures', id, events: ['update'] },
      handler: async ({ end }) => {
        const capture = await getCapture(id);

        if (capture.status === 'complete') {
          end.abort();
        }

        return capture;
      }
    })
});
```

Use it for query and subscription:

```ts
capture: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
  return await captures.get(input.id);
}),
live: {
  capture: publicProcedure.input(z.object({ id: z.number() })).subscription(async function* ({ input, signal }) {
    yield* captures.subscribe(input.id, { signal });
  })
}
```

This keeps parameterization readable while allowing `defineListener` to stay concrete.

## Phase 5: Move SSE Auth Out of URL via eventsource Ponyfill

File: `census/website/src/services/query/APIProvider.tsx`
Files: `census/website/src/services/query/eventSource.ts`

The subscription link previously sent bearer auth in `connectionParams`, which tRPC serialises into the EventSource URL as query params. Native `EventSource` reconnects reuse the original URL, so a reconnect could keep using a stale bearer token.

Instead of simply removing `connectionParams` (which would leave no renewal strategy for future authenticated subscriptions), the SSE branch now uses an `eventsource` ponyfill that injects a fresh token via a custom `fetch` on every (re)connect:

```ts
true: httpSubscriptionLink({
  url,
  transformer: SuperJSON,
  EventSource: createAuthenticatedEventSource(requestToken)
})
```

The `eventsource` npm package (v4) is fetch-based and calls the custom `fetch` on every connection attempt — including its own automatic reconnects. Auth moves from the URL into an `authorization` request header, so tokens no longer appear in `EventSource.url`, browser history, or server logs. `Last-Event-ID` is preserved across reconnects by the package internally, so tRPC's tracked-event resumption keeps working.

Keep auth for queries and mutations:

```ts
false: httpBatchLink({
  url,
  transformer: SuperJSON,
  headers: async () => ({ authorization: `Bearer ${await requestToken()}` })
})
```

The server's `createContext` already reads `headers.authorization ?? info.connectionParams?.authorization`, so no server-side change is needed — the header is picked up automatically.

This covers both network-error retries (the ponyfill's own reconnects) and tRPC's inactivity-triggered stream recreation. If a future subscription must be authenticated, it can share this SSE branch without additional work.

## Phase 6: Configure SSE Keepalive Pings

File: `census/api/src/trpc/trpc.ts`

Current tRPC setup:

```ts
const t = initTRPC.context<typeof createContext>().create({ transformer: SuperJSON });
```

Target setup:

```ts
const t = initTRPC.context<typeof createContext>().create({
  transformer: SuperJSON,
  sse: {
    ping: {
      enabled: true,
      intervalMs: 15_000
    },
    client: {
      reconnectAfterInactivityMs: 45_000
    }
  }
});
```

This sends a ping every 15 seconds when the stream is otherwise idle. The tRPC client will recreate the EventSource if it sees no activity for 45 seconds.

The ping interval must stay lower than `reconnectAfterInactivityMs`, otherwise tRPC throws at runtime.

## Expected Load After Implementation

### Idle Subscribers

Each subscriber still uses one open HTTP response. That is inherent to SSE.

The in-process cost becomes one listener per interested channel instead of every subscriber waking for every DB change.

### Recent Achievements Update

Before:

```txt
1 achievement update -> N subscribers wake -> N identical DB queries -> N SSE writes
```

After:

```txt
1 achievement update -> 1 listener wakes -> 1 coalesced DB query -> N SSE writes
```

### Capture Update

Before:

```txt
1 capture update -> all SSE subscribers wake -> matching subscribers run duplicate getCapture(id)
```

After:

```txt
1 capture update -> listener for captures:<id> wakes -> 1 coalesced getCapture(id) -> matching subscribers receive result
```

## Validation

Run type checks and build:

```sh
pnpm --filter @alveusgg/census-api exec tsc --noEmit --project tsconfig.json
pnpm --filter @alveusgg/census-website build
```

Manual verification:

1. Open multiple tabs on the home page.
2. Trigger one achievement insert or update.
3. Confirm the API performs one recent-achievements query per API process, not one per tab.
4. Open multiple tabs watching the same in-progress capture.
5. Trigger one capture update.
6. Confirm the API performs one `getCapture(id)` query per API process for that update.
7. Confirm the final `complete` capture value reaches the client before the subscription closes.
8. Confirm SSE EventSource URLs no longer include bearer tokens (auth is now sent via `authorization` header, not `connectionParams` query params).
9. Leave a page idle beyond expected proxy idle timeout and confirm pings prevent unnecessary reconnect churn.

## Rollout Notes

This is process-local fan-out. With multiple API replicas, each replica will still do one snapshot query per relevant change burst for its own connected clients. That is acceptable for this step and much better than one query per connected browser.

If traffic grows beyond what process-local fan-out can support, the next step is a shared pub-sub layer or moving the expensive snapshot calculation closer to the database/cache layer.
