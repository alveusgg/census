import { EventSource as EventSourcePonyfill, type EventSourceFetchInit, type EventSourceInit } from 'eventsource';

export function createAuthenticatedEventSource(requestToken: () => Promise<string>) {
  return class AuthenticatedEventSource extends EventSourcePonyfill {
    constructor(url: string | URL, init?: EventSourceInit) {
      super(url, {
        ...init,
        fetch: async (input: string | URL, fetchInit: EventSourceFetchInit) =>
          fetch(input, {
            ...fetchInit,
            headers: {
              ...fetchInit.headers,
              authorization: `Bearer ${await requestToken()}`
            }
          })
      });
    }
  };
}
