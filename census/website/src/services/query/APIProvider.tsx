import { useVariable } from '@alveusgg/backstage';
import type { AppRouter } from '@alveusgg/census-api';
import { useQueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, splitLink, TRPCLink, unstable_httpSubscriptionLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { createContext, FC, PropsWithChildren, useRef } from 'react';
import { useRequestToken } from '../authentication/hooks';
import { Variables } from '../backstage/config';
import { key } from './hooks';

interface PointsLinkOptions {
  update: (points: number) => void;
  invalidate: () => void;
}

export function pointsLink({ update, invalidate }: PointsLinkOptions): TRPCLink<AppRouter> {
  return () =>
    ({ next, op }) => {
      return observable(observer => {
        const unsubscribe = next(op).subscribe({
          next: value => {
            try {
              if (!value.context) return;
              const response = value.context.response as Response | undefined;
              if (!response) {
                return;
              }
              const headers = response.headers;
              const points = headers.get('x-census-points');
              if (points) update(parseInt(points));
              const achievements = headers.get('x-census-achievements');
              if (achievements) invalidate();
            } finally {
              observer.next(value);
            }
          },
          error: err => observer.error(err),
          complete: () => observer.complete()
        });
        return unsubscribe;
      });
    };
}

export const APIContext = createContext<ReturnType<typeof createTRPCClient<AppRouter>> | null>(null);
export const APIProvider: FC<PropsWithChildren> = ({ children }) => {
  const url = useVariable<Variables>('apiBaseUrl');
  const requestToken = useRequestToken();
  if (!url) throw new Error('Missing apiBaseUrl');

  const queryClient = useQueryClient();

  const client = useRef(
    createTRPCClient<AppRouter>({
      links: [
        pointsLink({
          update: points => {
            queryClient.setQueryData(key('points'), points);
          },
          invalidate: () => {
            queryClient.invalidateQueries({ queryKey: key('achievements', 'pending') });
          }
        }),
        splitLink({
          // uses the httpSubscriptionLink for subscriptions
          condition: op => op.type === 'subscription',
          true: unstable_httpSubscriptionLink({
            url,
            connectionParams: async () => ({ authorization: `Bearer ${await requestToken()}` })
          }),
          false: httpBatchLink({
            url,
            headers: async () => ({ authorization: `Bearer ${await requestToken()}` })
          })
        })
      ]
    })
  );
  return <APIContext.Provider value={client.current}>{children}</APIContext.Provider>;
};
