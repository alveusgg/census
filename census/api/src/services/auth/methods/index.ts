import { type Role } from '../../../db/schema/users.js';

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
  createEndSessionRequest: (redirectUri: string, state: string) => Promise<string>;
  completeEndSessionRequest: (state: string) => Promise<string>;
  exchangeCodeForToken: (redirectUri: string, code: string, state: string) => Promise<TokensWithState>;
  refreshToken: (refreshToken: string) => Promise<Tokens>;
  acquireClientTokenForRoles: (roles: Role[]) => Promise<string>;
  getUserInformation: (token: string) => Promise<Identity>;
}

/**
 * Wraps an AuthenticationMethodsProvider with OpenTelemetry tracing and error
 * recording on every method. Each call starts a span named
 * `auth.<providerName>.<methodName>`, attaches relevant attributes, marks the
 * span OK or ERROR, and re-throws so callers still see the original error.
 */
export const withLogging = (
  provider: AuthenticationMethodsProvider,
  providerName: string
): AuthenticationMethodsProvider => {
  const wrap =
    <TArgs extends unknown[], TReturn>(methodName: string, fn: (...args: TArgs) => Promise<TReturn>) =>
    async (...args: TArgs): Promise<TReturn> => {
      console.log(`[auth.${providerName}.${methodName}] called`);
      try {
        const result = await fn(...args);
        console.log(`[auth.${providerName}.${methodName}] succeeded`);
        return result;
      } catch (error) {
        console.error(`[auth.${providerName}.${methodName}] failed`, error);
        throw error;
      }
    };

  return {
    createSignInRequest: wrap('createSignInRequest', provider.createSignInRequest.bind(provider)),
    exchangeCodeForToken: wrap('exchangeCodeForToken', provider.exchangeCodeForToken.bind(provider)),
    completeEndSessionRequest: wrap('completeEndSessionRequest', provider.completeEndSessionRequest.bind(provider)),
    refreshToken: wrap('refreshToken', provider.refreshToken.bind(provider)),
    createEndSessionRequest: wrap('createEndSessionRequest', provider.createEndSessionRequest.bind(provider)),
    acquireClientTokenForRoles: wrap('aquireClientTokenForRoles', provider.acquireClientTokenForRoles.bind(provider)),
    getUserInformation: wrap('getUserInformation', provider.getUserInformation.bind(provider))
  };
};

export { AlveusAuthenticationMethodsProvider } from './alveus.js';
