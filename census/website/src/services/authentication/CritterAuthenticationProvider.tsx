import { useVariable } from '@alveusgg/backstage';
import { useMutation } from '@tanstack/react-query';
import { isAfter, subSeconds } from 'date-fns';
import { parseJWT } from 'oslo/jwt';
import { FC, PropsWithChildren, useMemo } from 'react';
import { z } from 'zod';
import { createStore } from 'zustand';
import { Variables } from '../backstage/config';
import { useAddAuthenticatedContext } from '../insights/hooks';
import {
  Account,
  AuthenticationContext,
  AuthenticationInformation,
  AuthenticationStore
} from './AuthenticationProvider';
import { AuthenticationStatus } from './utils';

const TOKEN_KEY = 'agg:token';
const REFRESH_TOKEN_KEY = 'agg:refresh_token';
const LOG_PREFIX = '[CritterAuthenticationProvider]';

const authLog = (...args: unknown[]) => {
  console.log(LOG_PREFIX, ...args);
};

const getAccountFromJWT = (jwt: string) => {
  authLog('Parsing account from JWT');
  const claims = parseJWT(jwt);
  if (!claims) throw new Error('No claims found');
  return Account.parse({ id: claims.subject });
};

const isTokenExpired = (jwt: string) => {
  authLog('Checking token expiration');
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
      authLog('Refreshing access token');
      const response = await fetch(`${url}/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to refresh token');
      const data = await response.json();
      authLog('Token refresh succeeded');
      return Tokens.parse(data);
    }
  });
};

const restoreAuthentication = (): AuthenticationInformation => {
  try {
    authLog('Restoring authentication from localStorage');
    const jwt = localStorage.getItem(TOKEN_KEY);
    if (!jwt) throw new Error('No jwt found');
    const account = getAccountFromJWT(jwt);
    authLog('Restored authenticated account', account.id);
    return {
      account,
      status: AuthenticationStatus.Authenticated
    };
  } catch (error) {
    authLog('Failed to restore authentication', error);
    return {
      status: AuthenticationStatus.NotAuthenticated
    };
  }
};

export const CritterAuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
  const apiBaseUrl = useVariable<Variables>('apiBaseUrl');
  const addAuthenticatedUserContext = useAddAuthenticatedContext();
  const performTokenRefresh = usePerformTokenRefresh();
  const store = useMemo(() => {
    authLog('Creating authentication store');
    const restoredAuthentication = restoreAuthentication();
    if (restoredAuthentication.account) {
      authLog('Adding authenticated user context', restoredAuthentication.account.id.toString());
      addAuthenticatedUserContext(restoredAuthentication.account.id.toString());
    }

    return createStore<AuthenticationStore>((set, get) => ({
      ...restoredAuthentication,
      getRequestToken: async () => {
        authLog('getRequestToken called');
        const { signInUp } = get();
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          if (!token) throw new Error('No token found');

          if (isTokenExpired(token)) {
            authLog('Access token expired, attempting refresh');
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) throw new Error('No refresh token found');
            if (isTokenExpired(refreshToken)) {
              authLog('Refresh token expired');
              throw new Error('Token and refresh token are expired');
            }
            const tokens = await performTokenRefresh.mutateAsync(refreshToken);
            localStorage.setItem(TOKEN_KEY, tokens.accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
            authLog('Stored refreshed tokens');
            return tokens.accessToken;
          }

          authLog('Using existing access token');
          return token;
        } catch (e) {
          authLog('getRequestToken failed, redirecting to sign-in', e);
          await signInUp();
          throw e;
        }
      },
      onRedirect: async () => {
        try {
          authLog('Handling auth redirect');
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (!accessToken || !refreshToken) throw new Error('No access token or refresh token found');
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          authLog('Stored redirect tokens');
          set({
            status: AuthenticationStatus.Authenticated
          });

          const from = params.get('from');
          authLog('Redirect completed', { from });
          if (from) return from;
        } catch (e) {
          authLog('Auth redirect failed', e);
          console.error(e);
          set({
            status: AuthenticationStatus.NotAuthenticated
          });
        }
      },
      signInSilent: async () => {
        authLog('signInSilent called');
        throw new Error('Not implemented');
      },
      signInUp: async (from?: string) => {
        authLog('signInUp called', { from });
        set({ status: AuthenticationStatus.Authenticating });
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        params.set('origin', window.location.origin);
        authLog('Redirecting to sign-in endpoint', `${apiBaseUrl}/auth/signin?${params.toString()}`);
        window.location.href = `${apiBaseUrl}/auth/signin?${params.toString()}`;
      },
      signOut: async () => {
        authLog('signOut called');
        localStorage.removeItem(TOKEN_KEY);
        set({ status: AuthenticationStatus.NotAuthenticated, account: null });
        authLog('Cleared auth tokens and redirecting home');
        window.location.href = '/';
      }
    }));
  }, [apiBaseUrl]);

  return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};
