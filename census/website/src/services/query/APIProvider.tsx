import { useVariable } from '@alveusgg/backstage';
import type { AppRouter } from '@alveusgg/census-api';
import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from '@trpc/client';
import { createContext, FC, PropsWithChildren, useRef } from 'react';
import { useRequestToken } from '../authentication/hooks';
import { Variables } from '../backstage/config';

export const APIContext = createContext<ReturnType<typeof createTRPCClient<AppRouter>> | null>(null);
export const APIProvider: FC<PropsWithChildren> = ({ children }) => {
  const url = useVariable<Variables>('apiBaseUrl');
  const requestToken = useRequestToken();
  if (!url) throw new Error('Missing apiBaseUrl');
  const client = useRef(
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          // uses the httpSubscriptionLink for subscriptions
          condition: op => op.type === 'subscription',
          true: unstable_httpSubscriptionLink({
            url,
            connectionParams: async () => ({ Authorization: `Bearer ${await requestToken()}` })
          }),
          false: httpBatchLink({
            url,
            headers: async () => ({ Authorization: `Bearer ${await requestToken()}` })
          })
        })
      ]
    })
  );
  return <APIContext.Provider value={client.current}>{children}</APIContext.Provider>;
};
