import { useVariable } from '@alveusgg/backstage';
import { parseJWT } from 'oslo/jwt';
import { FC, PropsWithChildren, useMemo } from 'react';
import { createStore } from 'zustand';
import { Variables } from '../backstage/config';
import { AuthenticationContext, AuthenticationInformation, AuthenticationStore } from './AuthenticationProvider';
import { AuthenticationStatus } from './utils';

const TOKEN_KEY = 'cc:token';
const getAccountFromJWT = (jwt: string) => {
  const claims = parseJWT(jwt);
  if (!claims) throw new Error('No claims found');
  if (!claims.subject) throw new Error('No subject found');
  return { id: claims.subject };
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
  } catch {
    return {
      status: AuthenticationStatus.NotAuthenticated
    };
  }
};

export const CritterAuthenticationProvider: FC<PropsWithChildren> = ({ children }) => {
  const apiBaseUrl = useVariable<Variables>('apiBaseUrl');

  const store = useMemo(() => {
    const restoredAuthentication = restoreAuthentication();

    return createStore<AuthenticationStore>((set, get) => ({
      ...restoredAuthentication,
      getRequestToken: async () => {
        const { signInUp } = get();
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          if (!token) throw new Error('No token found');
          return token;
        } catch (e) {
          await signInUp();
          throw e;
        }
      },
      onRedirect: async () => {
        try {
          const params = new URLSearchParams(window.location.search);
          const token = params.get('token');
          if (!token) throw new Error('No token found');
          const account = getAccountFromJWT(token);
          localStorage.setItem(TOKEN_KEY, token);
          set({
            status: AuthenticationStatus.Authenticated,
            account
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
        window.location.href = `${apiBaseUrl}/auth/signin?${params.toString()}`;
      },
      signOut: async () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ status: AuthenticationStatus.NotAuthenticated, account: null });
        window.location.href = '/';
      }
    }));
  }, [apiBaseUrl]);

  return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};
