import { createContext } from 'react';
import { StoreApi } from 'zustand';
import { AuthenticationStatus } from './utils';

export interface Account {
  id: string;
}

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
