import { useVariable } from '@alveusgg/backstage';
import { useMutation } from '@tanstack/react-query';
import { isAfter, subSeconds } from 'date-fns';
import { parseJWT } from 'oslo/jwt';
import { FC, PropsWithChildren, useMemo } from 'react';
import { z } from 'zod';
import { createStore } from 'zustand';
import { Variables } from '../backstage/config';
import {
  Account,
  AuthenticationContext,
  AuthenticationInformation,
  AuthenticationStore
} from './AuthenticationProvider';
import { AuthenticationStatus } from './utils';

const TOKEN_KEY = 'agg:token';
const REFRESH_TOKEN_KEY = 'agg:refresh_token';

const getAccountFromJWT = (jwt: string) => {
  const claims = parseJWT(jwt);
  if (!claims) throw new Error('No claims found');
  if (!claims.payload) throw new Error('No payload found');
  if (!('roles' in claims.payload)) throw new Error('No roles found');
  return Account.parse({ id: claims.subject, roles: claims.payload.roles });
};

const isTokenExpired = (jwt: string) => {
  const claims = parseJWT(jwt);
  if (!claims || !claims.expiresAt) throw new Error('No claims found');
  return isAfter(new Date(), subSeconds(claims.expiresAt, 30));
};

const Tokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});

const usePerformTokenRefresh = () => {
  const url = useVariable<Variables>('apiBaseUrl');
  if (!url) throw new Error('Missing apiBaseUrl');
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await fetch(`${url}/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to refresh token');
      const data = await response.json();
      return Tokens.parse(data);
    }
  });
};

const restoreAuthentication = (): AuthenticationInformation => {
  try {
    const jwt = localStorage.getItem(TOKEN_KEY);
    if (!jwt) throw new Error('No jwt found');
    const account = getAccountFromJWT(jwt);
    return {
      account,
      status: AuthenticationStatus.Authenticated
    };
  } catch (error) {
    return {
      status: AuthenticationStatus.NotAuthenticated
    };
  }
};

export const CritterAuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
  const apiBaseUrl = useVariable<Variables>('apiBaseUrl');
  const performTokenRefresh = usePerformTokenRefresh();
  const store = useMemo(() => {
    const restoredAuthentication = restoreAuthentication();

    return createStore<AuthenticationStore>((set, get) => ({
      ...restoredAuthentication,
      getRequestToken: async () => {
        const { signInUp } = get();
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          if (!token) throw new Error('No token found');

          if (isTokenExpired(token)) {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) throw new Error('No refresh token found');
            if (isTokenExpired(refreshToken)) {
              throw new Error('Token and refresh token are expired');
            }
            const tokens = await performTokenRefresh.mutateAsync(refreshToken);
            localStorage.setItem(TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
            return tokens.accessToken;
          }

          return token;
        } catch (e) {
          await signInUp();
          throw e;
        }
      },
      onRedirect: async () => {
        try {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (!accessToken || !refreshToken) throw new Error('No access token or refresh token found');
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          set({
            status: AuthenticationStatus.Authenticated,
            account: getAccountFromJWT(accessToken)
          });

          const from = params.get('from');
          if (from) return from;
        } catch (e) {
          console.error(e);
          set({
            status: AuthenticationStatus.NotAuthenticated
          });
        }
      },
      signInSilent: async () => {
        throw new Error('Not implemented');
      },
      signInUp: async (from?: string) => {
        set({ status: AuthenticationStatus.Authenticating });
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        params.set('origin', window.location.origin);
        window.location.href = `${apiBaseUrl}/auth/signin?${params.toString()}`;
      },
      signOut: async () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ status: AuthenticationStatus.NotAuthenticated, account: null });
        window.location.href = `${apiBaseUrl}/auth/signout?origin=${window.location.origin}`;
      }
    }));
  }, [apiBaseUrl]);

  return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};
