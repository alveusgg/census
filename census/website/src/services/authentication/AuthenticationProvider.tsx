import { createContext } from 'react';
import { z } from 'zod';
import { StoreApi } from 'zustand';
import { AuthenticationStatus } from './utils';

export const Account = z.object({
  id: z.string(),
  roles: z.array(z.enum(['census_admin', 'census_moderator']).or(z.string()))
});

export type Account = z.infer<typeof Account>;

export interface AuthenticationInformation {
  status: AuthenticationStatus;
  account?: Account | null;
}

export interface AuthenticationActions {
  onRedirect: () => Promise<string | void>;
  signInSilent: () => Promise<void>;
  /**
   * Returns `Promise<never>`: resolves/rejects only once the full-page
   * navigation to the sign-in flow has committed, at which point the
   * current JS realm is being torn down. Callers don't need to throw after
   * `await`ing this — control never returns to them.
   */
  signInUp: (from?: string) => Promise<never>;
  signOut: () => Promise<void>;
  getRequestToken: () => Promise<string>;
  /**
   * Discard the currently-stored access token so the next `getRequestToken`
   * call is forced to refresh. Used when the server has rejected the token
   * as UNAUTHORIZED (clock skew, suspended tab, key rotation, etc.).
   */
  invalidateRequestToken: () => void;
}

export interface AuthenticationStore extends AuthenticationInformation, AuthenticationActions {}
export const AuthenticationContext = createContext<StoreApi<AuthenticationStore> | null>(null);
