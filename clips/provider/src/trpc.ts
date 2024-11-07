import type { AppRouter } from '@alveusgg/clips-manager/src';
import { createTRPCClient, httpLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';

export const initialise = (apiUrl: string) => {
  const client = createTRPCClient<AppRouter>({
    links: [
      splitLink({
        // uses the httpSubscriptionLink for subscriptions
        condition: op => op.type === 'subscription',
        true: unstable_httpSubscriptionLink({
          url: apiUrl
        }),
        false: httpLink({
          url: apiUrl
        })
      })
    ]
  });

  return client;
};
