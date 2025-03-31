import type { AppRouter } from '@alveusgg/census-api';
import { createTRPCClient, httpLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import EventSource from 'eventsource';
import { SuperJSON } from 'superjson';

// @ts-ignore
globalThis.EventSource = EventSource;

export const createClient = (url: string) => {
  const client = createTRPCClient<AppRouter>({
    links: [
      splitLink({
        // uses the httpSubscriptionLink for subscriptions
        condition: op => op.type === 'subscription',
        true: unstable_httpSubscriptionLink({
          url,
          transformer: SuperJSON
        }),
        false: httpLink({
          url,
          transformer: SuperJSON
        })
      })
    ]
  });

  return client;
};
