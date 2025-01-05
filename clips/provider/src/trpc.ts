import type { AppRouter } from '@alveusgg/census-api';
import { createTRPCClient, httpLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import EventSource from 'eventsource';

// @ts-ignore
globalThis.EventSource = EventSource;

export const createClient = (url: string) => {
  const client = createTRPCClient<AppRouter>({
    links: [
      splitLink({
        // uses the httpSubscriptionLink for subscriptions
        condition: op => op.type === 'subscription',
        true: unstable_httpSubscriptionLink({
          url
        }),
        false: httpLink({
          url
        })
      })
    ]
  });

  return client;
};
