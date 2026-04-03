interface Identity {
  id: string;
  name: string;
  username: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface TokensWithState extends Tokens {
  state: string;
}

export interface AuthenticationMethodsProvider {
  createSignInRequest: (redirectUri: string, state: string) => Promise<string>;
  exchangeCodeForToken: (redirectUri: string, code: string, state: string) => Promise<TokensWithState>;
  refreshToken: (refreshToken: string) => Promise<Tokens>;
  getUserInformation: (token: string) => Promise<Identity>;
}

export { AlveusAuthenticationMethodsProvider } from './alveus.js';
