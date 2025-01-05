import { DownstreamError } from '@alveusgg/error';
import { exchangeCode } from '@twurple/auth';
import z from 'zod';
import { assert } from '../../utils/assert.js';
import { useEnvironment } from '../../utils/env/env.js';

const scopes: string[] = [];
export const createSignInRequest = (path: string, state: string) => {
  const env = useEnvironment();

  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', env.variables.TWITCH_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${env.host}${path}`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
};

export const exchangeCodeForToken = async (path: string, code: string) => {
  const env = useEnvironment();

  const token = await exchangeCode(
    env.variables.TWITCH_CLIENT_ID,
    env.variables.TWITCH_CLIENT_SECRET,
    code,
    `${env.host}${path}`
  );

  return token;
};

const TwitchValidationResponse = z.object({
  user_id: z.string()
});

export const validateToken = async (token: string) => {
  const response = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return false;
  const data = await response.json();
  const result = TwitchValidationResponse.safeParse(data);
  if (!result.success) return false;
  return true;
};

const TwitchUsersResponse = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_name: z.string(),
      login: z.string()
    })
  )
});

export const getUserInformation = async (token: string) => {
  const env = useEnvironment();
  const response = await fetch(`https://api.twitch.tv/helix/users`, {
    headers: { Authorization: `Bearer ${token}`, 'client-id': env.variables.TWITCH_CLIENT_ID }
  });

  if (!response.ok) throw new DownstreamError('twitch', 'Failed to fetch user data');
  const data = await response.json();
  assert.shape(TwitchUsersResponse, data, 'Invalid response');
  const user = data.data[0];
  if (!user) throw new DownstreamError('twitch', 'No user found');
  return user;
};
