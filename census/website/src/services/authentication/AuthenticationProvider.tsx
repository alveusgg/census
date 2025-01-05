import { createContext } from 'react';
import { z } from 'zod';
import { StoreApi } from 'zustand';
import { AuthenticationStatus } from './utils';

export const Account = z.object({
  id: z.coerce.number(),
  twitchUserId: z.string(),
  twitchUsername: z.string()
});

export type Account = z.infer<typeof Account>;

export interface AuthenticationInformation {
  status: AuthenticationStatus;
  account?: Account | null;
}

export interface AuthenticationActions {
  onRedirect: () => Promise<string | void>;
  signInSilent: () => Promise<void>;
  signInUp: (from?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getRequestToken: () => Promise<string>;
}

export interface AuthenticationStore extends AuthenticationInformation, AuthenticationActions {}
export const AuthenticationContext = createContext<StoreApi<AuthenticationStore> | null>(null);
