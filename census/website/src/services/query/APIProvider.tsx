import { useVariable } from '@alveusgg/backstage';
import type { AppRouter } from '@alveusgg/census-api';
import * as Sentry from '@sentry/react';
import { useQueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, httpSubscriptionLink, retryLink, splitLink, TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { createContext, FC, PropsWithChildren, useRef } from 'react';
import SuperJSON from 'superjson';
import { useInvalidateRequestToken, useRequestToken } from '../authentication/hooks';
import { Variables } from '../backstage/config';
import { key } from './hooks';
interface PointsLinkOptions {
  invalidate: {
    achievements: () => void;
    points: () => void;
  };
}

export function pointsLink({ invalidate }: PointsLinkOptions): TRPCLink<AppRouter> {
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
              if (points) invalidate.points();
              const achievements = headers.get('x-census-achievements');
              if (achievements) invalidate.achievements();
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
  const invalidateRequestToken = useInvalidateRequestToken();
  if (!url) throw new Error('Missing apiBaseUrl');

  const queryClient = useQueryClient();

  const client = useRef(
    createTRPCClient<AppRouter>({
      links: [
        // On UNAUTHORIZED, drop the cached access token and retry once. The
        // next pass through the link chain will see the missing token and
        // refresh via the refresh token before re-sending the request.
        //
        // This papers over a disagreement between the client's pre-flight
        // `isTokenExpired` check and the server's `jwtVerify`. Report each
        // hit to Sentry so we can keep an eye on how often it's happening
        // and whether the underlying cause (clock skew, suspended tabs,
        // key rotation, etc.) warrants a more targeted fix.
        retryLink<AppRouter>({
          retry: ({ error, op, attempts }) => {
            if (attempts > 1) return false;
            if (error.data?.code !== 'UNAUTHORIZED') return false;
            Sentry.captureMessage('tRPC UNAUTHORIZED retry: invalidating access token', {
              level: 'warning',
              tags: { subsystem: 'auth', action: 'trpc-unauthorized-retry' },
              contexts: {
                trpc: {
                  path: op.path,
                  type: op.type,
                  attempts
                }
              }
            });
            invalidateRequestToken();
            return true;
          }
        }),
        pointsLink({
          invalidate: {
            achievements: () => {
              queryClient.invalidateQueries({ queryKey: key('achievements', 'pending') });
            },
            points: () => {
              queryClient.invalidateQueries({ queryKey: key('points') });
            }
          }
        }),
        splitLink({
          // uses the httpSubscriptionLink for subscriptions
          condition: op => op.type === 'subscription',
          true: httpSubscriptionLink({
            url,
            transformer: SuperJSON,
            connectionParams: async () => ({ authorization: `Bearer ${await requestToken()}` })
          }),
          false: httpBatchLink({
            url,
            transformer: SuperJSON,
            headers: async () => ({ authorization: `Bearer ${await requestToken()}` })
          })
        })
      ]
    })
  );
  return <APIContext.Provider value={client.current}>{children}</APIContext.Provider>;
};
