import { exchangeCode } from '@twurple/auth';
import z from 'zod';
import { useEnvironment } from '../../utils/env/env.js';

const scopes: string[] = [];
export const createSignInRequest = (path: string, state: string) => {
  const env = useEnvironment();
  let origin = `http://${env.variables.HOST}:${env.variables.PORT}`;
  if (env.variables.API_URL) {
    origin = env.variables.API_URL;
  }

  const url = new URL('https://id.twitch.tv/oauth2/authorize');
  url.searchParams.set('client_id', env.variables.TWITCH_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${origin}${path}`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
};

export const getHost = () => {
  const { variables } = useEnvironment();
  if (variables.NODE_ENV === 'development') {
    return `http://${variables.HOST}:${variables.PORT}`;
  }
  if (variables.API_URL) {
    return variables.API_URL;
  }
  if (variables.CONTAINER_APP_NAME && variables.CONTAINER_APP_ENV_DNS_SUFFIX) {
    return `https://${variables.CONTAINER_APP_NAME}.${variables.CONTAINER_APP_ENV_DNS_SUFFIX}`;
  }

  throw new Error('No host found');
};

export const exchangeCodeForToken = async (path: string, code: string) => {
  const env = useEnvironment();
  const origin = getHost();

  const token = await exchangeCode(
    env.variables.TWITCH_CLIENT_ID,
    env.variables.TWITCH_CLIENT_SECRET,
    code,
    `${origin}${path}`
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

  if (!response.ok) throw new Error('Failed to fetch user data');
  const data = await response.json();
  const result = TwitchUsersResponse.safeParse(data);
  if (!result.success) throw new Error('Invalid response');
  const user = result.data.data[0];
  if (!user) throw new Error('No user found');
  return user;
};
