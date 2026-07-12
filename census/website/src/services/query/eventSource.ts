import { EventSource as EventSourcePonyfill, type EventSourceFetchInit, type EventSourceInit } from 'eventsource';

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const SSE_PROTOCOL_VERSION = '1';
// A connection that dies before this counts as a failure, so servers that
// accept and immediately drop connections still trigger backoff.
const STABLE_CONNECTION_MS = 5_000;

const abortError = (signal: AbortSignal) =>
  signal.reason instanceof Error ? signal.reason : new DOMException('The operation was aborted', 'AbortError');

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError(signal));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal ? abortError(signal) : new DOMException('The operation was aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

const backoffDelay = (attempt: number) => {
  const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
  // Full jitter to spread reconnects from multiple subscriptions/tabs.
  return Math.random() * delay;
};

export function createAuthenticatedEventSource(requestToken: () => Promise<string>) {
  return class AuthenticatedEventSource extends EventSourcePonyfill {
    private failedAttempts = 0;
    private connectedAt = 0;
    constructor(url: string | URL, init?: EventSourceInit) {
      // Consecutive failed (or short-lived) connection attempts by this
      // EventSource instance. The ponyfill reconnects on a fixed interval,
      // so we add exponential backoff here to avoid reconnect storms.

      super(url, {
        ...init,
        fetch: async (input: string | URL, fetchInit: EventSourceFetchInit) => {
          if (this.connectedAt) {
            if (Date.now() - this.connectedAt >= STABLE_CONNECTION_MS) {
              this.failedAttempts = 0;
            } else {
              this.failedAttempts += 1;
            }
            this.connectedAt = 0;
          }

          if (this.failedAttempts > 0) {
            await sleep(backoffDelay(this.failedAttempts), fetchInit.signal ?? undefined);
          }

          try {
            const response = await fetch(input, {
              ...fetchInit,
              headers: {
                ...fetchInit.headers,
                authorization: `Bearer ${await requestToken()}`,
                'x-census-sse-protocol': SSE_PROTOCOL_VERSION
              }
            });
            if (response.ok) {
              this.connectedAt = Date.now();
            } else {
              this.failedAttempts += 1;
            }
            return response;
          } catch (error) {
            this.failedAttempts += 1;
            throw error;
          }
        }
      });
    }
  };
}
