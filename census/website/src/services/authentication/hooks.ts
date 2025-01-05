import { useContext } from 'react';
import { useLocation } from 'react-router';
import { useStore } from 'zustand';
import { AuthenticationContext, AuthenticationStore } from './AuthenticationProvider';

export function useAuthentication<U>(selector: (store: AuthenticationStore) => U): U {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthentication must be used within a AuthenticationProvider');
  }
  return useStore(context, selector);
}

export const useUser = () => {
  const account = useAuthentication(state => state.account);
  if (!account) throw new Error('User not authenticated');
  return account;
};

export const useRequestToken = () => {
  const getRequestToken = useAuthentication(state => state.getRequestToken);
  return async () => await withCache('requestToken', getRequestToken);
};

const InProgressCache = new Map<string, Promise<unknown>>();

const withCache = async <T>(key: string, func: () => Promise<T>): Promise<T> => {
  if (InProgressCache.has(key)) {
    const promise = InProgressCache.get(key);
    if (!promise) throw new Error('Promise is undefined');
    return promise as Promise<T>;
  }
  const action = func();
  InProgressCache.set(key, action);
  action.finally(() => {
    InProgressCache.delete(key);
  });
  return await action;
};

export const useSignInUp = () => {
  const [signIn, signInSilent] = useAuthentication(state => [state.signInUp, state.signInSilent]);
  const location = useLocation();

  return async (from?: string) => {
    try {
      if (location.pathname === '/auth/signin') throw new Error();
      return await withCache('signInSilent', signInSilent);
    } catch {
      return await withCache(`signin-${from}`, async () => signIn(from));
    }
  };
};

export const useSignOut = () => {
  const signOut = useAuthentication(state => state.signOut);
  return async () => await withCache('signout', signOut);
};
