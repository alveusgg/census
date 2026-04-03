import { AuthenticationTimeoutError, BadRequestError, DownstreamError } from '@alveusgg/error';
import { addMinutes, isAfter } from 'date-fns';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { assert } from '../../../utils/assert.js';
import { useEnvironment } from '../../../utils/env/env.js';
import type { AuthenticationMethodsProvider } from './index.js';

const AlveusTokenResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string()
});

const AlveusUserInformationResponse = z.object({
  sub: z.string(),
  name: z.string(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
  picture: z.string().optional(),
  roles: z.array(z.string()),
  twitch_user_id: z.string()
});

const AlveusAuthenticationRequest = z.object({
  state: z.string(),
  codeVerifier: z.string(),
  codeChallenge: z.string(),
  codeChallengeMethod: z.literal('S256'),
  expires: z.coerce.date()
});

const exchangeToken = async (body: URLSearchParams) => {
  const { variables } = useEnvironment();
  const response = await fetch(new URL('/api/oauth/token', variables.ALVEUS_AUTH_ISSUER), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${variables.ALVEUS_AUTH_CLIENT_ID}:${variables.ALVEUS_AUTH_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new DownstreamError('alveus', `Token exchange failed with status ${response.status}`);
  }

  const data = await response.json();
  assert.shape(AlveusTokenResponse, data, 'Invalid Alveus token response');
  return data;
};

const createCodeVerifier = () => randomBytes(32).toString('base64url');
const createCodeChallenge = (codeVerifier: string) => createHash('sha256').update(codeVerifier).digest('base64url');
const getAlveusAuthenticationRequest = async (requestId: string) => {
  const { cache } = useEnvironment();
  const payload = await cache.get(requestId);

  if (!payload) {
    throw new BadRequestError('You are trying to complete a login that was never started.');
  }

  try {
    return AlveusAuthenticationRequest.parse(JSON.parse(payload));
  } catch {
    await cache.delete(requestId);
    throw new BadRequestError('You are trying to complete a login that was never started.');
  }
};

export const AlveusAuthenticationMethodsProvider: AuthenticationMethodsProvider = {
  createSignInRequest: async (redirectUri: string, state: string) => {
    const { variables, cache } = useEnvironment();
    const requestId = crypto.randomUUID();
    const codeVerifier = createCodeVerifier();
    const codeChallenge = createCodeChallenge(codeVerifier);
    const request = {
      state,
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256' as const,
      expires: addMinutes(new Date(), 10)
    };

    await cache.set(requestId, JSON.stringify(request), 60 * 60 * 24 * 7);

    const url = new URL('/oauth/authorize', variables.ALVEUS_AUTH_ISSUER);

    url.searchParams.set('client_id', variables.ALVEUS_AUTH_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', requestId);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', request.codeChallengeMethod);

    return url.toString();
  },
  exchangeCodeForToken: async (redirectUri: string, code: string, state: string) => {
    const { cache } = useEnvironment();
    const request = await getAlveusAuthenticationRequest(state);

    if (isAfter(new Date(), request.expires)) {
      await cache.delete(state);
      throw new AuthenticationTimeoutError('Login expired.');
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    body.set('code_verifier', request.codeVerifier);

    const token = await exchangeToken(body);
    await cache.delete(state);

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      state: request.state
    };
  },
  refreshToken: async (refreshToken: string) => {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);

    const token = await exchangeToken(body);
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token
    };
  },
  getUserInformation: async (token: string) => {
    const { variables } = useEnvironment();
    const response = await fetch(new URL('/api/oauth/userinfo', variables.ALVEUS_AUTH_ISSUER), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new DownstreamError('alveus', 'Failed to fetch user data');

    const data = await response.json();
    assert.shape(AlveusUserInformationResponse, data, 'Invalid Alveus user info response');

    return {
      id: data.sub,
      name: data.name,
      username: data.name
    };
  }
};
